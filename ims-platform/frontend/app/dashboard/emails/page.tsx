'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { format } from 'date-fns';
import {
    Mail, History, Send, Loader2, Search, CheckCircle, XCircle,
    RefreshCw, Users, BarChart3, Zap, ChevronLeft, ChevronRight,
    Filter, Eye, AlertTriangle, TrendingUp, Mailbox, Clock, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import AIEmailDraftModal from '../../../components/emails/AIEmailDraftModal';

type Tab = 'dashboard' | 'history' | 'compose' | 'bulk';

const STATUS_COLORS: Record<string, string> = {
    sent: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    failed: 'bg-rose-50 text-rose-700 ring-rose-100',
};

export default function EmailManagementPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    // ── History state ──────────────────────────────────────────────────────────
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // ── Stats state ────────────────────────────────────────────────────────────
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // ── Templates / Users ─────────────────────────────────────────────────────
    const [templates, setTemplates] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // ── Compose (template) ────────────────────────────────────────────────────
    const [composeMode, setComposeMode] = useState<'template' | 'custom'>('template');
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ to: '', templateId: '', templateData: {} as Record<string, string> });
    const [customForm, setCustomForm] = useState({ to: '', subject: '', body: '' });

    // ── Bulk email ────────────────────────────────────────────────────────────
    const [bulkForm, setBulkForm] = useState({ role: 'all', subject: '', message: '' });
    const [sendingBulk, setSendingBulk] = useState(false);
    const [bulkResult, setBulkResult] = useState<any>(null);

    // ── Preview modal ─────────────────────────────────────────────────────────
    const [previewLog, setPreviewLog] = useState<any>(null);
    const [showAiDraft, setShowAiDraft] = useState(false);
    const [aiDraftTarget, setAiDraftTarget] = useState<'custom' | 'bulk'>('custom');

    const isHR = user && ['admin', 'hr'].includes(user.role);

    const fetchLogs = useCallback(async () => {
        setLoadingLogs(true);
        try {
            const params: any = { page, limit: 15 };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/api/emails/logs', { params });
            setLogs(res.data.logs || []);
            setTotal(res.data.total || 0);
            setPages(res.data.pages || 1);
        } catch (err: any) {
            console.error('Failed to fetch email logs:', err);
            toast.error('Could not load email history');
        } finally { setLoadingLogs(false); }
    }, [page, statusFilter]);

    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await api.get('/api/emails/stats');
            setStats(res.data);
        } catch (err: any) {
            console.error('Failed to fetch email stats:', err);
            toast.error('Could not load dashboard stats');
        } finally { setLoadingStats(false); }
    }, []);

    useEffect(() => {
        if (!isHR) return;
        api.get('/api/emails/templates').then(r => setTemplates(r.data.templates || [])).catch(err => console.error('Templates fetch error:', err));
        api.get('/api/users', { params: { limit: 200 } }).then(r => setUsers(r.data.users || [])).catch(err => console.error('Users fetch error:', err));
        fetchStats();
    }, [isHR, fetchStats]);

    useEffect(() => { if (isHR && activeTab === 'history') fetchLogs(); }, [isHR, activeTab, fetchLogs]);
    useEffect(() => { if (isHR && activeTab === 'dashboard') fetchStats(); }, [isHR, activeTab, fetchStats]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    async function handleSendTemplate(e: React.FormEvent) {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/api/emails/send', form);
            toast.success('Email sent successfully!');
            setForm({ to: '', templateId: '', templateData: {} });
            setActiveTab('history');
            fetchLogs();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to send email');
        } finally { setSending(false); }
    }

    async function handleSendCustom(e: React.FormEvent) {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/api/emails/send-custom', customForm);
            toast.success('Custom email sent!');
            setCustomForm({ to: '', subject: '', body: '' });
            setActiveTab('history');
            fetchLogs();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to send email');
        } finally { setSending(false); }
    }

    async function handleSendBulk(e: React.FormEvent) {
        e.preventDefault();
        setSendingBulk(true);
        setBulkResult(null);
        try {
            const res = await api.post('/api/emails/send-bulk', bulkForm);
            setBulkResult(res.data);
            toast.success(res.data.message);
            setBulkForm({ role: 'all', subject: '', message: '' });
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Bulk send failed');
        } finally { setSendingBulk(false); }
    }

    async function handleRetry(logId: string) {
        try {
            await api.post(`/api/emails/retry/${logId}`);
            toast.success('Email retried successfully!');
            fetchLogs();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Retry failed');
        }
    }

    const selectedTemplate = templates.find(t => t.id === form.templateId);
    const filteredLogs = logs.filter(log =>
        !searchQuery ||
        log.to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sentCount = stats?.stats?.find((s: any) => s._id === 'sent')?.count || 0;
    const failedCount = stats?.stats?.find((s: any) => s._id === 'failed')?.count || 0;
    const totalCount = sentCount + failedCount;
    const deliveryRate = totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0;

    if (!isHR) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Mail className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Access Denied</p>
                    <p className="text-gray-400 text-sm mt-1">HR or Admin privileges required</p>
                </div>
            </div>
        );
    }

    const TABS: { key: Tab; label: string; icon: any }[] = [
        { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { key: 'history', label: 'Email History', icon: History },
        { key: 'compose', label: 'Compose', icon: Send },
        { key: 'bulk', label: 'Bulk Send', icon: Users },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Email Management</h1>
                    <p className="page-subtitle">Send, track, and analyze all system emails in one place.</p>
                </div>
                <button onClick={() => { fetchStats(); fetchLogs(); }} className="btn-secondary flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                                active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Sent', value: sentCount, icon: Mailbox, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Failed', value: failedCount, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
                            { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Total Emails', value: totalCount, icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
                        ].map(s => (
                            <div key={s.label} className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</span>
                                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', s.bg)}>
                                        <s.icon className={clsx('w-4 h-4', s.color)} />
                                    </div>
                                </div>
                                {loadingStats ? (
                                    <div className="h-7 w-16 bg-gray-100 rounded animate-pulse" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Template Breakdown */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-primary" /> Template Usage Breakdown
                            </h3>
                        </div>
                        <div className="card-body">
                            {loadingStats ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                                </div>
                            ) : stats?.templateStats?.length ? (
                                <div className="space-y-3">
                                    {stats.templateStats.map((t: any) => {
                                        const pct = totalCount > 0 ? Math.round((t.count / totalCount) * 100) : 0;
                                        return (
                                            <div key={t._id}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700">{t._id}</span>
                                                    <span className="text-gray-500">{t.count} emails{t.failed > 0 && <span className="text-rose-400 ml-2">({t.failed} failed)</span>}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 py-8">No email data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Recent 7 days */}
                    {stats?.recentActivity?.length > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> Last 7 Days Activity
                                </h3>
                            </div>
                            <div className="card-body">
                                <div className="flex items-end gap-2 h-24">
                                    {stats.recentActivity.map((d: any) => {
                                        const max = Math.max(...stats.recentActivity.map((x: any) => x.count));
                                        const h = max > 0 ? Math.round((d.count / max) * 100) : 0;
                                        return (
                                            <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs text-gray-500">{d.count}</span>
                                                <div className="w-full bg-primary rounded-t" style={{ height: `${h}%`, minHeight: d.count > 0 ? '4px' : '0' }} />
                                                <span className="text-[10px] text-gray-400">{d._id.slice(5)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { label: 'Compose Email', desc: 'Send to a single recipient', icon: Send, tab: 'compose' as Tab, color: 'bg-primary text-white hover:bg-primary-dark' },
                            { label: 'Bulk Send', desc: 'Email entire teams at once', icon: Users, tab: 'bulk' as Tab, color: 'bg-indigo-600 text-white hover:bg-indigo-700' },
                            { label: 'View History', desc: 'Browse all sent emails', icon: History, tab: 'history' as Tab, color: 'bg-gray-800 text-white hover:bg-gray-900' },
                        ].map(q => (
                            <button key={q.label} onClick={() => setActiveTab(q.tab)}
                                className={clsx('p-4 rounded-2xl text-left transition-all shadow-sm hover:shadow-md', q.color)}>
                                <q.icon className="w-6 h-6 mb-2 opacity-90" />
                                <p className="font-semibold">{q.label}</p>
                                <p className="text-xs opacity-75 mt-0.5">{q.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── HISTORY TAB ───────────────────────────────────────────────────── */}
            {activeTab === 'history' && (
                <div className="card overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                                type="text"
                                placeholder="Search recipient or subject..."
                                className="bg-transparent border-none focus:ring-0 text-sm outline-none flex-1"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="select text-sm py-1.5"
                            >
                                <option value="">All Status</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <span className="text-xs text-gray-400 ml-auto">{total} emails total</span>
                    </div>

                    {loadingLogs ? (
                        <div className="flex items-center justify-center p-12 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Recipient</th>
                                            <th>Subject</th>
                                            <th>Template</th>
                                            <th>Sent By</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="font-medium text-gray-900 text-sm">{log.to}</td>
                                                <td className="text-gray-600 text-sm max-w-[160px] truncate">{log.subject}</td>
                                                <td>
                                                    <span className="badge badge-gray text-xs">{log.templateName}</span>
                                                </td>
                                                <td className="text-gray-500 text-sm">{log.sentBy?.name || <span className="italic text-gray-300">System</span>}</td>
                                                <td>
                                                    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset', STATUS_COLORS[log.status] || 'bg-gray-50 text-gray-600 ring-gray-100')}>
                                                        {log.status === 'sent' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                        {log.status === 'sent' ? 'Sent' : 'Failed'}
                                                    </span>
                                                </td>
                                                <td className="text-gray-500 text-xs whitespace-nowrap">
                                                    {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm') : 'N/A'}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setPreviewLog(log)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors" title="View details">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        {log.status === 'failed' && (
                                                            <button onClick={() => handleRetry(log._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 transition-colors" title="Retry">
                                                                <RefreshCw className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredLogs.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center">
                                                    <Mail className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                                    <p className="text-gray-400 text-sm">No emails found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pages > 1 && (
                                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">Page {page} of {pages}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── COMPOSE TAB ───────────────────────────────────────────────────── */}
            {activeTab === 'compose' && (
                <div className="max-w-2xl mx-auto space-y-4">
                    {/* Mode toggle */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                        {[{ key: 'template', label: 'Template Email' }, { key: 'custom', label: 'Custom Email' }].map(m => (
                            <button
                                key={m.key}
                                onClick={() => setComposeMode(m.key as any)}
                                className={clsx('px-4 py-2 text-sm font-medium rounded-lg transition-all',
                                    composeMode === m.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <div className="card">
                        <div className="card-header flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Mail className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">{composeMode === 'template' ? 'Send Template Email' : 'Custom Compose'}</h2>
                                <p className="text-xs text-gray-500">{composeMode === 'template' ? 'Use a pre-built template with dynamic fields' : 'Write a fully custom subject and message body'}</p>
                            </div>
                        </div>

                        <div className="card-body">
                            {/* Template Mode */}
                            {composeMode === 'template' && (
                                <form onSubmit={handleSendTemplate} className="space-y-5">
                                    <div>
                                        <label className="label">Recipient Email *</label>
                                        <input
                                            type="email"
                                            required
                                            list="user-emails-list"
                                            className="input"
                                            placeholder="Enter or pick from team..."
                                            value={form.to}
                                            onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                                        />
                                        <datalist id="user-emails-list">
                                            {users.map(u => (
                                                <option key={u._id} value={u.email}>{u.name} — {u.role}</option>
                                            ))}
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className="label">Email Template *</label>
                                        <select
                                            required
                                            className="select"
                                            value={form.templateId}
                                            onChange={e => setForm(p => ({ ...p, templateId: e.target.value, templateData: {} }))}
                                        >
                                            <option value="">Select a template...</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        {selectedTemplate && (
                                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                                <Zap className="w-3 h-3" /> {selectedTemplate.description}
                                            </p>
                                        )}
                                    </div>

                                    {selectedTemplate && selectedTemplate.fields.length > 0 && (
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Template Fields</p>
                                            {selectedTemplate.fields.map((field: string) => (
                                                <div key={field}>
                                                    <label className="label capitalize">{field.replace(/([A-Z])/g, ' $1').trim()} *</label>
                                                    {field === 'message' || field === 'body' ? (
                                                        <textarea
                                                            required
                                                            rows={3}
                                                            className="input resize-none"
                                                            value={form.templateData[field] || ''}
                                                            onChange={e => setForm(p => ({ ...p, templateData: { ...p.templateData, [field]: e.target.value } }))}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            required
                                                            className="input"
                                                            value={form.templateData[field] || ''}
                                                            onChange={e => setForm(p => ({ ...p, templateData: { ...p.templateData, [field]: e.target.value } }))}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={sending || !form.to || !form.templateId}
                                        className="btn-primary w-full"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {sending ? 'Sending...' : 'Send Email'}
                                    </button>
                                </form>
                            )}

                            {/* Custom Mode */}
                            {composeMode === 'custom' && (
                                <form onSubmit={handleSendCustom} className="space-y-5">
                                    <div>
                                        <label className="label">Recipient Email *</label>
                                        <input
                                            type="email"
                                            required
                                            list="user-emails-custom"
                                            className="input"
                                            placeholder="Enter or pick from team..."
                                            value={customForm.to}
                                            onChange={e => setCustomForm(p => ({ ...p, to: e.target.value }))}
                                        />
                                        <datalist id="user-emails-custom">
                                            {users.map(u => <option key={u._id} value={u.email}>{u.name}</option>)}
                                        </datalist>
                                    </div>

                                    <div>
                                        <label className="label">Subject *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input"
                                            placeholder="Email subject..."
                                            value={customForm.subject}
                                            onChange={e => setCustomForm(p => ({ ...p, subject: e.target.value }))}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="label mb-0">Message Body *</label>
                                            <button
                                                type="button"
                                                onClick={() => { setAiDraftTarget('custom'); setShowAiDraft(true); }}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
                                            >
                                                <Sparkles className="w-3 h-3" /> Magic Write
                                            </button>
                                        </div>
                                        <textarea
                                            required
                                            rows={8}
                                            className="input resize-none font-mono text-sm"
                                            placeholder="Write your email body here... HTML is supported."
                                            value={customForm.body}
                                            onChange={e => setCustomForm(p => ({ ...p, body: e.target.value }))}
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Tip: HTML tags like &lt;b&gt;, &lt;p&gt;, &lt;a href&gt; are supported.</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending || !customForm.to || !customForm.subject || !customForm.body}
                                        className="btn-primary w-full"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        {sending ? 'Sending...' : 'Send Email'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── BULK SEND TAB ─────────────────────────────────────────────────── */}
            {activeTab === 'bulk' && (
                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Bulk Email Warning</p>
                            <p className="text-xs text-amber-700 mt-0.5">This will send the email to ALL active users in the selected role. Use with care.</p>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-gray-900">Bulk Email Campaign</h2>
                                <p className="text-xs text-gray-500">Send to all users by role at once</p>
                            </div>
                        </div>

                        <div className="card-body">
                            <form onSubmit={handleSendBulk} className="space-y-5">
                                <div>
                                    <label className="label">Target Audience *</label>
                                    <select className="select" value={bulkForm.role} onChange={e => setBulkForm(p => ({ ...p, role: e.target.value }))}>
                                        <option value="all">🌐 All Active Users ({users.length})</option>
                                        {['admin', 'manager', 'hr', 'employee', 'client'].map(r => (
                                            <option key={r} value={r}>
                                                {r.charAt(0).toUpperCase() + r.slice(1)} ({users.filter(u => u.role === r).length} users)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Subject *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input"
                                        placeholder="Email subject..."
                                        value={bulkForm.subject}
                                        onChange={e => setBulkForm(p => ({ ...p, subject: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="label mb-0">Message Content *</label>
                                        <button
                                            type="button"
                                            onClick={() => { setAiDraftTarget('bulk'); setShowAiDraft(true); }}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
                                        >
                                            <Sparkles className="w-3 h-3" /> Magic Write
                                        </button>
                                    </div>
                                    <textarea
                                        required
                                        rows={6}
                                        className="input resize-none"
                                        placeholder="Type your bulk message here..."
                                        value={bulkForm.message}
                                        onChange={e => setBulkForm(p => ({ ...p, message: e.target.value }))}
                                    />
                                </div>

                                {bulkResult && (
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                        <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Bulk Send Complete
                                        </p>
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-emerald-700">{bulkResult.sent}</p>
                                                <p className="text-xs text-emerald-600">Sent</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-rose-600">{bulkResult.failed}</p>
                                                <p className="text-xs text-rose-500">Failed</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-gray-700">{bulkResult.total}</p>
                                                <p className="text-xs text-gray-500">Total</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={sendingBulk || !bulkForm.subject || !bulkForm.message}
                                    className="btn-primary w-full"
                                >
                                    {sendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {sendingBulk ? 'Sending to All...' : 'Send Bulk Email'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Preview Modal ─────────────────────────────────────────────────── */}
            {previewLog && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewLog(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Email Details</h3>
                            <button onClick={() => setPreviewLog(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
                        </div>
                        <div className="space-y-3 text-sm">
                            {[
                                { label: 'To', value: previewLog.to },
                                { label: 'Subject', value: previewLog.subject },
                                { label: 'Template', value: previewLog.templateName },
                                { label: 'Sent By', value: previewLog.sentBy?.name || 'System Auto' },
                                { label: 'Status', value: previewLog.status },
                                { label: 'Date', value: format(new Date(previewLog.createdAt), 'PPpp') },
                            ].map(row => (
                                <div key={row.label} className="flex gap-3">
                                    <span className="w-20 text-gray-400 flex-shrink-0">{row.label}</span>
                                    <span className="text-gray-800 font-medium">{row.value}</span>
                                </div>
                            ))}
                            {previewLog.errorMessage && (
                                <div className="mt-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                                    <p className="text-xs font-bold text-rose-600 mb-1">Error Message</p>
                                    <p className="text-xs text-rose-700 font-mono">{previewLog.errorMessage}</p>
                                </div>
                            )}
                        </div>
                        {previewLog.status === 'failed' && (
                            <button
                                onClick={() => { handleRetry(previewLog._id); setPreviewLog(null); }}
                                className="btn-primary mt-4 w-full"
                            >
                                <RefreshCw className="w-4 h-4" /> Retry Email
                            </button>
                        )}
                    </div>
                </div>
            )}

            {showAiDraft && (
                <AIEmailDraftModal
                    onClose={() => setShowAiDraft(false)}
                    onApply={(draft) => {
                        if (aiDraftTarget === 'custom') {
                            setCustomForm(p => ({ ...p, body: draft }));
                        } else {
                            setBulkForm(p => ({ ...p, message: draft }));
                        }
                        setShowAiDraft(false);
                    }}
                    recipientName={aiDraftTarget === 'custom' ? customForm.to : `Role: ${bulkForm.role}`}
                />
            )}
        </div>
    );
}
