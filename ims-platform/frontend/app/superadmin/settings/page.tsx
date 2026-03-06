'use client';

import { useEffect, useState } from 'react';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        saApi.get('/settings').then(({ data }) => { setSettings(data.settings); setForm(data.settings); }).finally(() => setLoading(false));
    }, []);

    const save = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try { await saApi.put('/settings', form); toast.success('Settings saved'); }
        catch { toast.error('Failed to save settings'); }
        setSaving(false);
    };

    const toggleMaintenance = async () => {
        await saApi.post('/settings/toggle-maintenance');
        const { data } = await saApi.get('/settings');
        setForm(data.settings);
        toast.success(`Maintenance mode ${data.settings.maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
    };

    if (loading) return <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />;

    const fields = [
        { label: 'Platform Name', key: 'platformName', type: 'text' },
        { label: 'Support Email', key: 'supportEmail', type: 'email' },
        { label: 'Logo URL', key: 'logoUrl', type: 'text' },
        { label: 'Max Free Users', key: 'maxFreeUsers', type: 'number' },
        { label: 'Trial Days', key: 'trialDays', type: 'number' },
        { label: 'Maintenance Message', key: 'maintenanceMessage', type: 'text' },
        { label: 'SMTP Host', key: 'smtpHost', type: 'text' },
        { label: 'SMTP Port', key: 'smtpPort', type: 'number' },
        { label: 'SMTP User', key: 'smtpUser', type: 'text' },
        { label: 'SMTP From Email', key: 'smtpFrom', type: 'email' },
    ];

    return (
        <div className="space-y-5 max-w-2xl">
            <Toaster position="top-center" />
            <div><h1 className="text-2xl font-bold text-white">Platform Settings</h1><p className="text-slate-400 text-sm mt-1">Global configuration for the entire platform</p></div>

            {/* Maintenance Mode */}
            <div className={`border rounded-2xl p-5 flex items-start justify-between gap-4 ${form.maintenanceMode ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${form.maintenanceMode ? 'text-red-400' : 'text-slate-400'}`} />
                    <div>
                        <p className="text-sm font-bold text-white">Maintenance Mode</p>
                        <p className="text-xs text-slate-400 mt-0.5">When enabled, all company users will see a maintenance notice</p>
                        <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold ${form.maintenanceMode ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{form.maintenanceMode ? 'ENABLED' : 'DISABLED'}</span>
                    </div>
                </div>
                <button type="button" onClick={toggleMaintenance}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors flex-shrink-0 ${form.maintenanceMode ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                    {form.maintenanceMode ? 'Disable' : 'Enable'}
                </button>
            </div>

            <form onSubmit={save} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">General Settings</h2>
                <div className="grid grid-cols-2 gap-4">
                    {fields.map(f => (
                        <div key={f.key}>
                            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">{f.label}</label>
                            <input type={f.type} value={form[f.key] ?? ''} onChange={e => setForm((p: any) => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                        </div>
                    ))}
                </div>
                <div className="pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={form.allowSelfRegistration ?? true} onChange={e => setForm((p: any) => ({ ...p, allowSelfRegistration: e.target.checked }))} className="accent-violet-500 w-4 h-4" />
                        Allow new company self-registration
                    </label>
                </div>
                <button type="submit" disabled={saving}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Settings
                </button>
            </form>
        </div>
    );
}
