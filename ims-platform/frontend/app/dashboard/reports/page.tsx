'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '../../../lib/api';
import {
    BarChart2, Download, Users, Calendar, DollarSign, FolderKanban,
    Loader2, TrendingUp, TrendingDown, CheckCircle2, Clock, Package,
    Receipt, Target, Star, AlertCircle, Activity, UserCheck
} from 'lucide-react';
import clsx from 'clsx';

type ReportTab = 'attendance' | 'payroll' | 'projects' | 'employees' | 'expenses' | 'inventory' | 'leaves' | 'goals';

function downloadCSV(headers: string[], rows: (string | number | null | undefined)[][], filename: string) {
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
    return (
        <div className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

function AttendanceBar({ rate }: { rate: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className={clsx('h-1.5 rounded-full', rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
            <span className={clsx('text-xs font-bold w-10 text-right', rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600')}>{rate}%</span>
        </div>
    );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">{message}</p>
        </div>
    );
}

export default function ReportsPage() {
    const [tab, setTab] = useState<ReportTab>('attendance');
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [year, setYear] = useState(new Date().getFullYear().toString());

    // Data states
    const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);

    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (tab === 'attendance') {
                const { data } = await api.get('/api/attendance/monthly-report', { params: { month } });
                setAttendanceSummary(data);
            } else if (tab === 'payroll') {
                const { data } = await api.get('/api/salary', { params: { month } });
                setSalaries(data.salaries || []);
            } else if (tab === 'projects') {
                const { data } = await api.get('/api/projects', { params: { limit: 200 } });
                setProjects(data.projects || []);
            } else if (tab === 'employees') {
                const { data } = await api.get('/api/users', { params: { limit: 200 } });
                setEmployees(data.users || []);
            } else if (tab === 'expenses') {
                const { data } = await api.get('/api/expenses', { params: { month, limit: 200 } });
                setExpenses(data.expenses || []);
            } else if (tab === 'inventory') {
                const { data } = await api.get('/api/items', { params: { limit: 200 } });
                setInventory(data.items || []);
            } else if (tab === 'leaves') {
                const { data } = await api.get('/api/leaves', { params: { limit: 200 } });
                setLeaves(data.leaves || []);
            } else if (tab === 'goals') {
                const { data } = await api.get('/api/goals', { params: { limit: 200 } });
                setGoals(data.goals || []);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Failed to load report data';
            setError(msg);
        } finally { setLoading(false); }
    }, [tab, month]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const tabs: { key: ReportTab; label: string; icon: any }[] = [
        { key: 'attendance', label: 'Attendance', icon: UserCheck },
        { key: 'payroll', label: 'Payroll', icon: DollarSign },
        { key: 'leaves', label: 'Leaves', icon: Calendar },
        { key: 'projects', label: 'Projects', icon: FolderKanban },
        { key: 'goals', label: 'Goals', icon: Target },
        { key: 'expenses', label: 'Expenses', icon: Receipt },
        { key: 'inventory', label: 'Inventory', icon: Package },
        { key: 'employees', label: 'Employees', icon: Users },
    ];

    function handleExport() {
        if (tab === 'attendance' && attendanceSummary?.summary) {
            downloadCSV(
                ['Employee', 'Employee ID', 'Department', 'Role', 'Present', 'Absent', 'Late', 'WFH', 'On Leave', 'Half Day', 'Attendance Rate %', 'Working Days'],
                (attendanceSummary.summary || []).map((s: any) => [s.employee.name, s.employee.employeeId || '', s.employee.department || '', s.employee.role, s.present, s.absent, s.late, s.wfh, s.onLeave, s.halfDay, s.attendanceRate, s.workingDays]),
                `attendance_${month}.csv`
            );
        } else if (tab === 'payroll') {
            downloadCSV(
                ['Employee', 'Department', 'Base Salary', 'Deductions', 'Bonuses', 'Net Salary', 'Status', 'Month'],
                salaries.map(s => [s.employeeId?.name, s.employeeId?.department, s.baseSalary, s.deductions, s.bonuses, s.netSalary, s.status, s.month]),
                `payroll_${month}.csv`
            );
        } else if (tab === 'projects') {
            downloadCSV(
                ['Project', 'Status', 'Priority', 'Members', 'Deadline', 'Budget'],
                projects.map(p => [p.name, p.status, p.priority, p.members?.length, p.deadline ? new Date(p.deadline).toLocaleDateString() : '', p.budget || '']),
                `projects_report.csv`
            );
        } else if (tab === 'employees') {
            downloadCSV(
                ['Name', 'Email', 'Role', 'Department', 'Position', 'Employee ID', 'Joined', 'Status'],
                employees.map(e => [e.name, e.email, e.role, e.department, e.position, e.employeeId, e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '', e.isActive ? 'Active' : 'Inactive']),
                `employees_report.csv`
            );
        } else if (tab === 'expenses') {
            downloadCSV(
                ['Title', 'Category', 'Amount', 'Status', 'Employee', 'Date', 'Notes'],
                expenses.map(e => [e.title, e.category, e.amount, e.status, e.userId?.name || '', new Date(e.createdAt).toLocaleDateString(), e.notes || '']),
                `expenses_${month}.csv`
            );
        } else if (tab === 'leaves') {
            downloadCSV(
                ['Employee', 'Department', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason'],
                leaves.map(l => [l.userId?.name, l.userId?.department, l.leaveType, new Date(l.startDate).toLocaleDateString(), new Date(l.endDate).toLocaleDateString(), l.totalDays, l.status, l.reason || '']),
                `leaves_report.csv`
            );
        } else if (tab === 'goals') {
            downloadCSV(
                ['Title', 'Category', 'Assignee', 'Status', 'Progress %', 'Due Date', 'Priority'],
                goals.map(g => [g.title, g.category, g.assignedTo?.name || g.createdBy?.name || '', g.status, g.progress, g.dueDate ? new Date(g.dueDate).toLocaleDateString() : '', g.priority]),
                `goals_report.csv`
            );
        } else if (tab === 'inventory') {
            downloadCSV(
                ['Item', 'Category', 'SKU', 'Stock', 'Min Stock', 'Price', 'Status'],
                inventory.map(i => [i.name, i.category, i.sku, i.stock, i.minStock, i.price, i.stock <= i.minStock ? 'Low Stock' : 'OK']),
                `inventory_report.csv`
            );
        }
    }

    // ── Computed stats ─────────────────────────────────────────────────────────
    const expenseTotal = expenses.reduce((a, e) => a + (e.amount || 0), 0);
    const expenseApproved = expenses.filter(e => e.status === 'approved');
    const expensePending = expenses.filter(e => e.status === 'pending');
    const leavePending = leaves.filter(l => l.status === 'pending');
    const leaveApproved = leaves.filter(l => l.status === 'approved');
    const lowStock = inventory.filter(i => i.stock <= (i.minStock || 0));
    const deptCounts = employees.reduce((acc: Record<string, number>, e) => { const d = e.department || 'Unassigned'; acc[d] = (acc[d] || 0) + 1; return acc; }, {});

    return (
        <div>
            {/* Header */}
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Detailed operational reports across your entire IMS</p>
                </div>
                <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Tab switcher */}
            <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-max max-w-full">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={clsx(
                            'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                            tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Month/Year filter */}
            {['attendance', 'payroll', 'expenses', 'leaves'].includes(tab) && (
                <div className="flex gap-3 mb-5">
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input w-48" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-4 mb-5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <>
                    {/* ── ATTENDANCE ─────────────────────────────────────────────────────── */}
                    {tab === 'attendance' && (
                        <div>
                            {!attendanceSummary ? (
                                <EmptyState icon={UserCheck} message="No data found. Please check your attendance records." />
                            ) : (
                                <>
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                        <StatCard label="Total Staff" value={attendanceSummary.employeeCount || 0} icon={Users} color="bg-indigo-50 text-indigo-600" />
                                        <StatCard label="Working Days" value={attendanceSummary.workingDays || 0} icon={Calendar} color="bg-gray-50 text-gray-600" />
                                        <StatCard label="Total Present" value={attendanceSummary.totals?.present || 0} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                        <StatCard label="Total Absent" value={attendanceSummary.totals?.absent || 0} icon={TrendingDown} color="bg-red-50 text-red-600" />
                                        <StatCard label="WFH Days" value={attendanceSummary.totals?.wfh || 0} icon={Activity} color="bg-blue-50 text-blue-600" />
                                        <StatCard label="Late Arrivals" value={attendanceSummary.totals?.late || 0} icon={Clock} color="bg-amber-50 text-amber-600" />
                                    </div>

                                    <div className="card">
                                        <div className="px-5 py-4 border-b border-gray-100">
                                            <h3 className="font-semibold text-gray-900">Employee Attendance Summary — {month}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{attendanceSummary.workingDays} working days this month</p>
                                        </div>
                                        <div className="table-wrapper">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Employee</th>
                                                        <th>Dept / Role</th>
                                                        <th>Present</th>
                                                        <th>Absent</th>
                                                        <th>Late</th>
                                                        <th>WFH</th>
                                                        <th>Leave</th>
                                                        <th>Half</th>
                                                        <th>Attendance Rate</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(attendanceSummary.summary || []).length === 0 ? (
                                                        <tr><td colSpan={9} className="text-center text-gray-400 py-10">No employees found</td></tr>
                                                    ) : (attendanceSummary.summary || []).map((s: any) => (
                                                        <tr key={s.employee._id}>
                                                            <td>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                                                                        {s.employee.name?.[0]?.toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-gray-900">{s.employee.name}</p>
                                                                        <p className="text-xs text-gray-400">{s.employee.employeeId || '—'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <p className="text-sm text-gray-600">{s.employee.department || '—'}</p>
                                                                <p className="text-xs text-gray-400 capitalize">{s.employee.role}</p>
                                                            </td>
                                                            <td><span className="badge badge-green">{s.present}</span></td>
                                                            <td><span className="badge badge-red">{s.absent}</span></td>
                                                            <td><span className="badge badge-orange">{s.late}</span></td>
                                                            <td><span className="badge badge-blue">{s.wfh}</span></td>
                                                            <td><span className="badge badge-purple">{s.onLeave}</span></td>
                                                            <td><span className="badge badge-gray">{s.halfDay}</span></td>
                                                            <td className="w-40"><AttendanceBar rate={s.attendanceRate || 0} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── PAYROLL ───────────────────────────────────────────────────────── */}
                    {tab === 'payroll' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Payroll" value={`₹${salaries.reduce((a, s) => a + (s.netSalary || 0), 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
                                <StatCard label="Total Employees" value={salaries.length} icon={Users} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Paid" value={salaries.filter(s => s.status === 'paid').length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Pending" value={salaries.filter(s => s.status === 'pending').length} icon={Clock} color="bg-amber-50 text-amber-600" />
                            </div>
                            <div className="card">
                                {salaries.length === 0 ? <EmptyState icon={DollarSign} message="No payroll records for this month." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Employee</th><th>Base Salary</th><th>Deductions</th><th>Bonuses</th><th>Net Salary</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {salaries.map(s => (
                                                    <tr key={s._id}>
                                                        <td>
                                                            <p className="font-medium text-gray-900">{s.employeeId?.name}</p>
                                                            <p className="text-xs text-gray-400">{s.employeeId?.department}</p>
                                                        </td>
                                                        <td>₹{s.baseSalary?.toLocaleString()}</td>
                                                        <td className="text-red-500">-₹{(s.deductions || 0).toLocaleString()}</td>
                                                        <td className="text-emerald-600">+₹{(s.bonuses || 0).toLocaleString()}</td>
                                                        <td className="font-bold text-gray-900">₹{s.netSalary?.toLocaleString()}</td>
                                                        <td><span className={clsx('badge', s.status === 'paid' ? 'badge-green' : s.status === 'approved' ? 'badge-blue' : 'badge-orange')}>{s.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── LEAVES ────────────────────────────────────────────────────────── */}
                    {tab === 'leaves' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Requests" value={leaves.length} icon={Calendar} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Approved" value={leaveApproved.length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Pending" value={leavePending.length} icon={Clock} color="bg-amber-50 text-amber-600" />
                                <StatCard label="Rejected" value={leaves.filter(l => l.status === 'rejected').length} icon={TrendingDown} color="bg-red-50 text-red-600" />
                            </div>
                            {/* Type breakdown */}
                            {leaves.length > 0 && (() => {
                                const typeCount = leaves.reduce((acc: Record<string, number>, l) => { acc[l.leaveType] = (acc[l.leaveType] || 0) + 1; return acc; }, {});
                                return (
                                    <div className="card p-5 mb-5">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Leave Type Breakdown</p>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(typeCount).map(([type, count]) => (
                                                <div key={type} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                                    <span className="text-sm font-medium text-gray-700 capitalize">{type?.replace('_', ' ')}</span>
                                                    <span className="badge badge-blue">{count as number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="card">
                                {leaves.length === 0 ? <EmptyState icon={Calendar} message="No leave records found." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Employee</th><th>Type</th><th>Period</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead>
                                            <tbody>
                                                {leaves.map((l: any) => (
                                                    <tr key={l._id}>
                                                        <td>
                                                            <p className="font-medium text-gray-900">{l.userId?.name}</p>
                                                            <p className="text-xs text-gray-400">{l.userId?.department}</p>
                                                        </td>
                                                        <td><span className="badge badge-blue capitalize">{l.leaveType?.replace('_', ' ')}</span></td>
                                                        <td className="text-sm text-gray-600">
                                                            {new Date(l.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – {new Date(l.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td><span className="badge badge-gray">{l.totalDays || 1} day{l.totalDays > 1 ? 's' : ''}</span></td>
                                                        <td><span className={clsx('badge', l.status === 'approved' ? 'badge-green' : l.status === 'pending' ? 'badge-orange' : 'badge-red')}>{l.status}</span></td>
                                                        <td className="text-sm text-gray-500 max-w-[200px] truncate">{l.reason || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── PROJECTS ──────────────────────────────────────────────────────── */}
                    {tab === 'projects' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Projects" value={projects.length} icon={FolderKanban} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Completed" value={projects.filter(p => p.status === 'completed').length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="In Progress" value={projects.filter(p => p.status === 'in_progress').length} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
                                <StatCard label="Overdue" value={projects.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed').length} icon={AlertCircle} color="bg-red-50 text-red-600" />
                            </div>
                            <div className="card">
                                {projects.length === 0 ? <EmptyState icon={FolderKanban} message="No projects found." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Project</th><th>Status</th><th>Priority</th><th>Members</th><th>Deadline</th><th>Overdue?</th></tr></thead>
                                            <tbody>
                                                {projects.map(p => {
                                                    const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
                                                    return (
                                                        <tr key={p._id}>
                                                            <td>
                                                                <p className="font-medium text-gray-900">{p.name}</p>
                                                                <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>
                                                            </td>
                                                            <td><span className={clsx('badge', p.status === 'completed' ? 'badge-green' : p.status === 'in_progress' ? 'badge-blue' : 'badge-gray')}>{p.status?.replace('_', ' ')}</span></td>
                                                            <td><span className={clsx('badge', p.priority === 'critical' ? 'badge-red' : p.priority === 'high' ? 'badge-orange' : 'badge-gray')}>{p.priority}</span></td>
                                                            <td className="text-sm text-gray-600">{p.members?.length || 0} members</td>
                                                            <td className="text-sm text-gray-500">{p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                                            <td>{isOverdue ? <span className="badge badge-red">Yes</span> : <span className="badge badge-green">No</span>}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── GOALS ─────────────────────────────────────────────────────────── */}
                    {tab === 'goals' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Goals" value={goals.length} icon={Target} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Completed" value={goals.filter(g => g.status === 'completed').length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="In Progress" value={goals.filter(g => g.status === 'in_progress').length} icon={Activity} color="bg-blue-50 text-blue-600" />
                                <StatCard label="Avg Progress" value={`${Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / Math.max(goals.length, 1))}%`} icon={TrendingUp} color="bg-purple-50 text-purple-600" />
                            </div>
                            <div className="card">
                                {goals.length === 0 ? <EmptyState icon={Target} message="No goals found." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Goal</th><th>Assigned To</th><th>Category</th><th>Due Date</th><th>Progress</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {goals.map((g: any) => (
                                                    <tr key={g._id}>
                                                        <td>
                                                            <p className="font-medium text-gray-900">{g.title}</p>
                                                            <p className="text-xs text-gray-400 line-clamp-1">{g.description}</p>
                                                        </td>
                                                        <td className="text-sm text-gray-600">{g.assignedTo?.name || g.createdBy?.name || '—'}</td>
                                                        <td><span className="badge badge-blue capitalize">{g.category || '—'}</span></td>
                                                        <td className="text-sm text-gray-500">{g.dueDate ? new Date(g.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                                        <td className="w-36">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                                                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${Math.min(g.progress || 0, 100)}%` }} />
                                                                </div>
                                                                <span className="text-xs text-gray-500 w-8 text-right">{g.progress || 0}%</span>
                                                            </div>
                                                        </td>
                                                        <td><span className={clsx('badge', g.status === 'completed' ? 'badge-green' : g.status === 'in_progress' ? 'badge-blue' : 'badge-gray')}>{g.status?.replace('_', ' ')}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── EXPENSES ──────────────────────────────────────────────────────── */}
                    {tab === 'expenses' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Expenses" value={`₹${expenseTotal.toLocaleString()}`} icon={Receipt} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Requests" value={expenses.length} icon={BarChart2} color="bg-gray-50 text-gray-600" />
                                <StatCard label="Approved" value={expenseApproved.length} sub={`₹${expenseApproved.reduce((a, e) => a + (e.amount || 0), 0).toLocaleString()}`} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Pending" value={expensePending.length} sub={`₹${expensePending.reduce((a, e) => a + (e.amount || 0), 0).toLocaleString()}`} icon={Clock} color="bg-amber-50 text-amber-600" />
                            </div>
                            <div className="card">
                                {expenses.length === 0 ? <EmptyState icon={Receipt} message="No expense records for this period." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Title</th><th>Employee</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {expenses.map((e: any) => (
                                                    <tr key={e._id}>
                                                        <td>
                                                            <p className="font-medium text-gray-900">{e.title}</p>
                                                            <p className="text-xs text-gray-400 line-clamp-1">{e.notes}</p>
                                                        </td>
                                                        <td className="text-sm text-gray-600">{e.userId?.name || '—'}</td>
                                                        <td><span className="badge badge-blue capitalize">{e.category}</span></td>
                                                        <td className="font-semibold text-gray-900">₹{e.amount?.toLocaleString()}</td>
                                                        <td className="text-sm text-gray-500">{new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                        <td><span className={clsx('badge', e.status === 'approved' ? 'badge-green' : e.status === 'pending' ? 'badge-orange' : 'badge-red')}>{e.status}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── INVENTORY ─────────────────────────────────────────────────────── */}
                    {tab === 'inventory' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Items" value={inventory.length} icon={Package} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Low Stock" value={lowStock.length} icon={AlertCircle} color="bg-red-50 text-red-600" />
                                <StatCard label="Total Stock Value" value={`₹${inventory.reduce((a, i) => a + ((i.price || 0) * (i.stock || 0)), 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
                                <StatCard label="Categories" value={new Set(inventory.map(i => i.category)).size} icon={BarChart2} color="bg-purple-50 text-purple-600" />
                            </div>
                            {lowStock.length > 0 && (
                                <div className="flex items-center gap-2 p-3.5 mb-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span><strong>{lowStock.length} items</strong> are below minimum stock levels and need restocking.</span>
                                </div>
                            )}
                            <div className="card">
                                {inventory.length === 0 ? <EmptyState icon={Package} message="No inventory items found." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Item</th><th>SKU</th><th>Category</th><th>Stock</th><th>Min Stock</th><th>Price</th><th>Value</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {inventory.map((i: any) => {
                                                    const isLow = i.stock <= (i.minStock || 0);
                                                    return (
                                                        <tr key={i._id}>
                                                            <td><p className="font-medium text-gray-900">{i.name}</p></td>
                                                            <td className="text-xs text-gray-400 font-mono">{i.sku || '—'}</td>
                                                            <td><span className="badge badge-blue capitalize">{i.category || '—'}</span></td>
                                                            <td><span className={clsx('badge', isLow ? 'badge-red' : 'badge-green')}>{i.stock}</span></td>
                                                            <td className="text-sm text-gray-500">{i.minStock || 0}</td>
                                                            <td className="text-sm text-gray-700">₹{(i.price || 0).toLocaleString()}</td>
                                                            <td className="font-medium text-gray-900">₹{((i.price || 0) * (i.stock || 0)).toLocaleString()}</td>
                                                            <td><span className={clsx('badge', isLow ? 'badge-red' : 'badge-green')}>{isLow ? 'Low Stock' : 'OK'}</span></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── EMPLOYEES ─────────────────────────────────────────────────────── */}
                    {tab === 'employees' && (
                        <div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Employees" value={employees.length} icon={Users} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Active" value={employees.filter(e => e.isActive).length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Inactive" value={employees.filter(e => !e.isActive).length} icon={TrendingDown} color="bg-red-50 text-red-600" />
                                <StatCard label="Departments" value={new Set(employees.map(e => e.department).filter(Boolean)).size} icon={BarChart2} color="bg-purple-50 text-purple-600" />
                            </div>

                            {/* Department breakdown */}
                            {Object.keys(deptCounts).length > 0 && (
                                <div className="card p-5 mb-5">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Department Breakdown</p>
                                    <div className="flex flex-wrap gap-3">
                                        {Object.entries(deptCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([dept, count]) => (
                                            <div key={dept} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                <span className="text-sm font-medium text-gray-700">{dept}</span>
                                                <span className="badge badge-indigo">{count as number}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="card">
                                {employees.length === 0 ? <EmptyState icon={Users} message="No employees found." /> : (
                                    <div className="table-wrapper">
                                        <table className="table">
                                            <thead><tr><th>Employee</th><th>Role</th><th>Department</th><th>Position</th><th>Employee ID</th><th>Joined</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {employees.map(e => (
                                                    <tr key={e._id}>
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">{e.name?.[0]?.toUpperCase()}</div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{e.name}</p>
                                                                    <p className="text-xs text-gray-400">{e.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span className="badge badge-blue capitalize">{e.role}</span></td>
                                                        <td className="text-gray-600 text-sm">{e.department || '—'}</td>
                                                        <td className="text-gray-600 text-sm">{e.position || '—'}</td>
                                                        <td className="text-xs text-gray-400 font-mono">{e.employeeId || '—'}</td>
                                                        <td className="text-sm text-gray-500">{e.joiningDate ? new Date(e.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                                        <td><span className={clsx('badge', e.isActive ? 'badge-green' : 'badge-red')}>{e.isActive ? 'Active' : 'Inactive'}</span></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
