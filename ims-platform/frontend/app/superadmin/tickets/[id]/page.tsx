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

    if (!ticket) return <div className="h-96 bg-slate-800 rounded-2xl animate-pulse" />;

    return (
        <div className="space-y-5 max-w-3xl">
            <Toaster position="top-center" />
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors"><ArrowLeft className="w-4 h-4 text-slate-400" /></button>
                <div>
                    <h1 className="text-lg font-bold text-white">{ticket.subject}</h1>
                    <p className="text-xs text-slate-400">{ticket.companyName} · {ticket.raisedBy?.name} · <span className="text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</span></p>
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex gap-2 items-center flex-wrap">
                    {STATUS_OPTS.map(s => (
                        <button key={s} onClick={() => changeStatus(s)} disabled={updatingStatus}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${ticket.status === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                            {s.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-slate-500 capitalize">Priority: <span className="text-white font-semibold">{ticket.priority}</span></span>
            </div>

            {/* Description */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Message Thread */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversation ({ticket.messages?.length || 0})</p>
                {ticket.messages?.length === 0 ? <p className="text-sm text-slate-500 text-center py-6">No messages yet</p> : ticket.messages?.map((m: any, i: number) => (
                    <div key={i} className={`flex gap-3 ${m.senderRole === 'superadmin' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${m.senderRole === 'superadmin' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{m.senderName?.[0]?.toUpperCase()}</div>
                        <div className={`flex-1 max-w-md ${m.senderRole === 'superadmin' ? 'items-end' : ''}`}>
                            <p className={`text-xs text-slate-500 mb-1 ${m.senderRole === 'superadmin' ? 'text-right' : ''}`}>{m.senderName} · {new Date(m.createdAt).toLocaleString()}</p>
                            <div className={`px-4 py-3 rounded-xl text-sm text-slate-200 whitespace-pre-wrap ${m.senderRole === 'superadmin' ? 'bg-violet-600/20 border border-violet-500/20' : 'bg-slate-800'}`}>{m.text}</div>
                        </div>
                    </div>
                ))}

                {/* Reply Box */}
                <div className="flex gap-3 pt-2 border-t border-slate-800">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Write your reply..." rows={3}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                    <button onClick={sendReply} disabled={sending || !reply.trim()}
                        className="w-12 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-colors self-end mb-0.5">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
