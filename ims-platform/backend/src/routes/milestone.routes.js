const express = require('express');
const router = express.Router();
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Get milestones for a project
router.get('/project/:projectId', protect, async (req, res, next) => {
    try {
        const p = await Project.findById(req.params.projectId);
        if (!p) return res.status(404).json({ error: 'Project not found' });
        if (!['admin', 'manager', 'hr'].includes(req.user.role) && !p.members.some(m => m.user.toString() === req.user._id.toString()) && p.client?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized for this project' });
        }

        const milestones = await Milestone.find({ projectId: req.params.projectId }).sort('order dueDate');
        res.json({ milestones });
    } catch (error) { next(error); }
});

// Create a milestone in a project
router.post('/project/:projectId', protect, async (req, res, next) => {
    try {
        const { title, description, dueDate, order } = req.body;
        const p = await Project.findById(req.params.projectId);
        if (!p) return res.status(404).json({ error: 'Project not found' });

        // Members or admins can add milestones
        if (!['admin', 'manager'].includes(req.user.role) && !p.members.some(m => m.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const milestone = await Milestone.create({
            projectId: p._id,
            title,
            description,
            dueDate,
            order,
            createdBy: req.user._id
        });

        res.status(201).json({ milestone });
    } catch (error) { next(error); }
});

// Toggle complete
router.patch('/:id/toggle', protect, async (req, res, next) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

        // Check project access
        const p = await Project.findById(milestone.projectId);
        if (!['admin', 'manager'].includes(req.user.role) && !p.members.some(m => m.user.toString() === req.user._id.toString())) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        milestone.completed = !milestone.completed;
        milestone.completedAt = milestone.completed ? new Date() : null;
        milestone.completedBy = milestone.completed ? req.user._id : null;
        await milestone.save();

        // Recalculate project progress based on milestones? Optional enhancement.
        // For now just save milestone.

        res.json({ milestone });
    } catch (error) { next(error); }
});

// Delete milestone
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const milestone = await Milestone.findById(req.params.id);
        if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

        const p = await Project.findById(milestone.projectId);
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only project managers or admins can delete milestones' });
        }

        await Milestone.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { next(error); }
});

module.exports = router;
