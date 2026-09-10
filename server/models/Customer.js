const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  gstin: {
    type: String,
    default: '',
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0 // Positive = Receivable from customer (Udhar), Negative = Advance from customer
  },
  customerType: {
    type: String,
    enum: ['Retail', 'Wholesale', 'Distributor'],
    default: 'Retail'
  },
  pricingTier: {
    type: String,
    enum: ['Standard', 'Wholesale', 'Special'],
    default: 'Standard'
  },
  billingAddress: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Phone unique per store
CustomerSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Customer', CustomerSchema);
