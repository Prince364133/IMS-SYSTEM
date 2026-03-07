'use client';

import { useEffect, useState } from 'react';
import { Save, AlertTriangle, Loader2, User, Key, Server, Mail, Settings, Shield, Plus, Building2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';
import { useSuperAdmin } from '../../../lib/superadmin-context';

export default function SettingsPage() {
    const { superAdmin, fetchSuperAdmin } = useSuperAdmin();
    const [settings, setSettings] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    const [activeTab, setActiveTab] = useState('platform');

    useEffect(() => {
        if (superAdmin) {
            setProfileName(superAdmin.name || '');
            setProfileEmail(superAdmin.email || '');
        }
        saApi.get('/settings').then(({ data }) => {
            setSettings(data.settings);
            setForm(data.settings);
        }).finally(() => setLoading(false));
    }, [superAdmin]);

    // Save Platform Settings
    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await saApi.put('/settings', form);
            toast.success('Platform settings saved successfully');
        } catch {
            toast.error('Failed to save settings');
        }
        setSaving(false);
    };

    // Toggle Maintenance
    const toggleMaintenance = async () => {
        try {
            await saApi.post('/settings/toggle-maintenance');
            const { data } = await saApi.get('/settings');
            setForm(data.settings);
            toast.success(`Maintenance mode ${data.settings.maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
        } catch {
            toast.error('Failed to toggle maintenance mode');
        }
    };

    // Save Profile
    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await saApi.put('/auth/profile', { name: profileName, email: profileEmail });
            toast.success('Profile updated successfully');
            await fetchSuperAdmin();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to update profile');
        }
        setSavingProfile(false);
    };

    // Save Password
    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) return toast.error('Password must be at least 8 characters');
        if (!currentPassword) return toast.error('Current password is required');

        setSavingPassword(true);
        try {
            await saApi.put('/auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed safely');
            setCurrentPassword('');
            setNewPassword('');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to change password');
        }
        setSavingPassword(false);
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
    );

    const tabs = [
        { id: 'platform', label: 'Platform Configuration', icon: Settings },
        { id: 'smtp', label: 'Email & SMTP', icon: Mail },
        { id: 'profile', label: 'My Security & Profile', icon: Shield },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Toaster position="top-center" />

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h1>
                <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-[10px]">Master control suite for platform infrastructure and security</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-slate-100 pb-px mb-8">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-4 transition-all font-black text-[11px] uppercase tracking-[0.15em] border-b-2 ${activeTab === tab.id
                            ? 'border-sky-500 text-sky-600 bg-sky-50/50 rounded-t-2xl'
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-2xl'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Platform Settings Tab */}
            {activeTab === 'platform' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Maintenance Card */}
                    <div className={`rounded-[2.5rem] border-2 p-8 flex items-center justify-between gap-8 transition-all relative overflow-hidden ${form.maintenanceMode ? 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-100/50' : 'bg-white border-slate-100 shadow-xl shadow-slate-100/50'}`}>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 ${form.maintenanceMode ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Platform Maintenance</h3>
                                <p className="text-sm font-medium text-slate-500 mt-1 max-w-xl leading-relaxed">
                                    Broadcast restriction protocols. When enabled, all non-administrative traffic is intercepted and redirected to a maintenance portal.
                                </p>
                            </div>
                        </div>
                        <button type="button" onClick={toggleMaintenance}
                            className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex-shrink-0 relative z-10 ${form.maintenanceMode
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                                }`}>
                            {form.maintenanceMode ? 'Restore Systems' : 'Activate Blackout'}
                        </button>
                    </div>

                    <form onSubmit={saveSettings} className="bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 p-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500" />
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100"><Server className="w-6 h-6 text-sky-600" /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">General Parameters</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Core identity and registration logic</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Platform Identity</label>
                                <input type="text" value={form.platformName || ''} onChange={e => setForm({ ...form, platformName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Support Endpoint</label>
                                <input type="email" value={form.supportEmail || ''} onChange={e => setForm({ ...form, supportEmail: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Branding Asset URL</label>
                                <input type="text" value={form.logoUrl || ''} onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Standard Trial Duration</label>
                                <div className="relative">
                                    <input type="number" value={form.trialDays || 0} onChange={e => setForm({ ...form, trialDays: +e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all" />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">Days</span>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Maintenance Broadcast Message</label>
                                <textarea value={form.maintenanceMessage || ''} onChange={e => setForm({ ...form, maintenanceMessage: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all h-32 resize-none" />
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-slate-100">
                            <label className="flex items-center justify-between p-6 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 cursor-pointer hover:bg-sky-50/50 hover:border-sky-100 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                        <Building2 className={`w-6 h-6 ${form.allowSelfRegistration ? 'text-sky-600' : 'text-slate-300'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 tracking-tight uppercase">Public Inbound Pipeline</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest">Enable unauthorized organization discovery and registration</p>
                                    </div>
                                </div>
                                <div className="relative flex items-center">
                                    <input type="checkbox" checked={form.allowSelfRegistration ?? true}
                                        onChange={e => setForm({ ...form, allowSelfRegistration: e.target.checked })}
                                        className="peer sr-only" />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-sky-600"></div>
                                </div>
                            </label>
                        </div>

                        <div className="mt-10 flex justify-end relative z-10">
                            <button type="submit" disabled={saving}
                                className="px-10 py-4 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-sky-500/25 active:scale-95 flex items-center gap-3">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Commit Global State
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* SMTP configuration Tab */}
            {activeTab === 'smtp' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <form onSubmit={saveSettings} className="bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 p-10">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100"><Mail className="w-6 h-6 text-indigo-600" /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">SMTP Infrastructure</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Outgoing communication matrix</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Relay Host</label>
                                <input type="text" value={form.smtpHost || ''} onChange={e => setForm({ ...form, smtpHost: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Relay Port</label>
                                <input type="number" value={form.smtpPort || ''} onChange={e => setForm({ ...form, smtpPort: +e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Originator Identity</label>
                                <input type="email" value={form.smtpFrom || ''} onChange={e => setForm({ ...form, smtpFrom: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Authorization Username</label>
                                <input type="text" value={form.smtpUser || ''} onChange={e => setForm({ ...form, smtpUser: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Authorization Secret</label>
                                <input type="password" value={form.smtpPassword || ''} onChange={e => setForm({ ...form, smtpPassword: e.target.value })}
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono" />
                            </div>
                        </div>
                        <div className="mt-10 flex justify-end">
                            <button type="submit" disabled={saving}
                                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-500/25 active:scale-95 flex items-center gap-3">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Sync Network Stack
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Profile & Security Tab */}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Update Profile */}
                    <form onSubmit={saveProfile} className="bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 p-10 h-fit">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100"><User className="w-6 h-6 text-emerald-600" /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Master Profile</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Primary administrative identity</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Universal Alias</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Authorized Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button type="submit" disabled={savingProfile}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-3">
                                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Sync Identity State
                            </button>
                        </div>
                    </form>

                    {/* Change Password */}
                    <form onSubmit={savePassword} className="bg-white border-2 border-slate-50 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 p-10 h-fit relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 opacity-50" />
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100"><Shield className="w-6 h-6 text-rose-600" /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Access Control</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Master credential rotation</p>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Current Validation Token</label>
                                <div className="relative">
                                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required placeholder="••••••••"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all placeholder:text-slate-300" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">New Mastery Sequence</label>
                                <div className="relative">
                                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Minimum 12 characters recommended" minLength={8}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-slate-900 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all placeholder:text-slate-300" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 relative z-10">
                            <button type="submit" disabled={savingPassword}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-rose-500/25 active:scale-95 flex items-center justify-center gap-3">
                                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                Rotate Access Keys
                            </button>
                        </div>
                    </form>

                </div>
            )}

        </div>
    );
}
