'use strict';

const Attendance = require('../models/Attendance');
const User = require('../models/User');

exports.getAttendance = async (req, res, next) => {
    try {
        const { employeeId, date, month, page = 1, limit = 100 } = req.query;
        const query = {};
        if (employeeId) query.employeeId = employeeId;
        if (date) query.date = date;
        if (month) query.date = { $regex: `^${month}` }; // YYYY-MM prefix match

        const skip = (Number(page) - 1) * Number(limit);
        const [records, total] = await Promise.all([
            Attendance.find(query)
                .populate('employeeId', 'name email employeeId photoUrl department')
                .populate('markedBy', 'name email')
                .sort({ date: -1 })
                .skip(skip).limit(Number(limit)).lean(),
            Attendance.countDocuments(query),
        ]);
        res.json({ records, total });
    } catch (err) { next(err); }
};

exports.getMyAttendance = async (req, res, next) => {
    try {
        const { month } = req.query;
        const query = { employeeId: req.user._id };
        if (month) query.date = { $regex: `^${month}` };

        const records = await Attendance.find(query).sort({ date: -1 }).lean();
        res.json({ records });
    } catch (err) { next(err); }
};

exports.getMonthlyReport = async (req, res, next) => {
    try {
        const { month } = req.query; // YYYY-MM
        if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

        // Include ALL active users (not just employees)
        const employees = await User.find({ isActive: true, role: { $ne: 'client' } }).lean();
        const records = await Attendance.find({ date: { $regex: `^${month}` } }).lean();

        // Count working days in the month (Mon–Sat, or all — simplified to calendar days minus Sundays)
        const [y, m] = month.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        let workingDays = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(y, m - 1, d).getDay();
            if (day !== 0) workingDays++; // exclude Sundays
        }

        // Build summary per employee
        const summary = employees.map((emp) => {
            const empRecords = records.filter((r) => r.employeeId.toString() === emp._id.toString());
            const countBy = (status) => empRecords.filter((r) => r.status === status).length;
            const present = countBy('present');
            const late = countBy('late');
            const halfDay = countBy('half_day');
            const wfh = countBy('work_from_home');
            const onLeave = countBy('on_leave');
            const absent = countBy('absent');
            const totalMarked = empRecords.length;
            const attendanceRate = workingDays > 0 ? Math.round(((present + late + wfh + halfDay * 0.5) / workingDays) * 100) : 0;
            // Latest check-in/out
            const checkIns = empRecords.filter(r => r.checkIn).map(r => r.checkIn).sort();
            const checkOuts = empRecords.filter(r => r.checkOut).map(r => r.checkOut).sort().reverse();
            return {
                employee: { _id: emp._id, name: emp.name, employeeId: emp.employeeId, department: emp.department, role: emp.role, photoUrl: emp.photoUrl },
                present, absent, late, halfDay, wfh, onLeave,
                total: totalMarked,
                workingDays,
                attendanceRate,
                avgCheckIn: checkIns[Math.floor(checkIns.length / 2)] || null,
            };
        });

        // Overall stats
        const totalPresent = summary.reduce((a, s) => a + s.present, 0);
        const totalAbsent = summary.reduce((a, s) => a + s.absent, 0);
        const totalLate = summary.reduce((a, s) => a + s.late, 0);
        const totalWFH = summary.reduce((a, s) => a + s.wfh, 0);
        const totalLeave = summary.reduce((a, s) => a + s.onLeave, 0);

        res.json({
            month, summary, employeeCount: employees.length, workingDays,
            totals: { present: totalPresent, absent: totalAbsent, late: totalLate, wfh: totalWFH, onLeave: totalLeave },
        });
    } catch (err) { next(err); }
};

exports.markAttendance = async (req, res, next) => {
    try {
        const { employeeId, date, status, checkIn, checkOut, notes } = req.body;
        const record = await Attendance.findOneAndUpdate(
            { employeeId, date },
            { status, checkIn, checkOut, notes, markedBy: req.user._id },
            { upsert: true, new: true, runValidators: true }
        ).lean();
        res.status(200).json({ record });
    } catch (err) { next(err); }
};

exports.updateAttendance = async (req, res, next) => {
    try {
        const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
        if (!record) return res.status(404).json({ error: 'Record not found' });
        res.json({ record });
    } catch (err) { next(err); }
};
