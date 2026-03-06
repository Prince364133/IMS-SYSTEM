'use strict';
const Plan = require('../../models/superadmin/Plan');

exports.list = async (req, res) => {
    try {
        const plans = await Plan.find().sort({ price: 1 });
        res.json({ plans });
    } catch { res.status(500).json({ error: 'Failed to fetch plans' }); }
};

exports.create = async (req, res) => {
    try {
        const plan = await Plan.create(req.body);
        res.status(201).json({ plan });
    } catch (err) { res.status(500).json({ error: err.message || 'Failed to create plan' }); }
};

exports.update = async (req, res) => {
    try {
        const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json({ plan });
    } catch (err) { res.status(500).json({ error: 'Failed to update plan' }); }
};

exports.remove = async (req, res) => {
    try {
        await Plan.findByIdAndDelete(req.params.id);
        res.json({ message: 'Plan deleted' });
    } catch { res.status(500).json({ error: 'Failed to delete plan' }); }
};

exports.toggleActive = async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        plan.isActive = !plan.isActive;
        await plan.save();
        res.json({ plan });
    } catch { res.status(500).json({ error: 'Failed to toggle plan' }); }
};
