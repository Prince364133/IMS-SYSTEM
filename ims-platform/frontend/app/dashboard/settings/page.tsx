'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { useSettings } from '../../../lib/settings-context';
import {
    Settings as SettingsIcon, User, Bell, Shield, Globe, Loader2, Palette,
    Users, FileText, Key, ChevronDown, Check, ClipboardList, Save, Eye, EyeOff,
    Mail, Activity, Server, ShieldCheck, ShieldAlert, Brain, Cpu, Zap, Info, ExternalLink, BookOpen, FolderKanban, Building2, Database
} from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import CompanyTab from '@/components/settings/CompanyTab';

type Tab = 'profile' | 'company' | 'branding' | 'security' | 'roles' | 'audit' | 'webhooks' | 'email' | 'ai' | 'storage' | 'documentation' | 'database';

const TABS: { key: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'company', label: 'Company Info', icon: Building2, adminOnly: true },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'branding', label: 'Branding', icon: Palette, adminOnly: true },
    { key: 'roles', label: 'Role Management', icon: Key, adminOnly: true },
    { key: 'audit', label: 'Audit Log', icon: ClipboardList, adminOnly: true },
    { key: 'webhooks', label: 'Webhooks', icon: Globe, adminOnly: true },
    { key: 'email', label: 'Email Automation', icon: Mail, adminOnly: true },
    { key: 'ai', label: 'AI Configuration', icon: Brain, adminOnly: true },
    { key: 'storage', label: 'Storage & Drive', icon: Server, adminOnly: true },
    { key: 'documentation', label: 'Documentation', icon: BookOpen },
    { key: 'database', label: 'Database', icon: Database, adminOnly: true },
];

const ROLES = ['admin', 'manager', 'hr', 'employee', 'client'];
const ROLE_COLORS: Record<string, string> = {
    admin: 'badge-red',
    manager: 'badge-purple',
    hr: 'badge-blue',
    employee: 'badge-green',
};

function InfoLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 font-medium ml-2 transition-colors cursor-pointer"
        >
            <Info className="w-3 h-3" />
            <span>{label}</span>
        </a>
    );
}

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

    // Email Settings State
    const [smtpHost, setSmtpHost] = useState(settings?.smtpHost || '');
    const [smtpPort, setSmtpPort] = useState(settings?.smtpPort || 587);
    const [smtpUser, setSmtpUser] = useState(settings?.smtpUser || '');
    const [smtpPass, setSmtpPass] = useState(settings?.smtpPass || '');
    const [smtpSecure, setSmtpSecure] = useState(settings?.smtpSecure || false);
    const [emailFrom, setEmailFrom] = useState(settings?.emailFrom || '');
    const [testingEmail, setTestingEmail] = useState(false);
    const [testStatus, setTestStatus] = useState<'success' | 'failure' | 'none'>(settings?.lastEmailTestStatus || 'none');

    // AI Settings State
    const [aiProvider, setAiProvider] = useState<'none' | 'openai' | 'groq' | 'gemini'>(settings?.aiProvider || 'none');
    const [openaiKey, setOpenaiKey] = useState(settings?.openaiKey || '');
    const [groqKey, setGroqKey] = useState(settings?.groqKey || '');
    const [geminiKey, setGeminiKey] = useState(settings?.geminiKey || '');
    const [testingAi, setTestingAi] = useState(false);
    const [aiTestStatus, setAiTestStatus] = useState<'success' | 'failure' | 'none'>(settings?.lastAiTestStatus || 'none');

    // Storage Settings State
    const [storageMode, setStorageMode] = useState<'cloudinary' | 'google_drive' | 'local'>(settings?.storageMode || 'cloudinary');
    const [googleDriveServiceAccount, setGoogleDriveServiceAccount] = useState(settings?.googleDriveServiceAccount || '');
    const [googleDriveFolderId, setGoogleDriveFolderId] = useState(settings?.googleDriveFolderId || '');
    const [cloudinaryCloudName, setCloudinaryCloudName] = useState(settings?.cloudinaryCloudName || '');
    const [cloudinaryApiKey, setCloudinaryApiKey] = useState(settings?.cloudinaryApiKey || '');
    const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState(settings?.cloudinaryApiSecret || '');
    const [testingStorage, setTestingStorage] = useState(false);
    const [storageTestStatus, setStorageTestStatus] = useState<'success' | 'failure' | 'none'>(settings?.lastStorageTestStatus || 'none');

    // Data Management State
    const [clearAll, setClearAll] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [adminPass, setAdminPass] = useState('');
    const [isClearing, setIsClearing] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);

    useEffect(() => {
        if (settings) {
            setCompanyName(settings.companyName || '');
            setLogoUrl(settings.logoUrl || '');
            setThemeColor(settings.themeColor || '#cf1d29');
            setWebhookUrl(settings.webhookUrl || '');
            setWebhookSecret(settings.webhookSecret || '');

            // Sync Email Settings
            setSmtpHost(settings.smtpHost || '');
            setSmtpPort(settings.smtpPort || 587);
            setSmtpUser(settings.smtpUser || '');
            setSmtpPass(settings.smtpPass || '');
            setSmtpSecure(settings.smtpSecure || false);
            setEmailFrom(settings.emailFrom || '');
            setTestStatus(settings.lastEmailTestStatus || 'none');

            // Sync AI Settings
            setAiProvider(settings.aiProvider || 'none');
            setOpenaiKey(settings.openaiKey || '');
            setGroqKey(settings.groqKey || '');
            setGeminiKey(settings.geminiKey || '');
            setAiTestStatus(settings.lastAiTestStatus || 'none');

            // Sync Storage Settings
            setStorageMode(settings.storageMode || 'cloudinary');
            setGoogleDriveServiceAccount(settings.googleDriveServiceAccount || '');
            setGoogleDriveFolderId(settings.googleDriveFolderId || '');
            setCloudinaryCloudName(settings.cloudinaryCloudName || '');
            setCloudinaryApiKey(settings.cloudinaryApiKey || '');
            setCloudinaryApiSecret(settings.cloudinaryApiSecret || '');
            setStorageTestStatus(settings.lastStorageTestStatus || 'none');
        }
    }, [settings]);

    const saveGlobalSettings = async () => {
        setSavingGlobal(true);
        try {
            await api.put('/api/settings', {
                companyName, logoUrl, themeColor,
                webhookUrl, webhookSecret,
                smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom,
                aiProvider, openaiKey, groqKey, geminiKey,
                storageMode, googleDriveServiceAccount, googleDriveFolderId,
                cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret
            });
            await refreshSettings();
            toast.success('Settings updated');
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to update global settings');
        } finally { setSavingGlobal(false); }
    };

    const testStorageConnection = async () => {
        setTestingStorage(true);
        try {
            // First save
            await api.put('/api/settings', {
                storageMode, googleDriveServiceAccount, googleDriveFolderId,
                cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret
            });

            const { data } = await api.post('/api/settings/test-storage');
            setStorageTestStatus('success');
            toast.success(data.message || 'Storage connection verified!');
            await refreshSettings();
        } catch (e: any) {
            setStorageTestStatus('failure');
            toast.error(e?.response?.data?.error || e?.response?.data?.details || 'Storage test failed');
        } finally {
            setTestingStorage(false);
        }
    };

    const testEmailConnection = async () => {
        setTestingEmail(true);
        try {
            // First save the current settings to ensure we test what's on screen
            await api.put('/api/settings', {
                smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom
            });

            const { data } = await api.post('/api/settings/test-email');
            setTestStatus('success');
            toast.success(data.message || 'Test email sent!');
            await refreshSettings();
        } catch (e: any) {
            setTestStatus('failure');
            toast.error(e?.response?.data?.error || e?.response?.data?.details || 'Connection test failed');
        } finally {
            setTestingEmail(false);
        }
    };

    const testAiConnection = async () => {
        setTestingAi(true);
        try {
            // First save
            await api.put('/api/settings', {
                aiProvider, openaiKey, groqKey, geminiKey
            });

            const { data } = await api.post('/api/settings/test-ai');
            setAiTestStatus('success');
            toast.success(data.message || 'AI Connection verified!');
            await refreshSettings();
        } catch (e: any) {
            setAiTestStatus('failure');
            toast.error(e?.response?.data?.error || e?.response?.data?.details || 'AI Connection test failed');
        } finally {
            setTestingAi(false);
        }
    };

    const handleClearData = async () => {
        if (!adminPass) return toast.error('Admin password is required');
        setIsClearing(true);
        try {
            const { data } = await api.post('/api/settings/clear-data', {
                password: adminPass,
                startDate,
                endDate,
                clearAll
            });
            toast.success(data.message || 'Data cleared successfully');
            setShowClearModal(false);
            setAdminPass('');
        } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Failed to clear data');
        } finally {
            setIsClearing(false);
        }
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
        <div className="max-w-6xl mx-auto">
            <div className="page-header mb-8">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage your account, team, and platform preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row-reverse gap-8 items-start">
                {/* Sidebar - Right Side Column */}
                <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24">
                    <div className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-2">System Preferences</p>
                        <nav className="flex flex-col gap-0.5">
                            {visibleTabs.map(t => {
                                const Icon = t.icon;
                                const isActive = tab === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => setTab(t.key)}
                                        className={clsx(
                                            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left group',
                                            isActive
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                        )}
                                    >
                                        <Icon className={clsx("w-4 h-4 transition-colors", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                        <h4 className="text-xs font-bold text-indigo-900 mb-1">Need help?</h4>
                        <p className="text-[10px] text-indigo-700 leading-relaxed mb-3">Check out our documentation for detailed guides on system configuration.</p>
                        <button onClick={() => setTab('documentation')} className="text-[10px] font-bold text-indigo-600 hover:underline">View Documentation →</button>
                    </div>
                </aside>

                {/* Main Content Area - Left Side */}
                <div className="flex-1 min-w-0 w-full">

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

                    {/* ── Company Tab (Admin) ── */}
                    {tab === 'company' && user?.role === 'admin' && <CompanyTab />}

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
                                        <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Internal Management System" className="input bg-white" />
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
                                        <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/ims" className="input bg-white" />
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

                    {/* ── Email Tab (Admin) ── */}
                    {tab === 'email' && user?.role === 'admin' && (
                        <div className="max-w-xl">
                            <div className="card">
                                <div className="card-header flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-indigo-600" />
                                        <h2 className="font-semibold text-gray-900">Email Automation (SMTP)</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {testStatus === 'success' && (
                                            <span className="badge badge-green flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> Connected
                                            </span>
                                        )}
                                        {testStatus === 'failure' && (
                                            <span className="badge badge-red flex items-center gap-1 text-[10px]">
                                                <ShieldAlert className="w-3 h-3" /> Connection Failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="card-body space-y-4">
                                    <p className="text-xs text-gray-500 mb-4">
                                        Configure your SMTP server to enable automated salary slips, welcome emails, and system alerts.
                                    </p>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <label className="label">SMTP Host</label>
                                            <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" className="input bg-white" />
                                        </div>
                                        <div>
                                            <label className="label">Port</label>
                                            <input type="number" value={smtpPort} onChange={e => setSmtpPort(parseInt(e.target.value))} placeholder="587" className="input bg-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">SMTP Username (Email)</label>
                                        <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" className="input bg-white" />
                                    </div>

                                    <div>
                                        <label className="label">
                                            SMTP Password / App Password
                                            <InfoLink href="https://myaccount.google.com/apppasswords" label="Create App Password" />
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPw ? 'text' : 'password'}
                                                value={smtpPass}
                                                onChange={e => setSmtpPass(e.target.value)}
                                                placeholder="••••••••••••"
                                                className="input bg-white pr-10"
                                            />
                                            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-indigo-500 mt-1.5 font-medium flex items-start gap-1">
                                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span>Google users: You <b>must</b> create an "App Password" to allow this system to send emails on your behalf. Standard passwords will be blocked.</span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="label">"From" Email Address</label>
                                        <input value={emailFrom} onChange={e => setEmailFrom(e.target.value)} placeholder="noreply@example.com" className="input bg-white" />
                                    </div>

                                    <div className="flex items-center gap-2 py-2">
                                        <input
                                            type="checkbox"
                                            id="smtpSecure"
                                            checked={smtpSecure}
                                            onChange={e => setSmtpSecure(e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor="smtpSecure" className="text-sm font-medium text-gray-700 cursor-pointer">Use SSL/TLS (Secure Connection)</label>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button onClick={saveGlobalSettings} disabled={savingGlobal} className="btn-primary flex-1">
                                            {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {savingGlobal ? 'Saving...' : 'Save Settings'}
                                        </button>
                                        <button
                                            onClick={testEmailConnection}
                                            disabled={testingEmail || !smtpHost || !smtpUser || !smtpPass}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm font-medium transition-all",
                                                testStatus === 'success' ? "border-green-200 bg-green-50 text-green-700 font-bold" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                            )}
                                        >
                                            {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                            {testingEmail ? 'Testing...' : 'Connect & Test'}
                                        </button>
                                    </div>

                                    {settings?.lastEmailTestDate && (
                                        <p className="text-[10px] text-gray-400 text-center">
                                            Last tested: {new Date(settings.lastEmailTestDate).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── AI Tab (Admin) ── */}
                    {tab === 'ai' && user?.role === 'admin' && (
                        <div className="max-w-xl">
                            <div className="card">
                                <div className="card-header flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-purple-600" />
                                        <h2 className="font-semibold text-gray-900">AI Logic Configuration</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {aiTestStatus === 'success' && (
                                            <span className="badge badge-green flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> Connected
                                            </span>
                                        )}
                                        {aiTestStatus === 'failure' && (
                                            <span className="badge badge-red flex items-center gap-1 text-[10px]">
                                                <ShieldAlert className="w-3 h-3" /> Connection Failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="card-body space-y-4">
                                    <p className="text-xs text-gray-500 mb-4">
                                        Select your preferred AI model to power dashboard insights, project risk analysis, and automated reporting.
                                    </p>

                                    <div>
                                        <label className="label">Active AI Provider</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {[
                                                { id: 'none', label: 'Disabled', icon: Cpu },
                                                { id: 'gemini', label: 'Google Gemini', icon: Zap },
                                                { id: 'openai', label: 'OpenAI (GPT)', icon: Brain },
                                                { id: 'groq', label: 'Groq (Llama3)', icon: Cpu },
                                            ].map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setAiProvider(p.id as any)}
                                                    className={clsx(
                                                        "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all gap-2",
                                                        aiProvider === p.id
                                                            ? "border-purple-600 bg-purple-50 text-purple-600 ring-2 ring-purple-100"
                                                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                    )}
                                                >
                                                    <p.icon className="w-4 h-4" />
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {aiProvider === 'gemini' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="label">
                                                Google Gemini API Key
                                                <InfoLink href="https://aistudio.google.com/app/apikey" label="Get Gemini Key" />
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPw ? 'text' : 'password'}
                                                    value={geminiKey}
                                                    onChange={e => setGeminiKey(e.target.value)}
                                                    placeholder="Enter your Gemini API Key..."
                                                    className="input bg-white pr-10"
                                                />
                                                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                <Zap className="w-3 h-3" /> Recommend using <b>gemini-1.5-flash</b> for cost and speed. Create a project in AI Studio to get started.
                                            </p>
                                        </div>
                                    )}

                                    {aiProvider === 'openai' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="label">
                                                OpenAI API Key
                                                <InfoLink href="https://platform.openai.com/api-keys" label="Get OpenAI Key" />
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPw ? 'text' : 'password'}
                                                    value={openaiKey}
                                                    onChange={e => setOpenaiKey(e.target.value)}
                                                    placeholder="sk-..."
                                                    className="input bg-white pr-10"
                                                />
                                                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                Ensure your OpenAI account has credits available ($5 minimum recommended) to avoid 429 quota errors.
                                            </p>
                                        </div>
                                    )}

                                    {aiProvider === 'groq' && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="label">
                                                Groq API Key
                                                <InfoLink href="https://console.groq.com/keys" label="Get Groq Key" />
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPw ? 'text' : 'password'}
                                                    value={groqKey}
                                                    onChange={e => setGroqKey(e.target.value)}
                                                    placeholder="gsk_..."
                                                    className="input bg-white pr-10"
                                                />
                                                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                <Cpu className="w-3 h-3" /> Using <b>llama3-8b-8192</b> for lightning fast generation. Groq keys are free for developer usage.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-3">
                                        <button onClick={saveGlobalSettings} disabled={savingGlobal} className="btn-primary flex-1">
                                            {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {savingGlobal ? 'Saving...' : 'Save Settings'}
                                        </button>
                                        <button
                                            onClick={testAiConnection}
                                            disabled={testingAi || aiProvider === 'none'}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm font-medium transition-all",
                                                aiTestStatus === 'success' ? "border-green-200 bg-green-50 text-green-700 font-bold" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                            )}
                                        >
                                            {testingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                            {testingAi ? 'Validating...' : 'Connect & Test'}
                                        </button>
                                    </div>

                                    {settings?.lastAiTestDate && (
                                        <p className="text-[10px] text-gray-400 text-center">
                                            Last tested: {new Date(settings.lastAiTestDate).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Database Tab (Admin) ── */}
                    {tab === 'database' && user?.role === 'admin' && (
                        <div className="max-w-xl">
                            <div className="card">
                                <div className="card-header flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Database className="w-4 h-4 text-emerald-600" />
                                        <h2 className="font-semibold text-gray-900">Database Configuration</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-green flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Connected
                                        </span>
                                    </div>
                                </div>
                                <div className="card-body space-y-5">
                                    <p className="text-xs text-gray-500">
                                        This system is connected to a live MongoDB Atlas instance. Only admins can view this connection logic.
                                    </p>
                                    <div>
                                        <label className="label">
                                            Current MongoDB URI
                                            <InfoLink href="https://www.mongodb.com/cloud/atlas" label="MongoDB Atlas Console" />
                                        </label>
                                        <input
                                            value={settings?.mongoUriDisplay || 'mongodb://...'}
                                            disabled
                                            className="input bg-gray-50 text-gray-500 font-mono text-xs cursor-not-allowed text-center"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            The password is automatically obscured for security. To update this URI, you must edit the <code className="bg-gray-100 px-1 rounded">.env</code> file directly on the hosting server.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card border-red-100 bg-red-50/30 mt-6">
                                <div className="card-header flex items-center gap-2 border-red-100">
                                    <ShieldAlert className="w-4 h-4 text-red-600" />
                                    <h2 className="font-semibold text-red-900">Bulk Data Management</h2>
                                </div>
                                <div className="card-body space-y-4">
                                    <div className="p-3 bg-white border border-red-100 rounded-xl">
                                        <p className="text-xs text-red-700 font-medium mb-2 flex items-center gap-1">
                                            <Info className="w-3 h-3 flex-shrink-0" />
                                            Irreversible Action
                                        </p>
                                        <p className="text-[10px] text-red-600 leading-relaxed">
                                            Clearing data will permanently delete all transactional records (Attendance, Tasks, Projects, Expenses, etc.)
                                            within the selected range. This action <b>cannot be undone</b>. Admin accounts and system settings will remain safe.
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="clearRange"
                                                    checked={clearAll}
                                                    onChange={() => setClearAll(true)}
                                                    className="radio radio-red" />
                                                <span className="text-sm font-medium text-gray-700">Delete All Data</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="clearRange"
                                                    checked={!clearAll}
                                                    onChange={() => setClearAll(false)}
                                                    className="radio radio-red" />
                                                <span className="text-sm font-medium text-gray-700">Date Range</span>
                                            </label>
                                        </div>

                                        {!clearAll && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 px-1">
                                                <div>
                                                    <label className="label !text-[10px] !mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={e => setStartDate(e.target.value)}
                                                        className="input py-1.5 text-xs bg-white" />
                                                </div>
                                                <div>
                                                    <label className="label !text-[10px] !mb-1">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={e => setEndDate(e.target.value)}
                                                        className="input py-1.5 text-xs bg-white" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setShowClearModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                                    >
                                        <Activity className="w-4 h-4" />
                                        Clear Systems Data
                                    </button>
                                </div>
                            </div>

                            {/* Clear Data Confirmation Modal */}
                            {showClearModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                                        <div className="p-6 space-y-4">
                                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-2">
                                                <ShieldAlert className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-lg font-bold text-gray-900">Confirm Irreversible Deletion</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    You are about to delete {clearAll ? 'all system data' : `data between ${startDate} and ${endDate}`}.
                                                    Please enter your administrator password to proceed.
                                                </p>
                                            </div>

                                            <div className="space-y-3 pt-2">
                                                <div>
                                                    <label className="label">Admin Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPw ? 'text' : 'password'}
                                                            value={adminPass}
                                                            onChange={e => setAdminPass(e.target.value)}
                                                            placeholder="Enter password..."
                                                            className="input pr-10"
                                                        />
                                                        <button
                                                            onClick={() => setShowPw(!showPw)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                        >
                                                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    onClick={() => { setShowClearModal(false); setAdminPass(''); }}
                                                    disabled={isClearing}
                                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleClearData}
                                                    disabled={isClearing || !adminPass}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    Confirm Deletion
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Storage Tab (Admin) ── */}
                    {
                        tab === 'storage' && user?.role === 'admin' && (
                            <div className="max-w-xl">
                                <div className="card">
                                    <div className="card-header flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Server className="w-4 h-4 text-blue-600" />
                                            <h2 className="font-semibold text-gray-900">Storage Configuration</h2>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {storageTestStatus === 'success' && (
                                                <span className="badge badge-green flex items-center gap-1">
                                                    <ShieldCheck className="w-3 h-3" /> Configured
                                                </span>
                                            )}
                                            {storageTestStatus === 'failure' && (
                                                <span className="badge badge-red flex items-center gap-1 text-[10px]">
                                                    <ShieldAlert className="w-3 h-3" /> Error
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-body space-y-5">
                                        <p className="text-xs text-gray-500">
                                            Choose where to store project files, employee documents, and generated reports.
                                            <b> Google Drive</b> is recommended for high-volume storage.
                                        </p>

                                        <div>
                                            <label className="label">Storage Mode</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: 'cloudinary', label: 'Cloudinary', desc: 'Fast, image optimized', icon: Palette },
                                                    { id: 'google_drive', label: 'Google Drive', desc: 'Secure cloud drive', icon: Globe },
                                                ].map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => setStorageMode(m.id as any)}
                                                        className={clsx(
                                                            "flex flex-col items-start p-4 rounded-xl border text-left transition-all gap-2",
                                                            storageMode === m.id
                                                                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                                                                : "border-gray-100 bg-white hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <m.icon className={clsx("w-4 h-4", storageMode === m.id ? "text-blue-600" : "text-gray-400")} />
                                                            <span className={clsx("font-semibold text-sm", storageMode === m.id ? "text-blue-900" : "text-gray-700")}>{m.label}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 leading-tight">{m.desc}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {storageMode === 'google_drive' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className="label">
                                                        Google Service Account (JSON)
                                                        <InfoLink href="https://console.cloud.google.com/iam-admin/serviceaccounts" label="IAM Console" />
                                                    </label>
                                                    <textarea
                                                        value={googleDriveServiceAccount}
                                                        onChange={e => setGoogleDriveServiceAccount(e.target.value)}
                                                        placeholder='{ "type": "service_account", ... }'
                                                        className="input font-mono text-[10px] h-32 py-3 bg-white"
                                                    />
                                                    <p className="text-[10px] text-gray-500 mt-1 flex items-start gap-1">
                                                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-indigo-500" />
                                                        <span>
                                                            Instructions: 1. Create a Project in Google Cloud. 2. Create a <b>Service Account</b>.
                                                            3. Download JSON key. 4. Enable Google Drive API.
                                                            5. Share your Root Folder with the Service Account email.
                                                        </span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="label">Root Folder ID (Optional)</label>
                                                    <input
                                                        value={googleDriveFolderId}
                                                        onChange={e => setGoogleDriveFolderId(e.target.value)}
                                                        placeholder="1A2B3C4D..."
                                                        className="input bg-white"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1">The ID of the folder where uploads will be stored.</p>
                                                </div>
                                            </div>
                                        )}

                                        {storageMode === 'cloudinary' && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className="label">
                                                        Cloudinary Cloud Name
                                                        <InfoLink href="https://console.cloudinary.com/console/settings/account" label="Cloudinary Console" />
                                                    </label>
                                                    <input
                                                        value={cloudinaryCloudName}
                                                        onChange={e => setCloudinaryCloudName(e.target.value)}
                                                        placeholder="e.g. dxyz123abc"
                                                        className="input bg-white"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">API Key</label>
                                                        <input
                                                            value={cloudinaryApiKey}
                                                            onChange={e => setCloudinaryApiKey(e.target.value)}
                                                            placeholder="1234567890..."
                                                            className="input bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="label">API Secret</label>
                                                        <div className="relative">
                                                            <input
                                                                type={showPw ? 'text' : 'password'}
                                                                value={cloudinaryApiSecret}
                                                                onChange={e => setCloudinaryApiSecret(e.target.value)}
                                                                placeholder="••••••••••••"
                                                                className="input bg-white pr-10"
                                                            />
                                                            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex gap-3 animate-in fade-in duration-500">
                                                    <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-semibold text-indigo-900">How to get these credentials?</p>
                                                        <ol className="text-xs text-indigo-800 space-y-1.5 list-decimal list-inside opacity-90">
                                                            <li>Login to your <a href="https://console.cloudinary.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-indigo-600 inline-flex items-center gap-0.5" title="Open Cloudinary Console">Cloudinary Console <ExternalLink className="w-3 h-3" /></a></li>
                                                            <li>On the <b>Dashboard</b>, look for "Account Details".</li>
                                                            <li>Copy the <b>Cloud Name</b>, <b>API Key</b>, and <b>API Secret</b>.</li>
                                                            <li>Paste them above and click <b>Test Connection</b>.</li>
                                                        </ol>
                                                        <p className="text-[11px] text-indigo-600 pt-1 italic">
                                                            Tip: Use Cloudinary for profile pictures and company branding. Google Drive remains your primary storage for business documents.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 flex gap-3">
                                            <button onClick={saveGlobalSettings} disabled={savingGlobal} className="btn-primary flex-1">
                                                {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                {savingGlobal ? 'Saving...' : 'Save Storage Config'}
                                            </button>
                                            <button
                                                onClick={testStorageConnection}
                                                disabled={testingStorage || (storageMode === 'google_drive' && !googleDriveServiceAccount) || (storageMode === 'cloudinary' && !cloudinaryCloudName)}
                                                className={clsx(
                                                    "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-sm font-medium transition-all",
                                                    storageTestStatus === 'success' ? "border-green-200 bg-green-50 text-green-700 font-bold" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                                                )}
                                            >
                                                {testingStorage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                                {testingStorage ? 'Testing...' : 'Test Connection'}
                                            </button>
                                        </div>

                                        {settings?.lastStorageTestDate && (
                                            <p className="text-[10px] text-gray-400 text-center">
                                                Last tested: {new Date(settings.lastStorageTestDate).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* ── Documentation Tab ── */}
                    {
                        tab === 'documentation' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="text-center py-12 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm card">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">User Help Center</h3>
                                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                                        Learn how to use every feature of the IMS platform with our simple, step-by-step guides.
                                    </p>
                                    <div className="flex justify-center mt-8">
                                        <a
                                            href="/dashboard/docs"
                                            className="btn-primary inline-flex items-center gap-2 px-8"
                                        >
                                            Open Help Center
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 transition-colors cursor-pointer group card">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            Quick Start Guide
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">New to IMS? Read this first to get up and running in minutes.</p>
                                    </div>
                                    <div className="p-5 bg-white border border-gray-100 rounded-xl hover:border-indigo-100 transition-colors cursor-pointer group card">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <FolderKanban className="w-4 h-4 text-blue-500" />
                                            Project Tracking
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">Master project creation, tracking, and reporting.</p>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {tab === 'roles' && user?.role === 'admin' && <RolesTab />}

                    {/* ── Audit Log Tab (Admin) ── */}
                    {tab === 'audit' && user?.role === 'admin' && <AuditTab />}
                </div>
            </div>
        </div >
    );
}
