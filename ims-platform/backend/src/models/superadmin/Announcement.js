'use strict';
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'maintenance', 'feature', 'security'], default: 'info' },
    isActive: { type: Boolean, default: true },
    isPinned: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    targetCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }], // empty = all
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
