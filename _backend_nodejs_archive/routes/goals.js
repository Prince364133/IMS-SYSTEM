const express = require('express');
const Goal = require('../models/Goal');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
    try {
        const { employeeId, status } = req.query;
        const filter = {};
        if (employeeId) filter.employeeId = employeeId;
        if (status) filter.status = status;
        const goals = await Goal.find(filter)
            .populate('employeeId', 'name photoUrl')
            .sort({ deadline: 1 });
        res.json({ goals, count: goals.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const goal = await Goal.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ goal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id).populate('employeeId', 'name photoUrl');
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json({ goal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true,
        });
        if (!goal) return res.status(404).json({ error: 'Goal not found' });
        res.json({ goal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Goal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Goal deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
