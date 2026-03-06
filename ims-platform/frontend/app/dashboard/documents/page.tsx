'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../../lib/api';
import {
    FileText, Upload, Search, Loader2, Plus, Download, Trash2,
    File, FolderOpen, Image, Video, X, ExternalLink, Eye,
    Tags, Mail, LayoutTemplate, Link2, Users, CheckCircle,
    AlertCircle, FileIcon, ImageIcon, ChevronDown, Bot
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import TemplatesListModal from '../../../components/documents/TemplatesListModal';
import DocumentAIChatModal from '../../../components/documents/DocumentAIChatModal';

interface Document {
    _id: string;
    title: string;
    name: string;
    url: string;
    type: string;
    createdAt: string;
    taggedUsers?: { _id: string; name: string; email: string }[];
    notes?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
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
    contract: 'bg-blue-50 text-blue-700 border-blue-100',
    offer_letter: 'bg-purple-50 text-purple-700 border-purple-100',
    payslip: 'bg-green-50 text-green-700 border-green-100',
    policy: 'bg-amber-50 text-amber-700 border-amber-100',
    report: 'bg-rose-50 text-rose-700 border-rose-100',
    other: 'bg-gray-50 text-gray-600 border-gray-100',
};

const MAX_SIZE_MB = 20;
const ACCEPTED = ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip', '.html'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getFileIcon(name: string) {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return Image;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return Video;
    if (['pdf', 'doc', 'docx', 'txt', 'html'].includes(ext || '')) return FileText;
    return File;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: any; onClose: () => void }) {
    const ext = doc.url?.split('.').pop()?.split('?')[0]?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    const isPDF = ext === 'pdf';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 truncate max-w-[60vw]">{doc.title}</h2>
                            <p className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                            </a>
                        )}
                        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                    {isImage ? (
                        <img src={doc.url} alt={doc.title} className="max-w-full mx-auto rounded-xl shadow-lg" />
                    ) : isPDF ? (
                        <iframe src={doc.url} className="w-full h-[72vh] rounded-xl border border-gray-200" title={doc.title} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                                <FileText className="w-9 h-9 text-indigo-300" />
                            </div>
                            <p className="text-gray-600 font-semibold text-lg mb-1">Preview unavailable</p>
                            <p className="text-gray-400 text-sm mb-5">This file type cannot be previewed in-browser.</p>
                            {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                                    <Download className="w-4 h-4" /> Download File
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
interface FileItem {
    file: File;
    preview?: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    progress: number;
    error?: string;
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [tab, setTab] = useState<'upload' | 'link'>('upload');
    const [items, setItems] = useState<FileItem[]>([]);
    const [dragging, setDragging] = useState(false);
    const [docType, setDocType] = useState('other');
    const [linkName, setLinkName] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkType, setLinkType] = useState('other');
    const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
    const [sendEmail, setSendEmail] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const [settingsLoading, setSettingsLoading] = useState(true);
    const [driveConfigured, setDriveConfigured] = useState(false);

    useEffect(() => {
        setLoadingUsers(true);
        Promise.all([
            api.get('/api/users?limit=200').catch(() => ({ data: [] })),
            api.get('/api/settings').catch(() => ({ data: null }))
        ]).then(([usersRes, settingsRes]) => {
            setAllUsers(usersRes.data.users || usersRes.data || []);

            const settings = settingsRes.data?.settings;
            if (settings) {
                const isDrive = settings.storageMode === 'google_drive';
                const hasKeys = !!settings.googleDriveServiceAccount && !!settings.googleDriveFolderId;
                setDriveConfigured(isDrive && hasKeys);
            }
        }).finally(() => {
            setLoadingUsers(false);
            setSettingsLoading(false);
        });
    }, []);

    const addFiles = useCallback((files: File[]) => {
        const newItems: FileItem[] = files
            .filter(f => f.size <= MAX_SIZE_MB * 1024 * 1024)
            .map(file => ({
                file,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                status: 'pending',
                progress: 0,
            }));
        setItems(prev => [...prev, ...newItems]);
    }, []);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const removeItem = (idx: number) => {
        setItems(prev => {
            const next = [...prev];
            if (next[idx].preview) URL.revokeObjectURL(next[idx].preview!);
            next.splice(idx, 1);
            return next;
        });
    };

    const filteredUsers = allUsers.filter(u =>
        `${u.name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
    );

    const toggleUser = (u: any) => {
        setTaggedUsers(prev =>
            prev.find(x => x._id === u._id) ? prev.filter(x => x._id !== u._id) : [...prev, u]
        );
    };

    const uploadAll = async () => {
        const pending = items.filter(i => i.status === 'pending');
        if (pending.length === 0) return;
        setSaving(true);

        for (let i = 0; i < items.length; i++) {
            if (items[i].status !== 'pending') continue;
            setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'uploading' } : it));
            try {
                const form = new FormData();
                form.append('file', items[i].file);
                form.append('name', items[i].file.name);
                form.append('type', docType);
                form.append('sendEmail', sendEmail.toString());
                if (taggedUsers.length > 0) form.append('taggedUsers', JSON.stringify(taggedUsers.map(u => u._id)));

                await api.post('/api/files/upload', form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => {
                        const pct = Math.round((e.loaded / (e.total || 1)) * 100);
                        setItems(prev => prev.map((it, idx) => idx === i ? { ...it, progress: pct } : it));
                    },
                });
                setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'done', progress: 100 } : it));
            } catch (err: any) {
                setItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error', error: err?.response?.data?.error || 'Upload failed' } : it));
            }
        }

        toast.success('Files uploaded successfully!');
        setSaving(false);
        onSuccess();
    };

    const handleAddLink = async () => {
        if (!linkUrl || !linkName) return toast.error('Name and URL are required');
        setSaving(true);
        try {
            await api.post('/api/files/link', {
                name: linkName,
                fileUrl: linkUrl,
                type: linkType,
                sendEmail,
                taggedUsers: taggedUsers.map(u => u._id),
            });
            toast.success('Document link added!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to add link');
        } finally {
            setSaving(false);
        }
    };

    const allDone = items.length > 0 && items.every(i => i.status === 'done' || i.status === 'error');
    const hasPending = items.some(i => i.status === 'pending');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Upload Document</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Add files or links to the document vault</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    {settingsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                            <p className="text-sm text-gray-500">Checking configuration...</p>
                        </div>
                    ) : !driveConfigured ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
                                <AlertCircle className="w-10 h-10 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Google Drive Not Configured</h3>
                            <p className="text-gray-500 text-sm mb-6 max-w-md">
                                For security and centralized storage, all file uploads must go directly to Google Drive.
                                Please configure Google Drive in the system settings first.
                            </p>
                            <Link href="/dashboard/settings" onClick={onClose} className="btn-primary">
                                Configure Google Drive
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
                                {[{ key: 'upload', icon: Upload, label: 'Upload File' }, { key: 'link', icon: Link2, label: 'Add Link' }].map(t => (
                                    <button key={t.key} onClick={() => setTab(t.key as any)}
                                        className={clsx('flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all',
                                            tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                                    </button>
                                ))}
                            </div>

                            {tab === 'upload' ? (
                                <div className="space-y-4">
                                    {/* Drop Zone */}
                                    <div
                                        onDrop={onDrop}
                                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                        onDragLeave={() => setDragging(false)}
                                        onClick={() => inputRef.current?.click()}
                                        className={clsx('border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all',
                                            dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50')}
                                    >
                                        <div className={clsx('w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center transition-colors', dragging ? 'bg-indigo-600' : 'bg-indigo-50')}>
                                            <Upload className={clsx('w-6 h-6 transition-colors', dragging ? 'text-white' : 'text-indigo-500')} />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {dragging ? 'Drop files here' : 'Drag & drop or click to browse'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images, ZIP · Max {MAX_SIZE_MB}MB each</p>
                                        <input ref={inputRef} type="file" multiple accept={ACCEPTED.join(',')} onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); }} className="hidden" />
                                    </div>

                                    {/* File list */}
                                    {items.length > 0 && (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-100 flex items-center justify-center">
                                                        {item.preview ? <img src={item.preview} alt="" className="w-full h-full object-cover" /> : <FileText className="w-4 h-4 text-indigo-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-800 truncate">{item.file.name}</p>
                                                        <p className="text-[10px] text-gray-400">{formatBytes(item.file.size)}</p>
                                                        {item.status === 'uploading' && (
                                                            <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                                                            </div>
                                                        )}
                                                        {item.status === 'error' && <p className="text-[10px] text-red-500 mt-0.5">{item.error}</p>}
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {item.status === 'pending' && <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400"><X className="w-4 h-4" /></button>}
                                                        {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                                                        {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                                        {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Type selector */}
                                    <div>
                                        <label className="label">Document Category</label>
                                        <select value={docType} onChange={e => setDocType(e.target.value)} className="select">
                                            {['contract', 'offer_letter', 'payslip', 'policy', 'report', 'other'].map(t => (
                                                <option key={t} value={t}>{t.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                /* Link Tab */
                                <form onSubmit={e => { e.preventDefault(); handleAddLink(); }} className="space-y-4">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Use this to link files already on <b>Google Drive</b>, <b>OneDrive</b>, or any public URL.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="label">Display Name *</label>
                                        <input value={linkName} onChange={e => setLinkName(e.target.value)} className="input" placeholder="e.g. Q4 Financial Report" required />
                                    </div>
                                    <div>
                                        <label className="label">File URL *</label>
                                        <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="input" placeholder="https://drive.google.com/..." type="url" required />
                                    </div>
                                    <div>
                                        <label className="label">Category</label>
                                        <select value={linkType} onChange={e => setLinkType(e.target.value)} className="select">
                                            {['contract', 'offer_letter', 'payslip', 'policy', 'report', 'other'].map(t => (
                                                <option key={t} value={t}>{t.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                                            ))}
                                        </select>
                                    </div>
                                </form>
                            )}

                            {/* ── User Tagging (shared) ── */}
                            <div className="mt-6 border-t border-gray-100 pt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Tags className="w-4 h-4 text-indigo-500" />
                                        <span className="text-sm font-semibold text-gray-900">Tag Users</span>
                                        {taggedUsers.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">{taggedUsers.length}</span>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => setShowUserDropdown(v => !v)}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors">
                                        <Users className="w-3.5 h-3.5" /> {showUserDropdown ? 'Done' : 'Select Users'} <ChevronDown className={clsx('w-3 h-3 transition-transform', showUserDropdown && 'rotate-180')} />
                                    </button>
                                </div>

                                {/* Tags display */}
                                {taggedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {taggedUsers.map(u => (
                                            <span key={u._id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-100 font-medium">
                                                {u.name}
                                                <button onClick={() => toggleUser(u)}><X className="w-3 h-3 text-indigo-400 hover:text-indigo-600" /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* User picker dropdown */}
                                {showUserDropdown && (
                                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <input
                                                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                                placeholder="Search users..."
                                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
                                            />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {loadingUsers ? (
                                                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /></div>
                                            ) : filteredUsers.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-4">No users found</p>
                                            ) : filteredUsers.map(u => (
                                                <button key={u._id} type="button" onClick={() => toggleUser(u)}
                                                    className={clsx('w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs hover:bg-gray-50 transition-colors',
                                                        taggedUsers.find(x => x._id === u._id) ? 'bg-indigo-50' : '')}>
                                                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                                        {u.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{u.name}</p>
                                                        <p className="text-gray-400">{u.email}</p>
                                                    </div>
                                                    {taggedUsers.find(x => x._id === u._id) && <CheckCircle className="w-4 h-4 text-indigo-500 ml-auto" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Email toggle */}
                                <label className={clsx('flex items-start gap-3 mt-4 p-3 rounded-xl border cursor-pointer transition-colors',
                                    sendEmail ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200')}>
                                    <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-0.5" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-sm font-semibold text-gray-900">Send email notification</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Tagged users will receive an email with document details and a link.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                                <button onClick={onClose} className="btn-secondary flex-1">{allDone ? 'Close' : 'Cancel'}</button>
                                {tab === 'upload' ? (
                                    <button onClick={uploadAll} disabled={!hasPending || saving}
                                        className="btn-primary flex-1 shadow-md shadow-indigo-600/20">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {saving ? 'Uploading...' : `Upload ${items.filter(i => i.status === 'pending').length} file(s)`}
                                    </button>
                                ) : (
                                    <button onClick={handleAddLink as any} disabled={saving || !linkUrl || !linkName}
                                        className="btn-primary flex-1 shadow-md shadow-indigo-600/20">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                                        {saving ? 'Saving...' : 'Add Link'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div >
    );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ doc, onCancel, onConfirm }: { doc: any; onCancel: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Document?</h3>
                <p className="text-sm text-gray-500 text-center mb-6">
                    "<span className="font-semibold">{doc.title}</span>" will be permanently deleted. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
    const [docs, setDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [showUpload, setShowUpload] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
    const [showAiChat, setShowAiChat] = useState(false);
    const [selectedAiDoc, setSelectedAiDoc] = useState<Document | null>(null);
    const { user } = useAuth();

    function loadDocs() {
        setLoading(true);
        api.get('/api/files', { params: { search } })
            .then(({ data }) => setDocs(data.documents || data.files || data || []))
            .catch(() => setDocs([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadDocs(); }, [search]);

    async function handleDelete(doc: any) {
        try {
            await api.delete(`/api/files/${doc._id}`);
            toast.success('Document deleted');
            setDocs(prev => prev.filter(d => d._id !== doc._id));
            setDeleteDoc(null);
        } catch { toast.error('Failed to delete'); }
    }

    const filtered = docs.filter(d => activeCategory === 'all' || d.type === activeCategory);
    const isAdminHr = user?.role === 'admin' || user?.role === 'hr';

    return (
        <div className="min-h-full">
            {/* Modals */}
            {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadDocs(); }} />}
            {showTemplates && <TemplatesListModal onClose={() => setShowTemplates(false)} onSuccess={() => { setShowTemplates(false); loadDocs(); }} />}
            {selectedDoc && <PreviewModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
            {deleteDoc && <ConfirmDeleteModal doc={deleteDoc} onCancel={() => setDeleteDoc(null)} onConfirm={() => handleDelete(deleteDoc)} />}
            {showAiChat && selectedAiDoc && (
                <DocumentAIChatModal
                    document={selectedAiDoc}
                    onClose={() => { setShowAiChat(false); setSelectedAiDoc(null); }}
                />
            )}

            {/* Page Header */}
            <div className="page-header">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="page-title">Document Vault</h1>
                        <p className="page-subtitle">Manage contracts, policies, payslips, and company documents</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setShowTemplates(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors">
                            <LayoutTemplate className="w-4 h-4" /> Templates
                        </button>
                        <button onClick={() => setShowUpload(true)} className="btn-primary shadow-md shadow-indigo-600/20">
                            <Plus className="w-4 h-4" /> Upload Document
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    {[
                        { label: 'Total Documents', value: docs.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'Contracts', value: docs.filter(d => d.type === 'contract').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Policies', value: docs.filter(d => d.type === 'policy').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Reports', value: docs.filter(d => d.type === 'report').length, color: 'text-rose-600', bg: 'bg-rose-50' },
                    ].map(s => (
                        <div key={s.label} className={clsx('rounded-xl p-4 flex items-center gap-3', s.bg)}>
                            <div>
                                <p className={clsx('text-2xl font-bold', s.color)}>{s.value}</p>
                                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5 mt-2">
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search documents..." className="input pl-9 w-full"
                    />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {CATEGORIES.map(cat => (
                        <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                            className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                                activeCategory === cat.key
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600')}>
                            {cat.label}
                            {cat.key !== 'all' && (
                                <span className="ml-1.5 opacity-60 text-[10px]">
                                    ({docs.filter(d => d.type === cat.key).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-28">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
                        <p className="text-sm text-gray-400">Loading documents...</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <FolderOpen className="w-9 h-9 text-gray-200" />
                    </div>
                    <p className="text-gray-500 font-semibold text-lg mb-1">No documents found</p>
                    <p className="text-gray-400 text-sm mb-6">
                        {activeCategory !== 'all'
                            ? `No documents in "${activeCategory.replace('_', ' ')}" category`
                            : 'Upload your first document or use a template to get started'}
                    </p>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowTemplates(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors">
                            <LayoutTemplate className="w-4 h-4" /> Browse Templates
                        </button>
                        <button onClick={() => setShowUpload(true)} className="btn-primary">
                            <Upload className="w-4 h-4" /> Upload Document
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((doc: Document) => {
                        const Icon = getFileIcon(doc.title || doc.url || '');
                        const typeBadge = TYPE_COLORS[doc.type] || TYPE_COLORS.other;
                        return (
                            <div key={doc._id} className="card p-5 hover:shadow-lg hover:shadow-gray-100 transition-all duration-200 group flex flex-col">
                                <div className="flex items-start gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors duration-300">
                                        <Icon className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate leading-snug">{doc.title || doc.name}</p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border', typeBadge)}>
                                                {(doc.type || 'other').replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tagged users */}
                                {doc.taggedUsers && doc.taggedUsers.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-indigo-50 rounded-lg">
                                        <Tags className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                        <p className="text-xs text-indigo-600 font-medium truncate">
                                            Tagged: {doc.taggedUsers.map((u: any) => u.name || u).join(', ')}
                                        </p>
                                    </div>
                                )}

                                {doc.notes && (
                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{doc.notes}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-50">
                                    <button onClick={() => setSelectedDoc(doc)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Preview">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    {doc.url && (
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Open in New Tab">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                    <button
                                        onClick={() => { setSelectedAiDoc(doc); setShowAiChat(true); }}
                                        className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100/50 hover:border-indigo-200"
                                        title="Chat with AI"
                                    >
                                        <Bot className="w-4 h-4" />
                                    </button>
                                    {isAdminHr && (
                                        <button onClick={() => setDeleteDoc(doc)} className="ml-auto p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Delete">
                                            <Trash2 className="w-4 h-4" />
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
