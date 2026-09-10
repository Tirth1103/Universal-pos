const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  storeName: {
    type: String,
    default: 'My Retail Store',
    trim: true
  },
  storeLogo: {
    type: String,
    default: ''
  },
  storeCategory: {
    type: String,
    default: 'General Retail',
    trim: true
  },
  themeColors: {
    primary: { type: String, default: '#10b981' },
    accent: { type: String, default: '#047857' },
    isCustom: { type: Boolean, default: false }
  },
  role: {
    type: String,
    enum: ['Store Admin', 'Store Manager', 'Cashier'],
    default: 'Store Admin'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  storeBranch: {
    type: String,
    default: 'Downtown Flagship'
  },
  avatar: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before save using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method using bcrypt
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!enteredPassword || !this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe JSON serialization (strip password & salt)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject ? this.toObject() : { ...this };
  delete obj.password;
  delete obj.salt;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
