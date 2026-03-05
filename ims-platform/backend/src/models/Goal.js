'use strict';

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled', 'on_hold'],
            default: 'active',
        },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        targetDate: { type: Date },
        ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

goalSchema.index({ ownerId: 1, status: 1 });
goalSchema.pre(/^find/, function (next) {
    if (!this._conditions.deletedAt) this.where({ deletedAt: null });
    next();
});

module.exports = mongoose.model('Goal', goalSchema);
