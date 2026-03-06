'use strict';

const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const CompanyConfig = require('../models/CompanyConfig');
const EmailLog = require('../models/EmailLog');

/**
 * Get company configuration with defaults
 */
async function getCompanyInfo() {
    const config = await CompanyConfig.findOne();
    if (!config) {
        return {
            companyName: 'Internal Management System',
            tagline: 'Your Organization Hub',
            brandColor: '#4f46e5',
            logoUrl: '',
            websiteUrl: process.env.CLIENT_URL
        };
    }
    return config;
}

/**
 * Get dynamic transporter based on database settings
 */
async function getTransporter() {
    const settings = await Settings.findOne();

    if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
        console.warn('Email service: SMTP not configured. Emails will not be sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass,
        },
    });
}

/**
 * Helper to send email using dynamic settings and log the transaction
 */
async function send(options) {
    let logId = null;
    try {
        const settings = await Settings.findOne();
        const transporter = await getTransporter();

        const log = await EmailLog.create({
            to: options.to,
            subject: options.subject,
            templateName: options.templateName || 'generic',
            templateData: options.templateData || {},
            sentBy: options.sentBy || null,
            status: 'failed',
        });
        logId = log._id;

        if (!transporter) {
            await EmailLog.findByIdAndUpdate(logId, { errorMessage: 'SMTP not configured' });
            return { success: false, error: 'SMTP not configured' };
        }

        const info = await transporter.sendMail({
            from: settings.emailFrom || options.from || 'noreply@internal.system',
            to: options.to,
            subject: options.subject,
            html: options.html,
            attachments: options.attachments || [],
        });

        console.log('Email sent:', info.messageId);
        await EmailLog.findByIdAndUpdate(logId, { status: 'sent' });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email send error:', error);
        if (logId) {
            await EmailLog.findByIdAndUpdate(logId, { status: 'failed', errorMessage: error.message });
        }
        return { success: false, error: error.message };
    }
}

// ── Email templates HTML constructor ────────────────────────────────────────────────────────────

