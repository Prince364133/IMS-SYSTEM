'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2, User, ChevronRight, Info, Globe, Building2, Database } from 'lucide-react';

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Step 1: Admin & Company Registration States
    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [registering, setRegistering] = useState(false);

    // Step 2: DB Config States
    const [setupToken, setSetupToken] = useState(searchParams.get('token') || '');
    const [dbUsername, setDbUsername] = useState('');
    const [dbPassword, setDbPassword] = useState('');
    const [dbCluster, setDbCluster] = useState('');
    const [isDbConnecting, setIsDbConnecting] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // Flow control
    const isConfigStep = !!setupToken;

    const handleRegisterCompany = async (e: FormEvent) => {
        e.preventDefault();
        setRegistering(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/setup/register-tenant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, adminName: name, adminEmail: email, adminPassword: password }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Company registered! Now configure your database.');
                setSetupToken(data.setupToken);
                // Update URL gently
                router.replace(`/signup?step=db_config&token=${data.setupToken}`);
            } else {
                toast.error(data.error || 'Registration failed');
            }
        } catch (err: any) {
            toast.error('Network error during registration');
        } finally {
            setRegistering(false);
        }
    };

    const handleConnectDB = async (e: FormEvent) => {
        e.preventDefault();
        setIsDbConnecting(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${apiUrl}/api/setup/configure-tenant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    setupToken,
                    username: dbUsername,
                    password: dbPassword,
                    clusterUrl: dbCluster
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Database connected and system seeded successfully! Please login.');
                router.push('/login');
            } else {
                toast.error(data.error || 'Connection failed');
            }
        } catch (err) {
            toast.error('Network error during configuration');
        } finally {
            setIsDbConnecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-gray-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-[480px] relative z-10 space-y-8">
                <div className="text-center">
                    <div className="inline-flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                            <span className="text-white font-black text-4xl">I</span>
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        {isConfigStep ? 'Database Configuration' : 'Create Workspace'}
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 font-medium">
                        {isConfigStep
                            ? 'Connect your dedicated MongoDB Atlas cluster'
                            : 'Initialize your internal management system'
                        }
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border border-gray-100/80 rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] relative">

                    {/* STEP 2: DB CONFIG */}
                    {isConfigStep ? (
                        <form onSubmit={handleConnectDB} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold mb-1">Step 2: Connect your Database</p>
                                        <p className="text-blue-600/80 text-xs leading-relaxed">Your company has been registered in the system registry. Now, link your dedicated MongoDB Atlas cluster to store your employees and tasks.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowGuide(true)}
                                        className="shrink-0 text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-white px-2 py-1 rounded-md border border-blue-200 shadow-sm transition-all hover:bg-blue-50 flex items-center gap-1"
                                    >
                                        <Info className="w-3 h-3" /> How to Setup
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block">Atlas Username</label>
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
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
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
                                        placeholder="cluster0.mongodb.net"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 outline-none transition-all"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Paste your cluster domain or full connection string URI.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isDbConnecting}
                                className="w-full py-4 mt-2 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.25)] disabled:opacity-70"
                            >
                                {isDbConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isDbConnecting ? 'Initializing System...' : 'Connect & Test Database'}
                            </button>

                            <div className="mt-4 p-4 rounded-xl border border-amber-100 bg-amber-50 shadow-sm">
                                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 mb-2">
                                    <Info className="w-4 h-4" /> Connection Issues?
                                </h4>
                                <ol className="text-xs text-amber-900/80 space-y-1.5 pl-5 list-decimal font-medium">
                                    <li>Click <a href="https://cloud.mongodb.com/v2/console/security/network" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-amber-700">Atlas Guide</a> to open MongoDB Network Access.</li>
                                    <li>Click <span className="font-bold border border-amber-200 bg-amber-100/50 px-1 rounded">Add IP Address</span>.</li>
                                    <li>Select <span className="font-bold">Allow Access from Anywhere</span> or add your current IP.</li>
                                    <li>Click Confirm and wait 30 seconds before testing again.</li>
                                </ol>
                            </div>
                        </form>
                    ) : (

                        /* STEP 1: REGISTRATION */
                        <form onSubmit={handleRegisterCompany} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Company Name</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Acme Corp"
                                        required
                                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-100 my-2" />

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Admin Name</label>
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
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Admin Email</label>
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
                                <label className="text-sm font-semibold text-gray-700 block transition-colors focus-within:text-blue-600">Admin Password</label>
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
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={registering}
                                className="w-full py-4 mt-2 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {registering && <Loader2 className="w-4 h-4 animate-spin" />}
                                {registering ? 'Registering...' : 'Register Workspace'}
                            </button>
                        </form>
                    )}

                    {!isConfigStep && (
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500">
                                Already have an account?{' '}
                                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors inline-flex items-center gap-0.5">
                                    Sign In <ChevronRight className="w-4 h-4" />
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* MongoDB Setup Guide Modal */}
            {showGuide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Database className="w-6 h-6 text-green-600" /> MongoDB Atlas Setup Guide
                            </h3>
                            <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 rounded-full p-2 border border-gray-200 shadow-sm">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* Step 1: Create Cluster */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                                    Create a Free Cluster
                                </h4>
                                <div className="pl-8 text-sm text-gray-600 space-y-2">
                                    <p>1. Go to <a href="https://cloud.mongodb.com/v2" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">cloud.mongodb.com/v2</a> and sign in.</p>
                                    <p>2. Create a new Project, then click <strong>Build a Database</strong>.</p>
                                    <p>3. Choose the <strong>Free M0</strong> tier and click Create.</p>
                                </div>
                            </div>

                            {/* Step 2: Database User */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                                    Create Database User Credentials
                                </h4>
                                <div className="pl-8 text-sm text-gray-600 space-y-2">
                                    <p>1. Under Security in the left sidebar, click <strong>Database Access</strong>.</p>
                                    <p>2. Click <span className="inline-block bg-green-500 text-white px-2 py-0.5 rounded text-xs">Add New Database User</span>.</p>
                                    <p>3. Select <strong>Password</strong> for the authentication method.</p>
                                    <p>4. Type a Username (e.g., <code>ims_admin</code>) and a strong Password.</p>
                                    <p>5. Click <strong>Add User</strong>. <span className="text-amber-600 font-medium">Use these exact credentials in our IMS form.</span></p>
                                </div>
                            </div>

                            {/* Step 3: Network Access (IP Whitelist) */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                                    Allow Network Access (IP Whitelist)
                                </h4>
                                <div className="pl-8 text-sm text-gray-600 space-y-2">
                                    <p>1. Go to <a href="https://cloud.mongodb.com/v2/console/security/network" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Network Access</a> (under Security in the left sidebar).</p>
                                    <p>2. Click <span className="inline-block bg-green-500 text-white px-2 py-0.5 rounded text-xs">Add IP Address</span>.</p>
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg my-2">
                                        <p className="font-semibold text-amber-900">Important: To allow connections from the IMS system, you must allow access from anywhere.</p>
                                        <p className="mt-1">Click the <strong>"Allow Access from Anywhere"</strong> button. This will automatically fill the IP Address field with exactly: <code className="bg-white border text-red-600 border-amber-300 px-1.5 py-0.5 rounded">0.0.0.0/0</code></p>
                                    </div>
                                    <p>3. Click <strong>Confirm</strong>. <span className="text-gray-500 italic">Wait about 30-60 seconds for the status to change from "Pending" to "Active".</span></p>
                                </div>
                            </div>

                            {/* Step 4: Get Cluster URL */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                                    Get your Cluster URL
                                </h4>
                                <div className="pl-8 text-sm text-gray-600 space-y-2">
                                    <p>1. Click <strong>Database</strong> in the top left sidebar to see your clusters.</p>
                                    <p>2. Click the <strong>Connect</strong> button next to your cluster.</p>
                                    <p>3. Choose <strong>Drivers</strong> (Connect to your application).</p>
                                    <p>4. You will see a connection string that looks like this:<br />
                                        <code className="block mt-1 p-2 bg-gray-100 rounded border text-xs break-all text-gray-800">mongodb+srv://&lt;username&gt;:&lt;password&gt;@<span className="bg-blue-200 text-blue-900 px-1 rounded font-bold">cluster0.abcde.mongodb.net</span>/?retryWrites=true&w=majority</code>
                                    </p>
                                    <p>5. Copy the connection string and paste it straight into the <strong>Cluster URL</strong> field in the IMS form.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button onClick={() => setShowGuide(false)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-colors active:scale-95">
                                I understand, close guide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <SignupForm />
        </Suspense>
    );
}
