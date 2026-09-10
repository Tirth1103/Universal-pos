const Account = require('../models/Account');
const Expense = require('../models/Expense');
const Cheque = require('../models/Cheque');
const { getIsConnected } = require('../config/db');

let memoryAccounts = [];
let memoryExpenses = [];
let memoryCheques = [];

// GET /api/finance/accounts
const getAccounts = async (req, res) => {
  try {
    const userId = req.userId;
    if (getIsConnected()) {
      const accounts = await Account.find({ userId });
      return res.json({ success: true, count: accounts.length, data: accounts });
    } else {
      const list = memoryAccounts.filter(a => a.userId && a.userId.toString() === userId);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/finance/accounts
const createAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, accountType, bankName = '', accountNumber = '', ifsc = '', currentBalance = 0, isDefault = false } = req.body;

    if (!name || !accountType) {
      return res.status(400).json({ success: false, message: 'Account name and type are required' });
    }

    const payload = {
      userId,
      name: name.trim(),
      accountType,
      bankName,
      accountNumber,
      ifsc,
      currentBalance: Number(currentBalance) || 0,
      isDefault: Boolean(isDefault)
    };

    if (getIsConnected()) {
      const acc = await Account.create(payload);
      return res.status(201).json({ success: true, message: 'Financial account created', data: acc });
    } else {
      const acc = { _id: 'acc_' + Date.now(), id: 'acc_' + Date.now(), ...payload, createdAt: new Date() };
      memoryAccounts.push(acc);
      return res.status(201).json({ success: true, message: 'Account created (session mode)', data: acc });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/finance/accounts/transfer
const transferFunds = async (req, res) => {
  try {
    const userId = req.userId;
    const { fromAccountId, toAccountId, amount, notes = '' } = req.body;

    const amt = Number(amount);
    if (!fromAccountId || !toAccountId || !amt || amt <= 0) {
      return res.status(400).json({ success: false, message: 'From account, To account, and positive amount are required' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ success: false, message: 'Source and destination accounts must be different' });
    }

    if (getIsConnected()) {
      const fromAcc = await Account.findOne({ _id: fromAccountId, userId });
      const toAcc = await Account.findOne({ _id: toAccountId, userId });

      if (!fromAcc || !toAcc) {
        return res.status(404).json({ success: false, message: 'One or both accounts not found' });
      }

      fromAcc.currentBalance = (fromAcc.currentBalance || 0) - amt;
      toAcc.currentBalance = (toAcc.currentBalance || 0) + amt;

      await fromAcc.save();
      await toAcc.save();

      return res.json({
        success: true,
        message: `Transferred ₹${amt} from ${fromAcc.name} to ${toAcc.name}`,
        data: { fromAcc, toAcc }
      });
    } else {
      const fromAcc = memoryAccounts.find(a => (a._id === fromAccountId || a.id === fromAccountId) && a.userId === userId);
      const toAcc = memoryAccounts.find(a => (a._id === toAccountId || a.id === toAccountId) && a.userId === userId);

      if (!fromAcc || !toAcc) return res.status(404).json({ success: false, message: 'Accounts not found' });

      fromAcc.currentBalance = (fromAcc.currentBalance || 0) - amt;
      toAcc.currentBalance = (toAcc.currentBalance || 0) + amt;

      return res.json({
        success: true,
        message: `Transferred ₹${amt} (session mode)`,
        data: { fromAcc, toAcc }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/finance/expenses
const getExpenses = async (req, res) => {
  try {
    const userId = req.userId;
    const { category } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (category && category !== 'All') query.category = category;

      const expenses = await Expense.find(query).sort({ date: -1 });
      return res.json({ success: true, count: expenses.length, data: expenses });
    } else {
      let list = memoryExpenses.filter(e => e.userId && e.userId.toString() === userId);
      if (category && category !== 'All') list = list.filter(e => e.category === category);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/finance/expenses
const createExpense = async (req, res) => {
  try {
    const userId = req.userId;
    const { category, amount, paymentAccountId, paymentMode = 'Cash Drawer', paidTo = '', notes = '', gstin = '', taxAmount = 0 } = req.body;

    const amt = Number(amount);
    if (!category || !amt || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Category and positive amount required' });
    }

    const expenseNumber = `EXP-${Date.now().toString().slice(-6)}`;

    const payload = {
      userId,
      expenseNumber,
      category,
      amount: amt,
      paymentAccountId: paymentAccountId || null,
      paymentMode,
      paidTo,
      notes,
      gstin,
      taxAmount: Number(taxAmount) || 0,
      date: new Date()
    };

    if (getIsConnected()) {
      const exp = await Expense.create(payload);

      // Deduct from linked payment account if specified
      if (paymentAccountId) {
        await Account.findByIdAndUpdate(paymentAccountId, {
          $inc: { currentBalance: -amt }
        });
      }

      return res.status(201).json({ success: true, message: `Expense of ₹${amt} logged`, data: exp });
    } else {
      const exp = { _id: 'exp_' + Date.now(), id: 'exp_' + Date.now(), ...payload };
      memoryExpenses.unshift(exp);

      if (paymentAccountId) {
        const acc = memoryAccounts.find(a => a._id === paymentAccountId || a.id === paymentAccountId);
        if (acc) acc.currentBalance = (acc.currentBalance || 0) - amt;
      }

      return res.status(201).json({ success: true, message: `Expense of ₹${amt} logged (session mode)`, data: exp });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/finance/cheques
const getCheques = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, type } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (status && status !== 'All') query.status = status;
      if (type && type !== 'All') query.type = type;

      const cheques = await Cheque.find(query).sort({ chequeDate: 1 });
      return res.json({ success: true, count: cheques.length, data: cheques });
    } else {
      let list = memoryCheques.filter(c => c.userId && c.userId.toString() === userId);
      if (status && status !== 'All') list = list.filter(c => c.status === status);
      if (type && type !== 'All') list = list.filter(c => c.type === type);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/finance/cheques
const createCheque = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, partyName, partyType = 'Customer', chequeNumber, bankName, amount, chequeDate, notes = '', linkedAccountId = null } = req.body;

    const amt = Number(amount);
    if (!type || !partyName || !chequeNumber || !bankName || !amt || amt <= 0 || !chequeDate) {
      return res.status(400).json({ success: false, message: 'All cheque details are required' });
    }

    const payload = {
      userId,
      type,
      partyName,
      partyType,
      chequeNumber,
      bankName,
      amount: amt,
      chequeDate,
      status: 'Pending',
      linkedAccountId,
      notes
    };

    if (getIsConnected()) {
      const chq = await Cheque.create(payload);
      return res.status(201).json({ success: true, message: 'Cheque record created', data: chq });
    } else {
      const chq = { _id: 'chq_' + Date.now(), id: 'chq_' + Date.now(), ...payload, createdAt: new Date() };
      memoryCheques.unshift(chq);
      return res.status(201).json({ success: true, message: 'Cheque recorded (session mode)', data: chq });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/finance/cheques/:id/status
const updateChequeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { status, depositDate, clearingDate, accountId } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'Status required' });

    if (getIsConnected()) {
      const cheque = await Cheque.findOne({ _id: id, userId });
      if (!cheque) return res.status(404).json({ success: false, message: 'Cheque not found' });

      const oldStatus = cheque.status;
      cheque.status = status;
      if (depositDate) cheque.depositDate = depositDate;
      if (clearingDate) cheque.clearingDate = clearingDate;
      if (accountId) cheque.linkedAccountId = accountId;

      await cheque.save();

      // If status changed to Cleared and linked to account, update account balance!
      if (status === 'Cleared' && oldStatus !== 'Cleared' && cheque.linkedAccountId) {
        const delta = cheque.type === 'Received' ? cheque.amount : -cheque.amount;
        await Account.findByIdAndUpdate(cheque.linkedAccountId, {
          $inc: { currentBalance: delta }
        });
      }

      return res.json({ success: true, message: `Cheque marked as ${status}`, data: cheque });
    } else {
      const cheque = memoryCheques.find(c => (c._id === id || c.id === id) && c.userId === userId);
      if (!cheque) return res.status(404).json({ success: false, message: 'Cheque not found' });

      cheque.status = status;
      if (depositDate) cheque.depositDate = depositDate;
      if (clearingDate) cheque.clearingDate = clearingDate;

      return res.json({ success: true, message: `Cheque marked as ${status} (session mode)`, data: cheque });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  transferFunds,
  getExpenses,
  createExpense,
  getCheques,
  createCheque,
  updateChequeStatus
};
