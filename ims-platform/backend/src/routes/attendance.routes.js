'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/attendance.controller');

router.get('/', protect, requireHR, ctrl.getAttendance);
router.get('/my', protect, ctrl.getMyAttendance);
// Both route names for compatibility — frontend calls monthly-report
router.get('/report', protect, requireHR, ctrl.getMonthlyReport);
router.get('/monthly-report', protect, requireHR, ctrl.getMonthlyReport);
router.post('/mark', protect, requireHR, ctrl.markAttendance);
router.put('/:id', protect, requireHR, ctrl.updateAttendance);

module.exports = router;
