'use strict';
const ActivityLog = require('../../models/superadmin/ActivityLog');
const User = require('../../models/User');

exports.activityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const [logs, total] = await Promise.all([
            ActivityLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).populate('superAdminId', 'name email'),
            ActivityLog.countDocuments(),
        ]);
        res.json({ logs, total });
    } catch { res.status(500).json({ error: 'Failed to fetch activity logs' }); }
};

exports.failedLogins = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const [logs, total] = await Promise.all([
            ActivityLog.find({ action: { $regex: 'login', $options: 'i' }, success: false }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            ActivityLog.countDocuments({ action: { $regex: 'login', $options: 'i' }, success: false }),
        ]);
        res.json({ logs, total });
    } catch { res.status(500).json({ error: 'Failed to fetch error logs' }); }
};
