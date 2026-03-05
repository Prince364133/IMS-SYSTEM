'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, CheckSquare, AlignLeft, FolderKanban, User, Flag, Calendar, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (task: any) => void;
    projectId?: string; // pre-select project if opened from project detail
}

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];

export default function CreateTaskModal({ onClose, onSuccess, projectId }: Props) {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [form, setForm] = useState({
        title: '',
        description: '',
        projectId: projectId || '',
        assigneeId: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
    });

    useEffect(() => {
        api.get('/api/projects', { params: { limit: 100 } }).then(({ data }) => setProjects(data.projects || []));
        api.get('/api/users', { params: { limit: 100 } }).then(({ data }) => setEmployees(data.users || []));
    }, []);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Title is required');
        setLoading(true);
        try {
            const { data } = await api.post('/api/tasks', form);
            toast.success('Task created!');
            onSuccess(data.task);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Create Task</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Task Title *</label>
                        <div className="relative">
                            <CheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.title} onChange={set('title')} placeholder="What needs to be done?" className="input pl-9" required />
                        </div>
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea value={form.description} onChange={set('description')} placeholder="Add more details..." rows={3} className="input pl-9 resize-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Project</label>
                            <select value={form.projectId} onChange={set('projectId')} className="select">
                                <option value="">No project</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Assignee</label>
                            <select value={form.assigneeId} onChange={set('assigneeId')} className="select">
                                <option value="">Unassigned</option>
                                {employees.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Priority</label>
                            <select value={form.priority} onChange={set('priority')} className="select">
                                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select value={form.status} onChange={set('status')} className="select">
                                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">Due Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.dueDate} onChange={set('dueDate')} type="date" className="input pl-9" />
                        </div>
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
