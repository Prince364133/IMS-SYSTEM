const mongoose = require('mongoose');

// ─── Message Sub-Document ─────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: { type: String, default: '' },
        mediaUrl: { type: String, default: '' },
        isRead: { type: Boolean, default: false },
        readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

// ─── Chat / Conversation ─────────────────────────────────────────────────────
const chatSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['dm', 'group'],
            default: 'dm',
        },
        memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        groupName: { type: String, default: '' },
        groupPhoto: { type: String, default: '' },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lastMessage: {
            text: { type: String, default: '' },
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            timestamp: { type: Date },
        },
        messages: [messageSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
