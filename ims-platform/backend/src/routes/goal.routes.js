'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/goal.controller');

router.get('/', protect, ctrl.getGoals);
router.post('/', protect, requireHR, ctrl.createGoal);
router.get('/:id', protect, ctrl.getGoalById);
router.put('/:id', protect, requireHR, ctrl.updateGoal);
router.delete('/:id', protect, requireHR, ctrl.deleteGoal);

module.exports = router;
