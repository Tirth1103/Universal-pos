const mongoose = require('mongoose');

const CustomerTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['Invoice', 'PaymentReceived', 'CreditNote', 'OpeningBalance', 'ManualAdjustment'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  referenceNumber: {
    type: String,
    default: '',
    trim: true
  },
  debit: {
    type: Number,
    default: 0 // Debit increases customer debt (receivable) e.g., unpaid/credit sales invoice
  },
  credit: {
    type: Number,
    default: 0 // Credit decreases customer debt e.g., payments received or credit notes
  },
  runningBalance: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    default: 'Cash'
  },
  notes: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerTransaction', CustomerTransactionSchema);
