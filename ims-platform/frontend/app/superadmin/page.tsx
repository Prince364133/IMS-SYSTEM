'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, CreditCard, AlertCircle, ArrowUpRight, BarChart2, Star, RefreshCw, Shield } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import saApi from '../../lib/superadmin-api';

const COLORS = ['#0ea5e9', '#22d3ee', '#2dd4bf', '#10b981', '#64748b', '#0f172a'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Stats {
    totalCompanies: number;
    activeCompanies: number;
    newCompaniesThisMonth: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    failedPayments: number;
    monthlyRevenue: number;
    totalUsers: number;
}

function StatCard({ label, value, icon: Icon, color, sub, gradient }: any) {
    return (
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-6 flex items-start justify-between gap-4 hover:border-sky-500/30 hover:shadow-lg hover:shadow-sky-500/5 transition-all group shadow-sm">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full blur-2xl opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className="relative z-10">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                        {typeof value === 'number' && label.includes('Revenue') ? `₹${value.toLocaleString('en-IN')}` : value?.toLocaleString()}
                    </p>
                </div>
                {sub && <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>}
            </div>
            <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${gradient} shadow-md shadow-sky-500/10`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    );
}

export default function SuperAdminOverviewPage() {
    const [data, setData] = useState<{ stats: Stats; charts: any } | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = () => {
        setLoading(true);
        saApi.get('/overview').then(({ data }) => setData(data)).finally(() => setLoading(false));
    }

    useEffect(() => {
        loadData();
    }, []);

    const revenueData = data?.charts?.revenueChart?.map((r: any) => ({
        name: MONTHS[(r._id.month - 1)],
        revenue: r.revenue,
    })) || [];

    const companyData = data?.charts?.companyChart?.map((r: any) => ({
        name: MONTHS[(r._id.month - 1)],
        count: r.count,
    })) || [];

    const pieData = data?.charts?.planDist?.map((r: any) => ({
        name: r._id || 'Unknown',
        value: r.count,
    })) || [];

    if (loading && !data) return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />)}
        </div>
    );

    const s = data?.stats;
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Intelligence</h1>
                    <p className="text-slate-500 text-sm mt-1.5 font-medium">Real-time macro analytics and system health metrics</p>
                </div>
                <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-sky-600 hover:bg-slate-50 transition-all shadow-sm">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
                    Refresh Sync
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Companies" value={s?.totalCompanies} icon={Building2} gradient="from-violet-500 to-indigo-600" sub={`${s?.newCompaniesThisMonth || 0} registered this month`} />
                <StatCard label="Active Clients" value={s?.activeCompanies} icon={Star} gradient="from-emerald-400 to-teal-500" sub="Currently active workspaces" />
                <StatCard label="Total Users" value={s?.totalUsers} icon={Users} gradient="from-blue-500 to-cyan-500" sub="Across all tenant workspaces" />
                <StatCard label="Monthly Revenue" value={s?.monthlyRevenue} icon={TrendingUp} gradient="from-amber-400 to-orange-500" sub="Gross MRR tracked" />

                <StatCard label="Total Subscriptions" value={s?.totalSubscriptions} icon={CreditCard} gradient="from-fuchsia-500 to-pink-600" sub="Lifetime platform subscriptions" />
                <StatCard label="Active Subs" value={s?.activeSubscriptions} icon={ArrowUpRight} gradient="from-teal-400 to-emerald-500" sub="Currently generating revenue" />
                <StatCard label="Failed Payments" value={s?.failedPayments} icon={AlertCircle} gradient="from-rose-500 to-red-600" sub="Requires immediate attention" />
                <StatCard label="System Status" value="Healthy" icon={BarChart2} gradient="from-slate-600 to-slate-700" sub="All microservices operational" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Trajectory</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Aggregated MRR growth across all plans</p>
                        </div>
                        <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/10">
                            <TrendingUp className="w-5 h-5 text-sky-600" />
                        </div>
                    </div>

                    {revenueData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#0ea5e9', fontWeight: 600 }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#38bdf8' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                            <BarChart2 className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">Accumulating revenue data...</p>
                        </div>
                    )}
                </div>

                {/* Company Growth */}
                <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Workspace Acquisition</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">New tenant registrations per month</p>
                        </div>
                        <div className="p-2 bg-sky-600/10 rounded-xl border border-sky-600/10">
                            <Building2 className="w-5 h-5 text-sky-600" />
                        </div>
                    </div>

                    {companyData.length > 0 ? (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={companyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ color: '#0ea5e9', fontWeight: 600 }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 6, 6]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                            <Building2 className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">Awaiting new workspace registrations...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Plan Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-7 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Plan Vectors</h3>
                            <p className="text-xs text-slate-500 mt-1 font-medium">Subscription tier popularity</p>
                        </div>
                    </div>

                    {pieData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} stroke="none">
                                            {pieData.map((d: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                                            itemStyle={{ color: '#10b981', fontWeight: 600 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="w-full mt-4 space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                {pieData.map((d: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: COLORS[i % COLORS.length], boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}40` }} />
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors capitalize">{d.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 bg-white border border-slate-100 px-2 py-0.5 rounded-lg shadow-sm">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                            <BarChart2 className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">No tier data</p>
                        </div>
                    )}
                </div>

                {/* Placeholder Quick Actions (Can be expanded later) */}
                <div className="lg:col-span-2 bg-gradient-to-br from-white to-sky-50 border border-slate-200 rounded-3xl p-7 flex flex-col justify-between relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg"><Star className="w-5 h-5 fill-sky-600/20" /></div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Command Center v2</h3>
                        </div>
                        <p className="text-slate-600 text-sm max-w-lg leading-relaxed font-medium">
                            Platform intelligence overview provides real-time macro metrics across the ecosystem.
                            Navigate via the terminal to manage tenants, security protocols, and billing limits.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                        {/* Quick Links */}
                        <a href="/superadmin/companies" className="p-4 bg-white border border-slate-200 hover:border-sky-500/30 hover:bg-sky-50 rounded-2xl transition-all group flex flex-col items-center justify-center text-center shadow-sm">
                            <Building2 className="w-6 h-6 text-slate-400 group-hover:text-sky-600 mb-2 transition-colors" />
                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider">Companies</p>
                        </a>
                        <a href="/superadmin/subscriptions" className="p-4 bg-white border border-slate-200 hover:border-sky-500/30 hover:bg-sky-50 rounded-2xl transition-all group flex flex-col items-center justify-center text-center shadow-sm">
                            <CreditCard className="w-6 h-6 text-slate-400 group-hover:text-sky-600 mb-2 transition-colors" />
                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider">Billing</p>
                        </a>
                        <a href="/superadmin/plans" className="p-4 bg-white border border-slate-200 hover:border-sky-500/30 hover:bg-sky-50 rounded-2xl transition-all group flex flex-col items-center justify-center text-center shadow-sm">
                            <Star className="w-6 h-6 text-slate-400 group-hover:text-sky-600 mb-2 transition-colors" />
                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider">Tiers</p>
                        </a>
                        <a href="/superadmin/settings" className="p-4 bg-white border border-slate-200 hover:border-sky-500/30 hover:bg-sky-50 rounded-2xl transition-all group flex flex-col items-center justify-center text-center shadow-sm">
                            <Shield className="w-6 h-6 text-slate-400 group-hover:text-sky-600 mb-2 transition-colors" />
                            <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider">Security</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
