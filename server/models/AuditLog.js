const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    default: 'Operator'
  },
  userRole: {
    type: String,
    default: 'Store Admin'
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'CONVERT', 'OVERRIDE', 'LOGIN', 'EXPORT'],
    required: true,
    index: true
  },
  collectionName: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
