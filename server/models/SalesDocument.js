const mongoose = require('mongoose');

const DocumentItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  title: { type: String, required: true, trim: true },
  sku: { type: String, default: '', trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'pcs', trim: true },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  hsnCode: { type: String, default: '' },
  taxRate: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  cess: { type: Number, default: 0 },
  batchNumber: { type: String, default: '' },
  serialNumber: { type: String, default: '' },
  itemTotal: { type: Number, required: true }
}, { _id: true });

const DispatchLogSchema = new mongoose.Schema({
  channel: { type: String, enum: ['WhatsApp', 'SMS', 'Email'], required: true },
  recipient: { type: String, required: true },
  status: { type: String, enum: ['Sent', 'Failed', 'Pending'], default: 'Sent' },
  sentAt: { type: Date, default: Date.now },
  message: { type: String, default: '' }
}, { _id: false });

const SalesDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: ['Estimate', 'ProformaInvoice', 'SalesOrder', 'DeliveryChallan', 'CreditNote'],
    required: true,
    index: true
  },
  docNumber: {
    type: String,
    required: true,
    trim: true
  },
  referenceNumber: {
    type: String,
    default: '',
    trim: true
  },
  customer: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    name: { type: String, default: 'Walk-in Guest', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    gstin: { type: String, default: '', trim: true },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
      pincode: { type: String, default: '' }
    }
  },
  items: [DocumentItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  itemDiscountTotal: { type: Number, default: 0 },
  wholeBillDiscount: {
    type: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  totalDiscount: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  cess: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Draft', 'Open', 'Converted', 'Completed', 'Cancelled', 'Dispatched'],
    default: 'Open',
    index: true
  },
  convertedInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  convertedAt: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  terms: { type: String, default: '' },
  dispatchLogs: [DispatchLogSchema],
  createdAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

SalesDocumentSchema.index({ userId: 1, documentType: 1, docNumber: 1 }, { unique: true });

module.exports = mongoose.model('SalesDocument', SalesDocumentSchema);
