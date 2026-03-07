'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Power, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const FEATURES = ['Unlimited Users', 'Priority Support', 'AI Features', 'Advanced Analytics', 'Custom Branding', 'API Access', 'Google Drive Integration', 'Cloudinary Integration', 'Unlimited Drive Storage'];

function PlanModal({ plan, onClose, onSave }: any) {
    const [form, setForm] = useState(plan || { planName: '', price: 0, currency: 'INR', billingCycle: 'monthly', maxUsers: 10, maxProjects: 5, maxStorageGB: 5, features: [], isActive: true, isPopular: false, trialDays: 0 });
    const toggle = (f: string) => setForm((p: any) => ({ ...p, features: p.features.includes(f) ? p.features.filter((x: string) => x !== f) : [...p.features, f] }));

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (plan?._id) await saApi.put(`/plans/${plan._id}`, form);
            else await saApi.post('/plans', form);
            toast.success(plan?._id ? 'Plan updated' : 'Plan created');
            onSave();
        } catch (err: any) { toast.error(err?.response?.data?.error || 'Save failed'); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={save} className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-900">{plan?._id ? 'Edit Plan' : 'Create Plan'}</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Plus className="w-5 h-5 text-slate-400 rotate-45" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Plan Name', key: 'planName', type: 'text' }, { label: 'Price', key: 'price', type: 'number' }, { label: 'Max Users', key: 'maxUsers', type: 'number' }, { label: 'Max Projects', key: 'maxProjects', type: 'number' }, { label: 'Trial Days', key: 'trialDays', type: 'number' }].map(f => (
                        <div key={f.key}>
                            <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">{f.label}</label>
                            <input type={f.type} value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))} required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Currency</label>
                        <select value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm">
                            {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Billing Cycle</label>
                        <select value={form.billingCycle} onChange={e => setForm((p: any) => ({ ...p, billingCycle: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm">
                            {['monthly', 'yearly', 'lifetime'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-3 font-bold uppercase tracking-wider">Features</label>
                    <div className="grid grid-cols-2 gap-3">
                        {FEATURES.map(f => (
                            <label key={f} className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer hover:text-sky-600 transition-colors p-2 rounded-lg hover:bg-sky-50">
                                <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggle(f)} className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500/20" />
                                {f}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.isPopular} onChange={e => setForm((p: any) => ({ ...p, isPopular: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500/20" /> Mark this as the Popular Plan
                    </label>
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all active:scale-95">Cancel</button>
                    <button type="submit" className="flex-1 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-sky-200 active:scale-95">Save Plan</button>
                </div>
            </form>
        </div>
    );
}

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<any>(null); // null | {} | plan object

    const load = async () => {
        setLoading(true);
        const { data } = await saApi.get('/plans');
        setPlans(data.plans);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const del = async (id: string) => {
        if (!confirm('Delete this plan?')) return;
        await saApi.delete(`/plans/${id}`);
        toast.success('Plan deleted');
        load();
    };

    const toggleActive = async (id: string) => {
        await saApi.put(`/plans/${id}/toggle`);
        load();
    };

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            {modal !== null && <PlanModal plan={modal._id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1><p className="text-slate-500 text-sm mt-1">Manage pricing tiers for your platform</p></div>
                <button onClick={() => setModal({})} className="flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-sky-200 active:scale-95">
                    <Plus className="w-5 h-5" /> New Plan
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-96 bg-slate-100 rounded-3xl animate-pulse" />)}</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No plans yet. Create your first plan.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plans.map(p => (
                        <div key={p._id} className={`bg-white border-2 rounded-3xl p-8 flex flex-col relative transition-all group ${p.isActive ? 'border-slate-100 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-50' : 'border-slate-200/50 opacity-60'}`}>
                            {p.isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-sky-200">Most Popular</div>}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{p.planName}</h3>
                                <div className="flex items-baseline gap-2 mt-2">
                                    <span className="text-sm font-bold text-slate-400">{p.currency}</span>
                                    <span className="text-4xl font-black text-slate-900">{p.price.toLocaleString()}</span>
                                    <span className="text-slate-500 font-medium text-sm">/{p.billingCycle}</span>
                                </div>
                            </div>
                            <div className="space-y-4 flex-1 mb-8">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4">Plan Specifications</p>
                                {[
                                    { text: `${p.maxUsers} Users Authorized`, accent: true },
                                    { text: `${p.maxProjects} Active Projects`, accent: true },
                                    { text: p.features?.includes('Unlimited Drive Storage') ? 'Unlimited Drive Storage' : `${p.maxStorageGB}GB Managed Storage`, accent: true },
                                    ...(p.trialDays > 0 ? [{ text: `${p.trialDays} Day Risk-Free Trial`, accent: false }] : [])
                                ].map(l => (
                                    <div key={l.text} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${l.accent ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                        {l.text}
                                    </div>
                                ))}
                                {p.features?.map((f: string) => (
                                    <div key={f} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                        {f}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setModal(p)} className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200">
                                    <Pencil className="w-3.5 h-3.5 text-sky-600" /> Details
                                </button>
                                <button onClick={() => toggleActive(p._id)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${p.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                    <Power className="w-3.5 h-3.5" /> {p.isActive ? 'Suspend' : 'Resume'}
                                </button>
                                <button onClick={() => del(p._id)} className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all active:scale-95 border border-rose-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
