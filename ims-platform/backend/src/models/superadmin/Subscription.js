'use strict';
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
        type: String,
        enum: ['active', 'trial', 'cancelled', 'past_due', 'expired'],
        default: 'trial',
    },
    // Trial period
    trialStartDate: { type: Date },
    trialEndDate: { type: Date },

    // Paid period
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },

    // Legacy aliases kept for compatibility
    startDate: { type: Date, default: Date.now },
    renewalDate: { type: Date },
    endDate: { type: Date },

    // Payment
    paymentId: { type: String },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: { type: String },
    razorpaySubscriptionId: { type: String },
    amount: { type: Number },
    currency: { type: String, default: 'INR' },
    couponApplied: { type: String },
    discountAmount: { type: Number, default: 0 },

    // Reminder tracking — prevents duplicate emails
    remindersSent: [{
        type: { type: String }, // 'trial' | 'subscription'
        daysLeft: { type: Number },
        sentAt: { type: Date, default: Date.now },
    }],

    notes: { type: String },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
}, { timestamps: true });

subscriptionSchema.index({ companyId: 1, status: 1 });
subscriptionSchema.index({ trialEndDate: 1, status: 1 });
subscriptionSchema.index({ subscriptionEndDate: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
