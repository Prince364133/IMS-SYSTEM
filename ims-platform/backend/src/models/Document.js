'use strict';

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        fileUrl: { type: String, required: true }, // URL to file (Cloudinary, Drive, or External)
        fileId: { type: String, default: '' },     // ID of file (Cloudinary public_id or Google Drive fileId)
        isLinkOnly: { type: Boolean, default: false }, // If true, it's just an external link, not managed by our storage
        storageType: { type: String, enum: ['cloudinary', 'google_drive', 'local', 'external'], default: 'cloudinary' },
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
        taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users tagged in the document
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
