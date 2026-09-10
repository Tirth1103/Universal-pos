const mongoose = require('mongoose');

const PurchaseBillItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  title: { type: String, required: true, trim: true },
  sku: { type: String, default: '', trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'pcs', trim: true },
  purchasePrice: { type: Number, required: true, min: 0 },
  mrp: { type: Number, default: 0 },
  batchNumber: { type: String, default: '' },
  manufacturingDate: { type: Date, default: null },
  expiryDate: { type: Date, default: null },
  hsnCode: { type: String, default: '' },
  taxRate: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  itemTotal: { type: Number, required: true }
}, { _id: true });

const PurchaseBillSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  vendorName: {
    type: String,
    required: true
  },
  vendorGstin: {
    type: String,
    default: ''
  },
  billNumber: {
    type: String,
    required: true,
    trim: true
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  items: [PurchaseBillItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  itcEligible: {
    type: Boolean,
    default: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid',
    index: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

PurchaseBillSchema.index({ userId: 1, billNumber: 1 });

module.exports = mongoose.model('PurchaseBill', PurchaseBillSchema);
