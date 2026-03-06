'use strict';
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxUses: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    applicablePlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }], // empty = all plans
    expiresAt: { type: Date, default: null }, // null = never
    isActive: { type: Boolean, default: true },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, { timestamps: true });

couponSchema.methods.isValid = function () {
    if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
    if (this.expiresAt && this.expiresAt < new Date()) return { valid: false, reason: 'Coupon has expired' };
    if (this.maxUses !== null && this.usedCount >= this.maxUses) return { valid: false, reason: 'Coupon usage limit reached' };
    return { valid: true };
};

module.exports = mongoose.model('Coupon', couponSchema);
