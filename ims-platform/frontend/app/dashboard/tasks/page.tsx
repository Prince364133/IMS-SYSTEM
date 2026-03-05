'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '../../../lib/api';
import { CheckSquare, Loader2, Plus, LayoutGrid, List, User } from 'lucide-react';
import clsx from 'clsx';
import TaskDetailModal from '../../../components/TaskDetailModal';
import CreateTaskModal from '../../../components/CreateTaskModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import { format } from 'date-fns';

const COLUMNS = [
    { id: 'todo', label: 'To Do', color: 'border-gray-300', bg: 'bg-gray-50', badge: 'badge-gray' },
    { id: 'in_progress', label: 'In Progress', color: 'border-blue-400', bg: 'bg-blue-50', badge: 'badge-blue' },
    { id: 'in_review', label: 'In Review', color: 'border-orange-400', bg: 'bg-orange-50', badge: 'badge-orange' },
    { id: 'done', label: 'Done', color: 'border-green-400', bg: 'bg-green-50', badge: 'badge-green' },
];

const PRIORITY_COLORS: Record<string, string> = {
    low: 'badge-gray', medium: 'badge-blue', high: 'badge-orange', critical: 'badge-red',
};
const PRIORITY_DOT: Record<string, string> = {
    low: 'bg-gray-400', medium: 'bg-blue-500', high: 'bg-orange-500', critical: 'bg-red-500',
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const { user } = useAuth();

    const loadTasks = useCallback(() => {
        setLoading(true);
        api.get('/api/tasks', { params: { status: filterStatus, priority: filterPriority } })
            .then(({ data }) => setTasks(data.tasks))
            .finally(() => setLoading(false));
    }, [filterStatus, filterPriority]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    const handleUpdated = (updated: any) =>
        setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));

    const handleDeleted = (id: string) => {
        setTasks(prev => prev.filter(t => t._id !== id));
        toast.success('Task deleted');
    };

    // Kanban drag-and-drop
    const handleDrop = async (columnId: string) => {
        if (!draggedId) return;
        const task = tasks.find(t => t._id === draggedId);
        if (!task || task.status === columnId) { setDraggedId(null); return; }
        setTasks(prev => prev.map(t => t._id === draggedId ? { ...t, status: columnId } : t));
        setDraggedId(null);
        try {
            await api.put(`/api/tasks/${draggedId}`, { status: columnId });
        } catch {
            toast.error('Failed to update task status');
            loadTasks();
        }
    };

    return (
        <div>
            {showCreate && (
                <CreateTaskModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={(task) => { setTasks(prev => [task, ...prev]); setShowCreate(false); }}
                />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Tasks</h1>
                    <p className="page-subtitle">{tasks.length} tasks</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        <button onClick={() => setView('kanban')} className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5', view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                            <LayoutGrid className="w-4 h-4" /> Kanban
                        </button>
                        <button onClick={() => setView('list')} className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5', view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                            <List className="w-4 h-4" /> List
                        </button>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" />New Task</button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5 flex-wrap">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select w-40">
                    <option value="">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                </select>
                <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="select w-40">
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : view === 'kanban' ? (
                /* ── KANBAN VIEW ── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
                    {COLUMNS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div
                                key={col.id}
                                className={clsx('rounded-2xl border-t-4 p-3 min-h-[420px]', col.bg, col.color)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={() => handleDrop(col.id)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-gray-700">{col.label}</span>
                                        <span className={clsx('badge text-xs', col.badge)}>{colTasks.length}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {colTasks.map(task => (
                                        <div
                                            key={task._id}
                                            draggable
                                            onDragStart={() => setDraggedId(task._id)}
                                            onDragEnd={() => setDraggedId(null)}
                                            onClick={() => setSelectedTask(task._id)}
                                            className={clsx(
                                                'bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all select-none',
                                                draggedId === task._id && 'opacity-40 scale-95',
                                            )}
                                        >
                                            <div className="flex items-start gap-2 mb-2">
                                                <span className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', PRIORITY_DOT[task.priority] || 'bg-gray-300')} />
                                                <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                                            </div>
                                            {task.projectId?.name && (
                                                <p className="text-xs text-gray-400 mb-2 ml-4">{task.projectId.name}</p>
                                            )}
                                            <div className="flex items-center justify-between ml-4">
                                                {task.dueDate && (
                                                    <span className="text-xs text-gray-400">{format(new Date(task.dueDate), 'MMM d')}</span>
                                                )}
                                                {task.assigneeId && (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ml-auto">
                                                        <span className="text-white text-[10px] font-bold">{task.assigneeId?.name?.[0]?.toUpperCase()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div className="text-center py-8 text-gray-300 text-sm">Drop tasks here</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── LIST VIEW ── */
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <div
                            key={task._id}
                            onClick={() => setSelectedTask(task._id)}
                            className="card p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[task.priority] || 'bg-gray-300')} />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{task.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{task.projectId?.name}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={clsx('badge', PRIORITY_COLORS[task.priority] || 'badge-gray')}>{task.priority}</span>
                                <span className="badge badge-gray">{task.status?.replace(/_/g, ' ')}</span>
                                {task.dueDate && <span className="text-xs text-gray-400">{format(new Date(task.dueDate), 'MMM d')}</span>}
                                {task.assigneeId && (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{task.assigneeId?.name?.[0]?.toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div className="text-center py-20">
                            <CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No tasks found</p>
                        </div>
                    )}
                </div>
            )}

            {selectedTask && (
                <TaskDetailModal
                    taskId={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    );
}
