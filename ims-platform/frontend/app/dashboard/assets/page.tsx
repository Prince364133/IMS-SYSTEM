'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
    Globe, Server, Code, Key, Github, Cloud, Plus, Search,
    MoreVertical, Edit2, Trash2, ExternalLink,
    Calendar, DollarSign, ShieldCheck, AlertCircle, Clock
} from 'lucide-react';
import { SkeletonStatsCard, SkeletonTable } from '../../../components/Skeleton';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import ConfirmModal from '../../../components/ConfirmModal';
import AddAssetModal from '../../../components/AddAssetModal';

const ASSET_ICONS: Record<string, any> = {
    domain: Globe,
    server: Server,
    api: Code,
    license: Key,
    repo: Github,
    service: Cloud,
};

const ASSET_COLORS: Record<string, string> = {
    domain: 'text-blue-600 bg-blue-50',
    server: 'text-purple-600 bg-purple-50',
    api: 'text-amber-600 bg-amber-50',
    license: 'text-emerald-600 bg-emerald-50',
    repo: 'text-slate-600 bg-slate-50',
    service: 'text-indigo-600 bg-indigo-50',
};

export default function AssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; assetId: string | null }>({
        isOpen: false,
        assetId: null
    });
    const [assetModal, setAssetModal] = useState<{ isOpen: boolean; asset: any | null }>({
        isOpen: false,
        asset: null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assetsRes, statsRes] = await Promise.all([
                api.get('/api/assets'),
                api.get('/api/assets/stats')
            ]);
            setAssets(assetsRes.data.assets || []);
            setStats(statsRes.data);
        } catch (err) {
            toast.error('Failed to load digital assets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.assetId) return;
        try {
            await api.delete(`/api/assets/${deleteModal.assetId}`);
            toast.success('Asset deleted');
            loadData();
        } catch (err) {
            toast.error('Failed to delete asset');
        } finally {
            setDeleteModal({ isOpen: false, assetId: null });
        }
    };

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
            asset.provider?.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter ? asset.type === typeFilter : true;
        return matchesSearch && matchesType;
    });

    const getRenewalStatus = (date: string) => {
        if (!date) return null;
        const days = differenceInDays(new Date(date), new Date());
        if (days < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50' };
        if (days < 30) return { label: `${days}d left`, color: 'text-orange-600 bg-orange-50' };
        return { label: `${days}d left`, color: 'text-emerald-600 bg-emerald-50' };
    };

    return (
        <div className="space-y-6">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Digital Assets Manager</h1>
                    <p className="page-subtitle">Track domains, servers, APIs, and infrastructure</p>
                </div>
                <button
                    onClick={() => setAssetModal({ isOpen: true, asset: null })}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" /> Add Asset
                </button>
            </div>

            {/* Stats */}
            {loading && !stats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonStatsCard key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Domains"
                        value={stats?.stats?.find((s: any) => s._id === 'domain')?.count || 0}
                        icon={Globe}
                        color="blue"
                    />
                    <StatCard
                        label="Servers"
                        value={stats?.stats?.find((s: any) => s._id === 'server')?.count || 0}
                        icon={Server}
                        color="purple"
                    />
                    <StatCard
                        label="APIs"
                        value={stats?.stats?.find((s: any) => s._id === 'api')?.count || 0}
                        icon={Code}
                        color="amber"
                    />
                    <StatCard
                        label="Active Integrations"
                        value={stats?.activeIntegrationsCount || 0}
                        icon={ShieldCheck}
                        color="indigo"
                    />
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assets by name or provider..."
                        className="input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="select w-40"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="domain">Domains</option>
                        <option value="server">Servers</option>
                        <option value="api">APIs</option>
                        <option value="license">Licenses</option>
                        <option value="repo">Repositories</option>
                        <option value="service">Services</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <SkeletonTable rows={6} columns={6} />
            ) : filteredAssets.length === 0 ? (
                <div className="card py-20 text-center">
                    <Cloud className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No assets found</h3>
                    <p className="text-gray-500">Add your first domain, server or integration to get started.</p>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Asset Details</th>
                                    <th>Status</th>
                                    <th>Provider</th>
                                    <th>Renewal</th>
                                    <th>Cost</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssets.map(asset => {
                                    const Icon = ASSET_ICONS[asset.type] || Cloud;
                                    const renewal = getRenewalStatus(asset.renewalDate);
                                    return (
                                        <tr key={asset._id} className="group">
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center", ASSET_COLORS[asset.type] || 'text-gray-600 bg-gray-50')}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-900 block">{asset.name}</span>
                                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider transition-colors group-hover:text-indigo-500">
                                                            {asset.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={clsx("badge text-[10px] uppercase font-bold",
                                                    asset.status === 'active' ? 'badge-green' :
                                                        asset.status === 'expired' ? 'badge-red' : 'badge-gray'
                                                )}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <span>{asset.provider || '—'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {renewal ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full w-fit", renewal.color)}>
                                                            {renewal.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {format(new Date(asset.renewalDate), 'MMM dd, yyyy')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        ₹{asset.cost?.toLocaleString() || '0'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">
                                                        {asset.billingCycle}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {asset.url && (
                                                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => setAssetModal({ isOpen: true, asset })}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, assetId: asset._id })}
                                                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                                                    >
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

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onCancel={() => setDeleteModal({ isOpen: false, assetId: null })}
                onConfirm={handleDelete}
                title="Delete Digital Asset"
                message="Are you sure you want to delete this asset? This action cannot be undone and infrastructure tracking will be lost."
                confirmText="Delete Asset"
                variant="danger"
            />

            <AddAssetModal
                isOpen={assetModal.isOpen}
                onClose={() => setAssetModal({ isOpen: false, asset: null })}
                onSuccess={loadData}
                asset={assetModal.asset}
            />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: 'blue' | 'purple' | 'amber' | 'indigo' }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
        indigo: 'bg-indigo-50 text-indigo-600',
    };

    return (
        <div className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    );
}
