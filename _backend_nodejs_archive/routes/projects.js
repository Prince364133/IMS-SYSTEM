const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── GET /api/projects ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { status, search, limit = 20, page = 1 } = req.query;
        const filter = {};

        // Non-admin users see only their projects
        if (req.user.role !== 'admin' && req.user.role !== 'manager') {
            filter.$or = [
                { ownerId: req.user._id },
                { memberIds: req.user._id },
            ];
        }

        if (status) filter.status = status;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const skip = (Number(page) - 1) * Number(limit);
        const [projects, total] = await Promise.all([
            Project.find(filter)
                .populate('ownerId', 'name photoUrl')
                .populate('memberIds', 'name photoUrl')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Project.countDocuments(filter),
        ]);

        res.json({ projects, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/projects ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const project = await Project.create({
            ...req.body,
            ownerId: req.user._id,
        });
        const populated = await project.populate([
            { path: 'ownerId', select: 'name photoUrl' },
            { path: 'memberIds', select: 'name photoUrl' },
        ]);
        res.status(201).json({ project: populated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/projects/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'name photoUrl email')
            .populate('memberIds', 'name photoUrl email role');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/projects/:id ───────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('ownerId memberIds', 'name photoUrl');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/projects/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
