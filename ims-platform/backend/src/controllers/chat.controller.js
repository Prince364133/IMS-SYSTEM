'use strict';

const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');
const CompanyConfig = require('../models/CompanyConfig');

// ── Helper: check client-employee chat permission ─────────────────────────────
async function canChatWith(senderRole, targetRole) {
    if (targetRole === 'client' || senderRole === 'client') {
        const cfg = await CompanyConfig.findOne().lean();
        return cfg?.employeeClientChatAllowed !== false;  // default allow
    }
    return true;
}

// ── GET /api/chat - list all chats for current user ───────────────────────────
exports.getChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({ members: req.user._id })
            .populate('members', 'name email photoUrl role')
            .populate('admins', 'name')
            .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'name' } })
            .sort({ lastActivity: -1 })
            .lean();
        res.json({ chats });
    } catch (err) { next(err); }
};

// ── POST /api/chat - create 1:1 chat or group ─────────────────────────────────
exports.createOrGetChat = async (req, res, next) => {
    try {
        const { memberId, isGroup, name, description, memberIds, avatar } = req.body;

        // 1:1 chat — permission check then find/create
        if (!isGroup && memberId) {
            const targetUser = await User.findById(memberId).lean();
            if (!targetUser) return res.status(404).json({ error: 'User not found' });

            const allowed = await canChatWith(req.user.role, targetUser.role);
            if (!allowed) return res.status(403).json({ error: 'Chat with clients is disabled by admin. Contact your administrator.' });

            let chat = await Chat.findOne({
                isGroup: false,
                members: { $all: [req.user._id, memberId], $size: 2 },
            }).populate('members', 'name email photoUrl role');

            if (!chat) {
                chat = await Chat.create({ isGroup: false, members: [req.user._id, memberId], createdBy: req.user._id });
                chat = await chat.populate('members', 'name email photoUrl role');
            }
            return res.json({ chat });
        }

        // Group chat (admin only creates groups)
        if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Only admins/HR/managers can create group chats' });
        }

        const members = [...new Set([req.user._id.toString(), ...(memberIds || [])])];
        const chat = await Chat.create({
            isGroup: true,
            name: name || 'New Group',
            description: description || '',
            avatar: avatar || '💬',
            members,
            admins: [req.user._id],
            createdBy: req.user._id,
        });

        // System message: group created
        await Message.create({
            chatId: chat._id,
            senderId: req.user._id,
            content: `${req.user.name} created this group`,
            isSystem: true,
            readBy: [req.user._id],
        });

        await chat.populate('members', 'name email photoUrl role');
        res.status(201).json({ chat });
    } catch (err) { next(err); }
};

// ── GET /api/chat/:chatId/messages ────────────────────────────────────────────
exports.getMessages = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const messages = await Message.find({ chatId: req.params.chatId, deletedAt: null })
            .populate('senderId', 'name email photoUrl role')
            .populate({ path: 'replyTo', populate: { path: 'senderId', select: 'name' } })
            .populate('mentions', 'name')
            .sort({ createdAt: -1 })
            .skip(skip).limit(Number(limit))
            .lean();
        res.json({ messages: messages.reverse() });
    } catch (err) { next(err); }
};

// ── POST /api/chat/:chatId/messages (REST fallback) ───────────────────────────
exports.sendMessage = async (req, res, next) => {
    try {
        const { content, attachmentUrl, attachmentType, replyTo, mentions } = req.body;
        const msg = await Message.create({
            chatId: req.params.chatId,
            senderId: req.user._id,
            content,
            attachmentUrl,
            attachmentType,
            replyTo: replyTo || null,
            mentions: mentions || [],
            readBy: [req.user._id],
        });
        await Chat.findByIdAndUpdate(req.params.chatId, {
            lastMessage: msg._id,
            lastActivity: new Date(),
        });
        await msg.populate('senderId', 'name email photoUrl');
        await msg.populate('mentions', 'name');
        res.status(201).json({ message: msg });
    } catch (err) { next(err); }
};

