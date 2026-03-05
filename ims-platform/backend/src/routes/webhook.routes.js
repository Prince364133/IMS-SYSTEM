'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * Verify the shared secret from n8n webhook header
 */
function verifyWebhookSecret(req, res, next) {
    const secret = req.headers['x-webhook-secret'];
    if (!process.env.N8N_WEBHOOK_SECRET || secret !== process.env.N8N_WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    next();
}

// ── Incoming webhooks FROM n8n ─────────────────────────────────────────────────
router.post('/project-assigned', verifyWebhookSecret, async (req, res, next) => {
    try {
        const { projectId, userId, message } = req.body;
        const Notification = require('../models/Notification');
        await Notification.create({
            userId,
            type: 'project_assigned',
            title: 'New Project Assigned',
            message: message || 'You have been assigned to a project.',
            relatedId: projectId,
            relatedModel: 'Project',
            link: `/projects/${projectId}`,
        });
        res.json({ received: true });
    } catch (err) { next(err); }
});

router.post('/salary-generated', verifyWebhookSecret, async (req, res, next) => {
    try {
        const { employeeId, month, netSalary } = req.body;
        const Notification = require('../models/Notification');
        await Notification.create({
            userId: employeeId,
            type: 'salary_generated',
            title: 'Salary Generated',
            message: `Your salary for ${month} has been generated: ₹${netSalary}`,
            link: '/hr/salary',
        });
        res.json({ received: true });
    } catch (err) { next(err); }
});

// ── Outgoing webhook triggers (called from backend controllers) ────────────────
const axios = process.env.N8N_BASE_URL ? require('https') : null;

async function triggerN8nWebhook(path, data) {
    const Settings = require('../models/Settings');
    try {
        const settings = await Settings.findOne();
        const baseUrl = settings?.webhookUrl;
        const secret = settings?.webhookSecret || '';

        if (!baseUrl) return; // Webhooks not configured

        const url = `${baseUrl.replace(/\/$/, '')}/${path}`;

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': secret,
            },
            body: JSON.stringify(data),
        });
    } catch (err) {
        console.warn('[Webhook] trigger failed:', err.message);
    }
}

module.exports = router;
module.exports.triggerN8nWebhook = triggerN8nWebhook;
