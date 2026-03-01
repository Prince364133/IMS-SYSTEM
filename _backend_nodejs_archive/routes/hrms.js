const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hrms/dashboard  — unified HRMS + IMS dashboard summary
//
// Returns (single aggregated query — efficient):
//   employees:          { total, active, byDepartment, byRole }
//   todayAttendance:    { present, absent, late, half_day, wfh, on_leave, unmarked }
//   projects:           { total, inProgress, completed }
//   tasks:              { total, openTasks }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);

    try {
        // Run all aggregations in parallel — one round-trip
        const [
            employeeStats,
            attendanceStats,
            projectStats,
            taskStats,
        ] = await Promise.all([
            // ── Employee breakdown ──────────────────────────────────────────
            User.aggregate([
                { $match: { role: { $in: ['employee', 'manager', 'hr'] }, isActive: true } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        byDept: {
                            $push: {
                                department: { $ifNull: ['$department', 'Unassigned'] },
                            },
                        },
                        byRole: { $push: '$role' },
                    },
                },
            ]),

            // ── Today's attendance by status ───────────────────────────────
            Attendance.aggregate([
                { $match: { date: today } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),

            // ── Project summary ────────────────────────────────────────────
            Project.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    },
                },
            ]),

            // ── Open task count ────────────────────────────────────────────
            Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } }),
        ]);

        // ── Process employee stats ─────────────────────────────────────────
        const empData = employeeStats[0] || { total: 0, byDept: [], byRole: [] };
        const deptMap = {};
        empData.byDept.forEach(({ department }) => {
            deptMap[department] = (deptMap[department] || 0) + 1;
        });
        const roleMap = {};
        empData.byRole.forEach(r => { roleMap[r] = (roleMap[r] || 0) + 1; });

        // ── Process attendance stats ───────────────────────────────────────
        const attMap = {};
        attendanceStats.forEach(({ _id, count }) => { attMap[_id] = count; });
        const totalMarked = Object.values(attMap).reduce((a, b) => a + b, 0);
        const unmarked = Math.max(0, empData.total - totalMarked);

        // ── Build response ─────────────────────────────────────────────────
        const proj = projectStats[0] || { total: 0, inProgress: 0, completed: 0 };

        res.json({
            employees: {
                total: empData.total,
                byDepartment: deptMap,
                byRole: roleMap,
            },
            todayAttendance: {
                date: today,
                present: attMap['present'] || 0,
                absent: attMap['absent'] || 0,
                late: attMap['late'] || 0,
                half_day: attMap['half_day'] || 0,
                work_from_home: attMap['work_from_home'] || 0,
                on_leave: attMap['on_leave'] || 0,
                unmarked,
            },
            projects: {
                total: proj.total,
                inProgress: proj.inProgress,
                completed: proj.completed,
            },
            openTasks: taskStats,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hrms/attendance-report?month=YYYY-MM  — monthly report
// ─────────────────────────────────────────────────────────────────────────────
router.get('/attendance-report', async (req, res) => {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month parameter required in YYYY-MM format' });
    }

    try {
        const records = await Attendance.find({ date: { $regex: `^${month}` } })
            .populate('employee', 'name employeeId department')
            .lean();

        // Group by employee
        const byEmployee = {};
        records.forEach(r => {
            const id = r.employee?._id?.toString() || 'unknown';
            const name = r.employee?.name || 'Unknown';
            if (!byEmployee[id]) {
                byEmployee[id] = {
                    employee: r.employee,
                    present: 0, absent: 0, late: 0,
                    half_day: 0, work_from_home: 0, on_leave: 0,
                    records: [],
                };
            }
            byEmployee[id][r.status] = (byEmployee[id][r.status] || 0) + 1;
            byEmployee[id].records.push({ date: r.date, status: r.status, checkIn: r.checkIn, checkOut: r.checkOut });
        });

        res.json({ month, report: Object.values(byEmployee), totalRecords: records.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
