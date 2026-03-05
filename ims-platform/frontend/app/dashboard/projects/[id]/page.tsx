'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import {
    ArrowLeft, FolderKanban, Plus, Users, Calendar, Tag,
    CheckSquare, Paperclip, Edit2, Loader2, MoreHorizontal,
    Clock, AlertCircle, CheckCircle2, Play, Eye, MessageSquare, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { format } from 'date-fns';
import FileUploadModal from '../../../../components/FileUploadModal';
import { useAuth } from '../../../../lib/auth-context';

const STATUS_COLORS: Record<string, string> = {
    planning: 'badge-gray',
    in_progress: 'badge-blue',
    on_hold: 'badge-orange',
    completed: 'badge-green',
    cancelled: 'badge-red',
};

const TASK_STATUS_CONFIG: Record<string, { cls: string; icon: any; label: string }> = {
    todo: { cls: 'border-gray-200 bg-gray-50', icon: Clock, label: 'To Do' },
    in_progress: { cls: 'border-blue-200 bg-blue-50', icon: Play, label: 'In Progress' },
    in_review: { cls: 'border-amber-200 bg-amber-50', icon: Eye, label: 'In Review' },
    done: { cls: 'border-green-200 bg-green-50', icon: CheckCircle2, label: 'Done' },
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'badge-gray', medium: 'badge-blue', high: 'badge-orange', critical: 'badge-red',
};

