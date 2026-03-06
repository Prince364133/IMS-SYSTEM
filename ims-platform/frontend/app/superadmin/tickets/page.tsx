'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import saApi from '../../../lib/superadmin-api';

const STATUS_COLORS: Record<string, string> = { open: 'text-amber-400 bg-amber-400/10', in_progress: 'text-blue-400 bg-blue-400/10', waiting_on_customer: 'text-purple-400 bg-purple-400/10', resolved: 'text-emerald-400 bg-emerald-400/10', closed: 'text-slate-400 bg-slate-700' };
const PRIORITY_COLORS: Record<string, string> = { low: 'text-slate-400', medium: 'text-amber-400', high: 'text-orange-400', critical: 'text-red-400' };

export default function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const load = async () => {
        setLoading(true);
        const { data } = await saApi.get('/tickets', { params: { status: filter || undefined, limit: 30 } });
        setTickets(data.tickets); setTotal(data.total);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filter]);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">Support Tickets</h1><p className="text-slate-400 text-sm mt-1">{total} total tickets from all companies</p></div>
                <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">All Status</option>
                    {['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
            </div>

            <div className="space-y-3">
                {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />) : tickets.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">No tickets found</div>
                ) : tickets.map(t => (
                    <Link key={t._id} href={`/superadmin/tickets/${t._id}`} className="block bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <LifeBuoy className="w-4 h-4 text-violet-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-bold text-white">{t.subject}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[t.status] || ''}`}>{t.status.replace('_', ' ')}</span>
                                        <span className={`text-xs font-semibold ${PRIORITY_COLORS[t.priority] || ''}`}>▲ {t.priority}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">{t.companyName || 'Unknown Company'} · {t.raisedBy?.name} · {t.category}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs text-slate-500">
                                <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{t.messages?.length || 0}</div>
                                <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(t.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
