'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/attendance.controller');

router.get('/', protect, requireHR, ctrl.getAttendance);
router.get('/my', protect, ctrl.getMyAttendance);
router.get('/report', protect, requireHR, ctrl.getMonthlyReport);
router.post('/mark', protect, requireHR, ctrl.markAttendance);
router.put('/:id', protect, requireHR, ctrl.updateAttendance);

module.exports = router;
