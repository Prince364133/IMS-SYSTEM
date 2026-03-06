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
 * Send a fully custom email (no template — raw subject + HTML body)
 */
exports.sendCustomEmail = async (req, res, next) => {
    try {
        const { to, subject, body } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: 'Recipient, subject, and body are required' });
        }

        const result = await EmailService.sendSystemAlert(to, subject, body);

        if (!result.success) {
            return res.status(500).json({ error: result.error || 'Failed to send email' });
        }

        // Tag with manual sender
        await EmailLog.findOneAndUpdate(
            { to, status: 'sent' },
            { sentBy: req.user._id },
            { sort: { createdAt: -1 } }
        );

        res.json({ message: 'Custom email sent successfully' });
    } catch (err) { next(err); }
};

/**
 * Send bulk email to all users of a given role (or all users)
 */
exports.sendBulkEmail = async (req, res, next) => {
    try {
        const { role, subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }

        const query = role && role !== 'all' ? { role, isActive: true } : { isActive: true };
        const users = await User.find(query).select('email name').lean();

        if (!users.length) {
            return res.status(404).json({ error: 'No users found for the selected role' });
        }

        let sent = 0;
        let failed = 0;

        for (const user of users) {
            try {
                await EmailService.sendSystemAlert(user.email, subject, message);
                sent++;
            } catch (e) {
                failed++;
            }
        }

        // Tag logs with sender
        await EmailLog.updateMany(
            { subject, status: 'sent', sentBy: null },
            { sentBy: req.user._id }
        );

        res.json({
            message: `Bulk email complete. Sent: ${sent}, Failed: ${failed}`,
            sent,
            failed,
            total: users.length
        });
    } catch (err) { next(err); }
};

/**
 * Retry a failed email log entry
 */
exports.retryEmail = async (req, res, next) => {
    try {
        const log = await EmailLog.findById(req.params.id);

        if (!log) {
            return res.status(404).json({ error: 'Email log not found' });
        }

        if (log.status === 'sent') {
            return res.status(400).json({ error: 'Email already sent successfully' });
        }

        const result = await EmailService.sendSystemAlert(
            log.to,
            log.subject,
            `Retry: ${log.subject}`
        );

        if (result.success) {
            log.status = 'sent';
            log.errorMessage = null;
            log.sentBy = req.user._id;
            await log.save();
            return res.json({ message: 'Email retry successful' });
        }

        res.status(500).json({ error: result.error || 'Retry failed' });
    } catch (err) { next(err); }
};

/**
 * Get detailed stats for email service
 */
exports.getEmailStats = async (req, res, next) => {
    try {
        const [statusStats, templateStats, recentActivity] = await Promise.all([
            // Total sent vs failed
            EmailLog.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            // Breakdown by template
            EmailLog.aggregate([
                { $group: { _id: '$templateName', count: { $sum: 1 }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            // Last 7 days activity
            EmailLog.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({ stats: statusStats, templateStats, recentActivity });
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
