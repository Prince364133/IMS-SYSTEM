const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);                           // all routes require login

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance  — mark attendance for an employee
// Body: { employee, date, status, checkIn?, checkOut?, notes? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', authorize('admin', 'manager', 'hr'), async (req, res) => {
    const { employee, date, status, checkIn, checkOut, notes } = req.body;

    if (!employee || !date || !status) {
        return res.status(400).json({ error: 'employee, date, and status are required' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'date must be YYYY-MM-DD format' });
    }

    // Ensure employee exists
    const emp = await User.findById(employee).lean();
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    try {
        const record = await Attendance.create({
            employee, date, status,
            checkIn: checkIn || '',
            checkOut: checkOut || '',
            notes: notes || '',
            markedBy: req.user._id,
        });
        await record.populate('employee', 'name employeeId department photoUrl');
        res.status(201).json({ attendance: record });
    } catch (err) {
        // Duplicate key violation from compound index
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Attendance already marked for this employee on this date' });
        }
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/today  — all attendance records for today
// ─────────────────────────────────────────────────────────────────────────────
router.get('/today', async (req, res) => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    try {
        const records = await Attendance.find({ date: today })
            .populate('employee', 'name employeeId department photoUrl')
            .lean();
        res.json({ date: today, records, count: records.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance/employee/:userId  — attendance history for one employee
// Query: ?date=YYYY-MM-DD  ?month=YYYY-MM  ?limit=30  ?skip=0
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employee/:userId', async (req, res) => {
    const { date, month, limit = 60, skip = 0 } = req.query;
    const filter = { employee: req.params.userId };

    if (date) filter.date = date;
    if (month) filter.date = { $regex: `^${month}` };  // "^2024-03" matches all March dates

    try {
        const records = await Attendance.find(filter)
            .sort({ date: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .populate('markedBy', 'name')
            .lean();

        const total = await Attendance.countDocuments(filter);
        res.json({ records, total, userId: req.params.userId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/attendance/:id  — correct a record
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', authorize('admin', 'manager', 'hr'), async (req, res) => {
    const allowed = ['status', 'checkIn', 'checkOut', 'notes'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    try {
        const record = await Attendance.findByIdAndUpdate(req.params.id, updates, {
            new: true, runValidators: true,
        }).populate('employee', 'name employeeId');
        if (!record) return res.status(404).json({ error: 'Attendance record not found' });
        res.json({ attendance: record });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/attendance/:id  — admin only
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        const record = await Attendance.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ error: 'Attendance record not found' });
        res.json({ message: 'Attendance record deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
