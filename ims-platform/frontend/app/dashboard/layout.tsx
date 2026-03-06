'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../../lib/auth-context';
import { useSettings } from '../../lib/settings-context';
import {
    LayoutDashboard, FolderKanban, CheckSquare, Users, Building2,
    Calendar, MessageSquare, BarChart3, Briefcase, Target, Star,
    Settings, LogOut, Loader2, ChevronDown, DollarSign, FileText, BookOpen, Sparkles,
    CalendarDays, Clock, Receipt, FilePlus2, HelpCircle
} from 'lucide-react';
import clsx from 'clsx';
import NotificationsPanel from '../../components/NotificationsPanel';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'hr', 'employee', 'client'] },
    { name: 'CEO Dashboard', href: '/dashboard/admin', icon: Briefcase, roles: ['admin', 'manager'] },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban, roles: ['admin', 'manager', 'hr', 'employee', 'client'] },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'manager', 'hr', 'employee'] },
    { name: 'Clients', href: '/dashboard/clients', icon: Building2, roles: ['admin', 'manager', 'hr'] },
    { name: 'Employees', href: '/dashboard/employees', icon: Users, roles: ['admin', 'hr'] },
    { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar, roles: ['admin', 'hr', 'employee'] },
    { name: 'HR & Salary', href: '/dashboard/hr', icon: DollarSign, roles: ['admin', 'hr'] },
    { name: 'Recruitment', href: '/dashboard/recruitment', icon: Briefcase, roles: ['admin', 'hr'] },
    { name: 'Goals', href: '/dashboard/goals', icon: Target, roles: ['admin', 'manager', 'hr', 'employee'] },
    { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays, roles: ['admin', 'manager', 'hr', 'employee'] },
    { name: 'Time Tracking', href: '/dashboard/timetracking', icon: Clock, roles: ['admin', 'manager', 'hr', 'employee'] },
    { name: 'Expenses', href: '/dashboard/expenses', icon: Receipt, roles: ['admin', 'manager', 'hr', 'employee'] },
    { name: 'Inventory', href: '/dashboard/inventory', icon: Building2, roles: ['admin', 'hr', 'manager'] },
    { name: 'Invoices', href: '/dashboard/invoices', icon: FilePlus2, roles: ['admin', 'manager', 'hr'] },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare, roles: ['admin', 'manager', 'hr', 'employee', 'client'] },
    { name: 'AI Assistant', href: '/dashboard/ai', icon: Sparkles, roles: ['admin', 'manager', 'hr', 'employee'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'manager', 'hr'] },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText, roles: ['admin', 'hr', 'manager'] },
    { name: 'Performance Reviews', href: '/dashboard/reviews', icon: Star, roles: ['admin', 'hr', 'manager', 'employee'] },
    { name: 'Documents', href: '/dashboard/documents', icon: BookOpen, roles: ['admin', 'hr', 'manager', 'employee'] },
    { name: 'Emails', href: '/dashboard/emails', icon: MessageSquare, roles: ['admin', 'hr'] },
    { name: 'Documentation', href: '/dashboard/docs', icon: HelpCircle, roles: ['admin', 'manager', 'hr', 'employee', 'client'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'manager', 'hr'] },
];

function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { settings, company } = useSettings();

    const filteredNav = navigation.filter((item) => {
        if (!user) return false;
        const userRoles = user.roles || [user.role];
        return userRoles.some(r => item.roles.includes(r));
    });

    return (
        <aside className="w-[260px] h-full flex flex-col bg-white border-r border-gray-100 overflow-y-auto fixed top-0 left-0 z-30">
            {/* Brand */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {(company?.companyLogo || settings?.logoUrl) ? (
                        <img src={company?.companyLogo || settings.logoUrl} alt="Company Logo" className="w-9 h-9 rounded-xl object-contain bg-white" />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                            <span className="text-white font-black text-base">{(company?.companyName || settings?.companyName)?.[0]?.toUpperCase() || 'I'}</span>
                        </div>
                    )}
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{company?.companyName || settings?.companyName || 'Internal Management System'}</p>
                        <p className="text-xs text-gray-400">{company?.tagline || 'Internal Platform'}</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5">
                {filteredNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link key={item.name} href={item.href}
                            className={clsx('sidebar-link', isActive && 'active')}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-100">
                <Link href="/dashboard/profile/me" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        {user?.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate capitalize">{user?.role}</p>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }} title="Logout"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </Link>
            </div>
        </aside>
    );
}

function DashboardInner({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div />
                    <div className="flex items-center gap-3">
                        <NotificationsPanel />
                        <Link href="/dashboard/profile/me" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                {user.photoUrl ? (
                                    <img src={user.photoUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                                )}
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{user.name?.split(' ')[0]}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </Link>
                    </div>
                </header>

                <div className="flex-1 p-6 page-enter">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <DashboardInner>{children}</DashboardInner>
        </AuthProvider>
    );
}
