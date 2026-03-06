'use strict';
const PlatformSettings = require('../../models/superadmin/PlatformSettings');

exports.getConfig = async (req, res) => {
    try {
        const settings = await PlatformSettings.getInstance();
        const safe = settings.toObject();
        // Mask sensitive fields
        if (safe._razorpayKeyId) safe.razorpayKeyId = settings.razorpayKeyId ? '***configured***' : '';
        if (safe._razorpaySecret) safe.razorpaySecret = settings.razorpaySecret ? '***configured***' : '';
        if (safe._razorpayWebhookSecret) safe.razorpayWebhookSecret = settings.razorpayWebhookSecret ? '***configured***' : '';
        delete safe._razorpayKeyId; delete safe._razorpaySecret; delete safe._razorpayWebhookSecret; delete safe._smtpPass;
        res.json({ config: safe });
    } catch { res.status(500).json({ error: 'Failed to get payment config' }); }
};

exports.updateConfig = async (req, res) => {
    try {
        const settings = await PlatformSettings.getInstance();
        const { razorpayKeyId, razorpaySecret, razorpayWebhookSecret, paymentsEnabled, currency } = req.body;
        if (razorpayKeyId) settings.razorpayKeyId = razorpayKeyId;
        if (razorpaySecret) settings.razorpaySecret = razorpaySecret;
        if (razorpayWebhookSecret) settings.razorpayWebhookSecret = razorpayWebhookSecret;
        if (paymentsEnabled !== undefined) settings.paymentsEnabled = paymentsEnabled;
        if (currency) settings.currency = currency;
        await settings.save();
        res.json({ message: 'Payment config updated' });
    } catch { res.status(500).json({ error: 'Failed to update config' }); }
};

exports.testConnection = async (req, res) => {
    try {
        const settings = await PlatformSettings.getInstance();
        const keyId = settings.razorpayKeyId;
        const secret = settings.razorpaySecret;
        if (!keyId || !secret) return res.status(400).json({ error: 'Razorpay credentials not configured' });
        // Simple test — try to fetch balance from Razorpay API
        const axios = require('axios');
        const resp = await axios.get('https://api.razorpay.com/v1/accounts', {
            auth: { username: keyId, password: secret },
            timeout: 5000,
        }).catch(err => err.response);
        const connected = resp?.status === 200 || resp?.status === 403; // 403 = valid keys but no permission
        res.json({ connected, message: connected ? 'Razorpay connection successful' : 'Invalid Razorpay credentials' });
    } catch (err) {
        res.json({ connected: false, message: err.message });
    }
};
