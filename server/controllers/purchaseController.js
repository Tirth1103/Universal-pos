const PurchaseBill = require('../models/PurchaseBill');
const DebitNote = require('../models/DebitNote');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const { getIsConnected } = require('../config/db');
const { memoryProducts } = require('./productController');

let memoryPurchaseBills = [];
let memoryDebitNotes = [];

// GET /api/purchases/bills
const getPurchaseBills = async (req, res) => {
  try {
    const userId = req.userId;
    const { vendorId, paymentStatus } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (vendorId) query.vendorId = vendorId;
      if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

      const bills = await PurchaseBill.find(query).sort({ billDate: -1 });
      return res.json({ success: true, count: bills.length, data: bills });
    } else {
      let list = memoryPurchaseBills.filter(b => b.userId && b.userId.toString() === userId);
      if (vendorId) list = list.filter(b => b.vendorId === vendorId);
      if (paymentStatus && paymentStatus !== 'All') list = list.filter(b => b.paymentStatus === paymentStatus);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/purchases/bills
const createPurchaseBill = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      vendorId,
      billNumber,
      billDate = new Date(),
      dueDate = null,
      items = [],
      itcEligible = true,
      amountPaid = 0,
      notes = '',
      isInterState = false
    } = req.body;

    if (!vendorId || !billNumber || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Vendor, bill number, and items are required' });
    }

    let vendor = null;
    if (getIsConnected()) {
      vendor = await Vendor.findOne({ _id: vendorId, userId });
    } else {
      const { memoryVendors } = require('./vendorController');
      vendor = (memoryVendors || []).find(v => (v._id === vendorId || v.id === vendorId) && v.userId === userId);
    }

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    let subtotal = 0;
    let cgstTotal = 0, sgstTotal = 0, igstTotal = 0;

    const processedItems = items.map(item => {
      const qty = Number(item.quantity) || 1;
      const rate = Number(item.purchasePrice) || 0;
      const lineSubtotal = qty * rate;
      const taxRate = Number(item.taxRate) || 0;
      const taxAmt = (lineSubtotal * taxRate) / 100;

      let cgst = 0, sgst = 0, igst = 0;
      if (isInterState) {
        igst = Number(taxAmt.toFixed(2));
      } else {
        cgst = Number((taxAmt / 2).toFixed(2));
        sgst = Number((taxAmt / 2).toFixed(2));
      }

      const itemTotal = Number((lineSubtotal + taxAmt).toFixed(2));
      subtotal += lineSubtotal;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      return {
        productId: item.productId || null,
        title: item.title || 'Purchase Item',
        sku: item.sku || '',
        quantity: qty,
        unit: item.unit || 'pcs',
        purchasePrice: rate,
        mrp: Number(item.mrp) || rate * 1.3,
        batchNumber: item.batchNumber || `B-${Date.now().toString().slice(-4)}`,
        manufacturingDate: item.manufacturingDate || null,
        expiryDate: item.expiryDate || null,
        hsnCode: item.hsnCode || '',
        taxRate,
        cgst,
        sgst,
        igst,
        itemTotal
      };
    });

    const taxAmount = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));
    const paid = Number(amountPaid) || 0;
    const balanceDue = Math.max(0, totalAmount - paid);

    let paymentStatus = 'Unpaid';
    if (balanceDue <= 0) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partially Paid';

    const billPayload = {
      userId,
      vendorId,
      vendorName: vendor.name,
      vendorGstin: vendor.gstin || '',
      billNumber,
      billDate,
      dueDate,
      items: processedItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount,
      cgst: Number(cgstTotal.toFixed(2)),
      sgst: Number(sgstTotal.toFixed(2)),
      igst: Number(igstTotal.toFixed(2)),
      itcEligible,
      totalAmount,
      amountPaid: paid,
      balanceDue,
      paymentStatus,
      notes
    };

    if (getIsConnected()) {
      const bill = await PurchaseBill.create(billPayload);

      // Auto-update inventory batches & stock for each item
      for (const item of processedItems) {
        if (item.productId) {
          const prod = await Product.findOne({ _id: item.productId, userId });
          if (prod) {
            prod.stock = (prod.stock || 0) + item.quantity;
            prod.costPrice = item.purchasePrice;
            if (item.hsnCode) prod.hsnCode = item.hsnCode;
            if (item.taxRate) prod.taxRate = item.taxRate;

            if (!Array.isArray(prod.batches)) prod.batches = [];
            prod.batches.push({
              batchNumber: item.batchNumber,
              manufacturingDate: item.manufacturingDate,
              expiryDate: item.expiryDate,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              mrp: item.mrp
            });

            await prod.save();
          }
        }
      }

      // Update vendor currentBalance
      vendor.currentBalance = (vendor.currentBalance || 0) + balanceDue;
      await vendor.save();

      return res.status(201).json({
        success: true,
        message: `Purchase Bill #${billNumber} recorded. Stock and Batches updated.`,
        data: bill
      });
    } else {
      const bill = {
        _id: 'pb_' + Date.now(),
        id: 'pb_' + Date.now(),
        ...billPayload,
        createdAt: new Date()
      };
      memoryPurchaseBills.unshift(bill);

      // In-memory stock increment
      processedItems.forEach(item => {
        if (item.productId) {
          const prod = (memoryProducts || []).find(p => (p._id === item.productId || p.id === item.productId) && p.userId === userId);
          if (prod) {
            prod.stock = (prod.stock || 0) + item.quantity;
            prod.costPrice = item.purchasePrice;
            if (!prod.batches) prod.batches = [];
            prod.batches.push({
              batchNumber: item.batchNumber,
              manufacturingDate: item.manufacturingDate,
              expiryDate: item.expiryDate,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              mrp: item.mrp
            });
          }
        }
      });

      vendor.currentBalance = (vendor.currentBalance || 0) + balanceDue;

      return res.status(201).json({
        success: true,
        message: `Purchase Bill #${billNumber} recorded (session mode).`,
        data: bill
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/purchases/debit-notes
const createDebitNote = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      vendorId,
      purchaseBillId = null,
      reason = 'Goods Return',
      items = [],
      totalAmount,
      refundStatus = 'Adjusted Against Balance',
      notes = ''
    } = req.body;

    if (!vendorId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Vendor and total amount required' });
    }

    let vendor = null;
    if (getIsConnected()) {
      vendor = await Vendor.findOne({ _id: vendorId, userId });
    } else {
      const { memoryVendors } = require('./vendorController');
      vendor = (memoryVendors || []).find(v => (v._id === vendorId || v.id === vendorId) && v.userId === userId);
    }

    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const debitNoteNumber = `DN-${Date.now().toString().slice(-6)}`;
    const amt = Number(totalAmount);

    const payload = {
      userId,
      debitNoteNumber,
      vendorId,
      vendorName: vendor.name,
      purchaseBillId,
      reason,
      items,
      totalAmount: amt,
      refundStatus,
      notes
    };

    if (getIsConnected()) {
      const dn = await DebitNote.create(payload);

      // Decrement vendor payable
      vendor.currentBalance = Math.max(0, (vendor.currentBalance || 0) - amt);
      await vendor.save();

      // Decrement stock for returned items
      if (Array.isArray(items)) {
        for (const it of items) {
          if (it.productId) {
            await Product.findByIdAndUpdate(it.productId, {
              $inc: { stock: -Number(it.quantity || 0) }
            });
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: `Debit Note #${debitNoteNumber} issued. Vendor balance adjusted.`,
        data: dn
      });
    } else {
      const dn = {
        _id: 'dn_' + Date.now(),
        id: 'dn_' + Date.now(),
        ...payload,
        createdAt: new Date()
      };
      memoryDebitNotes.unshift(dn);
      vendor.currentBalance = Math.max(0, (vendor.currentBalance || 0) - amt);

      return res.status(201).json({
        success: true,
        message: `Debit Note #${debitNoteNumber} issued (session mode).`,
        data: dn
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/purchases/debit-notes
const getDebitNotes = async (req, res) => {
  try {
    const userId = req.userId;
    if (getIsConnected()) {
      const notes = await DebitNote.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: notes.length, data: notes });
    } else {
      const list = memoryDebitNotes.filter(d => d.userId && d.userId.toString() === userId);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPurchaseBills,
  createPurchaseBill,
  createDebitNote,
  getDebitNotes
};
