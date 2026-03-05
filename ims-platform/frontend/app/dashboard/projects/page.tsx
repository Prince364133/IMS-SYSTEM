'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { FolderKanban, Plus, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import CreateProjectModal from '../../../components/CreateProjectModal';

const STATUS_COLORS: Record<string, string> = {
    planning: 'badge-gray',
    in_progress: 'badge-blue',
    on_hold: 'badge-orange',
    completed: 'badge-green',
    cancelled: 'badge-red',
};
const PRIORITY_COLORS: Record<string, string> = {
    low: 'badge-gray',
    medium: 'badge-blue',
    high: 'badge-orange',
    critical: 'badge-red',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [showCreate, setShowCreate] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/projects', { params: { search, status } });
            setProjects(data.projects);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, [search, status]);

    return (
        <div>
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">{projects.length} projects found</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    <Plus className="w-4 h-4" />
                    New Project
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects..."
                        className="input pl-9"
                    />
                </div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-44">
                    <option value="">All Statuses</option>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <Link key={project._id} href={`/dashboard/projects/${project._id}`} className="card p-5 hover:shadow-md transition-all cursor-pointer group block">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{project.name}</h3>
                                <span className={clsx('badge', STATUS_COLORS[project.status] || 'badge-gray')}>
                                    {project.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                        style={{ width: `${project.progress || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={clsx('badge', PRIORITY_COLORS[project.priority] || 'badge-gray')}>
                                    {project.priority}
                                </span>
                                <div className="flex -space-x-2">
                                    {(project.memberIds || []).slice(0, 3).map((m: any) => (
                                        <div key={m._id} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">{m.name?.[0]?.toUpperCase()}</span>
                                        </div>
                                    ))}
                                    {(project.memberIds || []).length > 3 && (
                                        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                            <span className="text-gray-500 text-xs">+{project.memberIds.length - 3}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && projects.length === 0 && (
                <div className="text-center py-20">
                    <FolderKanban className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No projects found</p>
                    <p className="text-gray-300 text-sm mt-1">Try adjusting filters or create a new project</p>
                </div>
            )}

            {showCreate && (
                <CreateProjectModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={(p) => setProjects(prev => [p, ...prev])}
                />
            )}
        </div>
    );
}
