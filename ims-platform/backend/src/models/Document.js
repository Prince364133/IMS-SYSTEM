'use strict';

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        cloudinaryUrl: { type: String, required: true },
        cloudinaryPublicId: { type: String, required: true },
        fileType: { type: String, default: '' }, // MIME type
        fileSize: { type: Number, default: 0 }, // bytes
        folder: {
            type: String,
            enum: ['employees', 'projects', 'contracts', 'reports', 'general'],
            default: 'general',
        },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
        relatedModel: { type: String, default: '' }, // 'Project', 'Task', 'User', etc.
        description: { type: String, default: '' },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ relatedId: 1, relatedModel: 1 });
documentSchema.index({ folder: 1 });
documentSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

module.exports = mongoose.model('Document', documentSchema);
