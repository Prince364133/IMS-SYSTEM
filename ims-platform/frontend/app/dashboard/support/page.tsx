'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, MessageSquare, Clock, Send, Loader2, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../../lib/api';

const STATUS_COLORS: Record<string, string> = { open: 'text-amber-400 bg-amber-400/10', in_progress: 'text-blue-400 bg-blue-400/10', waiting_on_customer: 'text-purple-400 bg-purple-400/10', resolved: 'text-emerald-400 bg-emerald-400/10', closed: 'text-slate-400 bg-slate-700' };

function NewTicketModal({ onClose, onSuccess }: any) {
    const [form, setForm] = useState({ subject: '', description: '', category: 'other', priority: 'medium' });
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            const { data } = await api.post('/support/tickets', form);
            toast.success(`Ticket created! You have ${data.remaining} tickets remaining this month.`);
            onSuccess();
        } catch (err: any) {
            const msg = err?.response?.data?.error;
            toast.error(msg || 'Failed to create ticket');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={submit} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Raise Support Ticket</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Subject</label>
                    <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required placeholder="Brief description of your issue" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={4} placeholder="Describe your issue in detail..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Category</label>
                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                            {['billing', 'technical', 'feature_request', 'account', 'other'].map(c => <option key={c} value={c} className="bg-slate-900">{c.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Priority</label>
                        <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [usage, setUsage] = useState({ used: 0, limit: 9 });

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/support/tickets');
            setTickets(data.tickets);
            setUsage({ used: data.monthlyUsed, limit: data.monthlyLimit });
        } catch { toast.error('Failed to load tickets'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-5">
            <Toaster position="top-center" />
            {showNew && <NewTicketModal onClose={() => setShowNew(false)} onSuccess={() => { setShowNew(false); load(); }} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LifeBuoy className="w-6 h-6 text-violet-400" /> Support</h1>
                    <p className="text-sm text-slate-400 mt-1">Get help from the platform team</p>
                </div>
                <button onClick={() => setShowNew(true)} disabled={usage.used >= usage.limit}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
                    <Plus className="w-4 h-4" /> New Ticket
                </button>
            </div>

            {/* Usage Quota */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">Monthly Ticket Quota</p>
                    <span className={`text-sm font-bold ${usage.used >= usage.limit ? 'text-red-400' : 'text-emerald-400'}`}>{usage.used} / {usage.limit}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all ${usage.used >= usage.limit ? 'bg-red-500' : 'bg-violet-600'}`} style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-2">{usage.limit - usage.used} tickets remaining this month. Quota resets on the 1st of each month.</p>
            </div>

            {/* Ticket List */}
            <div className="space-y-3">
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />) : tickets.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <LifeBuoy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No support tickets yet.</p>
                        <p className="text-xs mt-1">Create your first ticket to get help from the Instaura team.</p>
                    </div>
                ) : tickets.map(t => (
                    <div key={t._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-white">{t.subject}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[t.status] || ''}`}>{t.status.replace(/_/g, ' ')}</span>
                                    <span className="text-[10px] text-slate-500 capitalize">{t.category} · {t.priority} priority</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{t.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-xs text-slate-500 flex-shrink-0">
                                <div className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{t.messages?.length || 0} replies</div>
                                <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(t.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
