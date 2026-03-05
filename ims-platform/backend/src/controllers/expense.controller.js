'use strict';

const Expense = require('../models/Expense');
const { createNotification } = require('../utils/notify');
const { getIo } = require('../sockets');

exports.getExpenses = async (req, res, next) => {
    try {
        const { status, employeeId } = req.query;
        const filter = {};
        if (req.user.role === 'employee') filter.employeeId = req.user._id;
        else if (employeeId) filter.employeeId = employeeId;
        if (status) filter.status = status;

        const expenses = await Expense.find(filter)
            .populate('employeeId', 'name email department')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 }).lean();

        const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        res.json({ expenses, totalAmount });
    } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
    try {
        const expense = await Expense.create({ ...req.body, employeeId: req.user._id });
        res.status(201).json({ expense });
    } catch (err) { next(err); }
};

exports.reviewExpense = async (req, res, next) => {
    try {
        const { status, reviewNote } = req.body;
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { status, reviewedBy: req.user._id, reviewedAt: new Date(), reviewNote },
            { new: true }
        ).populate('employeeId', 'name email').lean();

        if (!expense) return res.status(404).json({ error: 'Not found' });

        // Notify employee
        try {
            await createNotification({
                userId: expense.employeeId._id,
                type: 'alert',
                title: `Expense ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
                message: `Your expense claim "${expense.title}" (₹${expense.amount}) was ${status}.`,
                actionUrl: '/dashboard/expenses',
                io: getIo(),
            });
        } catch (e) { /* swallow */ }

        res.json({ expense });
    } catch (err) { next(err); }
};

exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ error: 'Not found' });
        if (expense.employeeId.toString() !== req.user._id.toString() && !['admin', 'hr'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await expense.deleteOne();
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
};
