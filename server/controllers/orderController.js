const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { getIsConnected } = require('../config/db');
const { memoryProducts } = require('./productController');
const { memoryCustomers } = require('./customerController');
const { memoryUsers } = require('./authController');

// Memory store for orders
let memoryOrders = [];

// Helper to generate Invoice ID
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomNum}`;
};

// GET /api/orders (Scoped to authenticated user)
const getOrders = async (req, res) => {
  try {
    const { paymentMethod, status } = req.query;
    const userId = req.userId;

    if (getIsConnected()) {
      let query = { userId };
      if (paymentMethod && paymentMethod !== 'All') query.paymentMethod = paymentMethod;
      if (status && status !== 'All') query.status = status;

      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    } else {
      let list = memoryOrders.filter(o => o.userId && o.userId.toString() === userId);
      if (paymentMethod && paymentMethod !== 'All') {
        list = list.filter(o => o.paymentMethod === paymentMethod);
      }
      if (status && status !== 'All') {
        list = list.filter(o => o.status === status);
      }
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (getIsConnected()) {
      const order = await Order.findOne({ _id: id, userId });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found in your store' });
      return res.json({ success: true, data: order });
    } else {
      const order = memoryOrders.find(
        o => (o.id === id || o._id === id || o.invoiceNumber === id) && o.userId && o.userId.toString() === userId
      );
      if (!order) return res.status(404).json({ success: false, message: 'Order not found in your store' });
      return res.json({ success: true, data: order });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders - Process sale & reduce inventory (Scoped to userId)
const createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      customer,
      items,
      subtotal,
      discountAmount = 0,
      taxAmount = 0,
      grandTotal,
      paymentMethod,
      amountPaid,
      changeGiven = 0,
      pointsRedeemed = 0,
      couponCode = '',
      couponDiscount = 0,
      cashierName = 'Register #01',
      storeName: customStoreName,
      storeLogo: customStoreLogo,
      storeBranch: customStoreBranch
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    const invoiceNumber = generateInvoiceNumber();
    // 1 Point earned per ₹100 spent
    const pointsEarned = Math.floor(grandTotal / 100);

    // Normalize order items
    const normalizedItems = items.map(item => {
      const title = item.title || item.productTitle || 'Item';
      return {
        productId: item.productId || item._id || item.id,
        title,
        productTitle: title,
        sku: item.sku || '',
        attributes: Array.isArray(item.attributes) ? item.attributes : [],
        size: item.size || '',
        color: item.color || '',
        unitPrice: Number(item.unitPrice || item.price || 0),
        quantity: Number(item.quantity || 1),
        itemTotal: Number(item.itemTotal || (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)))
      };
    });

    if (getIsConnected()) {
      // 1. Process Stock Deductions in Mongoose (scoped to this store's product)
      for (const item of normalizedItems) {
        if (item.productId) {
          const product = await Product.findOne({ _id: item.productId, userId });
          if (product) {
            product.stock = Math.max(0, (product.stock || 0) - item.quantity);
            await product.save();
          }
        }
      }

      // 2. Update Customer Loyalty & Total Spend if assigned (scoped to store)
      if (customer && (customer.id || customer._id)) {
        const custId = customer.id || customer._id;
        const custDoc = await Customer.findOne({ _id: custId, userId });
        if (custDoc) {
          custDoc.totalSpent += grandTotal;
          custDoc.totalOrders += 1;
          custDoc.loyaltyPoints = Math.max(0, custDoc.loyaltyPoints - pointsRedeemed + pointsEarned);

          if (custDoc.totalSpent >= 25000) custDoc.tier = 'Platinum';
          else if (custDoc.totalSpent >= 10000) custDoc.tier = 'Gold';
          else if (custDoc.totalSpent >= 5000) custDoc.tier = 'Silver';

          await custDoc.save();
        }
      }

      // 3. Resolve Store Branding for snapshot
      let storeName = customStoreName || '';
      let storeLogo = customStoreLogo || '';
      let storeBranch = customStoreBranch || '';

      if (!storeName || !storeLogo) {
        const userDoc = await User.findById(userId);
        if (userDoc) {
          if (!storeName) storeName = userDoc.storeName || '';
          if (!storeLogo) storeLogo = userDoc.storeLogo || '';
          if (!storeBranch) storeBranch = userDoc.storeBranch || '';
        }
      }

      // 4. Create Order stamped with userId and store snapshot
      const newOrder = await Order.create({
        userId,
        invoiceNumber,
        storeName,
        storeLogo,
        storeBranch,
        customer: customer || { name: 'Walk-in Guest', phone: '' },
        items: normalizedItems,
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount),
        couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
        couponDiscount: Number(couponDiscount || 0),
        taxAmount: Number(taxAmount),
        grandTotal: Number(grandTotal),
        paymentMethod,
        amountPaid: Number(amountPaid),
        changeGiven: Number(changeGiven),
        pointsEarned,
        pointsRedeemed,
        cashierName
      });

      // 5. Increment coupon usage if used (scoped to store)
      if (couponCode) {
        try {
          await Coupon.findOneAndUpdate(
            { code: couponCode.trim().toUpperCase(), userId },
            { $inc: { timesUsed: 1 } }
          );
        } catch (couponErr) {
          console.error('Error updating coupon usage:', couponErr);
        }
      }

      return res.status(201).json({ success: true, data: newOrder });
    } else {
      // Memory Fallback
      // Deduct flat stock in memoryProducts
      normalizedItems.forEach(item => {
        const product = memoryProducts.find(
          p => (p.id === item.productId || p._id === item.productId) && p.userId && p.userId.toString() === userId
        );
        if (product) {
          product.stock = Math.max(0, (product.stock || 0) - item.quantity);
          product.totalStock = product.stock;
        }
      });

      // Update customer in memory
      if (customer && (customer.id || customer._id)) {
        const custId = customer.id || customer._id;
        const custObj = memoryCustomers.find(
          c => (c.id === custId || c._id === custId) && c.userId && c.userId.toString() === userId
        );
        if (custObj) {
          custObj.totalSpent = (custObj.totalSpent || 0) + grandTotal;
          custObj.totalOrders = (custObj.totalOrders || 0) + 1;
          custObj.loyaltyPoints = Math.max(0, (custObj.loyaltyPoints || 0) - pointsRedeemed + pointsEarned);

          if (custObj.totalSpent >= 25000) custObj.tier = 'Platinum';
          else if (custObj.totalSpent >= 10000) custObj.tier = 'Gold';
          else if (custObj.totalSpent >= 5000) custObj.tier = 'Silver';
        }
      }

      const userObj = memoryUsers.find(u => (u.id === userId || u._id === userId));
      const storeName = customStoreName || (userObj && userObj.storeName) || '';
      const storeLogo = customStoreLogo || (userObj && userObj.storeLogo) || '';
      const storeBranch = customStoreBranch || (userObj && userObj.storeBranch) || '';

      const orderObj = {
        id: `ord-${Date.now()}`,
        _id: `ord-${Date.now()}`,
        userId,
        invoiceNumber,
        storeName,
        storeLogo,
        storeBranch,
        customer: customer || { name: 'Walk-in Guest', phone: '' },
        items: normalizedItems,
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount),
        couponCode: couponCode ? couponCode.trim().toUpperCase() : '',
        couponDiscount: Number(couponDiscount || 0),
        taxAmount: Number(taxAmount),
        grandTotal: Number(grandTotal),
        paymentMethod,
        amountPaid: Number(amountPaid),
        changeGiven: Number(changeGiven),
        pointsEarned,
        pointsRedeemed,
        cashierName,
        status: 'Completed',
        createdAt: new Date().toISOString()
      };

      memoryOrders.unshift(orderObj);
      return res.status(201).json({ success: true, data: orderObj });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  memoryOrders
};
