'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import {
    FileText, Upload, Search, Loader2, Plus, Download, Trash2,
    File, FolderOpen, Image, Video, AlignLeft, X, ExternalLink, Eye
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';

const CATEGORIES = [
    { key: 'all', label: 'All Files' },
    { key: 'contract', label: 'Contracts' },
    { key: 'offer_letter', label: 'Offer Letters' },
    { key: 'payslip', label: 'Payslips' },
    { key: 'policy', label: 'Policies' },
    { key: 'report', label: 'Reports' },
    { key: 'other', label: 'Other' },
];

const TYPE_COLORS: Record<string, string> = {
    contract: 'bg-blue-50 text-blue-700',
    offer_letter: 'bg-purple-50 text-purple-700',
    payslip: 'bg-green-50 text-green-700',
    policy: 'bg-amber-50 text-amber-700',
    report: 'bg-rose-50 text-rose-700',
    other: 'bg-gray-50 text-gray-600',
};

function getFileIcon(name: string) {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return Image;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return Video;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return FileText;
    return File;
}

function PreviewModal({ doc, onClose }: { doc: any; onClose: () => void }) {
    const ext = doc.url?.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    const isPDF = ext === 'pdf';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-base font-semibold text-gray-900 truncate">{doc.title}</h2>
                    <div className="flex items-center gap-2">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                            <ExternalLink className="w-3 h-3" /> Open
                        </a>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    {isImage ? (
                        <img src={doc.url} alt={doc.title} className="max-w-full mx-auto rounded-lg" />
                    ) : isPDF ? (
                        <iframe src={doc.url} className="w-full h-[70vh] rounded-lg border border-gray-100" title={doc.title} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <FileText className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-gray-500 font-medium mb-2">Preview not available for this file type</p>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                                <Download className="w-4 h-4" /> Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({ title: '', url: '', type: 'other', notes: '', employeeTag: '' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title || !form.url) return toast.error('Title and URL are required');
        setLoading(true);
        try {
            await api.post('/api/documents', form);
            toast.success('Document added!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to add document');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Add Document</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Document Title *</label>
                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Employee Handbook v2" required />
                    </div>
                    <div>
                        <label className="label">File URL *</label>
                        <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="input" placeholder="https://..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Type / Category</label>
                            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="select">
                                {['contract', 'offer_letter', 'payslip', 'policy', 'report', 'other'].map(t => (
                                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Employee Tag</label>
                            <input value={form.employeeTag} onChange={e => setForm(p => ({ ...p, employeeTag: e.target.value }))} className="input" placeholder="e.g. EMP-001" />
                        </div>
                    </div>
                    <div>
                        <label className="label">Notes</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input resize-none" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Document'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function DocumentsPage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showUpload, setShowUpload] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<any>(null);
    const { user } = useAuth();

    function loadDocs() {
        setLoading(true);
        api.get('/api/documents', { params: { search } })
            .then(({ data }) => setDocs(data.documents || data.docs || []))
            .catch(() => setDocs([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadDocs(); }, [search]);

    async function handleDelete(id: string) {
        if (!confirm('Delete this document?')) return;
        try {
            await api.delete(`/api/documents/${id}`);
            toast.success('Document deleted');
            setDocs(prev => prev.filter(d => d._id !== id));
        } catch { toast.error('Failed to delete'); }
    }

    const filtered = docs.filter(d => activeCategory === 'all' || d.type === activeCategory);

    return (
        <div>
            {showUpload && (
                <UploadModal
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => { setShowUpload(false); loadDocs(); }}
                />
            )}
            {previewDoc && (
                <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-subtitle">{filtered.length} of {docs.length} documents</p>
                </div>
                <button onClick={() => setShowUpload(true)} className="btn-primary">
                    <Plus className="w-4 h-4" /> Add Document
                </button>
            </div>

            {/* Search + Category Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="input pl-9 w-full" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                                activeCategory === cat.key
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No documents found</p>
                    <p className="text-gray-300 text-sm mt-1">
                        {activeCategory !== 'all' ? `No documents in "${activeCategory}" category` : 'Upload your first document to get started'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((doc: any) => {
                        const Icon = getFileIcon(doc.title || doc.url);
                        const typeBadge = TYPE_COLORS[doc.type] || TYPE_COLORS.other;
                        return (
                            <div key={doc._id} className="card p-4 hover:shadow-md transition-all group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', typeBadge)}>
                                                {doc.type?.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        {doc.employeeTag && (
                                            <p className="text-xs text-gray-400 mt-0.5">👤 {doc.employeeTag}</p>
                                        )}
                                        {doc.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{doc.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                    <button
                                        onClick={() => setPreviewDoc(doc)}
                                        className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                    </button>
                                    {doc.url && (
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-gray-500 font-medium hover:text-gray-700 transition-colors">
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </a>
                                    )}
                                    {(user?.role === 'admin' || user?.role === 'hr') && (
                                        <button onClick={() => handleDelete(doc._id)}
                                            className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
