'use client';

import { useEffect, useState } from 'react';
import { Search, Trash2, UserX } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const { data } = await saApi.get('/users', { params: { search, limit: 30 } });
        setUsers(data.users); setTotal(data.total);
        setLoading(false);
    };

    useEffect(() => { load(); }, [search]);

    const suspend = async (id: string) => { if (!confirm('Suspend this user?')) return; await saApi.put(`/users/${id}/suspend`); toast.success('User suspended'); load(); };
    const del = async (id: string) => { if (!confirm('Delete this user permanently?')) return; await saApi.delete(`/users/${id}`); toast.success('User deleted'); load(); };

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">All Users</h1><p className="text-slate-400 text-sm mt-1">{total} users across all companies</p></div>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-800">{['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="text-left px-5 py-3.5 text-slate-400 font-semibold text-xs uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-10 bg-slate-800 rounded animate-pulse mx-5 my-2" /></td></tr>) : users.map(u => (
                            <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 text-sm font-bold">{u.name?.[0]?.toUpperCase()}</div>
                                        <span className="font-semibold text-white text-sm">{u.name}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-slate-400 text-xs">{u.email}</td>
                                <td className="px-5 py-4"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 capitalize">{u.role}</span></td>
                                <td className="px-5 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive !== false ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>{u.isActive !== false ? 'Active' : 'Suspended'}</span></td>
                                <td className="px-5 py-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td className="px-5 py-4"><div className="flex gap-1">
                                    <button onClick={() => suspend(u._id)} className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"><UserX className="w-4 h-4" /></button>
                                    <button onClick={() => del(u._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
