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

const companySchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    adminName: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, lowercase: true, trim: true },
    adminPasswordHash: { type: String, required: true, select: false },
    _mongoUri: { type: String }, // encrypted
    subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'trial', 'suspended', 'cancelled', 'expired'],
        default: 'trial',
    },
    databaseConfigured: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: { type: String },
    suspendedAt: { type: Date },
    lastActivityAt: { type: Date },
    totalUsers: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Virtual for encrypted mongoUri
companySchema.virtual('mongoUri').set(function (val) {
    this._mongoUri = encrypt(val);
});
companySchema.virtual('mongoUri').get(function () {
    return decrypt(this._mongoUri);
});

companySchema.methods.getMaskedUri = function () {
    const uri = this.mongoUri;
    if (!uri) return '';
    return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
};

module.exports = mongoose.model('Company', companySchema);
