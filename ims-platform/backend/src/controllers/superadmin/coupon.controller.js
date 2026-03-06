'use strict';
const Coupon = require('../../models/superadmin/Coupon');

exports.list = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json({ coupons });
    } catch { res.status(500).json({ error: 'Failed to fetch coupons' }); }
};

exports.create = async (req, res) => {
    try {
        const data = { ...req.body, couponCode: req.body.couponCode?.toUpperCase(), createdBy: req.superAdmin._id };
        const coupon = await Coupon.create(data);
        res.status(201).json({ coupon });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
        res.status(500).json({ error: err.message || 'Failed to create coupon' });
    }
};

exports.update = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.json({ coupon });
    } catch { res.status(500).json({ error: 'Failed to update coupon' }); }
};

exports.remove = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ message: 'Coupon deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete coupon' }); }
};

exports.toggle = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        res.json({ coupon });
    } catch { res.status(500).json({ error: 'Failed to toggle coupon' }); }
};

exports.validate = async (req, res) => {
    try {
        const { code } = req.params;
        const coupon = await Coupon.findOne({ couponCode: code.toUpperCase() });
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        const validity = coupon.isValid();
        res.json({ valid: validity.valid, reason: validity.reason, coupon: validity.valid ? coupon : undefined });
    } catch { res.status(500).json({ error: 'Validation failed' }); }
};
