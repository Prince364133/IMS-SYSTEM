'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Mail, History, Send, Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function EmailManagementPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'history' | 'compose'>('history');

    // History state
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Compose state
    const [templates, setTemplates] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({
        to: '',
        templateId: '',
        templateData: {} as Record<string, string>
    });

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'hr')) {
            fetchLogs();
            fetchTemplates();
            fetchUsers();
        }
    }, [user]);

    async function fetchLogs() {
        try {
            setLoadingLogs(true);
            const res = await api.get('/api/emails/logs');
            setLogs(res.data.logs || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoadingLogs(false);
        }
    }

    async function fetchTemplates() {
        try {
            const res = await api.get('/api/emails/templates');
            setTemplates(res.data.templates || []);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        }
    }

    async function fetchUsers() {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data.users || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/api/emails/send', form);
            toast.success('Email sent successfully');
            setForm({ to: '', templateId: '', templateData: {} });
            setActiveTab('history');
            fetchLogs();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to send email');
        } finally {
            setSending(false);
        }
    }

    const filteredLogs = logs.filter(log =>
        log.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.templateName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedTemplate = templates.find(t => t.id === form.templateId);

    if (!user || !['admin', 'hr'].includes(user.role)) {
        return <div className="p-8 text-center text-gray-500">Access Denied. HR or Admin privileges required.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Review email history and send manual communications via templates.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('history')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'history' ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    <History className="w-4 h-4" /> History
                </button>
                <button
                    onClick={() => setActiveTab('compose')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'compose' ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    <Send className="w-4 h-4" /> Compose Template Email
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email, subject, or template..."
                            className="bg-transparent border-none focus:ring-0 flex-1 text-sm outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {loadingLogs ? (
                        <div className="flex items-center justify-center p-12 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Recipient</th>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4">Template</th>
                                        <th className="px-6 py-4">Sent By</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredLogs.map(log => (
                                        <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{log.to}</td>
                                            <td className="px-6 py-4 text-gray-600">{log.subject}</td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {log.templateName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {log.sentBy?.name || 'System Auto'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.status === 'sent' ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Sent
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-rose-600 text-xs font-medium bg-rose-50 px-2 py-1 rounded-full w-fit" title={log.errorMessage}>
                                                        <XCircle className="w-3.5 h-3.5" /> Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No email logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'compose' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl mx-auto">
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-4">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Send Template Email</h2>
                        <p className="text-sm text-gray-500">Select a pre-defined template and fill in the required details.</p>
                    </div>

                    <form onSubmit={handleSend} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Recipient *</label>
                            <input
                                type="email"
                                required
                                list="user-emails"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                placeholder="Enter email address..."
                                value={form.to}
                                onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                            />
                            <datalist id="user-emails">
                                {users.map(u => (
                                    <option key={u._id} value={u.email}>{u.name} ({u.role})</option>
                                ))}
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Template *</label>
                            <select
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                value={form.templateId}
                                onChange={e => setForm(p => ({ ...p, templateId: e.target.value, templateData: {} }))}
                            >
                                <option value="">Select a template...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            {selectedTemplate && (
                                <p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
                            )}
                        </div>

                        {selectedTemplate && selectedTemplate.fields.length > 0 && (
                            <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Template Fields</h3>
                                {selectedTemplate.fields.map((field: string) => (
                                    <div key={field} className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-600 capitalize">
                                            {field.replace(/([A-Z])/g, ' $1').trim()} *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all bg-white"
                                            value={form.templateData[field] || ''}
                                            onChange={e => setForm(p => ({
                                                ...p,
                                                templateData: { ...p.templateData, [field]: e.target.value }
                                            }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={sending || !form.to || !form.templateId}
                                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Email
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
