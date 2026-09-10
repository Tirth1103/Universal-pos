const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { getIsConnected } = require('../config/db');
const { memoryProducts } = require('../controllers/productController');
const { memoryCustomers } = require('../controllers/customerController');
const { memoryOrders } = require('../controllers/orderController');

// Clean and wipe all data to a fresh state
router.post('/reset', async (req, res) => {
  try {
    if (getIsConnected()) {
      await Product.deleteMany({});
      await Customer.deleteMany({});
      await User.deleteMany({});
      await Order.deleteMany({});
      await Coupon.deleteMany({});

      return res.json({
        success: true,
        message: 'All collections cleared. System is fresh and ready for production use.',
        productsCount: 0,
        customersCount: 0,
        ordersCount: 0
      });
    } else {
      memoryProducts.length = 0;
      memoryCustomers.length = 0;
      memoryOrders.length = 0;

      return res.json({
        success: true,
        message: 'In-memory state cleared. System is fresh and ready for production use.',
        productsCount: 0,
        customersCount: 0,
        ordersCount: 0,
        isMemory: true
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
