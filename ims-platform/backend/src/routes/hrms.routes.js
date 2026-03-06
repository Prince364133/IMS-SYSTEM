'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/hrms.controller');

router.get('/dashboard', protect, requireHR, ctrl.getDashboard);
router.get('/ceo-insights', protect, requireHR, ctrl.getCEOInsights);
router.get('/weekly-trends', protect, ctrl.getWeeklyTrends);
router.get('/attendance-report', protect, requireHR, ctrl.getAttendanceReport);
router.get('/salary-report', protect, requireHR, ctrl.getSalaryReport);

module.exports = router;
