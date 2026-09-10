const Customer = require('../models/Customer');
const CustomerTransaction = require('../models/CustomerTransaction');
const Order = require('../models/Order');
const { getIsConnected } = require('../config/db');
const { memoryCustomers } = require('./customerController');

let memoryCustomerTransactions = [];

// GET /api/ledger/customer/:id
const getCustomerLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    let customer = null;
    let transactions = [];

    if (getIsConnected()) {
      customer = await Customer.findOne({ _id: id, userId });
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

      transactions = await CustomerTransaction.find({ customerId: id, userId }).sort({ date: 1 });
      
      // If no transactions logged yet, dynamically backfill from completed Orders for this customer
      if (transactions.length === 0) {
        const orders = await Order.find({ 'customer.id': id, userId }).sort({ createdAt: 1 });
        let running = 0;
        for (const ord of orders) {
          const unpaid = Math.max(0, ord.grandTotal - (ord.amountPaid || 0));
          if (unpaid > 0) {
            running += unpaid;
            transactions.push({
              type: 'Invoice',
              referenceNumber: ord.invoiceNumber,
              referenceId: ord._id,
              debit: unpaid,
              credit: 0,
              runningBalance: running,
              paymentMode: ord.paymentMethod,
              notes: 'Credit sale invoice balance',
              date: ord.createdAt
            });
          }
        }
      }

      return res.json({
        success: true,
        data: {
          customer,
          currentBalance: customer.currentBalance || 0,
          creditLimit: customer.creditLimit || 0,
          pricingTier: customer.pricingTier || 'Standard',
          transactions
        }
      });
    } else {
      customer = (memoryCustomers || []).find(c => (c._id === id || c.id === id) && c.userId === userId);
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

      transactions = memoryCustomerTransactions.filter(t => t.customerId === id && t.userId === userId);
      return res.json({
        success: true,
        data: {
          customer,
          currentBalance: customer.currentBalance || 0,
          creditLimit: customer.creditLimit || 0,
          pricingTier: customer.pricingTier || 'Standard',
          transactions
        },
        isMemory: true
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ledger/customer/:id/payment (Record settlement of customer Udhar)
const recordCustomerPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, paymentMode = 'Cash', referenceNumber = '', notes = '' } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    if (getIsConnected()) {
      const customer = await Customer.findOne({ _id: id, userId });
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

      const newBalance = (customer.currentBalance || 0) - paymentAmount;
      customer.currentBalance = newBalance;
      await customer.save();

      const tx = await CustomerTransaction.create({
        userId,
        customerId: id,
        type: 'PaymentReceived',
        referenceNumber: referenceNumber || `PAY-${Date.now().toString().slice(-6)}`,
        debit: 0,
        credit: paymentAmount,
        runningBalance: newBalance,
        paymentMode,
        notes,
        date: new Date()
      });

      return res.status(201).json({
        success: true,
        message: `Payment of ₹${paymentAmount} received. New Khata balance: ₹${newBalance}`,
        data: { customer, transaction: tx }
      });
    } else {
      const customer = (memoryCustomers || []).find(c => (c._id === id || c.id === id) && c.userId === userId);
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

      const newBalance = (customer.currentBalance || 0) - paymentAmount;
      customer.currentBalance = newBalance;

      const tx = {
        _id: 'ctx_' + Date.now(),
        id: 'ctx_' + Date.now(),
        userId,
        customerId: id,
        type: 'PaymentReceived',
        referenceNumber: referenceNumber || `PAY-${Date.now().toString().slice(-6)}`,
        debit: 0,
        credit: paymentAmount,
        runningBalance: newBalance,
        paymentMode,
        notes,
        date: new Date()
      };
      memoryCustomerTransactions.push(tx);

      return res.status(201).json({
        success: true,
        message: `Payment of ₹${paymentAmount} received (session mode).`,
        data: { customer, transaction: tx }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ledger/check-credit/:id
const checkCreditLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const amount = Number(req.query.amount) || 0;

    let customer = null;
    if (getIsConnected()) {
      customer = await Customer.findOne({ _id: id, userId });
    } else {
      customer = (memoryCustomers || []).find(c => (c._id === id || c.id === id) && c.userId === userId);
    }

    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    const currentBalance = customer.currentBalance || 0;
    const creditLimit = customer.creditLimit || 0;
    const projectedBalance = currentBalance + amount;

    const hasLimit = creditLimit > 0;
    const isExceeded = hasLimit && projectedBalance > creditLimit;
    const availableCredit = hasLimit ? Math.max(0, creditLimit - currentBalance) : Infinity;

    return res.json({
      success: true,
      data: {
        customerId: customer._id || customer.id,
        name: customer.name,
        currentBalance,
        creditLimit,
        orderAmount: amount,
        projectedBalance,
        isExceeded,
        availableCredit,
        requiresAdminOverride: isExceeded
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/ledger/customer/:id/settings (Update Credit Limit, Pricing Tier, GSTIN)
const updateCustomerSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { creditLimit, pricingTier, gstin, customerType, billingAddress } = req.body;

    if (getIsConnected()) {
      const customer = await Customer.findOne({ _id: id, userId });
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

      if (creditLimit !== undefined) customer.creditLimit = Number(creditLimit) || 0;
      if (pricingTier) customer.pricingTier = pricingTier;
      if (gstin !== undefined) customer.gstin = gstin.trim().toUpperCase();
      if (customerType) customer.customerType = customerType;
      if (billingAddress) customer.billingAddress = billingAddress;

      await customer.save();
      return res.json({ success: true, message: 'Customer terms updated', data: customer });
    } else {
      const customer = (memoryCustomers || []).find(c => (c._id === id || c.id === id) && c.userId === userId);
      if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

      if (creditLimit !== undefined) customer.creditLimit = Number(creditLimit) || 0;
      if (pricingTier) customer.pricingTier = pricingTier;
      if (gstin !== undefined) customer.gstin = gstin.trim().toUpperCase();
      if (customerType) customer.customerType = customerType;
      if (billingAddress) customer.billingAddress = billingAddress;

      return res.json({ success: true, message: 'Customer terms updated (session mode)', data: customer });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomerLedger,
  recordCustomerPayment,
  checkCreditLimit,
  updateCustomerSettings
};
