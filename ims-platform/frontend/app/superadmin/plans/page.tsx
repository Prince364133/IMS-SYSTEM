'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Power, Check } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const FEATURES = ['Unlimited Users', 'Priority Support', 'AI Features', 'Advanced Analytics', 'Custom Branding', 'API Access', 'Google Drive Integration', 'Cloudinary Integration'];

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
            <form onSubmit={save} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-white">{plan?._id ? 'Edit Plan' : 'Create Plan'}</h2>
                <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Plan Name', key: 'planName', type: 'text' }, { label: 'Price', key: 'price', type: 'number' }, { label: 'Max Users', key: 'maxUsers', type: 'number' }, { label: 'Max Projects', key: 'maxProjects', type: 'number' }, { label: 'Storage (GB)', key: 'maxStorageGB', type: 'number' }, { label: 'Trial Days', key: 'trialDays', type: 'number' }].map(f => (
                        <div key={f.key}>
                            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">{f.label}</label>
                            <input type={f.type} value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))} required className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Currency</label>
                        <select value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                            {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Billing Cycle</label>
                        <select value={form.billingCycle} onChange={e => setForm((p: any) => ({ ...p, billingCycle: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                            {['monthly', 'yearly', 'lifetime'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Features</label>
                    <div className="grid grid-cols-2 gap-2">
                        {FEATURES.map(f => (
                            <label key={f} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggle(f)} className="accent-violet-500" />
                                {f}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={form.isPopular} onChange={e => setForm((p: any) => ({ ...p, isPopular: e.target.checked }))} className="accent-violet-500" /> Mark as Popular
                    </label>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors">Save Plan</button>
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
                <div><h1 className="text-2xl font-bold text-white">Subscription Plans</h1><p className="text-slate-400 text-sm mt-1">Manage pricing tiers for your platform</p></div>
                <button onClick={() => setModal({})} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> New Plan
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No plans yet. Create your first plan.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {plans.map(p => (
                        <div key={p._id} className={`bg-slate-900 border rounded-2xl p-6 flex flex-col relative transition-colors ${p.isActive ? 'border-slate-800 hover:border-violet-500/30' : 'border-slate-800/50 opacity-60'}`}>
                            {p.isPopular && <span className="absolute top-4 right-4 px-2.5 py-1 bg-violet-600/20 text-violet-400 text-xs font-bold rounded-full">Popular</span>}
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white">{p.planName}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xs text-slate-500">{p.currency}</span>
                                    <span className="text-3xl font-bold text-white">{p.price.toLocaleString()}</span>
                                    <span className="text-slate-500 text-sm">/{p.billingCycle}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 flex-1 mb-5">
                                <p className="text-xs text-slate-400 font-semibold mb-2">LIMITS</p>
                                {[`${p.maxUsers} Users`, `${p.maxProjects} Projects`, `${p.maxStorageGB} GB Storage`, ...(p.trialDays > 0 ? [`${p.trialDays} Day Trial`] : [])].map(l => (
                                    <div key={l} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        {l}
                                    </div>
                                ))}
                                {p.features?.map((f: string) => (
                                    <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                                        <Check className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                                        {f}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setModal(p)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button onClick={() => toggleActive(p._id)} className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${p.isActive ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'}`}>
                                    <Power className="w-3.5 h-3.5" /> {p.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => del(p._id)} className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
