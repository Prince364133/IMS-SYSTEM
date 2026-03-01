const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Goal name is required'],
            trim: true,
        },
        description: { type: String, default: '' },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        target: { type: Number, required: true },
        current: { type: Number, default: 0 },
        metric: { type: String, default: '' },   // e.g. "tasks/month", "sales/quarter"
        deadline: { type: Date },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'achieved', 'missed'],
            default: 'not_started',
        },
    },
    { timestamps: true }
);

// Virtual: progress percentage
goalSchema.virtual('progress').get(function () {
    if (this.target === 0) return 0;
    return Math.min(Math.round((this.current / this.target) * 100), 100);
});

goalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);
