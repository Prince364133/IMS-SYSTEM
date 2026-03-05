'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
    Receipt, Plus, Loader2, X, CheckCircle, XCircle,
    Clock, Filter, TrendingUp, Trash2
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import { format } from 'date-fns';

const CATEGORIES = ['travel', 'food', 'accommodation', 'equipment', 'software', 'training', 'other'];
const STATUS_STYLES: Record<string, string> = {
    pending: 'badge-orange',
    approved: 'badge-green',
    rejected: 'badge-red',
};
const CAT_COLORS: Record<string, string> = {
    travel: 'bg-sky-50 text-sky-700',
    food: 'bg-orange-50 text-orange-700',
    accommodation: 'bg-purple-50 text-purple-700',
    equipment: 'bg-blue-50 text-blue-700',
    software: 'bg-indigo-50 text-indigo-700',
    training: 'bg-green-50 text-green-700',
    other: 'bg-gray-50 text-gray-600',
};

function AddExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({
        title: '', amount: '', category: 'travel',
        date: format(new Date(), 'yyyy-MM-dd'),
        receiptUrl: '', notes: '',
    });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title || !form.amount || !form.date) return toast.error('Fill required fields');
        setLoading(true);
        try {
            await api.post('/api/expenses', { ...form, amount: parseFloat(form.amount) });
            toast.success('Expense submitted!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to submit');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Submit Expense</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Expense Title *</label>
                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Flight to Mumbai" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Amount (₹) *</label>
                            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="input" placeholder="0.00" min="0" step="0.01" required />
                        </div>
                        <div>
                            <label className="label">Date *</label>
                            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="input" required />
                        </div>
                    </div>
                    <div>
                        <label className="label">Category</label>
                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="select">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Receipt URL</label>
                        <input value={form.receiptUrl} onChange={e => setForm(p => ({ ...p, receiptUrl: e.target.value }))} className="input" placeholder="https://..." />
                    </div>
                    <div>
                        <label className="label">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input resize-none" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ExpensesPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const isHR = user?.role === 'admin' || user?.role === 'hr';

    function loadExpenses() {
        setLoading(true);
        api.get('/api/expenses', { params: { status: filterStatus || undefined } })
            .then(({ data }) => setExpenses(data.expenses || []))
            .catch(() => setExpenses([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadExpenses(); }, [filterStatus]);

    async function review(id: string, status: 'approved' | 'rejected') {
        const reviewNote = status === 'rejected' ? prompt('Rejection reason (optional):') || '' : '';
        try {
            await api.put(`/api/expenses/${id}/review`, { status, reviewNote });
            toast.success(`Expense ${status}`);
            loadExpenses();
        } catch { toast.error('Failed to update'); }
    }

    async function deleteExpense(id: string) {
        if (!confirm('Delete this expense?')) return;
        try {
            await api.delete(`/api/expenses/${id}`);
            toast.success('Deleted');
            setExpenses(prev => prev.filter(e => e._id !== id));
        } catch { toast.error('Failed to delete'); }
    }

    const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
    const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

    return (
        <div>
            {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={loadExpenses} />}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Expense Claims</h1>
                    <p className="page-subtitle">{isHR ? 'Review and manage all expense claims' : 'Submit and track your expense claims'}</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-primary">
                    <Plus className="w-4 h-4" /> Submit Expense
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Pending', value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Approved', value: `₹${totalApproved.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Total Claims', value: expenses.length, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map(k => (
                    <div key={k.label} className="card p-4 flex items-center gap-3">
                        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', k.bg)}>
                            <k.icon className={clsx('w-5 h-5', k.color)} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-semibold uppercase">{k.label}</p>
                            <p className={clsx('text-xl font-black', k.color)}>{k.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 mb-4">
                <Filter className="w-4 h-4 text-gray-400" />
                {['', 'pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                            filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                        {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-16">
                    <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No expense claims found</p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Expense</th>
                                    {isHR && <th>Employee</th>}
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    {isHR && <th>Actions</th>}
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(exp => (
                                    <tr key={exp._id} className="group">
                                        <td>
                                            <p className="font-medium text-gray-800">{exp.title}</p>
                                            {exp.notes && <p className="text-xs text-gray-400 mt-0.5">{exp.notes}</p>}
                                        </td>
                                        {isHR && (
                                            <td className="text-sm text-gray-600">
                                                {exp.employeeId?.name || '—'}
                                                <p className="text-xs text-gray-400">{exp.employeeId?.department || ''}</p>
                                            </td>
                                        )}
                                        <td>
                                            <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', CAT_COLORS[exp.category] || CAT_COLORS.other)}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="font-bold text-gray-900">₹{exp.amount?.toLocaleString('en-IN')}</td>
                                        <td className="text-sm text-gray-500">{exp.date ? format(new Date(exp.date), 'MMM d, yyyy') : '—'}</td>
                                        <td>
                                            <span className={clsx('badge text-xs capitalize', STATUS_STYLES[exp.status] || 'badge-gray')}>
                                                {exp.status}
                                            </span>
                                        </td>
                                        {isHR && (
                                            <td>
                                                {exp.status === 'pending' && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => review(exp._id, 'approved')} className="p-1 rounded hover:bg-green-50 text-green-600">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => review(exp._id, 'rejected')} className="p-1 rounded hover:bg-red-50 text-red-400">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        <td>
                                            <button onClick={() => deleteExpense(exp._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
