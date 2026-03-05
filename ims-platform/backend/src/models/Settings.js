const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'Instaura IMS',
    },
    logoUrl: {
        type: String,
        default: '',
    },
    themeColor: {
        type: String,
        default: '#cf1d29',
    },
    webhookUrl: {
        type: String,
        default: '',
    },
    webhookSecret: {
        type: String,
        default: '',
    },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
