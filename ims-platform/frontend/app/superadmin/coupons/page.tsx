'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Power, Tag } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ couponCode: '', discountType: 'percentage', discountValue: 10, maxUses: '', expiresAt: '', description: '' });

    const load = async () => {
        setLoading(true);
        const { data } = await saApi.get('/coupons');
        setCoupons(data.coupons);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saApi.post('/coupons', { ...form, maxUses: form.maxUses ? +form.maxUses : null, expiresAt: form.expiresAt || null });
            toast.success('Coupon created');
            setShowCreate(false);
            setForm({ couponCode: '', discountType: 'percentage', discountValue: 10, maxUses: '', expiresAt: '', description: '' });
            load();
        } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to create coupon'); }
    };

    const toggle = async (id: string) => { await saApi.put(`/coupons/${id}/toggle`); load(); };
    const del = async (id: string) => { if (!confirm('Delete coupon?')) return; await saApi.delete(`/coupons/${id}`); toast.success('Deleted'); load(); };

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Coupons & Discounts</h1><p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">Manage platform-wide promotional campaigns</p></div>
                <button onClick={() => setShowCreate(true)} className="group flex items-center gap-3 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all shadow-lg shadow-sky-500/25 active:scale-95">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    Generate Coupon
                </button>
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <form onSubmit={create} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm border border-sky-100">
                                <Tag className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Create New Coupon</h2>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Define redemption rules and limits</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Redemption Code</label>
                                <input type="text" value={form.couponCode} onChange={e => setForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))} placeholder="INSTAURA2025" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300 font-mono" />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Discount Type</label>
                                <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none cursor-pointer">
                                    <option value="percentage">PERCENTAGE (%)</option>
                                    <option value="fixed">FIXED AMOUNT (₹)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Reward Value</label>
                                <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: +e.target.value }))} placeholder="e.g. 10" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all" />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Usage Limit</label>
                                <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all" />
                            </div>

                            <div>
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Expiry Date</label>
                                <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all cursor-pointer" />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Program Description</label>
                                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Summer sale 2025 promotion" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all">Abort</button>
                            <button type="submit" className="flex-2 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-sky-500/20 active:scale-95">Activate Coupon</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                            {['Promotion Code', 'Type', 'Reward Value', 'Redemptions', 'Valid Until', 'Status', ''].map(h => (
                                <th key={h} className="text-left px-6 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-[0.1em]">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={7} className="px-6 py-6"><div className="h-4 bg-slate-50 rounded-full animate-pulse w-full" /></td></tr>) : coupons.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-24 bg-slate-50/30 text-slate-400 font-bold uppercase tracking-widest text-xs">No promotion catalogs identified</td></tr>
                        ) : coupons.map(c => (
                            <tr key={c._id} className="hover:bg-sky-50/30 transition-all group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100 group-hover:scale-110 transition-transform">
                                            <Tag className="w-4 h-4" />
                                        </div>
                                        <span className="font-mono font-black text-sky-600 tracking-wider text-sm">{c.couponCode}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-slate-500 font-bold uppercase tracking-widest text-[10px]">{c.discountType}</td>
                                <td className="px-6 py-5 text-slate-900 font-black text-sm">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-slate-900 font-black text-sm">{c.usedCount} <span className="text-slate-400 text-[10px] font-bold">/ {c.maxUses ?? '∞'}</span></span>
                                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-sky-500" style={{ width: c.maxUses ? `${Math.min((c.usedCount / c.maxUses) * 100, 100)}%` : '0%' }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-slate-500 font-bold text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB') : 'PERPETUAL'}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${c.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{c.isActive ? 'Active' : 'Archived'}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button onClick={() => toggle(c._id)} className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${c.isActive ? 'text-amber-500 bg-amber-50 border-amber-100 hover:bg-amber-100' : 'text-emerald-500 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`} title={c.isActive ? 'Deactivate' : 'Reactivate'}><Power className="w-4 h-4" /></button>
                                        <button onClick={() => del(c._id)} className="w-9 h-9 flex items-center justify-center text-rose-500 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all"><Trash2 className="w-4 h-4" /></button>
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
