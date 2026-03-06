'use client';

import { useState } from 'react';
import api from '../lib/api';
import { X, Building2, Mail, Phone, Globe, AlignLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (client: any) => void;
    editClient?: any;
}

export default function AddClientModal({ onClose, onSuccess, editClient }: Props) {
    const isEdit = !!editClient;
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: editClient?.name || '',
        company: editClient?.company || '',
        email: editClient?.email || '',
        phone: editClient?.phone || '',
        website: editClient?.website || '',
        industry: editClient?.industry || '',
        clientType: editClient?.clientType || '',
        taxId: editClient?.taxId || '',
        billingAddress: editClient?.billingAddress || '',
        status: editClient?.status || 'active',
        notes: editClient?.notes || '',
    });

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Client name is required');
        setLoading(true);
        try {
            if (isEdit) {
                const { data } = await api.put(`/api/clients/${editClient._id}`, form);
                toast.success('Client updated!');
                onSuccess(data.client);
            } else {
                const { data } = await api.post('/api/clients', form);
                toast.success('Client added!');
                onSuccess(data.client);
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save client');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Client' : 'Add Client'}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Contact Name *</label>
                            <input value={form.name} onChange={set('name')} placeholder="Jane Smith" className="input" required />
                        </div>
                        <div>
                            <label className="label">Company / Org</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.company} onChange={set('company')} placeholder="Acme Corp" className="input pl-9" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.email} onChange={set('email')} type="email" placeholder="jane@acme.com" className="input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" className="input pl-9" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 mt-2">
                        <div>
                            <label className="label">Client Type</label>
                            <select value={form.clientType} onChange={(e: any) => set('clientType')(e)} className="input">
                                <option value="">Select Type</option>
                                <option value="Enterprise">Enterprise</option>
                                <option value="Startup">Startup</option>
                                <option value="Individual">Individual</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Industry</label>
                            <input value={form.industry} onChange={set('industry')} placeholder="e.g. Technology" className="input" />
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select value={form.status} onChange={(e: any) => set('status')(e)} className="input">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="lead">Lead / Prospect</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Website</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.website} onChange={set('website')} placeholder="https://acme.com" className="input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Tax ID / VAT No.</label>
                            <input value={form.taxId} onChange={set('taxId')} placeholder="Optional" className="input" />
                        </div>
                    </div>

                    <div>
                        <label className="label">Billing Address</label>
                        <input value={form.billingAddress} onChange={set('billingAddress')} placeholder="Full billing address..." className="input" />
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <label className="label">Internal Notes</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea value={form.notes} onChange={set('notes')} placeholder="Any relevant notes..." rows={3} className="input pl-9 resize-none" />
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Add Client'}
                    </button>
                </div>
            </div>
        </div>
    );
}
