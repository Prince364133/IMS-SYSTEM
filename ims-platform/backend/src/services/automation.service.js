'use strict';

const AutomationLog = require('../models/AutomationLog');
const Notification = require('../models/Notification'); // Added by instruction
const EmailService = require('./email.service');
const SmartNotificationService = require('./smart-notification.service'); // Added by instruction
const User = require('../models/User');
const { getIo, onlineUsers, initSocket } = require('../sockets'); // Modified by instruction

/**
 * Automation Service - Central Event Hub
 * Handles logging and dispatching of system-wide notifications
 */
class AutomationService {
    /**
     * Trigger an automation event
     * @param {Object} params - { eventType, triggeredBy, targetUser, targetClient, relatedItem, description, metadata }
     */
    async trigger(params) {
        const { eventType, triggeredBy, targetUser, targetClient, relatedItem, description, metadata } = params;

        try {
            // 1. Create Log Entry
            const log = await AutomationLog.create({
                eventType,
                triggeredBy,
                targetUser,
                targetClient,
                relatedItem,
                description,
                metadata,
                status: 'pending'
            });

            // 2. Fetch User Details for Email (if not provided)
            let user = null;
            if (targetUser) {
                user = await User.findById(targetUser).select('name email preferences');
            }

            // 3. Dispatch Email Notification
            if (user && user.email) {
                await this.#handleEmailDispatch(eventType, user, params);
            }

            // 4. Dispatch Notification via Smart Service
            if (params.targetUser) {
                const companyName = process.env.COMPANY_NAME || 'Your Company';
                const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
                let subject = '';
                let message = params.description;
                let actionUrl = clientUrl;

                switch (eventType) {
                    case 'project_assigned':
                        subject = `New Project Assigned: ${params.metadata.projectName || 'A new project'}`;
                        message = `You have been assigned to the project: ${params.metadata.projectName}.`;
                        actionUrl = `${clientUrl}/dashboard/projects/${params.relatedItem.itemId}`;
                        break;
                    case 'task_assigned':
                        subject = `New Task Assigned: ${params.metadata.taskName || 'A new task'}`;
                        message = `You have been assigned to the task: ${params.metadata.taskName}.`;
                        actionUrl = `${clientUrl}/dashboard/tasks/${params.relatedItem.itemId}`;
                        break;
                    case 'salary_generated':
                        subject = `Salary Slip Generated - ${params.metadata.month || 'Current Month'}`;
                        message = `Your salary slip for ${params.metadata.month} has been generated and is ready for viewing.`;
                        actionUrl = `${clientUrl}/dashboard/profile/me`;
                        break;
                    case 'attendance_late':
                        subject = `Late Attendance Notification`;
                        message = `Our system recorded a late check-in today. Please ensure you mark your attendance on time.`;
                        actionUrl = `${clientUrl}/dashboard`;
                        break;
                    case 'project_deadline_approaching':
                        subject = `Project Deadline Approaching: ${params.metadata.projectName}`;
                        message = `The deadline for project "${params.metadata.projectName}" is approaching. Please review your tasks.`;
                        actionUrl = `${clientUrl}/dashboard/projects/${params.relatedItem.itemId}`;
                        break;
                    case 'task_deadline_approaching':
                        subject = `Task Deadline Approaching: ${params.metadata.taskName}`;
                        message = `The deadline for task "${params.metadata.taskName}" is approaching.`;
                        actionUrl = `${clientUrl}/dashboard/tasks/${params.relatedItem.itemId}`;
                        break;
                    case 'new_announcement':
                        subject = `New Announcement: ${params.metadata.title}`;
                        message = params.metadata.content;
                        actionUrl = `${clientUrl}/dashboard/announcements`;
                        break;
                    case 'document_shared':
                        subject = `Document Shared: ${params.metadata.documentName}`;
                        message = `A new document "${params.metadata.documentName}" has been shared with you.`;
                        actionUrl = `${clientUrl}/dashboard/documents/${params.relatedItem.itemId}`;
                        break;
                    case 'leave_request_approved':
                        subject = `Leave Request Approved`;
                        message = `Your leave request for ${params.metadata.leaveDates} has been approved.`;
                        actionUrl = `${clientUrl}/dashboard/leave`;
                        break;
                    case 'leave_request_rejected':
                        subject = `Leave Request Rejected`;
                        message = `Your leave request for ${params.metadata.leaveDates} has been rejected. Reason: ${params.metadata.reason}`;
                        actionUrl = `${clientUrl}/dashboard/leave`;
                        break;
                    case 'new_feedback':
                        subject = `New Feedback Received`;
                        message = `You have received new feedback regarding ${params.metadata.feedbackType}.`;
                        actionUrl = `${clientUrl}/dashboard/feedback`;
                        break;
                    case 'performance_review_due':
                        subject = `Performance Review Due`;
                        message = `Your performance review is due soon. Please complete it by ${params.metadata.dueDate}.`;
                        actionUrl = `${clientUrl}/dashboard/performance`;
                        break;
                    case 'expense_report_approved':
                        subject = `Expense Report Approved`;
                        message = `Your expense report for ${params.metadata.period} has been approved.`;
                        actionUrl = `${clientUrl}/dashboard/expenses`;
                        break;
                    case 'expense_report_rejected':
                        subject = `Expense Report Rejected`;
                        message = `Your expense report for ${params.metadata.period} has been rejected. Reason: ${params.metadata.reason}`;
                        actionUrl = `${clientUrl}/dashboard/expenses`;
                        break;
                    case 'new_ticket_assigned':
                        subject = `New Support Ticket Assigned: ${params.metadata.ticketSubject}`;
                        message = `A new support ticket "${params.metadata.ticketSubject}" has been assigned to you.`;
                        actionUrl = `${clientUrl}/dashboard/support/tickets/${params.relatedItem.itemId}`;
                        break;
                    case 'ticket_status_update':
                        subject = `Support Ticket Update: ${params.metadata.ticketSubject}`;
                        message = `Your support ticket "${params.metadata.ticketSubject}" has been updated to status: ${params.metadata.newStatus}.`;
                        actionUrl = `${clientUrl}/dashboard/support/tickets/${params.relatedItem.itemId}`;
                        break;
                    case 'new_message':
                        subject = `New Message from ${params.metadata.senderName}`;
                        message = params.metadata.preview;
                        actionUrl = `${clientUrl}/dashboard/messages/${params.relatedItem.itemId}`;
                        break;
                    case 'training_assigned':
                        subject = `New Training Assigned: ${params.metadata.trainingName}`;
                        message = `You have been assigned a new training module: "${params.metadata.trainingName}".`;
                        actionUrl = `${clientUrl}/dashboard/training/${params.relatedItem.itemId}`;
                        break;
                    case 'training_due_soon':
                        subject = `Training Due Soon: ${params.metadata.trainingName}`;
                        message = `The training module "${params.metadata.trainingName}" is due soon.`;
                        actionUrl = `${clientUrl}/dashboard/training/${params.relatedItem.itemId}`;
                        break;
                    case 'policy_update':
                        subject = `Company Policy Update: ${params.metadata.policyName}`;
                        message = `There has been an update to the company policy: "${params.metadata.policyName}". Please review.`;
                        actionUrl = `${clientUrl}/dashboard/policies/${params.relatedItem.itemId}`;
                        break;
                    case 'goal_set':
                        subject = `New Goal Set: ${params.metadata.goalName}`;
                        message = `A new goal "${params.metadata.goalName}" has been set for you.`;
                        actionUrl = `${clientUrl}/dashboard/goals/${params.relatedItem.itemId}`;
                        break;
                    case 'goal_update':
                        subject = `Goal Update: ${params.metadata.goalName}`;
                        message = `Your goal "${params.metadata.goalName}" has been updated.`;
                        actionUrl = `${clientUrl}/dashboard/goals/${params.relatedItem.itemId}`;
                        break;
                    case 'asset_assigned':
                        subject = `Asset Assigned: ${params.metadata.assetName}`;
                        message = `You have been assigned a new company asset: "${params.metadata.assetName}".`;
                        actionUrl = `${clientUrl}/dashboard/assets`;
                        break;
                    case 'asset_return_due':
                        subject = `Asset Return Due: ${params.metadata.assetName}`;
                        message = `The company asset "${params.metadata.assetName}" is due for return soon.`;
                        actionUrl = `${clientUrl}/dashboard/assets`;
                        break;
                    default:
                        subject = `Update from ${companyName}`;
                        message = params.description;
                        actionUrl = clientUrl;
                }

                await SmartNotificationService.send({
                    userId: params.targetUser,
                    type: params.eventType,
                    title: subject,
                    message: message,
                    actionUrl: actionUrl,
                    priority: params.eventType.includes('deadline') || params.eventType.includes('risk') ? 'high' : 'medium'
                });
            }

            // 5. Update Log Status
            log.status = 'success';
            await log.save();

            return log;
        } catch (err) {
            console.error(`Automation Error [${eventType}]:`, err.message);
            // Log the failure if possible
            try {
                await AutomationLog.create({
                    eventType,
                    triggeredBy,
                    targetUser,
                    description: `FAILED: ${description}`,
                    status: 'failed',
                    error: err.message
                });
            } catch (loggingErr) {
                console.error('Critical Logging Failure:', loggingErr.message);
            }
        }
    }

