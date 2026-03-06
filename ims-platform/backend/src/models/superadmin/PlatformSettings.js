'use strict';
const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'default_32_char_key_must_change!!').slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const [ivHex, encHex] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encBuf = Buffer.from(encHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encBuf);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch { return ''; }
}

const platformSettingsSchema = new mongoose.Schema({
    platformName: { type: String, default: 'Instaura IMS' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'System is under maintenance. Please try again shortly.' },
    defaultPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    maxFreeUsers: { type: Number, default: 5 },
    supportEmail: { type: String, default: 'support@instaura.com' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    // Razorpay — encrypted at rest
    _razorpayKeyId: { type: String },
    _razorpaySecret: { type: String },
    _razorpayWebhookSecret: { type: String },
    paymentsEnabled: { type: Boolean, default: false },
    // SMTP
    smtpHost: { type: String },
    smtpPort: { type: Number },
    smtpUser: { type: String },
    _smtpPass: { type: String },
    smtpFrom: { type: String },
    // Feature
    allowSelfRegistration: { type: Boolean, default: true },
    trialDays: { type: Number, default: 14 },
}, { timestamps: true });

// Encrypted field virtuals
['razorpayKeyId', 'razorpaySecret', 'razorpayWebhookSecret', 'smtpPass'].forEach(field => {
    const dbField = '_' + field;
    platformSettingsSchema.virtual(field).set(function (val) { this[dbField] = encrypt(val); });
    platformSettingsSchema.virtual(field).get(function () { return decrypt(this[dbField]); });
});

platformSettingsSchema.statics.getInstance = async function () {
    let settings = await this.findOne();
    if (!settings) settings = await this.create({});
    return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
