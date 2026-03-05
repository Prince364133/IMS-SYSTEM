'use strict';

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: { type: String, required: [true, 'Task title is required'], trim: true },
        description: { type: String, default: '' },
        status: {
            type: String,
            enum: ['todo', 'in_progress', 'review', 'done'],
            default: 'todo',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        dueDate: { type: Date },

        // ── Relations ──────────────────────────────────────────────────────────────
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
        assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // ── Attachments ────────────────────────────────────────────────────────────
        attachmentUrls: [{ type: String }],

        // ── Soft delete ────────────────────────────────────────────────────────────
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

taskSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

module.exports = mongoose.model('Task', taskSchema);
