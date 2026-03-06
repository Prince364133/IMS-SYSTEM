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
        <div className="space-y-5">
            <Toaster position="top-center" />
            <div><h1 className="text-2xl font-bold text-white">Database Connections</h1><p className="text-slate-400 text-sm mt-1">Monitor and test company database connections</p></div>
            <div className="grid gap-4">
                {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />) : dbs.length === 0 ? <div className="text-center py-16 text-slate-500">No database configurations found</div> : dbs.map(db => (
                    <div key={db._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                                <Database className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{db.companyName}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{db.adminEmail}</p>
                                <code className="text-xs text-slate-500 font-mono mt-1 block">{db.maskedUri || 'No URI configured'}</code>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {results[db._id] && (
                                <div className={`flex items-center gap-1.5 text-xs font-semibold ${results[db._id].status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {results[db._id].status === 'healthy' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                    {results[db._id].message}
                                </div>
                            )}
                            <button onClick={() => test(db._id)} disabled={testing === db._id || !db.maskedUri}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm font-semibold text-white rounded-xl transition-colors flex items-center gap-2">
                                {testing === db._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Test
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
