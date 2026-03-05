'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import api from '../../lib/api';
import {
    Users, FolderKanban, CheckSquare, Calendar,
    TrendingUp, DollarSign, Loader2, AlertCircle
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

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

const DUMMY_CHART = [
    { name: 'Mon', projects: 8, tasks: 22 }, { name: 'Tue', projects: 10, tasks: 28 },
    { name: 'Wed', projects: 7, tasks: 18 }, { name: 'Thu', projects: 12, tasks: 31 },
    { name: 'Fri', projects: 9, tasks: 26 }, { name: 'Sat', projects: 4, tasks: 12 },
    { name: 'Sun', projects: 3, tasks: 8 },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/api/hrms/dashboard')
            .then(({ data }) => setStats(data))
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

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Weekly Activity</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={DUMMY_CHART}>
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
                        <BarChart data={DUMMY_CHART} barSize={28}>
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
