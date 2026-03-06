'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

    useEffect(() => {
        if (!loading && !superAdmin) router.replace('/superadmin/login');
    }, [superAdmin, loading, router]);

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center animate-pulse">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-400 text-sm">Authenticating...</p>
            </div>
        </div>
    );
    if (!superAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-30">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Super Admin</p>
                        <p className="text-[10px] text-violet-400 font-medium">Platform Control</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    {NAV.map(item => (
                        <Link key={item.href} href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium mb-0.5 group">
                            <item.icon className="w-4 h-4 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Profile */}
                <div className="px-3 py-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50">
                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {superAdmin.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{superAdmin.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{superAdmin.email}</p>
                        </div>
                        <button onClick={logout} title="Logout" className="text-slate-500 hover:text-red-400 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">
                {/* Top Bar */}
                <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Shield className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-violet-400 font-semibold">Super Admin Panel</span>
                        <ChevronRight className="w-3 h-3" />
                        <span>Platform Management</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
                            <Bell className="w-4 h-4 text-slate-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                                {superAdmin.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm text-slate-300 font-medium">{superAdmin.name}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
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
