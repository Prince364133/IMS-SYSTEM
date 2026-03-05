'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, User, Mail, Lock, Briefcase, Building2, DollarSign, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (user: any) => void;
    editUser?: any; // if provided, we're editing
}

const ROLES = ['employee', 'manager', 'hr', 'admin'];
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales', 'Support', 'Management'];

export default function AddEmployeeModal({ onClose, onSuccess, editUser }: Props) {
    const isEdit = !!editUser;
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: editUser?.name || '',
        email: editUser?.email || '',
        password: '',
        role: editUser?.role || 'employee',
        department: editUser?.department || '',
        position: editUser?.position || '',
        salary: editUser?.salary || '',
        phone: editUser?.phone || '',
        joiningDate: editUser?.joiningDate ? editUser.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.email) return toast.error('Name and email are required');
        if (!isEdit && !form.password) return toast.error('Password is required');
        setLoading(true);
        try {
            if (isEdit) {
                const payload: any = { ...form };
                if (!payload.password) delete payload.password;
                const { data } = await api.put(`/api/users/${editUser._id}`, payload);
                toast.success('Employee updated!');
                onSuccess(data.user);
            } else {
                const { data } = await api.post('/api/auth/register', form);
                toast.success('Employee added!');
                onSuccess(data.user);
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save employee');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Name + Email */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Full Name *</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.name} onChange={set('name')} placeholder="John Doe" className="input pl-9" required />
                            </div>
                        </div>
                        <div>
                            <label className="label">Email *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.email} onChange={set('email')} type="email" placeholder="john@company.com" className="input pl-9" required disabled={isEdit} />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    {!isEdit && (
                        <div>
                            <label className="label">Password *</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.password} onChange={set('password')} type="password" placeholder="Minimum 8 characters" className="input pl-9" />
                            </div>
                        </div>
                    )}

                    {/* Role + Department */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Role *</label>
                            <select value={form.role} onChange={set('role')} className="select">
                                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Department</label>
                            <select value={form.department} onChange={set('department')} className="select">
                                <option value="">Select department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Position + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Position / Title</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.position} onChange={set('position')} placeholder="Software Engineer" className="input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            <input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" className="input" />
                        </div>
                    </div>

                    {/* Salary + Joining */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Monthly Salary (₹)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.salary} onChange={set('salary')} type="number" placeholder="50000" className="input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Joining Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.joiningDate} onChange={set('joiningDate')} type="date" className="input pl-9" />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Add Employee'}
                    </button>
                </div>
            </div>
        </div>
    );
}
