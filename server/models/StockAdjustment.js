const mongoose = require('mongoose');

const StockAdjustmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  productTitle: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    default: ''
  },
  batchNumber: {
    type: String,
    default: ''
  },
  adjustmentType: {
    type: String,
    enum: ['Damage', 'Loss / Theft', 'Physical Audit Correction', 'Customer Return', 'Expired Stock Scrap', 'Other'],
    required: true
  },
  quantityChanged: {
    type: Number,
    required: true // Can be negative (deduction) or positive (addition)
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  reasonCode: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  adjustedBy: {
    type: String,
    default: 'Inventory Manager'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockAdjustment', StockAdjustmentSchema);
