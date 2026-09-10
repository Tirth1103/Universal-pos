const mongoose = require('mongoose');

const OrderItemAttributeSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  value: { type: String, trim: true }
}, { _id: false });

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  productTitle: {
    type: String,
    default: ''
  },
  sku: {
    type: String,
    default: ''
  },
  attributes: [OrderItemAttributeSchema],
  size: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: ''
  },
  unitPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  itemTotal: {
    type: Number,
    required: true
  }
});

// Middleware to ensure title and productTitle are synchronized
OrderItemSchema.pre('validate', function(next) {
  if (!this.title && this.productTitle) {
    this.title = this.productTitle;
  } else if (!this.productTitle && this.title) {
    this.productTitle = this.title;
  }
  next();
});

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    default: ''
  },
  storeLogo: {
    type: String,
    default: ''
  },
  storeBranch: {
    type: String,
    default: ''
  },
  customer: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    name: { type: String, default: 'Walk-in Guest' },
    phone: { type: String, default: '' }
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: ''
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    required: true
  },
  grandTotal: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'UPI / QR', 'Split'],
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  changeGiven: {
    type: Number,
    default: 0
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsRedeemed: {
    type: Number,
    default: 0
  },
  cashierName: {
    type: String,
    default: 'Register #01'
  },
  status: {
    type: String,
    enum: ['Completed', 'Refunded', 'Cancelled'],
    default: 'Completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

OrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
