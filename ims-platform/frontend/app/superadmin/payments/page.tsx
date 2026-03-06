'use client';

import { useEffect, useState } from 'react';
import { Save, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

export default function PaymentsPage() {
    const [cfg, setCfg] = useState<any>({});
    const [form, setForm] = useState<any>({ razorpayKeyId: '', razorpaySecret: '', razorpayWebhookSecret: '', paymentsEnabled: false, currency: 'INR' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ connected?: boolean; message?: string } | null>(null);

    useEffect(() => {
        saApi.get('/payments/config').then(({ data }) => {
            setCfg(data.config);
            setForm((p: any) => ({ ...p, paymentsEnabled: data.config.paymentsEnabled, currency: data.config.currency || 'INR' }));
        }).finally(() => setLoading(false));
    }, []);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = { paymentsEnabled: form.paymentsEnabled, currency: form.currency };
            if (form.razorpayKeyId) payload.razorpayKeyId = form.razorpayKeyId;
            if (form.razorpaySecret) payload.razorpaySecret = form.razorpaySecret;
            if (form.razorpayWebhookSecret) payload.razorpayWebhookSecret = form.razorpayWebhookSecret;
            await saApi.put('/payments/config', payload);
            toast.success('Payment config updated');
        } catch { toast.error('Failed to update config'); }
        setSaving(false);
    };

    const test = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const { data } = await saApi.post('/payments/test');
            setTestResult(data);
        } catch { setTestResult({ connected: false, message: 'Connection test failed' }); }
        setTesting(false);
    };

    if (loading) return <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />;

    return (
        <div className="space-y-5 max-w-2xl">
            <Toaster position="top-center" />
            <div><h1 className="text-2xl font-bold text-white">Razorpay Payment Config</h1><p className="text-slate-400 text-sm mt-1">Configure payment gateway credentials for platform billing</p></div>

            <form onSubmit={save} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm font-semibold text-white">Enable Payments</p>
                        <p className="text-xs text-slate-400 mt-0.5">Allow companies to subscribe to paid plans</p>
                    </div>
                    <button type="button" onClick={() => setForm((p: any) => ({ ...p, paymentsEnabled: !p.paymentsEnabled }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${form.paymentsEnabled ? 'bg-violet-600' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${form.paymentsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                {[
                    { label: 'Razorpay Key ID', key: 'razorpayKeyId', placeholder: cfg.razorpayKeyId || 'rzp_live_...' },
                    { label: 'Razorpay Secret', key: 'razorpaySecret', placeholder: cfg.razorpaySecret || 'Leave blank to keep existing' },
                    { label: 'Webhook Secret', key: 'razorpayWebhookSecret', placeholder: cfg.razorpayWebhookSecret || 'Leave blank to keep existing' },
                ].map(f => (
                    <div key={f.key}>
                        <label className="block text-xs text-slate-400 mb-2 font-semibold">{f.label}</label>
                        <input type="password" value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm" />
                    </div>
                ))}

                <div>
                    <label className="block text-xs text-slate-400 mb-2 font-semibold">Currency</label>
                    <select value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm">
                        {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>

                {testResult && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${testResult.connected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {testResult.connected ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                        {testResult.message}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={test} disabled={testing}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        Test Connection
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Config
                    </button>
                </div>
            </form>
        </div>
    );
}
