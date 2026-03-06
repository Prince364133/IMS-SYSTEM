'use strict';

const EmailLog = require('../models/EmailLog');
const EmailService = require('../services/email.service');
const User = require('../models/User');

/**
 * Get all email logs with pagination
 */
exports.getEmailLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, to, status } = req.query;
        const query = {};
        if (to) query.to = { $regex: to, $options: 'i' };
        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [logs, total] = await Promise.all([
            EmailLog.find(query)
                .populate('sentBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            EmailLog.countDocuments(query),
        ]);

        res.json({ logs, total, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

/**
 * Get available email templates and their definitions
 */
exports.getTemplates = async (req, res, next) => {
    try {
        const templates = [
            { id: 'welcome', name: 'Welcome Email', fields: ['name', 'password'], description: 'Sent to newly created users with their credentials.' },
            { id: 'project_assigned', name: 'Project Assignment', fields: ['name', 'projectName', 'projectUrl'], description: 'Notifies a user they have been added to a project.' },
            { id: 'task_assigned', name: 'Task Assignment', fields: ['name', 'taskTitle', 'projectName', 'taskUrl'], description: 'Notifies a user of a new task.' },
            { id: 'salary_generated', name: 'Salary Generation', fields: ['name', 'month', 'netSalary'], description: 'Informs an employee that their salary slip is ready.' },
            { id: 'system_alert', name: 'System Alert', fields: ['subject', 'message'], description: 'Generic alert for important system announcements.' },
            { id: 'verification', name: 'Verification Email', fields: ['name', 'verificationUrl'], description: 'Used to verify a user\'s email address.' },
            { id: 'password_reset', name: 'Password Reset', fields: ['name', 'resetUrl'], description: 'Link to reset a forgotten password.' },
        ];
        res.json({ templates });
    } catch (err) { next(err); }
};

/**
 * Send an email based on a template and manual entry
 */
exports.sendManualEmail = async (req, res, next) => {
    try {
        const { to, templateId, templateData } = req.body;

        if (!to || !templateId) {
            return res.status(400).json({ error: 'Recipient address and Template ID are required' });
        }

        let result = null;

        switch (templateId) {
            case 'welcome':
                result = await EmailService.sendWelcomeEmail({ email: to, name: templateData.name }, templateData.password);
                break;
            case 'project_assigned':
                result = await EmailService.sendProjectAssignedEmail(to, templateData.name, templateData.projectName, templateData.projectUrl);
                break;
            case 'task_assigned':
                result = await EmailService.sendTaskAssignedEmail(to, templateData.name, templateData.taskTitle, templateData.projectName, templateData.taskUrl);
                break;
            case 'salary_generated':
                result = await EmailService.sendSalaryGeneratedEmail(to, templateData.name, templateData.month, templateData.netSalary);
                break;
            case 'system_alert':
                result = await EmailService.sendSystemAlert(to, templateData.subject, templateData.message);
                break;
            case 'verification':
                result = await EmailService.sendVerificationEmail(to, templateData.name, templateData.verificationUrl);
                break;
            case 'password_reset':
                result = await EmailService.sendPasswordResetEmail(to, templateData.name, templateData.resetUrl);
                break;
            default:
                return res.status(400).json({ error: `Unknown template: ${templateId}` });
        }

        // Tag the log entry with the user who triggered it manually
        if (result.success) {
            await EmailLog.findOneAndUpdate(
                { to, status: 'sent' },
                { sentBy: req.user._id },
                { sort: { createdAt: -1 } }
            );
        }

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Failed to send email' });
        }

        res.json({ message: 'Email sent successfully and logged' });
    } catch (err) { next(err); }
};

/**
 * Get detailed stats for email service
 */
exports.getEmailStats = async (req, res, next) => {
    try {
        const stats = await EmailLog.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json({ stats });
    } catch (err) { next(err); }
};
