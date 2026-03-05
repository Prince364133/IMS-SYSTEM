'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, Calendar, Clock, CheckCheck, Home, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (record: any) => void;
}

const STATUSES = [
    { value: 'present', label: 'Present', icon: CheckCheck, color: 'text-green-600 bg-green-50' },
    { value: 'absent', label: 'Absent', icon: X, color: 'text-red-600 bg-red-50' },
    { value: 'late', label: 'Late', icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { value: 'half_day', label: 'Half Day', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { value: 'work_from_home', label: 'Work From Home', icon: Home, color: 'text-blue-600 bg-blue-50' },
    { value: 'on_leave', label: 'On Leave', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
];

export default function MarkAttendanceModal({ onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [form, setForm] = useState({
        employeeId: '',
        date: new Date().toISOString().slice(0, 10),
        status: 'present',
        checkIn: '',
        checkOut: '',
        notes: '',
    });

    useEffect(() => {
        api.get('/api/users', { params: { limit: 100, role: 'employee' } })
            .then(({ data }) => setEmployees(data.users || []));
    }, []);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.employeeId) return toast.error('Please select an employee');
        setLoading(true);
        try {
            const { data } = await api.post('/api/attendance', form);
            toast.success('Attendance marked!');
            onSuccess(data.record);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Mark Attendance</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Employee *</label>
                        <select value={form.employeeId} onChange={set('employeeId')} className="select" required>
                            <option value="">Select employee</option>
                            {employees.map(u => <option key={u._id} value={u._id}>{u.name} ({u.employeeId || u.department || 'Employee'})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="label">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.date} onChange={set('date')} type="date" className="input pl-9" />
                        </div>
                    </div>

                    <div>
                        <label className="label">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {STATUSES.map(({ value, label, icon: Icon, color }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, status: value }))}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${form.status === value
                                            ? `border-indigo-500 ${color}`
                                            : 'border-gray-100 text-gray-500 hover:border-gray-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(form.status === 'present' || form.status === 'late' || form.status === 'half_day') && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Check In</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={form.checkIn} onChange={set('checkIn')} type="time" className="input pl-9" />
                                </div>
                            </div>
                            <div>
                                <label className="label">Check Out</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={form.checkOut} onChange={set('checkOut')} type="time" className="input pl-9" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="label">Notes</label>
                        <textarea value={form.notes} onChange={set('notes')} placeholder="Optional note..." rows={2} className="input resize-none" />
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Attendance'}
                    </button>
                </div>
            </div>
        </div>
    );
}
