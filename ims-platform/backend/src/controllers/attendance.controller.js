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

        const employees = await User.find({ role: 'employee', isActive: true }).lean();
        const records = await Attendance.find({ date: { $regex: `^${month}` } }).lean();

        // Build summary per employee
        const summary = employees.map((emp) => {
            const empRecords = records.filter((r) => r.employeeId.toString() === emp._id.toString());
            const countBy = (status) => empRecords.filter((r) => r.status === status).length;
            return {
                employee: { _id: emp._id, name: emp.name, employeeId: emp.employeeId, department: emp.department },
                present: countBy('present'),
                absent: countBy('absent'),
                late: countBy('late'),
                halfDay: countBy('half_day'),
                wfh: countBy('work_from_home'),
                onLeave: countBy('on_leave'),
                total: empRecords.length,
            };
        });

        res.json({ month, summary, employeeCount: employees.length });
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
