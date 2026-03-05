'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireManager } = require('../middleware/rbac');
const ctrl = require('../controllers/task.controller');

router.get('/', protect, ctrl.getTasks);
router.post('/', protect, requireManager, ctrl.createTask);
router.get('/:id', protect, ctrl.getTaskById);
router.put('/:id', protect, ctrl.updateTask);
router.delete('/:id', protect, requireManager, ctrl.deleteTask);

module.exports = router;
