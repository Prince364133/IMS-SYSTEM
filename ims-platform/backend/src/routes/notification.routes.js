'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireHR } = require('../middleware/rbac');
const ctrl = require('../controllers/notification.controller');

router.get('/', protect, ctrl.getNotifications);
router.put('/:id/read', protect, ctrl.markRead);
router.put('/read-all', protect, ctrl.markAllRead);
router.delete('/:id', protect, ctrl.deleteNotification);

module.exports = router;
