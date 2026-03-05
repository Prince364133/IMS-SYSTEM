'use strict';
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const CalendarEvent = require('../models/CalendarEvent');

// GET /api/calendar - list all events (with optional month/year filter)
router.get('/', protect, async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const filter = {};
        if (year && month) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            filter.startDate = { $gte: start, $lte: end };
        }
        const events = await CalendarEvent.find(filter)
            .populate('createdBy', 'name')
            .sort({ startDate: 1 }).lean();
        res.json({ events });
    } catch (err) { next(err); }
});

// POST /api/calendar - create event (admin only)
router.post('/', protect, requireAdmin, async (req, res, next) => {
    try {
        const event = await CalendarEvent.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ event });
    } catch (err) { next(err); }
});

// PUT /api/calendar/:id - update event (admin only)
router.put('/:id', protect, requireAdmin, async (req, res, next) => {
    try {
        const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!event) return res.status(404).json({ error: 'Not found' });
        res.json({ event });
    } catch (err) { next(err); }
});

// DELETE /api/calendar/:id - delete event (admin only)
router.delete('/:id', protect, requireAdmin, async (req, res, next) => {
    try {
        await CalendarEvent.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
