'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, DollarSign, Calendar, User, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (salary: any) => void;
}

export default function GeneratePayrollModal({ onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [form, setForm] = useState({
        employeeId: '',
        month: new Date().toISOString().slice(0, 7),
        baseSalary: '',
        deductions: '0',
        bonuses: '0',
        notes: '',
    });

    useEffect(() => {
        api.get('/api/users', { params: { limit: 100 } })
            .then(({ data }) => setEmployees(data.users || []));
    }, []);

    // Auto-fill salary when employee selected
    useEffect(() => {
        if (form.employeeId) {
            const emp = employees.find(e => e._id === form.employeeId);
            if (emp?.salary) setForm(prev => ({ ...prev, baseSalary: emp.salary.toString() }));
        }
    }, [form.employeeId, employees]);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const net = Number(form.baseSalary || 0) - Number(form.deductions || 0) + Number(form.bonuses || 0);

    async function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        if (!form.employeeId) return toast.error('Please select an employee');
        if (!form.baseSalary) return toast.error('Base salary is required');
        setLoading(true);
        try {
            const { data } = await api.post('/api/salary/generate', {
                employeeId: form.employeeId,
                month: form.month,
                baseSalary: Number(form.baseSalary),
                deductions: Number(form.deductions),
                bonuses: Number(form.bonuses),
                notes: form.notes,
            });
            toast.success('Salary record generated!');
            onSuccess(data.salary);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to generate payroll');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateAll() {
        if (!form.month) return toast.error('Select a month first');
        setGenerating(true);
        try {
            // Generate for all employees that have a salary set
            const empsWithSalary = employees.filter(e => e.salary);
            let success = 0;
            for (const emp of empsWithSalary) {
                await api.post('/api/salary/generate', {
                    employeeId: emp._id,
                    month: form.month,
                    baseSalary: emp.salary,
                    deductions: 0,
                    bonuses: 0,
                });
                success++;
            }
            toast.success(`Generated payroll for ${success} employees`);
            onSuccess({});
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Partial failure generating payroll');
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-700" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Generate Payroll</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Month</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.month} onChange={set('month')} type="month" className="input pl-9" />
                        </div>
                    </div>

                    {/* Bulk Generate Banner */}
                    <div className="flex items-start gap-3 bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium mb-0.5">Bulk Generate</p>
                            <p className="text-xs text-indigo-500">Creates salary records for all employees with a salary set using default values.</p>
                            <button
                                type="button"
                                onClick={handleGenerateAll}
                                disabled={generating}
                                className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                            >
                                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                Generate for all employees
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Or generate for one employee</p>

                        <div className="space-y-3">
                            <div>
                                <label className="label">Employee</label>
                                <select value={form.employeeId} onChange={set('employeeId')} className="select">
                                    <option value="">Select employee</option>
                                    {employees.map(u => <option key={u._id} value={u._id}>{u.name} {u.salary ? `(₹${u.salary.toLocaleString()})` : ''}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="label">Base Salary (₹)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={form.baseSalary} onChange={set('baseSalary')} type="number" placeholder="50000" className="input pl-9" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Deductions (₹)</label>
                                    <input value={form.deductions} onChange={set('deductions')} type="number" className="input" />
                                </div>
                                <div>
                                    <label className="label">Bonuses (₹)</label>
                                    <input value={form.bonuses} onChange={set('bonuses')} type="number" className="input" />
                                </div>
                            </div>

                            {/* Net preview */}
                            {form.baseSalary && (
                                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Net Salary</span>
                                    <span className="text-xl font-bold text-gray-900">₹{net.toLocaleString()}</span>
                                </div>
                            )}

                            <div>
                                <label className="label">Notes</label>
                                <textarea value={form.notes} onChange={set('notes')} placeholder="Optional note..." rows={2} className="input resize-none" />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleGenerate} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Salary'}
                    </button>
                </div>
            </div>
        </div>
    );
}
