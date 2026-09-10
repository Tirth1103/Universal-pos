const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getVendors,
  createVendor,
  getVendorLedger,
  recordVendorPayment
} = require('../controllers/vendorController');

router.use(protect);

router.get('/', getVendors);
router.post('/', createVendor);
router.get('/:id/ledger', getVendorLedger);
router.post('/:id/payment', recordVendorPayment);

module.exports = router;
