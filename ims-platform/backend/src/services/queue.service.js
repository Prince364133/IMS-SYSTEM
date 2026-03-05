'use strict';

const { Queue, Worker } = require('bullmq');
const { redis } = require('../config/redis');

let emailQueue = null;
let notificationQueue = null;
let automationQueue = null;

async function initQueues() {
    if (!redis) {
        console.warn('[Queue] Skipping queue init — Redis not configured');
        return;
    }

    const connection = redis;

    emailQueue = new Queue('email', { connection });
    notificationQueue = new Queue('notification', { connection });
    automationQueue = new Queue('automation', { connection });

    // ── Email Worker ──────────────────────────────────────────────────────────
    const emailWorker = new Worker('email', async (job) => {
        const { sendEmail } = require('../config/resend');
        const { to, subject, html } = job.data;
        await sendEmail({ to, subject, html });
        console.log(`[Queue] Email sent to ${to}: ${subject}`);
    }, { connection });

    // ── Notification Worker ───────────────────────────────────────────────────
    const notificationWorker = new Worker('notification', async (job) => {
        const Notification = require('../models/Notification');
        await Notification.create(job.data);
        console.log(`[Queue] Notification created for user ${job.data.userId}`);
    }, { connection });

    // ── Automation Worker ─────────────────────────────────────────────────────
    const automationWorker = new Worker('automation', async (job) => {
        const { triggerN8nWebhook } = require('../routes/webhook.routes');
        await triggerN8nWebhook(job.data.path, job.data.payload);
        console.log(`[Queue] Automation triggered: ${job.data.path}`);
    }, { connection });

    [emailWorker, notificationWorker, automationWorker].forEach((w) => {
        w.on('failed', (job, err) => console.error(`[Queue] ${job?.name} failed:`, err.message));
    });

    console.log('✅ BullMQ queues initialized (email, notification, automation)');
}

/**
 * Add an email job to the queue
 */
async function queueEmail({ to, subject, html }) {
    if (!emailQueue) {
        const { sendEmail } = require('../config/resend');
        return sendEmail({ to, subject, html }); // fallback: send directly
    }
    return emailQueue.add('send', { to, subject, html }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
}

/**
 * Add a notification job to the queue
 */
async function queueNotification(data) {
    if (!notificationQueue) {
        const Notification = require('../models/Notification');
        return Notification.create(data);
    }
    return notificationQueue.add('create', data);
}

/**
 * Trigger an n8n automation via queue
 */
async function queueAutomation(path, payload) {
    if (!automationQueue) return;
    return automationQueue.add('trigger', { path, payload });
}

module.exports = { initQueues, queueEmail, queueNotification, queueAutomation };
