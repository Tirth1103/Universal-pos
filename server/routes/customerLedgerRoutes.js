const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCustomerLedger,
  recordCustomerPayment,
  checkCreditLimit,
  updateCustomerSettings
} = require('../controllers/customerLedgerController');

router.use(protect);

router.get('/customer/:id', getCustomerLedger);
router.post('/customer/:id/payment', recordCustomerPayment);
router.get('/check-credit/:id', checkCreditLimit);
router.put('/customer/:id/settings', updateCustomerSettings);

module.exports = router;
