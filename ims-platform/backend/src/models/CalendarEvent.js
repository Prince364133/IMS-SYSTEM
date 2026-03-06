'use strict';
const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['holiday', 'event', 'meeting', 'deadline', 'leave', 'other'], default: 'event' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    allDay: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    color: { type: String, default: '#4f46e5' },
    isCompanyWide: { type: Boolean, default: false },

    // ── Meeting-specific fields ───────────────────────────────────────────────
    meeting: {
        startTime: { type: String, default: null },      // e.g. "10:00"
        endTime: { type: String, default: null },        // e.g. "11:00"
        platform: {
            type: String,
            enum: ['google_meet', 'zoom', 'teams', 'in_person', 'phone', 'other'],
            default: 'google_meet'
        },
        meetingLink: { type: String, default: null },    // Google Meet / Zoom URL
        location: { type: String, default: null },       // for in-person
        agenda: { type: String, default: null },         // bullet-point agenda
        attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // internal users
        externalAttendees: [{ type: String }],           // raw email addresses
        reminderMinutes: { type: Number, default: 15 },  // reminder before meeting
        notes: { type: String, default: null },          // additional notes
        emailSent: { type: Boolean, default: false },
    },
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
