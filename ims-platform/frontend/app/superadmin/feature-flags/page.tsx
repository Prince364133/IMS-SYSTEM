'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const CATEGORY_COLORS: Record<string, string> = { ai: 'text-violet-400 bg-violet-400/10', billing: 'text-amber-400 bg-amber-400/10', storage: 'text-blue-400 bg-blue-400/10', communication: 'text-teal-400 bg-teal-400/10', security: 'text-red-400 bg-red-400/10', general: 'text-slate-400 bg-slate-700' };

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ flagKey: '', label: '', description: '', category: 'general' });

    const load = async () => {
        setLoading(true);
        const { data } = await saApi.get('/feature-flags');
        setFlags(data.flags);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const toggle = async (id: string) => { await saApi.put(`/feature-flags/${id}/toggle`); load(); };
    const del = async (id: string) => { if (!confirm('Delete flag?')) return; await saApi.delete(`/feature-flags/${id}`); toast.success('Deleted'); load(); };
    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await saApi.post('/feature-flags', form); toast.success('Flag created'); setShowCreate(false); setForm({ flagKey: '', label: '', description: '', category: 'general' }); load(); }
        catch (err: any) { toast.error(err?.response?.data?.error || 'Failed'); }
    };

    const grouped = flags.reduce((acc: Record<string, any[]>, f) => { (acc[f.category] = acc[f.category] || []).push(f); return acc; }, {});

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">Feature Flags</h1><p className="text-slate-400 text-sm mt-1">Enable or disable platform features globally</p></div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" /> New Flag</button>
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <form onSubmit={create} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-lg font-bold text-white">Create Feature Flag</h2>
                        {[{ label: 'Flag Key (slug)', key: 'flagKey', placeholder: 'enable_ai_features' }, { label: 'Label', key: 'label', placeholder: 'AI Features' }, { label: 'Description', key: 'description', placeholder: 'Enable AI across all company dashboards' }].map(f => (
                            <div key={f.key}>
                                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">{f.label}</label>
                                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} required={f.key !== 'description'} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Category</label>
                            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                {['ai', 'billing', 'storage', 'communication', 'security', 'general'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancel</button>
                            <button type="submit" className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold">Create</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" /> : Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-800">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${CATEGORY_COLORS[category] || 'bg-slate-700 text-slate-400'}`}>{category}</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {(items as any[]).map(f => (
                            <div key={f._id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white">{f.label}</p>
                                        <code className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded-lg">{f.flagKey}</code>
                                    </div>
                                    {f.description && <p className="text-xs text-slate-500 mt-1">{f.description}</p>}
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                    <button type="button" onClick={() => toggle(f._id)}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${f.isEnabled ? 'bg-violet-600' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${f.isEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                    <span className="text-xs font-semibold w-14 text-right text-slate-400">{f.isEnabled ? 'ON' : 'OFF'}</span>
                                    <button onClick={() => del(f._id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
