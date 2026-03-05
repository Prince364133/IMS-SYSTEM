'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const Leave = require('../models/Leave');
const { createNotification } = require('../utils/notify');
const { getIo } = require('../sockets');

// Employee applies for leave
router.post('/', protect, async (req, res, next) => {
    try {
        const { startDate, endDate, type, reason } = req.body;
        if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end date required' });
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const leave = await Leave.create({
            employeeId: req.user._id,
            type: type || 'casual',
            startDate,
            endDate,
            reason,
            days,
        });
        res.status(201).json({ leave });
    } catch (err) { next(err); }
});

// Get leaves — admin/hr sees all, employee sees own
router.get('/', protect, async (req, res, next) => {
    try {
        const { employeeId, status, month } = req.query;
        const filter = {};
        if (req.user.role === 'employee') {
            filter.employeeId = req.user._id;
        } else if (employeeId) {
            filter.employeeId = employeeId;
        }
        if (status) filter.status = status;
        if (month) {
            filter.startDate = { $regex: `^${month}` };
        }
        const leaves = await Leave.find(filter)
            .populate('employeeId', 'name email department employeeId')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ leaves });
    } catch (err) { next(err); }
});

// Approve / Reject — admin or hr
router.put('/:id/review', protect, requireHR, async (req, res, next) => {
    try {
        const { status, reviewNote } = req.body;
        if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, reviewedBy: req.user._id, reviewedAt: new Date(), reviewNote },
            { new: true }
        ).populate('employeeId', 'name email department').populate('reviewedBy', 'name').lean();
        if (!leave) return res.status(404).json({ error: 'Leave not found' });

        // Notify employee about the decision
        try {
            await createNotification({
                userId: leave.employeeId._id,
                type: 'attendance',
                title: `Leave ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
                message: `Your ${leave.type} leave (${leave.days} day${leave.days > 1 ? 's' : ''}) has been ${status}${reviewNote ? ': ' + reviewNote : ''}.`,
                actionUrl: '/dashboard/attendance',
                io: getIo(),
            });
        } catch (e) { /* swallow */ }

        res.json({ leave });
    } catch (err) { next(err); }
});

// Delete own pending leave request
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: 'Not found' });
        if (leave.status !== 'pending') return res.status(400).json({ error: 'Can only delete pending requests' });
        if (leave.employeeId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await leave.deleteOne();
        res.json({ message: 'Leave request deleted' });
    } catch (err) { next(err); }
});

module.exports = router;
