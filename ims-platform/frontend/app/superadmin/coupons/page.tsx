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
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">Coupons & Discounts</h1><p className="text-slate-400 text-sm mt-1">Manage discount codes for your platform</p></div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> New Coupon
                </button>
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <form onSubmit={create} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-lg font-bold text-white">Create Coupon</h2>
                        {[{ label: 'Coupon Code', key: 'couponCode', type: 'text', placeholder: 'INSTAURA20' }, { label: 'Discount Value', key: 'discountValue', type: 'number', placeholder: '10' }, { label: 'Max Uses (blank = unlimited)', key: 'maxUses', type: 'number', placeholder: 'e.g. 100' }, { label: 'Expires At (optional)', key: 'expiresAt', type: 'date', placeholder: '' }, { label: 'Description', key: 'description', type: 'text', placeholder: 'Launch discount' }].map(f => (
                            <div key={f.key}>
                                <label className="block text-xs text-slate-400 mb-1.5 font-semibold">{f.label}</label>
                                <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Discount Type</label>
                            <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancel</button>
                            <button type="submit" className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold">Create</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800">
                            {['Code', 'Type', 'Value', 'Used / Max', 'Expires', 'Status', ''].map(h => (
                                <th key={h} className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>) : coupons.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-slate-500">No coupons yet</td></tr>
                        ) : coupons.map(c => (
                            <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-violet-400" />
                                        <span className="font-mono font-bold text-violet-300">{c.couponCode}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-slate-400 capitalize">{c.discountType}</td>
                                <td className="px-5 py-4 text-white font-bold">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                                <td className="px-5 py-4 text-slate-400">{c.usedCount} / {c.maxUses ?? '∞'}</td>
                                <td className="px-5 py-4 text-slate-400 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.isActive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-1 justify-end">
                                        <button onClick={() => toggle(c._id)} className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}><Power className="w-4 h-4" /></button>
                                        <button onClick={() => del(c._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