export default function ProjectDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user } = useAuth();

    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'files' | 'notes' | 'milestones'>('overview');
    const [showUpload, setShowUpload] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [loadingAI, setLoadingAI] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get(`/api/projects/${id}`),
            api.get(`/api/projects/${id}/tasks`),
            api.get('/api/files', { params: { relatedId: id, relatedModel: 'Project' } }),
            api.get(`/api/projects/${id}/notes`).catch(() => ({ data: { notes: [] } })),
            api.get(`/api/milestones/project/${id}`).catch(() => ({ data: { milestones: [] } }))
        ])
            .then(([pRes, tRes, fRes, nRes, mRes]) => {
                setProject(pRes.data.project);
                setTasks(tRes.data.tasks);
                setFiles(fRes.data.files);
                setNotes(nRes.data.notes || []);
                setMilestones(mRes.data.milestones || []);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const onFileUploaded = (file: any) => setFiles((prev) => [file, ...prev]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        setSubmittingNote(true);
        try {
            const { data } = await api.post(`/api/projects/${id}/notes`, { content: newNote });
            setNotes([data.note, ...notes]);
            setNewNote('');
        } catch (error) {
            console.error('Failed to add note', error);
        } finally {
            setSubmittingNote(false);
        }
    };

    const handleGenerateAI = async () => {
        setShowAI(true);
        if (aiInsight) return; // already loaded
        setLoadingAI(true);
        try {
            const { data } = await api.get(`/api/ai/projects/${id}/insights`);
            setAiInsight(data.insight);
        } catch (error) {
            setAiInsight("Failed to generate AI insights.");
        } finally {
            setLoadingAI(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-32">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Project not found</p>
                <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
            </div>
        );
    }

    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const progressCalc = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : project.progress || 0;

    const tasksByStatus = ['todo', 'in_progress', 'in_review', 'done'].reduce<Record<string, any[]>>((acc, s) => {
        acc[s] = tasks.filter(t => t.status === s);
        return acc;
    }, {});

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
                <Link href="/dashboard/projects" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Projects
                </Link>
                <span>/</span>
                <span className="text-gray-700 font-medium truncate">{project.name}</span>
            </div>

            {/* Header */}
            <div className="card p-6 mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                                <span className={clsx('badge', STATUS_COLORS[project.status] || 'badge-gray')}>
                                    {project.status?.replace('_', ' ')}
                                </span>
                                <span className={clsx('badge', PRIORITY_COLORS[project.priority] || 'badge-gray')}>
                                    {project.priority}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <button
                            onClick={handleGenerateAI}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" /> AI Insights
                        </button>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn-primary"><Edit2 className="w-4 h-4" />Edit</button>
                        )}
                    </div>
                </div>

                {/* Progress */}
                <div className="mt-5">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500 font-medium">Overall Progress</span>
                        <span className="font-bold text-gray-900">{progressCalc}%</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${progressCalc}%` }}
                        />
                    </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-5 mt-5 text-sm text-gray-500">
                    {project.startDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Start: {format(new Date(project.startDate), 'MMM d, yyyy')}
                        </div>
                    )}
                    {project.deadline && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Deadline: {format(new Date(project.deadline), 'MMM d, yyyy')}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-gray-400" />
                        {doneTasks}/{tasks.length} tasks done
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        {files.length} file{files.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-max overflow-x-auto">
                {(['overview', 'tasks', 'milestones', 'files', 'notes'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={clsx(
                            'px-5 py-1.5 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap',
                            activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        {t}
                        {t === 'tasks' && <span className="ml-1.5 text-xs text-gray-400">{tasks.length}</span>}
                        {t === 'milestones' && <span className="ml-1.5 text-xs text-gray-400">{milestones.length}</span>}
                        {t === 'files' && <span className="ml-1.5 text-xs text-gray-400">{files.length}</span>}
                        {t === 'notes' && <span className="ml-1.5 text-xs text-gray-400">{notes.length}</span>}
                    </button>
                ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Stats */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Kanban-lite summary */}
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Task Breakdown</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {Object.entries(TASK_STATUS_CONFIG).map(([status, cfg]) => {
                                    const Icon = cfg.icon;
                                    const count = tasksByStatus[status]?.length || 0;
                                    return (
                                        <div key={status} className={clsx('rounded-xl border p-3 text-center', cfg.cls)}>
                                            <Icon className="w-5 h-5 mx-auto mb-1 opacity-60" />
                                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent tasks */}
                        {tasks.slice(0, 5).length > 0 && (
                            <div className="card p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
                                    <button onClick={() => setActiveTab('tasks')} className="text-xs text-indigo-600 hover:underline">View all</button>
                                </div>
                                <div className="space-y-2">
                                    {tasks.slice(0, 5).map((task) => {
                                        const cfg = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.todo;
                                        const Icon = cfg.icon;
                                        return (
                                            <div key={task._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <p className="flex-1 text-sm text-gray-700 truncate">{task.title}</p>
                                                <span className={clsx('badge', PRIORITY_COLORS[task.priority] || 'badge-gray')}>{task.priority}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Members + Tags */}
                    <div className="space-y-4">
                        <div className="card p-5">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Members <span className="text-gray-400 text-sm font-normal">({project.memberIds?.length || 0})</span>
                            </h3>
                            <div className="space-y-2.5">
                                {(project.memberIds || []).map((m: any) => (
                                    <div key={m._id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                                            {m.photoUrl
                                                ? <img src={m.photoUrl} className="w-full h-full rounded-full object-cover" />
                                                : <span className="text-white text-xs font-bold">{m.name?.[0]?.toUpperCase()}</span>
                                            }
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                                            <p className="text-xs text-gray-400 truncate capitalize">{m.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(user?.role === 'admin' || user?.role === 'manager') && (
                                <button className="mt-3 w-full py-2 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                                    <Plus className="w-3.5 h-3.5" /> Add Member
                                </button>
                            )}
                        </div>

                        {project.tags?.length > 0 && (
                            <div className="card p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-indigo-500" />
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag: string) => (
                                        <span key={tag} className="badge badge-blue">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Tasks */}
            {activeTab === 'tasks' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">{tasks.length} tasks total</p>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn-primary"><Plus className="w-4 h-4" />Add Task</button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {Object.entries(TASK_STATUS_CONFIG).map(([status, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                                <div key={status} className="card overflow-hidden">
                                    <div className={clsx('px-4 py-3 border-b flex items-center gap-2', cfg.cls)}>
                                        <Icon className="w-4 h-4 opacity-70" />
                                        <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
                                        <span className="ml-auto text-xs text-gray-400 bg-white/60 px-1.5 py-0.5 rounded-full">{tasksByStatus[status]?.length || 0}</span>
                                    </div>
                                    <div className="p-2 space-y-1.5 min-h-[80px]">
                                        {tasksByStatus[status]?.map((task) => (
                                            <div key={task._id} className="bg-gray-50 hover:bg-indigo-50 rounded-lg px-3 py-2.5 cursor-pointer transition-colors group">
                                                <p className="text-sm text-gray-800 font-medium group-hover:text-indigo-700 transition-colors">{task.title}</p>
                                                <div className="flex items-center justify-between mt-1.5">
                                                    <span className={clsx('badge text-[10px]', PRIORITY_COLORS[task.priority] || 'badge-gray')}>{task.priority}</span>
                                                    {task.assigneeId && (
                                                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                            <span className="text-white text-[9px] font-bold">{task.assigneeId?.name?.[0]?.toUpperCase()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <button className="w-full text-xs text-gray-300 hover:text-indigo-500 py-1.5 flex items-center justify-center gap-1 transition-colors">
                                            <Plus className="w-3 h-3" /> Add
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tab: Files */}
            {activeTab === 'files' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''} attached</p>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn-primary" onClick={() => setShowUpload(true)}>
                                <Plus className="w-4 h-4" />Upload File
                            </button>
                        )}
                    </div>
                    {files.length === 0 ? (
                        <div
                            className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                            onClick={() => setShowUpload(true)}
                        >
                            <Paperclip className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No files yet</p>
                            <p className="text-gray-300 text-sm mt-1">Click to upload project documents</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {files.map((file) => (
                                <FileCard key={file._id} file={file} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Notes */}
            {activeTab === 'notes' && (
                <div className="max-w-3xl">
                    <form onSubmit={handleAddNote} className="mb-8">
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                            Add a Project Note or Update
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <textarea
                                id="note"
                                rows={3}
                                className="input block w-full resize-none"
                                placeholder="Write something..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                disabled={submittingNote}
                            />
                        </div>
                        <div className="mt-3 flex justify-end">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!newNote.trim() || submittingNote}
                            >
                                {submittingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Note'}
                            </button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight text-gray-900 border-b pb-2">Recent Notes</h3>
                        {notes.length === 0 ? (
                            <p className="text-gray-500 italic py-4">No notes have been added to this project yet.</p>
                        ) : (
                            notes.map((note) => (
                                <div key={note._id} className="bg-white p-4 rounded-xl border shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {note.createdBy?.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <span className="font-medium text-sm text-gray-900">{note.createdBy?.name}</span>
                                            <span className="text-xs text-gray-500 capitalize px-2 py-0.5 bg-gray-100 rounded-full">{note.createdBy?.role}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Milestones */}
            {activeTab === 'milestones' && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-sm text-gray-500">{milestones.length} milestones</p>
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <button className="btn-primary" onClick={() => {/* Handle Add Milestone */ }}>
                                <Plus className="w-4 h-4" /> Add Milestone
                            </button>
                        )}
                    </div>
                    {milestones.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                            <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No milestones defined</p>
                            <p className="text-gray-300 text-sm mt-1">Break this project down into major phases</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-4xl relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {milestones.map((m, idx) => (
                                <div key={m._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    {/* Timeline dot */}
                                    <div className={clsx(
                                        "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors",
                                        m.completed ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                                    )}>
                                        {m.completed ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                                    </div>

                                    {/* Card */}
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] card p-5 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group-odd:ml-auto">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className={clsx("font-bold text-lg", m.completed ? "text-gray-400 line-through" : "text-gray-900")}>{m.title}</h4>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const { data } = await api.patch(`/api/milestones/${m._id}/toggle`);
                                                        setMilestones(prev => prev.map(old => old._id === m._id ? data.milestone : old));
                                                    } catch (e) { }
                                                }}
                                                className={clsx(
                                                    "px-3 py-1 text-xs rounded-full font-semibold border transition-colors",
                                                    m.completed ? "border-green-200 text-green-600 bg-green-50 hover:bg-green-100" : "border-gray-200 text-gray-600 hover:bg-gray-50 bg-white"
                                                )}
                                            >
                                                {m.completed ? 'Completed' : 'Mark Done'}
                                            </button>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-4">{m.description}</p>
                                        <div className="flex items-center gap-4 text-xs font-semibold">
                                            <span className={clsx("flex items-center gap-1", m.completed ? "text-gray-400" :
                                                (new Date(m.dueDate) < new Date() ? "text-red-500" : "text-indigo-600"))}>
                                                <Calendar className="w-3.5 h-3.5" />
                                                {format(new Date(m.dueDate), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showUpload && (
                <FileUploadModal
                    relatedId={id}
                    relatedModel="Project"
                    onClose={() => setShowUpload(false)}
                    onSuccess={onFileUploaded}
                />
            )}

            {showAI && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-200" />
                                Project Risk Analysis
                            </h2>
                            <button onClick={() => setShowAI(false)} className="text-white/80 hover:text-white transition-colors text-xl leading-none">
                                ✕
                            </button>
                        </div>
                        <div className="p-6 bg-gray-50 min-h-[200px]">
                            {loadingAI ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                                    <p className="text-indigo-900 font-medium">Analyzing project data with Gemini AI...</p>
                                    <p className="text-sm text-gray-500 mt-1">This may take a few seconds.</p>
                                </div>
                            ) : (
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm border-l-4 border-indigo-400 pl-4 bg-white p-4 rounded-r-xl shadow-sm">
                                    {aiInsight}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                            <button onClick={() => setShowAI(false)} className="btn-secondary">
                                Close Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMilestoneForm && (
                <AddMilestoneModal
                    projectId={id}
                    onClose={() => setShowMilestoneForm(false)}
                    onSuccess={(m: any) => {
                        setMilestones(prev => [...prev, m].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
                    }}
                />
            )}
        </div>
    );
}

function FileCard({ file }: { file: any }) {
    const ext = file.originalName?.split('.').pop()?.toUpperCase() || 'FILE';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase());

    return (
        <a href={file.url} target="_blank" rel="noopener noreferrer"
            className="card p-4 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group"
        >
            <div className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold',
                isImage ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
            )}>
                {isImage && file.url
                    ? <img src={file.url} alt="" className="w-full h-full rounded-lg object-cover" />
                    : ext.slice(0, 4)
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{file.originalName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                    {file.uploadedBy?.name && ` · ${file.uploadedBy.name}`}
                </p>
            </div>
        </a>
    );
}

function AddMilestoneModal({ projectId, onClose, onSuccess }: any) {
    const [form, setForm] = useState({ title: '', description: '', dueDate: '', order: 1 });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post(`/api/milestones/project/${projectId}`, form);
            onSuccess(data.milestone);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">New Project Milestone</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        ✕
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Milestone Title *</label>
                        <input required autoFocus value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g., Phase 1 Completion" />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={3} placeholder="What needs to be achieved?" />
                    </div>
                    <div>
                        <label className="label">Target Date *</label>
                        <input type="date" required value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="input" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Milestone'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
