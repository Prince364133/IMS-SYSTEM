'use client';

import { useState, useEffect } from 'react';
import api from '../lib/api';
import { X, Target, AlignLeft, Users, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
    onClose: () => void;
    onSuccess: (goal: any) => void;
    editGoal?: any;
}

const GOAL_TYPES = ['personal', 'team', 'company'];
const STATUSES = ['active', 'paused', 'completed', 'cancelled'];

export default function CreateGoalModal({ onClose, onSuccess, editGoal }: Props) {
    const isEdit = !!editGoal;
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [form, setForm] = useState({
        title: editGoal?.title || '',
        description: editGoal?.description || '',
        type: editGoal?.type || 'personal',
        status: editGoal?.status || 'active',
        progress: editGoal?.progress || 0,
        ownerId: editGoal?.ownerId?._id || editGoal?.ownerId || '',
        dueDate: editGoal?.dueDate ? editGoal.dueDate.slice(0, 10) : '',
    });

    useEffect(() => {
        api.get('/api/users', { params: { limit: 100 } }).then(({ data }) => setEmployees(data.users || []));
    }, []);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) return toast.error('Title is required');
        setLoading(true);
        try {
            if (isEdit) {
                const { data } = await api.put(`/api/goals/${editGoal._id}`, form);
                toast.success('Goal updated!');
                onSuccess(data.goal);
            } else {
                const { data } = await api.post('/api/goals', form);
                toast.success('Goal created!');
                onSuccess(data.goal);
            }
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to save goal');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Target className="w-4 h-4 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Goal' : 'New Goal'}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Goal Title *</label>
                        <div className="relative">
                            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={form.title} onChange={set('title')} placeholder="What do you want to achieve?" className="input pl-9" required />
                        </div>
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <textarea value={form.description} onChange={set('description')} placeholder="Describe the goal..." rows={3} className="input pl-9 resize-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Type</label>
                            <select value={form.type} onChange={set('type')} className="select">
                                {GOAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select value={form.status} onChange={set('status')} className="select">
                                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Owner</label>
                            <select value={form.ownerId} onChange={set('ownerId')} className="select">
                                <option value="">Unassigned</option>
                                {employees.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Due Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={form.dueDate} onChange={set('dueDate')} type="date" className="input pl-9" />
                            </div>
                        </div>
                    </div>

                    {isEdit && (
                        <div>
                            <label className="label">Progress: {form.progress}%</label>
                            <input
                                type="range" min={0} max={100} value={form.progress}
                                onChange={e => setForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
                                className="w-full accent-indigo-600"
                            />
                        </div>
                    )}
                </form>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="btn-secondary">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save Changes' : 'Create Goal'}
                    </button>
                </div>
            </div>
        </div>
    );
}
