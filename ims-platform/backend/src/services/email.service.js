'use strict';

const { sendEmail: send } = require('../config/resend');

// ── Email templates ────────────────────────────────────────────────────────────

function baseLayout(title, content) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f6f8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .body h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #4b5563; line-height: 1.7; margin: 0 0 16px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .badge { display: inline-block; background: #f0f4ff; color: #6366f1; border: 1px solid #c7d2fe; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Instaura IMS</h1>
      <p>Internal Management System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © ${new Date().getFullYear()} Instaura. All rights reserved.<br>
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
    const html = baseLayout('Verify Your Email', `
    <h2>Welcome to Instaura IMS, ${name}! 👋</h2>
    <p>Your account has been created. Please verify your email address to get started.</p>
    <a href="${verificationUrl}" class="button">Verify Email Address</a>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af;">If you didn't create this account, you can safely ignore this email.</p>
  `);
    return send({ to, subject: 'Welcome to Instaura IMS — Verify Your Email', html });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(to, name, resetUrl) {
    const html = baseLayout('Reset Your Password', `
    <h2>Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p style="margin-top:24px;font-size:13px;color:#9ca3af;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
  `);
    return send({ to, subject: 'Instaura IMS — Password Reset', html });
}

/**
 * Send project assignment notification
 */
async function sendProjectAssignedEmail(to, name, projectName, projectUrl) {
    const html = baseLayout('New Project Assigned', `
    <h2>You've been assigned to a project</h2>
    <p>Hi ${name},</p>
    <p>You have been added as a member of the following project:</p>
    <p><span class="badge">${projectName}</span></p>
    <a href="${projectUrl}" class="button">View Project</a>
  `);
    return send({ to, subject: `Instaura IMS — Project Assigned: ${projectName}`, html });
}

/**
 * Send salary notification
 */
async function sendSalaryGeneratedEmail(to, name, month, netSalary) {
    const html = baseLayout('Salary Generated', `
    <h2>Your salary has been generated</h2>
    <p>Hi ${name},</p>
    <p>Your salary for <strong>${month}</strong> has been processed:</p>
    <p style="font-size:32px;font-weight:700;color:#6366f1;margin:16px 0;">₹${Number(netSalary).toLocaleString()}</p>
    <a href="${process.env.CLIENT_URL}/hr/salary" class="button">View Salary Details</a>
  `);
    return send({ to, subject: `Instaura IMS — Salary for ${month}`, html });
}

/**
 * Send generic system alert
 */
async function sendSystemAlert(to, subject, message) {
    const html = baseLayout(subject, `<h2>System Alert</h2><p>${message}</p>`);
    return send({ to, subject: `Instaura IMS — ${subject}`, html });
}

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendProjectAssignedEmail,
    sendSalaryGeneratedEmail,
    sendSystemAlert,
};
