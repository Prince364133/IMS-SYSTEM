'use client';

import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { toast } from 'react-hot-toast';
import {
    Bell, X, Check, CheckCheck, Loader2, MessageSquare,
    FolderKanban, UserPlus, DollarSign, AlertCircle, Calendar, Mail
} from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    actionUrl?: string;
}

const TYPE_ICONS: Record<string, { icon: any; cls: string }> = {
    task_assigned: { icon: FolderKanban, cls: 'bg-indigo-100 text-indigo-600' },
    project_update: { icon: FolderKanban, cls: 'bg-blue-100 text-blue-600' },
    message: { icon: MessageSquare, cls: 'bg-purple-100 text-purple-600' },
    user_joined: { icon: UserPlus, cls: 'bg-emerald-100 text-emerald-600' },
    salary: { icon: DollarSign, cls: 'bg-amber-100 text-amber-600' },
    attendance: { icon: Calendar, cls: 'bg-cyan-100 text-cyan-600' },
    alert: { icon: AlertCircle, cls: 'bg-red-100 text-red-600' },
    email_pending: { icon: Mail, cls: 'bg-rose-100 text-rose-600' },
};

function getTypeConfig(type: string) {
    return TYPE_ICONS[type] || { icon: Bell, cls: 'bg-gray-100 text-gray-500' };
}

export default function NotificationsPanel() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Fetch count on mount
    useEffect(() => {
        api.get('/api/notifications?limit=5')
            .then(({ data }) => {
                setNotifications(data.notifications);
                setUnread(data.unreadCount);
            })
            .catch(() => { });
    }, []);

    // Listen to real-time notifications
    useEffect(() => {
        const socket = getSocket();

        const handleNewNotification = (notif: Notification) => {
            setNotifications(prev => [notif, ...prev]);
            setUnread(prev => prev + 1);

            // Show toast
            toast.custom((t) => {
                const cfg = getTypeConfig(notif.type);
                const Icon = cfg.icon;
                return (
                    <div className={clsx(
                        'max-w-sm w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5',
                        t.visible ? 'animate-enter' : 'animate-leave'
                    )}>
                        <div className="flex-1 w-0 p-4">
                            <div className="flex items-start">
                                <div className={clsx('flex-shrink-0 pt-0.5 rounded-xl p-2', cfg.cls)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                    <p className="mt-1 text-sm text-gray-500">{notif.message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex border-l border-gray-200">
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                );
            }, { duration: 5000 });
        };

        socket.on('notification:new', handleNewNotification);

        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, []);

    const openPanel = async () => {
        setOpen(true);
        if (loading) return;
        setLoading(true);
        try {
            const { data } = await api.get('/api/notifications?limit=20');
            setNotifications(data.notifications);
            setUnread(data.unreadCount);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        await api.put('/api/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnread(0);
    };

    const markRead = async (id: string) => {
        await api.put(`/api/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
    };

    const deleteNotif = async (id: string) => {
        await api.delete(`/api/notifications/${id}`);
        const n = notifications.find(x => x._id === id);
        setNotifications(prev => prev.filter(x => x._id !== id));
        if (n && !n.isRead) setUnread(prev => Math.max(0, prev - 1));
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={openPanel}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-500" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* Panel */}
            {open && (
                <div className="absolute right-0 top-11 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            {unread > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">{unread}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unread > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ml-1">
                                <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm font-medium">All caught up!</p>
                                <p className="text-gray-300 text-xs mt-0.5">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const cfg = getTypeConfig(n.type);
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={n._id}
                                        className={clsx(
                                            'flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors relative group',
                                            !n.isRead && 'bg-indigo-50/40'
                                        )}
                                    >
                                        {/* Unread dot */}
                                        {!n.isRead && (
                                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        )}

                                        {/* Icon */}
                                        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.cls)}>
                                            <Icon className="w-4 h-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                            {n.actionUrl && n.type === 'email_pending' && (
                                                <div className="mt-2 mb-1">
                                                    <a
                                                        href={n.actionUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => { if (!n.isRead) markRead(n._id); }}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                                                    >
                                                        <Mail className="w-3 h-3" />
                                                        Send Email ↗
                                                    </a>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Actions (hover) */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!n.isRead && (
                                                <button
                                                    onClick={() => markRead(n._id)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-indigo-100 text-indigo-500 transition-colors"
                                                    title="Mark read"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotif(n._id)}
                                                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 text-center">
                            <button className="text-xs text-indigo-600 hover:underline">View all notifications</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
