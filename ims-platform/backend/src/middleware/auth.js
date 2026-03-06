'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — verifies JWT Bearer token, attaches req.user
 */
async function protect(req, res, next) {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token) {
            return res.status(401).json({ error: 'Authentication required. Please log in.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('+mfaSecret').lean();

        if (!user) {
            return res.status(401).json({ error: 'User no longer exists.' });
        }

        if (!user.isActive) {
            return res.status(401).json({ error: 'Your account has been deactivated.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please refresh your session.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        next(err);
    }
}

/**
 * Sign an access token
 */
function signAccessToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 15}m`,
    });
}

/**
 * Sign a refresh token
 */
function signRefreshToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE_DAYS || 7}d`,
    });
}

/**
 * Authorize roles
 * @param  {...string} roles
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `User role ${req.user?.role || 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
}

/**
 * Require Admin or HR role
 */
function requireAdminOrHR(req, res, next) {
    if (req.user && ['admin', 'hr'].includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ error: 'Requires Admin or HR privileges' });
}

module.exports = { protect, authorize, signAccessToken, signRefreshToken, requireAdminOrHR };
