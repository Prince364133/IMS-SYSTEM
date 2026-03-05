'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Briefcase, Plus, Loader2, MapPin, Clock, Users, Pencil, ChevronRight, X, Mail, Phone, FileText, ChevronDown, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import PostJobModal from '../../../components/PostJobModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';

const TYPE_COLORS: Record<string, string> = {
    full_time: 'badge-blue', part_time: 'badge-orange',
    contract: 'badge-purple', internship: 'badge-gray',
};

const APP_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS: Record<string, string> = {
    applied: 'badge-gray', screening: 'badge-blue', interview: 'badge-orange',
    offer: 'badge-purple', hired: 'badge-green', rejected: 'badge-red',
};

function ApplicationKanban({ jobId, onClose }: { jobId: string; onClose: () => void }) {
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedId, setDraggedId] = useState<string | null>(null);

    useEffect(() => {
        api.get(`/api/jobs/${jobId}/applications`)
            .then(({ data }) => setApps(data.applications || []))
            .finally(() => setLoading(false));
    }, [jobId]);

    async function handleDrop(stage: string) {
        if (!draggedId) return;
        const app = apps.find(a => a._id === draggedId);
        if (!app || app.status === stage) { setDraggedId(null); return; }
        setApps(prev => prev.map(a => a._id === draggedId ? { ...a, status: stage } : a));
        setDraggedId(null);
        try {
            await api.put(`/api/jobs/applications/${draggedId}`, { status: stage });
        } catch {
            toast.error('Failed to update status');
            api.get(`/api/jobs/${jobId}/applications`).then(({ data }) => setApps(data.applications || []));
        }
    }

    if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Application Pipeline</h3>
                <button onClick={onClose} className="btn-secondary text-xs"><X className="w-3.5 h-3.5" />Close</button>
            </div>
            {apps.length === 0 ? (
                <div className="card p-8 text-center">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">No applications yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
                    {APP_STAGES.map(stage => {
                        const stageApps = apps.filter(a => a.status === stage);
                        return (
                            <div
                                key={stage}
                                className="bg-gray-50 rounded-xl p-2 min-h-[200px]"
                                onDragOver={e => e.preventDefault()}
                                onDrop={() => handleDrop(stage)}
                            >
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className={clsx('badge text-xs capitalize', STAGE_COLORS[stage])}>{stage}</span>
                                    <span className="text-xs text-gray-400">({stageApps.length})</span>
                                </div>
                                <div className="space-y-2">
                                    {stageApps.map(app => (
                                        <div
                                            key={app._id}
                                            draggable
                                            onDragStart={() => setDraggedId(app._id)}
                                            onDragEnd={() => setDraggedId(null)}
                                            className={clsx('bg-white rounded-lg p-2.5 shadow-sm border border-gray-100 cursor-grab hover:shadow-md transition-all select-none', draggedId === app._id && 'opacity-40')}
                                        >
                                            <p className="text-xs font-semibold text-gray-900 truncate">{app.name || app.candidateName}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{app.email}</p>
                                            {app.resumeUrl && (
                                                <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 flex items-center gap-0.5 mt-1">
                                                    <FileText className="w-3 h-3" />Resume
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                    {stageApps.length === 0 && <div className="text-center text-gray-300 text-xs py-4">Empty</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function RecruitmentPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'jobs' | 'pipeline'>('jobs');
    const [showPostJob, setShowPostJob] = useState(false);
    const [editJob, setEditJob] = useState<any>(null);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const { user } = useAuth();

    function loadJobs() {
        setLoading(true);
        api.get('/api/jobs')
            .then(({ data }) => setJobs(data.jobs))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadJobs(); }, []);

    function openApplications(jobId: string) {
        setSelectedJobId(jobId);
        setTab('pipeline');
    }

    return (
        <div>
            {(showPostJob || editJob) && (
                <PostJobModal
                    editJob={editJob}
                    onClose={() => { setShowPostJob(false); setEditJob(null); }}
                    onSuccess={() => { setShowPostJob(false); setEditJob(null); loadJobs(); }}
                />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Recruitment</h1>
                    <p className="page-subtitle">Manage job postings and applications</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                    <button onClick={() => setShowPostJob(true)} className="btn-primary"><Plus className="w-4 h-4" />Post Job</button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-max">
                {(['jobs', 'pipeline'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
                    >
                        {t === 'pipeline' ? 'Application Pipeline' : t}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : tab === 'jobs' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {jobs.map((job) => (
                        <div key={job._id} className="card p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                                        <p className="text-xs text-gray-400">{job.department}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={clsx('badge', TYPE_COLORS[job.type] || 'badge-gray')}>{job.type?.replace('_', ' ')}</span>
                                    {(user?.role === 'admin' || user?.role === 'hr') && (
                                        <button onClick={() => setEditJob(job)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{job.description}</p>

                            <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                                {job.location && <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</div>}
                                {job.deadline && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Deadline: {new Date(job.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>}
                                {job.openings && <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.openings} opening{job.openings > 1 ? 's' : ''}</div>}
                            </div>

                            {job.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3 pt-3 border-t border-gray-50">
                                    {job.skills.slice(0, 4).map((s: string) => (
                                        <span key={s} className="badge badge-gray">{s}</span>
                                    ))}
                                    {job.skills.length > 4 && <span className="badge badge-gray">+{job.skills.length - 4}</span>}
                                </div>
                            )}

                            <button onClick={() => openApplications(job._id)} className="btn-secondary text-xs w-full justify-center">
                                <Users className="w-3.5 h-3.5" /> View Applications <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                            </button>
                        </div>
                    ))}
                    {jobs.length === 0 && (
                        <div className="col-span-2 text-center py-20">
                            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No job postings yet</p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    {/* Job selector when no specific job is selected */}
                    {!selectedJobId ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500 mb-3">Select a job to view its application pipeline:</p>
                            {jobs.map(job => (
                                <button key={job._id} onClick={() => setSelectedJobId(job._id)} className="card p-4 w-full text-left flex items-center gap-3 hover:shadow-md transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <Briefcase className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                                        <p className="text-xs text-gray-400">{job.department}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <ApplicationKanban jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
                    )}
                </div>
            )}
        </div>
    );
}
