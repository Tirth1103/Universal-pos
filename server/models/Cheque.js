const mongoose = require('mongoose');

const ChequeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Received', 'Issued'],
    required: true
  },
  partyName: {
    type: String,
    required: true
  },
  partyType: {
    type: String,
    enum: ['Customer', 'Vendor', 'Other'],
    default: 'Customer'
  },
  chequeNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  chequeDate: {
    type: Date,
    required: true
  },
  depositDate: {
    type: Date,
    default: null
  },
  clearingDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Deposited', 'Cleared', 'Bounced'],
    default: 'Pending',
    index: true
  },
  linkedAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cheque', ChequeSchema);
