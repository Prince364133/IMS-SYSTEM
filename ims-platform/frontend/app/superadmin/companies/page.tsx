'use client';

import { useEffect, useState } from 'react';
import { Search, Building2, BadgeCheck, Ban, Trash2, KeyRound, Eye, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const STATUS_COLORS: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    trial: 'text-amber-600 bg-amber-50',
    suspended: 'text-rose-600 bg-rose-50',
    cancelled: 'text-slate-500 bg-slate-100',
    expired: 'text-orange-600 bg-orange-50',
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
                    <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
                    <p className="text-slate-500 text-sm mt-1">{total} total companies registered</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> Add Company
                </button>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by company name or email..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm shadow-sm" />
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <form onSubmit={create} className="bg-white border border-slate-200 rounded-2xl p-7 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-slate-900">Add Company</h2>
                            <p className="text-sm text-slate-500">Register a new tenant workspace</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Company Name</label>
                                <input value={newCompany.companyName} onChange={e => setNewCompany(p => ({ ...p, companyName: e.target.value }))} placeholder="e.g. Acme Corp" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Admin Email</label>
                                <input value={newCompany.adminEmail} onChange={e => setNewCompany(p => ({ ...p, adminEmail: e.target.value }))} type="email" placeholder="admin@company.com" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                            <button type="submit" className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/10 transition-all active:scale-[0.98]">Create Company</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="text-left px-5 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-wider">Company</th>
                            <th className="text-left px-5 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-wider">Admin Email</th>
                            <th className="text-left px-5 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-wider">Plan</th>
                            <th className="text-left px-5 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-wider">Status</th>
                            <th className="text-left px-5 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-wider">Joined</th>
                            <th className="text-right px-5 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                        )) : companies.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-slate-400">No companies found</td></tr>
                        ) : companies.map(c => (
                            <tr key={c._id} className="hover:bg-sky-50/30 transition-colors group">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100 transition-colors group-hover:bg-sky-100">
                                            <Building2 className="w-4 h-4 text-sky-600" />
                                        </div>
                                        <span className="font-bold text-slate-900">{c.companyName}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-slate-600 font-medium">{c.adminEmail}</td>
                                <td className="px-5 py-4">
                                    <span className="text-slate-700 font-semibold px-2 py-0.5 bg-slate-100 rounded-md text-[11px] uppercase tracking-wider border border-slate-200">{c.subscriptionPlan?.planName || 'Free'}</span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[c.subscriptionStatus] || 'text-slate-500 bg-slate-100'}`}>
                                        {c.subscriptionStatus}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-slate-400 text-xs font-medium">{new Date(c.createdAt).toLocaleDateString()}</td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => window.location.href = `/superadmin/companies/${c._id}`} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></button>
                                        <button onClick={() => suspend(c._id, c.isSuspended)} className={`p-2 rounded-lg transition-all ${c.isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`} title={c.isSuspended ? 'Unsuspend' : 'Suspend'}>
                                            {c.isSuspended ? <BadgeCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => del(c._id, c.companyName)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {total > 20 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Page {page} of {Math.ceil(total / 20)}</p>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">Prev</button>
                        <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}
