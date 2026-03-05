'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: [
                'project_assigned', 'task_assigned', 'task_updated', 'task_completed',
                'message_received', 'attendance_marked', 'salary_generated',
                'leave_approved', 'leave_rejected', 'system_alert', 'client_update',
                'email_pending'
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, default: '' },
        isRead: { type: Boolean, default: false },
        relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }, // polymorphic ref
        relatedModel: { type: String, default: '' }, // 'Project', 'Task', 'Chat', etc.
        link: { type: String, default: '' }, // frontend URL to navigate to
        actionUrl: { type: String, default: '' }, // mailto: or other external action
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
