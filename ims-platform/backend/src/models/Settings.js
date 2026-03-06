const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        default: 'External Management System',
    },
    logoUrl: {
        type: String,
        default: '',
    },
    themeColor: {
        type: String,
        default: '#4f46e5',
    },
    webhookUrl: {
        type: String,
        default: '',
    },
    webhookSecret: {
        type: String,
        default: '',
    },
    // SMTP Email Settings
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' }, // Encrypt in production
    smtpSecure: { type: Boolean, default: false },
    emailFrom: { type: String, default: 'noreply@internal.system' },
    lastEmailTestStatus: { type: String, enum: ['success', 'failure', 'none'], default: 'none' },
    lastEmailTestDate: { type: Date },
    lastEmailTestError: { type: String },

    // AI Configuration
    aiProvider: { type: String, enum: ['none', 'openai', 'groq', 'gemini'], default: 'none' },
    openaiKey: { type: String, default: '' },
    groqKey: { type: String, default: '' },
    geminiKey: { type: String, default: '' },
    lastAiTestStatus: { type: String, enum: ['success', 'failure', 'none'], default: 'none' },
    lastAiTestDate: { type: Date },
    lastAiTestError: { type: String, default: '' },

    // Storage Configuration (Google Drive / Cloudinary)
    storageMode: { type: String, enum: ['cloudinary', 'google_drive', 'local'], default: 'cloudinary' },
    googleDriveServiceAccount: { type: String, default: '' }, // Stringified JSON
    googleDriveFolderId: { type: String, default: '' },
    cloudinaryCloudName: { type: String, default: '' },
    cloudinaryApiKey: { type: String, default: '' },
    cloudinaryApiSecret: { type: String, default: '' },
    recruitmentApiKey: { type: String, default: '' },
    lastStorageTestStatus: { type: String, enum: ['success', 'failure', 'none'], default: 'none' },
    lastStorageTestDate: { type: Date },
    lastStorageTestError: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
