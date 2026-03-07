'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard, Building2, Users, CreditCard, Tag, Receipt,
    Settings, FileText, Megaphone, LifeBuoy, Database, Sliders,
    LogOut, Bell, Shield, ChevronRight
} from 'lucide-react';
import { SuperAdminProvider, useSuperAdmin } from '../../lib/superadmin-context';

const NAV = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/companies', label: 'Companies', icon: Building2 },
    { href: '/superadmin/users', label: 'Users', icon: Users },
    { href: '/superadmin/plans', label: 'Plans', icon: CreditCard },
    { href: '/superadmin/coupons', label: 'Coupons', icon: Tag },
    { href: '/superadmin/subscriptions', label: 'Subscriptions', icon: Receipt },
    { href: '/superadmin/payments', label: 'Payments', icon: CreditCard },
    { href: '/superadmin/feature-flags', label: 'Feature Flags', icon: Sliders },
    { href: '/superadmin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/superadmin/tickets', label: 'Support Tickets', icon: LifeBuoy },
    { href: '/superadmin/logs', label: 'Logs', icon: FileText },
    { href: '/superadmin/databases', label: 'Databases', icon: Database },
    { href: '/superadmin/settings', label: 'Settings', icon: Settings },
];

function SuperAdminLayoutInner({ children }: { children: React.ReactNode }) {
    const { superAdmin, loading, logout } = useSuperAdmin();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !superAdmin && pathname !== '/superadmin/login') {
            router.replace('/superadmin/login');
        }
    }, [superAdmin, loading, router, pathname]);

    if (pathname === '/superadmin/login') {
        return <>{children}</>;
    }

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center animate-pulse">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Authenticating...</p>
            </div>
        </div>
    );
    if (!superAdmin) return null;

    return (
        <div className="min-h-screen bg-white flex text-slate-900 selection:bg-sky-500/30 font-sans">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-500/5 blur-[130px] opacity-40" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-400/5 blur-[130px] opacity-40" />
            </div>

            {/* Sidebar */}
            <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl shadow-slate-200/50">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-transparent pointer-events-none" />
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/10">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="relative">
                        <p className="text-base font-black text-slate-900 tracking-tight">Super Admin</p>
                        <p className="text-[10px] text-sky-600 font-bold uppercase tracking-widest">Platform Command</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 relative z-10 custom-scrollbar">
                    {NAV.map(item => (
                        <Link key={item.href} href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm group ${pathname === item.href
                                ? 'bg-white text-sky-600 shadow-sm border border-slate-200'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 border border-transparent hover:border-slate-200'
                                }`}>
                            <item.icon className={`w-4 h-4 flex-shrink-0 transition-colors ${pathname === item.href ? 'text-sky-500' : 'group-hover:text-sky-500'}`} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Profile Widget */}
                <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors group cursor-pointer relative overflow-hidden"
                        onClick={() => router.push('/superadmin/settings')}>
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-600/0 to-transparent group-hover:from-sky-500/5 transition-all pointer-events-none" />
                        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0 border border-slate-200 group-hover:border-sky-500/30 transition-colors">
                            {superAdmin.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="relative flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{superAdmin.name}</p>
                            <p className="text-[10px] text-slate-500 truncate font-medium">{superAdmin.email}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); logout(); }} title="Logout" className="relative p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10 w-[calc(100%-16rem)] overflow-x-hidden">
                {/* Top Glass Header */}
                <header className="h-16 bg-white/80 backdrop-blur-2xl border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 tracking-wide uppercase">
                        <Shield className="w-3.5 h-3.5 text-sky-500" />
                        <span className="text-sky-600">Instaura IMS</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Cloud Terminal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:text-sky-600 text-slate-500 transition-all group shadow-sm">
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white group-hover:border-slate-50 transition-colors" />
                            <Bell className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Page Content Injection */}
                <main className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SuperAdminProvider>
            <SuperAdminLayoutInner>{children}</SuperAdminLayoutInner>
        </SuperAdminProvider>
    );
}
