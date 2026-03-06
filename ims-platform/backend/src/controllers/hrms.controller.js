const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Salary = require('../models/Salary');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Review = require('../models/Review');
const { format, startOfMonth, endOfMonth } = require('../utils/dateHelpers');

exports.getDashboard = async (req, res, next) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Last month date range for project comparison
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        lastMonthStart.setHours(0, 0, 0, 0);
        const lastMonthEnd = new Date(lastMonthStart);
        lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
        lastMonthEnd.setDate(0);
        lastMonthEnd.setHours(23, 59, 59, 999);

        const [
            totalEmployees, activeEmployees,
            totalProjects, activeProjects,
            totalTasks, pendingTasks,
            todayAttendance, totalClients,
            pendingSalaries, prevMonthActive,
        ] = await Promise.all([
            User.countDocuments({ role: 'employee' }),
            User.countDocuments({ role: 'employee', isActive: true }),
            Project.countDocuments({}),
            Project.countDocuments({ status: 'in_progress' }),
            Task.countDocuments({}),
            Task.countDocuments({ status: { $in: ['todo', 'in_progress'] } }),
            Attendance.countDocuments({ date: today, status: 'present' }),
            Client.countDocuments({}),
            Salary.countDocuments({ month: thisMonth, status: 'pending' }),
            Project.countDocuments({ status: 'in_progress', updatedAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }),
        ]);

        // Attendance rate for today
        const attendanceRate = totalEmployees > 0
            ? Math.round((todayAttendance / activeEmployees) * 100)
            : 0;

        res.json({
            employees: { total: totalEmployees, active: activeEmployees },
            projects: { total: totalProjects, active: activeProjects, prevMonthActive },
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

exports.getWeeklyTrends = async (req, res, next) => {
    try {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const [projects, tasks] = await Promise.all([
                Project.countDocuments({ updatedAt: { $gte: date, $lt: nextDate } }),
                Task.countDocuments({ updatedAt: { $gte: date, $lt: nextDate } })
            ]);

            chartData.push({
                name: days[date.getDay()],
                projects,
                tasks
            });
        }

        res.json(chartData);
    } catch (err) { next(err); }
};

exports.getCEOInsights = async (req, res, next) => {
    try {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // 1. Optimized Financial Trajectory (Bulk queries instead of loop)
        const startOfTrajectory = new Date();
        startOfTrajectory.setMonth(startOfTrajectory.getMonth() - 6);
        startOfTrajectory.setDate(1);
        startOfTrajectory.setHours(0, 0, 0, 0);
        const monthStrLimit = startOfTrajectory.toISOString().slice(0, 7);

        const [revenueData, expenseData, salaryData] = await Promise.all([
            Invoice.aggregate([
                { $match: { issueDate: { $gte: startOfTrajectory }, status: 'paid', deletedAt: null } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$issueDate" } },
                        total: { $sum: '$totalAmount' }
                    }
                }
            ]),
            Expense.aggregate([
                { $match: { date: { $gte: startOfTrajectory }, status: 'approved', deletedAt: null } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                        total: { $sum: '$amount' }
                    }
                }
            ]),
            Salary.aggregate([
                { $match: { month: { $gte: monthStrLimit }, status: 'paid', deletedAt: null } },
                {
                    $group: {
                        _id: '$month',
                        total: { $sum: '$netSalary' }
                    }
                }
            ])
        ]);

        const financialData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthLabel = months[date.getMonth()];
            const monthKey = date.toISOString().slice(0, 7);

            const rev = revenueData.find(r => r._id === monthKey)?.total || 0;
            const ex = expenseData.find(e => e._id === monthKey)?.total || 0;
            const sal = salaryData.find(s => s._id === monthKey)?.total || 0;

            financialData.push({
                name: monthLabel,
                rev: rev,
                cost: ex + sal
            });
        }

        // 2. Task Velocity
        const [todo, inProgress, inReview, done] = await Promise.all([
            Task.countDocuments({ status: 'todo' }),
            Task.countDocuments({ status: 'in_progress' }),
            Task.countDocuments({ status: 'in_review' }),
            Task.countDocuments({ status: 'done' })
        ]);

        const taskVelocity = [
            { name: 'To Do', completed: 0, added: todo },
            { name: 'In Progress', completed: 0, added: inProgress },
            { name: 'In Review', completed: 0, added: inReview },
            { name: 'Done', completed: done, added: 0 }
        ];

        // 3. Performance Metrics
        const [totalUser, inactiveUser, reviews] = await Promise.all([
            User.countDocuments({ role: 'employee' }),
            User.countDocuments({ role: 'employee', isActive: false }),
            Review.aggregate([
                { $match: { overallRating: { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$overallRating' } } }
            ])
        ]);

        const retentionRate = totalUser > 0 ? Math.round(((totalUser - inactiveUser) / totalUser) * 100) : 100;
        const satisfactionScore = reviews[0]?.avg ? Math.round((reviews[0].avg / 5) * 100) : 0;

        res.json({
            financialTrajectory: financialData,
            taskVelocity,
            retentionRate,
            satisfactionScore
        });
    } catch (err) { next(err); }
};
