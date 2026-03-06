'use client';

import { useState, useMemo } from 'react';
import {
    BookOpen, Search, ChevronRight, LayoutDashboard,
    FolderKanban, CheckSquare, Bell, Settings,
    HelpCircle, Zap, ExternalLink, Globe,
    Shield, ArrowRight, MessageCircle, Info, ShieldCheck,
    ChevronDown, Plus, Users, Clock, Brain, Mail, Server, Database,
    DollarSign, FileText, Calendar, BarChart2 as BarChart, Box, CreditCard
} from 'lucide-react';
import { useSettings } from '../../../lib/settings-context';
import Link from 'next/link';
import clsx from 'clsx';

const SECTIONS = [
    { id: 'welcome', title: 'Welcome to IMS', icon: Globe },
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'dashboard', title: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'projects', title: 'Managing Projects', icon: FolderKanban },
    { id: 'tasks', title: 'Task Management', icon: CheckSquare },
    { id: 'chat', title: 'Team & Client Chat', icon: MessageCircle },
    { id: 'calendar', title: 'Calendar & Meetings', icon: Calendar },
    { id: 'time-tracking', title: 'Time Tracking', icon: Clock },
    { id: 'hr-management', title: 'HR & Leave Management', icon: Users },
    { id: 'finance', title: 'Finance, Invoices & Expenses', icon: CreditCard },
    { id: 'assets', title: 'Digital Assets Manager', icon: Globe },
    { id: 'analytics', title: 'Analytics & Reports', icon: BarChart },
    { id: 'documents', title: 'File Storage & Google Drive', icon: Database },
    { id: 'payroll', title: 'Salary & Payroll Workflow', icon: DollarSign },
    { id: 'emails', title: 'Automated Email Templates', icon: Mail },
    { id: 'notifications', title: 'Notifications & Updates', icon: Bell },
    { id: 'settings', title: 'Settings & Configuration', icon: Settings },
    { id: 'activation', title: 'System Activation', icon: ShieldCheck },
    { id: 'quick-links', title: 'Direct System Links', icon: ExternalLink },
    { id: 'tips', title: 'Tips for Best Usage', icon: Info },
    { id: 'faq', title: 'Frequently Asked Questions', icon: HelpCircle },
];

const FAQS = [
    {
        q: "How do I create my first project?",
        a: "Navigate to the Projects page using the sidebar, then click the 'New Project' button at the top right. Fill in the title, assign a manager, and set a deadline to get started."
    },
    {
        q: "Why am I not receiving notifications?",
        a: "Check your browser permissions to ensure notifications are allowed for this site. Also, verify your account notification preferences in Settings -> Security."
    },
    {
        q: "How do I edit my profile?",
        a: "Go to Settings -> Profile. You can update your display name and view your department details. Some fields like Email and Employee ID are locked and must be changed by an administrator."
    },
    {
        q: "How do I track task progress?",
        a: "Each task has a status (To Do, In Progress, Review, Done). When you finish work, click the task and update its status. You can see the visual progress bar on the project overview page."
    },
    {
        q: "Why can't I upload a document?",
        a: "Document uploading requires Google Drive to be configured by an administrator. Check Settings -> Storage to ensure the integration is active."
    },
    {
        q: "How is my salary calculated?",
        a: "Salaries are calculated automatically on the global release date. Base pay is reduced proportionately for any registered absences."
    }
];

