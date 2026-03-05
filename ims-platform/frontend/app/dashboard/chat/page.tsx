'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useAuth } from '../../../lib/auth-context';
import api from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import {
    MessageSquare, Send, Search, Users, Plus, Loader2,
    CheckCheck, Circle, ImageIcon, PaperclipIcon
} from 'lucide-react';
import clsx from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
    _id: string;
    chatId: string;
    senderId: { _id: string; name: string; email: string; photoUrl?: string };
    content: string;
    attachmentUrl?: string;
    readBy: string[];
    createdAt: string;
}

interface Chat {
    _id: string;
    name?: string;
    isGroup: boolean;
    members: { _id: string; name: string; email: string; photoUrl?: string }[];
    lastMessage?: Message;
    lastActivity?: string;
}

function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
}

function Avatar({ user, size = 'md' }: { user: any; size?: 'sm' | 'md' | 'lg' }) {
    const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
    return (
        <div className={clsx('rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-white', sz)}>
            {user?.photoUrl
                ? <img src={user.photoUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                : user?.name?.[0]?.toUpperCase()}
        </div>
    );
}

export default function ChatPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);
    const socket = getSocket();

    // ── Load chats ─────────────────────────────────────────────────────────────
    useEffect(() => {
        api.get('/api/chat')
            .then(({ data }) => setChats(data.chats))
            .finally(() => setLoadingChats(false));
    }, []);

    // ── Socket events ───────────────────────────────────────────────────────────
    useEffect(() => {
        socket.on('chat:message', (msg: Message) => {
            setMessages((prev) => {
                if (prev.find(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
            setChats((prev) => prev.map(c =>
                c._id === msg.chatId ? { ...c, lastMessage: msg, lastActivity: msg.createdAt } : c
            ));
            scrollToBottom();
        });

        socket.on('chat:typing', ({ userId }: { userId: string; chatId: string }) => {
            setTypingUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
        });

        socket.on('chat:stop_typing', ({ userId }: { userId: string }) => {
            setTypingUsers((prev) => prev.filter(id => id !== userId));
        });

        socket.on('user:online', ({ userId }: { userId: string }) => {
            setOnlineUsers((prev) => new Set([...prev, userId]));
        });

        socket.on('user:offline', ({ userId }: { userId: string }) => {
            setOnlineUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; });
        });

        return () => {
            socket.off('chat:message');
            socket.off('chat:typing');
            socket.off('chat:stop_typing');
            socket.off('user:online');
            socket.off('user:offline');
        };
    }, []);

    // ── Select chat ──────────────────────────────────────────────────────────────
    const selectChat = async (chat: Chat) => {
        if (activeChat) socket.emit('chat:leave', { chatId: activeChat._id });
        setActiveChat(chat);
        setMessages([]);
        setLoadingMessages(true);
        socket.emit('chat:join', { chatId: chat._id });
        socket.emit('chat:read', { chatId: chat._id });
        try {
            const { data } = await api.get(`/api/chat/${chat._id}/messages`);
            setMessages(data.messages);
        } finally {
            setLoadingMessages(false);
            scrollToBottom();
        }
    };

    // ── Send message ─────────────────────────────────────────────────────────────
    const sendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !activeChat) return;
        socket.emit('chat:message', { chatId: activeChat._id, content: text.trim() });
        setText('');
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        socket.emit('chat:stop_typing', { chatId: activeChat._id });
    };

    // ── Typing indicator ──────────────────────────────────────────────────────────
    const handleTyping = (val: string) => {
        setText(val);
        if (!activeChat) return;
        socket.emit('chat:typing', { chatId: activeChat._id });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('chat:stop_typing', { chatId: activeChat._id });
        }, 2000);
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    // ── Chat display name ─────────────────────────────────────────────────────────
    const getChatName = (chat: Chat) => {
        if (chat.isGroup) return chat.name || 'Group Chat';
        const other = chat.members.find(m => m._id !== user?._id);
        return other?.name || 'Chat';
    };

    const getChatOther = (chat: Chat) => chat.members.find(m => m._id !== user?._id);

    const isOtherOnline = (chat: Chat) => {
        const other = getChatOther(chat);
        return other ? onlineUsers.has(other._id) : false;
    };

    return (
        <div className="flex h-[calc(100vh-7rem)] card overflow-hidden">
            {/* ── Sidebar ──────────────────────────────────────────────────────── */}
            <div className="w-[300px] border-r border-gray-100 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-900">Messages</h2>
                        <button className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input placeholder="Search chats..." className="input pl-8 text-xs py-1.5" />
                    </div>
                </div>

                {/* Chat list */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {loadingChats ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="text-center py-10">
                            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-xs text-gray-400">No conversations yet</p>
                        </div>
                    ) : (
                        chats.map((chat) => {
                            const other = getChatOther(chat);
                            const online = isOtherOnline(chat);
                            const isActive = activeChat?._id === chat._id;
                            return (
                                <button
                                    key={chat._id}
                                    onClick={() => selectChat(chat)}
                                    className={clsx(
                                        'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left',
                                        isActive && 'bg-indigo-50/70 border-l-2 border-indigo-500'
                                    )}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Avatar user={chat.isGroup ? null : other} />
                                        {!chat.isGroup && (
                                            <span className={clsx(
                                                'absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white',
                                                online ? 'bg-emerald-400' : 'bg-gray-300'
                                            )} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{getChatName(chat)}</p>
                                            {chat.lastActivity && (
                                                <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(chat.lastActivity)}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                            {chat.lastMessage?.content || 'No messages yet'}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Main chat area ───────────────────────────────────────────────── */}
            {activeChat ? (
                <div className="flex-1 flex flex-col">
                    {/* Chat header */}
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                        <div className="relative">
                            <Avatar user={activeChat.isGroup ? null : getChatOther(activeChat)} />
                            {!activeChat.isGroup && (
                                <span className={clsx(
                                    'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white',
                                    isOtherOnline(activeChat) ? 'bg-emerald-400' : 'bg-gray-300'
                                )} />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{getChatName(activeChat)}</p>
                            <p className="text-xs text-gray-400">
                                {!activeChat.isGroup && (isOtherOnline(activeChat) ? '🟢 Online' : 'Offline')}
                                {activeChat.isGroup && `${activeChat.members.length} members`}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin bg-gray-50/40">
                        {loadingMessages ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        ) : messages.map((msg) => {
                            const isMine = msg.senderId._id === user?._id;
                            return (
                                <div key={msg._id} className={clsx('flex gap-2', isMine && 'flex-row-reverse')}>
                                    {!isMine && <Avatar user={msg.senderId} size="sm" />}
                                    <div className={clsx(
                                        'max-w-[65%] flex flex-col gap-0.5',
                                        isMine && 'items-end'
                                    )}>
                                        {!isMine && (
                                            <p className="text-xs text-gray-400 font-medium px-1">{msg.senderId.name}</p>
                                        )}
                                        <div className={clsx(
                                            'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                                            isMine
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-sm'
                                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-sm'
                                        )}>
                                            {msg.content}
                                        </div>
                                        <div className={clsx('flex items-center gap-1 px-1', isMine && 'flex-row-reverse')}>
                                            <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                                            {isMine && (
                                                <CheckCheck className={clsx(
                                                    'w-3 h-3',
                                                    msg.readBy.length > 1 ? 'text-indigo-500' : 'text-gray-300'
                                                )} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex gap-2 items-center">
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5">
                                    <div className="flex gap-1 items-center">
                                        {[0, 1, 2].map(i => (
                                            <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-2">
                            <button type="button" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <PaperclipIcon className="w-4 h-4" />
                            </button>
                            <input
                                value={text}
                                onChange={(e) => handleTyping(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 input py-2.5 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(e as any)}
                            />
                            <button
                                type="submit"
                                disabled={!text.trim()}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white disabled:opacity-40 hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">Select a conversation</h3>
                    <p className="text-sm text-gray-400 max-w-xs">
                        Choose a chat from the list or start a new conversation with a team member.
                    </p>
                </div>
            )}
        </div>
    );
}
