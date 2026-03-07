'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { XCircle, RefreshCw, Undo } from 'lucide-react';
import saApi from '../../../lib/superadmin-api';

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    trial: 'text-amber-600 bg-amber-50 border border-amber-100',
    cancelled: 'text-rose-600 bg-rose-50 border border-rose-100',
    past_due: 'text-orange-600 bg-orange-50 border border-orange-100',
    expired: 'text-slate-600 bg-slate-100 border border-slate-200'
};

export default function SubscriptionsPage() {
    const [subs, setSubs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const load = async () => {
        setLoading(true);
        const { data } = await saApi.get('/subscriptions', { params: { status: filter || undefined, limit: 30 } });
        setSubs(data.subscriptions); setTotal(data.total);
        setLoading(false);
    };

    useEffect(() => { load(); }, [filter]);

    const cancel = async (id: string) => { if (!confirm('Cancel this subscription?')) return; await saApi.put(`/subscriptions/${id}/cancel`, { reason: 'Cancelled by super admin' }); toast.success('Cancelled'); load(); };
    const renew = async (id: string) => { await saApi.put(`/subscriptions/${id}/renew`); toast.success('Renewed'); load(); };
    const refund = async (id: string) => { const reason = prompt('Refund reason?'); if (!reason) return; await saApi.post(`/subscriptions/${id}/refund`, { reason }); toast.success('Refunded'); load(); };

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1><p className="text-slate-500 text-sm mt-1">{total} total subscriptions tracked</p></div>
                <div className="flex items-center gap-3">
                    <select value={filter} onChange={e => setFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm min-w-[150px]">
                        <option value="">All Statuses</option>
                        {['active', 'trial', 'cancelled', 'past_due', 'expired'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50/80 border-b border-slate-200">{['Company', 'Plan', 'Status', 'Trial Period', 'Payment', 'Renewal Date', 'Amount', 'Actions'].map(h => <th key={h} className="text-left px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-[0.1em]">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={8}><div className="h-4 bg-slate-100 rounded-full mx-6 my-5 w-3/4" /></td></tr>)
                            : subs.map(s => (
                                <tr key={s._id} className="hover:bg-sky-50/30 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="text-slate-900 font-bold text-sm tracking-tight">{s.companyId?.companyName || 'N/A'}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">ID: {s._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600"><RefreshCw className="w-3.5 h-3.5" /></div>
                                            <span className="text-slate-700 font-bold">{s.planId?.planName || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-500'}`}>{s.status}</span></td>
                                    <td className="px-6 py-5">
                                        {s.trialStartDate ? (
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Starts: {new Date(s.trialStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                                <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tight">Ends: {new Date(s.trialEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                            </div>
                                        ) : <span className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">No Trial</span>}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center w-fit gap-1.5 ${s.paymentStatus === 'paid' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : s.paymentStatus === 'failed' ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-amber-600 bg-amber-50 border border-amber-100'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.paymentStatus === 'paid' ? 'bg-emerald-500' : s.paymentStatus === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                            {s.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-bold text-xs">{s.renewalDate ? new Date(s.renewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td className="px-6 py-5">
                                        <div className="text-slate-900 font-black text-sm tracking-tighter">₹ {(s.amount || 0).toLocaleString('en-IN')}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">One-Time Fee</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => cancel(s._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95" title="Cancel Subscription"><XCircle className="w-4.5 h-4.5" /></button>
                                            <button onClick={() => renew(s._id)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95" title="Force Renewal Cycle"><RefreshCw className="w-4.5 h-4.5" /></button>
                                            <button onClick={() => refund(s._id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95" title="Issue Full Refund"><Undo className="w-4.5 h-4.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
