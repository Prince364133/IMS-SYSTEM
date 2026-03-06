'use strict';
const Company = require('../../models/superadmin/Company');
const Subscription = require('../../models/superadmin/Subscription');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');

exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status } = req.query;
        const filter = {};
        if (search) filter.$or = [
            { companyName: { $regex: search, $options: 'i' } },
            { adminEmail: { $regex: search, $options: 'i' } },
        ];
        if (status) filter.subscriptionStatus = status;
        const [companies, total] = await Promise.all([
            Company.find(filter).populate('subscriptionPlan', 'planName price').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Company.countDocuments(filter),
        ]);
        res.json({ companies, total, page: Number(page), totalPages: Math.ceil(total / limit) });
    } catch (err) { res.status(500).json({ error: 'Failed to list companies' }); }
};

exports.getOne = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id).populate('subscriptionPlan');
        if (!company) return res.status(404).json({ error: 'Company not found' });
        const subscriptions = await Subscription.find({ companyId: company._id }).populate('planId', 'planName price').sort({ createdAt: -1 }).limit(10);
        res.json({ company: { ...company.toObject(), mongoUri: company.getMaskedUri() }, subscriptions });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch company' }); }
};

exports.suspend = async (req, res) => {
    try {
        const { reason } = req.body;
        const company = await Company.findByIdAndUpdate(req.params.id, {
            isSuspended: true, subscriptionStatus: 'suspended', suspendedReason: reason, suspendedAt: new Date(),
        }, { new: true });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        res.json({ message: 'Company suspended', company });
    } catch (err) { res.status(500).json({ error: 'Failed to suspend company' }); }
};

exports.unsuspend = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, {
            isSuspended: false, subscriptionStatus: 'active', suspendedReason: null, suspendedAt: null,
        }, { new: true });
        if (!company) return res.status(404).json({ error: 'Company not found' });
        res.json({ message: 'Company unsuspended', company });
    } catch (err) { res.status(500).json({ error: 'Failed to unsuspend company' }); }
};

exports.deleteCompany = async (req, res) => {
    try {
        const { confirm } = req.body;
        if (confirm !== 'DELETE') return res.status(400).json({ error: 'Please type DELETE to confirm' });
        await Company.findByIdAndDelete(req.params.id);
        res.json({ message: 'Company deleted permanently' });
    } catch (err) { res.status(500).json({ error: 'Failed to delete company' }); }
};

exports.resetAdminPassword = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ error: 'Company not found' });
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
        const hashed = await bcrypt.hash(newPassword, 12);
        await User.findOneAndUpdate({ email: company.adminEmail }, { password: hashed });
        res.json({ message: `Admin password reset for ${company.adminEmail}` });
    } catch (err) { res.status(500).json({ error: 'Failed to reset password' }); }
};

exports.create = async (req, res) => {
    try {
        const company = await Company.create(req.body);
        res.status(201).json({ company });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Company with this email already exists' });
        res.status(500).json({ error: 'Failed to create company' });
    }
};
