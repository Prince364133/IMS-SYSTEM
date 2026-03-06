'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, CreditCard, AlertCircle, ArrowUpRight, BarChart2, Star } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import saApi from '../../lib/superadmin-api';

const COLORS = ['#7c3aed', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
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

function StatCard({ label, value, icon: Icon, color, sub }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start justify-between gap-4 hover:border-slate-700 transition-colors">
            <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-bold text-white">{typeof value === 'number' && label.includes('Revenue') ? `₹${value.toLocaleString('en-IN')}` : value?.toLocaleString()}</p>
                {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
        </div>
    );
}

export default function SuperAdminOverviewPage() {
    const [data, setData] = useState<{ stats: Stats; charts: any } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        saApi.get('/overview').then(({ data }) => setData(data)).finally(() => setLoading(false));
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

    if (loading) return (
        <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
    );

    const s = data?.stats;
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
                <p className="text-slate-400 text-sm mt-1">Real-time platform analytics and key metrics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Companies" value={s?.totalCompanies} icon={Building2} color="bg-violet-600" sub={`${s?.newCompaniesThisMonth} new this month`} />
                <StatCard label="Active Companies" value={s?.activeCompanies} icon={Star} color="bg-emerald-600" />
                <StatCard label="Total Users" value={s?.totalUsers} icon={Users} color="bg-blue-600" />
                <StatCard label="Monthly Revenue" value={s?.monthlyRevenue} icon={TrendingUp} color="bg-amber-600" />
                <StatCard label="Total Subscriptions" value={s?.totalSubscriptions} icon={CreditCard} color="bg-indigo-600" />
                <StatCard label="Active Subscriptions" value={s?.activeSubscriptions} icon={ArrowUpRight} color="bg-teal-600" />
                <StatCard label="Failed Payments" value={s?.failedPayments} icon={AlertCircle} color="bg-red-600" />
                <StatCard label="Analytics" value="Live" icon={BarChart2} color="bg-purple-600" sub="Data updates every visit" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-2 gap-4">
                {/* Revenue Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Revenue Growth</h3>
                    {revenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
                                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <p className="text-slate-500 text-sm text-center py-16">No revenue data yet</p>}
                </div>

                {/* Company Growth */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Company Growth</h3>
                    {companyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={companyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <p className="text-slate-500 text-sm text-center py-16">No company data yet</p>}
                </div>
            </div>

            {/* Plan Distribution Pie */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Subscription Plan Distribution</h3>
                {pieData.length > 0 ? (
                    <div className="flex items-center justify-center gap-12">
                        <ResponsiveContainer width={220} height={220}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={55} strokeWidth={0}>
                                    {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                            {pieData.map((d: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-slate-300">{d.name}</span>
                                    <span className="text-slate-500 font-mono">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : <p className="text-slate-500 text-sm text-center py-12">No subscription data yet</p>}
            </div>
        </div>
    );
}
