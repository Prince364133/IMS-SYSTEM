'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../../lib/api';
import {
    Clock, Play, Square, Plus, Trash2, Loader2, X,
    Timer, Download, FolderKanban
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { format, formatDuration, intervalToDuration } from 'date-fns';

function fmtMinutes(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function AddLogModal({ onClose, onSuccess, projects }: { onClose: () => void; onSuccess: () => void; projects: any[] }) {
    const [form, setForm] = useState({
        projectId: '',
        description: '',
        startTime: '',
        endTime: '',
    });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.startTime) return toast.error('Start time is required');
        setLoading(true);
        try {
            await api.post('/api/timelogs', form);
            toast.success('Time entry added!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to add entry');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Manual Time Entry</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Project</label>
                        <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))} className="select">
                            <option value="">No project</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input" placeholder="What did you work on?" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Start Time *</label>
                            <input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="input" required />
                        </div>
                        <div>
                            <label className="label">End Time</label>
                            <input type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="input" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TimeTrackingPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [activeProject, setActiveProject] = useState('');
    const [activeDesc, setActiveDesc] = useState('');
    const [running, setRunning] = useState<any>(null);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    function loadLogs() {
        setLoading(true);
        api.get('/api/timelogs')
            .then(({ data }) => {
                const all = data.logs || [];
                setLogs(all);
                const runningLog = all.find((l: any) => l.status === 'running');
                setRunning(runningLog || null);
                if (runningLog) {
                    const secs = Math.floor((Date.now() - new Date(runningLog.startTime).getTime()) / 1000);
                    setElapsed(secs);
                }
            })
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadLogs();
        api.get('/api/projects', { params: { limit: 100 } }).then(({ data }) => setProjects(data.projects || []));
    }, []);

    // Live timer
    useEffect(() => {
        if (running) {
            timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [running]);

    async function startTimer() {
        try {
            await api.post('/api/timelogs/start', { projectId: activeProject || undefined, description: activeDesc });
            toast.success('Timer started!');
            setElapsed(0);
            loadLogs();
        } catch { toast.error('Failed to start timer'); }
    }

    async function stopTimer() {
        try {
            await api.post('/api/timelogs/stop');
            toast.success('Timer stopped!');
            setRunning(null);
            setElapsed(0);
            loadLogs();
        } catch { toast.error('Failed to stop timer'); }
    }

    async function deleteLog(id: string) {
        if (!confirm('Delete this time entry?')) return;
        try {
            await api.delete(`/api/timelogs/${id}`);
            toast.success('Entry deleted');
            setLogs(prev => prev.filter(l => l._id !== id));
        } catch { toast.error('Failed to delete'); }
    }

    function formatElapsed(secs: number) {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const totalToday = logs
        .filter(l => format(new Date(l.startTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
        .reduce((s, l) => s + (l.durationMinutes || 0), 0);

    const totalWeek = logs
        .filter(l => {
            const d = new Date(l.startTime);
            const now = new Date();
            const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
            return d >= weekStart;
        })
        .reduce((s, l) => s + (l.durationMinutes || 0), 0);

    return (
        <div>
            {showAdd && (
                <AddLogModal onClose={() => setShowAdd(false)} onSuccess={loadLogs} projects={projects} />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Time Tracking</h1>
                    <p className="page-subtitle">Track hours by project and task</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="btn-secondary">
                    <Plus className="w-4 h-4" /> Manual Entry
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Today', value: fmtMinutes(totalToday), color: 'text-indigo-600' },
                    { label: 'This Week', value: fmtMinutes(totalWeek), color: 'text-blue-600' },
                    { label: 'Entries', value: logs.length, color: 'text-gray-700' },
                    { label: 'Status', value: running ? '🟢 Running' : '⚫ Idle', color: 'text-gray-700' },
                ].map(k => (
                    <div key={k.label} className="card p-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{k.label}</p>
                        <p className={clsx('text-2xl font-black', k.color)}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Timer Controls */}
            <div className="card p-5 mb-6">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {running ? (
                        <>
                            <div className="flex items-center gap-3 flex-1">
                                <Timer className="w-5 h-5 text-green-500 animate-pulse" />
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">Timer running</p>
                                    <p className="text-2xl font-mono font-bold text-gray-900">{formatElapsed(elapsed)}</p>
                                </div>
                            </div>
                            <button onClick={stopTimer} className="btn-danger">
                                <Square className="w-4 h-4 fill-current" /> Stop Timer
                            </button>
                        </>
                    ) : (
                        <>
                            <select value={activeProject} onChange={e => setActiveProject(e.target.value)} className="select flex-1">
                                <option value="">Select Project (optional)</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                            <input
                                value={activeDesc}
                                onChange={e => setActiveDesc(e.target.value)}
                                placeholder="What are you working on?"
                                className="input flex-1"
                            />
                            <button onClick={startTimer} className="btn-primary whitespace-nowrap">
                                <Play className="w-4 h-4 fill-current" /> Start Timer
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : logs.filter(l => l.status === 'stopped').length === 0 ? (
                <div className="text-center py-16">
                    <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No time entries yet</p>
                    <p className="text-gray-300 text-sm mt-1">Start the timer or add a manual entry</p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Project</th>
                                    <th>Date</th>
                                    <th>Duration</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.filter(l => l.status === 'stopped').map(log => (
                                    <tr key={log._id} className="group">
                                        <td className="font-medium text-gray-800">{log.description || <span className="text-gray-400 italic">No description</span>}</td>
                                        <td>
                                            {log.projectId ? (
                                                <span className="flex items-center gap-1.5 text-sm text-indigo-600">
                                                    <FolderKanban className="w-3.5 h-3.5" />
                                                    {log.projectId.name}
                                                </span>
                                            ) : <span className="text-gray-400 text-sm">—</span>}
                                        </td>
                                        <td className="text-sm text-gray-500">{log.startTime ? format(new Date(log.startTime), 'MMM d, yyyy  h:mm a') : '—'}</td>
                                        <td>
                                            <span className="font-semibold text-gray-800">
                                                {log.durationMinutes ? fmtMinutes(log.durationMinutes) : '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => deleteLog(log._id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
