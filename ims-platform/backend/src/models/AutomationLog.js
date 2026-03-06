'use strict';

const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            index: true,
            enum: [
                'project_assigned', 'project_deadline', 'project_completed', 'project_status_changed',
                'task_assigned', 'task_reminder', 'task_completed', 'task_overdue', 'task_escalated',
                'meeting_scheduled', 'meeting_reminder', 'meeting_rescheduled',
                'client_created', 'client_project_update', 'document_shared',
                'document_uploaded', 'document_signed', 'contract_uploaded',
                'employee_added', 'employee_assigned_dept', 'salary_generated',
                'attendance_late', 'attendance_absence',
                'job_application_received', 'candidate_shortlisted', 'interview_scheduled'
            ]
        },
        triggeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        targetClient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            index: true
        },
        relatedItem: {
            itemId: mongoose.Schema.Types.ObjectId,
            itemModel: { type: String, enum: ['Project', 'Task', 'Meeting', 'Document', 'Job', 'Application', 'Salary'] }
        },
        description: { type: String },
        status: {
            type: String,
            enum: ['success', 'failed', 'pending'],
            default: 'success'
        },
        error: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

automationLogSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('AutomationLog', automationLogSchema, 'automation_logs');
