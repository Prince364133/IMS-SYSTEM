'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
    BarChart2, Download, Users, Calendar, DollarSign, FolderKanban,
    Loader2, TrendingUp, TrendingDown, CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';

type ReportTab = 'attendance' | 'payroll' | 'projects' | 'employees';

function downloadCSV(headers: string[], rows: string[][], filename: string) {
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    return (
        <div className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        </div>
    );
}

export default function ReportsPage() {
    const [tab, setTab] = useState<ReportTab>('attendance');
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        setLoading(true);
        if (tab === 'attendance') {
            api.get('/api/attendance/monthly-report', { params: { month } })
                .then(({ data }) => setAttendanceSummary(data))
                .finally(() => setLoading(false));
        } else if (tab === 'payroll') {
            api.get('/api/salary', { params: { month } })
                .then(({ data }) => setSalaries(data.salaries || []))
                .finally(() => setLoading(false));
        } else if (tab === 'projects') {
            api.get('/api/projects', { params: { limit: 100 } })
                .then(({ data }) => setProjects(data.projects || []))
                .finally(() => setLoading(false));
        } else if (tab === 'employees') {
            api.get('/api/users', { params: { limit: 100 } })
                .then(({ data }) => setEmployees(data.users || []))
                .finally(() => setLoading(false));
        }
    }, [tab, month]);

    const tabs: { key: ReportTab; label: string; icon: any }[] = [
        { key: 'attendance', label: 'Attendance', icon: Calendar },
        { key: 'payroll', label: 'Payroll', icon: DollarSign },
        { key: 'projects', label: 'Projects', icon: FolderKanban },
        { key: 'employees', label: 'Employees', icon: Users },
    ];

    function handleExport() {
        if (tab === 'payroll') {
            downloadCSV(
                ['Employee', 'Department', 'Base Salary', 'Deductions', 'Bonuses', 'Net Salary', 'Status'],
                salaries.map(s => [s.employeeId?.name, s.employeeId?.department, s.baseSalary, s.deductions, s.bonuses, s.netSalary, s.status]),
                `payroll_${month}.csv`
            );
        } else if (tab === 'projects') {
            downloadCSV(
                ['Project', 'Status', 'Priority', 'Members', 'Deadline'],
                projects.map(p => [p.name, p.status, p.priority, p.members?.length, p.deadline ? new Date(p.deadline).toLocaleDateString() : '']),
                `projects_report.csv`
            );
        } else if (tab === 'employees') {
            downloadCSV(
                ['Name', 'Email', 'Role', 'Department', 'Position', 'Joined', 'Status'],
                employees.map(e => [e.name, e.email, e.role, e.department, e.position, e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : '', e.isActive ? 'Active' : 'Inactive']),
                `employees_report.csv`
            );
        } else if (tab === 'attendance' && attendanceSummary?.summary) {
            downloadCSV(
                ['Employee', 'Employee ID', 'Department', 'Present', 'Absent', 'Late', 'WFH', 'On Leave', 'Half Day'],
                (attendanceSummary.summary || []).map((s: any) => [s.employee.name, s.employee.employeeId, s.employee.department, s.present, s.absent, s.late, s.wfh, s.onLeave, s.halfDay]),
                `attendance_${month}.csv`
            );
        }
    }

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Reports</h1>
                    <p className="page-subtitle">Detailed operational reports and analytics</p>
                </div>
                <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-max">
                {tabs.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                            tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Month picker for time-based reports */}
            {(tab === 'attendance' || tab === 'payroll') && (
                <div className="flex gap-3 mb-5">
                    <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input w-48" />
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <>
                    {/* Attendance Report */}
                    {tab === 'attendance' && attendanceSummary && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <StatCard label="Total Employees" value={attendanceSummary.employeeCount || 0} icon={Users} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Present (avg)" value={Math.round((attendanceSummary.summary || []).reduce((a: number, s: any) => a + s.present, 0) / Math.max(attendanceSummary.employeeCount, 1))} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Absent (avg)" value={Math.round((attendanceSummary.summary || []).reduce((a: number, s: any) => a + s.absent, 0) / Math.max(attendanceSummary.employeeCount, 1))} icon={TrendingDown} color="bg-red-50 text-red-600" />
                                <StatCard label="On Leave (avg)" value={Math.round((attendanceSummary.summary || []).reduce((a: number, s: any) => a + s.onLeave, 0) / Math.max(attendanceSummary.employeeCount, 1))} icon={Calendar} color="bg-purple-50 text-purple-600" />
                            </div>
                            <div className="card">
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Department</th>
                                                <th>Present</th>
                                                <th>Absent</th>
                                                <th>Late</th>
                                                <th>WFH</th>
                                                <th>Leave</th>
                                                <th>Half Day</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(attendanceSummary.summary || []).map((s: any) => (
                                                <tr key={s.employee._id}>
                                                    <td>
                                                        <p className="font-medium text-gray-900">{s.employee.name}</p>
                                                        <p className="text-xs text-gray-400">{s.employee.employeeId}</p>
                                                    </td>
                                                    <td className="text-gray-500 text-sm">{s.employee.department || '—'}</td>
                                                    <td><span className="badge badge-green">{s.present}</span></td>
                                                    <td><span className="badge badge-red">{s.absent}</span></td>
                                                    <td><span className="badge badge-orange">{s.late}</span></td>
                                                    <td><span className="badge badge-blue">{s.wfh}</span></td>
                                                    <td><span className="badge badge-purple">{s.onLeave}</span></td>
                                                    <td><span className="badge badge-gray">{s.halfDay}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payroll Report */}
                    {tab === 'payroll' && (
                        <div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <StatCard label="Total Payroll" value={`₹${salaries.reduce((a, s) => a + (s.netSalary || 0), 0).toLocaleString()}`} icon={DollarSign} color="bg-emerald-50 text-emerald-600" />
                                <StatCard label="Paid" value={salaries.filter(s => s.status === 'paid').length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Pending" value={salaries.filter(s => s.status === 'pending').length} icon={TrendingUp} color="bg-orange-50 text-orange-600" />
                            </div>
                            <div className="card">
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Base Salary</th>
                                                <th>Deductions</th>
                                                <th>Bonuses</th>
                                                <th>Net Salary</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salaries.map(s => (
                                                <tr key={s._id}>
                                                    <td>
                                                        <p className="font-medium text-gray-900">{s.employeeId?.name}</p>
                                                        <p className="text-xs text-gray-400">{s.employeeId?.department}</p>
                                                    </td>
                                                    <td>₹{s.baseSalary?.toLocaleString()}</td>
                                                    <td className="text-red-500">-₹{s.deductions?.toLocaleString() || 0}</td>
                                                    <td className="text-emerald-600">+₹{s.bonuses?.toLocaleString() || 0}</td>
                                                    <td className="font-bold">₹{s.netSalary?.toLocaleString()}</td>
                                                    <td><span className={clsx('badge', s.status === 'paid' ? 'badge-green' : s.status === 'approved' ? 'badge-blue' : 'badge-orange')}>{s.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Projects Report */}
                    {tab === 'projects' && (
                        <div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <StatCard label="Total Projects" value={projects.length} icon={FolderKanban} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Completed" value={projects.filter(p => p.status === 'completed').length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="In Progress" value={projects.filter(p => p.status === 'in_progress').length} icon={TrendingUp} color="bg-blue-50 text-blue-600" />
                            </div>
                            <div className="card">
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Project</th>
                                                <th>Status</th>
                                                <th>Priority</th>
                                                <th>Members</th>
                                                <th>Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.map(p => (
                                                <tr key={p._id}>
                                                    <td>
                                                        <p className="font-medium text-gray-900">{p.name}</p>
                                                        <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>
                                                    </td>
                                                    <td><span className={clsx('badge', p.status === 'completed' ? 'badge-green' : p.status === 'in_progress' ? 'badge-blue' : 'badge-gray')}>{p.status?.replace('_', ' ')}</span></td>
                                                    <td><span className={clsx('badge', p.priority === 'critical' ? 'badge-red' : p.priority === 'high' ? 'badge-orange' : 'badge-gray')}>{p.priority}</span></td>
                                                    <td>{p.members?.length || 0} members</td>
                                                    <td className="text-sm text-gray-500">{p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Employees Report */}
                    {tab === 'employees' && (
                        <div>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <StatCard label="Total Employees" value={employees.length} icon={Users} color="bg-indigo-50 text-indigo-600" />
                                <StatCard label="Active" value={employees.filter(e => e.isActive).length} icon={CheckCircle2} color="bg-green-50 text-green-600" />
                                <StatCard label="Departments" value={new Set(employees.map(e => e.department).filter(Boolean)).size} icon={BarChart2} color="bg-purple-50 text-purple-600" />
                            </div>
                            <div className="card">
                                <div className="table-wrapper">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th>Role</th>
                                                <th>Department</th>
                                                <th>Position</th>
                                                <th>Joined</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map(e => (
                                                <tr key={e._id}>
                                                    <td>
                                                        <p className="font-medium text-gray-900">{e.name}</p>
                                                        <p className="text-xs text-gray-400">{e.email}</p>
                                                    </td>
                                                    <td><span className="badge badge-blue">{e.role}</span></td>
                                                    <td className="text-gray-600 text-sm">{e.department || '—'}</td>
                                                    <td className="text-gray-600 text-sm">{e.position || '—'}</td>
                                                    <td className="text-sm text-gray-500">{e.joiningDate ? new Date(e.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                                    <td><span className={clsx('badge', e.isActive ? 'badge-green' : 'badge-red')}>{e.isActive ? 'Active' : 'Inactive'}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
