const Vendor = require('../models/Vendor');
const PurchaseBill = require('../models/PurchaseBill');
const DebitNote = require('../models/DebitNote');
const { getIsConnected } = require('../config/db');

let memoryVendors = [];
let memoryVendorPayments = [];

// GET /api/vendors
const getVendors = async (req, res) => {
  try {
    const userId = req.userId;
    const { search } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      const vendors = await Vendor.find(query).sort({ name: 1 });
      return res.json({ success: true, count: vendors.length, data: vendors });
    } else {
      let list = memoryVendors.filter(v => v.userId && v.userId.toString() === userId);
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(v =>
          v.name.toLowerCase().includes(s) ||
          (v.companyName && v.companyName.toLowerCase().includes(s)) ||
          v.phone.includes(s)
        );
      }
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendors
const createVendor = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      companyName = '',
      phone,
      email = '',
      gstin = '',
      address = {},
      openingBalance = 0,
      paymentTermsDays = 30,
      bankDetails = {},
      notes = ''
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Vendor name and phone are required' });
    }

    const payload = {
      userId,
      name: name.trim(),
      companyName: companyName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim().toUpperCase(),
      address,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      bankDetails,
      notes
    };

    if (getIsConnected()) {
      const vendor = await Vendor.create(payload);
      return res.status(201).json({ success: true, message: 'Vendor added to Khata', data: vendor });
    } else {
      const vendor = {
        _id: 'ven_' + Date.now(),
        id: 'ven_' + Date.now(),
        ...payload,
        createdAt: new Date()
      };
      memoryVendors.unshift(vendor);
      return res.status(201).json({ success: true, message: 'Vendor added (session mode)', data: vendor });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/vendors/:id/ledger
const getVendorLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    let vendor = null;
    let bills = [];
    let debitNotes = [];

    if (getIsConnected()) {
      vendor = await Vendor.findOne({ _id: id, userId });
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

      bills = await PurchaseBill.find({ vendorId: id, userId }).sort({ billDate: 1 });
      debitNotes = await DebitNote.find({ vendorId: id, userId }).sort({ createdAt: 1 });
    } else {
      vendor = memoryVendors.find(v => (v._id === id || v.id === id) && v.userId === userId);
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Build chronological ledger statement
    const ledger = [];
    let runningBalance = vendor.openingBalance || 0;

    if (vendor.openingBalance !== 0) {
      ledger.push({
        date: vendor.createdAt,
        type: 'Opening Balance',
        refNo: 'INIT',
        credit: vendor.openingBalance > 0 ? vendor.openingBalance : 0,
        debit: vendor.openingBalance < 0 ? Math.abs(vendor.openingBalance) : 0,
        runningBalance
      });
    }

    bills.forEach(b => {
      runningBalance += b.totalAmount;
      ledger.push({
        date: b.billDate,
        type: 'Purchase Bill',
        refNo: b.billNumber,
        credit: b.totalAmount, // Bill increases payable (credit to vendor)
        debit: 0,
        runningBalance,
        billId: b._id
      });

      if (b.amountPaid > 0) {
        runningBalance -= b.amountPaid;
        ledger.push({
          date: b.billDate,
          type: 'Payment Made',
          refNo: `PAY-${b.billNumber}`,
          credit: 0,
          debit: b.amountPaid, // Payment reduces payable (debit to vendor)
          runningBalance
        });
      }
    });

    debitNotes.forEach(dn => {
      runningBalance -= dn.totalAmount;
      ledger.push({
        date: dn.createdAt,
        type: 'Debit Note (Return)',
        refNo: dn.debitNoteNumber,
        credit: 0,
        debit: dn.totalAmount,
        runningBalance
      });
    });

    return res.json({
      success: true,
      data: {
        vendor,
        currentPayable: runningBalance,
        ledger
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/vendors/:id/payment (Record settlement payment to supplier)
const recordVendorPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, paymentMethod = 'Bank Transfer', reference = '', notes = '' } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    if (getIsConnected()) {
      const vendor = await Vendor.findOne({ _id: id, userId });
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

      vendor.currentBalance = (vendor.currentBalance || 0) - paymentAmount;
      await vendor.save();

      return res.json({
        success: true,
        message: `Payment of ₹${paymentAmount} recorded. Updated balance: ₹${vendor.currentBalance}`,
        data: vendor
      });
    } else {
      const vendor = memoryVendors.find(v => (v._id === id || v.id === id) && v.userId === userId);
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

      vendor.currentBalance = (vendor.currentBalance || 0) - paymentAmount;
      return res.json({
        success: true,
        message: `Payment of ₹${paymentAmount} recorded (session mode).`,
        data: vendor
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getVendors,
  createVendor,
  getVendorLedger,
  recordVendorPayment
};
