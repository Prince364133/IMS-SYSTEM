'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/salary.controller');

router.get('/', protect, requireHR, ctrl.getSalaries);
router.post('/generate', protect, requireHR, ctrl.generateSalary);
router.put('/:id/approve', protect, requireHR, ctrl.approveSalary);
router.put('/:id/hr-approve', protect, requireHR, ctrl.hrApproveSalary);
router.put('/:id/mark-paid', protect, requireHR, ctrl.markPaid);
router.get('/my', protect, ctrl.getMySalaries);

module.exports = router;
