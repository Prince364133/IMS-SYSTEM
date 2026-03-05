'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        action: { type: String, required: true }, // e.g. 'CREATE_PROJECT', 'LOGIN', 'DELETE_USER'
        resourceType: { type: String, default: '' }, // 'project', 'user', 'task'
        resourceId: { type: String, default: '' },
        details: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra context
        ipAddress: { type: String, default: '' },
        userAgent: { type: String, default: '' },
    },
    { timestamps: true }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
