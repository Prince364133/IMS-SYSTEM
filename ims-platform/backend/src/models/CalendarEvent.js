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
}, { timestamps: true });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
