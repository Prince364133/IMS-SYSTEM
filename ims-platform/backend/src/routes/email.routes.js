'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/email.controller');

// All email management routes are protected for HR/Admin only
router.get('/logs', protect, requireHR, ctrl.getEmailLogs);
router.get('/templates', protect, requireHR, ctrl.getTemplates);
router.get('/stats', protect, requireHR, ctrl.getEmailStats);
router.post('/send', protect, requireHR, ctrl.sendManualEmail);

module.exports = router;
