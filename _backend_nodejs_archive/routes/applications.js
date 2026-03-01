const express = require('express');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
    try {
        const { jobId, status } = req.query;
        const filter = {};
        if (jobId) filter.jobId = jobId;
        if (status) filter.status = status;
        const applications = await Application.find(filter)
            .populate('jobId', 'title department')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ applications, count: applications.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public-facing (no auth needed for external applications) — but we still
// accept bearer token if present; remove protect for a fully public endpoint.
router.post('/', async (req, res) => {
    try {
        const application = await Application.create(req.body);
        res.status(201).json({ application });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('jobId', 'title department');
        if (!application) return res.status(404).json({ error: 'Application not found' });
        res.json({ application });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
    try {
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { ...req.body, reviewedBy: req.user._id },
            { new: true, runValidators: true }
        );
        if (!application) return res.status(404).json({ error: 'Application not found' });
        res.json({ application });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        await Application.findByIdAndDelete(req.params.id);
        res.json({ message: 'Application deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
