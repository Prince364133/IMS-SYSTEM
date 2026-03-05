const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();

        // Auto-create initial settings if they don't exist yet
        if (!settings) {
            settings = await Settings.create({
                companyName: 'Instaura IMS',
                logoUrl: '',
                themeColor: '#cf1d29',
            });
        }
        res.json({ settings });
    } catch (error) {
        console.error('Get Settings error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can update platform settings' });
        }

        const { companyName, logoUrl, themeColor } = req.body;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        if (companyName !== undefined) settings.companyName = companyName;
        if (logoUrl !== undefined) settings.logoUrl = logoUrl;
        if (themeColor !== undefined) settings.themeColor = themeColor;

        await settings.save();
        res.json({ settings, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update Settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
