const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGSTR1,
  getGSTR2,
  getGSTR3B,
  exportGSTReport,
  generateEInvoiceStub
} = require('../controllers/gstController');

router.use(protect);

router.get('/reports/gstr1', getGSTR1);
router.get('/reports/gstr2', getGSTR2);
router.get('/reports/gstr3b', getGSTR3B);
router.get('/reports/export/:reportType', exportGSTReport);
router.post('/einvoice-eway/generate-stub', generateEInvoiceStub);

module.exports = router;
