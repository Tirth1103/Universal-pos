const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    default: 'percent'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  expiryDate: {
    type: Date,
    default: null
  },
  usageLimit: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  timesUsed: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Coupon code unique per store
CouponSchema.index({ userId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', CouponSchema);
