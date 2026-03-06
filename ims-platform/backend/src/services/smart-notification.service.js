'use strict';

const EmailService = require('./email.service');
const Notification = require('../models/Notification');
const AnalyticsService = require('./analytics.service');
const { getIo, onlineUsers } = require('../sockets');

/**
 * Smart Notification Service
 * Handles delivery optimization, prioritization, and delivery channel selection.
 */
class SmartNotificationService {
    /**
     * Send notification with smart routing
     * @param {Object} params - { userId, type, title, message, actionUrl, priority }
     */
    async send(params) {
        const { userId, type, title, message, actionUrl, priority = 'medium' } = params;

        // 1. Save to Database for persistence
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            actionUrl,
            priority
        });

        // 2. Real-time Socket Delivery
        const io = getIo();
        if (io) {
            const sockets = onlineUsers.get(userId.toString());
            if (sockets) {
                for (const sid of sockets) {
                    io.to(sid).emit('notification:new', notification);
                }
            }
        }

        // 3. Smart Email Delivery
        // Logic: Calculate score to determine if we should send immediate email
        const score = AnalyticsService.calculateNotificationScore(
            priority === 'high' ? 3 : (priority === 'medium' ? 2 : 1),
            ['meeting_reminder', 'project_deadline', 'project_risk_alert', 'task_overdue'].includes(type) ? 3 : 1,
            1 // Default relevance
        );

        const isUserOnline = onlineUsers.has(userId.toString());
        const THRESHOLD = 4; // Threshold for immediate email dispatch

        const shouldSendEmail = score >= THRESHOLD || !isUserOnline;

        if (shouldSendEmail) {
            const User = require('../models/User');
            const user = await User.findById(userId).select('name email').lean();
            if (user && user.email) {
                // Determine template or use generic
                if (type === 'task_assigned') {
                    // Handled by specific triggers or generalized here
                    await EmailService.sendTransitionalEmail(user.email, title, {
                        name: user.name,
                        message: message,
                        ctaLink: actionUrl ? `${process.env.CLIENT_URL}${actionUrl}` : null,
                        ctaText: 'View Details'
                    });
                } else {
                    await EmailService.sendTransitionalEmail(user.email, title, {
                        name: user.name,
                        message: message,
                        ctaLink: actionUrl ? `${process.env.CLIENT_URL}${actionUrl}` : null
                    });
                }
            }
        }

        return notification;
    }

    /**
     * Batch notifications for a user to reduce fatigue (Daily Summary)
     * To be called by CronService
     */
    async sendDailySummary(userId) {
        // Find unread low/medium notifications for the last 24h
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const unread = await Notification.find({
            userId,
            isRead: false,
            createdAt: { $gte: yesterday },
            priority: { $ne: 'high' }
        }).lean();

        if (unread.length === 0) return;

        const User = require('../models/User');
        const user = await User.findById(userId).select('name email').lean();
        if (user && user.email) {
            const summary = unread.map(n => `• ${n.title}: ${n.message}`).join('\n');
            await EmailService.sendTransitionalEmail(user.email, 'Your Daily Activity Summary', {
                name: user.name,
                message: `You have ${unread.length} new notifications:\n\n${summary}`,
                ctaLink: `${process.env.CLIENT_URL}/dashboard/notifications`,
                ctaText: 'Open Notifications'
            });
        }
    }
}

module.exports = new SmartNotificationService();
