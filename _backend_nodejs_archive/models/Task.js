const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
        },
        description: { type: String, default: '' },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        assigneeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['todo', 'in_progress', 'review', 'done', 'cancelled'],
            default: 'todo',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        dueDate: { type: Date },
        completedAt: { type: Date },
        estimatedHrs: { type: Number, default: 0 },
        actualHrs: { type: Number, default: 0 },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

// Auto-set completedAt when status changes to 'done'
taskSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'done' && !this.completedAt) {
        this.completedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('Task', taskSchema);
