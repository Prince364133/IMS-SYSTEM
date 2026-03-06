'use strict';

const Salary = require('../models/Salary');
const User = require('../models/User');
const AnalyticsService = require('../services/analytics.service');

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

        // Use Analytics Service (Suggestion 7)
        const netSalary = AnalyticsService.calculateNetSalary(baseSalary, 0, 0, deductions, bonuses);
        const salary = await Salary.findOneAndUpdate(
            { employeeId, month },
            { baseSalary, deductions, bonuses, netSalary, notes, generatedBy: req.user._id, status: 'pending' },
            { upsert: true, new: true, runValidators: true }
        ).lean();

        const AutomationService = require('../services/automation.service');
        await AutomationService.trigger({
            eventType: 'salary_generated',
            triggeredBy: req.user._id,
            targetUser: employeeId,
            relatedItem: { itemId: salary._id, itemModel: 'Salary' },
            description: `Salary for ${month} has been generated.`,
            metadata: { month, netSalary }
        });

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
