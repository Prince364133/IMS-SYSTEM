'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
    FileText, Plus, Loader2, X, Trash2, Eye,
    Filter, CheckCircle2, Send, Banknote, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, { badge: string; label: string; icon: any }> = {
    draft: { badge: 'badge-gray', label: 'Draft', icon: FileText },
    sent: { badge: 'badge-blue', label: 'Sent', icon: Send },
    paid: { badge: 'badge-green', label: 'Paid', icon: CheckCircle2 },
    overdue: { badge: 'badge-red', label: 'Overdue', icon: AlertCircle },
    cancelled: { badge: 'badge-orange', label: 'Cancelled', icon: X },
};

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

function CreateInvoiceModal({ onClose, onSuccess, clients }: { onClose: () => void; onSuccess: () => void; clients: any[] }) {
    const [form, setForm] = useState({
        clientId: '',
        clientName: '',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: '',
        notes: '',
        taxPercent: 0,
        discount: 0,
        status: 'draft',
    });
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, unitPrice: 0 },
    ]);
    const [loading, setLoading] = useState(false);

    function addLine() { setLineItems(p => [...p, { description: '', quantity: 1, unitPrice: 0 }]); }
    function removeLine(i: number) { setLineItems(p => p.filter((_, idx) => idx !== i)); }
    function updateLine(i: number, field: keyof LineItem, val: string | number) {
        setLineItems(p => p.map((l, idx) => idx === i ? { ...l, [field]: field === 'description' ? val : Number(val) } : l));
    }

    const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tax = subtotal * (form.taxPercent / 100);
    const total = subtotal + tax - form.discount;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.clientId && !form.clientName) return toast.error('Client is required');
        setLoading(true);
        try {
            const clientName = clients.find(c => c._id === form.clientId)?.name || form.clientName;
            await api.post('/api/invoices', {
                ...form,
                clientName,
                lineItems,
                taxPercent: Number(form.taxPercent),
                discount: Number(form.discount),
            });
            toast.success('Invoice created!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create invoice');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-semibold text-gray-900">Create Invoice</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                    {/* Client & Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Client *</label>
                            <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} className="select">
                                <option value="">Select client</option>
                                {clients.map(c => <option key={c._id} value={c._id}>{c.name || c.company}</option>)}
                            </select>
                            {!form.clientId && (
                                <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} className="input mt-2" placeholder="Or enter client name manually" />
                            )}
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="select">
                                {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Issue Date</label>
                            <input type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} className="input" />
                        </div>
                        <div>
                            <label className="label">Due Date</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="input" />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label">Line Items</label>
                            <button type="button" onClick={addLine} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">+ Add Line</button>
                        </div>
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-20">Qty</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-28">Unit Price</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-24">Amount</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((line, i) => (
                                        <tr key={i} className="border-t border-gray-50">
                                            <td className="px-3 py-2">
                                                <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} className="w-full input py-1 text-sm" placeholder="Description" />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="number" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full input py-1 text-sm text-right" min="1" />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input type="number" value={line.unitPrice} onChange={e => updateLine(i, 'unitPrice', e.target.value)} className="w-full input py-1 text-sm text-right" min="0" step="0.01" />
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-gray-800">
                                                ₹{(line.quantity * line.unitPrice).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-2">
                                                {lineItems.length > 1 && (
                                                    <button type="button" onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-400">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-3 space-y-1.5 text-sm">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span><span className="font-medium text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="flex items-center gap-2">Tax
                                    <input type="number" value={form.taxPercent} onChange={e => setForm(p => ({ ...p, taxPercent: Number(e.target.value) }))} className="w-16 input py-0.5 text-xs text-center" min="0" max="100" />%
                                </span>
                                <span className="font-medium text-gray-800">₹{tax.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-500">
                                <span className="flex items-center gap-2">Discount
                                    <input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} className="w-20 input py-0.5 text-xs text-center" min="0" />
                                </span>
                                <span className="font-medium text-red-500">-₹{form.discount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                                <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input resize-none" rows={2} placeholder="Payment terms, bank details, etc." />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InvoicesPage() {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');

    function loadInvoices() {
        setLoading(true);
        api.get('/api/invoices', { params: { status: filterStatus || undefined } })
            .then(({ data }) => setInvoices(data.invoices || []))
            .catch(() => setInvoices([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadInvoices();
        api.get('/api/clients', { params: { limit: 200 } }).then(({ data }) => setClients(data.clients || []));
    }, [filterStatus]);

    async function updateStatus(id: string, status: string) {
        try {
            await api.put(`/api/invoices/${id}`, { status });
            toast.success(`Marked as ${status}`);
            loadInvoices();
        } catch { toast.error('Failed to update'); }
    }

    async function deleteInvoice(id: string) {
        if (!confirm('Delete this invoice?')) return;
        try {
            await api.delete(`/api/invoices/${id}`);
            toast.success('Invoice deleted');
            setInvoices(prev => prev.filter(i => i._id !== id));
        } catch { toast.error('Failed to delete'); }
    }

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
    const totalPending = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.totalAmount, 0);

    return (
        <div>
            {showCreate && (
                <CreateInvoiceModal onClose={() => setShowCreate(false)} onSuccess={loadInvoices} clients={clients} />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Invoice Management</h1>
                    <p className="page-subtitle">Create and track client invoices</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                    <Plus className="w-4 h-4" /> Create Invoice
                </button>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Paid Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-green-600', icon: Banknote, bg: 'bg-green-50' },
                    { label: 'Outstanding', value: `₹${totalPending.toLocaleString('en-IN')}`, color: 'text-blue-600', icon: Send, bg: 'bg-blue-50' },
                    { label: 'Total Invoices', value: invoices.length, color: 'text-indigo-600', icon: FileText, bg: 'bg-indigo-50' },
                    { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-50' },
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
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400" />
                {['', ...Object.keys(STATUS_STYLES)].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                        className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                            filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                        {s === '' ? 'All' : STATUS_STYLES[s].label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No invoices yet</p>
                    <p className="text-gray-300 text-sm mt-1">Create your first invoice</p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => {
                                    const statusInfo = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;
                                    const StatusIcon = statusInfo.icon;
                                    return (
                                        <tr key={inv._id} className="group">
                                            <td className="font-mono font-bold text-indigo-600">{inv.invoiceNumber}</td>
                                            <td>
                                                <p className="font-medium text-gray-800">{inv.clientName || inv.clientId?.name}</p>
                                                {inv.clientId?.email && <p className="text-xs text-gray-400">{inv.clientId.email}</p>}
                                            </td>
                                            <td className="font-bold text-gray-900">₹{inv.totalAmount?.toLocaleString('en-IN')}</td>
                                            <td className="text-sm text-gray-500">{inv.issueDate ? format(new Date(inv.issueDate), 'MMM d, yyyy') : '—'}</td>
                                            <td className="text-sm text-gray-500">{inv.dueDate ? format(new Date(inv.dueDate), 'MMM d, yyyy') : '—'}</td>
                                            <td>
                                                <span className={clsx('badge text-xs flex items-center gap-1 w-fit', statusInfo.badge)}>
                                                    <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1.5">
                                                    {inv.status === 'draft' && (
                                                        <button onClick={() => updateStatus(inv._id, 'sent')} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors">
                                                            Send
                                                        </button>
                                                    )}
                                                    {inv.status === 'sent' && (
                                                        <button onClick={() => updateStatus(inv._id, 'paid')} className="text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors">
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    <button onClick={() => deleteInvoice(inv._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
