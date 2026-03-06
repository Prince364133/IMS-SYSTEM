'use strict';

/**
 * Subscription Cron Service — Single-tenant
 * Runs daily to expire overdue subscriptions and send reminder emails.
 */

const cron = require('node-cron');
const Subscription = require('../models/superadmin/Subscription');
const User = require('../models/User');
const EmailService = require('./email.service');
const BillingService = require('./billing.service');

const REMINDER_DAYS = [5, 4, 3, 2, 1];

// ─── Get Admin Email ──────────────────────────────────────────────────────────
async function getAdminUser() {
    return User.findOne({ roles: 'admin', isActive: true, deletedAt: null }).sort({ createdAt: 1 });
}

// ─── Expire Stale Subscriptions ───────────────────────────────────────────────
async function expireSubscriptions() {
    const now = new Date();

    // Expire trials
    const expiredTrials = await Subscription.find({ status: 'trial', trialEndDate: { $lt: now } });
    for (const sub of expiredTrials) {
        sub.status = 'expired';
        await sub.save();
        try {
            const admin = await getAdminUser();
            if (admin) await EmailService.sendTrialExpiredEmail(admin.email, admin.name);
        } catch { /* non-fatal */ }
    }

    // Expire paid subscriptions
    const expiredPaid = await Subscription.find({ status: 'active', subscriptionEndDate: { $lt: now } });
    for (const sub of expiredPaid) {
        sub.status = 'expired';
        await sub.save();
    }

    const total = expiredTrials.length + expiredPaid.length;
    if (total > 0) console.log(`[SubscriptionCron] Expired ${total} subscription(s)`);
}

// ─── Send Expiry Reminders ────────────────────────────────────────────────────
async function sendExpiryReminders() {
    const now = new Date();
    let reminderCount = 0;
    const admin = await getAdminUser();
    if (!admin) return;

    for (const daysLeft of REMINDER_DAYS) {
        const windowStart = new Date(now);
        const windowEnd = new Date(now);
        windowStart.setDate(windowStart.getDate() + daysLeft);
        windowStart.setHours(0, 0, 0, 0);
        windowEnd.setDate(windowEnd.getDate() + daysLeft);
        windowEnd.setHours(23, 59, 59, 999);

        // Trial reminders
        const trialSubs = await Subscription.find({
            status: 'trial',
            trialEndDate: { $gte: windowStart, $lte: windowEnd },
        });

        for (const sub of trialSubs) {
            if (sub.remindersSent.some(r => r.type === 'trial' && r.daysLeft === daysLeft)) continue;
            try {
                await EmailService.sendTrialReminderEmail(admin.email, admin.name, daysLeft);
                sub.remindersSent.push({ type: 'trial', daysLeft });
                await sub.save();
                reminderCount++;
            } catch (e) { console.error('[SubscriptionCron] Trial reminder error:', e.message); }
        }

        // Paid subscription reminders
        const paidSubs = await Subscription.find({
            status: 'active',
            subscriptionEndDate: { $gte: windowStart, $lte: windowEnd },
        }).populate('planId');

        for (const sub of paidSubs) {
            if (sub.remindersSent.some(r => r.type === 'subscription' && r.daysLeft === daysLeft)) continue;
            try {
                const planName = sub.planId?.planName || 'Subscription';
                await EmailService.sendRenewalReminderEmail(admin.email, admin.name, planName, daysLeft, sub.subscriptionEndDate);
                sub.remindersSent.push({ type: 'subscription', daysLeft });
                await sub.save();
                reminderCount++;
            } catch (e) { console.error('[SubscriptionCron] Renewal reminder error:', e.message); }
        }
    }

    if (reminderCount > 0) console.log(`[SubscriptionCron] Sent ${reminderCount} reminder email(s)`);
}

// ─── Run All Jobs ─────────────────────────────────────────────────────────────
async function runAllJobs() {
    console.log('[SubscriptionCron] Running...');
    try {
        await expireSubscriptions();
        await sendExpiryReminders();
        console.log('[SubscriptionCron] Done.');
    } catch (err) {
        console.error('[SubscriptionCron] Job error:', err.message);
    }
}

// ─── Start Cron ───────────────────────────────────────────────────────────────
exports.start = () => {
    // Daily at 08:00 IST = 02:30 UTC
    cron.schedule('30 2 * * *', runAllJobs, { timezone: 'UTC' });
    console.log('[SubscriptionCron] Scheduled — runs daily at 08:00 IST');
};

exports.runNow = runAllJobs;
