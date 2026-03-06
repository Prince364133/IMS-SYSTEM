'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import api from '../../../lib/api';
import {
    Loader2, AlertCircle, TrendingUp, DollarSign, Users,
    FolderKanban, CheckSquare, Target, Activity, Building2, Sparkles
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function CEODashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [insights, setInsights] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [taskVelocity, setTaskVelocity] = useState<any[]>([]);
    const [projectHealth, setProjectHealth] = useState<any[]>([]);
    const [ceoInsights, setCeoInsights] = useState<any>(null);
    const [prevMonthProjects, setPrevMonthProjects] = useState<number>(0);

    useEffect(() => {
        if (!authLoading && user && !['admin', 'manager'].includes(user.role)) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        Promise.all([
            api.get('/api/hrms/dashboard'),
            api.get('/api/tasks', { params: { limit: 500 } }),
            api.get('/api/projects', { params: { limit: 200 } }),
            api.get('/api/hrms/ceo-insights'),
        ]).then(([{ data: dash }, { data: taskData }, { data: projData }, { data: insightsData }]) => {
            setStats(dash);
            setCeoInsights(insightsData);
            // Calculate month-over-month changes for Active Projects
            const prevActive = insightsData?.taskVelocity ? (dash?.projects?.total || 0) - (dash?.projects?.active || 0) : 0;
            setPrevMonthProjects(dash?.projects?.prevMonthActive ?? 0);

            // Build task velocity from real task statuses (fallback if ceoInsights fails)
            const tasks = taskData.tasks || [];
            const statusMap: Record<string, number> = { 'todo': 0, 'in_progress': 0, 'in_review': 0, 'done': 0 };
            tasks.forEach((t: any) => { if (statusMap[t.status] !== undefined) statusMap[t.status]++; });

            // Preference for backend aggregated data
            if (insightsData.taskVelocity) {
                setTaskVelocity(insightsData.taskVelocity);
            } else {
                setTaskVelocity([
                    { name: 'To Do', completed: 0, added: statusMap['todo'] },
                    { name: 'In Progress', completed: 0, added: statusMap['in_progress'] },
                    { name: 'In Review', completed: 0, added: statusMap['in_review'] },
                    { name: 'Done', completed: statusMap['done'], added: 0 },
                ]);
            }

            // Build project health from real project statuses
            const projects = projData.projects || [];
            const pMap: Record<string, number> = { 'in_progress': 0, 'planning': 0, 'on_hold': 0, 'completed': 0 };
            projects.forEach((p: any) => { const k = p.status?.toLowerCase().replace(' ', '_'); if (pMap[k] !== undefined) pMap[k]++; });
            setProjectHealth([
                { name: 'In Progress', value: pMap['in_progress'] || 0, color: '#10b981' },
                { name: 'Planning', value: pMap['planning'] || 0, color: '#6366f1' },
                { name: 'On Hold', value: pMap['on_hold'] || 0, color: '#f59e0b' },
                { name: 'Completed', value: pMap['completed'] || 0, color: '#94a3b8' },
            ]);
        }).catch(() => { }).finally(() => setLoading(false));

        api.get('/api/ai/insights')
            .then(({ data }) => setInsights(data.insight))
            .catch(() => setInsights('Failed to load AI Insights.'))
            .finally(() => setInsightsLoading(false));
    }, []);

    // Revenue stays illustrative (no financial backend)
    const REVENUE_DATA = [
        { name: 'Jan', rev: 40000, cost: 24000 },
        { name: 'Feb', rev: 30000, cost: 13980 },
        { name: 'Mar', rev: 20000, cost: 9800 },
        { name: 'Apr', rev: 27800, cost: 3908 },
        { name: 'May', rev: 18900, cost: 4800 },
        { name: 'Jun', rev: 23900, cost: 3800 },
        { name: 'Jul', rev: 34900, cost: 4300 },
    ];

    const TEAM_VELOCITY = taskVelocity.length > 0 ? taskVelocity : [
        { name: 'To Do', completed: 0, added: 0 },
        { name: 'In Progress', completed: 0, added: 0 },
        { name: 'Done', completed: 0, added: 0 },
    ];

    const PROJECT_HEALTH = projectHealth.length > 0 ? projectHealth : [
        { name: 'In Progress', value: 0, color: '#10b981' },
        { name: 'Planning', value: 0, color: '#6366f1' },
    ];

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!user || !['admin', 'manager'].includes(user.role)) return null;

    return (
        <div className="space-y-6">
            <div className="page-header flex items-center justify-between bg-gradient-to-r from-gray-900 to-indigo-900 p-8 rounded-2xl text-white shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>

                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-2 tracking-tight">CEO Overview</h1>
                    <p className="text-indigo-200 font-medium">Enterprise Snapshot & Performance Matrix</p>
                </div>
                <div className="relative z-10 hidden sm:flex items-center gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                        <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-1">Total Assets</p>
                        <p className="text-xl font-black">₹ {(ceoInsights?.financialTrajectory?.reduce((acc: number, curr: any) => acc + curr.rev, 0)).toLocaleString() || '0'}</p>
                    </div>
                </div>
            </div>

            {/* High Level KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Total Workforce</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats?.employees?.total || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {ceoInsights?.retentionRate ?? 0}%
                        </span>
                        <span className="text-gray-400 ml-2">Retention Rate</span>
                    </div>
                </div>

                <div className="card p-5 border-l-4 border-l-indigo-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Active Projects</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats?.projects?.active || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FolderKanban className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {stats?.projects?.active > prevMonthProjects ? '+' : ''}{(stats?.projects?.active || 0) - prevMonthProjects}
                        </span>
                        <span className="text-gray-400 ml-2">from last month</span>
                    </div>
                </div>

                <div className="card p-5 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Client Portfolio</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats?.clients?.total || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {ceoInsights?.satisfactionScore ?? 0}%
                        </span>
                        <span className="text-gray-400 ml-2">Satisfaction Score</span>
                    </div>
                </div>

                <div className="card p-5 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Pending Tasks</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{stats?.tasks?.pending || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                            <Activity className="w-3 h-3" /> Needs Attention
                        </span>
                        <span className="text-gray-400 ml-2">across pipeline</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Executive Summary (Spans 3 columns on Top) */}
                <div className="card p-6 lg:col-span-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Gemini AI Executive Summary
                    </h3>
                    <div className="text-sm text-indigo-900/80 leading-relaxed whitespace-pre-wrap">
                        {insightsLoading ? (
                            <div className="flex items-center gap-2 text-indigo-600/60">
                                <Loader2 className="w-4 h-4 animate-spin" /> Generating insights...
                            </div>
                        ) : (
                            insights
                        )}
                    </div>
                </div>

                {/* Revenue Overview */}
                <div className="card p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                        Financial Trajectory (YTD)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ceoInsights?.financialTrajectory || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Area type="monotone" dataKey="rev" name="Gross Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="cost" name="Operating Costs" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Health */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Portfolio Health</h3>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={PROJECT_HEALTH}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {PROJECT_HEALTH.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-gray-900">{stats?.projects?.active ?? 0}</span>
                            <span className="text-xs font-semibold text-gray-400">Total Active</span>
                        </div>
                    </div>
                    <div className="space-y-3 mt-4">
                        {PROJECT_HEALTH.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    <span className="font-medium text-gray-700">{item.name}</span>
                                </div>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team Velocity */}
                <div className="card p-6 lg:col-span-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-indigo-500" />
                        Task Status Distribution (Live)
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={TEAM_VELOCITY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="completed" name="Tasks Completed" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="added" name="Tasks Added" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
