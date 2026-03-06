'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { DollarSign, Loader2, CheckCircle, Clock, AlertCircle, Plus, Printer, FileText, XCircle, X } from 'lucide-react';
import clsx from 'clsx';
import GeneratePayrollModal from '../../../components/GeneratePayrollModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';

const STATUS_CONFIG: Record<string, { cls: string; icon: any }> = {
    pending: { cls: 'badge-orange', icon: Clock },
    approved: { cls: 'badge-blue', icon: CheckCircle },
    paid: { cls: 'badge-green', icon: CheckCircle },
    rejected: { cls: 'badge-red', icon: AlertCircle },
};
const LEAVE_TYPE_COLORS: Record<string, string> = {
    sick: 'badge-red', casual: 'badge-blue', annual: 'badge-green',
    maternity: 'badge-purple', paternity: 'badge-purple', unpaid: 'badge-gray', other: 'badge-gray',
};

function thisMonthStr() { return new Date().toISOString().slice(0, 7); }

import { format } from 'date-fns';
import { useSettings } from '../../../lib/settings-context';

function PayslipModal({ salary, onClose }: { salary: any; onClose: () => void }) {
    const { company } = useSettings();
    const brandColor = company?.brandColor || '#cf1d29';

    const handlePrint = () => {
        const printContent = document.getElementById('payslip-content');
        if (!printContent) return;

        const originalContent = document.body.innerHTML;
        const printStyles = `
            <style>
                @media print {
                    body { margin: 0; padding: 20px; font-family: sans-serif; }
                    .no-print { display: none; }
                    .print-shadow { box-shadow: none !important; border: 1px solid #eee !important; }
                }
            </style>
        `;

        document.body.innerHTML = printStyles + printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to restore React state
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden print-shadow no-print-scroll" id="payslip-content">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 no-print">
                    <h2 className="text-lg font-semibold text-gray-900">Payslip — {salary.month}</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="btn-secondary text-xs"><Printer className="w-3.5 h-3.5" />Print</button>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Company Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            {company?.companyLogo ? (
                                <img src={company.companyLogo} alt={company.companyName} className="h-12 w-auto mb-2" />
                            ) : (
                                <h1 className="text-2xl font-black tracking-tight" style={{ color: brandColor }}>{company?.companyName || 'Internal Management System'}</h1>
                            )}
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{company?.tagline || 'Internal Management System'}</p>
                        </div>
                        <div className="text-right text-xs text-gray-400 space-y-0.5">
                            <p className="font-bold text-gray-600">{company?.companyName}</p>
                            <p>{company?.address}</p>
                            <p>{company?.city}, {company?.state} {company?.postalCode}</p>
                            <p>{company?.companyEmail} | {company?.phoneNumber}</p>
                            {company?.gstNumber && <p className="font-semibold text-gray-500 mt-1">GST: {company.gstNumber}</p>}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full" />

                    {/* Employee Info */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Employee Details</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: brandColor }}>
                                    {salary.employeeId?.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{salary.employeeId?.name}</p>
                                    <p className="text-xs text-gray-500">{salary.employeeId?.employeeId} | {salary.employeeId?.department}</p>
                                    <p className="text-xs text-gray-500">{salary.employeeId?.position}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Details</p>
                            <p className="text-xs text-gray-500"><span className="text-gray-400">Month:</span> <span className="font-bold text-gray-700">{format(new Date(salary.month), 'MMMM yyyy')}</span></p>
                            <p className="text-xs text-gray-500"><span className="text-gray-400">Status:</span> <span className={clsx('font-bold', salary.status === 'paid' ? 'text-emerald-600' : 'text-orange-500')}>{salary.status?.toUpperCase()}</span></p>
                            {salary.paidAt && <p className="text-xs text-gray-500"><span className="text-gray-400">Paid On:</span> {format(new Date(salary.paidAt), 'MMM d, yyyy')}</p>}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-400 uppercase">Description</th>
                                    <th className="px-4 py-2 text-right text-xs font-bold text-gray-400 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="text-gray-700 font-medium">
                                    <td className="px-4 py-3">Base Salary</td>
                                    <td className="px-4 py-3 text-right">₹{salary.baseSalary?.toLocaleString('en-IN')}</td>
                                </tr>
                                {salary.allowances > 0 && (
                                    <tr className="text-emerald-600">
                                        <td className="px-4 py-3">Allowances</td>
                                        <td className="px-4 py-3 text-right">+₹{salary.allowances.toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                {salary.bonuses > 0 && (
                                    <tr className="text-emerald-600">
                                        <td className="px-4 py-3">Bonuses</td>
                                        <td className="px-4 py-3 text-right">+₹{salary.bonuses.toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                {salary.deductions > 0 && (
                                    <tr className="text-red-500">
                                        <td className="px-4 py-3">Deductions</td>
                                        <td className="px-4 py-3 text-right">-₹{salary.deductions.toLocaleString('en-IN')}</td>
                                    </tr>
                                )}
                                <tr className="bg-gray-50/50">
                                    <td className="px-4 py-4 font-bold text-gray-900 border-t border-gray-100">Net Payable</td>
                                    <td className="px-4 py-4 text-right font-black text-xl text-gray-900 border-t border-gray-100">₹{salary.netSalary?.toLocaleString('en-IN')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Signature and Footer */}
                    <div className="flex justify-between items-end pt-4">
                        <div className="space-y-1">
                            {salary.notes && (
                                <>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notes</p>
                                    <p className="text-xs text-gray-500 italic max-w-xs">{salary.notes}</p>
                                </>
                            )}
                        </div>
                        <div className="text-center group">
                            {company?.signatureImage ? (
                                <img src={company.signatureImage} alt="Signature" className="h-12 mx-auto mix-multiply" />
                            ) : (
                                <div className="h-12 w-24 border-b border-dashed border-gray-200 mx-auto" />
                            )}
                            <p className="text-xs font-bold text-gray-800 mt-1">{company?.authorizedSignatory || 'Authorized Signatory'}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Sign & Stamp</p>
                        </div>
                    </div>

                    <div className="text-[10px] text-center text-gray-300 pt-4 border-t border-gray-50">
                        This is a computer generated document and does not require a physical signature unless specified.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function HRPage() {
    const [salaries, setSalaries] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [leavesLoading, setLeavesLoading] = useState(true);
    const [month, setMonth] = useState(thisMonthStr());
    const [showGenerate, setShowGenerate] = useState(false);
    const [payslipSalary, setPayslipSalary] = useState<any>(null);
    const [tab, setTab] = useState<'payroll' | 'leaves'>('payroll');
    const { user } = useAuth();

    function loadSalaries() {
        setLoading(true);
        api.get('/api/salary', { params: { month } })
            .then(({ data }) => setSalaries(data.salaries))
            .finally(() => setLoading(false));
    }

    function loadLeaves() {
        setLeavesLoading(true);
        api.get('/api/leaves', { params: { status: 'pending' } })
            .then(({ data }) => setLeaves(data.leaves || []))
            .finally(() => setLeavesLoading(false));
    }

    useEffect(() => { loadSalaries(); }, [month]);
    useEffect(() => { loadLeaves(); }, []);

    async function handleApprove(id: string) {
        try {
            await api.put(`/api/salary/${id}/approve`);
            toast.success('Salary approved!');
            setSalaries(prev => prev.map(s => s._id === id ? { ...s, status: 'approved' } : s));
        } catch { toast.error('Failed to approve'); }
    }

    async function handleMarkPaid(id: string) {
        try {
            await api.put(`/api/salary/${id}/mark-paid`);
            toast.success('Marked as paid!');
            setSalaries(prev => prev.map(s => s._id === id ? { ...s, status: 'paid' } : s));
        } catch { toast.error('Failed to update'); }
    }

    async function handleReviewLeave(id: string, status: 'approved' | 'rejected') {
        try {
            await api.put(`/api/leaves/${id}/review`, { status });
            toast.success(`Leave ${status}`);
            setLeaves(prev => prev.filter(l => l._id !== id));
        } catch { toast.error('Failed to update leave'); }
    }

    const totalNet = salaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
    const pendingLeaves = leaves.length;

    return (
        <div>
            {showGenerate && (
                <GeneratePayrollModal
                    onClose={() => setShowGenerate(false)}
                    onSuccess={() => { setShowGenerate(false); loadSalaries(); }}
                />
            )}
            {payslipSalary && <PayslipModal salary={payslipSalary} onClose={() => setPayslipSalary(null)} />}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">HR & Salary</h1>
                    <p className="page-subtitle">Manage payroll and HR operations</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                    <button onClick={() => setShowGenerate(true)} className="btn-primary"><DollarSign className="w-4 h-4" />Generate Salary</button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-max">
                <button onClick={() => setTab('payroll')} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', tab === 'payroll' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    Payroll
                </button>
                <button onClick={() => setTab('leaves')} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5', tab === 'leaves' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    Leave Management
                    {pendingLeaves > 0 && <span className="bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{pendingLeaves}</span>}
                </button>
            </div>

            {tab === 'payroll' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="card p-5">
                            <p className="text-sm text-gray-500 mb-1">Total Payroll</p>
                            <p className="text-2xl font-bold text-gray-900">₹{totalNet.toLocaleString()}</p>
                        </div>
                        <div className="card p-5">
                            <p className="text-sm text-gray-500 mb-1">Paid</p>
                            <p className="text-2xl font-bold text-emerald-600">{salaries.filter(s => s.status === 'paid').length}</p>
                        </div>
                        <div className="card p-5">
                            <p className="text-sm text-gray-500 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-amber-500">{salaries.filter(s => s.status === 'pending').length}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-5">
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-48" />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                    ) : (
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
                                            {(user?.role === 'admin' || user?.role === 'hr') && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salaries.map((s) => {
                                            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                                            const Icon = cfg.icon;
                                            return (
                                                <tr key={s._id}>
                                                    <td>
                                                        <p className="font-medium text-gray-900">{s.employeeId?.name}</p>
                                                        <p className="text-xs text-gray-400">{s.employeeId?.department}</p>
                                                    </td>
                                                    <td className="text-gray-700">₹{s.baseSalary?.toLocaleString()}</td>
                                                    <td className="text-red-500">-₹{s.deductions?.toLocaleString() || 0}</td>
                                                    <td className="text-emerald-600">+₹{s.bonuses?.toLocaleString() || 0}</td>
                                                    <td className="font-bold text-gray-900">₹{s.netSalary?.toLocaleString()}</td>
                                                    <td><span className={clsx('badge gap-1', cfg.cls)}><Icon className="w-3 h-3" />{s.status}</span></td>
                                                    {(user?.role === 'admin' || user?.role === 'hr') && (
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => setPayslipSalary(s)} className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                                                                    <FileText className="w-3.5 h-3.5" />Payslip
                                                                </button>
                                                                {s.status === 'pending' && (
                                                                    <button onClick={() => handleApprove(s._id)} className="text-xs text-blue-600 hover:underline font-medium">Approve</button>
                                                                )}
                                                                {s.status === 'approved' && (
                                                                    <button onClick={() => handleMarkPaid(s._id)} className="text-xs text-emerald-600 hover:underline font-medium">Mark Paid</button>
                                                                )}
                                                                {s.status === 'paid' && <span className="text-xs text-gray-400">Paid ✓</span>}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {salaries.length === 0 && (
                                            <tr><td colSpan={7} className="text-center py-10 text-gray-400">No salary records for {month}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {tab === 'leaves' && (
                leavesLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
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
                                        <th>Actions</th>
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
                                            <td className="text-sm font-medium">{l.days}d</td>
                                            <td className="text-sm text-gray-500 max-w-[150px] truncate">{l.reason || '—'}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleReviewLeave(l._id, 'approved')} className="btn-secondary text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                                        <CheckCircle className="w-3.5 h-3.5" />Approve
                                                    </button>
                                                    <button onClick={() => handleReviewLeave(l._id, 'rejected')} className="btn-secondary text-xs text-red-500 border-red-200 hover:bg-red-50">
                                                        <XCircle className="w-3.5 h-3.5" />Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {leaves.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">No pending leave requests 🎉</td></tr>
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
