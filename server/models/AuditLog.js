const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    email: String, // Keep email in case userId is not found (e.g., failed login for non-existent user)
    action: {
      type: String,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_SUCCESS',
        'EMAIL_VERIFICATION_REQUESTED',
        'EMAIL_VERIFIED',
        'TOKEN_REFRESH',
        'SUSPICIOUS_LOGIN_DETECTED',
        'ACCOUNT_LOCKED',
      ],
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING'],
      required: true,
    },
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// TTL index to keep audit logs for 90 days (adjustable based on compliance)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
