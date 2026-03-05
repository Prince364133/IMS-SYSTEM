'use strict';

const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const { format, startOfMonth, endOfMonth } = require('../utils/dateHelpers');

exports.getDashboard = async (req, res, next) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        const [
            totalEmployees, activeEmployees,
            totalProjects, activeProjects,
            totalTasks, pendingTasks,
            todayAttendance, totalClients,
            pendingSalaries,
        ] = await Promise.all([
            User.countDocuments({ role: 'employee' }),
            User.countDocuments({ role: 'employee', isActive: true }),
            Project.countDocuments({}),
            Project.countDocuments({ status: 'in_progress' }),
            Task.countDocuments({}),
            Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } }),
            Attendance.countDocuments({ date: today, status: 'present' }),
            require('../models/Client').countDocuments({}),
            Salary.countDocuments({ month: thisMonth, status: 'pending' }),
        ]);

        // Attendance rate for today
        const attendanceRate = totalEmployees > 0
            ? Math.round((todayAttendance / activeEmployees) * 100)
            : 0;

        res.json({
            employees: { total: totalEmployees, active: activeEmployees },
            projects: { total: totalProjects, active: activeProjects },
            tasks: { total: totalTasks, pending: pendingTasks },
            attendance: { today: todayAttendance, rate: attendanceRate },
            clients: { total: totalClients },
            salary: { pendingThisMonth: pendingSalaries },
        });
    } catch (err) { next(err); }
};

exports.getAttendanceReport = async (req, res, next) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

        const pipeline = [
            { $match: { date: { $regex: `^${month}` } } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                }
            },
        ];
        const stats = await Attendance.aggregate(pipeline);
        const summary = stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});
        res.json({ month, summary });
    } catch (err) { next(err); }
};

exports.getSalaryReport = async (req, res, next) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

        const salaries = await Salary.find({ month })
            .populate('employeeId', 'name employeeId department')
            .lean();

        const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0);
        const paid = salaries.filter((s) => s.status === 'paid').length;

        res.json({ month, salaries, totalNet, totalCount: salaries.length, paid });
    } catch (err) { next(err); }
};
