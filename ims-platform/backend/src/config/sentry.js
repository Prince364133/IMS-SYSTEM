'use strict';

const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [nodeProfilingIntegration()],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
        profilesSampleRate: 1.0,
    });
    console.log('✅ Sentry error tracking initialized');
} else {
    console.warn('⚠️  SENTRY_DSN not set — error tracking disabled');
    // Provide no-op handlers so server.js doesn't break
    Sentry.Handlers = {
        requestHandler: () => (req, res, next) => next(),
        errorHandler: () => (err, req, res, next) => next(err),
    };
}

module.exports = Sentry;
