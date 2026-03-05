'use strict';

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: String, required: true, index: true }, // YYYY-MM-DD
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'half_day', 'work_from_home', 'on_leave'],
            default: 'present',
        },
        checkIn: { type: String, default: '' },   // HH:MM
        checkOut: { type: String, default: '' },  // HH:MM
        notes: { type: String, default: '' },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

// Unique per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
