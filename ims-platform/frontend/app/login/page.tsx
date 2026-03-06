'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2, Database, Info, User, Key, Globe } from 'lucide-react';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { useSettings } from '../../lib/settings-context';

function LoginForm() {
    const { login, isLoading } = useAuth();
    const router = useRouter();
    const { settings, company } = useSettings();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // MFA state
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaToken, setMfaToken] = useState('');
    const [mfaUserId, setMfaUserId] = useState('');

    // DB Setup state
    const [setupRequired, setSetupRequired] = useState(false);
    const [dbChecking, setDbChecking] = useState(true);
    const [dbUsername, setDbUsername] = useState('');
    const [dbPassword, setDbPassword] = useState('');
    const [dbCluster, setDbCluster] = useState('');

    useEffect(() => {
        const checkSetup = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiUrl}/api/setup/status`);
                const data = await res.json();
                if (data.success && !data.isConfigured) {
                    setSetupRequired(true);
                }
            } catch (error) {
                console.error('Failed to check setup status:', error);
            } finally {
                setDbChecking(false);
            }
        };
        checkSetup();
    }, []);

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

    const handleSetupDb = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let username = dbUsername.trim();
            let password = dbPassword.trim();
            let cluster = dbCluster.trim();

            // Robust Parser: If user pasted a full URI into the cluster field, extract the components
            if (cluster.includes('mongodb+srv://') || cluster.includes('://')) {
                const fullUri = cluster.includes('://') ? cluster : `mongodb+srv://${cluster}`;
                try {
                    // Extract username, password and host
                    const uriPattern = /mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?#]+)/;
                    const match = fullUri.match(uriPattern);

                    if (match) {
                        username = decodeURIComponent(match[1]);
                        password = decodeURIComponent(match[2]);
                        cluster = match[3];

                        // Update UI states to reflect parsed values
                        setDbUsername(username);
                        setDbPassword(password);
                        setDbCluster(cluster);
                        toast.success('URI automatically parsed!');
                    } else {
                        // Just strip the protocol if it's there without credentials
                        cluster = cluster.replace(/^mongodb\+srv:\/\//, '').split('/')[0].split('?')[0];
                        setDbCluster(cluster);
                    }
                } catch (parseError) {
                    console.error('URI Parse Error:', parseError);
                }
            }

            // Final safety check: strip any remaining protocol or port if SRV is used
            cluster = cluster.replace(/^mongodb\+srv:\/\//, '').split(':')[0].split('/')[0];

            const connectionString = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=Cluster0`;

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/setup/database`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionString }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(data.message || 'Database configured successfully!');
                setSetupRequired(false);
                setDbUsername('');
                setDbPassword('');
                setDbCluster('');
                // Redirect to Signup to create the first admin
                router.push('/signup');
            } else {
                toast.error(data.error || 'Failed to configure database');
            }
        } catch (error) {
            toast.error('Network error during database setup');
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
                        {(company?.companyLogo || settings?.logoUrl) ? (
                            <img src={company?.companyLogo || settings.logoUrl} alt="Company Logo" className="w-20 h-20 rounded-2xl object-contain bg-white shadow-sm border border-gray-100 p-2" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
                                <span className="text-white font-black text-4xl">{(company?.companyName || settings?.companyName)?.[0]?.toUpperCase() || 'I'}</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {company?.companyName || settings?.companyName || 'Internal Management System'}
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium">
                        Sign in to your internal workspace
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-gray-100/80 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">
                    {dbChecking ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-gray-500">Connecting to platform...</p>
                        </div>
                    ) : setupRequired ? (
                        <form onSubmit={handleSetupDb} className="space-y-5">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 mb-4 ring-4 ring-white shadow-sm">
                                    <Database className="w-6 h-6 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Database Connected</h2>
                                <p className="text-gray-500 text-sm mt-1.5 font-medium px-4">
                                    Welcome! The IMS backend is running, but no MongoDB cluster is connected. Enter your Mongo URI to initialize and seed the system.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-orange-600">Database Username</label>
                                        <a
                                            href="https://www.mongodb.com/docs/atlas/getting-started/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer"
                                        >
                                            <Info className="w-3 h-3" />
                                            <span>Help Center</span>
                                        </a>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600 text-gray-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={dbUsername}
                                            onChange={(e) => setDbUsername(e.target.value)}
                                            placeholder="e.g. princegupta3641_db_user"
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-orange-600">Database Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600 text-gray-400">
                                            <Lock className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="password"
                                            value={dbPassword}
                                            onChange={(e) => setDbPassword(e.target.value)}
                                            placeholder="Your DB User Password"
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-orange-600">Cluster URL</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-600 text-gray-400">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={dbCluster}
                                            onChange={(e) => setDbCluster(e.target.value)}
                                            placeholder="e.g. cluster0.fizmeb6.mongodb.net"
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-1">
                                        <Info className="w-2.5 h-2.5" />
                                        Do not include "mongodb+srv://" or ending slashes
                                    </p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 rounded-xl font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(234,88,12,0.25)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                {loading ? 'Connecting & Seeding...' : 'Connect to MongoDB'}
                            </button>
                        </form>
                    ) : !mfaRequired ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-primary">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
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

                            <div className="pt-2 text-center">
                                <p className="text-sm text-gray-500 font-medium">
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => router.push('/signup')}
                                        className="text-primary hover:text-primary-dark font-bold transition-colors"
                                    >
                                        Register Admin
                                    </button>
                                </p>
                            </div>
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

                    {/* Demo credentials removed */}

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
