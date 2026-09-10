const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getDocuments,
  getDocumentById,
  createDocument,
  convertToInvoice,
  generateDocumentPdf,
  dispatchDocument
} = require('../controllers/salesDocumentController');

router.use(protect);

router.get('/', getDocuments);
router.post('/', createDocument);
router.get('/:id', getDocumentById);
router.post('/:id/convert-to-invoice', convertToInvoice);
router.get('/:id/pdf', generateDocumentPdf);
router.post('/:id/dispatch', dispatchDocument);

module.exports = router;
