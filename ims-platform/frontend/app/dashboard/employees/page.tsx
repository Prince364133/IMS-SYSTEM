'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Users, Search, Plus, Trash2 } from 'lucide-react';
import { SkeletonTable } from '../../../components/Skeleton';
import clsx from 'clsx';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import AddEmployeeModal from '../../../components/AddEmployeeModal';
import ConfirmModal from '../../../components/ConfirmModal';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<string, string> = {
    admin: 'badge-purple',
    manager: 'badge-blue',
    hr: 'badge-green',
    employee: 'badge-gray',
    client: 'badge-orange',
};

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    function loadEmployees() {
        setLoading(true);
        api.get('/api/users', { params: { search, role } })
            .then(({ data }) => setEmployees(data.users))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadEmployees(); }, [search, role]);

    return (
        <div>
            {showAdd && (
                <AddEmployeeModal
                    onClose={() => setShowAdd(false)}
                    onSuccess={() => { setShowAdd(false); loadEmployees(); }}
                />
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Delete Employee"
                message={`Are you sure you want to delete ${confirmDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={() => {
                    setIsDeleting(true);
                    api.delete(`/api/users/${confirmDelete._id}`)
                        .then(() => {
                            toast.success('Employee deleted');
                            loadEmployees();
                            setConfirmDelete(null);
                        })
                        .catch(() => toast.error('Failed to delete employee'))
                        .finally(() => setIsDeleting(false));
                }}
                onCancel={() => setConfirmDelete(null)}
                loading={isDeleting}
            />

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">{employees.length} members</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                    <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Employee</button>
                )}
            </div>

            <div className="flex gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees..." className="input pl-9" />
                </div>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="select w-40">
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="employee">Employee</option>
                </select>
            </div>

            {loading ? (
                <SkeletonTable rows={8} columns={6} />
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>ID</th>
                                    <th>Department</th>
                                    <th>Position</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    {user?.role === 'admin' && <th className="text-right">Actions</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {employees.map((emp) => (
                                    <tr
                                        key={emp._id}
                                        className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/dashboard/profile/${emp._id}`)}
                                    >
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                    {emp.photoUrl
                                                        ? <img src={emp.photoUrl} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                                                        : <span className="text-white text-xs font-bold">{emp.name?.[0]?.toUpperCase()}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{emp.name}</p>
                                                    <p className="text-xs text-gray-400">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-mono text-xs text-gray-500">{emp.employeeId || '—'}</td>
                                        <td className="text-gray-600">{emp.department || '—'}</td>
                                        <td className="text-gray-600">{emp.position || '—'}</td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {(emp.roles || [emp.role]).map((r: string) => (
                                                    <span key={r} className={clsx('badge', ROLE_COLORS[r] || 'badge-gray text-[10px]')}>{r}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td><span className={clsx('badge', emp.isActive ? 'badge-green' : 'badge-red')}>{emp.isActive ? 'Active' : 'Inactive'}</span></td>
                                        {user?.role === 'admin' && (
                                            <td className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setConfirmDelete(emp)}
                                                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!loading && employees.length === 0 && (
                <div className="text-center py-20">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No employees found</p>
                </div>
            )}
        </div>
    );
}
