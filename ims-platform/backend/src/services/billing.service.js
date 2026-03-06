'use strict';

/**
 * Billing Service — Central subscription business logic (single-tenant)
 *
 * This is a single-tenant IMS. There is one company, one admin.
 * We use the first admin user's _id as the companyId reference in Subscription.
 * PlatformSettings holds global config (trialDays, Razorpay keys, SMTP).
 */

const Subscription = require('../models/superadmin/Subscription');
const Plan = require('../models/superadmin/Plan');
const PlatformSettings = require('../models/superadmin/PlatformSettings');
const Coupon = require('../models/superadmin/Coupon');
const User = require('../models/User');
const mongoose = require('mongoose');

// Sentinel ObjectId for the single tenant "company"
const SYSTEM_TENANT_ID = new mongoose.Types.ObjectId('000000000000000000000001');

// ─── Get or Create Default Plan ───────────────────────────────────────────────
async function getOrCreateDefaultPlan(settings) {
    let plan = await Plan.findOne({ isActive: true, price: 0 }).sort({ createdAt: 1 });
    if (!plan) plan = await Plan.findOne({ isActive: true }).sort({ price: 1 });

    if (!plan) {
        plan = await Plan.create({
            planName: 'Free Trial',
            price: 0,
            currency: 'INR',
            billingCycle: 'monthly',
            maxUsers: settings.maxFreeUsers || 10,
            features: ['Core IMS features', 'Project Management', 'HR Module', 'Attendance'],
            isActive: true,
        });
    }
    return plan;
}

// ─── Create Trial Subscription ────────────────────────────────────────────────
/**
 * Called on first admin signup. Creates the trial subscription for the system.
 */
exports.createTrialSubscription = async () => {
    const settings = await PlatformSettings.getInstance();
    const trialDays = settings.trialDays || 14;
    const plan = await getOrCreateDefaultPlan(settings);

    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Remove any old trial subscriptions (shouldn't exist, but be safe)
    await Subscription.deleteMany({ companyId: SYSTEM_TENANT_ID });

    const subscription = await Subscription.create({
        companyId: SYSTEM_TENANT_ID,
        planId: plan._id,
        status: 'trial',
        trialStartDate: now,
        trialEndDate,
        startDate: now,
        paymentStatus: 'pending',
    });

    return { subscription, trialDays };
};

// ─── Get Current Subscription (active or trial) ───────────────────────────────
exports.getActiveSubscription = async () => {
    return Subscription.findOne({
        companyId: SYSTEM_TENANT_ID,
        status: { $in: ['trial', 'active'] },
    }).populate('planId').sort({ createdAt: -1 });
};

// ─── Get Any Subscription (including expired) ─────────────────────────────────
exports.getCurrentSubscription = async () => {
    return Subscription.findOne({ companyId: SYSTEM_TENANT_ID })
        .populate('planId')
        .sort({ createdAt: -1 });
};

// ─── Trial Countdown ──────────────────────────────────────────────────────────
exports.getTrialCountdown = (subscription) => {
    if (!subscription) {
        return { daysLeft: 0, isExpired: true, isWarning: false, isTrialing: false, status: 'expired' };
    }

    if (subscription.status === 'active') {
        const endDate = subscription.subscriptionEndDate || subscription.renewalDate;
        if (!endDate) return { daysLeft: 999, isExpired: false, isWarning: false, isTrialing: false, status: 'active' };
        const msLeft = new Date(endDate) - new Date();
        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        return { daysLeft, isExpired: daysLeft === 0, isWarning: daysLeft <= 5, isTrialing: false, status: 'active' };
    }

    if (subscription.status === 'trial') {
        const msLeft = new Date(subscription.trialEndDate) - new Date();
        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        return { daysLeft, isExpired: daysLeft === 0, isWarning: daysLeft <= 5, isTrialing: true, status: 'trial' };
    }

    return { daysLeft: 0, isExpired: true, isWarning: false, isTrialing: false, status: subscription.status };
};

// ─── Enforce User Limit ───────────────────────────────────────────────────────
exports.enforceUserLimit = async () => {
    const sub = await exports.getActiveSubscription();
    if (!sub || !sub.planId) return { allowed: true, current: 0, max: Infinity };

    const maxUsers = sub.planId.maxUsers;
    if (!maxUsers || maxUsers <= 0) return { allowed: true, current: 0, max: Infinity };

    const current = await User.countDocuments({ isActive: true, deletedAt: null });
    const allowed = current < maxUsers;

    return { allowed, current, max: maxUsers, plan: sub.planId.planName };
};

// ─── Apply Coupon ─────────────────────────────────────────────────────────────
exports.applyCoupon = async (couponCode, originalAmount) => {
    if (!couponCode) return { discountAmount: 0, finalAmount: originalAmount, coupon: null };

    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw new Error('Invalid or inactive coupon code');

    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached');

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((originalAmount * coupon.discountValue) / 100);
    } else {
        discountAmount = Math.min(coupon.discountValue, originalAmount);
    }

    return { discountAmount, finalAmount: Math.max(0, originalAmount - discountAmount), coupon };
};

// ─── Process Successful Payment ───────────────────────────────────────────────
exports.processPayment = async ({ planId, razorpayOrderId, razorpayPaymentId, razorpaySignature, couponCode }) => {
    const crypto = require('crypto');
    const settings = await PlatformSettings.getInstance();
    const secret = settings.razorpaySecret; // decrypted via virtual getter

    if (!secret) throw new Error('Razorpay not configured');

    // Verify Razorpay signature
    const generated = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
    if (generated !== razorpaySignature) throw new Error('Payment verification failed: signature mismatch');

    const plan = await Plan.findById(planId);
    if (!plan) throw new Error('Plan not found');

    let discountAmount = 0;
    if (couponCode) {
        try {
            const result = await exports.applyCoupon(couponCode, plan.price);
            discountAmount = result.discountAmount;
            await Coupon.findOneAndUpdate({ couponCode: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
        } catch { /* ignore coupon errors on verify */ }
    }

    const now = new Date();
    const subEndDate = new Date(now);
    subEndDate.setDate(subEndDate.getDate() + (plan.billingCycle === 'yearly' ? 365 : 30));

    // Deactivate old subscriptions
    await Subscription.updateMany({ companyId: SYSTEM_TENANT_ID, status: { $in: ['trial', 'active'] } }, { status: 'cancelled' });

    const subscription = await Subscription.create({
        companyId: SYSTEM_TENANT_ID,
        planId,
        status: 'active',
        subscriptionStartDate: now,
        subscriptionEndDate: subEndDate,
        startDate: now,
        renewalDate: subEndDate,
        paymentId: razorpayPaymentId,
        razorpayOrderId,
        paymentStatus: 'paid',
        amount: plan.price - discountAmount,
        currency: plan.currency || 'INR',
        couponApplied: couponCode ? couponCode.toUpperCase() : undefined,
        discountAmount,
    });

    return { subscription, plan, discountAmount };
};

exports.SYSTEM_TENANT_ID = SYSTEM_TENANT_ID;
