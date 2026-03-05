'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useSettings } from '../../../lib/settings-context';
import {
    Settings, User, Bell, Shield, Globe, Loader2, Palette,
    Users, FileText, Key, ChevronDown, Check, ClipboardList, Save, Eye, EyeOff
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'profile' | 'branding' | 'security' | 'roles' | 'audit' | 'webhooks';

const TABS: { key: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'branding', label: 'Branding', icon: Palette, adminOnly: true },
    { key: 'roles', label: 'Role Management', icon: Key, adminOnly: true },
    { key: 'audit', label: 'Audit Log', icon: ClipboardList, adminOnly: true },
    { key: 'webhooks', label: 'Webhooks', icon: Globe, adminOnly: true },
];

const ROLES = ['admin', 'manager', 'hr', 'employee', 'client'];
const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border-red-200',
    manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    hr: 'bg-purple-100 text-purple-700 border-purple-200',
    employee: 'bg-blue-100 text-blue-700 border-blue-200',
    client: 'bg-gray-100 text-gray-700 border-gray-200',
};

/* ── Role Management Tab ── */
function RolesTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        api.get('/api/users', { params: { limit: 200 } })
            .then(({ data }) => setUsers(data.users || []))
            .finally(() => setLoading(false));
    }, []);

    async function changeRole(userId: string, newRole: string) {
        setUpdating(userId);
        try {
            await api.put(`/api/users/${userId}`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
            toast.success('Role updated');
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to update role');
        } finally { setUpdating(null); }
    }

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

    return (
        <div>
            <div className="mb-4 flex gap-3">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="input w-full max-w-xs"
                />
            </div>
            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Department</th>
                                <th>Current Role</th>
                                <th>Change Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-sm text-gray-500">{u.department || '—'}</td>
                                    <td>
                                        <span className={clsx('badge border text-xs capitalize', ROLE_COLORS[u.role] || 'badge-gray')}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1.5">
                                            <select
                                                defaultValue={u.role}
                                                onChange={e => changeRole(u._id, e.target.value)}
                                                disabled={updating === u._id}
                                                className="select text-xs py-1 w-32"
                                            >
                                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                            {updating === u._id && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* ── Audit Log Tab ── */
function AuditTab() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterAction, setFilterAction] = useState('');
    const [filterUser, setFilterUser] = useState('');

    function loadLogs() {
        setLoading(true);
        const params: any = { limit: 100 };
        if (filterAction) params.action = filterAction;
        if (filterUser) params.userId = filterUser;

        api.get('/api/audit', { params })
            .then(({ data }) => setLogs(data.logs || []))
            .catch(() => {
                // Fallback: use notifications as proxy
                api.get('/api/notifications?limit=100')
                    .then(({ data }) => setLogs(data.notifications || []))
                    .catch(() => setLogs([]));
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadLogs(); }, [filterAction, filterUser]);

    const ACTION_COLORS: Record<string, string> = {
        CREATE_TASK: 'badge-blue',
        UPDATE_TASK: 'badge-indigo',
        DELETE_TASK: 'badge-red',
        CREATE_PROJECT: 'badge-green',
        UPDATE_PROJECT: 'badge-indigo',
        LOGIN: 'badge-gray',
        CHANGE_ROLE: 'badge-orange',
        APPROVE_SALARY: 'badge-purple',
        task_assigned: 'badge-blue',
        salary: 'badge-purple',
        attendance: 'badge-orange',
        alert: 'badge-red',
    };

    if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>;

    return (
        <div>
            <div className="mb-4 flex gap-3 flex-wrap">
                <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="select w-48">
                    <option value="">All Actions</option>
                    <option value="LOGIN">Login</option>
                    <option value="CREATE_TASK">Create Task</option>
                    <option value="UPDATE_TASK">Update Task</option>
                    <option value="CREATE_PROJECT">Create Project</option>
                    <option value="CHANGE_ROLE">Change Role</option>
                    <option value="APPROVE_SALARY">Approve Salary</option>
                </select>
                <input
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    placeholder="Filter by User ID..."
                    className="input w-52 text-sm"
                />
            </div>

            {logs.length === 0 ? (
                <div className="text-center py-16">
                    <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No audit events yet</p>
                    <p className="text-gray-300 text-sm mt-1">Events appear as your team takes actions</p>
                </div>
            ) : (
                <div className="card divide-y divide-gray-50">
                    {logs.map((log: any) => {
                        const actionLabel = log.action || log.type || 'system';
                        const user = log.userId;
                        const when = log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : '';
                        return (
                            <div key={log._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs font-bold text-gray-500">
                                        {(user?.name || log.title || 'S')?.[0]?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {user?.name ? `${user.name} — ` : ''}{log.title || actionLabel.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {log.message || (log.details && JSON.stringify(log.details))}
                                            </p>
                                            {log.ipAddress && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">IP: {log.ipAddress}</p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className={clsx('badge text-xs', ACTION_COLORS[actionLabel] || 'badge-gray')}>
                                                {actionLabel.replace(/_/g, ' ')}
                                            </span>
                                            <p className="text-[10px] text-gray-400 mt-1">{when}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main Page ── */
export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const { settings, refreshSettings } = useSettings();
    const [tab, setTab] = useState<Tab>('profile');
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [companyName, setCompanyName] = useState(settings?.companyName || '');
    const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || '');
    const [themeColor, setThemeColor] = useState(settings?.themeColor || '#cf1d29');
    const [webhookUrl, setWebhookUrl] = useState(settings?.webhookUrl || '');
    const [webhookSecret, setWebhookSecret] = useState(settings?.webhookSecret || '');
    const [savingGlobal, setSavingGlobal] = useState(false);

    useEffect(() => {
        if (settings) {
            setCompanyName(settings.companyName || '');
            setLogoUrl(settings.logoUrl || '');
            setThemeColor(settings.themeColor || '#cf1d29');
            setWebhookUrl(settings.webhookUrl || '');
            setWebhookSecret(settings.webhookSecret || '');
        }
    }, [settings]);

    const saveGlobalSettings = async () => {
        setSavingGlobal(true);
        try {
            await api.put('/api/settings', { companyName, logoUrl, themeColor, webhookUrl, webhookSecret });
            await refreshSettings();
            toast.success('Global branding updated');
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to update global settings');
        } finally { setSavingGlobal(false); }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.put(`/api/users/${user?._id}`, { name });
            await refreshUser();
            toast.success('Profile updated');
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to update');
        } finally { setSaving(false); }
    };

    const changePassword = async () => {
        if (!currentPw || !newPw) return toast.error('Fill in all fields');
        if (newPw.length < 6) return toast.error('Password must be at least 6 characters');
        if (newPw !== confirmPw) return toast.error('New passwords do not match');
        setChangingPw(true);
        try {
            await api.put('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
            toast.success('Password updated successfully!');
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to change password');
        } finally { setChangingPw(false); }
    };

    const visibleTabs = TABS.filter(t => !t.adminOnly || user?.role === 'admin');

    return (
        <div className="max-w-4xl">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage your account, team, and platform preferences</p>
            </div>

            {/* Tab strip */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-max flex-wrap">
                {visibleTabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Profile Tab ── */}
            {tab === 'profile' && (
                <div className="space-y-4 max-w-lg">
                    <div className="card">
                        <div className="card-header flex items-center gap-2">
                            <User className="w-4 h-4 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900">Profile</h2>
                        </div>
                        <div className="card-body space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                    {user?.photoUrl
                                        ? <img src={user.photoUrl} className="w-full h-full rounded-xl object-cover" alt={user.name} />
                                        : <span className="text-white font-bold text-lg">{user?.name?.[0]?.toUpperCase()}</span>
                                    }
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{user?.name}</p>
                                    <span className={clsx('badge border text-xs capitalize mt-0.5', ROLE_COLORS[user?.role || ''] || 'badge-gray')}>{user?.role}</span>
                                </div>
                            </div>
                            <div>
                                <label className="label">Display Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="input" />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input value={user?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                                {[
                                    { label: 'Department', value: user?.department },
                                    { label: 'Position', value: user?.position },
                                    { label: 'Employee ID', value: user?.employeeId },
                                    { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                        <p className="font-medium text-gray-800">{value || '—'}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={saveProfile} disabled={saving} className="btn-primary">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Security Tab ── */}
            {tab === 'security' && (
                <div className="max-w-lg">
                    <div className="card">
                        <div className="card-header flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900">Change Password</h2>
                        </div>
                        <div className="card-body space-y-4">
                            <div>
                                <label className="label">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={currentPw}
                                        onChange={e => setCurrentPw(e.target.value)}
                                        placeholder="••••••••"
                                        className="input pr-10"
                                    />
                                    <button onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="label">New Password</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={newPw}
                                    onChange={e => setNewPw(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Confirm New Password</label>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    placeholder="Repeat new password"
                                    className={clsx('input', confirmPw && confirmPw !== newPw && 'border-red-300 focus:ring-red-200')}
                                />
                                {confirmPw && confirmPw !== newPw && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                            </div>
                            {/* Password strength */}
                            {newPw && (
                                <div>
                                    <div className="flex gap-1 mb-1">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className={clsx('h-1.5 flex-1 rounded-full', i < Math.min(4, Math.floor(newPw.length / 3)) ? (newPw.length >= 10 ? 'bg-green-500' : 'bg-orange-400') : 'bg-gray-200')} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {newPw.length < 6 ? 'Too short' : newPw.length < 9 ? 'Fair' : newPw.length < 12 ? 'Good' : 'Strong'}
                                    </p>
                                </div>
                            )}
                            <button onClick={changePassword} disabled={changingPw} className="btn-primary">
                                {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                {changingPw ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Branding Tab (Admin) ── */}
            {tab === 'branding' && user?.role === 'admin' && (
                <div className="max-w-lg">
                    <div className="card border-gray-200 bg-gray-50">
                        <div className="card-header flex items-center gap-2">
                            <Palette className="w-4 h-4 text-primary" />
                            <h2 className="font-semibold text-gray-900">Global Branding</h2>
                        </div>
                        <div className="card-body space-y-4">
                            <div>
                                <label className="label">Company Name</label>
                                <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Instaura IMS" className="input bg-white" />
                            </div>
                            <div>
                                <label className="label">Logo URL</label>
                                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="input bg-white" />
                                {logoUrl && <img src={logoUrl} alt="logo preview" className="w-12 h-12 mt-2 rounded-lg object-contain border border-gray-200 bg-white" />}
                            </div>
                            <div>
                                <label className="label">Theme Color</label>
                                <div className="flex gap-3">
                                    <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-10 h-10 p-1 rounded-lg border border-gray-200 cursor-pointer bg-white" />
                                    <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="input bg-white flex-1" placeholder="#cf1d29" />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {['#cf1d29', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'].map(c => (
                                        <button key={c} onClick={() => setThemeColor(c)} className={clsx('w-6 h-6 rounded-full border-2 transition-transform hover:scale-110', themeColor === c ? 'border-gray-800 scale-110' : 'border-transparent')} style={{ background: c }} />
                                    ))}
                                </div>
                            </div>
                            <button onClick={saveGlobalSettings} disabled={savingGlobal} className="btn-primary">
                                {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {savingGlobal ? 'Saving...' : 'Save Branding'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Webhooks Tab (Admin) ── */}
            {tab === 'webhooks' && user?.role === 'admin' && (
                <div className="max-w-lg">
                    <div className="card">
                        <div className="card-header flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-600" />
                            <h2 className="font-semibold text-gray-900">Outgoing Webhooks</h2>
                        </div>
                        <div className="card-body space-y-4">
                            <p className="text-sm text-gray-500 mb-4">
                                Configure your n8n (or other tool) webhook endpoint to receive all platform events (e.g. task creation, milestones).
                            </p>
                            <div>
                                <label className="label">Webhook URL</label>
                                <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/instaura" className="input bg-white" />
                            </div>
                            <div>
                                <label className="label">Webhook Secret (Optional)</label>
                                <input type="password" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)} placeholder="Will be sent as x-webhook-secret" className="input bg-white" />
                                <p className="text-xs text-gray-400 mt-1">Used to verify requests on your webhook receiver.</p>
                            </div>
                            <div className="pt-2">
                                <button onClick={saveGlobalSettings} disabled={savingGlobal} className="btn-primary">
                                    {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {savingGlobal ? 'Saving...' : 'Save Webhook Config'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Role Management Tab (Admin) ── */}
            {tab === 'roles' && user?.role === 'admin' && <RolesTab />}

            {/* ── Audit Log Tab (Admin) ── */}
            {tab === 'audit' && user?.role === 'admin' && <AuditTab />}
        </div>
    );
}
