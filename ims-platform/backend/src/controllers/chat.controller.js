'use strict';

const { Chat, Message } = require('../models/Chat');

exports.getChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({ members: req.user._id })
            .populate('members', 'name email photoUrl role')
            .populate('lastMessage')
            .sort({ lastActivity: -1 })
            .lean();
        res.json({ chats });
    } catch (err) { next(err); }
};

exports.createOrGetChat = async (req, res, next) => {
    try {
        const { memberId, isGroup, name, memberIds } = req.body;

        // 1:1 chat — find or create
        if (!isGroup && memberId) {
            let chat = await Chat.findOne({
                isGroup: false,
                members: { $all: [req.user._id, memberId], $size: 2 },
            }).populate('members', 'name email photoUrl');

            if (!chat) {
                chat = await Chat.create({ isGroup: false, members: [req.user._id, memberId] });
                chat = await chat.populate('members', 'name email photoUrl');
            }
            return res.json({ chat });
        }

        // Group chat
        const members = [req.user._id, ...(memberIds || [])];
        const chat = await Chat.create({ isGroup: true, name, members });
        await chat.populate('members', 'name email photoUrl');
        res.status(201).json({ chat });
    } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const messages = await Message.find({ chatId: req.params.chatId, deletedAt: null })
            .populate('senderId', 'name email photoUrl')
            .sort({ createdAt: -1 })
            .skip(skip).limit(Number(limit))
            .lean();
        res.json({ messages: messages.reverse() });
    } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
    try {
        const { content, attachmentUrl, attachmentType } = req.body;
        const msg = await Message.create({
            chatId: req.params.chatId,
            senderId: req.user._id,
            content,
            attachmentUrl,
            attachmentType,
            readBy: [req.user._id],
        });
        await Chat.findByIdAndUpdate(req.params.chatId, {
            lastMessage: msg._id,
            lastActivity: new Date(),
        });
        await msg.populate('senderId', 'name email photoUrl');
        res.status(201).json({ message: msg });
    } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        await Message.updateMany(
            { chatId: req.params.chatId, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        res.json({ message: 'Marked as read' });
    } catch (err) { next(err); }
};
