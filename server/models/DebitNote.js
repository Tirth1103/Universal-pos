const mongoose = require('mongoose');

const DebitNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  debitNoteNumber: {
    type: String,
    required: true,
    trim: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  vendorName: {
    type: String,
    required: true
  },
  purchaseBillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseBill',
    default: null
  },
  originalBillNumber: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    enum: ['Goods Return', 'Overcharged Price', 'Defective Goods', 'Discount Post-Sale', 'Other'],
    default: 'Goods Return'
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    quantity: Number,
    rate: Number,
    taxRate: Number,
    total: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  refundStatus: {
    type: String,
    enum: ['Adjusted Against Balance', 'Refund Received', 'Pending'],
    default: 'Adjusted Against Balance'
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

module.exports = mongoose.model('DebitNote', DebitNoteSchema);
