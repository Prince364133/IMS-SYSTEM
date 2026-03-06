'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase,
    Building2, Hash, CheckSquare, Clock, TrendingUp, Edit2,
    Loader2, AlertCircle, DollarSign, ShieldCheck, PowerOff, Power
} from 'lucide-react';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '../../../../lib/auth-context';
import AddEmployeeModal from '../../../../components/AddEmployeeModal';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
    admin: 'badge-red',
    manager: 'badge-purple',
    hr: 'badge-blue',
    employee: 'badge-green',
    client: 'badge-orange',
};

function StatCard({ icon: Icon, label, value, sub, color }: any) {
    return (
        <div className="card p-4 flex items-center gap-4">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
                {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function EmployeeProfilePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [emp, setEmp] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'salary' | 'attendance'>('overview');
    const [showEdit, setShowEdit] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        Promise.all([
            api.get(`/api/users/${id}`),
            api.get('/api/tasks', { params: { assigneeId: id, limit: 30 } }),
            api.get('/api/salary', { params: { employeeId: id, limit: 12 } }),
            api.get('/api/attendance/report', { params: { employeeId: id } }),
        ])
            .then(([empRes, taskRes, salRes, attRes]) => {
                setEmp(empRes.data.user);
                setTasks(taskRes.data.tasks);
                setSalaries(salRes.data.salaries || []);
                setAttendance(attRes.data.report || []);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    async function handleToggleActive() {
        if (!emp) return;
        const action = emp.isActive !== false ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this employee?`)) return;
        setDeactivating(true);
        try {
            await api.put(`/api/users/${id}`, { isActive: emp.isActive === false });
            setEmp((prev: any) => ({ ...prev, isActive: prev.isActive === false }));
            toast.success(`Employee ${action}d successfully`);
        } catch { toast.error(`Failed to ${action} employee`); }
        finally { setDeactivating(false); }
    }

    async function handleDelete() {
        if (!confirm('Are you SURE you want to permanently delete this user? This action cannot be undone.')) return;
        try {
            await api.delete(`/api/users/${id}`);
            toast.success('User deleted successfully');
            router.push('/dashboard/employees');
        } catch { toast.error('Failed to delete user'); }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!emp) {
        return (
            <div className="text-center py-32">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Employee not found</p>
                <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
            </div>
        );
    }

    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const todayAtt = attendance.filter((a: any) => a.status === 'present').length;
    const totalAtt = attendance.length;
    const attendRate = totalAtt > 0 ? Math.round((todayAtt / totalAtt) * 100) : 0;
    const latestSalary = salaries[0];

    return (
        <div>
            {showEdit && emp && (
                <AddEmployeeModal
                    editUser={emp}
                    onClose={() => setShowEdit(false)}
                    onSuccess={(updated) => { setShowEdit(false); setEmp((prev: any) => ({ ...prev, ...updated })); }}
                />
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
                <Link href="/dashboard/employees" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Employees
                </Link>
                <span>/</span>
                <span className="text-gray-700 font-medium">{emp.name}</span>
            </div>

            {/* Profile Header */}
            <div className="card p-6 mb-5">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                            {emp.photoUrl
                                ? <img src={emp.photoUrl} className="w-full h-full rounded-2xl object-cover" alt={emp.name} />
                                : <span className="text-white text-3xl font-black">{emp.name?.[0]?.toUpperCase()}</span>
                            }
                        </div>
                        <div className={clsx(
                            'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                            emp.isActive !== false ? 'bg-emerald-500' : 'bg-gray-300'
                        )} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900">{emp.name}</h1>
                                <p className="text-gray-500 text-sm mt-0.5">{emp.position || 'No position set'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex flex-wrap gap-1">
                                    {(emp.roles || [emp.role]).map((r: string) => (
                                        <span key={r} className={clsx('badge', ROLE_COLORS[r] || 'badge-gray')}>{r}</span>
                                    ))}
                                </div>
                                {(user?.role === 'admin' || user?.role === 'hr') && (
                                    <>
                                        <button onClick={() => setShowEdit(true)} className="btn-secondary text-xs"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                                        <button
                                            onClick={handleToggleActive}
                                            disabled={deactivating}
                                            className={clsx('btn-secondary text-xs', emp.isActive === false ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-amber-500 border-amber-200 hover:bg-amber-50')}
                                        >
                                            {deactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : emp.isActive === false ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                                            {emp.isActive === false ? 'Activate' : 'Deactivate'}
                                        </button>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={handleDelete}
                                                className="btn-secondary text-xs text-red-600 border-red-200 hover:bg-red-50"
                                            >
                                                <AlertCircle className="w-3.5 h-3.5" /> Delete User
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                            {[
                                { icon: Mail, label: emp.email, href: `mailto:${emp.email}` },
                                { icon: Phone, label: emp.phone || 'No phone', href: null },
                                { icon: Building2, label: emp.department || 'No dept', href: null },
                                { icon: Hash, label: emp.employeeId || 'No ID', href: null },
                                { icon: MapPin, label: emp.address || 'No address', href: null },
                                { icon: Calendar, label: emp.joinDate ? `Joined ${format(new Date(emp.joinDate), 'MMM yyyy')}` : 'Join date unknown', href: null },
                            ].map(({ icon: Icon, label, href }, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    {href
                                        ? <a href={href} className="hover:text-indigo-600 transition-colors truncate">{label}</a>
                                        : <span className="truncate">{label}</span>
                                    }
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard icon={CheckSquare} label="Tasks assigned" value={tasks.length} sub={`${doneTasks} completed`} color="bg-indigo-100 text-indigo-600" />
                <StatCard icon={TrendingUp} label="Task completion" value={`${tasks.length ? Math.round(doneTasks / tasks.length * 100) : 0}%`} color="bg-emerald-100 text-emerald-600" />
                <StatCard icon={Calendar} label="Attendance rate" value={`${attendRate}%`} sub={`${todayAtt}/${totalAtt} days`} color="bg-amber-100 text-amber-600" />
                <StatCard
                    icon={DollarSign}
                    label="Latest salary"
                    value={latestSalary ? `₹${latestSalary.netSalary?.toLocaleString('en-IN')}` : '—'}
                    sub={latestSalary?.month}
                    color="bg-blue-100 text-blue-600"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-max">
                {(['overview', 'tasks', 'salary', 'attendance'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={clsx(
                            'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                            activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >{t}</button>
                ))}
            </div>

            {/* ── Tab: Overview ── */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent Tasks */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
                            <button onClick={() => setActiveTab('tasks')} className="text-xs text-indigo-600 hover:underline">View all</button>
                        </div>
                        <div className="space-y-2">
                            {tasks.slice(0, 5).map(task => (
                                <div key={task._id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                                    <div className={clsx(
                                        'w-2 h-2 rounded-full flex-shrink-0',
                                        task.status === 'done' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                                    )} />
                                    <p className="flex-1 text-sm text-gray-700 truncate">{task.title}</p>
                                    <span className="text-xs text-gray-400 flex-shrink-0">{task.priority}</span>
                                </div>
                            ))}
                            {tasks.length === 0 && <p className="text-sm text-gray-400 italic">No tasks assigned</p>}
                        </div>
                    </div>

                    {/* Hr info */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-gray-900 mb-3">HR Information</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { label: 'Department', v: emp.department || '—' },
                                { label: 'Position', v: emp.position || '—' },
                                { label: 'Employee ID', v: emp.employeeId || '—' },
                                { label: 'MFA Enabled', v: emp.mfaEnabled ? '✅ Yes' : '❌ No' },
                                { label: 'Account Status', v: emp.isActive !== false ? '🟢 Active' : '🔴 Inactive' },
                            ].map(({ label, v }) => (
                                <div key={label} className="flex justify-between">
                                    <span className="text-gray-400">{label}</span>
                                    <span className="font-medium text-gray-800">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab: Tasks ── */}
            {activeTab === 'tasks' && (
                <div className="card overflow-hidden">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Project</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task._id}>
                                        <td className="font-medium text-gray-900">{task.title}</td>
                                        <td className="text-gray-500">{task.projectId?.name || '—'}</td>
                                        <td>
                                            <span className={clsx('badge',
                                                task.status === 'done' ? 'badge-green' :
                                                    task.status === 'in_progress' ? 'badge-blue' :
                                                        task.status === 'in_review' ? 'badge-orange' : 'badge-gray'
                                            )}>{task.status?.replace('_', ' ')}</span>
                                        </td>
                                        <td>
                                            <span className={clsx('badge',
                                                task.priority === 'critical' ? 'badge-red' :
                                                    task.priority === 'high' ? 'badge-orange' :
                                                        task.priority === 'medium' ? 'badge-blue' : 'badge-gray'
                                            )}>{task.priority}</span>
                                        </td>
                                        <td className="text-gray-500 text-xs">
                                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No tasks assigned</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Tab: Salary ── */}
            {activeTab === 'salary' && (
                <div className="card overflow-hidden">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Basic</th>
                                    <th>Allowances</th>
                                    <th>Deductions</th>
                                    <th>Net</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.map((s: any) => (
                                    <tr key={s._id}>
                                        <td className="font-medium text-gray-900">{s.month}</td>
                                        <td>₹{s.basicSalary?.toLocaleString('en-IN')}</td>
                                        <td className="text-emerald-600">+₹{s.allowances?.toLocaleString('en-IN') || 0}</td>
                                        <td className="text-red-500">-₹{s.deductions?.toLocaleString('en-IN') || 0}</td>
                                        <td className="font-bold text-gray-900">₹{s.netSalary?.toLocaleString('en-IN')}</td>
                                        <td>
                                            <span className={clsx('badge',
                                                s.status === 'paid' ? 'badge-green' :
                                                    s.status === 'approved' ? 'badge-blue' : 'badge-orange'
                                            )}>{s.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {salaries.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No salary records</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Tab: Attendance ── */}
            {activeTab === 'attendance' && (
                <div className="card overflow-hidden">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Check In</th>
                                    <th>Check Out</th>
                                    <th>Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((a: any) => (
                                    <tr key={a._id}>
                                        <td className="font-medium text-gray-900">{format(new Date(a.date), 'EEE, MMM d')}</td>
                                        <td>
                                            <span className={clsx('badge',
                                                a.status === 'present' ? 'badge-green' :
                                                    a.status === 'half_day' ? 'badge-orange' :
                                                        a.status === 'late' ? 'badge-blue' : 'badge-red'
                                            )}>{a.status}</span>
                                        </td>
                                        <td className="text-gray-500">{a.checkIn || '—'}</td>
                                        <td className="text-gray-500">{a.checkOut || '—'}</td>
                                        <td className="text-gray-500">{a.hoursWorked ? `${a.hoursWorked}h` : '—'}</td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No attendance records</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
