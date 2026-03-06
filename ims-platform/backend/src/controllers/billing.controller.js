'use strict';

/**
 * Billing Controller — Company admin subscription management
 */

const BillingService = require('../services/billing.service');
const Plan = require('../models/superadmin/Plan');
const PlatformSettings = require('../models/superadmin/PlatformSettings');
const Subscription = require('../models/superadmin/Subscription');
const EmailService = require('../services/email.service');

// ─── GET /api/billing — Current subscription status ───────────────────────────
exports.getStatus = async (req, res, next) => {
    try {
        const sub = await BillingService.getCurrentSubscription();
        const countdown = BillingService.getTrialCountdown(sub);
        const settings = await PlatformSettings.getInstance();

        res.json({
            subscription: sub,
            plan: sub?.planId || null,
            ...countdown,
            paymentsEnabled: settings.paymentsEnabled,
            currency: settings.currency || 'INR',
        });
    } catch (err) { next(err); }
};

// ─── GET /api/billing/plans — Available plans for upgrade ────────────────────
exports.getPlans = async (req, res, next) => {
    try {
        const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
        res.json({ plans });
    } catch (err) { next(err); }
};

// ─── POST /api/billing/order — Create Razorpay order ─────────────────────────
exports.createOrder = async (req, res, next) => {
    try {
        const { planId, couponCode } = req.body;
        if (!planId) return res.status(400).json({ error: 'Plan ID required' });

        const plan = await Plan.findById(planId);
        if (!plan || !plan.isActive) return res.status(404).json({ error: 'Plan not found or inactive' });

        const settings = await PlatformSettings.getInstance();
        if (!settings.paymentsEnabled) return res.status(403).json({ error: 'Payments are not enabled. Contact support.' });
        if (!settings.razorpayKeyId) return res.status(500).json({ error: 'Payment gateway not configured. Please set up Razorpay in Super Admin → Payments.' });

        // Apply coupon to get final amount
        let finalAmount = plan.price;
        let discountAmount = 0;
        if (couponCode) {
            try {
                const result = await BillingService.applyCoupon(couponCode, plan.price);
                finalAmount = result.finalAmount;
                discountAmount = result.discountAmount;
            } catch (e) { return res.status(400).json({ error: e.message }); }
        }

        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
            key_id: settings.razorpayKeyId,
            key_secret: settings.razorpaySecret,
        });

        const amountInPaise = Math.round(finalAmount * 100);
        if (amountInPaise < 100) return res.status(400).json({ error: 'Minimum order amount is ₹1' });

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: settings.currency || 'INR',
            receipt: `sub_${Date.now()}`,
            notes: { planId: planId.toString(), couponCode: couponCode || '' },
        });

        res.json({
            orderId: order.id,
            amount: finalAmount,
            originalAmount: plan.price,
            discountAmount,
            currency: order.currency,
            keyId: settings.razorpayKeyId,
            planName: plan.planName,
        });
    } catch (err) { next(err); }
};

// ─── POST /api/billing/verify — Verify & activate subscription ────────────────
exports.verifyPayment = async (req, res, next) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId, couponCode } = req.body;
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planId) {
            return res.status(400).json({ error: 'Missing required fields: razorpayOrderId, razorpayPaymentId, razorpaySignature, planId' });
        }

        const result = await BillingService.processPayment({
            planId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            couponCode,
        });

        // Send confirmation email
        try {
            await EmailService.sendSubscriptionConfirmationEmail(
                req.user.email,
                req.user.name,
                result.plan.planName,
                result.subscription.amount,
                result.subscription.subscriptionEndDate
            );
        } catch { /* non-fatal */ }

        res.json({
            success: true,
            subscription: result.subscription,
            plan: result.plan,
            message: `${result.plan.planName} plan activated successfully!`,
        });
    } catch (err) {
        if (err.message.includes('signature mismatch')) return res.status(400).json({ error: err.message });
        next(err);
    }
};

// ─── POST /api/billing/coupon — Validate coupon code ────────────────────────
exports.validateCoupon = async (req, res, next) => {
    try {
        const { couponCode, planId } = req.body;
        if (!couponCode || !planId) return res.status(400).json({ error: 'Coupon code and plan ID required' });

        const plan = await Plan.findById(planId);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const result = await BillingService.applyCoupon(couponCode.toUpperCase(), plan.price);
        res.json({
            valid: true,
            couponCode: couponCode.toUpperCase(),
            discountAmount: result.discountAmount,
            finalAmount: result.finalAmount,
            originalAmount: plan.price,
            discountType: result.coupon.discountType,
            discountValue: result.coupon.discountValue,
        });
    } catch (err) {
        if (err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('limit')) {
            return res.status(400).json({ error: err.message });
        }
        next(err);
    }
};

// ─── POST /api/billing/cron-test — Manual cron trigger (debug) ────────────
exports.triggerCron = async (req, res, next) => {
    try {
        const CronService = require('../services/subscriptionCron.service');
        await CronService.runNow();
        res.json({ message: 'Cron job ran manually — check server logs' });
    } catch (err) { next(err); }
};
