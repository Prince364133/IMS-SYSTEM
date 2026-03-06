'use strict';

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/chat.controller');

router.get('/settings', protect, ctrl.getChatSettings);
router.put('/settings', protect, ctrl.updateChatSettings);

router.get('/', protect, ctrl.getChats);
router.post('/', protect, ctrl.createOrGetChat);

router.get('/:chatId/messages', protect, ctrl.getMessages);
router.post('/:chatId/messages', protect, ctrl.sendMessage);
router.put('/:chatId/read', protect, ctrl.markAsRead);
router.post('/:chatId/react', protect, ctrl.reactToMessage);
router.post('/:chatId/pin', protect, ctrl.pinMessage);
router.delete('/:chatId/messages/:msgId', protect, ctrl.deleteMessage);
router.post('/:chatId/members', protect, ctrl.addMembers);
router.delete('/:chatId/members/:memberId', protect, ctrl.removeMember);

module.exports = router;
