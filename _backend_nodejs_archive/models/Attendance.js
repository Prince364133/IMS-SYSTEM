const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// Attendance model  (HRMS Lite integration)
//
// Industry-grade status enum:
//   present | absent | late | half_day | work_from_home | on_leave
//
// Unique compound index {employee + date} → one record per person per day.
// Date stored as "YYYY-MM-DD" string (10 bytes vs 24 for ISO) for efficiency.
// ─────────────────────────────────────────────────────────────────────────────

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,       // fast look-up by employee
        },
        date: {
            type: String,     // "YYYY-MM-DD" — 10 bytes, fast equality search
            required: true,
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'],
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'half_day', 'work_from_home', 'on_leave'],
            required: true,
        },
        checkIn: { type: String, default: '' },  // "HH:MM" e.g. "09:05"
        checkOut: { type: String, default: '' },  // "HH:MM" e.g. "18:30"
        notes: { type: String, default: '', maxlength: 300 },

        // Who marked this record (admin/manager/hr)
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        // Return virtuals in JSON
        toJSON: { virtuals: true },
    }
);

// ── Compound unique index: one record per employee per day ─────────────────
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// ── TTL-style: optionally auto-archive logs older than N years (commented out)
// attendanceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60*60*24*365*3 });

module.exports = mongoose.model('Attendance', attendanceSchema);
