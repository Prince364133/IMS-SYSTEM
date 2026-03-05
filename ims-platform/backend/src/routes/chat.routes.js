'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/chat.controller');

router.get('/', protect, ctrl.getChats);
router.post('/', protect, ctrl.createOrGetChat);
router.get('/:chatId/messages', protect, ctrl.getMessages);
router.post('/:chatId/messages', protect, ctrl.sendMessage);
router.put('/:chatId/read', protect, ctrl.markAsRead);

module.exports = router;
