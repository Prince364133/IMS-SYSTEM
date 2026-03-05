'use client';

import { useEffect, useState, FormEvent } from 'react';
import api from '../lib/api';
import {
    X, FolderKanban, Loader2, Plus, Users, Calendar, Flag,
    Tag, AlignLeft, CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (project: any) => void;
}

const STATUS_OPTS = ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'];
const PRIORITY_OPTS = [
    { value: 'low', label: 'Low', dot: 'bg-gray-400' },
    { value: 'medium', label: 'Medium', dot: 'bg-blue-500' },
    { value: 'high', label: 'High', dot: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', dot: 'bg-red-500' },
];

export default function CreateProjectModal({ onClose, onSuccess }: Props) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Step 1 — Details
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('planning');
    const [priority, setPriority] = useState('medium');
    const [startDate, setStartDate] = useState('');
    const [deadline, setDeadline] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // Step 2 — Members
    const [users, setUsers] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [userSearch, setUserSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (step === 2) {
            setLoadingUsers(true);
            api.get('/api/users', { params: { limit: 100 } })
                .then(({ data }) => setUsers(data.users))
                .finally(() => setLoadingUsers(false));
        }
    }, [step]);

    const addTag = () => {
        const val = tagInput.trim();
        if (val && !tags.includes(val)) setTags(prev => [...prev, val]);
        setTagInput('');
    };

    const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t));

    const toggleMember = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Project name is required');
        setSubmitting(true);
        try {
            const { data } = await api.post('/api/projects', {
                name: name.trim(),
                description: description.trim(),
                status,
                priority,
                startDate: startDate || undefined,
                deadline: deadline || undefined,
                tags,
                memberIds: Array.from(selectedIds),
            });
            toast.success('Project created!');
            onSuccess(data.project);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create project');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Create Project</h2>
                            <p className="text-xs text-gray-400">Step {step} of 2 — {step === 1 ? 'Details' : 'Add Members'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex px-6 pt-4 gap-2">
                    {[1, 2].map(s => (
                        <div key={s} className={clsx('h-1 flex-1 rounded-full transition-all', s <= step ? 'bg-indigo-500' : 'bg-gray-100')} />
                    ))}
                </div>

                <form onSubmit={submit} className="flex-1 overflow-y-auto">
                    {/* ── Step 1: Details ── */}
                    {step === 1 && (
                        <div className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="form-label">Project Name <span className="text-red-400">*</span></label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Instaura Website Redesign"
                                    className="input"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="form-label flex items-center gap-1.5"><AlignLeft className="w-3.5 h-3.5" />Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="What's this project about?"
                                    rows={3}
                                    className="input resize-none"
                                />
                            </div>

                            {/* Status + Priority */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)} className="select">
                                        {STATUS_OPTS.map(s => (
                                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" />Priority</label>
                                    <div className="flex gap-1 flex-wrap mt-1">
                                        {PRIORITY_OPTS.map(p => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => setPriority(p.value)}
                                                className={clsx(
                                                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                                                    priority === p.value
                                                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                )}
                                            >
                                                <span className={clsx('w-1.5 h-1.5 rounded-full', p.dot)} />
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="form-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Start Date</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                                </div>
                                <div>
                                    <label className="form-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Deadline</label>
                                    <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input" />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="form-label flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Tags</label>
                                <div className="flex gap-2">
                                    <input
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Press Enter to add tag"
                                        className="input flex-1"
                                    />
                                    <button type="button" onClick={addTag} className="btn-secondary px-3">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {tags.map(t => (
                                            <span key={t} className="badge badge-blue cursor-pointer hover:bg-red-100 hover:text-red-600 transition-colors" onClick={() => removeTag(t)}>
                                                {t} ×
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Members ── */}
                    {step === 2 && (
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-3">
                                Select team members to add to this project.
                                {selectedIds.size > 0 && (
                                    <span className="ml-1 font-semibold text-indigo-600">{selectedIds.size} selected</span>
                                )}
                            </p>
                            <input
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                placeholder="Search employees..."
                                className="input mb-3"
                            />
                            <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
                                {loadingUsers ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                    </div>
                                ) : filteredUsers.map(u => {
                                    const selected = selectedIds.has(u._id);
                                    return (
                                        <button
                                            key={u._id}
                                            type="button"
                                            onClick={() => toggleMember(u._id)}
                                            className={clsx(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left border',
                                                selected
                                                    ? 'bg-indigo-50 border-indigo-200'
                                                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{u.position || u.role}</p>
                                            </div>
                                            {selected && <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => step === 1 ? onClose() : setStep(1)}
                        className="btn-secondary"
                    >
                        {step === 1 ? 'Cancel' : '← Back'}
                    </button>
                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={() => { if (!name.trim()) return toast.error('Project name is required'); setStep(2); }}
                            className="btn-primary"
                        >
                            Next: Add Members →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={submit as any}
                            disabled={submitting}
                            className="btn-primary"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderKanban className="w-4 h-4" />}
                            {submitting ? 'Creating...' : 'Create Project'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
