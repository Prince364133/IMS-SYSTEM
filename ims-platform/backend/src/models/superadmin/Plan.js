'use strict';
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    planName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' },
    maxUsers: { type: Number, default: 10 },
    maxProjects: { type: Number, default: 5 },
    maxStorageGB: { type: Number, default: 5 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    trialDays: { type: Number, default: 0 },
    razorpayPlanId: { type: String }, // Razorpay plan ID for recurring billing
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
