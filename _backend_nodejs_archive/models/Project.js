const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
        },
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
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
