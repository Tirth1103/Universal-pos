const mongoose = require('mongoose');

const AttributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    default: '',
    trim: true
  },
  brand: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    default: '',
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    default: 'pcs',
    trim: true
  },
  minStockAlert: {
    type: Number,
    default: 5
  },
  reorderPoint: {
    type: Number,
    default: 5
  },
  hsnCode: {
    type: String,
    default: '',
    trim: true
  },
  taxRate: {
    type: Number,
    default: 0
  },
  wholesalePrice: {
    type: Number,
    default: 0
  },
  packagingHierarchy: {
    baseUnit: { type: String, default: 'pcs' },
    secondaryUnit: { type: String, default: '' },
    conversionFactor: { type: Number, default: 1 }
  },
  batches: [{
    batchNumber: { type: String, required: true, trim: true },
    manufacturingDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    quantity: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 }
  }],
  serialNumbers: [{ type: String, trim: true }],
  attributes: [AttributeSchema],
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index: SKU unique per store
ProductSchema.index({ userId: 1, sku: 1 }, { unique: true });

// Virtual totalStock for backward compatibility
ProductSchema.virtual('totalStock').get(function () {
  return this.stock !== undefined ? this.stock : 0;
});

module.exports = mongoose.model('Product', ProductSchema);
