'use strict';

const mongoose = require('mongoose');

// ── Chat (conversation room) ──────────────────────────────────────────────────
const chatSchema = new mongoose.Schema(
    {
        isGroup: { type: Boolean, default: false },
        name: { type: String, default: '' },
        description: { type: String, default: '' },
        avatar: { type: String, default: '' },         // group emoji / icon
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // group admins
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
        lastActivity: { type: Date, default: Date.now },
        pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
        isMuted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

chatSchema.index({ members: 1 });
chatSchema.index({ lastActivity: -1 });

const Chat = mongoose.model('Chat', chatSchema);

// ── Message ───────────────────────────────────────────────────────────────────
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
        // Reply / thread
        replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
        // @mentions: array of user IDs mentioned in the message
        mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        // Emoji reactions: { emoji: [userId, ...] }
        reactions: { type: mongoose.Schema.Types.Mixed, default: {} },
        // Soft delete
        deletedAt: { type: Date, default: null },
        deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        // System messages (e.g. "Prince added Riya to the group")
        isSystem: { type: Boolean, default: false },
        // Starred
        starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message };
