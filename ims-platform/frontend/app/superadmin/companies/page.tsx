'use client';

import { useEffect, useState } from 'react';
import { Search, Building2, BadgeCheck, Ban, Trash2, KeyRound, Eye, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-400/10',
    trial: 'text-amber-400 bg-amber-400/10',
    suspended: 'text-red-400 bg-red-400/10',
    cancelled: 'text-slate-400 bg-slate-400/10',
    expired: 'text-orange-400 bg-orange-400/10',
};

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [newCompany, setNewCompany] = useState({ companyName: '', adminEmail: '' });

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await saApi.get('/companies', { params: { page, limit: 20, search } });
            setCompanies(data.companies);
            setTotal(data.total);
        } catch { toast.error('Failed to load companies'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, [page, search]);

    const suspend = async (id: string, isSuspended: boolean) => {
        try {
            await saApi.put(`/companies/${id}/${isSuspended ? 'unsuspend' : 'suspend'}`, { reason: 'Suspended by super admin' });
            toast.success(isSuspended ? 'Company unsuspended' : 'Company suspended');
            load();
        } catch { toast.error('Action failed'); }
    };

    const del = async (id: string, name: string) => {
        if (!confirm(`Type DELETE to confirm deleting "${name}"`)) return;
        try {
            await saApi.delete(`/companies/${id}`, { data: { confirm: 'DELETE' } });
            toast.success('Company deleted');
            load();
        } catch { toast.error('Delete failed'); }
    };

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await saApi.post('/companies', newCompany);
            toast.success('Company created');
            setShowCreate(false);
            setNewCompany({ companyName: '', adminEmail: '' });
            load();
        } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed'); }
    };

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Companies</h1>
                    <p className="text-slate-400 text-sm mt-1">{total} total companies registered</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Company
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by company name or email..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <form onSubmit={create} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <h2 className="text-lg font-bold text-white">Add Company</h2>
                        <input value={newCompany.companyName} onChange={e => setNewCompany(p => ({ ...p, companyName: e.target.value }))} placeholder="Company Name" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        <input value={newCompany.adminEmail} onChange={e => setNewCompany(p => ({ ...p, adminEmail: e.target.value }))} type="email" placeholder="Admin Email" required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancel</button>
                            <button type="submit" className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold">Create</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Company</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Admin Email</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Plan</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Joined</th>
                            <th className="text-right px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td></tr>
                        )) : companies.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-slate-500">No companies found</td></tr>
                        ) : companies.map(c => (
                            <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <span className="font-semibold text-white">{c.companyName}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-slate-400">{c.adminEmail}</td>
                                <td className="px-5 py-4 text-slate-300">{c.subscriptionPlan?.planName || 'Free'}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.subscriptionStatus] || 'text-slate-400 bg-slate-800'}`}>
                                        {c.subscriptionStatus}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => window.location.href = `/superadmin/companies/${c._id}`} className="p-2 text-slate-400 hover:text-violet-400 hover:bg-violet-400/10 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => suspend(c._id, c.isSuspended)} className={`p-2 rounded-lg transition-colors ${c.isSuspended ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-amber-400 hover:bg-amber-400/10'}`} title={c.isSuspended ? 'Unsuspend' : 'Suspend'}>
                                            {c.isSuspended ? <BadgeCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => del(c._id, c.companyName)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm">Page {page} of {Math.ceil(total / 20)}</p>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50">Prev</button>
                        <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
