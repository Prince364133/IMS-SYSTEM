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

    // Create initial log entry
    const log = await EmailLog.create({
      to: options.to,
      subject: options.subject,
      templateName: options.templateName || 'generic',
      templateData: options.templateData || {},
      sentBy: options.sentBy || null,
      status: 'failed', // Default to failed until success
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

// ── Email templates ────────────────────────────────────────────────────────────

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

/**
 * Send account verification email
 */
async function sendVerificationEmail(to, name, verificationUrl) {
  const company = await getCompanyInfo();
  const html = baseLayout('Verify Your Email', `
    <h2>Welcome to ${company.companyName}, ${name}! 👋</h2>
    <p>Your account has been created. Please verify your email address to get started.</p>
    <a href="${verificationUrl}" class="button">Verify Email Address</a>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af;">If you didn't create this account, you can safely ignore this email.</p>
  `, company);
  return send({
    to,
    subject: `Welcome to ${company.companyName} — Verify Your Email`,
    html,
    templateName: 'verification',
    templateData: { name, verificationUrl }
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(to, name, resetUrl) {
  const company = await getCompanyInfo();
  const html = baseLayout('Reset Your Password', `
    <h2>Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
  `, company);
  return send({
    to,
    subject: `${company.companyName} — Password Reset`,
    html,
    templateName: 'password_reset',
    templateData: { name, resetUrl }
  });
}

/**
 * Send project assignment notification
 */
async function sendProjectAssignedEmail(to, name, projectName, projectUrl) {
  const company = await getCompanyInfo();
  const html = baseLayout('New Project Assigned', `
    <h2>You've been assigned to a project</h2>
    <p>Hi ${name},</p>
    <p>You have been added as a member of the following project:</p>
    <p><span class="badge" style="color: ${company.brandColor}; border-color: ${company.brandColor}55;">${projectName}</span></p>
    <a href="${projectUrl}" class="button">View Project</a>
  `, company);
  return send({
    to,
    subject: `${company.companyName} — Project Assigned: ${projectName}`,
    html,
    templateName: 'project_assigned',
    templateData: { name, projectName, projectUrl }
  });
}

/**
 * Send salary notification
 */
async function sendSalaryGeneratedEmail(to, name, month, netSalary) {
  const company = await getCompanyInfo();
  const html = baseLayout('Salary Generated', `
    <h2>Your salary has been generated</h2>
    <p>Hi ${name},</p>
    <p>Your salary for <strong>${month}</strong> has been processed:</p>
    <p style="font-size:32px;font-weight:700;color:${company.brandColor || '#4f46e5'};margin:16px 0;">₹${Number(netSalary).toLocaleString()}</p>
    <a href="${process.env.CLIENT_URL}/dashboard/hr" class="button">View Salary Details</a>
  `, company);
  return send({
    to,
    subject: `${company.companyName} — Salary for ${month}`,
    html,
    templateName: 'salary_generated',
    templateData: { name, month, netSalary }
  });
}

/**
 * Send generic system alert
 */
async function sendSystemAlert(to, subject, message) {
  const company = await getCompanyInfo();
  const html = baseLayout(subject, `<h2>System Alert</h2><p>${message}</p>`, company);
  return send({ to, subject: `${company.companyName} — ${subject}`, html });
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user, password) {
  const company = await getCompanyInfo();
  const loginUrl = process.env.CLIENT_URL;
  const html = baseLayout(`Welcome to ${company.companyName}`, `
    <h2>Welcome aboard, ${user.name}! 🚀</h2>
    <p>Your account has been created successfully. You can now log in to the ${company.companyName} management system using the credentials below:</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #64748b; font-size: 13px;">Email Address</p>
      <p style="margin: 4px 0 12px; font-weight: 600; color: #1a1a2e;">${user.email}</p>
      <p style="margin: 0; color: #64748b; font-size: 13px;">Temporary Password</p>
      <p style="margin: 4px 0 0; font-weight: 600; color: #1a1a2e;">${password}</p>
    </div>
    <a href="${loginUrl}" class="button">Log In to Dashboard</a>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af;">For security reasons, we recommend changing your password after your first login.</p>
  `, company);
  return send({
    to: user.email,
    subject: `Welcome to ${company.companyName} — Your Account is Ready`,
    html,
    templateName: 'welcome',
    templateData: { name: user.name, password }
  });
}

/**
 * Send document tag notification
 */
async function sendDocumentTagEmail(to, name, documentName, documentUrl, senderName) {
  const company = await getCompanyInfo();
  const html = baseLayout('Document Shared With You', `
    <h2>You've been tagged in a document</h2>
    <p>Hi ${name},</p>
    <p><strong>${senderName}</strong> has tagged you in a new document:</p>
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #64748b; font-size: 13px;">Document Title</p>
      <p style="margin: 4px 0; font-weight: 600; color: #1a1a2e;">${documentName}</p>
    </div>
    <a href="${documentUrl}" class="button">View Document</a>
  `, company);
  return send({
    to,
    subject: `${company.companyName} — Document Shared: ${documentName}`,
    html,
    templateName: 'document_tagged',
    templateData: { name, documentName, documentUrl, senderName }
  });
}

/**
 * Send salary slip notification (Alias for controller consistency)
 */
async function sendSalarySlip(employee, salary) {
  return sendSalaryGeneratedEmail(employee.email, employee.name, salary.month, salary.netSalary);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendProjectAssignedEmail,
  sendSalaryGeneratedEmail,
  sendSalarySlip,
  sendWelcomeEmail,
  sendSystemAlert,
  sendTaskAssignedEmail: async (to, name, taskTitle, projectName, taskUrl) => {
    const company = await getCompanyInfo();
    const html = baseLayout('New Task Assigned', `
      <h2>New Task: ${taskTitle}</h2>
      <p>Hi ${name},</p>
      <p>You have been assigned to a new task in project <strong>${projectName}</strong>.</p>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #64748b; font-size: 13px;">Task Title</p>
        <p style="margin: 4px 0; font-weight: 600; color: #1a1a2e;">${taskTitle}</p>
      </div>
      <a href="${taskUrl}" class="button">View Task Details</a>
    `, company);
    return send({ to, subject: `${company.companyName} — Task Assigned: ${taskTitle}`, html });
  },
  sendDocumentTagEmail,
};
