'use strict';

/**
 * Subscription Guard Middleware
 * Returns 403 with { subscriptionExpired: true } if subscription has expired.
 */

const BillingService = require('../services/billing.service');

module.exports = async function subscriptionGuard(req, res, next) {
    try {
        // Bypass for billing, auth, health, and super admin routes
        const url = req.originalUrl || req.path;
        const bypassPrefixes = ['/api/billing', '/api/auth', '/health', '/api/superadmin', '/api/support', '/api/webhooks'];
        if (bypassPrefixes.some(p => url.startsWith(p))) return next();
        if (!req.user) return next();

        const sub = await BillingService.getCurrentSubscription();
        if (!sub) return next(); // No subscription yet — allow (edge case for new install)

        const countdown = BillingService.getTrialCountdown(sub);
        if (countdown.isExpired) {
            return res.status(403).json({
                subscriptionExpired: true,
                status: sub.status,
                message: 'Your subscription has expired. Please upgrade to continue.',
                upgradeUrl: '/dashboard/billing',
            });
        }

        req.subscription = countdown;
        next();
    } catch (err) {
        // Fail open — never block requests due to billing errors
        console.error('[SubscriptionGuard] Error:', err.message);
        next();
    }
};

