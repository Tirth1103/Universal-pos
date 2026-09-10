const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPurchaseBills,
  createPurchaseBill,
  createDebitNote,
  getDebitNotes
} = require('../controllers/purchaseController');

router.use(protect);

router.get('/bills', getPurchaseBills);
router.post('/bills', createPurchaseBill);
router.get('/debit-notes', getDebitNotes);
router.post('/debit-notes', createDebitNote);

module.exports = router;
