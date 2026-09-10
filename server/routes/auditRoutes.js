const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getAuditLogs } = require('../controllers/auditController');

router.use(protect);

router.get('/logs', getAuditLogs);

module.exports = router;
