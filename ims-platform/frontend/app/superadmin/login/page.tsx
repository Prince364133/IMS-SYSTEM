'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import saApi from '../../../lib/superadmin-api';

import { useSuperAdmin } from '../../../lib/superadmin-context';

export default function SuperAdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useSuperAdmin();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return toast.error('Please fill in all fields');
        setLoading(true);
        try {
            const { data } = await saApi.post('/auth/login', { email, password });
            toast.success(`Welcome back, ${data.superAdmin.name}!`);
            login(data.token, data.superAdmin);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Premium background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-200/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
            </div>

            <div className="w-full max-w-[440px] relative">
                {/* Decorative elements */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-700" />

                <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[32px] p-8 md:p-10 relative z-10">
                    {/* Logo & Header */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-sky-600 flex items-center justify-center shadow-2xl shadow-sky-600/30 mb-6 group transition-transform hover:scale-105 duration-500">
                            <Shield className="w-10 h-10 text-white group-hover:rotate-12 transition-transform" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">
                            Super <span className="text-sky-600">Admin</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 font-medium">Enterprise Control Center</p>
                    </div>

                    {/* Security Notice */}
                    <div className="bg-sky-50/50 border border-sky-100 rounded-2xl px-5 py-3 mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-600/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-sky-600" />
                        </div>
                        <p className="text-[11px] text-sky-700 font-bold leading-tight uppercase tracking-wide">
                            Authorized personnel only. <br />Session access is monitored.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Identity</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@instaura.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 text-sm transition-all font-medium"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Secure Password</label>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 text-sm transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors"
                                >
                                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-sky-600/20 active:scale-95 mt-4"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                            <span className="text-lg tracking-tight">{loading ? 'Verifying...' : 'Initialize Access'}</span>
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Powered by Instaura IMS Engine v2.0
                        </p>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-8 flex justify-center gap-6">
                    <button className="text-[11px] font-bold text-slate-400 hover:text-sky-600 uppercase tracking-widest transition-colors">Privacy Protocol</button>
                    <button className="text-[11px] font-bold text-slate-400 hover:text-sky-600 uppercase tracking-widest transition-colors">Security Standards</button>
                </div>
            </div>
        </div>
    );
}

