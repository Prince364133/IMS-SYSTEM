'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const { Job, Application } = require('../models/Job');

// ── Jobs ──────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res, next) => {
    try {
        const jobs = await Job.find({}).populate('postedBy', 'name email').sort({ createdAt: -1 }).lean();
        res.json({ jobs });
    } catch (err) { next(err); }
});

router.post('/', protect, requireHR, async (req, res, next) => {
    try {
        const job = await Job.create({ ...req.body, postedBy: req.user._id });
        res.status(201).json({ job });
    } catch (err) { next(err); }
});

router.put('/:id', protect, requireHR, async (req, res, next) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        res.json({ job });
    } catch (err) { next(err); }
});

router.delete('/:id', protect, requireHR, async (req, res, next) => {
    try {
        await Job.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
        res.json({ message: 'Job deleted' });
    } catch (err) { next(err); }
});

// ── Applications ──────────────────────────────────────────────────────────────
router.get('/:jobId/applications', protect, requireHR, async (req, res, next) => {
    try {
        const applications = await Application.find({ jobId: req.params.jobId })
            .populate('reviewedBy', 'name email').sort({ createdAt: -1 }).lean();
        res.json({ applications });
    } catch (err) { next(err); }
});

router.post('/:jobId/applications', async (req, res, next) => {
    try {
        const app = await Application.create({ ...req.body, jobId: req.params.jobId });
        res.status(201).json({ application: app });
    } catch (err) { next(err); }
});

router.put('/applications/:appId', protect, requireHR, async (req, res, next) => {
    try {
        const app = await Application.findByIdAndUpdate(req.params.appId, req.body, { new: true }).lean();

        // Auto-trigger onboarding if hired
        if (req.body.status === 'hired') {
            const User = require('../models/User');
            const Onboarding = require('../models/Onboarding');

            // Check if user already created for this applicant email
            let user = await User.findOne({ email: app.applicantEmail });
            if (!user) {
                const generatedPassword = app.applicantName.split(' ')[0].toLowerCase() + Math.random().toString(36).slice(-4) + '!';
                user = await User.create({
                    name: app.applicantName,
                    email: app.applicantEmail,
                    password: generatedPassword,
                    role: 'employee',
                    isActive: true,
                });

                // Send Welcome Email with Credentials
                try {
                    const EmailService = require('../services/email.service');
                    await EmailService.sendWelcomeEmail(user, generatedPassword);
                } catch (emailErr) {
                    console.error('Failed to send automated welcome email:', emailErr.message);
                }

                await Onboarding.create({
                    employeeId: user._id,
                    steps: [
                        { name: 'Personal Information', isCompleted: false },
                        { name: 'Document Upload', isCompleted: false },
                        { name: 'Welcome & Policies', isCompleted: false },
                    ],
                    status: 'pending',
                });
            }
        }

        res.json({ application: app });
    } catch (err) { next(err); }
});

module.exports = router;
