const AuditLog = require('../models/AuditLog');
const { getIsConnected } = require('../config/db');

let memoryAuditLogs = [];

// Helper to log an immutable audit event
const logAudit = async ({ userId, userName, userRole, action, collectionName, documentId = '', details = '', ipAddress = '' }) => {
  try {
    const payload = {
      userId,
      userName: userName || 'Operator',
      userRole: userRole || 'Staff',
      action,
      collectionName,
      documentId: documentId ? documentId.toString() : '',
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress,
      timestamp: new Date()
    };

    if (getIsConnected()) {
      await AuditLog.create(payload);
    } else {
      memoryAuditLogs.unshift({ _id: 'audit_' + Date.now(), id: 'audit_' + Date.now(), ...payload });
      if (memoryAuditLogs.length > 200) memoryAuditLogs.pop();
    }
  } catch (err) {
    console.error('[Audit Log Failure]:', err.message);
  }
};

// GET /api/audit/logs
const getAuditLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const { action, collectionName } = req.query;

    if (getIsConnected()) {
      let query = { userId };
      if (action && action !== 'All') query.action = action;
      if (collectionName && collectionName !== 'All') query.collectionName = collectionName;

      const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
      return res.json({ success: true, count: logs.length, data: logs });
    } else {
      let list = memoryAuditLogs.filter(l => l.userId && l.userId.toString() === userId);
      if (action && action !== 'All') list = list.filter(l => l.action === action);
      if (collectionName && collectionName !== 'All') list = list.filter(l => l.collectionName === collectionName);
      return res.json({ success: true, count: list.length, data: list, isMemory: true });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  logAudit,
  getAuditLogs
};
