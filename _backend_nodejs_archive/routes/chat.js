const express = require('express');
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ─── GET /api/chat — all conversations for current user ───────────────────────
router.get('/', async (req, res) => {
    try {
        const chats = await Chat.find({ memberIds: req.user._id })
            .populate('memberIds', 'name photoUrl')
            .populate('lastMessage.senderId', 'name')
            .sort({ 'lastMessage.timestamp': -1 });
        res.json({ chats, count: chats.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/chat — create DM or group ─────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { type, memberIds, groupName, groupPhoto } = req.body;

        // For DM: check if chat already exists
        if (type === 'dm' && memberIds.length === 1) {
            const existing = await Chat.findOne({
                type: 'dm',
                memberIds: { $all: [req.user._id, memberIds[0]], $size: 2 },
            });
            if (existing) return res.json({ chat: existing });
        }

        const chat = await Chat.create({
            type,
            memberIds: [...new Set([req.user._id.toString(), ...memberIds])],
            groupName: groupName || '',
            groupPhoto: groupPhoto || '',
            createdBy: req.user._id,
        });

        const populated = await chat.populate('memberIds', 'name photoUrl');
        res.status(201).json({ chat: populated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/chat/:chatId/messages ──────────────────────────────────────────
router.get('/:chatId/messages', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('messages.senderId', 'name photoUrl');
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        if (!chat.memberIds.map(String).includes(req.user._id.toString())) {
            return res.status(403).json({ error: 'Not a member of this chat' });
        }
        res.json({ messages: chat.messages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/chat/:chatId/messages — send message ──────────────────────────
router.post('/:chatId/messages', async (req, res) => {
    try {
        const { text, mediaUrl } = req.body;
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });

        const message = { senderId: req.user._id, text: text || '', mediaUrl: mediaUrl || '' };
        chat.messages.push(message);
        chat.lastMessage = { text: text || '📎 Media', senderId: req.user._id, timestamp: new Date() };
        await chat.save();

        const newMsg = chat.messages[chat.messages.length - 1];
        res.status(201).json({ message: newMsg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /api/chat/group/:chatId/members — add/remove members ────────────────
router.put('/group/:chatId/members', async (req, res) => {
    try {
        const { addMembers, removeMembers } = req.body;
        const chat = await Chat.findById(req.params.chatId);
        if (!chat || chat.type !== 'group') {
            return res.status(404).json({ error: 'Group chat not found' });
        }

        let ids = chat.memberIds.map(String);
        if (addMembers) ids = [...new Set([...ids, ...addMembers])];
        if (removeMembers) ids = ids.filter((id) => !removeMembers.includes(id));
        chat.memberIds = ids;
        await chat.save();

        const updated = await chat.populate('memberIds', 'name photoUrl');
        res.json({ chat: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/chat/:chatId — single chat detail ───────────────────────────────
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('memberIds', 'name photoUrl email')
            .populate('createdBy', 'name');
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        res.json({ chat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
