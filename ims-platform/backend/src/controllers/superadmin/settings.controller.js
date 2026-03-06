'use strict';
const PlatformSettings = require('../../models/superadmin/PlatformSettings');

exports.get = async (req, res) => {
    try {
        const settings = await PlatformSettings.getInstance();
        const safe = settings.toObject();
        delete safe._razorpayKeyId; delete safe._razorpaySecret; delete safe._razorpayWebhookSecret; delete safe._smtpPass;
        res.json({ settings: safe });
    } catch { res.status(500).json({ error: 'Failed to fetch settings' }); }
};

exports.update = async (req, res) => {
    try {
        const settings = await PlatformSettings.getInstance();
        const allowed = ['platformName', 'maintenanceMode', 'maintenanceMessage', 'maxFreeUsers', 'supportEmail', 'logoUrl', 'faviconUrl', 'currency', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpFrom', 'allowSelfRegistration', 'trialDays', 'defaultPlanId', 'smtpPass'];
        allowed.forEach(k => { if (req.body[k] !== undefined) settings[k] = req.body[k]; });
        await settings.save();
        res.json({ message: 'Settings updated' });
    } catch { res.status(500).json({ error: 'Failed to update settings' }); }
};

exports.toggleMaintenance = async (req, res) => {
    try {
        const settings = await PlatformSettings.getInstance();
        settings.maintenanceMode = !settings.maintenanceMode;
        await settings.save();
        res.json({ maintenanceMode: settings.maintenanceMode, message: `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'}` });
    } catch { res.status(500).json({ error: 'Failed to toggle maintenance' }); }
};
