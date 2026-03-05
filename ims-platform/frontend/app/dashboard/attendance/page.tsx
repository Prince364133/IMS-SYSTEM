'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
    Calendar, Search, Loader2, CheckCheck, X, Clock, Home,
    Plus, FileText, ChevronDown, ChevronUp, CheckCircle, XCircle
} from 'lucide-react';
import clsx from 'clsx';
import MarkAttendanceModal from '../../../components/MarkAttendanceModal';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
    present: { label: 'Present', cls: 'badge-green', icon: CheckCheck },
    absent: { label: 'Absent', cls: 'badge-red', icon: X },
    late: { label: 'Late', cls: 'badge-orange', icon: Clock },
    half_day: { label: 'Half Day', cls: 'badge-orange', icon: Clock },
    work_from_home: { label: 'WFH', cls: 'badge-blue', icon: Home },
    on_leave: { label: 'Leave', cls: 'badge-purple', icon: Calendar },
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
    sick: 'badge-red', casual: 'badge-blue', annual: 'badge-green',
    maternity: 'badge-purple', paternity: 'badge-purple', unpaid: 'badge-gray', other: 'badge-gray',
};

function thisMonthStr() { return new Date().toISOString().slice(0, 7); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

function LeaveRequestModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ type: 'casual', startDate: todayStr(), endDate: todayStr(), reason: '' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/api/leaves', form);
            toast.success('Leave request submitted!');
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to submit');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Request Leave</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Leave Type</label>
                        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="select">
                            {['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'other'].map(t => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input" required />
                        </div>
                        <div>
                            <label className="label">End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input" required />
                        </div>
                    </div>
                    <div>
                        <label className="label">Reason</label>
                        <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="input resize-none" rows={3} placeholder="Briefly describe the reason..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AttendancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [leavesLoading, setLeavesLoading] = useState(true);
    const [month, setMonth] = useState(thisMonthStr());
    const [showMark, setShowMark] = useState(false);
    const [showLeave, setShowLeave] = useState(false);
    const [tab, setTab] = useState<'attendance' | 'leaves'>('attendance');
    const { user } = useAuth();

    function loadAttendance() {
        setLoading(true);
        api.get('/api/attendance', { params: { month } })
            .then(({ data }) => setRecords(data.records))
            .finally(() => setLoading(false));
    }

    function loadLeaves() {
        setLeavesLoading(true);
        api.get('/api/leaves', { params: { month } })
            .then(({ data }) => setLeaves(data.leaves || []))
            .finally(() => setLeavesLoading(false));
    }

    useEffect(() => { loadAttendance(); }, [month]);
    useEffect(() => { loadLeaves(); }, [month]);

    async function handleReviewLeave(id: string, status: 'approved' | 'rejected') {
        try {
            await api.put(`/api/leaves/${id}/review`, { status });
            toast.success(`Leave ${status}`);
            setLeaves(prev => prev.map(l => l._id === id ? { ...l, status } : l));
        } catch { toast.error('Failed to update leave'); }
    }

    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    return (
        <div>
            {showMark && (
                <MarkAttendanceModal
                    onClose={() => setShowMark(false)}
                    onSuccess={() => { setShowMark(false); loadAttendance(); }}
                />
            )}
            {showLeave && (
                <LeaveRequestModal
                    onClose={() => setShowLeave(false)}
                    onSuccess={() => { setShowLeave(false); loadLeaves(); }}
                />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">{records.length} records for {month}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowLeave(true)} className="btn-secondary flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> Request Leave
                    </button>
                    {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                        <button onClick={() => setShowMark(true)} className="btn-primary"><Plus className="w-4 h-4" />Mark Attendance</button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-max">
                <button onClick={() => setTab('attendance')} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', tab === 'attendance' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    Attendance Records
                </button>
                <button onClick={() => setTab('leaves')} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5', tab === 'leaves' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    Leave Requests
                    {pendingLeaves > 0 && <span className="bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{pendingLeaves}</span>}
                </button>
            </div>

            <div className="flex gap-3 mb-5">
                <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input w-48" />
            </div>

            {/* Attendance Records Tab */}
            {tab === 'attendance' && (
                loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : (
                    <div className="card">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Marked By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r) => {
                                        const cfg = STATUS_CONFIG[r.status] || { label: r.status, cls: 'badge-gray', icon: Clock };
                                        const Icon = cfg.icon;
                                        return (
                                            <tr key={r._id}>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-white text-xs font-bold">{r.employeeId?.name?.[0]?.toUpperCase()}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{r.employeeId?.name}</p>
                                                            <p className="text-xs text-gray-400">{r.employeeId?.employeeId}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="font-mono text-sm text-gray-600">{r.date}</td>
                                                <td>
                                                    <span className={clsx('badge gap-1', cfg.cls)}>
                                                        <Icon className="w-3 h-3" />{cfg.label}
                                                    </span>
                                                </td>
                                                <td className="text-gray-600 text-sm">{r.checkIn || '—'}</td>
                                                <td className="text-gray-600 text-sm">{r.checkOut || '—'}</td>
                                                <td className="text-gray-500 text-xs">{r.markedBy?.name || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                    {records.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-400">No attendance records for {month}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Leave Requests Tab */}
            {tab === 'leaves' && (
                leavesLoading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : (
                    <div className="card">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        {(user?.role === 'admin' || user?.role === 'hr') && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((l: any) => (
                                        <tr key={l._id}>
                                            <td>
                                                <p className="font-medium text-gray-900 text-sm">{l.employeeId?.name}</p>
                                                <p className="text-xs text-gray-400">{l.employeeId?.department}</p>
                                            </td>
                                            <td><span className={clsx('badge', LEAVE_TYPE_COLORS[l.type] || 'badge-gray')}>{l.type}</span></td>
                                            <td className="text-sm text-gray-600">{l.startDate}</td>
                                            <td className="text-sm text-gray-600">{l.endDate}</td>
                                            <td className="text-sm font-medium text-gray-800">{l.days}d</td>
                                            <td className="text-sm text-gray-500 max-w-[150px] truncate">{l.reason || '—'}</td>
                                            <td>
                                                <span className={clsx('badge', l.status === 'approved' ? 'badge-green' : l.status === 'rejected' ? 'badge-red' : 'badge-orange')}>
                                                    {l.status}
                                                </span>
                                            </td>
                                            {(user?.role === 'admin' || user?.role === 'hr') && (
                                                <td>
                                                    {l.status === 'pending' ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <button onClick={() => handleReviewLeave(l._id, 'approved')} className="w-6 h-6 rounded-md bg-green-50 hover:bg-green-100 flex items-center justify-center text-green-600 transition-colors" title="Approve">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleReviewLeave(l._id, 'rejected')} className="w-6 h-6 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors" title="Reject">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Reviewed</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {leaves.length === 0 && (
                                        <tr><td colSpan={8} className="text-center py-12 text-gray-400">No leave requests for {month}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
