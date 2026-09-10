const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Rent', 'Electricity & Utilities', 'Salaries & Wages', 'Delivery & Logistics', 'Packaging Material', 'Marketing & Ads', 'Store Maintenance', 'Tea & Refreshments', 'Software & Licenses', 'Other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  paymentAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  paymentMode: {
    type: String,
    default: 'Cash Drawer'
  },
  paidTo: {
    type: String,
    default: '',
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  gstin: {
    type: String,
    default: ''
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