// ── PUT /api/chat/:chatId/read ─────────────────────────────────────────────────
exports.markAsRead = async (req, res, next) => {
    try {
        await Message.updateMany(
            { chatId: req.params.chatId, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        res.json({ message: 'Marked as read' });
    } catch (err) { next(err); }
};

// ── POST /api/chat/:chatId/react ──────────────────────────────────────────────
exports.reactToMessage = async (req, res, next) => {
    try {
        const { messageId, emoji } = req.body;
        const uid = req.user._id.toString();
        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        const reactions = msg.reactions || {};
        if (!reactions[emoji]) reactions[emoji] = [];

        // Toggle
        const idx = reactions[emoji].indexOf(uid);
        if (idx >= 0) {
            reactions[emoji].splice(idx, 1);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji].push(uid);
        }

        msg.reactions = reactions;
        msg.markModified('reactions');
        await msg.save();
        res.json({ reactions: msg.reactions });
    } catch (err) { next(err); }
};

// ── DELETE /api/chat/:chatId/messages/:msgId (soft delete) ───────────────────
exports.deleteMessage = async (req, res, next) => {
    try {
        const msg = await Message.findById(req.params.msgId);
        if (!msg) return res.status(404).json({ error: 'Not found' });
        if (msg.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        msg.deletedAt = new Date();
        msg.deletedBy = req.user._id;
        msg.content = 'This message was deleted';
        await msg.save();
        res.json({ message: 'Deleted' });
    } catch (err) { next(err); }
};

// ── POST /api/chat/:chatId/members (admin: add members to group) ──────────────
exports.addMembers = async (req, res, next) => {
    try {
        const { memberIds } = req.body;
        const chat = await Chat.findById(req.params.chatId);
        if (!chat || !chat.isGroup) return res.status(404).json({ error: 'Group not found' });
        if (!chat.admins.map(String).includes(req.user._id.toString()) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can add members' });
        }
        const existing = chat.members.map(String);
        const toAdd = memberIds.filter((id) => !existing.includes(id));
        chat.members.push(...toAdd);
        await chat.save();

        // System message
        const names = await User.find({ _id: { $in: toAdd } }).select('name').lean();
        await Message.create({
            chatId: chat._id,
            senderId: req.user._id,
            content: `${req.user.name} added ${names.map(n => n.name).join(', ')} to the group`,
            isSystem: true,
            readBy: [req.user._id],
        });

        const updated = await Chat.findById(chat._id).populate('members', 'name email photoUrl role').populate('admins', 'name').lean();
        res.json({ chat: updated });
    } catch (err) { next(err); }
};

// ── DELETE /api/chat/:chatId/members/:memberId (remove from group) ───────────
exports.removeMember = async (req, res, next) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat || !chat.isGroup) return res.status(404).json({ error: 'Group not found' });
        if (!chat.admins.map(String).includes(req.user._id.toString()) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only group admins can remove members' });
        }
        chat.members = chat.members.filter(m => m.toString() !== req.params.memberId);
        await chat.save();

        const removed = await User.findById(req.params.memberId).select('name').lean();
        await Message.create({
            chatId: chat._id,
            senderId: req.user._id,
            content: `${req.user.name} removed ${removed?.name || 'a member'} from the group`,
            isSystem: true,
            readBy: [req.user._id],
        });

        res.json({ message: 'Member removed' });
    } catch (err) { next(err); }
};

// ── GET /api/chat/settings - get client chat toggle ──────────────────────────
exports.getChatSettings = async (req, res, next) => {
    try {
        const cfg = await CompanyConfig.findOne().lean();
        res.json({ employeeClientChatAllowed: cfg?.employeeClientChatAllowed !== false });
    } catch (err) { next(err); }
};

// ── PUT /api/chat/settings - admin toggle client chat ────────────────────────
exports.updateChatSettings = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
        const { employeeClientChatAllowed } = req.body;
        await CompanyConfig.findOneAndUpdate({}, { employeeClientChatAllowed }, { upsert: true });
        res.json({ message: 'Settings updated', employeeClientChatAllowed });
    } catch (err) { next(err); }
};

// ── POST /api/chat/:chatId/pin ─────────────────────────────────────────────────
exports.pinMessage = async (req, res, next) => {
    try {
        const { messageId } = req.body;
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        const idx = chat.pinnedMessages.map(String).indexOf(messageId);
        if (idx >= 0) chat.pinnedMessages.splice(idx, 1); // unpin
        else chat.pinnedMessages.push(messageId);         // pin
        await chat.save();
        res.json({ pinnedMessages: chat.pinnedMessages });
    } catch (err) { next(err); }
};
