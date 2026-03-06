'use client';

import { useState } from 'react';
import api from '../lib/api';
import { X, Briefcase, MapPin, Users, Calendar, AlignLeft, Tag, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (job: any) => void;
    editJob?: any;
}

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship'];
const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations', 'Sales', 'Support', 'Management'];

export default function PostJobModal({ onClose, onSuccess, editJob }: Props) {
    const isEdit = !!editJob;
    const [loading, setLoading] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [form, setForm] = useState({
        title: editJob?.title || '',
        department: editJob?.department || '',
        type: editJob?.type || 'full_time',
        location: editJob?.location || '',
        description: editJob?.description || '',
        requirements: editJob?.requirements || '',
        roleCategory: editJob?.roleCategory || 'Engineering',
        openings: editJob?.openings || 1,
        deadline: editJob?.deadline ? editJob.deadline.slice(0, 10) : '',
        skills: editJob?.skills || [] as string[],
        customFields: editJob?.customFields || [] as { label: string; name: string; type: string; required: boolean }[],
    });

    const categories = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Support', 'Management'];

    function addCustomField() {
        setForm(prev => ({
            ...prev,
            customFields: [...prev.customFields, { label: '', name: '', type: 'text', required: false }]
        }));
    }

    function removeCustomField(idx: number) {
        setForm(prev => ({
            ...prev,
            customFields: prev.customFields.filter((_, i) => i !== idx)
        }));
    }

    function updateCustomField(idx: number, key: string, val: any) {
        setForm(prev => ({
            ...prev,
            customFields: prev.customFields.map((f, i) => i === idx ? { ...f, [key]: val } : f)
        }));
    }

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    function addSkill() {
        const s = skillInput.trim();
        if (s && !form.skills.includes(s)) {
            setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
        }
        setSkillInput('');
    }

    function removeSkill(skill: string) {
        setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Job title is required');
        setLoading(true);
        try {
            if (isEdit) {
                const { data } = await api.put(`/api/jobs/${editJob._id}`, form);
                toast.success('Job posting updated!');
                onSuccess(data.job);
            } else {
                const { data } = await api.post('/api/jobs', form);
                toast.success('Job posted!');
                onSuccess(data.job);
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save job posting');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Job' : 'Post a Job'}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Job Title *</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.title} onChange={set('title')} placeholder="e.g. Senior React Developer" className="input pl-9" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Role Category *</label>
                            <select value={form.roleCategory} onChange={set('roleCategory')} className="select" required>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Employment Type</label>
                            <select value={form.type} onChange={set('type')} className="select">
                                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.location} onChange={set('location')} placeholder="Remote / Mumbai" className="input pl-9" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Openings</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.openings} onChange={set('openings')} type="number" min={1} className="input pl-9" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Application Deadline</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.deadline} onChange={set('deadline')} type="date" className="input pl-9" />
                        </div>
                    </div>

                    {/* Dynamic Application Form Builder */}
                    <div className="pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <label className="label m-0">Dynamic Application Form</label>
                            <button type="button" onClick={addCustomField} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Field
                            </button>
                        </div>
                        <div className="space-y-3">
                            {form.customFields.map((field, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 relative group">
                                    <button
                                        type="button"
                                        onClick={() => removeCustomField(idx)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-12 sm:col-span-5">
                                            <input
                                                value={field.label}
                                                onChange={e => {
                                                    updateCustomField(idx, 'label', e.target.value);
                                                    updateCustomField(idx, 'name', e.target.value.toLowerCase().replace(/\s+/g, '_'));
                                                }}
                                                placeholder="Field Label (e.g. Portfolio Link)"
                                                className="input text-xs"
                                            />
                                        </div>
                                        <div className="col-span-6 sm:col-span-4">
                                            <select
                                                value={field.type}
                                                onChange={e => updateCustomField(idx, 'type', e.target.value)}
                                                className="select text-xs h-9"
                                            >
                                                <option value="text">Text</option>
                                                <option value="textarea">Long Text</option>
                                                <option value="number">Number</option>
                                                <option value="url">URL</option>
                                                <option value="file">File Upload</option>
                                            </select>
                                        </div>
                                        <div className="col-span-6 sm:col-span-3 flex items-center px-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={e => updateCustomField(idx, 'required', e.target.checked)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-[10px] font-medium text-gray-500 uppercase">Required</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {form.customFields.length === 0 && (
                                <p className="text-[10px] text-gray-400 italic text-center py-2 bg-gray-50/50 rounded-lg border border-dashed border-gray-100">
                                    No custom fields yet. Only basic details will be requested.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="label">Job Description</label>
                        <textarea value={form.description} onChange={set('description')} placeholder="Describe the role..." rows={3} className="input resize-none" />
                    </div>

                    <div>
                        <label className="label">Requirements</label>
                        <textarea value={form.requirements} onChange={set('requirements')} placeholder="Required skills and experience..." rows={2} className="input resize-none" />
                    </div>

                    <div>
                        <label className="label">Skills</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                placeholder="Type skill and press Enter"
                                className="input flex-1"
                            />
                            <button type="button" onClick={addSkill} className="btn-secondary text-sm px-3">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {form.skills.map(s => (
                                <span key={s} className="badge badge-blue gap-1 cursor-pointer" onClick={() => removeSkill(s)}>
                                    {s} <X className="w-3 h-3" />
                                </span>
                            ))}
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Post Job'}
                    </button>
                </div>
            </div>
        </div>
    );
}
