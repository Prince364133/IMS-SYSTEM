'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const TYPE_COLORS: Record<string, string> = { info: 'text-blue-400 bg-blue-400/10', warning: 'text-amber-400 bg-amber-400/10', maintenance: 'text-red-400 bg-red-400/10', feature: 'text-violet-400 bg-violet-400/10', security: 'text-orange-400 bg-orange-400/10' };

function AnnouncementModal({ item, onClose, onSave }: any) {
    const [form, setForm] = useState(item || { title: '', message: '', type: 'info', isActive: true, isPinned: false, expiresAt: '' });
    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form, expiresAt: form.expiresAt || null };
            if (item?._id) await saApi.put(`/announcements/${item._id}`, payload);
            else await saApi.post('/announcements', payload);
            toast.success(item?._id ? 'Updated' : 'Created');
            onSave();
        } catch { toast.error('Failed to save'); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={save} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <h2 className="text-lg font-bold text-white">{item?._id ? 'Edit' : 'New'} Announcement</h2>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Title</label>
                    <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} required className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Message</label>
                    <textarea value={form.message} onChange={e => setForm((p: any) => ({ ...p, message: e.target.value }))} required rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Type</label>
                        <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                            {['info', 'warning', 'maintenance', 'feature', 'security'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Expires At (optional)</label>
                        <input type="date" value={form.expiresAt} onChange={e => setForm((p: any) => ({ ...p, expiresAt: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={form.isPinned} onChange={e => setForm((p: any) => ({ ...p, isPinned: e.target.checked }))} className="accent-violet-500" /> Pinned</label>
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} className="accent-violet-500" /> Active</label>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold">Cancel</button>
                    <button type="submit" className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold">Save</button>
                </div>
            </form>
        </div>
    );
}

export default function AnnouncementsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<any>(null);

    const load = async () => { setLoading(true); const { data } = await saApi.get('/announcements'); setItems(data.announcements); setLoading(false); };
    useEffect(() => { load(); }, []);
    const del = async (id: string) => { if (!confirm('Delete announcement?')) return; await saApi.delete(`/announcements/${id}`); toast.success('Deleted'); load(); };

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            {modal !== null && <AnnouncementModal item={modal._id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-white">Announcements</h1><p className="text-slate-400 text-sm mt-1">Broadcast messages to all company users</p></div>
                <button onClick={() => setModal({})} className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"><Plus className="w-4 h-4" /> New Announcement</button>
            </div>

            {loading ? <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}</div> :
                items.length === 0 ? <div className="text-center py-20 text-slate-500">No announcements yet</div> :
                    <div className="space-y-3">
                        {items.map(a => (
                            <div key={a._id} className={`bg-slate-900 border rounded-2xl p-5 flex items-start justify-between gap-4 transition-colors ${a.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-60'}`}>
                                <div className="flex items-start gap-3 flex-1">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[a.type] || 'bg-slate-800 text-slate-400'}`}>
                                        <Megaphone className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-white">{a.title}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TYPE_COLORS[a.type] || ''}`}>{a.type}</span>
                                            {a.isPinned && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/20 text-violet-400">Pinned</span>}
                                            {!a.isActive && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-500">Inactive</span>}
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{a.message}</p>
                                        <p className="text-xs text-slate-600 mt-1.5">{new Date(a.createdAt).toLocaleDateString()}{a.expiresAt ? ` · Expires: ${new Date(a.expiresAt).toLocaleDateString()}` : ''}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => setModal(a)} className="p-2 text-slate-400 hover:text-violet-400 hover:bg-violet-400/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => del(a._id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>}
        </div>
    );
}
