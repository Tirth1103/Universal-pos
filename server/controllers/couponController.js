const Coupon = require('../models/Coupon');
const { getIsConnected } = require('../config/db');

// In-Memory Fallback
let memoryCoupons = [];

// @desc    Get all coupons (Scoped to authenticated user)
// @route   GET /api/coupons
exports.getCoupons = async (req, res) => {
  try {
    const userId = req.userId;
    if (getIsConnected()) {
      const coupons = await Coupon.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, data: coupons });
    } else {
      const list = memoryCoupons.filter(c => c.userId && c.userId.toString() === userId);
      return res.json({ success: true, data: list });
    }
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching coupons' });
  }
};

// @desc    Create a new coupon (Scoped to authenticated user)
// @route   POST /api/coupons
exports.createCoupon = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      code,
      title,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit
    } = req.body;

    if (!code || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and discount value are required'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    if (getIsConnected()) {
      const existing = await Coupon.findOne({ code: cleanCode, userId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Coupon code "${cleanCode}" already exists in your store`
        });
      }

      const coupon = await Coupon.create({
        userId,
        code: cleanCode,
        title: title ? title.trim() : '',
        discountType: discountType || 'percent',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount || 0),
        maxDiscountAmount: Number(maxDiscountAmount || 0),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: Number(usageLimit || 0)
      });

      return res.status(201).json({ success: true, data: coupon });
    } else {
      const existing = memoryCoupons.find(
        c => c.code === cleanCode && c.userId && c.userId.toString() === userId
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Coupon code "${cleanCode}" already exists in your store`
        });
      }

      const newCoupon = {
        _id: `coup-${Date.now()}`,
        id: `coup-${Date.now()}`,
        userId,
        code: cleanCode,
        title: title ? title.trim() : '',
        discountType: discountType || 'percent',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount || 0),
        maxDiscountAmount: Number(maxDiscountAmount || 0),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        usageLimit: Number(usageLimit || 0),
        timesUsed: 0,
        isActive: true,
        createdAt: new Date()
      };
      memoryCoupons.unshift(newCoupon);
      return res.status(201).json({ success: true, data: newCoupon });
    }
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.status(500).json({ success: false, message: 'Server error creating coupon' });
  }
};

// @desc    Validate coupon against a cart subtotal (Scoped to authenticated user)
// @route   POST /api/coupons/validate
exports.validateCoupon = async (req, res) => {
  try {
    const userId = req.userId;
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    let coupon = null;

    if (getIsConnected()) {
      coupon = await Coupon.findOne({ code: cleanCode, userId });
    } else {
      coupon = memoryCoupons.find(
        c => c.code === cleanCode && c.userId && c.userId.toString() === userId
      );
    }

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Invalid coupon code "${cleanCode}" for your store`
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" is disabled`
      });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" has expired`
      });
    }

    if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" usage limit has been reached`
      });
    }

    const currentSubtotal = Number(subtotal || 0);
    if (coupon.minOrderAmount > 0 && currentSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required to use "${cleanCode}"`
      });
    }

    // Calculate discount amount in INR
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (currentSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(currentSubtotal, coupon.discountValue);
    }
    discountAmount = Number(discountAmount.toFixed(2));

    return res.json({
      success: true,
      data: {
        coupon,
        discountAmount
      },
      message: `Coupon "${cleanCode}" applied successfully! You save ₹${discountAmount}`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({ success: false, message: 'Server error validating coupon' });
  }
};

// @desc    Toggle coupon active status
// @route   PUT /api/coupons/:id/toggle
exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (getIsConnected()) {
      const coupon = await Coupon.findOne({ _id: id, userId });
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found in your store' });
      }
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      return res.json({ success: true, data: coupon });
    } else {
      const coupon = memoryCoupons.find(
        c => (c.id === id || c._id === id) && c.userId && c.userId.toString() === userId
      );
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found in your store' });
      }
      coupon.isActive = !coupon.isActive;
      return res.json({ success: true, data: coupon });
    }
  } catch (error) {
    console.error('Error toggling coupon:', error);
    return res.status(500).json({ success: false, message: 'Server error toggling coupon' });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (getIsConnected()) {
      const coupon = await Coupon.findOneAndDelete({ _id: id, userId });
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found in your store' });
      }
      return res.json({ success: true, message: 'Coupon deleted successfully' });
    } else {
      const idx = memoryCoupons.findIndex(
        c => (c.id === id || c._id === id) && c.userId && c.userId.toString() === userId
      );
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Coupon not found in your store' });
      }
      memoryCoupons.splice(idx, 1);
      return res.json({ success: true, message: 'Coupon deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting coupon' });
  }
};
