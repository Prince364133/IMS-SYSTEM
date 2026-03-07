'use client';

import { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

export default function DatabasesPage() {
    const [dbs, setDbs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, any>>({});

    useEffect(() => {
        saApi.get('/databases').then(({ data }) => setDbs(data.databases)).finally(() => setLoading(false));
    }, []);

    const test = async (id: string) => {
        setTesting(id);
        try {
            const { data } = await saApi.post(`/databases/${id}/test`);
            setResults(p => ({ ...p, [id]: data }));
        } catch { setResults(p => ({ ...p, [id]: { status: 'error', message: 'Test failed' } })); }
        setTesting(null);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Database Infrastructure</h1>
                <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">Real-time connectivity monitoring for enterprise nodes</p>
            </div>
            <div className="grid gap-6">
                {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100/50 border border-slate-200 rounded-[2rem] animate-pulse" />) : dbs.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No infrastructure nodes identified</p>
                    </div>
                ) : dbs.map(db => (
                    <div key={db._id} className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-7 flex items-center justify-between gap-6 transition-all hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-100/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-40 transition-all duration-700" />
                        <div className="flex items-start gap-5 relative z-10">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                <Database className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-lg font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors uppercase">{db.companyName}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{db.adminEmail}</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <code className="text-[10px] text-slate-500 font-black bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg tracking-wider">{db.maskedUri || 'ENDPOINT_NOT_CONFIGURED'}</code>
                                    {db.maskedUri && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0 relative z-10 pl-8 border-l border-slate-50">
                            {results[db._id] && (
                                <div className={`flex flex-col items-end gap-1.5 transition-all animate-in slide-in-from-right-4`}>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${results[db._id].status === 'healthy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {results[db._id].status === 'healthy' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                        {results[db._id].status === 'healthy' ? 'Node Healthy' : 'System Error'}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-1">{results[db._id].message}</span>
                                </div>
                            )}
                            <button onClick={() => test(db._id)} disabled={testing === db._id || !db.maskedUri}
                                className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-30 disabled:grayscale text-[11px] font-black uppercase tracking-[0.2em] text-white rounded-2xl transition-all shadow-lg shadow-sky-500/25 active:scale-95 flex items-center gap-3">
                                {testing === db._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                {testing === db._id ? 'Pinging...' : 'Verify Node'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
