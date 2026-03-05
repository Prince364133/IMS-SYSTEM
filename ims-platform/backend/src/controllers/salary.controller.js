'use strict';

const Salary = require('../models/Salary');
const User = require('../models/User');

exports.getSalaries = async (req, res, next) => {
    try {
        const { month, status, employeeId } = req.query;
        const query = {};
        if (month) query.month = month;
        if (status) query.status = status;
        if (employeeId) query.employeeId = employeeId;

        const salaries = await Salary.find(query)
            .populate('employeeId', 'name email employeeId department position')
            .populate('generatedBy', 'name email')
            .sort({ createdAt: -1 }).lean();
        res.json({ salaries });
    } catch (err) { next(err); }
};

exports.getMySalaries = async (req, res, next) => {
    try {
        const salaries = await Salary.find({ employeeId: req.user._id })
            .sort({ month: -1 }).lean();
        res.json({ salaries });
    } catch (err) { next(err); }
};

exports.generateSalary = async (req, res, next) => {
    try {
        const { employeeId, month, baseSalary, deductions = 0, bonuses = 0, notes } = req.body;
        if (!employeeId || !month || !baseSalary) {
            return res.status(400).json({ error: 'employeeId, month, and baseSalary are required' });
        }
        const netSalary = baseSalary - deductions + bonuses;
        const salary = await Salary.findOneAndUpdate(
            { employeeId, month },
            { baseSalary, deductions, bonuses, netSalary, notes, generatedBy: req.user._id, status: 'pending' },
            { upsert: true, new: true, runValidators: true }
        ).lean();

        const Notification = require('../models/Notification');
        const { getIo } = require('../sockets');
        const employee = await User.findById(employeeId);

        if (employee && employee.email) {
            const subject = encodeURIComponent(`Your Salary for ${month} is Ready`);
            const body = encodeURIComponent(`Hi ${employee.name},\n\nYour salary for ${month} has been processed.\nNet Salary: Rs. ${netSalary.toLocaleString()}\n\nYou can view the details in your HRMS dashboard.\n\nBest regards,\nHR Team`);
            const actionUrl = `mailto:${employee.email}?subject=${subject}&body=${body}`;

            const notification = await Notification.create({
                userId: req.user._id,
                type: 'email_pending',
                title: 'Send Salary Email',
                message: `Click to email ${employee.name} about their ${month} salary.`,
                actionUrl,
            });

            const io = getIo();
            if (io) {
                io.to(req.user._id.toString()).emit('notification:new', {
                    _id: notification._id.toString(),
                    type: 'email_pending',
                    title: 'Send Salary Email',
                    message: `Click to email ${employee.name} about their ${month} salary.`,
                    actionUrl,
                    isRead: false,
                    createdAt: notification.createdAt
                });
            }
        }

        res.status(201).json({ salary });
    } catch (err) { next(err); }
};

exports.approveSalary = async (req, res, next) => {
    try {
        const salary = await Salary.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }).lean();
        if (!salary) return res.status(404).json({ error: 'Salary record not found' });
        res.json({ salary });
    } catch (err) { next(err); }
};

exports.markPaid = async (req, res, next) => {
    try {
        const salary = await Salary.findByIdAndUpdate(
            req.params.id,
            { status: 'paid', paidAt: new Date() },
            { new: true }
        ).lean();
        if (!salary) return res.status(404).json({ error: 'Salary record not found' });
        res.json({ salary });
    } catch (err) { next(err); }
};
