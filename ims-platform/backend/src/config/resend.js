'use strict';

const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@internal.system';

if (resend) {
    console.log('✅ Resend email service configured');
} else {
    console.warn('⚠️  RESEND_API_KEY not set — email sending will be skipped');
}

/**
 * Send an email via Resend
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.from]
 */
async function sendEmail({ to, subject, html, from = FROM_EMAIL }) {
    if (!resend) {
        console.warn('[Email] Skipped (no Resend API key):', subject);
        return null;
    }
    try {
        const result = await resend.emails.send({ from, to, subject, html });
        return result;
    } catch (err) {
        console.error('[Email] Send error:', err.message);
        throw err;
    }
}

module.exports = { resend, sendEmail };
