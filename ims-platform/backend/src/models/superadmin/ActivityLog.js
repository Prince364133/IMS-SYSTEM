'use strict';
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    superAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    action: { type: String, required: true }, // e.g. 'CREATE_PLAN', 'SUSPEND_COMPANY'
    resource: { type: String }, // e.g. 'Plan', 'Company'
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

activityLogSchema.index({ superAdminId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
