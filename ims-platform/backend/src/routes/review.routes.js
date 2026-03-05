const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { protect, requireAdminOrHR } = require('../middleware/auth');

// Get all reviews (HR/Admin) or reviews for authenticated user (Employee) or reviews managed by user (Manager)
router.get('/', protect, async (req, res, next) => {
    try {
        const { employeeId, managerId, status } = req.query;
        let query = {};

        if (req.user.role === 'employee') {
            query.employeeId = req.user._id;
        } else if (req.user.role === 'manager') {
            // Manager can see reviews where they are the manager, or their own reviews
            query.$or = [{ managerId: req.user._id }, { employeeId: req.user._id }];
        } else {
            // Admin/HR can filter
            if (employeeId) query.employeeId = employeeId;
            if (managerId) query.managerId = managerId;
        }

        if (status) query.status = status;

        const reviews = await Review.find(query)
            .populate('employeeId', 'name email department role')
            .populate('managerId', 'name email')
            .sort('-createdAt');

        res.json({ reviews });
    } catch (error) { next(error); }
});

// Get single review
router.get('/:id', protect, async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('employeeId', 'name department')
            .populate('managerId', 'name');

        if (!review) return res.status(404).json({ error: 'Review not found' });

        // Access check
        if (req.user.role === 'employee' && review.employeeId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to view this review' });
        }
        res.json({ review });
    } catch (error) { next(error); }
});

// Create review cycle (Admin/HR/Manager)
router.post('/', protect, async (req, res, next) => {
    try {
        if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { employeeId, period, dueDate, managerId } = req.body;

        // Prevent duplicate for same period
        const exists = await Review.findOne({ employeeId, period });
        if (exists) return res.status(400).json({ error: `Review for period ${period} already exists for this employee` });

        const review = await Review.create({
            employeeId,
            period,
            dueDate,
            managerId: managerId || req.user._id
        });

        res.status(201).json({ review });
    } catch (error) { next(error); }
});

// Employee submits self evaluation
router.put('/:id/self', protect, async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (review.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { selfRatings, selfSummary } = req.body;

        review.selfRatings = selfRatings || review.selfRatings;
        review.selfSummary = selfSummary || review.selfSummary;
        review.status = 'manager_eval_pending';
        review.selfSubmittedAt = new Date();

        await review.save();
        res.json({ review });
    } catch (error) { next(error); }
});

// Manager submits their evaluation
router.put('/:id/manager', protect, async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        if (review.managerId.toString() !== req.user._id.toString() && !['admin', 'hr'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { managerRatings, managerSummary, overallRating, nextPeriodGoals } = req.body;

        review.managerRatings = managerRatings || review.managerRatings;
        review.managerSummary = managerSummary || review.managerSummary;
        review.overallRating = overallRating || review.overallRating;
        review.nextPeriodGoals = nextPeriodGoals || review.nextPeriodGoals;
        review.status = 'complete';
        review.managerSubmittedAt = new Date();

        await review.save();
        res.json({ review });
    } catch (error) { next(error); }
});

// Delete review (Admin/HR)
router.delete('/:id', protect, requireAdminOrHR, async (req, res, next) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { next(error); }
});

module.exports = router;
