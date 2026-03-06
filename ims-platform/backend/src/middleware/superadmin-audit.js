'use strict';
const ActivityLog = require('../models/superadmin/ActivityLog');

// Auto-logs every non-GET request made by a super admin
module.exports = function superAdminAudit(req, res, next) {
    const originalSend = res.json.bind(res);
    res.json = function (body) {
        // Log only successful mutating requests
        if (req.method !== 'GET' && req.superAdmin) {
            ActivityLog.create({
                superAdminId: req.superAdmin._id,
                action: `${req.method} ${req.path}`,
                resource: req.path.split('/')[1] || 'unknown',
                resourceId: req.params?.id || null,
                details: {
                    body: sanitizeBody(req.body),
                    statusCode: res.statusCode,
                },
                ipAddress: req.ip || req.headers['x-forwarded-for'],
                userAgent: req.headers['user-agent'],
                success: res.statusCode < 400,
            }).catch(err => console.error('ActivityLog write error:', err));
        }
        return originalSend(body);
    };
    next();
};

function sanitizeBody(body) {
    if (!body) return {};
    const safe = { ...body };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'razorpaySecret', 'smtpPass', 'mongoUri'];
    sensitiveKeys.forEach(k => { if (safe[k]) safe[k] = '***'; });
    return safe;
}
