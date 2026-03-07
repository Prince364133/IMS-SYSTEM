'use client';

import { useEffect, useState } from 'react';
import { Save, Zap, CheckCircle, XCircle, Loader2, Globe, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

export default function PaymentsPage() {
    const [cfg, setCfg] = useState<any>({});
    const [form, setForm] = useState<any>({ razorpayKeyId: '', razorpaySecret: '', razorpayWebhookSecret: '', paymentsEnabled: false, currency: 'INR', platformApiUrl: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ connected?: boolean; message?: string } | null>(null);

    useEffect(() => {
        saApi.get('/payments/config').then(({ data }) => {
            setCfg(data.config);
            setForm((p: any) => ({ ...p, paymentsEnabled: data.config.paymentsEnabled, currency: data.config.currency || 'INR', platformApiUrl: data.config.platformApiUrl || '' }));
        }).finally(() => setLoading(false));
    }, []);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = { paymentsEnabled: form.paymentsEnabled, currency: form.currency, platformApiUrl: form.platformApiUrl };
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

    if (loading) return <div className="h-96 bg-slate-50 border border-slate-200 rounded-3xl animate-pulse flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Security Protocol...</div>;

    return (
        <div className="space-y-5 max-w-2xl">
            <Toaster position="top-center" />
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-200"><Zap className="w-6 h-6" /></div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Razorpay Integration</h1>
                    <p className="text-slate-500 text-sm font-medium">Configure payment gateway credentials for platform billing</p>
                </div>
            </div>

            <form onSubmit={save} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-10 space-y-8 shadow-xl shadow-slate-100/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500 opacity-20" />

                <div className="flex items-center justify-between py-4 bg-slate-50/50 px-6 rounded-2xl border border-slate-100">
                    <div>
                        <p className="text-sm font-bold text-slate-900">Live Payments Gateway</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Control global transaction capabilities</p>
                    </div>
                    <button type="button" onClick={() => setForm((p: any) => ({ ...p, paymentsEnabled: !p.paymentsEnabled }))}
                        className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 duration-300 ${form.paymentsEnabled ? 'bg-sky-500 shadow-inner' : 'bg-slate-300'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-md ${form.paymentsEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="grid gap-6">
                    {[
                        { label: 'Razorpay Key ID', key: 'razorpayKeyId', placeholder: cfg.razorpayKeyId || 'rzp_live_...' },
                        { label: 'Razorpay Secret', key: 'razorpaySecret', placeholder: cfg.razorpaySecret || '••••••••••••••••' },
                        { label: 'Webhook Secret', key: 'razorpayWebhookSecret', placeholder: cfg.razorpayWebhookSecret || '••••••••••••••••' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-[0.15em] ml-1">{f.label}</label>
                            <input type="password" value={form[f.key]} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-sm font-medium shadow-sm" />
                        </div>
                    ))}
                </div>

                <div className="pt-2">
                    <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-[0.15em] ml-1">Platform API URL (Live)</label>
                    <input type="text" value={form.platformApiUrl} onChange={e => setForm((p: any) => ({ ...p, platformApiUrl: e.target.value }))}
                        placeholder="https://api.yourdomain.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-sm font-medium shadow-sm mb-6" />

                    <label className="block text-[10px] text-slate-500 mb-2 font-black uppercase tracking-[0.15em] ml-1">Platform Currency</label>
                    <select value={form.currency} onChange={e => setForm((p: any) => ({ ...p, currency: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-bold text-sm shadow-sm appearance-none">
                        {['INR', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>

                {testResult && (
                    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold shadow-sm animate-in slide-in-from-top-2 duration-300 ${testResult.connected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {testResult.connected ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                        {testResult.message}
                    </div>
                )}

                <div className="flex gap-4 pt-6">
                    <button type="button" onClick={test} disabled={testing}
                        className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                        {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-sky-500" />}
                        Test API
                    </button>
                    <button type="submit" disabled={saving}
                        className="flex-1 py-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-sky-200 active:scale-95 disabled:opacity-50">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Update Config
                    </button>
                </div>
            </form>

            <div className="bg-sky-50 border border-sky-100 rounded-3xl p-8 space-y-4">
                <div className="flex items-center gap-3 text-sky-800">
                    <Globe className="w-5 h-5" />
                    <h2 className="font-bold text-sm uppercase tracking-wider">Webhook Configuration</h2>
                </div>
                <p className="text-sm text-sky-700 leading-relaxed font-medium">
                    To automate subscription activation and handle renewal payments, copy the URL below and add it to your
                    <a href="https://dashboard.razorpay.com/app/website-app-settings/webhooks" target="_blank" rel="noopener noreferrer" className="mx-1 text-sky-900 underline font-black">Razorpay Dashboard</a>.
                </p>
                <div className="bg-white border border-sky-200 rounded-2xl p-4 flex items-center justify-between group">
                    <code className="text-xs font-mono text-slate-600 select-all truncate mr-4">
                        {`${(form.platformApiUrl || (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':5000') : 'https://api.yourdomain.com')).replace(/\/$/, '')}/api/webhooks/razorpay`}
                    </code>
                    <div className="px-3 py-1 bg-sky-100 text-sky-600 text-[10px] font-black rounded-lg uppercase tracking-tight group-hover:bg-sky-600 group-hover:text-white transition-colors cursor-pointer"
                        onClick={() => {
                            const base = form.platformApiUrl || (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':5000') : '');
                            const url = `${base.replace(/\/$/, '')}/api/webhooks/razorpay`;
                            navigator.clipboard.writeText(url);
                            toast.success('URL Copied to Clipboard');
                        }}>
                        Copy URL
                    </div>
                </div>
                <div className="flex items-start gap-3 bg-white/50 p-4 rounded-xl border border-sky-100 mt-2">
                    <ShieldCheck className="w-5 h-5 text-sky-500 flex-shrink-0" />
                    <p className="text-[11px] text-sky-600 font-medium leading-normal">
                        <strong>Security Note:</strong> Ensure you set the same <strong>Webhook Secret</strong> in both the Razorpay Dashboard and this panel above to enable signature verification.
                    </p>
                </div>
            </div>
        </div>
    );
}
