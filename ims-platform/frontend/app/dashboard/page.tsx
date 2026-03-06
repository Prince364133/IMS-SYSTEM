'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import api from '../../lib/api';
import {
    Users, FolderKanban, CheckSquare, Calendar,
    TrendingUp, DollarSign, Loader2, AlertCircle, Zap, Settings as SettingsIcon
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useSettings } from '../../lib/settings-context';
import Link from 'next/link';

interface DashboardStats {
    employees: { total: number; active: number };
    projects: { total: number; active: number };
    tasks: { total: number; pending: number };
    attendance: { today: number; rate: number };
    clients: { total: number };
    salary: { pendingThisMonth: number };
}

const STAT_CARDS = [
    { key: 'employees', label: 'Total Employees', icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { key: 'projects', label: 'Active Projects', icon: FolderKanban, color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
    { key: 'tasks', label: 'Pending Tasks', icon: CheckSquare, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { key: 'attendance', label: "Present Today", icon: Calendar, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
];



function AIInsightWrapper() {
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/ai/dashboard')
            .then(({ data }) => setInsight(data.insight))
            .catch(() => setInsight('Failed to load AI insights. Check your API configuration.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 italic mt-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
            </div>
        );
    }

    return (
        <p className="text-sm text-gray-700 leading-relaxed mt-1">
            {insight}
        </p>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { settings } = useSettings();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const unconfiguredServices = [
        { label: 'Email Automation', key: 'email', isConfigured: settings?.lastEmailTestStatus === 'success' },
        { label: 'AI Insights', key: 'ai', isConfigured: settings?.aiProvider !== 'none' && settings?.lastAiTestStatus === 'success' },
        {
            label: 'Google Drive Storage',
            key: 'storage',
            isConfigured: settings?.storageMode === 'cloudinary' || (settings?.storageMode === 'google_drive' && settings?.lastStorageTestStatus === 'success')
        }
    ].filter(s => !s.isConfigured);

    useEffect(() => {
        Promise.all([
            api.get('/api/hrms/dashboard'),
            api.get('/api/hrms/weekly-trends')
        ])
            .then(([dashRes, trendsRes]) => {
                setStats(dashRes.data);
                setChartData(trendsRes.data);
            })
            .catch(() => setError('Failed to load dashboard stats'))
            .finally(() => setLoading(false));
    }, []);

    const getStatValue = (key: string) => {
        if (!stats) return '—';
        switch (key) {
            case 'employees': return stats.employees?.active ?? '—';
            case 'projects': return stats.projects?.active ?? '—';
            case 'tasks': return stats.tasks?.pending ?? '—';
            case 'attendance': return `${stats.attendance?.today ?? '—'}`;
            default: return '—';
        }
    };

    const getSubText = (key: string) => {
        if (!stats) return '';
        switch (key) {
            case 'employees': return `of ${stats.employees?.total} total`;
            case 'projects': return `of ${stats.projects?.total} total`;
            case 'tasks': return 'need attention';
            case 'attendance': return `${stats.attendance?.rate ?? 0}% rate`;
            default: return '';
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's what's happening.</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error} — showing cached data
                </div>
            )}

            {user?.role === 'admin' && unconfiguredServices.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <SettingsIcon className="w-24 h-24 text-indigo-600 rotate-12" />
                    </div>
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-indigo-900 leading-tight">Complete System Setup</h3>
                                <p className="text-xs text-indigo-700 mt-1 max-w-lg">
                                    To unlock full capabilities like automated reporting, AI analysis, and cloud storage, please configure:
                                    <span className="font-semibold px-2">
                                        {unconfiguredServices.map(s => s.label).join(', ')}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/settings" className="btn-primary whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
                            Configure Now
                        </Link>
                    </div>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {STAT_CARDS.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.key} className="stat-card group hover:shadow-md transition-shadow">
                            <div className={`stat-icon ${item.bg}`}>
                                <Icon className={`w-6 h-6 ${item.iconColor}`} />
                            </div>
                            <div>
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-900">{getStatValue(item.key)}</p>
                                )}
                                <p className="text-sm text-gray-500 font-medium">{item.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{getSubText(item.key)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* AI Insights Card */}
            {settings?.aiProvider !== 'none' && (
                <div className="card p-5 mb-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-white to-purple-50/30">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">AI Organizational Health Summary</h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Beta</span>
                            </div>
                            <AIInsightWrapper />
                        </div>
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Weekly Activity</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 13 }} />
                            <Area type="monotone" dataKey="projects" stroke="#6366f1" strokeWidth={2} fill="url(#colorProjects)" name="Projects" />
                            <Area type="monotone" dataKey="tasks" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorTasks)" name="Tasks" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Tasks by Day</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 13 }} />
                            <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} name="Tasks" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
