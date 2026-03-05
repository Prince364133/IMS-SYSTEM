'use strict';

const AuditLog = require('../models/AuditLog');

/**
 * Log an action to the AuditLog collection.
 * Designed to be called from controllers after successful operations.
 */
async function logAction(userId, action, resourceType = '', resourceId = '', details = {}, req = null) {
    try {
        await AuditLog.create({
            userId,
            action,
            resourceType,
            resourceId: String(resourceId),
            details,
            ipAddress: req?.ip || '',
            userAgent: req?.get?.('user-agent') || '',
        });
    } catch (err) {
        // Never throw — audit logging should never break the main flow
        console.error('[Audit] Failed to log action:', err.message);
    }
}

module.exports = { logAction };
