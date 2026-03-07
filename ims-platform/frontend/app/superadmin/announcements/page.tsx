'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

const TYPE_COLORS: Record<string, string> = {
    info: 'text-sky-600 bg-sky-50 border border-sky-100',
    warning: 'text-amber-600 bg-amber-50 border border-amber-100',
    maintenance: 'text-rose-600 bg-rose-50 border border-rose-100',
    feature: 'text-indigo-600 bg-indigo-50 border border-indigo-100',
    security: 'text-orange-600 bg-orange-50 border border-orange-100'
};

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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <form onSubmit={save} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 shadow-sm border border-sky-100">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{item?._id ? 'Edit' : 'Create'} Announcement</h2>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Push system-wide notification</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Announcement Title</label>
                        <input value={form.title} onChange={e => setForm((p: any) => ({ ...p, title: e.target.value }))} required placeholder="Major System Update..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Broadcast Message</label>
                        <textarea value={form.message} onChange={e => setForm((p: any) => ({ ...p, message: e.target.value }))} required rows={4} placeholder="We are excited to announce..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all resize-none placeholder:text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Category Type</label>
                            <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none cursor-pointer">
                                {['info', 'warning', 'maintenance', 'feature', 'security'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-widest ml-1">Expiration Date</label>
                            <input type="date" value={form.expiresAt} onChange={e => setForm((p: any) => ({ ...p, expiresAt: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex gap-6 pt-2 ml-1">
                        <label className="flex items-center gap-3 text-xs font-black text-slate-600 cursor-pointer group uppercase tracking-widest">
                            <input type="checkbox" checked={form.isPinned} onChange={e => setForm((p: any) => ({ ...p, isPinned: e.target.checked }))} className="w-4 h-4 rounded-lg border-2 border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600 transition-all" />
                            Pinned to Top
                        </label>
                        <label className="flex items-center gap-3 text-xs font-black text-slate-600 cursor-pointer group uppercase tracking-widest">
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded-lg border-2 border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600 transition-all" />
                            Publicly Visible
                        </label>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all">Dismiss</button>
                    <button type="submit" className="flex-2 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-sky-500/20 active:scale-95">Deploy Message</button>
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
            <div className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-black text-slate-900 tracking-tight">Announcements</h1><p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider text-[10px]">Broadcast mission-critical updates to all clients</p></div>
                <button onClick={() => setModal({})} className="group flex items-center gap-3 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all shadow-lg shadow-sky-500/25 active:scale-95">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    Publish Broadcast
                </button>
            </div>

            {loading ? <div className="grid gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-100/50 border border-slate-200 rounded-3xl animate-pulse" />)}</div> :
                items.length === 0 ? (
                    <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No active broadcasts identified</p>
                    </div>
                ) :
                    <div className="grid gap-4">
                        {items.map(a => (
                            <div key={a._id} className={`bg-white border-2 rounded-[2rem] p-6 flex items-start justify-between gap-6 transition-all relative overflow-hidden group hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-50/50 ${a.isActive ? 'border-slate-100' : 'border-slate-50 opacity-60'}`}>
                                <div className="flex items-start gap-5 flex-1 p-1">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110 ${TYPE_COLORS[a.type] || 'bg-slate-100 text-slate-500'}`}>
                                        <Megaphone className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="text-lg font-black text-slate-900 truncate group-hover:text-sky-600 transition-colors uppercase tracking-tight">{a.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${TYPE_COLORS[a.type] || ''}`}>{a.type}</span>
                                            {a.isPinned && <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-sky-50 text-sky-600 border border-sky-100">Pinned</span>}
                                            {!a.isActive && <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">Draft</span>}
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4 line-clamp-2">{a.message}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400 uppercase tracking-widest">Created: {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                                            {a.expiresAt && <div className="px-3 py-1.5 bg-rose-50 text-rose-500 rounded-lg text-[9px] font-bold uppercase tracking-widest">Expires: {new Date(a.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 flex-shrink-0 pt-1">
                                    <button onClick={() => setModal(a)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 border border-slate-100 rounded-xl transition-all"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => del(a._id)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 border border-slate-100 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>}
        </div>
    );
}
