'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
    X, CheckSquare, Calendar, User, Tag, AlignLeft, Paperclip,
    Loader2, Save, Trash2, Clock, Flag, FolderKanban,
} from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import FileUploadModal from './FileUploadModal';
import ConfirmModal from './ConfirmModal';
import { useAuth } from '../lib/auth-context';

interface Props {
    taskId: string;
    onClose: () => void;
    onUpdated?: (task: any) => void;
    onDeleted?: (id: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do', cls: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
    { value: 'in_review', label: 'In Review', cls: 'bg-amber-100 text-amber-700' },
    { value: 'done', label: 'Done', cls: 'bg-emerald-100 text-emerald-700' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    { value: 'medium', label: 'Medium', cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { value: 'high', label: 'High', cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
];

export default function TaskDetailModal({ taskId, onClose, onUpdated, onDeleted }: Props) {
    const [task, setTask] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { user } = useAuth();

    // Editable fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [estimatedHours, setEst] = useState('');

    useEffect(() => {
        Promise.all([
            api.get(`/api/tasks/${taskId}`),
            api.get('/api/users', { params: { limit: 100 } }),
        ]).then(([tRes, uRes]) => {
            const t = tRes.data.task;
            setTask(t);
            setTitle(t.title);
            setDescription(t.description || '');
            setStatus(t.status);
            setPriority(t.priority);
            setAssigneeId(t.assigneeId?._id || '');
            setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : '');
            setEst(t.estimatedHours?.toString() || '');
            setMembers(uRes.data.users);
        }).finally(() => setLoading(false));
    }, [taskId]);

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await api.put(`/api/tasks/${taskId}`, {
                title, description, status, priority,
                assigneeId: assigneeId || null,
                dueDate: dueDate || null,
                estimatedHours: estimatedHours ? Number(estimatedHours) : null,
            });
            onUpdated?.(data.task);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const deleteTask = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/tasks/${taskId}`);
            onDeleted?.(taskId);
            onClose();
        } catch (err: any) {
            console.error('Delete task error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const assignee = members.find(m => m._id === assigneeId);
    const statusCfg = STATUS_OPTIONS.find(s => s.value === status);
    const priorityCfg = PRIORITY_OPTIONS.find(p => p.value === priority);

    const canEdit = user?.role === 'admin' || user?.role === 'manager';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                        </div>
                        {loading ? (
                            <div className="h-5 bg-gray-100 rounded animate-pulse w-48" />
                        ) : canEdit ? (
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="flex-1 text-lg font-bold text-gray-900 bg-transparent border-0 outline-none placeholder-gray-300 focus:ring-0 p-0"
                                placeholder="Task title"
                            />
                        ) : (
                            <h2 className="flex-1 text-lg font-bold text-gray-900">{title}</h2>
                        )}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-0">
                            {/* Main: Description */}
                            <div className="flex-1 p-6 lg:border-r border-gray-100">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <AlignLeft className="w-3.5 h-3.5" />Description
                                </label>
                                {canEdit ? (
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a description..."
                                        rows={6}
                                        className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none transition-all placeholder-gray-300"
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{description || 'No description provided.'}</p>
                                )}

                                {/* Attachments */}
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Paperclip className="w-3.5 h-3.5" />Attachments
                                        </label>
                                        {canEdit && (
                                            <button
                                                onClick={() => setShowUpload(true)}
                                                className="text-xs text-indigo-600 hover:underline"
                                            >+ Add file</button>
                                        )}
                                    </div>
                                    {task?.attachments?.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No attachments yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar: Meta fields */}
                            <div className="w-full lg:w-64 p-6 space-y-5 flex-shrink-0">

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {STATUS_OPTIONS.map(o => (
                                            <button
                                                key={o.value}
                                                onClick={() => canEdit && setStatus(o.value)}
                                                disabled={!canEdit}
                                                className={clsx(
                                                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                                                    o.cls,
                                                    status === o.value ? 'ring-2 ring-offset-1 ring-indigo-400' : 'opacity-60 hover:opacity-100'
                                                )}
                                            >{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Priority</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PRIORITY_OPTIONS.map(o => (
                                            <button
                                                key={o.value}
                                                onClick={() => canEdit && setPriority(o.value)}
                                                disabled={!canEdit}
                                                className={clsx(
                                                    'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                                                    o.cls,
                                                    priority === o.value ? 'ring-2 ring-offset-1 ring-indigo-400' : 'opacity-60 hover:opacity-100'
                                                )}
                                            >
                                                <span className={clsx('w-1.5 h-1.5 rounded-full', o.dot)} />
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Assignee */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <User className="w-3 h-3" />Assignee
                                    </label>
                                    {canEdit ? (
                                        <select
                                            value={assigneeId}
                                            onChange={(e) => setAssigneeId(e.target.value)}
                                            className="select w-full text-sm"
                                        >
                                            <option value="">Unassigned</option>
                                            {members.map(m => (
                                                <option key={m._id} value={m._id}>{m.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="text-sm font-medium">
                                            {assignee ? assignee.name : 'Unassigned'}
                                        </div>
                                    )}
                                    {assignee && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-[9px] font-bold">{assignee.name?.[0]?.toUpperCase()}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">{assignee.name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Calendar className="w-3 h-3" />Due Date
                                    </label>
                                    {canEdit ? (
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="input text-sm"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium">{dueDate || 'No set date'}</div>
                                    )}
                                </div>

                                {/* Estimated Hours */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <Clock className="w-3 h-3" />Est. Hours
                                    </label>
                                    {canEdit ? (
                                        <input
                                            type="number"
                                            min="0"
                                            value={estimatedHours}
                                            onChange={(e) => setEst(e.target.value)}
                                            placeholder="0"
                                            className="input text-sm"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium">{estimatedHours || 'None'}</div>
                                    )}
                                </div>

                                {/* Created info */}
                                {task?.createdAt && (
                                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-50">
                                        Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100 gap-3">
                    {canEdit ? (
                        <>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={loading || deleting}
                                className="btn-danger"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                            <div className="flex gap-2">
                                <button onClick={onClose} className="btn-secondary">Cancel</button>
                                <button onClick={save} disabled={loading || saving} className="btn-primary">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex justify-end">
                            <button onClick={onClose} className="btn-secondary">Close</button>
                        </div>
                    )}
                </div>
            </div>

            {showUpload && task && (
                <FileUploadModal
                    relatedId={task._id}
                    relatedModel="Task"
                    onClose={() => setShowUpload(false)}
                    onSuccess={() => { }}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteConfirm}
                title="Delete Task"
                message="Are you sure you want to delete this task permanently? This action cannot be undone."
                confirmText="Delete Task"
                onConfirm={deleteTask}
                onCancel={() => setShowDeleteConfirm(false)}
                loading={deleting}
                variant="danger"
            />
        </div>
    );
}