    /**
     * Private helper to route events to specific email templates
     */
    async #handleEmailDispatch(eventType, user, params) {
        const companyName = process.env.COMPANY_NAME || 'Your Company';
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

        let subject = '';
        let templateData = {
            name: user.name,
            companyName,
            ctaLink: clientUrl,
            ...params.metadata
        };

        // Simplified mapping logic - to be expanded in email.service.js
        switch (eventType) {
            case 'project_assigned':
                subject = `New Project Assigned: ${params.metadata.projectName || 'A new project'}`;
                templateData.message = `You have been assigned to the project: ${params.metadata.projectName}.`;
                templateData.ctaText = 'View Project';
                templateData.ctaLink = `${clientUrl}/dashboard/projects/${params.relatedItem.itemId}`;
                break;
            case 'task_assigned':
                subject = `New Task Assigned: ${params.metadata.taskName || 'A new task'}`;
                templateData.message = `You have been assigned to the task: ${params.metadata.taskName}.`;
                templateData.ctaText = 'View Task';
                templateData.ctaLink = `${clientUrl}/dashboard/tasks/${params.relatedItem.itemId}`;
                break;
            case 'salary_generated':
                subject = `Salary Slip Generated - ${params.metadata.month || 'Current Month'}`;
                templateData.message = `Your salary slip for ${params.metadata.month} has been generated and is ready for viewing.`;
                templateData.ctaText = 'View Payslip';
                templateData.ctaLink = `${clientUrl}/dashboard/profile/me`;
                break;
            case 'attendance_late':
                subject = `Late Attendance Notification`;
                templateData.message = `Our system recorded a late check-in today. Please ensure you mark your attendance on time.`;
                templateData.ctaText = 'View Dashboard';
                break;
            // Add more cases as needed...
            default:
                subject = `Update from ${companyName}`;
                templateData.message = params.description;
                templateData.ctaText = 'Open Dashboard';
        }

        // Call the general email sender
        await EmailService.sendTransitionalEmail(user.email, subject, templateData);
    }
}

module.exports = new AutomationService();
