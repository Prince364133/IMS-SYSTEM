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
router.post('/preview', protect, requireHR, ctrl.previewTemplate);
router.post('/send-custom', protect, requireHR, ctrl.sendCustomEmail);
router.post('/send-bulk', protect, requireHR, ctrl.sendBulkEmail);
router.post('/send-document', protect, requireHR, ctrl.sendDocumentEmail);
router.post('/retry/:id', protect, requireHR, ctrl.retryEmail);

module.exports = router;
