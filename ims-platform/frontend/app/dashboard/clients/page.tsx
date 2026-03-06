'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Building2, Search, Plus, Globe, Mail, Phone, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Skeleton from '../../../components/Skeleton';
import { useAuth } from '../../../lib/auth-context';
import AddClientModal from '../../../components/AddClientModal';
import ConfirmModal from '../../../components/ConfirmModal';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [editClient, setEditClient] = useState<any>(null);
    const [confirmDelete, setConfirmDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    function loadClients() {
        setLoading(true);
        api.get('/api/clients', { params: { search } })
            .then(({ data }) => setClients(data.clients))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadClients(); }, [search]);

    return (
        <div>
            {(showAdd || editClient) && (
                <AddClientModal
                    editClient={editClient}
                    onClose={() => { setShowAdd(false); setEditClient(null); }}
                    onSuccess={() => { setShowAdd(false); setEditClient(null); loadClients(); }}
                />
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Delete Client"
                message={`Are you sure you want to delete ${confirmDelete?.name}? This will also affect associated projects.`}
                confirmText="Delete"
                onConfirm={() => {
                    setIsDeleting(true);
                    api.delete(`/api/clients/${confirmDelete._id}`)
                        .then(() => {
                            toast.success('Client deleted');
                            loadClients();
                            setConfirmDelete(null);
                        })
                        .catch(() => toast.error('Failed to delete client'))
                        .finally(() => setIsDeleting(false));
                }}
                onCancel={() => setConfirmDelete(null)}
                loading={isDeleting}
            />

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Clients</h1>
                    <p className="page-subtitle">{clients.length} client accounts</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                    <button onClick={() => setShowAdd(true)} className="btn-primary">
                        <Plus className="w-4 h-4" />Add Client
                    </button>
                )}
            </div>

            <div className="relative mb-5 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search clients..."
                    className="input pl-9"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <Skeleton variant="rounded" width={44} height={44} />
                                <div className="flex-1 space-y-2">
                                    <Skeleton variant="text" width="70%" height={16} />
                                    <Skeleton variant="text" width="40%" height={12} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton variant="text" width="60%" height={10} />
                                <Skeleton variant="text" width="50%" height={10} />
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex gap-2">
                                <Skeleton variant="rounded" width={60} height={20} />
                                <Skeleton variant="rounded" width={60} height={20} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {clients.map((client) => (
                        <div
                            key={client._id}
                            className="card p-5 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => router.push(`/dashboard/profile/${client._id}`)}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                                    <span className="text-indigo-600 font-bold text-lg">{client.name?.[0]?.toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                                        {client.status && (
                                            <span className={clsx(
                                                "px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full flex-shrink-0",
                                                client.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                                                    client.status === 'inactive' ? "bg-gray-100 text-gray-600" :
                                                        "bg-amber-100 text-amber-700"
                                            )}>
                                                {client.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                        <span className="truncate">{client.company || 'No Company'}</span>
                                        {client.industry && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate">{client.industry}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {(user?.role === 'admin' || user?.role === 'hr') && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditClient(client); }}
                                            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setConfirmDelete(client); }}
                                                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0 group/del"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover/del:text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Contact details */}
                            <div className="space-y-1.5 mb-4">
                                {client.email && (
                                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{client.email}</span>
                                    </a>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.website && (
                                    <a href={client.website} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{client.website.replace(/https?:\/\//, '')}</span>
                                        <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                                    </a>
                                )}
                            </div>

                            {/* Projects */}
                            {(client.projectIds?.length > 0) && (
                                <div className="pt-3 border-t border-gray-50">
                                    <p className="text-xs text-gray-400 mb-1.5">Projects</p>
                                    <div className="flex flex-wrap gap-1">
                                        {client.projectIds.slice(0, 2).map((p: any) => (
                                            <span key={p._id || p} className="badge badge-blue">{p.name || 'Project'}</span>
                                        ))}
                                        {client.projectIds.length > 2 && (
                                            <span className="badge badge-gray">+{client.projectIds.length - 2} more</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {client.notes && (
                                <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50 line-clamp-2">{client.notes}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!loading && clients.length === 0 && (
                <div className="text-center py-20">
                    <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No clients found</p>
                    <p className="text-gray-300 text-sm mt-1">Add your first client to get started</p>
                </div>
            )}
        </div>
    );
}
