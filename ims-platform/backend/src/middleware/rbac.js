'use strict';

/**
 * Role-based access control middleware factory.
 * Usage: router.get('/route', protect, requireRole('admin', 'hr'), handler)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
            });
        }
        next();
    };
}

// Convenience role guards
const requireAdmin = requireRole('admin');
const requireHR = requireRole('admin', 'hr');
const requireManager = requireRole('admin', 'manager', 'hr');
const requireEmployee = requireRole('admin', 'manager', 'hr', 'employee');
const requireClient = requireRole('admin', 'manager', 'hr', 'employee', 'client');

module.exports = { requireRole, requireAdmin, requireHR, requireManager, requireEmployee, requireClient };
