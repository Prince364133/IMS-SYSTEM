'use strict';
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
const EmailService = require('../services/email.service');
const CompanyConfig = require('../models/CompanyConfig');

// ── Helper: send meeting invite emails ────────────────────────────────────────
async function sendMeetingInvites(event, creator) {
    if (!event.meeting) return;

    const { startTime, endTime, platform, meetingLink, location, agenda, attendees, externalAttendees, notes } = event.meeting;

    // Collect all email addresses
    const emailTargets = [];

    // Internal attendees (User objects already populated)
    if (attendees && attendees.length) {
        attendees.forEach(u => {
            if (u && u.email) emailTargets.push({ email: u.email, name: u.name });
        });
    }

    // External attendees
    if (externalAttendees && externalAttendees.length) {
        externalAttendees.forEach(email => emailTargets.push({ email, name: email }));
    }

    if (!emailTargets.length) return;

    const platformLabels = {
        google_meet: '🟢 Google Meet',
        zoom: '🔵 Zoom',
        teams: '🟣 Microsoft Teams',
        in_person: '🏢 In Person',
        phone: '📞 Phone Call',
        other: '📅 Meeting',
    };

    const platformLabel = platformLabels[platform] || 'Meeting';
    const dateStr = new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = startTime ? `${startTime}${endTime ? ' – ' + endTime : ''}` : 'All Day';
    const linkLine = meetingLink ? `<p><strong>Join:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : '';
    const locationLine = location ? `<p><strong>Location:</strong> ${location}</p>` : '';
    const agendaLine = agenda ? `<p><strong>Agenda:</strong></p><pre style="background:#f9fafb;padding:12px;border-radius:8px;font-size:13px;">${agenda}</pre>` : '';
    const notesLine = notes ? `<p><strong>Notes:</strong> ${notes}</p>` : '';
    const callerName = creator?.name || 'Your Admin';

    const config = await CompanyConfig.findOne();
    const companyName = config?.companyName || 'Internal Management System';

    const htmlBody = `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:28px 32px;">
            <h1 style="color:#fff;margin:0;font-size:22px;">📅 Meeting Invitation</h1>
            <p style="color:#c7d2fe;margin:6px 0 0;">${event.title}</p>
          </div>
          <div style="padding:28px 32px;color:#374151;">
            <p>Hi there,</p>
            <p>You have been invited to a meeting by <strong>${callerName}</strong>.</p>
            <div style="background:#f3f4f6;border-radius:10px;padding:18px 20px;margin:20px 0;border-left:4px solid #6366f1;">
              <p style="margin:0 0 6px;"><strong>📆 Date:</strong> ${dateStr}</p>
              <p style="margin:0 0 6px;"><strong>⏰ Time:</strong> ${timeStr}</p>
              <p style="margin:0 0 6px;"><strong>📡 Platform:</strong> ${platformLabel}</p>
              ${linkLine}
              ${locationLine}
            </div>
            ${agendaLine}
            ${notesLine}
            ${event.description ? `<p><strong>Details:</strong> ${event.description}</p>` : ''}
            <p style="margin-top:24px;color:#6b7280;font-size:13px;">Please add this to your calendar. If you have questions, reply to this email or contact ${callerName}.</p>
          </div>
          <div style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af;">
            Sent by IMS · ${companyName}
          </div>
        </div>`;

    // Send to all targets
    for (const target of emailTargets) {
        try {
            await EmailService.sendSystemAlert(target.email, `📅 Meeting Invite: ${event.title}`, htmlBody);
        } catch (e) {
            console.error(`Failed to send meeting invite to ${target.email}:`, e.message);
        }
    }
}

// GET /api/calendar - list all events (with optional month/year filter)
router.get('/', protect, async (req, res, next) => {
    try {
        const { year, month } = req.query;
        let filter = {};
        if (year && month) {
            // Get the full calendar month bounds (UTC midnight to end of last day)
            const y = parseInt(year, 10);
            const m = parseInt(month, 10);
            const monthStart = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
            const monthEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)); // last day of month

            // Fetch any event that overlaps this month:
            // startDate <= monthEnd AND (endDate >= monthStart OR startDate >= monthStart)
            filter = {
                startDate: { $lte: monthEnd },
                $or: [
                    { endDate: { $gte: monthStart } },
                    { endDate: null },
                    { endDate: { $exists: false } },
                ],
            };
        }
        const events = await CalendarEvent.find(filter)
            .populate('createdBy', 'name')
            .populate('meeting.attendees', 'name email avatar role')
            .sort({ startDate: 1 }).lean();
        res.json({ events });
    } catch (err) { next(err); }
});

// POST /api/calendar - create event (admin only)
router.post('/', protect, requireAdmin, async (req, res, next) => {
    try {
        const body = { ...req.body, createdBy: req.user._id };
        const event = await CalendarEvent.create(body);

        // Auto-send meeting invite emails
        if (event.type === 'meeting' && event.meeting) {
            const populated = await CalendarEvent.findById(event._id)
                .populate('meeting.attendees', 'name email')
                .lean();
            const creator = await User.findById(req.user._id).select('name email').lean();
            await sendMeetingInvites(populated, creator);

            // Mark email as sent
            await CalendarEvent.findByIdAndUpdate(event._id, { 'meeting.emailSent': true });
        }

        res.status(201).json({ event });
    } catch (err) { next(err); }
});

// PUT /api/calendar/:id - update event (admin only)
router.put('/:id', protect, requireAdmin, async (req, res, next) => {
    try {
        const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('meeting.attendees', 'name email avatar role')
            .lean();
        if (!event) return res.status(404).json({ error: 'Not found' });
        res.json({ event });
    } catch (err) { next(err); }
});

// POST /api/calendar/:id/resend-invite - resend meeting invites
router.post('/:id/resend-invite', protect, requireAdmin, async (req, res, next) => {
    try {
        const event = await CalendarEvent.findById(req.params.id)
            .populate('meeting.attendees', 'name email')
            .lean();
        if (!event) return res.status(404).json({ error: 'Event not found' });
        if (event.type !== 'meeting') return res.status(400).json({ error: 'Not a meeting event' });
        const creator = await User.findById(req.user._id).select('name email').lean();
        await sendMeetingInvites(event, creator);
        res.json({ message: 'Invites resent successfully' });
    } catch (err) { next(err); }
});

// DELETE /api/calendar/:id - delete event (admin only)
router.delete('/:id', protect, requireAdmin, async (req, res, next) => {
    try {
        await CalendarEvent.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
