'use strict';

const Goal = require('../models/Goal');

exports.getGoals = async (req, res, next) => {
    try {
        const query = req.user.role === 'employee' ? { $or: [{ ownerId: req.user._id }, { assignedTo: req.user._id }] } : {};
        const goals = await Goal.find(query)
            .populate('ownerId', 'name email photoUrl')
            .populate('assignedTo', 'name email photoUrl')
            .sort({ createdAt: -1 }).lean();
        res.json({ goals });
    } catch (err) { next(err); }
};

exports.createGoal = async (req, res, next) => {
    try {
        const goal = await Goal.create({ ...req.body, ownerId: req.user._id });
        res.status(201).json({ goal });
    } catch (err) { next(err); }
};

exports.getGoalById = async (req, res, next) => {
    try {
        const goal = await Goal.findById(req.params.id)
            .populate('ownerId assignedTo', 'name email photoUrl').lean();
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json({ goal });
    } catch (err) { next(err); }
};

exports.updateGoal = async (req, res, next) => {
    try {
        const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json({ goal });
    } catch (err) { next(err); }
};

exports.deleteGoal = async (req, res, next) => {
    try {
        await Goal.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        res.json({ message: 'Goal deleted' });
    } catch (err) { next(err); }
};
