'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import saApi from '../../../lib/superadmin-api';

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'activity' | 'errors'>('activity');

    const load = async () => {
        setLoading(true);
        const endpoint = tab === 'activity' ? '/logs/activity' : '/logs/errors';
        const { data } = await saApi.get(endpoint, { params: { limit: 50 } });
        setLogs(data.logs);
        setLoading(false);
    };

    useEffect(() => { load(); }, [tab]);

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit logs</h1><p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">Real-time monitoring of super admin operations</p></div>
            <div className="flex gap-3 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200">
                {(['activity', 'errors'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white text-sky-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}>{t === 'activity' ? 'Activity Stream' : 'Security Alerts'}</button>
                ))}
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50/80 border-b border-slate-200">{['Action', 'Admin', 'Resource', 'Status', 'IP', 'Time'].map(h => <th key={h} className="text-left px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-[0.1em]">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {loading ? [...Array(8)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-6 bg-slate-50 rounded-full animate-pulse mx-6 my-4 w-5/6" /></td></tr>) : logs.length === 0 ? <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-sans font-bold uppercase tracking-widest text-xs">No logs found in this stream</td></tr> : logs.map(l => (
                            <tr key={l._id} className="hover:bg-sky-50/30 transition-all group">
                                <td className="px-6 py-3.5 text-sky-600 font-black">{l.action}</td>
                                <td className="px-6 py-3.5 text-slate-600 font-bold">{l.superAdminId?.name || '—'}</td>
                                <td className="px-6 py-3.5 text-slate-400 font-medium">{l.resource || '—'}</td>
                                <td className="px-6 py-3.5"><span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-widest ${l.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{l.success ? 'Success' : 'Failure'}</span></td>
                                <td className="px-6 py-3.5 text-slate-400 font-medium">{l.ipAddress || '—'}</td>
                                <td className="px-6 py-3.5 text-slate-400 font-bold">{new Date(l.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
