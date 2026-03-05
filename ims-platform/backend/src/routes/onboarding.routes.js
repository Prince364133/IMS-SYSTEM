const express = require('express');
const router = express.Router();
const Onboarding = require('../models/Onboarding');
const { protect, requireAdminOrHR } = require('../middleware/auth');

// Get onboarding status for a specific user (or all if admin/HR)
router.get('/', protect, async (req, res, next) => {
    try {
        if (req.user.role === 'admin' || req.user.role === 'hr') {
            const list = await Onboarding.find().populate('employeeId', 'name email department role');
            return res.json({ onboardings: list });
        }
        // Employee gets their own
        const ob = await Onboarding.findOne({ employeeId: req.user._id }).populate('employeeId', 'name email department role');
        res.json({ onboarding: ob });
    } catch (error) { next(error); }
});

// Create/initiate onboarding (usually called when candidate becomes employee)
router.post('/', protect, requireAdminOrHR, async (req, res, next) => {
    try {
        const { employeeId, recruitmentId } = req.body;

        let ob = await Onboarding.findOne({ employeeId });
        if (ob) return res.status(400).json({ error: 'Onboarding already exists for this employee' });

        ob = await Onboarding.create({ employeeId, recruitmentId, status: 'pending', step: 1 });
        res.status(201).json({ onboarding: ob });
    } catch (error) { next(error); }
});

// Update personal info (Step 1)
router.put('/:id/personal', protect, async (req, res, next) => {
    try {
        const ob = await Onboarding.findById(req.params.id);
        if (!ob) return res.status(404).json({ error: 'Not found' });
        if (ob.employeeId.toString() !== req.user._id.toString() && !['admin', 'hr'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        ob.personalInfo = { ...ob.personalInfo, ...req.body };
        ob.step = 2; // moving to step 2
        ob.status = 'in_progress';
        await ob.save();
        res.json({ onboarding: ob });
    } catch (error) { next(error); }
});

// Update documents (Step 2)
router.put('/:id/documents', protect, async (req, res, next) => {
    try {
        const ob = await Onboarding.findById(req.params.id);
        if (!ob) return res.status(404).json({ error: 'Not found' });
        if (ob.employeeId.toString() !== req.user._id.toString() && !['admin', 'hr'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        ob.documents = { ...ob.documents, ...req.body };
        ob.step = 3; // moving to step 3
        await ob.save();
        res.json({ onboarding: ob });
    } catch (error) { next(error); }
});

// Complete onboarding (acknowledge welcome, Step 3)
router.put('/:id/complete', protect, async (req, res, next) => {
    try {
        const ob = await Onboarding.findById(req.params.id);
        if (!ob) return res.status(404).json({ error: 'Not found' });
        if (ob.employeeId.toString() !== req.user._id.toString() && !['admin', 'hr'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        ob.welcomeAcknowledgedAt = new Date();
        ob.completedAt = new Date();
        ob.status = 'complete';
        await ob.save();
        res.json({ onboarding: ob });
    } catch (error) { next(error); }
});

// Delete onboarding record
router.delete('/:id', protect, requireAdminOrHR, async (req, res, next) => {
    try {
        await Onboarding.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { next(error); }
});

module.exports = router;
