'use strict';
const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema({
    flagKey: { type: String, required: true, unique: true, slug: true, trim: true },
    label: { type: String, required: true },
    description: { type: String },
    isEnabled: { type: Boolean, default: false },
    category: { type: String, enum: ['ai', 'billing', 'storage', 'communication', 'security', 'general'], default: 'general' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, { timestamps: true });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
