const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLowStockAndExpiry,
  createStockAdjustment,
  getStockAdjustments,
  exportCatalogExcel,
  importCatalog
} = require('../controllers/inventoryAdvancedController');

router.use(protect);

router.get('/low-stock-and-expiry', getLowStockAndExpiry);
router.post('/adjustments', createStockAdjustment);
router.get('/adjustments', getStockAdjustments);
router.get('/export-catalog', exportCatalogExcel);
router.post('/import-catalog', importCatalog);

module.exports = router;
