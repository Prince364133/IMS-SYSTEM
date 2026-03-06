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
        <div className="space-y-5">
            <div><h1 className="text-2xl font-bold text-white">Logs & Monitoring</h1><p className="text-slate-400 text-sm mt-1">Super admin activity and security event logs</p></div>
            <div className="flex gap-2">
                {(['activity', 'errors'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${tab === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{t === 'activity' ? 'Activity Logs' : 'Error Logs'}</button>
                ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-800">{['Action', 'Admin', 'Resource', 'Status', 'IP', 'Time'].map(h => <th key={h} className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800/50 font-mono text-xs">
                        {loading ? [...Array(8)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-8 bg-slate-800 rounded animate-pulse mx-5 my-2" /></td></tr>) : logs.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-500 font-sans">No logs found</td></tr> : logs.map(l => (
                            <tr key={l._id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-3 text-violet-300 font-semibold">{l.action}</td>
                                <td className="px-5 py-3 text-slate-400">{l.superAdminId?.name || '—'}</td>
                                <td className="px-5 py-3 text-slate-400">{l.resource || '—'}</td>
                                <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded font-bold ${l.success ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>{l.success ? 'OK' : 'FAIL'}</span></td>
                                <td className="px-5 py-3 text-slate-500">{l.ipAddress || '—'}</td>
                                <td className="px-5 py-3 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
