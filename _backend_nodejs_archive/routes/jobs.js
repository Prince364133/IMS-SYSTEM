const express = require('express');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
    try {
        const { status, type, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const jobs = await Job.find(filter)
            .populate('postedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ jobs, count: jobs.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', authorize('admin', 'manager'), async (req, res) => {
    try {
        const job = await Job.create({ ...req.body, postedBy: req.user._id });
        res.status(201).json({ job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json({ job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true,
        });
        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json({ job });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
