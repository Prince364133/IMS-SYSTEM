'use client';

import { useEffect, useState } from 'react';
import {
    X, FileText, Edit2, Loader2, Tags, Mail, Users, ChevronDown, Check,
    Download, Printer, HardDrive, ExternalLink, ArrowLeft, Save, FileBadge2
} from 'lucide-react';
import { DOCUMENT_TEMPLATES, DocumentTemplate, BrandConfig } from './templatesData';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useSettings } from '../../lib/settings-context';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    contract: 'bg-blue-50 text-blue-700 border-blue-100',
    offer_letter: 'bg-purple-50 text-purple-700 border-purple-100',
    policy: 'bg-amber-50 text-amber-700 border-amber-100',
    report: 'bg-rose-50 text-rose-700 border-rose-100',
    other: 'bg-gray-50 text-gray-600 border-gray-100',
};

// ─── Export / Format buttons ──────────────────────────────────────────────────
function ExportBar({
    htmlContent,
    title,
    driveConfigured,
    onSaveToDrive,
    saving,
}: {
    htmlContent: string;
    title: string;
    driveConfigured: boolean;
    onSaveToDrive: () => void;
    saving: boolean;
}) {
    const slug = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    function downloadHTML() {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${slug}.html`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success('Downloaded as HTML');
    }

    function printPDF() {
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return toast.error('Popup blocked — allow popups for this site.');
        w.document.write(htmlContent);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 400);
        toast('Print dialog opened. Select "Save as PDF" to download as PDF.', { icon: '🖨️' });
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Always-visible Download HTML */}
            <button
                onClick={downloadHTML}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
                <Download className="w-3.5 h-3.5" /> Download HTML
            </button>

            {/* Print / Save as PDF */}
            <button
                onClick={printPDF}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
                <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>

            {/* Save to Drive (always shown, different label if not configured) */}
            <button
                onClick={onSaveToDrive}
                disabled={saving}
                className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors border',
                    driveConfigured
                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                )}
                title={driveConfigured ? 'Save to Google Drive' : 'Drive not configured — saves to cloud storage'}
            >
                {saving
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : driveConfigured
                        ? <HardDrive className="w-3.5 h-3.5" />
                        : <Save className="w-3.5 h-3.5" />
                }
                {driveConfigured ? 'Save to Drive' : 'Save to Cloud'}
                {!driveConfigured && (
                    <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold border border-amber-200">
                        Drive not set
                    </span>
                )}
            </button>
        </div>
    );
}

// ─── Template Editor ──────────────────────────────────────────────────────────
function TemplateEditor({
    template,
    brand,
    driveConfigured,
    onBack,
    onClose,
    onSuccess,
}: {
    template: DocumentTemplate;
    brand: BrandConfig;
    driveConfigured: boolean;
    onBack: () => void;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [title, setTitle] = useState(template.title);
    const [docType, setDocType] = useState<string>(template.category);
    const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
    const [sendEmail, setSendEmail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [preview, setPreview] = useState(false);

    // Generate live branded HTML from template
    const liveHtml = template.generate({ ...brand, /* pass any overrides if needed */ });

    useEffect(() => {
        setLoadingUsers(true);
        api.get('/api/users?limit=200')
            .then(({ data }) => setAllUsers(data.users || data || []))
            .catch(() => { })
            .finally(() => setLoadingUsers(false));
    }, []);

    const filteredUsers = allUsers.filter(u =>
        `${u.name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
    );

    const toggleUser = (u: any) => {
        setTaggedUsers(prev =>
            prev.find(x => x._id === u._id) ? prev.filter(x => x._id !== u._id) : [...prev, u]
        );
    };

    async function handleSaveToDrive() {
        if (!title.trim()) return toast.error('Please provide a document title.');
        setSaving(true);
        try {
            const htmlToSave = liveHtml;
            const blob = new Blob([htmlToSave], { type: 'text/html' });
            const file = new File([blob], `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`, { type: 'text/html' });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', title);
            formData.append('type', docType);
            formData.append('sendEmail', sendEmail.toString());
            if (taggedUsers.length > 0) {
                formData.append('taggedUsers', JSON.stringify(taggedUsers.map(u => u._id)));
            }

            await api.post('/api/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success(driveConfigured ? '✅ Saved to Google Drive!' : '✅ Document saved to cloud storage!');
            onSuccess();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save document');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <FileBadge2 className="w-4 h-4 text-indigo-500" />
                            <h2 className="text-base font-bold text-gray-900">Generate Document</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPreview(v => !v)}
                            className={clsx('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors',
                                preview ? 'bg-indigo-600 text-white border-indigo-600' : 'text-gray-600 border-gray-200 hover:border-indigo-300')}>
                            <ExternalLink className="w-3.5 h-3.5" /> {preview ? 'Hide Preview' : 'Preview'}
                        </button>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto flex flex-col lg:flex-row min-h-0">

                    {/* Left: Settings */}
                    <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-100 p-6 flex flex-col gap-5 flex-shrink-0 overflow-auto">

                        <div>
                            <label className="label">Document Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="input" />
                        </div>
                        <div>
                            <label className="label">Category</label>
                            <select value={docType} onChange={e => setDocType(e.target.value)} className="select">
                                {['contract', 'offer_letter', 'payslip', 'policy', 'report', 'other'].map(t => (
                                    <option key={t} value={t}>{t.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                                ))}
                            </select>
                        </div>

                        {/* Branding info (read-only) */}
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <p className="text-xs font-bold text-indigo-700 mb-1.5 flex items-center gap-1.5">
                                <FileBadge2 className="w-3.5 h-3.5" /> Company Branding Applied
                            </p>
                            <p className="text-xs text-indigo-600"><strong>Name:</strong> {brand.companyName}</p>
                            {brand.logoUrl && <p className="text-xs text-indigo-600 mt-0.5"><strong>Logo:</strong> ✓ Included</p>}
                            <p className="text-xs text-indigo-600 mt-0.5"><strong>Color:</strong> {brand.brandColor || '#4f46e5'}</p>
                            <p className="text-xs text-indigo-400 mt-2">Branding is auto-applied from Settings.</p>
                        </div>

                        {/* User tagging */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Tags className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-sm font-semibold text-gray-900">Tag Users</span>
                                    {taggedUsers.length > 0 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">{taggedUsers.length}</span>
                                    )}
                                </div>
                                <button onClick={() => setShowUserPicker(v => !v)}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    {showUserPicker ? 'Done' : '+ Tag'} <ChevronDown className={clsx('w-3 h-3 transition-transform', showUserPicker && 'rotate-180')} />
                                </button>
                            </div>

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

                            {showUserPicker && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="p-2 border-b border-gray-100 bg-gray-50">
                                        <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                            placeholder="Search users..." autoFocus
                                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                                    </div>
                                    <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
                                        {loadingUsers ? (
                                            <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>
                                        ) : filteredUsers.length === 0 ? (
                                            <p className="text-xs text-gray-400 text-center py-4">No users found</p>
                                        ) : filteredUsers.map(u => (
                                            <button key={u._id} type="button" onClick={() => toggleUser(u)}
                                                className={clsx('w-full flex items-center gap-3 px-3 py-2 text-left text-xs hover:bg-gray-50 transition-colors',
                                                    taggedUsers.find(x => x._id === u._id) ? 'bg-indigo-50' : '')}>
                                                <div className="w-7 h-7 min-w-[28px] rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                                    {u.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                                                    <p className="text-gray-400 truncate">{u.email}</p>
                                                </div>
                                                {taggedUsers.find(x => x._id === u._id) && <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Email toggle */}
                        <label className={clsx('flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                            sendEmail ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200')}>
                            <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-0.5" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                    <span className="text-sm font-semibold text-gray-900">Email Notification</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">Send email to all tagged users on save.</p>
                            </div>
                        </label>

                        {/* Export buttons */}
                        <div className="mt-auto pt-5 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Export Options</p>
                            <ExportBar
                                htmlContent={liveHtml}
                                title={title}
                                driveConfigured={driveConfigured}
                                onSaveToDrive={handleSaveToDrive}
                                saving={saving}
                            />
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1 bg-gray-100 overflow-auto p-6 min-h-0">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden min-h-full">
                            <iframe
                                srcDoc={liveHtml}
                                title="Document Preview"
                                className="w-full h-full min-h-[600px] border-0"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Templates Grid ───────────────────────────────────────────────────────────
export default function TemplatesListModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [filterCat, setFilterCat] = useState<string>('all');
    const { settings } = useSettings();

    // Build brand config from settings
    const brand: BrandConfig = {
        companyName: settings?.companyName || 'Your Company',
        logoUrl: settings?.logoUrl || '',
        brandColor: settings?.themeColor || '#4f46e5',
        email: settings?.emailFrom || '',
    };

    // Drive is configured if storageMode is google_drive AND service account is filled
    const driveConfigured = settings?.storageMode === 'google_drive' && !!settings?.googleDriveServiceAccount;

    const categories = ['all', 'contract', 'offer_letter', 'policy', 'report', 'other'];
    const filtered = DOCUMENT_TEMPLATES.filter(t => filterCat === 'all' || t.category === filterCat);

    if (selectedTemplate) {
        return (
            <TemplateEditor
                template={selectedTemplate}
                brand={brand}
                driveConfigured={driveConfigured}
                onBack={() => setSelectedTemplate(null)}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Document Templates</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {DOCUMENT_TEMPLATES.length} professionally branded, ready-to-use templates
                            {!driveConfigured && (
                                <span className="ml-2 text-amber-600 font-medium">· Google Drive not configured (download still available)</span>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 px-6 py-3 border-b border-gray-50 flex-wrap flex-shrink-0">
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize border',
                                filterCat === c
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600')}>
                            {c.replace('_', ' ')}
                            {c !== 'all' && (
                                <span className="ml-1.5 opacity-60">({DOCUMENT_TEMPLATES.filter(t => t.category === c).length})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Brand preview bar */}
                <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
                    {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt="logo" className="w-6 h-6 rounded-md object-contain" />
                    ) : (
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black" style={{ background: brand.brandColor }}>
                            {brand.companyName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="text-xs text-indigo-700 font-medium">
                        All templates will be branded with <strong>{brand.companyName}</strong> — your logo, brand color, and contact info are auto-injected.
                    </span>
                    {driveConfigured ? (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <HardDrive className="w-3 h-3" /> Google Drive Active
                        </span>
                    ) : (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Download className="w-3 h-3" /> Download Mode
                        </span>
                    )}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(t => (
                            <div key={t.id} onClick={() => setSelectedTemplate(t)}
                                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-300">
                                        <FileText className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <span className={clsx('text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border', CATEGORY_COLORS[t.category] || CATEGORY_COLORS.other)}>
                                        {t.category.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">
                                    {t.title}
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed flex-1">{t.description}</p>
                                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                                        <Edit2 className="w-3.5 h-3.5" /> Use Template
                                    </span>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        {driveConfigured ? <HardDrive className="w-3 h-3 text-emerald-500" /> : <Download className="w-3 h-3" />}
                                        {driveConfigured ? 'Save to Drive' : 'Download'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
