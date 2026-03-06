'use client';

import { useState, useEffect } from 'react';
import { X, Globe, Server, Code, Key, Github, Cloud, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface AddAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    asset?: any; // For editing
}

const ASSET_TYPES = [
    { value: 'domain', label: 'Domain', icon: Globe },
    { value: 'server', label: 'Server', icon: Server },
    { value: 'api', label: 'API / Integration', icon: Code },
    { value: 'license', label: 'Software License', icon: Key },
    { value: 'repo', label: 'Git Repository', icon: Github },
    { value: 'service', label: 'Third-party Service', icon: Cloud },
];

export default function AddAssetModal({ isOpen, onClose, onSuccess, asset }: AddAssetModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'domain',
        provider: '',
        status: 'active',
        renewalDate: '',
        cost: '',
        billingCycle: 'monthly',
        url: '',
        description: '',
    });

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name || '',
                type: asset.type || 'domain',
                provider: asset.provider || '',
                status: asset.status || 'active',
                renewalDate: asset.renewalDate ? asset.renewalDate.split('T')[0] : '',
                cost: asset.cost?.toString() || '',
                billingCycle: asset.billingCycle || 'monthly',
                url: asset.url || '',
                description: asset.description || '',
            });
        } else {
            setFormData({
                name: '',
                type: 'domain',
                provider: '',
                status: 'active',
                renewalDate: '',
                cost: '',
                billingCycle: 'monthly',
                url: '',
                description: '',
            });
        }
    }, [asset, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (asset) {
                await api.put(`/api/assets/${asset._id}`, formData);
                toast.success('Asset updated successfully');
            } else {
                await api.post('/api/assets', formData);
                toast.success('Asset added successfully');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to save asset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{asset ? 'Edit Asset' : 'Add New Digital Asset'}</h2>
                        <p className="text-sm text-gray-500">Track and manage your digital infrastructure</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Type Selection */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {ASSET_TYPES.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: t.value })}
                                className={clsx(
                                    "flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                                    formData.type === t.value
                                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm"
                                        : "border-gray-50 bg-white text-gray-400 hover:border-gray-100 hover:text-gray-600"
                                )}
                            >
                                <t.icon className="w-5 h-5" />
                                <span className="text-[10px] font-bold uppercase truncate w-full text-center">{t.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Asset Name</label>
                            <input
                                required
                                type="text"
                                className="input"
                                placeholder="e.g. main-site.com"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Provider</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. AWS, GoDaddy"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">URL / Endpoint</label>
                            <input
                                type="url"
                                className="input"
                                placeholder="https://..."
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Renewal Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.renewalDate}
                                onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Cost (₹)</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="0"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Billing Cycle</label>
                            <select
                                className="select"
                                value={formData.billingCycle}
                                onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="one-time">One-time</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description</label>
                        <textarea
                            className="input min-h-[80px]"
                            placeholder="Add notes, specifications, or keys..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </form>

                <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                    <button type="button" onClick={onClose} className="btn-secondary flex-1 shadow-sm">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary flex-1 shadow-md shadow-indigo-100"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : asset ? 'Update Asset' : 'Add Asset'}
                    </button>
                </div>
            </div>
        </div>
    );
}
