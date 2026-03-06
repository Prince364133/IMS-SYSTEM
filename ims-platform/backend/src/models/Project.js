'use strict';

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Project name is required'], trim: true },
        description: { type: String, default: '' },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'],
            default: 'not_started',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        deadline: { type: Date },
        startDate: { type: Date, default: Date.now },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        tags: [{ type: String, trim: true }],

        // ── Relations ──────────────────────────────────────────────────────────────
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        clientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
        memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

        // ── Files ──────────────────────────────────────────────────────────────────
        attachmentUrls: [{ type: String }],

        // ── Soft delete ────────────────────────────────────────────────────────────
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

projectSchema.index({ ownerId: 1, deletedAt: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ clientIds: 1 });
projectSchema.index({ memberIds: 1 });
projectSchema.index({ name: 'text', description: 'text' });

projectSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

module.exports = mongoose.model('Project', projectSchema);
