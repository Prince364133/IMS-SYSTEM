'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const Settings = require('../models/Settings');
const { authenticate, authorize } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// ── API Key Middleware ──────────────────────────────────────────────────────────
const checkRecruitmentApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ error: 'X-API-KEY header is required' });
        }

        const settings = await Settings.findOne();
        if (!settings || settings.recruitmentApiKey !== apiKey) {
            return res.status(401).json({ error: 'Invalid or missing API key' });
        }
        next();
    } catch (err) {
        next(err);
    }
};

// ── Public Endpoints ──────────────────────────────────────────────────────────

/**
 * @route   GET /api/public/jobs
 * @desc    Fetch all open jobs for external listing
 * @access  Public (API Key Required)
 */
router.get('/jobs', checkRecruitmentApiKey, publicController.getPublicJobs);

/**
 * @route   GET /api/public/jobs/:id
 * @desc    Get job details for application form rendering
 * @access  Public (No API Key required, but ID needed)
 */
router.get('/jobs/:id', publicController.getPublicJobDetails);

/**
 * @route   POST /api/public/apply
 * @desc    Submit a job application
 * @access  Public
 */
router.post('/apply', publicController.submitApplication);

// ── IMS Internal Endpoints ────────────────────────────────────────────────────────

/**
 * @route   GET /api/public/api-key
 * @desc    Get the current API key (Admin/HR only)
 */
router.get('/api-key', authenticate, requireRole(['admin', 'hr']), publicController.getApiKey);

/**
 * @route   POST /api/public/api-key/generate
 * @desc    Generate a new API key (Admin/HR only)
 */
router.post('/api-key/generate', authenticate, requireRole(['admin', 'hr']), publicController.generateApiKey);

module.exports = router;
