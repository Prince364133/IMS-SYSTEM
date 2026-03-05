'use strict';

const Sentry = require('../config/sentry');

/**
 * Global Express error handler.
 * MUST be last middleware registered in server.js (after Sentry).
 */
function errorHandler(err, req, res, next) {
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('[ErrorHandler]', err);
    }

    // Capture unhandled errors in Sentry (if not already captured)
    if (process.env.SENTRY_DSN && err.status !== 401 && err.status !== 403) {
        Sentry.captureException(err);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ error: 'Validation failed', details: messages });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({ error: `Duplicate value for '${field}'.` });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ error: `Invalid ID format: ${err.value}` });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({ error: message });
}

module.exports = errorHandler;
