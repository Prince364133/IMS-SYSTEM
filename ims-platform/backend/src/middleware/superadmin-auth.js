'use strict';
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superadmin/SuperAdmin');

module.exports = async function superAdminAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Super admin authentication required' });
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.SUPER_ADMIN_JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: 'Super admin JWT secret not configured' });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch {
            return res.status(401).json({ error: 'Invalid or expired super admin token' });
        }
        if (decoded.role !== 'superadmin') {
            return res.status(403).json({ error: 'Access denied. Super admin only.' });
        }
        const admin = await SuperAdmin.findById(decoded.id).select('-passwordHash');
        if (!admin || !admin.isActive) {
            return res.status(401).json({ error: 'Super admin account not found or deactivated' });
        }
        req.superAdmin = admin;
        next();
    } catch (err) {
        console.error('superAdminAuth error:', err);
        res.status(500).json({ error: 'Authentication error' });
    }
};