export default function DocsPage() {
    const { company } = useSettings();
    const companyName = company?.companyName || 'Internal Management System';
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState('welcome');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const filteredSections = useMemo(() => {
        if (!search) return SECTIONS;
        return SECTIONS.filter(s =>
            s.title.toLowerCase().includes(search.toLowerCase()) ||
            s.id.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            <div className="page-header mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-indigo-100 shadow-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="page-title">Help Center</h1>
                        <p className="page-subtitle">Your guide to mastering the {companyName} Management System</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-8 overflow-hidden">
                {/* Sidebar Nav */}
                <aside className="w-64 flex flex-col gap-4 sticky top-0 h-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search topics..."
                            className="input pl-10 bg-white border-gray-100 focus:bg-white"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {filteredSections.map((section) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                        activeSection === section.id
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-4 ring-indigo-50"
                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className={clsx("w-4 h-4", activeSection === section.id ? "text-white" : "text-gray-400 group-hover:text-indigo-500")} />
                                    {section.title}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 bg-white border border-gray-100 rounded-3xl overflow-y-auto p-8 shadow-sm custom-scrollbar relative">
                    <div className="max-w-3xl mx-auto space-y-16 pb-20">
                        {/* Section 1: Welcome to IMS */}
                        <section id="welcome" className="scroll-mt-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3 leading-tight">
                                <Globe className="w-8 h-8 text-indigo-500" />
                                Welcome to IMS
                            </h2>
                            <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed space-y-4">
                                <p className="text-lg text-gray-700">
                                    The **{companyName} Management System (IMS)** is a powerful, all-in-one platform built to streamline project delivery, task management, and team communication.
                                </p>
                                <p>
                                    Whether you're an admin managing configurations, a manager tracking project lifecycles, or an employee completing daily tasks, IMS provides the tools you need to stay organized and efficient.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 mb-1">Centralized Work</h4>
                                        <p className="text-sm text-indigo-700">All your projects, tasks, and files in one secure place.</p>
                                    </div>
                                    <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                                        <h4 className="font-bold text-green-900 mb-1">Real-time Updates</h4>
                                        <p className="text-sm text-green-700">Stay informed with instant notifications and live dashboards.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Getting Started */}
                        <section id="getting-started" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Zap className="w-6 h-6 text-amber-500" />
                                Getting Started
                            </h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">1</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Logging In</h3>
                                        <p className="text-gray-600 mt-1">Access the login page at `/login`. Use your assigned company email and secure password to enter the system.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">2</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Sidebar Navigation</h3>
                                        <p className="text-gray-600 mt-1">Found on the left of your screen. This sidebar is your primary way to switch between Dashboard, Projects, Tasks, and Settings.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-bold flex items-center justify-center flex-shrink-0 text-sm">3</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">Top Header Bar</h3>
                                        <p className="text-gray-600 mt-1">Quickly access your notifications, view your current role, and access profile shortcuts.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Dashboard Overview */}
                        <section id="dashboard" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <LayoutDashboard className="w-6 h-6 text-indigo-500" />
                                Dashboard Overview
                            </h2>
                            <p className="text-gray-600 mb-6">The Dashboard is your "at-a-glance" status center. It highlights what requires your immediate attention.</p>
                            <div className="space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2 underline decoration-indigo-300 underline-offset-4">Statistics Cards</h4>
                                    <p className="text-sm text-gray-600">Displays counts of your active projects, pending tasks, and team attendance status.</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2 underline decoration-indigo-300 underline-offset-4">Quick Actions</h4>
                                    <p className="text-sm text-gray-600">Instant buttons to start new projects, log attendance, or view today's schedule.</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-2 underline decoration-indigo-300 underline-offset-4">Interactive Graphs</h4>
                                    <p className="text-sm text-gray-600">Visual representations of project progress over time and task completion rates.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 4: Managing Projects */}
                        <section id="projects" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <FolderKanban className="w-6 h-6 text-blue-500" />
                                Managing Projects
                            </h2>
                            <div className="bg-white border rounded-2xl overflow-hidden mb-6">
                                <div className="p-4 bg-blue-50 border-b font-semibold text-blue-900">How to Create a Project</div>
                                <div className="p-6 space-y-4">
                                    <ol className="list-decimal list-inside space-y-3 text-gray-600">
                                        <li>Click <strong>Projects</strong> in the sidebar.</li>
                                        <li>Select <strong>New Project</strong> on the top right.</li>
                                        <li>Enter a title (e.g., "Q1 Marketing Campaign").</li>
                                        <li>Assign a <strong>Project Manager</strong> and select a client.</li>
                                        <li>Set Start and End dates.</li>
                                        <li>Click <strong>Create Project</strong> to confirm.</li>
                                    </ol>
                                </div>
                            </div>
                            <p className="text-gray-600">Projects act as containers for your work. You can upload files, add links, and track timeline progress using the built-in tracking bars.</p>
                        </section>

                        {/* Section 5: Task Management */}
                        <section id="tasks" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <CheckSquare className="w-6 h-6 text-green-500" />
                                Task Management
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-3 block">Task Statuses</h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> **To Do**: Newly created tasks.</li>
                                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> **In Progress**: Work is active.</li>
                                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> **Review**: Waiting for approval.</li>
                                        <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> **Completed**: Task is finished.</li>
                                    </ul>
                                </div>
                                <div className="p-6 bg-indigo-900 text-white rounded-2xl shadow-lg">
                                    <h4 className="font-bold text-indigo-100 mb-3 block">Tasks vs Projects</h4>
                                    <p className="text-xs text-indigo-200 leading-relaxed">
                                        **Projects** are high-level goals with a client and deadline.
                                        <br /><br />
                                        **Tasks** are the specific, actionable steps needed to complete a Project. Always break a project down into multiple tasks.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section new: Team & Client Chat */}
                        <section id="chat" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <MessageCircle className="w-6 h-6 text-indigo-500" />
                                Team & Client Chat
                            </h2>
                            <p className="text-gray-600 mb-6">Communicate securely with your entire organization and assigned clients directly within IMS.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li><strong>Mentions:</strong> Type <code>@</code> in any chat to tag users. The system dynamically filters who you can mention.</li>
                                <li><strong>Client Chat Rules:</strong> Clients are only visible in chats if the <code>employeeClientChatAllowed</code> setting is enabled.</li>
                            </ul>
                        </section>

                        {/* Section new: Calendar & Meetings */}
                        <section id="calendar" className="scroll-mt-8 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-blue-500" />
                                Calendar & Meetings
                            </h2>
                            <p className="text-gray-600 mb-6">Stay organized with a centralized company-wide calendar for all scheduled events.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li>View impending project deadlines, upcoming meetings, and scheduled tasks.</li>
                                <li>Click on an empty slot to schedule a new meeting with colleagues or clients.</li>
                            </ul>
                        </section>

                        {/* Section new: Time Tracking */}
                        <section id="time-tracking" className="scroll-mt-8 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Clock className="w-6 h-6 text-amber-500" />
                                Time & Activity Tracking
                            </h2>
                            <p className="text-gray-600 mb-6">Track your daily work hours seamlessly against specific tasks.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li>Log your active hours directly into the Time Tracking dashboard.</li>
                                <li>Managers receive comprehensive reports showing time metrics for performance reviews.</li>
                            </ul>
                        </section>

                        {/* Section new: HR & Directory */}
                        <section id="hr-management" className="scroll-mt-8 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Users className="w-6 h-6 text-emerald-500" />
                                HR Management & Leave Requests
                            </h2>
                            <p className="text-gray-600 mb-6">A central hub for human resources to manage employee data and leaves.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li><strong>Employee Directory:</strong> View profiles, contact details, and assigned roles.</li>
                                <li><strong>Leave Requests:</strong> Apply for sick days or paid time off directly. HR evaluates all incoming requests on a dedicated dashboard.</li>
                            </ul>
                        </section>

                        {/* Section new: Finance */}
                        <section id="finance" className="scroll-mt-8 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <CreditCard className="w-6 h-6 text-rose-500" />
                                Finance, Invoices & Expenses
                            </h2>
                            <p className="text-gray-600 mb-6">The Finance module centralizes all monetary transactions tied to projects and daily operations.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li><strong>Invoices:</strong> Automatically generate, send, and track PDF invoices for client projects.</li>
                                <li><strong>Expenses:</strong> Submit business expenses to administrators for reimbursements.</li>
                            </ul>
                        </section>

                        {/* Section new: Digital Assets */}
                        <section id="assets" className="scroll-mt-8 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Globe className="w-6 h-6 text-indigo-500" />
                                Digital Assets Manager
                            </h2>
                            <p className="text-gray-600 mb-6">Track and manage your entire digital infrastructure in one place, from domains to API keys.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li><strong>Asset Types:</strong> Manage Domains, Servers, APIs, Licenses, and Git Repositories.</li>
                                <li><strong>Renewal Tracking:</strong> Receive automatic reminders for upcoming domain or certificate renewals.</li>
                                <li><strong>Cost Analysis:</strong> Monitor monthly and yearly infrastructure spending to stay within budget.</li>
                            </ul>
                        </section>

                        {/* Section new: Analytics */}
                        <section id="analytics" className="scroll-mt-8 mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <BarChart className="w-6 h-6 text-cyan-500" />
                                Analytics & Reports
                            </h2>
                            <p className="text-gray-600 mb-6">Comprehensive data insights powered by IMS's Hybrid Intelligence Strategy.</p>
                            <ul className="space-y-2 text-sm text-gray-600 list-disc ml-5">
                                <li><strong>Predictive Risk Scores:</strong> Our algorithms automatically surface projects that are likely to miss deadines.</li>
                                <li><strong>Performance Metrics:</strong> Visualize task completion velocity, project health, and company growth trends over time.</li>
                            </ul>
                        </section>

                        {/* Section x: File Storage & Google Drive */}
                        <section id="documents" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Database className="w-6 h-6 text-indigo-500" />
                                File Storage & Google Drive
                            </h2>
                            <p className="text-gray-600 mb-6">All project documents and company files are securely stored in Google Drive, directly accessed via the IMS portal.</p>
                            <div className="space-y-4">
                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-2">Centralized Access</h4>
                                    <p className="text-sm text-blue-800">No more scattered files. Every file attached to a project or task is mirrored in your unified Google Drive repository.</p>
                                </div>
                                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-2">Upload Requirements</h4>
                                    <p className="text-sm text-blue-800">To maintain security and compliance, local uploads are not permitted unless an administrator has activated the Google Drive integration in Settings.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section x: Salary & Payroll Workflow */}
                        <section id="payroll" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <DollarSign className="w-6 h-6 text-green-500" />
                                Salary & Payroll Workflow
                            </h2>
                            <p className="text-gray-600 mb-6">IMS automates the end-to-end salary cycle to ensure accuracy and timely payouts.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Clock className="w-5 h-5 text-gray-600" /></div>
                                    <h4 className="font-bold text-gray-900 mb-2">1. Automated Drafts</h4>
                                    <p className="text-sm text-gray-600">On the configured release date, drafts are created by mapping the employee's base salary against their absences for the month.</p>
                                </div>
                                <div className="p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-5 h-5 text-indigo-600" /></div>
                                    <h4 className="font-bold text-gray-900 mb-2">2. HR Review</h4>
                                    <p className="text-sm text-gray-600">HR Managers review the generated drafts, applying custom performance bonuses or manual deductions before marking them as "HR Approved".</p>
                                </div>
                                <div className="p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3"><CheckSquare className="w-5 h-5 text-green-600" /></div>
                                    <h4 className="font-bold text-gray-900 mb-2">3. Admin Paid & Dispatch</h4>
                                    <p className="text-sm text-gray-600">Administrators fulfill the final verification. Once marked as "Paid", a beautifully formatted Salary Slip is automatically emailed to the employee.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section x: Automated Email Templates */}
                        <section id="emails" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Mail className="w-6 h-6 text-rose-500" />
                                Automated Email Templates
                            </h2>
                            <p className="text-gray-600 mb-6">Maintain clear and professional communication with 15 pre-built, editable system email templates.</p>
                            <div className="bg-white border rounded-2xl overflow-hidden mb-6">
                                <div className="p-4 bg-rose-50 border-b font-semibold text-rose-900">How to manage emails</div>
                                <div className="p-6 space-y-4 text-gray-600 text-sm">
                                    <p>Navigate to <strong>Settings -{'>'} Email Management</strong> to track outgoing emails.</p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Preview & Edit:</strong> Before an email is dispatched manually, a preview modal allows you to edit the Subject and Content.</li>
                                        <li><strong>Automated Triggers:</strong> System actions like Salary Paid, Task Creation, and Project Kickoffs trigger pre-configured HTML templates automatically.</li>
                                        <li><strong>Usage Breakdown:</strong> A pie chart visually tracks which templates are utilized the most across your company.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Section 6: Notifications & Updates */}
                        <section id="notifications" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Bell className="w-6 h-6 text-rose-500" />
                                Notifications & Updates
                            </h2>
                            <p className="text-gray-600 mb-6">Stay on top of updates with real-time alerts. You can access the notification panel by clicking the bell icon <Bell className="inline w-3.5 h-3.5 mx-0.5" /> in the top bar.</p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 border rounded-2xl">
                                    <CheckSquare className="w-5 h-5 text-indigo-500 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900">Task Assignments</p>
                                        <p className="text-sm text-gray-500">Receive an alert when you are assigned to a new task.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 border rounded-2xl">
                                    <MessageCircle className="w-5 h-5 text-blue-500 mt-1" />
                                    <div>
                                        <p className="font-bold text-gray-900">System Broadcasts</p>
                                        <p className="text-sm text-gray-500">Important messages from administrators or HR.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 7.5: System Activation */}
                        <section id="activation" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-green-600" />
                                System Activation & Integrations
                            </h2>
                            <p className="text-gray-600 mb-8 font-medium">For Administrators: To unlock the full power of IMS (AI, Automated Emails, and Cloud Storage), follow these critical configuration steps.</p>

                            <div className="space-y-10">
                                {/* Database Connectivity */}
                                <div className="relative pl-8 border-l-2 border-emerald-100">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-600 ring-4 ring-white"></div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-emerald-500" />
                                        0. Database Connectivity (Required)
                                    </h3>
                                    <div className="prose prose-sm text-gray-600 space-y-3">
                                        <p>The first step in using IMS is connecting to a live MongoDB Cluster. We recommend **MongoDB Atlas** for a reliable, cloud-hosted experience.</p>
                                        <ol className="list-decimal pl-4 space-y-1">
                                            <li>Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).</li>
                                            <li>Deploy a **FREE** Cluster (M0 tier is perfect for starting).</li>
                                            <li>Under **Database Access**, create a user with a secure password.</li>
                                            <li>Under **Network Access**, add `0.0.0.0/0` to allow connections from anywhere (or specify your server IP).</li>
                                            <li>Go to **Database** {"->"} **Connect** {"->"} **Drivers** to find your connection details:
                                                <ul className="list-disc pl-4 mt-1 opacity-80">
                                                    <li>**Username**: The database user you created.</li>
                                                    <li>**Password**: The user's password.</li>
                                                    <li>**Cluster URL**: The host part of your connection string (e.g., `cluster0.abcde.mongodb.net`).</li>
                                                </ul>
                                            </li>
                                        </ol>
                                        <div className="bg-emerald-50 p-3 rounded-lg text-emerald-800 text-xs shadow-sm border border-emerald-100/50">
                                            <strong>Safety Note:</strong> Never share your database credentials. IMS stores these securely in your server's environment configuration.
                                        </div>
                                    </div>
                                </div>

                                {/* AI Activation */}
                                <div className="relative pl-8 border-l-2 border-indigo-100">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-indigo-500" />
                                        1. Activate AI Assistants
                                    </h3>
                                    <div className="prose prose-sm text-gray-600 space-y-3">
                                        <p>Enable the <strong>IMS Smart Assistant</strong> and Automated Task Generation by connecting an AI provider.</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li><strong>Google Gemini:</strong> Get your key at [Google AI Studio](https://aistudio.google.com/).</li>
                                            <li><strong>Groq:</strong> Get high-speed keys at [Groq Console](https://console.groq.com/keys).</li>
                                            <li><strong>OpenAI:</strong> Use GPT-4o keys from [OpenAI Dashboard](https://platform.openai.com/api-keys).</li>
                                        </ul>
                                        <div className="bg-indigo-50 p-3 rounded-lg text-indigo-800 text-xs">
                                            <strong>Pro Tip:</strong> Use the "Test Connection" button in Settings to verify your API key immediately.
                                        </div>
                                    </div>
                                </div>

                                {/* Email Activation */}
                                <div className="relative pl-8 border-l-2 border-indigo-100">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-rose-600 ring-4 ring-white"></div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-rose-500" />
                                        2. Setup Email Automations
                                    </h3>
                                    <div className="prose prose-sm text-gray-600 space-y-3">
                                        <p>IMS sends automated Salary Slips and Welcome Emails via SMTP. To use Gmail:</p>
                                        <ol className="list-decimal pl-4 space-y-1">
                                            <li>Go to [Google App Passwords](https://myaccount.google.com/apppasswords).</li>
                                            <li>Select "App" as "Other" and name it **IMS Platform**.</li>
                                            <li>Paste the generated 16-character code into the <strong>SMTP Password</strong> field in Settings.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* Cloud Storage Activation */}
                                <div className="relative pl-8 border-l-2 border-indigo-100">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white"></div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Server className="w-5 h-5 text-blue-500" />
                                        3. Activate Cloud File Storage
                                    </h3>
                                    <div className="prose prose-sm text-gray-600 space-y-3">
                                        <p>Switch from Local Storage to <strong>Google Drive</strong> to enable global file access.</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Create a Service Account in [Google Cloud Console](https://console.cloud.google.com/).</li>
                                            <li>Enable "Google Drive API" for your project.</li>
                                            <li>Download the JSON key file and paste its contents into the **Service Account JSON** field in Settings.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 8: Direct System Links */}
                        <section id="quick-links" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <ExternalLink className="w-6 h-6 text-indigo-500" />
                                Quick Shortcuts
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <Link href="/dashboard" className="p-4 bg-white border border-indigo-100 rounded-2xl text-center group hover:bg-indigo-50 transition-all">
                                    <LayoutDashboard className="w-6 h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-semibold text-indigo-900">Dashboard</span>
                                </Link>
                                <Link href="/dashboard/projects" className="p-4 bg-white border border-blue-100 rounded-2xl text-center group hover:bg-blue-50 transition-all">
                                    <FolderKanban className="w-6 h-6 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-semibold text-blue-900">Projects</span>
                                </Link>
                                <Link href="/dashboard/tasks" className="p-4 bg-white border border-green-100 rounded-2xl text-center group hover:bg-green-50 transition-all">
                                    <CheckSquare className="w-6 h-6 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-semibold text-green-900">Tasks</span>
                                </Link>
                                <Link href="/dashboard/settings" className="p-4 bg-white border border-gray-100 rounded-2xl text-center group hover:bg-gray-50 transition-all">
                                    <Settings className="w-6 h-6 text-gray-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-semibold text-gray-900">Settings</span>
                                </Link>
                                <Link href="/dashboard/chat" className="p-4 bg-white border border-amber-100 rounded-2xl text-center group hover:bg-amber-50 transition-all">
                                    <MessageCircle className="w-6 h-6 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-semibold text-amber-900">AI Chat</span>
                                </Link>
                                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="p-4 bg-white border border-indigo-100 rounded-2xl text-center group hover:bg-indigo-50 transition-all">
                                    <HelpCircle className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                    <span className="text-sm font-semibold text-indigo-900">Back to Top</span>
                                </button>
                            </div>
                        </section>

                        {/* Section 9: Tips for Best Usage */}
                        <section id="tips" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Info className="w-6 h-6 text-indigo-500" />
                                Best Practices
                            </h2>
                            <div className="space-y-4">
                                <div className="p-5 bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-2xl">
                                    <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        Daily Attendance
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Log your attendance immediately after logging in. This keeps HR informed of your availability and helps in salary calculations.</p>
                                </div>
                                <div className="p-5 bg-white border-l-4 border-amber-500 shadow-sm rounded-r-2xl">
                                    <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-amber-500" />
                                        Detailed Task Titles
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Avoid naming tasks "Untitled" or "Fix bug". Use clear titles like "Optimize database query for reports" to help managers track progress easily.</p>
                                </div>
                                <div className="p-5 bg-white border-l-4 border-green-500 shadow-sm rounded-r-2xl">
                                    <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4 text-green-500" />
                                        Collaborative AI
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">Use the built-in AI Assistant to draft task descriptions, generate reports, or ask clarifying questions about project goals.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 10: FAQ */}
                        <section id="faq" className="scroll-mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <HelpCircle className="w-6 h-6 text-indigo-500" />
                                FAQ
                            </h2>
                            <div className="space-y-3">
                                {FAQS.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="font-bold text-gray-900 block">{item.q}</span>
                                            <ChevronDown className={clsx("w-4 h-4 text-gray-400 transition-transform", openFaq === idx && "rotate-180 text-indigo-500")} />
                                        </button>
                                        <div className={clsx("transition-all duration-300 overflow-hidden", openFaq === idx ? "max-h-56 opacity-100" : "max-h-0 opacity-0")}>
                                            <div className="p-5 pt-0 text-sm text-gray-600 leading-relaxed bg-gray-50/50">
                                                {item.a}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 py-8 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-400">Can't find what you're looking for?</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">Contact your system administrator for support.</p>
                        <p className="text-[10px] text-gray-300 mt-6 mt-auto italic">Powering productivity at {companyName}</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
}
