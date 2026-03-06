'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';
import {
    User, Mail, Phone, MapPin, Building2, Briefcase, Calendar,
    Lock, Shield, ChevronRight, Loader2, Pencil, Trash2,
    CheckCircle2, Clock, AlertCircle, DollarSign, Heart, Hash,
    FileText, FolderKanban, Star, Settings, CheckSquare, MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import AddEmployeeModal from '../../../../components/AddEmployeeModal';

export default function UnifiedProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showEdit, setShowEdit] = useState(false);

    // Related data states
    const [tasks, setTasks] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any>(null);
    const [salary, setSalary] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    async function fetchData() {
        setLoading(true);
        try {
            const targetId = id === 'me' ? currentUser?._id : id;
            if (!targetId) return;

            let userData: any;
            try {
                const { data } = await api.get(`/api/users/${targetId}`);
                userData = data.user;
            } catch (err: any) {
                if (err.response?.status === 404) {
                    const { data } = await api.get(`/api/clients/${targetId}`);
                    const client = data.client;
                    userData = {
                        _id: client._id,
                        name: client.name,
                        email: client.email,
                        phone: client.phone,
                        company: client.company,
                        address: client.address,
                        website: client.website,
                        role: 'client',
                        status: client.status || 'active',
                        photoUrl: client.logoUrl,
                        industry: client.industry,
                        clientType: client.clientType,
                        taxId: client.taxId,
                        billingAddress: client.billingAddress,
                        joinDate: client.createdAt,
                        projects: client.projectIds || [],
                        employeeId: client.clientId // Map clientId to employeeId for the UI box
                    };
                } else {
                    throw err;
                }
            }

            setProfileUser(userData);

            // Fetch related data based on role
            const isEmployeeOrAdmin = ['admin', 'manager', 'hr', 'employee'].includes(userData.role);
            const isClient = userData.role === 'client';

            const promises: Promise<any>[] = [];

            if (isEmployeeOrAdmin) {
                // Fix tasks mapping: endpoint is /api/tasks?assigneeId=... and returns { tasks, total }
                promises.push(api.get(`/api/tasks?assigneeId=${targetId}`).then(res => setTasks(res.data.tasks || [])).catch(() => { }));

                // Fix salary mapping: endpoint is /api/salary?employeeId=... (for HR/Admin) or /api/salary/my and returns { salaries }
                const salaryUrl = (id === 'me' || currentUser?._id === targetId) ? '/api/salary/my' : `/api/salary?employeeId=${targetId}`;
                promises.push(api.get(salaryUrl).then(res => setSalary(res.data.salaries || [])).catch(() => { }));

                // Fix attendance mapping: use /api/attendance?employeeId=... or /api/attendance/my
                const attUrl = (id === 'me' || currentUser?._id === targetId) ? '/api/attendance/my' : `/api/attendance?employeeId=${targetId}`;
                promises.push(api.get(attUrl).then(res => {
                    const records = res.data.records || [];
                    const presentCount = records.filter((r: any) => r.status === 'present').length;
                    const attendancePercentage = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;
                    setAttendance({ summary: { attendancePercentage }, records });
                }).catch(() => { }));
            }

            if (isClient || userData.role === 'admin') {
                promises.push(api.get(`/api/projects`).then(res => {
                    // Filter projects for this client
                    const projectsList = res.data.projects || [];
                    if (isClient) {
                        setProjects(projectsList.filter((p: any) =>
                            p.clientIds?.some((c: any) => c._id === targetId || c === targetId) || currentUser?._id === targetId
                        ));
                    } else {
                        setProjects(projectsList.slice(0, 5)); // Just some projects for admin
                    }
                }).catch(() => { }));
            }

            await Promise.all(promises);

        } catch (error: any) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
            if (id !== 'me') router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (currentUser) fetchData();
    }, [id, currentUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!profileUser) return null;

    const isAdmin = currentUser?.role === 'admin';
    const isOwnProfile = currentUser?._id === profileUser._id;
    const canEdit = isAdmin || isOwnProfile;
    const canChat = !isOwnProfile && (isAdmin || profileUser.role !== 'client');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'tasks', label: 'Tasks', icon: CheckCircle2, roles: ['admin', 'employee', 'manager', 'hr'] },
        { id: 'projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'client'] },
        { id: 'attendance', label: 'Attendance', icon: Calendar, roles: ['admin', 'employee', 'hr'] },
        { id: 'salary', label: 'Financials', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
    ].filter(tab => !tab.roles || tab.roles.includes(profileUser.role));

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {showEdit && (
                <AddEmployeeModal
                    editUser={profileUser}
                    onClose={() => setShowEdit(false)}
                    onSuccess={() => {
                        setShowEdit(false);
                        fetchData();
                    }}
                />
            )}

            {/* Profile Header */}
            <div className="relative h-48 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                <div className="absolute bottom-6 left-8 flex items-end gap-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                            {profileUser.photoUrl ? (
                                <img src={profileUser.photoUrl} alt={profileUser.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-indigo-300" />
                            )}
                        </div>
                        {canEdit && (
                            <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg hover:scale-110 transition-transform text-indigo-600 border border-gray-100">
                                <Pencil className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="mb-2 text-white drop-shadow-md">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{profileUser.name}</h1>
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border border-white/20 capitalize",
                                profileUser.role === 'admin' ? "bg-red-500/20 text-red-50" :
                                    profileUser.role === 'client' ? "bg-amber-500/20 text-amber-50" :
                                        "bg-emerald-500/20 text-emerald-50"
                            )}>
                                {profileUser.role}
                            </span>
                        </div>
                        <p className="text-white/80 font-medium flex items-center gap-2 mt-1">
                            <Briefcase className="w-4 h-4" />
                            {profileUser.role === 'client'
                                ? (profileUser.clientType || 'Organization') + ' • ' + (profileUser.industry || profileUser.company || 'General')
                                : (profileUser.position || 'Member') + ' • ' + (profileUser.department || 'General')
                            }
                        </p>
                    </div>
                </div>

                <div className="absolute top-6 right-8 flex gap-3">
                    {canChat && (
                        <button onClick={() => router.push(`/dashboard/chat?userId=${profileUser._id}`)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-semibold transition-all border border-white/30 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Chat
                        </button>
                    )}
                    {canEdit && (
                        <button onClick={() => setShowEdit(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white font-semibold transition-all border border-white/30 flex items-center gap-2">
                            <Pencil className="w-4 h-4" />
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Info & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Basic Info */}
                    <div className="card p-6 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-4">Personal Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Email Address</p>
                                    <p className="text-sm font-medium text-gray-700 truncate">{profileUser.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Phone Number</p>
                                    <p className="text-sm font-medium text-gray-700">{profileUser.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <Heart className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Emergency Contact</p>
                                    <p className="text-sm font-medium text-gray-700">{profileUser.emergencyContact || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 group">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{profileUser.role === 'client' ? 'Billing Address' : 'Home Address'}</p>
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{profileUser.role === 'client' ? (profileUser.billingAddress || profileUser.address || 'No address saved') : (profileUser.address || 'No address saved')}</p>
                                </div>
                            </div>

                            {profileUser.role === 'client' && (
                                <>
                                    <div className="flex items-center gap-3 group">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Company & Industry</p>
                                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{profileUser.company || 'Not provided'}{profileUser.industry ? ` • ${profileUser.industry}` : ''}</p>
                                        </div>
                                    </div>
                                    {profileUser.taxId && (
                                        <div className="flex items-center gap-3 group">
                                            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:scale-110 transition-transform">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Tax ID / VAT No.</p>
                                                <p className="text-sm font-medium text-gray-700 leading-relaxed">{profileUser.taxId}</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats/Status */}
                    <div className="card p-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">{profileUser.role === 'client' ? 'Client Info' : 'Work Info'}</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                                    <Hash className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{profileUser.role === 'client' ? 'Client ID' : 'Employee ID'}</span>
                                </div>
                                <p className="text-lg font-bold text-gray-900">{profileUser.employeeId || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{profileUser.role === 'client' ? 'Since' : 'Join Date'}</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {profileUser.joinDate ? format(new Date(profileUser.joinDate), 'MMM yyyy') : 'Recently'}
                                </p>
                            </div>
                            {profileUser.role !== 'client' && (
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                                        <Star className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Leave Bal</span>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{profileUser.leaveBalance || 0} Days</p>
                                </div>
                            )}
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 text-rose-600 mb-1">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className={clsx("w-2 h-2 rounded-full", profileUser.status === 'active' ? "bg-emerald-500" : profileUser.status === 'inactive' ? "bg-gray-400" : "bg-amber-500")} />
                                    <p className="text-sm font-bold text-gray-900 capitalize">{profileUser.status || 'Active'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs & Dynamic Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex p-1.5 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-indigo-600 text-white shadow-lg scale-105"
                                            : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Panels */}
                    <div className="min-h-[400px]">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="card p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        Recent Activity
                                    </h3>
                                    <div className="space-y-4">
                                        {tasks.slice(0, 3).map((task: any) => (
                                            <div key={task._id} className="flex gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">{task.title}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{format(new Date(task.updatedAt), 'MMM dd, HH:mm')}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {tasks.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-4 italic">No recent activity</p>
                                        )}
                                    </div>
                                </div>
                                <div className="card p-6">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Star className="w-4 h-4 text-rose-500" />
                                        Key Metrics
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-indigo-50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Comp Tasks</p>
                                            <p className="text-xl font-black text-indigo-600">
                                                {tasks.filter(t => t.status === 'completed').length}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-emerald-50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Attend Rate</p>
                                            <p className="text-xl font-black text-emerald-600">
                                                {attendance?.summary?.attendancePercentage || '0'}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tasks' && (
                            <div className="card overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900">Task List</h3>
                                    <span className="badge badge-indigo">{tasks.length} Total</span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {tasks.map((task: any) => (
                                        <div key={task._id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                task.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                            )}>
                                                {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-900">{task.status}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Due: {format(new Date(task.dueDate), 'MMM dd')}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="p-12 text-center">
                                            <CheckSquare className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                            <p className="text-gray-400">No tasks assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'projects' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {projects.map((project: any) => (
                                    <div key={project._id} className="card p-5 group hover:border-indigo-200 transition-all">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <FolderKanban className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 truncate">
                                                <h4 className="font-bold text-gray-900 truncate">{project.name}</h4>
                                                <p className="text-xs text-gray-500">{project.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-4">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full font-semibold capitalize",
                                                project.status === 'active' ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-600"
                                            )}>
                                                {project.status}
                                            </span>
                                            <span className="text-gray-400">Ends: {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
                                        </div>
                                    </div>
                                ))}
                                {projects.length === 0 && (
                                    <div className="col-span-full card p-12 text-center">
                                        <FolderKanban className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                        <p className="text-gray-400">No linked projects</p>
                                    </div>
                                )}
                                {(isAdmin && profileUser.role === 'client') && (
                                    <div className="col-span-full mt-2">
                                        <button
                                            onClick={() => router.push('/dashboard/projects/create')}
                                            className="w-full flex justify-center py-3 border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                                        >
                                            + Create New Project for this Client
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'salary' && (
                            <div className="space-y-6">
                                <div className="card p-6 bg-gradient-to-br from-gray-900 to-indigo-900 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                                        <DollarSign className="w-40 h-40" />
                                    </div>
                                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Base Salary</p>
                                    <h3 className="text-4xl font-black mb-4">₹{profileUser.salary?.toLocaleString() || '0'}<span className="text-sm font-normal text-indigo-300">/month</span></h3>
                                    <div className="flex gap-4">
                                        <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">Net Pay</div>
                                        <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-semibold">CTC Optimized</div>
                                    </div>
                                </div>

                                <div className="card p-6">
                                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-500" />
                                        Payment History
                                    </h3>
                                    <div className="space-y-4">
                                        {salary.slice(0, 5).map((pay: any) => (
                                            <div key={pay._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-gray-100">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{pay.month} {pay.year}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{pay.status || 'Paid'}</p>
                                                </div>
                                                <p className="text-lg font-black text-emerald-600">₹{pay.amount?.toLocaleString()}</p>
                                            </div>
                                        ))}
                                        {salary.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-4 italic">No payment records found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
