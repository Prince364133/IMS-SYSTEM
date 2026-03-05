'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { useSettings } from '../../lib/settings-context';

function LoginForm() {
    const { login, isLoading } = useAuth();
    const router = useRouter();
    const { settings } = useSettings();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // MFA state
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState('');
    const [mfaUserId, setMfaUserId] = useState('');

    const ROLE_DASHBOARD: Record<string, string> = {
        admin: '/dashboard',
        manager: '/dashboard',
        hr: '/dashboard',
        employee: '/dashboard',
        client: '/dashboard',
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.mfaRequired) {
                setMfaRequired(true);
                setMfaUserId(result.userId || '');
                toast.success('Enter your 6-digit authenticator code');
            } else {
                toast.success('Welcome back!');
                router.push('/dashboard');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMFA = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await login(email, password, mfaToken);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Invalid MFA code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-50/50 via-gray-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10 space-y-8">
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="inline-flex justify-center mb-6">
                        {settings?.logoUrl ? (
                            <img src={settings.logoUrl} alt="Company Logo" className="w-20 h-20 rounded-2xl object-contain bg-white shadow-sm border border-gray-100 p-2" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                                <span className="text-white font-black text-4xl">{settings?.companyName?.[0]?.toUpperCase() || 'I'}</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {settings?.companyName || 'Instaura IMS'}
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium">
                        Sign in to your internal workspace
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-gray-100/80 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">
                    {!mfaRequired ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-primary">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@instaura.live"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-primary">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(207,29,41,0.25)] hover:shadow-[0_6px_20px_rgba(207,29,41,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleMFA} className="space-y-5">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 ring-4 ring-white shadow-sm">
                                    <Lock className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Two-Factor Auth</h2>
                                <p className="text-gray-500 text-sm mt-1.5 font-medium px-4">Enter the 6-digit code from your authenticator app</p>
                            </div>
                            <div className="space-y-1.5">
                                <input
                                    type="text"
                                    value={mfaToken}
                                    onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-300 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || mfaToken.length !== 6}
                                className="w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(207,29,41,0.25)] hover:shadow-[0_6px_20px_rgba(207,29,41,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Verify Code
                            </button>
                            <button type="button" onClick={() => setMfaRequired(false)} className="w-full text-gray-500 hover:text-gray-800 text-sm font-medium text-center transition-colors">
                                ← Back to login
                            </button>
                        </form>
                    )}

                    {/* Demo credentials */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-4">Demo Credentials</p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100/80 hover:bg-gray-100 transition-colors group cursor-pointer" onClick={() => { setEmail('admin@instaura.live'); setPassword('Admin@123456'); }}>
                                <div>
                                    <p className="text-gray-700 text-xs font-semibold">Admin <span className="text-gray-400 font-normal ml-1">Full Access</span></p>
                                    <p className="text-gray-500 font-mono text-[11px] mt-0.5">admin@instaura.live</p>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm text-gray-500 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to fill
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100/80 hover:bg-gray-100 transition-colors group cursor-pointer" onClick={() => { setEmail('hr@instaura.live'); setPassword('HRInstaura@2024'); }}>
                                <div>
                                    <p className="text-gray-700 text-xs font-semibold">HR Manager <span className="text-gray-400 font-normal ml-1">Team & Salary</span></p>
                                    <p className="text-gray-500 font-mono text-[11px] mt-0.5">hr@instaura.live</p>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm text-gray-500 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to fill
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-100/80 hover:bg-gray-100 transition-colors group cursor-pointer" onClick={() => { setEmail('employee@instaura.live'); setPassword('Employee@2024'); }}>
                                <div>
                                    <p className="text-gray-700 text-xs font-semibold">Employee <span className="text-gray-400 font-normal ml-1">Limited</span></p>
                                    <p className="text-gray-500 font-mono text-[11px] mt-0.5">employee@instaura.live</p>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm text-gray-500 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to fill
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <AuthProvider>
            <LoginForm />
        </AuthProvider>
    );
}
