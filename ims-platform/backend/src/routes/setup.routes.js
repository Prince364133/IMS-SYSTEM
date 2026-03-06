'use strict';

const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setup.controller');

// @route   GET /api/setup/status
// @desc    Check if database is configured
// @access  Public
router.get('/status', setupController.getSetupStatus);

// @route   POST /api/setup/database
// @desc    Configure database credentials
// @access  Public
router.post('/database', setupController.configureDatabase);

module.exports = router;
