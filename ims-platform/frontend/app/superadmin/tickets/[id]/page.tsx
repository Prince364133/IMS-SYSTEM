'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../../lib/superadmin-api';

const STATUS_OPTS = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];

export default function TicketDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [ticket, setTicket] = useState<any>(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const load = async () => {
        const { data } = await saApi.get(`/tickets/${id}`);
        setTicket(data.ticket);
    };
    useEffect(() => { load(); }, [id]);

    const sendReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try { await saApi.post(`/tickets/${id}/reply`, { text: reply }); setReply(''); await load(); }
        catch { toast.error('Failed to send reply'); }
        setSending(false);
    };

    const changeStatus = async (status: string) => {
        setUpdatingStatus(true);
        await saApi.put(`/tickets/${id}/status`, { status });
        await load();
        toast.success(`Status updated to: ${status}`);
        setUpdatingStatus(false);
    };

    if (!ticket) return (
        <div className="max-w-4xl animate-pulse space-y-6">
            <div className="h-12 bg-white rounded-2xl border border-slate-100 shadow-sm" />
            <div className="h-20 bg-white rounded-2xl border border-slate-100 shadow-sm" />
            <div className="h-64 bg-white rounded-2xl border border-slate-100 shadow-sm" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-xl bg-white/80 sticky top-0 z-10">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-slate-50 border border-slate-200 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 rounded-xl flex items-center justify-center transition-all duration-300 text-slate-500 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">{ticket.subject}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            {ticket.companyName}
                        </span>
                        <span className="text-slate-300">·</span>
                        <p className="text-sm text-slate-500 font-medium">
                            {ticket.raisedBy?.name} <span className="text-slate-400 mx-1">·</span>
                            <span className="text-slate-400 font-normal">{new Date(ticket.createdAt).toLocaleString()}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ticket Description</p>
                        </div>
                        <div className="prose prose-slate prose-sm max-w-none">
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                        </div>
                    </div>

                    {/* Message Thread */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[600px]">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">Conversation</p>
                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {ticket.messages?.length || 0}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {ticket.messages?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 transition-all">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Send className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-medium">No messages in this thread yet</p>
                                </div>
                            ) : (
                                ticket.messages?.map((m: any, i: number) => {
                                    const isSuperAdmin = m.senderRole === 'superadmin';
                                    return (
                                        <div key={i} className={`flex gap-4 ${isSuperAdmin ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm transition-transform active:scale-95 ${isSuperAdmin
                                                    ? 'bg-sky-600 text-white shadow-sky-100 ring-4 ring-sky-50'
                                                    : 'bg-white border border-slate-200 text-slate-600 ring-4 ring-slate-50'
                                                }`}>
                                                {m.senderName?.[0]?.toUpperCase()}
                                            </div>
                                            <div className={`flex flex-col max-w-[80%] ${isSuperAdmin ? 'items-end' : ''}`}>
                                                <div className="flex items-center gap-2 mb-1.5 px-1">
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${isSuperAdmin ? 'text-sky-600' : 'text-slate-500'}`}>
                                                        {m.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(m.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className={`px-5 py-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm transition-all hover:shadow-md ${isSuperAdmin
                                                        ? 'bg-sky-600 text-white rounded-tr-none'
                                                        : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-tl-none'
                                                    }`}>
                                                    {m.text}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Reply Box */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50/30 rounded-b-2xl">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 relative group">
                                    <textarea
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        placeholder="Type your response here..."
                                        rows={2}
                                        className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-12 py-4 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all resize-none shadow-sm group-hover:border-slate-300"
                                    />
                                    <div className="absolute top-4 right-5 text-[10px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none group-focus-within:text-sky-400">
                                        Shift+Enter to send
                                    </div>
                                </div>
                                <button
                                    onClick={sendReply}
                                    disabled={sending || !reply.trim()}
                                    className="h-12 w-12 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:shadow-none text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-sky-600/20 active:scale-90 flex-shrink-0"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    {/* Status & Actions */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">Status Control</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2">
                                {STATUS_OPTS.map(s => {
                                    const isActive = ticket.status === s;
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => changeStatus(s)}
                                            disabled={updatingStatus}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 border ${isActive
                                                    ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                                } disabled:opacity-50 group`}
                                        >
                                            <span className="capitalize">{s.replace(/_/g, ' ')}</span>
                                            {isActive && <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-glow shadow-sky-500/50" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Priority</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${ticket.priority === 'high' ? 'bg-red-100 text-red-600' :
                                            ticket.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                                                'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {ticket.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-sky-600 rounded-2xl p-6 shadow-lg shadow-sky-600/20 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Send className="w-20 h-20 -rotate-12" />
                        </div>
                        <h3 className="text-lg font-bold mb-1 relative z-10">Need help?</h3>
                        <p className="text-sky-100 text-xs font-medium relative z-10 mb-4">Internal ticket system for super admin assistance.</p>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 relative z-10 border border-white/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-200 mb-1">Last Update</p>
                            <p className="text-xs font-bold text-white">
                                {new Date(ticket.updatedAt).toLocaleDateString()} at {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

