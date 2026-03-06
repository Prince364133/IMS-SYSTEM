'use strict';

const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
    {
        to: { type: String, required: true, index: true },
        subject: { type: String, required: true },
        templateName: { type: String, required: true },
        templateData: { type: mongoose.Schema.Types.Mixed, default: {} },
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null if system auto-sent
        status: {
            type: String,
            enum: ['sent', 'failed'],
            default: 'sent',
        },
        errorMessage: { type: String, default: null },
    },
    { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
