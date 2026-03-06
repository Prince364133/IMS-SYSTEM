'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2, User, ChevronRight, Info, Globe } from 'lucide-react';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { useSettings } from '../../lib/settings-context';

function SignupForm() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { settings, company, refreshSettings } = useSettings();

    // Signup States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // DB Config States
    const [dbUsername, setDbUsername] = useState('');
    const [dbPassword, setDbPassword] = useState('');
    const [dbCluster, setDbCluster] = useState('');
    const [isDbConnecting, setIsDbConnecting] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/setup/status`);
            const data = await res.json();
            setIsConfigured(data.isConfigured);

            if (data.isConfigured && data.adminExists) {
                toast.success('System already configured. Redirecting to login...');
                router.push('/login');
            }
        } catch (e) {
            console.error('Failed to fetch setup status');
        } finally {
            setCheckingStatus(false);
        }
    };

    const handleConnectDB = async (e: FormEvent) => {
        e.preventDefault();
        setIsDbConnecting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/setup/configure`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: dbUsername,
                    password: dbPassword,
                    clusterUrl: dbCluster
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Database connected successfully!');
                setIsConfigured(true);
                await refreshSettings();
            } else {
                toast.error(data.error || 'Connection failed');
            }
        } catch (err) {
            toast.error('Network error during configuration');
        } finally {
            setIsDbConnecting(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            if (user.role !== 'admin') {
                toast.error('Access restricted. Please use the login screen.');
                router.push('/login');
            }
        }
    }, [user, authLoading, router]);

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role: 'admin' }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Account created successfully! Welcome to IMS.');
                router.push('/login');
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (err: any) {
            toast.error('Network error during registration');
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-gray-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10 space-y-8">
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="inline-flex justify-center mb-6">
                        {(company?.companyLogo || settings?.logoUrl) ? (
                            <img src={company?.companyLogo || settings.logoUrl} alt="Company Logo" className="w-20 h-20 rounded-2xl object-contain bg-white shadow-sm border border-gray-100 p-2" />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                                <span className="text-white font-black text-4xl">{(company?.companyName || settings?.companyName)?.[0]?.toUpperCase() || 'I'}</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {isConfigured ? 'Create Admin Account' : 'Database Configuration'}
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium">
                        {isConfigured
                            ? 'Initialize your internal management system'
                            : 'Step 1: Connect your MongoDB Atlas database'
                        }
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-gray-100/80 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">
                    {!isConfigured ? (
                        <form onSubmit={handleConnectDB} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700 block">Atlas Username</label>
                                    <a href="https://cloud.mongodb.com/v2/console/clusters" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-medium bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 transition-colors hover:bg-blue-100">
                                        <Info className="w-2.5 h-2.5" /> Atlas Guide
                                    </a>
                                </div>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={dbUsername}
                                        onChange={(e) => setDbUsername(e.target.value)}
                                        placeholder="Database User"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Atlas Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={dbPassword}
                                        onChange={(e) => setDbPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-11 py-3 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 outline-none transition-all"
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
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Cluster URL</label>
                                <div className="relative group">
                                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        value={dbCluster}
                                        onChange={(e) => setDbCluster(e.target.value)}
                                        placeholder="cluster0.fizmeb6.mongodb.net"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Exclude 'mongodb+srv://' and any params.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isDbConnecting}
                                className="w-full py-4 mt-2 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-70"
                            >
                                {isDbConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isDbConnecting ? 'Connecting...' : 'Connect & Test Database'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignup} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@example.com"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-11 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 focus:bg-white transition-all shadow-sm"
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
                                className="w-full py-4 mt-2 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {loading ? 'Registering...' : 'Complete Setup'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors inline-flex items-center gap-0.5">
                                Sign In <ChevronRight className="w-4 h-4" />
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <AuthProvider>
            <SignupForm />
        </AuthProvider>
    );
}