function baseLayout(title, content, company) {
    const brandColor = company.brandColor || '#cf1d29';
    const logoHtml = company.emailLogo || company.companyLogo
        ? `<img src="${company.emailLogo || company.companyLogo}" alt="${company.companyName}" style="max-height: 50px; margin-bottom: 10px;">`
        : `<h1>${company.companyName}</h1>`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .body h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #4b5563; line-height: 1.7; margin: 0 0 16px; }
    .button { display: inline-block; background: ${brandColor}; color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .badge { display: inline-block; background: #fff5f5; color: ${brandColor}; border: 1px solid #feb2b2; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb; }
    .box p { margin: 0; font-size: 13px; color: #64748b; }
    .box p strong { display: block; margin-top: 4px; font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoHtml}
      <p>${company.tagline || ''}</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} ${company.companyName}. All rights reserved.<br>
      This email was sent automatically — please do not reply.
    </div>
  </div>
</body>
</html>`;
}

async function buildTemplate(templateId, data) {
    const company = await getCompanyInfo();
    let subject = '';
    let content = '';

    switch (templateId) {
        case 'welcome':
            subject = `Welcome to ${company.companyName} — Your Account is Ready`;
            content = `
                <h2>Welcome aboard, ${data.name}! 🚀</h2>
                <p>Your account has been created successfully. You can now log in to the ${company.companyName} system using the credentials below:</p>
                <div class="box">
                    <p>Email Address<strong>${data.email}</strong></p>
                    <p style="margin-top: 12px;">Temporary Password<strong>${data.password}</strong></p>
                </div>
                <a href="${process.env.CLIENT_URL || company.websiteUrl}" class="button">Log In to Dashboard</a>
                <p style="margin-top:24px;font-size:13px;color:#9ca3af;">We recommend changing your password after your first login.</p>
            `;
            break;
        case 'project_assigned':
            subject = `${company.companyName} — Project Assigned: ${data.projectName}`;
            content = `
                <h2>You've been assigned to a project</h2>
                <p>Hi ${data.name},</p>
                <p>You have been added as a member of the following project:</p>
                <p><span class="badge">${data.projectName}</span></p>
                <a href="${data.projectUrl}" class="button">View Project</a>
            `;
            break;
        case 'task_assigned':
            subject = `${company.companyName} — Task Assigned: ${data.taskTitle}`;
            content = `
                <h2>New Task Assignment</h2>
                <p>Hi ${data.name},</p>
                <p>You have been assigned a new task on <strong>${data.projectName}</strong>.</p>
                <div class="box">
                    <p>Task Title<strong>${data.taskTitle}</strong></p>
                </div>
                <a href="${data.taskUrl}" class="button">View Task</a>
            `;
            break;
        case 'salary_generated':
            subject = `${company.companyName} — Salary for ${data.month}`;
            content = `
                <h2>Your salary has been generated</h2>
                <p>Hi ${data.name},</p>
                <p>Your salary for <strong>${data.month}</strong> has been processed:</p>
                <p style="font-size:32px;font-weight:700;color:${company.brandColor || '#4f46e5'};margin:16px 0;">₹${Number(data.netSalary).toLocaleString()}</p>
                <a href="${process.env.CLIENT_URL}/dashboard/hr" class="button">View Salary Details</a>
            `;
            break;
        case 'system_alert':
            subject = `${company.companyName} — ${data.subject}`;
            content = `
                <h2>System Alert</h2>
                <p>${data.message}</p>
            `;
            break;
        case 'verification':
            subject = `Welcome to ${company.companyName} — Verify Your Email`;
            content = `
                <h2>Welcome to ${company.companyName}, ${data.name}! 👋</h2>
                <p>Your account has been created. Please verify your email address to get started.</p>
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
                <p style="margin-top:24px;font-size:13px;color:#9ca3af;">If you didn't create this account, you can safely ignore this email.</p>
            `;
            break;
        case 'password_reset':
            subject = `${company.companyName} — Password Reset`;
            content = `
                <h2>Password Reset Request</h2>
                <p>Hi ${data.name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password.</p>
                <a href="${data.resetUrl}" class="button">Reset Password</a>
                <p style="margin-top:24px;font-size:13px;color:#9ca3af;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
            `;
            break;
        case 'document_tagged':
            subject = `${company.companyName} — Document Shared: ${data.documentName}`;
            content = `
                <h2>You've been tagged in a document</h2>
                <p>Hi ${data.name},</p>
                <p><strong>${data.senderName}</strong> has tagged you in a new document:</p>
                <div class="box">
                    <p>Document Title<strong>${data.documentName}</strong></p>
                </div>
                <a href="${data.documentUrl}" class="button">View Document</a>
            `;
            break;

        // --- NEW TEMPLATES ---

        case 'meeting_scheduled':
            subject = `${company.companyName} — Meeting: ${data.meetingTitle}`;
            content = `
                <h2>Meeting Invitation</h2>
                <p>Hi ${data.name},</p>
                <p>You have a meeting scheduled for <strong>${new Date(data.startTime).toLocaleString()}</strong>.</p>
                <div class="box">
                    <p>Meeting Title<strong>${data.meetingTitle}</strong></p>
                </div>
                <a href="${data.ctaUrl}" class="button">Join/View Meeting</a>
            `;
            break;
        case 'leave_approved':
            subject = `${company.companyName} — Leave Request Approved`;
            content = `
                <h2>Leave Request Approved</h2>
                <p>Hi ${data.name},</p>
                <p>Your request for <strong>${data.leaveType}</strong> has been approved.</p>
                <div class="box">
                    <p>Duration<strong>${data.startDate} to ${data.endDate}</strong></p>
                </div>
                <p>Enjoy your time off!</p>
            `;
            break;
        case 'leave_rejected':
            subject = `${company.companyName} — Leave Request Update`;
            content = `
                <h2>Leave Request Update</h2>
                <p>Hi ${data.name},</p>
                <p>Unfortunately, your request for <strong>${data.leaveType}</strong> has not been approved at this time.</p>
                <div class="box">
                    <p>Reason provided<strong>${data.reason}</strong></p>
                </div>
                <p>Please contact HR or your manager for further details.</p>
            `;
            break;
        case 'task_completed':
            subject = `${company.companyName} — Task Completed: ${data.taskTitle}`;
            content = `
                <h2>Task Completed</h2>
                <p>Hi ${data.name},</p>
                <p>A task related to <strong>${data.projectName}</strong> has just been marked as completed.</p>
                <div class="box">
                    <p>Task Title<strong>${data.taskTitle}</strong></p>
                </div>
                <a href="${data.ctaUrl}" class="button">View Details</a>
            `;
            break;
        case 'invoice_generated':
            subject = `${company.companyName} — Invoice #${data.invoiceNumber}`;
            content = `
                <h2>Invoice Available</h2>
                <p>Hi ${data.clientName},</p>
                <p>A new invoice has been generated for your account.</p>
                <div class="box">
                    <p>Invoice Number<strong>${data.invoiceNumber}</strong></p>
                    <p style="margin-top: 12px;">Amount Due<strong>$${data.amount}</strong></p>
                    <p style="margin-top: 12px;">Due Date<strong>${data.dueDate}</strong></p>
                </div>
                <a href="${data.ctaUrl}" class="button">View & Pay Invoice</a>
            `;
            break;
        case 'payment_received':
            subject = `${company.companyName} — Payment Received for #${data.invoiceNumber}`;
            content = `
                <h2>Payment Received</h2>
                <p>Hi ${data.clientName},</p>
                <p>We have successfully received your payment of <strong>$${data.amount}</strong> on ${data.date}.</p>
                <p>Thank you for your prompt payment.</p>
            `;
            break;
        case 'performance_review':
            subject = `${company.companyName} — Performance Review Scheduled`;
            content = `
                <h2>Performance Review Scheduled</h2>
                <p>Hi ${data.name},</p>
                <p>Your upcoming performance review has been scheduled with <strong>${data.reviewerName}</strong>.</p>
                <div class="box">
                    <p>Date & Time<strong>${data.reviewDate}</strong></p>
                </div>
                <a href="${data.ctaUrl}" class="button">View Review Details</a>
            `;
            break;
        case 'document_shared':
            subject = `${company.companyName} — Document Shared: ${data.documentName}`;
            content = `
                <h2>A document was shared with you</h2>
                <p>Hi ${data.name},</p>
                <p><strong>${data.senderName}</strong> has securely shared a document with you.</p>
                <div class="box">
                    <p>Document Name<strong>${data.documentName}</strong></p>
                </div>
                <a href="${data.ctaUrl}" class="button">Access Document</a>
            `;
            break;
        case 'client_welcome':
            subject = `Welcome to the ${company.companyName} Portal`;
            content = `
                <h2>Welcome, ${data.clientName}!</h2>
                <p>We are thrilled to partner with you. Your client portal has been set up securely.</p>
                <p>You can track projects, invoices, and documents directly from your dashboard.</p>
                <a href="${data.loginUrl}" class="button">Access Client Portal</a>
            `;
            break;
        case 'project_completed':
            subject = `${company.companyName} — Project Completed: ${data.projectName}`;
            content = `
                <h2>Project Completed 🎉</h2>
                <p>Hi ${data.name},</p>
                <p>Congratulations! The project <strong>${data.projectName}</strong> was successfully completed on ${data.completionDate}.</p>
                <p>Thank you for your hard work and collaboration.</p>
                <a href="${data.ctaUrl}" class="button">View Final Project Report</a>
            `;
            break;
        case 'expense_approved':
            subject = `${company.companyName} — Expense Approved`;
            content = `
                <h2>Expense Approved</h2>
                <p>Hi ${data.name},</p>
                <p>Your business expense has been formally approved and will be reimbursed in the next cycle.</p>
                <div class="box">
                    <p>Expense Item<strong>${data.expenseTitle}</strong></p>
                    <p style="margin-top: 12px;">Amount<strong>${data.amount}</strong></p>
                    <p style="margin-top: 12px;">Submitted On<strong>${data.date}</strong></p>
                </div>
            `;
            break;
        case 'expense_rejected':
            subject = `${company.companyName} — Expense Rejected`;
            content = `
                <h2>Expense Update</h2>
                <p>Hi ${data.name},</p>
                <p>Your recent expense submission could not be approved at this time.</p>
                <div class="box">
                    <p>Expense Item<strong>${data.expenseTitle}</strong></p>
                    <p style="margin-top: 12px;">Amount<strong>${data.amount}</strong></p>
                    <p style="margin-top: 12px;">Reason provided<strong>${data.reason}</strong></p>
                </div>
                <p>Please reach out to the finance team if you need further clarification.</p>
            `;
            break;
        case 'contract_renewal':
            subject = `${company.companyName} — Contract Renewal Reminder`;
            content = `
                <h2>Contract Renewal Notice</h2>
                <p>Hi ${data.clientName},</p>
                <p>This is a reminder that the contract <strong>${data.contractName}</strong> is up for renewal on <strong>${data.renewalDate}</strong>.</p>
                <a href="${data.ctaUrl}" class="button">Review Contract</a>
            `;
            break;
        case 'holiday_announcement':
            subject = `${company.companyName} — Upcoming Holiday: ${data.holidayName}`;
            content = `
                <h2>Holiday Announcement</h2>
                <p>Please note that ${company.companyName} will be observing <strong>${data.holidayName}</strong> on <strong>${data.date}</strong>.</p>
                <p>${data.message}</p>
                <p>Please plan your deliverables accordingly and update your out-of-office response if necessary.</p>
            `;
            break;
        case 'probation_completed':
            subject = `${company.companyName} — Probation Period Completed`;
            content = `
                <h2>Congratulations! 🎉</h2>
                <p>Hi ${data.name},</p>
                <p>We are delighted to confirm that you have successfully completed your probation period as <strong>${data.role}</strong>.</p>
                <p>Your employment is confirmed effective <strong>${data.effectiveDate}</strong>.</p>
                <p>We look forward to your continued success with us!</p>
            `;
            break;
        case 'document_attachment':
            subject = `${company.companyName} — Document Attachment: ${data.documentName}`;
            content = `
                <h2>Document Attachment</h2>
                <p>Hi ${data.name || 'there'},</p>
                <p>Please find the attached document: <strong>${data.documentName}</strong>.</p>
                <p>${data.message || 'This document was sent to you from the Internal Management System.'}</p>
            `;
            break;

        default:
            throw new Error(`Template ${templateId} is not defined.`);
    }

    return { subject, html: baseLayout(subject, content, company) };
}

// ── Retrofitted original exported methods ────────────────────────────────────────────────────────────

async function sendEmailTemplate(to, templateName, templateData) {
    const { subject, html } = await buildTemplate(templateName, templateData);
    return send({ to, subject, html, templateName, templateData });
}

module.exports = {
    getTemplatePreview: async (templateId, templateData) => {
        return buildTemplate(templateId, templateData);
    },

    // Specific legacy functions used across the app
    sendVerificationEmail: (to, name, verificationUrl) => sendEmailTemplate(to, 'verification', { name, verificationUrl }),
    sendPasswordResetEmail: (to, name, resetUrl) => sendEmailTemplate(to, 'password_reset', { name, resetUrl }),
    sendProjectAssignedEmail: (to, name, projectName, projectUrl) => sendEmailTemplate(to, 'project_assigned', { name, projectName, projectUrl }),
    sendTaskAssignedEmail: (to, name, taskTitle, projectName, taskUrl) => sendEmailTemplate(to, 'task_assigned', { name, taskTitle, projectName, taskUrl }),
    sendSalaryGeneratedEmail: (to, name, month, netSalary) => sendEmailTemplate(to, 'salary_generated', { name, month, netSalary }),
    sendSystemAlert: (to, subject, message) => sendEmailTemplate(to, 'system_alert', { subject, message }),
    sendWelcomeEmail: (user, password) => sendEmailTemplate(user.email, 'welcome', { name: user.name, email: user.email, password }),
    sendDocumentTagEmail: (to, name, documentName, documentUrl, senderName) => sendEmailTemplate(to, 'document_tagged', { name, documentName, documentUrl, senderName }),
    sendSalarySlip: (employee, salary) => sendEmailTemplate(employee.email, 'salary_generated', { name: employee.name, month: salary.month, netSalary: salary.netSalary }),

    sendTransitionalEmail: async (to, subject, data) => {
        const company = await getCompanyInfo();
        const html = baseLayout(subject, `
      <h2>${subject}</h2>
      <p>Hi ${data.name},</p>
      <p>${data.message}</p>
      ${data.ctaLink ? `<a href="${data.ctaLink}" class="button">${data.ctaText || 'View Details'}</a>` : ''}
    `, company);
        return send({ to, subject: `${company.companyName} — ${subject}`, html, templateName: 'transitional', templateData: data });
    },

    sendMeetingEmail: (to, name, meetingTitle, startTime, ctaUrl) => sendEmailTemplate(to, 'meeting_scheduled', { name, meetingTitle, startTime, ctaUrl }),

    sendDocumentWithAttachment: async (to, name, documentName, message, attachment) => {
        const { subject, html } = await buildTemplate('document_attachment', { name, documentName, message });
        return send({ to, subject, html, templateName: 'document_attachment', templateData: { name, documentName, message }, attachments: [attachment] });
    },

    // ── Billing / Subscription Emails ────────────────────────────────────────
    sendTrialStartedEmail: async (to, adminName, trialDays) => {
        const company = await getCompanyInfo();
        const loginUrl = process.env.CLIENT_URL || 'https://instaura.live';
        const upgradeUrl = `${loginUrl}/dashboard/billing`;
        const subject = `🎉 Your ${trialDays}-day Instaura IMS Trial Has Started!`;
        const content = `
            <h2>Welcome, ${adminName}! 🎊</h2>
            <p>Your <strong>${trialDays}-day free trial</strong> of Instaura IMS has started. You now have full access to all features.</p>
            <div class="box"><p>Trial period<strong>${trialDays} days — No credit card required</strong></p></div>
            <p>During your trial you can explore all modules: Projects, HR, Attendance, Invoices, AI Assistant, and more.</p>
            <a href="${loginUrl}" class="button">Login to Dashboard →</a>
            <p style="margin-top:24px;font-size:13px;color:#9ca3af;">When your trial ends, upgrade from your <a href="${upgradeUrl}">Billing page</a> to keep access.</p>
        `;
        const html = baseLayout(subject, content, company);
        return send({ to, subject, html, templateName: 'trial_started' });
    },

    sendTrialReminderEmail: async (to, adminName, daysLeft) => {
        const company = await getCompanyInfo();
        const upgradeUrl = `${process.env.CLIENT_URL || 'https://instaura.live'}/dashboard/billing`;
        const subject = `⚠️ Your trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — Action required`;
        const alertColor = daysLeft <= 2 ? '#fee2e2' : '#fef3c7';
        const alertBorder = daysLeft <= 2 ? '#fca5a5' : '#fde68a';
        const alertText = daysLeft <= 2 ? '#991b1b' : '#92400e';
        const content = `
            <h2>Your trial is ending soon</h2>
            <div style="background:${alertColor};border:1px solid ${alertBorder};color:${alertText};padding:14px 18px;border-radius:10px;margin:16px 0;font-size:13px;">
                ⏰ Your trial expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>
            </div>
            <p>Hi ${adminName}, your free trial will expire soon. After expiry, access to all features will be restricted.</p>
            <a href="${upgradeUrl}" class="button">Upgrade My Plan →</a>
        `;
        const html = baseLayout(subject, content, company);
        return send({ to, subject, html, templateName: 'trial_reminder' });
    },

    sendTrialExpiredEmail: async (to, adminName) => {
        const company = await getCompanyInfo();
        const upgradeUrl = `${process.env.CLIENT_URL || 'https://instaura.live'}/dashboard/billing`;
        const subject = '🔴 Your Instaura IMS trial has expired';
        const content = `
            <h2>Your trial has expired</h2>
            <div style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;padding:14px 18px;border-radius:10px;margin:16px 0;font-size:13px;">❌ Your access to IMS features is now restricted.</div>
            <p>Hi ${adminName}, your trial period has ended. Upgrade to a subscription plan to restore full access.</p>
            <a href="${upgradeUrl}" class="button">Upgrade Now →</a>
            <p style="font-size:13px;color:#9ca3af;margin-top:20px;">Your data is safe and retained for 30 days from trial expiry.</p>
        `;
        const html = baseLayout(subject, content, company);
        return send({ to, subject, html, templateName: 'trial_expired' });
    },

    sendSubscriptionConfirmationEmail: async (to, adminName, planName, amount, expiryDate) => {
        const company = await getCompanyInfo();
        const loginUrl = process.env.CLIENT_URL || 'https://instaura.live';
        const subject = `✅ Payment confirmed — ${planName} Plan activated`;
        const expiry = new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const content = `
            <h2>Payment Successful!</h2>
            <div class="box"><p>Plan<strong>${planName}</strong></p></div>
            <div class="box"><p>Amount Paid<strong>₹${Number(amount).toLocaleString('en-IN')}</strong></p></div>
            <div class="box"><p>Valid Until<strong>${expiry}</strong></p></div>
            <p style="font-size:12px;color:#9ca3af;background:#fef9ec;padding:12px 16px;border-radius:8px;border:1px solid #fde68a;margin-top:16px;">⚠️ All subscription payments are <strong>non-refundable</strong>.</p>
            <a href="${loginUrl}" class="button">Go to Dashboard →</a>
        `;
        const html = baseLayout(subject, content, company);
        return send({ to, subject, html, templateName: 'subscription_confirmation' });
    },

    sendRenewalReminderEmail: async (to, adminName, planName, daysLeft, renewalDate) => {
        const company = await getCompanyInfo();
        const upgradeUrl = `${process.env.CLIENT_URL || 'https://instaura.live'}/dashboard/billing`;
        const subject = `⏰ Your ${planName} subscription expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
        const expiry = new Date(renewalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        const alertColor = daysLeft <= 2 ? '#fee2e2' : '#fef3c7';
        const alertBorder = daysLeft <= 2 ? '#fca5a5' : '#fde68a';
        const alertText = daysLeft <= 2 ? '#991b1b' : '#92400e';
        const content = `
            <h2>Subscription expiring soon</h2>
            <div style="background:${alertColor};border:1px solid ${alertBorder};color:${alertText};padding:14px 18px;border-radius:10px;margin:16px 0;font-size:13px;">
                Your <strong>${planName}</strong> plan expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${expiry})
            </div>
            <p>Hi ${adminName}, renew now to avoid interruption.</p>
            <a href="${upgradeUrl}" class="button">Renew Subscription →</a>
        `;
        const html = baseLayout(subject, content, company);
        return send({ to, subject, html, templateName: 'renewal_reminder' });
    },
};
