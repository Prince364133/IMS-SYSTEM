'use strict';
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const TimeLog = require('../models/TimeLog');

// GET /api/timelogs - list timelogs for current user (or all for admin/manager)
router.get('/', protect, async (req, res, next) => {
    try {
        const { userId, projectId, date, week } = req.query;
        const filter = {};
        if (['employee'].includes(req.user.role)) {
            filter.userId = req.user._id;
        } else if (userId) {
            filter.userId = userId;
        }
        if (projectId) filter.projectId = projectId;
        if (date) filter.date = date;
        if (week) {
            // Filter by week: pass startDate as week (YYYY-WW)
            const [y, w] = week.split('-W');
            const startOfWeek = new Date(y, 0, 1 + (w - 1) * 7);
            const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
            filter.startTime = { $gte: startOfWeek, $lte: endOfWeek };
        }
        const logs = await TimeLog.find(filter)
            .populate('userId', 'name email')
            .populate('projectId', 'name')
            .populate('taskId', 'title')
            .sort({ startTime: -1 })
            .lean();
        res.json({ logs });
    } catch (err) { next(err); }
});

// POST /api/timelogs/start - start timer
router.post('/start', protect, async (req, res, next) => {
    try {
        const { projectId, taskId, description } = req.body;
        // Stop any running timer first
        await TimeLog.updateMany({ userId: req.user._id, status: 'running' }, { status: 'stopped', endTime: new Date() });
        const now = new Date();
        const log = await TimeLog.create({
            userId: req.user._id,
            projectId: projectId || undefined,
            taskId: taskId || undefined,
            description,
            startTime: now,
            date: now.toISOString().split('T')[0],
            status: 'running',
        });
        res.status(201).json({ log });
    } catch (err) { next(err); }
});

// POST /api/timelogs/stop - stop running timer
router.post('/stop', protect, async (req, res, next) => {
    try {
        const now = new Date();
        const running = await TimeLog.findOneAndUpdate(
            { userId: req.user._id, status: 'running' },
            {
                status: 'stopped',
                endTime: now,
                $set: { durationMinutes: 0 } // computed below
            },
            { new: true }
        );
        if (running) {
            running.durationMinutes = Math.round((now - running.startTime) / 60000);
            await running.save();
        }
        res.json({ log: running });
    } catch (err) { next(err); }
});

// POST /api/timelogs - manual log entry
router.post('/', protect, async (req, res, next) => {
    try {
        const { projectId, taskId, description, startTime, endTime } = req.body;
        const start = new Date(startTime);
        const end = new Date(endTime || Date.now());
        const durationMinutes = Math.round((end - start) / 60000);
        const log = await TimeLog.create({
            userId: req.user._id,
            projectId: projectId || undefined,
            taskId: taskId || undefined,
            description,
            startTime: start,
            endTime: end,
            durationMinutes,
            date: start.toISOString().split('T')[0],
            status: 'stopped',
        });
        res.status(201).json({ log });
    } catch (err) { next(err); }
});

// DELETE /api/timelogs/:id
router.delete('/:id', protect, async (req, res, next) => {
    try {
        await TimeLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
