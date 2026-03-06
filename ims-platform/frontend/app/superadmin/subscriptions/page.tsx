'use client';

import { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { XCircle, RefreshCw, Undo } from 'lucide-react';
import saApi from '../../../lib/superadmin-api';

const STATUS_COLORS: Record<string, string> = { active: 'text-emerald-400 bg-emerald-400/10', trial: 'text-amber-400 bg-amber-400/10', cancelled: 'text-red-400 bg-red-400/10', past_due: 'text-orange-400 bg-orange-400/10', expired: 'text-slate-400 bg-slate-700' };

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
                <div><h1 className="text-2xl font-bold text-white">Subscriptions</h1><p className="text-slate-400 text-sm mt-1">{total} total subscriptions</p></div>
                <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="">All Status</option>
                    {['active', 'trial', 'cancelled', 'past_due', 'expired'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-800">{['Company', 'Plan', 'Status', 'Payment', 'Renewal Date', 'Amount', 'Actions'].map(h => <th key={h} className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-4 bg-slate-800 rounded animate-pulse mx-5 my-4" /></td></tr>)
                            : subs.map(s => (
                                <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-4 text-white font-medium">{s.companyId?.companyName || 'N/A'}</td>
                                    <td className="px-5 py-4 text-slate-300">{s.planId?.planName || 'N/A'}</td>
                                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status] || 'bg-slate-700 text-slate-400'}`}>{s.status}</span></td>
                                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.paymentStatus === 'paid' ? 'text-emerald-400 bg-emerald-400/10' : s.paymentStatus === 'failed' ? 'text-red-400 bg-red-400/10' : 'text-amber-400 bg-amber-400/10'}`}>{s.paymentStatus}</span></td>
                                    <td className="px-5 py-4 text-slate-400 text-xs">{s.renewalDate ? new Date(s.renewalDate).toLocaleDateString() : '—'}</td>
                                    <td className="px-5 py-4 text-white font-mono">₹{(s.amount || 0).toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => cancel(s._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Cancel"><XCircle className="w-4 h-4" /></button>
                                            <button onClick={() => renew(s._id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors" title="Force Renew"><RefreshCw className="w-4 h-4" /></button>
                                            <button onClick={() => refund(s._id)} className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors" title="Refund"><Undo className="w-4 h-4" /></button>
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
