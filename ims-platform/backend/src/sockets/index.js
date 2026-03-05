'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Message } = require('../models/Chat');

// Map userId → Set of socket IDs
const onlineUsers = new Map();

let ioInstance;

function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            credentials: true,
        },
        pingTimeout: 60000,
    });

    ioInstance = io;

    // ── Auth middleware ──────────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).lean();
            if (!user || !user.isActive) return next(new Error('User not found or inactive'));

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`[Socket] ${socket.user.name} connected (${socket.id})`);

        // Track online users
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);

        // Broadcast online status
        io.emit('user:online', { userId, isOnline: true });

        // ── Join chat room ───────────────────────────────────────────────────────
        socket.on('chat:join', ({ chatId }) => {
            socket.join(`chat:${chatId}`);
        });

        socket.on('chat:leave', ({ chatId }) => {
            socket.leave(`chat:${chatId}`);
        });

        // ── Send message ─────────────────────────────────────────────────────────
        socket.on('chat:message', async (data) => {
            try {
                const { chatId, content, attachmentUrl, attachmentType } = data;
                const msg = await Message.create({
                    chatId,
                    senderId: userId,
                    content,
                    attachmentUrl,
                    attachmentType,
                    readBy: [userId],
                });
                await msg.populate('senderId', 'name email photoUrl');

                // Broadcast to room
                io.to(`chat:${chatId}`).emit('chat:message', msg);

                // Update chat lastActivity
                const { Chat } = require('../models/Chat');
                await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id, lastActivity: new Date() });
            } catch (err) {
                socket.emit('error', { message: err.message });
            }
        });

        // ── Typing indicators ────────────────────────────────────────────────────
        socket.on('chat:typing', ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit('chat:typing', { userId, chatId });
        });

        socket.on('chat:stop_typing', ({ chatId }) => {
            socket.to(`chat:${chatId}`).emit('chat:stop_typing', { userId, chatId });
        });

        // ── Mark messages read ───────────────────────────────────────────────────
        socket.on('chat:read', async ({ chatId }) => {
            try {
                await Message.updateMany(
                    { chatId, readBy: { $ne: userId } },
                    { $addToSet: { readBy: userId } }
                );
                socket.to(`chat:${chatId}`).emit('chat:read', { userId, chatId });
            } catch (err) {
                console.error('[Socket] Mark read error:', err.message);
            }
        });

        // ── Disconnect ───────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user:offline', { userId, isOnline: false });
                }
            }
            console.log(`[Socket] ${socket.user.name} disconnected`);
        });
    });

    return io;
}

/**
 * Get online status for a list of user IDs
 */
function isUserOnline(userId) {
    return onlineUsers.has(userId.toString()) && onlineUsers.get(userId.toString()).size > 0;
}

function getIo() {
    if (!ioInstance) throw new Error('Socket.IO is not initialized');
    return ioInstance;
}

module.exports = { initSocket, isUserOnline, onlineUsers, getIo };
