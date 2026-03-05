'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, FolderKanban, CheckSquare, Loader2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: <span className="font-bold">{p.value}</span>
                </p>
            ))}
        </div>
    );
};

export default function AnalyticsPage() {
    const [stats, setStats] = useState<any>(null);
    const [taskStats, setTaskStats] = useState<any[]>([]);
    const [deptStats, setDeptStats] = useState<any[]>([]);
    const [projectStats, setProjectStats] = useState<any[]>([]);
    const [salaryStats, setSalaryStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/api/hrms/dashboard'),
            api.get('/api/tasks', { params: { limit: 200 } }),
            api.get('/api/users', { params: { limit: 200 } }),
            api.get('/api/projects', { params: { limit: 100 } }),
            api.get('/api/salary', { params: { limit: 200 } }),
        ]).then(([dash, tasks, users, projects, salary]) => {
            setStats(dash.data);

            // Task status breakdown for pie chart
            const taskArr = tasks.data.tasks || [];
            const statuses: Record<string, number> = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
            taskArr.forEach((t: any) => { if (statuses[t.status] !== undefined) statuses[t.status]++; });
            setTaskStats([
                { name: 'To Do', value: statuses.todo },
                { name: 'In Progress', value: statuses.in_progress },
                { name: 'In Review', value: statuses.in_review },
                { name: 'Done', value: statuses.done },
            ]);

            // Headcount by department
            const usersArr = users.data.users || [];
            const depts: Record<string, number> = {};
            usersArr.forEach((u: any) => { if (u.department) depts[u.department] = (depts[u.department] || 0) + 1; });
            setDeptStats(Object.entries(depts).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count));

            // Project status breakdown
            const projArr = projects.data.projects || [];
            const projStatus: Record<string, number> = {};
            projArr.forEach((p: any) => { projStatus[p.status] = (projStatus[p.status] || 0) + 1; });
            setProjectStats(Object.entries(projStatus).map(([name, value]) => ({ name, value })));

            // Monthly payroll trend (last 6 months)
            const salArr = salary.data.salaries || [];
            const monthMap: Record<string, number> = {};
            salArr.forEach((s: any) => { if (s.month) monthMap[s.month] = (monthMap[s.month] || 0) + (s.netSalary || 0); });
            const months = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
            setSalaryStats(months.map(([month, total]) => ({ month: month.slice(0, 7), total })));
        }).finally(() => setLoading(false));
    }, []);

    const KPI = [
        {
            label: 'Project Completion Rate',
            value: stats ? `${Math.round((stats.projects?.active || 0) / Math.max(stats.projects?.total || 1, 1) * 100)}%` : '—',
            icon: FolderKanban, color: 'text-indigo-600', bg: 'bg-indigo-50',
            sub: `${stats?.projects?.active ?? '—'} active of ${stats?.projects?.total ?? '—'} total`,
        },
        {
            label: 'Task Completion Rate',
            value: stats ? `${Math.round((stats.tasks?.total - stats.tasks?.pending) / Math.max(stats.tasks?.total || 1, 1) * 100)}%` : '—',
            icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50',
            sub: `${(stats?.tasks?.total || 0) - (stats?.tasks?.pending || 0)} completed`,
        },
        {
            label: 'Attendance Rate Today',
            value: stats ? `${stats.attendance?.rate ?? 0}%` : '—',
            icon: Users, color: 'text-blue-600', bg: 'bg-blue-50',
            sub: `${stats?.attendance?.today ?? '—'} present today`,
        },
        {
            label: 'Total Workforce',
            value: stats?.employees?.total ?? '—',
            icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50',
            sub: `${stats?.employees?.active ?? '—'} active`,
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Analytics</h1>
                <p className="page-subtitle">Real-time performance metrics across your organization</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {KPI.map((k) => {
                    const Icon = k.icon;
                    return (
                        <div key={k.label} className="card p-5">
                            <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center mb-3 ${k.bg}`}>
                                <Icon className={`w-5 h-5 ${k.color}`} />
                            </div>
                            {loading
                                ? <Loader2 className="w-5 h-5 animate-spin text-gray-300 mb-1" />
                                : <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                            }
                            <p className="text-sm font-medium text-gray-600">{k.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                        </div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : (
                <>
                    {/* Charts row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        {/* Payroll trend */}
                        <div className="card p-5 lg:col-span-2">
                            <h3 className="font-semibold text-gray-900 mb-4">Monthly Payroll (₹)</h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={salaryStats}>
                                    <defs>
                                        <linearGradient id="gSalary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                        tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                                    <Area type="monotone" dataKey="total" name="Payroll ₹" stroke="#6366f1" strokeWidth={2} fill="url(#gSalary)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Task status distribution */}
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Task Status</h3>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={taskStats} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                                        {taskStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-1.5 mt-3">
                                {taskStats.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                                        <span className="text-xs text-gray-500 truncate">{item.name}</span>
                                        <span className="text-xs font-bold text-gray-700 ml-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Charts row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Project status */}
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Projects by Status</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={projectStats} barSize={30}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                                    <Bar dataKey="value" name="Projects" radius={[6, 6, 0, 0]}>
                                        {projectStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Headcount by department */}
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Headcount by Department</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={deptStats} layout="vertical" barSize={16}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                                    <Bar dataKey="count" name="Employees" radius={[0, 6, 6, 0]}>
                                        {deptStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
