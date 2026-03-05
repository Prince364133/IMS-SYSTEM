'use strict';

const mongoose = require('mongoose');

// ── Chat (conversation room) ───────────────────────────────────────────────────
const chatSchema = new mongoose.Schema(
    {
        isGroup: { type: Boolean, default: false },
        name: { type: String, default: '' }, // Group chats only
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
        lastActivity: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

chatSchema.index({ members: 1 });
chatSchema.index({ lastActivity: -1 });

const Chat = mongoose.model('Chat', chatSchema);

// ── Message ────────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
    {
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, default: '' },
        attachmentUrl: { type: String, default: '' },
        attachmentType: {
            type: String,
            enum: ['image', 'document', 'video', 'audio', 'none'],
            default: 'none',
        },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message };
