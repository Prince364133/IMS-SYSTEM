'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import saApi from '../../../lib/superadmin-api';

const STATUS_COLORS: Record<string, string> = {
    open: 'text-amber-600 bg-amber-50 border border-amber-100',
    in_progress: 'text-sky-600 bg-sky-50 border border-sky-100',
    waiting_on_customer: 'text-indigo-600 bg-indigo-50 border border-indigo-100',
    resolved: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    closed: 'text-slate-500 bg-slate-100 border border-slate-200'
};
const PRIORITY_COLORS: Record<string, string> = {
    low: 'text-slate-500',
    medium: 'text-amber-600',
    high: 'text-orange-600',
    critical: 'text-rose-600 font-bold'
};

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
            <div className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Support Tickets</h1><p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">{total} active support threads identified</p></div>
                <select value={filter} onChange={e => setFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all shadow-sm min-w-[180px] appearance-none cursor-pointer">
                    <option value="">Status Filter: All</option>
                    {['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'].map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                </select>
            </div>

            <div className="grid gap-4">
                {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-50 border border-slate-200 rounded-3xl animate-pulse" />) : tickets.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active tickets found</p>
                    </div>
                ) : tickets.map(t => (
                    <Link key={t._id} href={`/superadmin/tickets/${t._id}`} className="block bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-50/50 transition-all group relative overflow-hidden active:scale-[0.99]">
                        <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-5 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition-colors">
                                    <MessageSquare className="w-6 h-6 text-sky-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5 overflow-hidden">
                                        <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-sky-600 transition-colors">{t.subject}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0 ${STATUS_COLORS[t.status] || ''}`}>{t.status.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        <span className="text-slate-600">{t.companyName || 'Corporate Client'}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span>{t.raisedBy?.name}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className={PRIORITY_COLORS[t.priority] || ''}>Priority: {t.priority}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8 pl-6 border-l border-slate-100">
                                <div className="text-center">
                                    <div className="text-lg font-black text-slate-900 tracking-tight">{t.messages?.length || 0}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Replies</div>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <div className="text-sm font-black text-slate-900">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Raised</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
