const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── GET /api/tasks ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { projectId, assigneeId, status, priority } = req.query;
        const filter = {};
        if (projectId) filter.projectId = projectId;
        if (assigneeId) filter.assigneeId = assigneeId;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter)
            .populate('assigneeId', 'name photoUrl')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ tasks, count: tasks.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const task = await Task.create({ ...req.body, createdBy: req.user._id });
        const populated = await task.populate('assigneeId createdBy', 'name photoUrl');
        res.status(201).json({ task: populated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/tasks/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assigneeId', 'name photoUrl email')
            .populate('projectId', 'name status')
            .populate('createdBy', 'name');
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/tasks/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('assigneeId', 'name photoUrl');
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
