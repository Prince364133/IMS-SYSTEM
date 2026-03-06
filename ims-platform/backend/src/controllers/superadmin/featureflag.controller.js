'use strict';
const FeatureFlag = require('../../models/superadmin/FeatureFlag');

const DEFAULT_FLAGS = [
    { flagKey: 'enable_ai', label: 'AI Module', description: 'Enable AI document analysis and chat features', category: 'ai' },
    { flagKey: 'enable_chat', label: 'Team Chat', description: 'Enable real-time team chat system', category: 'communication' },
    { flagKey: 'enable_automation', label: 'Automation Module', description: 'Enable workflow automation features', category: 'general' },
    { flagKey: 'enable_google_drive', label: 'Google Drive Storage', description: 'Allow companies to connect Google Drive for storage', category: 'storage' },
    { flagKey: 'enable_cloudinary', label: 'Cloudinary Storage', description: 'Allow companies to use Cloudinary for media uploads', category: 'storage' },
    { flagKey: 'enable_razorpay', label: 'Razorpay Payments', description: 'Enable subscription billing via Razorpay', category: 'billing' },
    { flagKey: 'enable_mfa', label: 'Multi-Factor Authentication', description: 'Enable MFA for all users', category: 'security' },
    { flagKey: 'enable_support_tickets', label: 'Support Tickets', description: 'Allow companies to raise support tickets', category: 'general' },
];

exports.list = async (req, res) => {
    try {
        let flags = await FeatureFlag.find().sort({ category: 1, label: 1 });
        // Seed defaults if empty
        if (flags.length === 0) {
            flags = await FeatureFlag.insertMany(DEFAULT_FLAGS);
        }
        res.json({ flags });
    } catch { res.status(500).json({ error: 'Failed to fetch feature flags' }); }
};

exports.create = async (req, res) => {
    try {
        const flag = await FeatureFlag.create({ ...req.body, updatedBy: req.superAdmin._id });
        res.status(201).json({ flag });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Flag key already exists' });
        res.status(500).json({ error: 'Failed to create flag' });
    }
};

exports.toggle = async (req, res) => {
    try {
        const flag = await FeatureFlag.findById(req.params.id);
        if (!flag) return res.status(404).json({ error: 'Flag not found' });
        flag.isEnabled = !flag.isEnabled;
        flag.updatedBy = req.superAdmin._id;
        await flag.save();
        res.json({ flag });
    } catch { res.status(500).json({ error: 'Failed to toggle flag' }); }
};

exports.remove = async (req, res) => {
    try {
        await FeatureFlag.findByIdAndDelete(req.params.id);
        res.json({ message: 'Feature flag deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete flag' }); }
};
