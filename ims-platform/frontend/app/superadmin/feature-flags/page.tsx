'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const CATEGORY_COLORS: Record<string, string> = {
    ai: 'text-indigo-600 bg-indigo-50 border border-indigo-100',
    billing: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    storage: 'text-amber-600 bg-amber-50 border border-amber-100',
    communication: 'text-sky-600 bg-sky-50 border border-sky-100',
    security: 'text-rose-600 bg-rose-50 border border-rose-100',
    general: 'text-slate-500 bg-slate-100 border border-slate-200'
};

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
            <div className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Feature Configurations</h1><p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">Granular control over global system modules</p></div>
                <button onClick={() => setShowCreate(true)} className="group flex items-center gap-3 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all shadow-lg shadow-sky-500/25 active:scale-95">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    Define New Flag
                </button>
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <form onSubmit={create} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm border border-sky-100">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">New Feature Definition</h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Initialize a new system-wide control hook</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Flag Slug (Hook Key)</label>
                                <input value={form.flagKey} onChange={e => setForm(p => ({ ...p, flagKey: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="enable_multi_factor_auth" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300 font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Display Label</label>
                                <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Enterprise MFA" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Category</label>
                                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none cursor-pointer">
                                        {['ai', 'billing', 'storage', 'communication', 'security', 'general'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Initial State</label>
                                    <div className="flex-1 flex items-center px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs font-bold italic">DEACTIVATED BY DEFAULT</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Functional Description</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Controls access to the two-factor authentication suite..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all resize-none placeholder:text-slate-300" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all">Abort</button>
                            <button type="submit" className="flex-2 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-sky-500/20 active:scale-95">Deploy Hook</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <div className="grid gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-slate-100/50 border border-slate-200 rounded-[2rem] animate-pulse" />)}</div> : Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-100/50 relative">
                    <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${CATEGORY_COLORS[category] || 'bg-slate-100 text-slate-500'}`}>{category}</span>
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{(items as any[]).length} Flags</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(items as any[]).map(f => (
                            <div key={f._id} className="flex items-center justify-between px-8 py-6 hover:bg-sky-50/20 transition-all group relative">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <p className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight">{f.label}</p>
                                        <code className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">{f.flagKey}</code>
                                    </div>
                                    {f.description && <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">{f.description}</p>}
                                </div>
                                <div className="flex items-center gap-8 ml-8 flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${f.isEnabled ? 'text-sky-600' : 'text-slate-300'}`}>{f.isEnabled ? 'Active' : 'Disabled'}</span>
                                        <button type="button" onClick={() => toggle(f._id)}
                                            className={`w-14 h-7 rounded-full transition-all relative flex-shrink-0 border-2 ${f.isEnabled ? 'bg-sky-600 border-sky-700 shadow-inner shadow-sky-900/20' : 'bg-slate-200 border-slate-300'}`}>
                                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${f.isEnabled ? 'translate-x-7 shadow-sky-900/40' : 'translate-x-0.5 shadow-slate-400/40'}`} />
                                        </button>
                                    </div>
                                    <button onClick={() => del(f._id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-transparent rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
