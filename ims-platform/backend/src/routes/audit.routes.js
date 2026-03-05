'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const AuditLog = require('../models/AuditLog');

// GET /api/audit — list audit logs (admin only)
router.get('/', protect, requireAdmin, async (req, res, next) => {
    try {
        const { page = 1, limit = 50, action, userId, startDate, endDate } = req.query;
        const query = {};
        if (action) query.action = new RegExp(action, 'i');
        if (userId) query.userId = userId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .populate('userId', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            AuditLog.countDocuments(query),
        ]);
        res.json({ logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) { next(err); }
});

// Utility to write audit log (used by other controllers)
router.log = async ({ userId, action, resourceType = '', resourceId = '', details = {}, req }) => {
    try {
        await AuditLog.create({
            userId,
            action,
            resourceType,
            resourceId: String(resourceId),
            details,
            ipAddress: req?.ip || '',
            userAgent: req?.headers?.['user-agent'] || '',
        });
    } catch (e) { /* swallow */ }
};

module.exports = router;
