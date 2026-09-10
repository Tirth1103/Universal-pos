const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getCustomers);
router.post('/', createCustomer);

module.exports = router;
