'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, RefreshCw, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Smart mock AI responses based on keywords
function getMockResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();

    if (msg.includes('leave') || msg.includes('vacation') || msg.includes('off')) {
        return `**Leave Policy Summary**\n\nHere's a quick overview of leave types available:\n- 🤒 **Sick Leave**: Up to 12 days/year (with medical certificate for >3 days)\n- 🏖️ **Casual Leave**: 10 days/year, max 3 consecutive days\n- 📅 **Annual Leave**: 18 days/year (accrued monthly)\n- 👶 **Maternity/Paternity**: 26 weeks / 15 days respectively\n\nTo apply for leave, go to **Attendance → Leave Requests** and click "Request Leave". Your manager/HR will be notified for approval.\n\n*Need help with anything specific about leave management?*`;
    }
    if (msg.includes('salary') || msg.includes('payroll') || msg.includes('pay') || msg.includes('payslip')) {
        return `**Salary & Payroll Info**\n\nHere's how payroll works at your organization:\n\n1. **Generation**: HR generates salaries at month end\n2. **Review**: HR/Admin reviews and approves\n3. **Payment**: Marked as "Paid" after bank transfer\n4. **Payslip**: Available under **HR & Salary → Payroll** — click "Payslip" to view/print\n\nYour payslip shows:\n- Base Salary\n- Allowances & Bonuses\n- Deductions (TDS, PF, etc.)\n- **Net Take-home**\n\n*Is there a specific salary query I can help with?*`;
    }
    if (msg.includes('task') || msg.includes('kanban') || msg.includes('board')) {
        return `**Task Management Tips 📋**\n\nYour Tasks module supports two views:\n\n🗂️ **Kanban Board**: Drag & drop cards between columns\n- To Do → In Progress → In Review → Done\n\n📋 **List View**: Compact view with filters by status & priority\n\n**Tips:**\n- Use **priority labels** (Low/Medium/High/Critical) to keep the team focused\n- Drag a task card across columns to update its status instantly\n- Each card shows the assignee avatar, due date, and project name\n\n*Want to know how to assign tasks to your team?*`;
    }
    if (msg.includes('project')) {
        return `**Project Management 🚀**\n\nProjects track your team's larger initiatives. Each project has:\n- **Status**: Planning, In Progress, On Hold, Completed\n- **Priority**: Low → Critical\n- **Members**: Add team members for collaboration\n- **Tasks**: All related tasks are linked to the project\n\nGo to **Projects** in the sidebar to create or manage projects. Managers and Admins can create new projects.\n\n*Need help with a specific project workflow?*`;
    }
    if (msg.includes('attendance') || msg.includes('absent') || msg.includes('present')) {
        return `**Attendance Tracking 📅**\n\nAttendance statuses available:\n- ✅ Present\n- ❌ Absent\n- 🕐 Late\n- 🌓 Half Day\n- 🏠 Work From Home\n- 📤 On Leave\n\nHR/Managers mark attendance daily. You can view your monthly attendance under **Attendance** in the sidebar.\n\nFor leave-related absences, submit a **Leave Request** first so it reflects as "On Leave" instead of "Absent".\n\n*Any specific attendance question?*`;
    }
    if (msg.includes('employee') || msg.includes('profile') || msg.includes('team')) {
        return `**Employee Management 👥**\n\nThe Employees section allows you to:\n- View all team members and their profiles\n- Edit employee details (Admin/HR only)\n- Deactivate/Reactivate accounts\n- View each employee's Tasks, Salary history, and Attendance\n\nEach employee profile shows their department, position, joining date, and current status.\n\n*Want to know more about specific employee features?*`;
    }
    if (msg.includes('recruit') || msg.includes('job') || msg.includes('application') || msg.includes('hiring') || msg.includes('candidate')) {
        return `**Recruitment Pipeline 🎯**\n\nManage hiring with a 6-stage pipeline:\n1. Applied\n2. Screening\n3. Interview\n4. Offer\n5. Hired / Rejected\n\nHR can post jobs with skills, location, deadline, and openings. Candidates move through stages via a **drag-and-drop Kanban board**.\n\nGo to **Recruitment → Application Pipeline** to manage active candidates.\n\n*Need help setting up a job posting?*`;
    }
    if (msg.includes('goal') || msg.includes('okr') || msg.includes('key result')) {
        return `**Goals & OKRs 🎯**\n\nTrack organizational objectives with OKRs (Objectives & Key Results):\n\n- **Objective**: High-level goal (e.g., "Grow revenue by 25%")\n- **Key Results**: Measurable sub-tasks under each objective\n\nCheck off Key Results to automatically update the goal's progress bar.\n\nTip: Use **status** (Active/Paused/Completed) to manage goal lifecycle.\n\n*Want help structuring effective OKRs?*`;
    }
    if (msg.includes('report') || msg.includes('export') || msg.includes('csv') || msg.includes('download')) {
        return `**Reports & Export 📊**\n\nThe Reports section has 4 report tabs:\n1. **Attendance Report** — per-employee monthly counts\n2. **Payroll Report** — salary breakdown by month\n3. **Projects Report** — status and priority overview\n4. **Employees Report** — full team roster\n\nClick **"Export CSV"** on any tab to download the data as a spreadsheet.\n\n*Need a specific report format or custom data?*`;
    }
    if (msg.includes('analytics') || msg.includes('chart') || msg.includes('metric')) {
        return `**Analytics Dashboard 📈**\n\nThe Analytics page shows real-time data:\n- 📊 **Monthly Payroll Trend** — area chart from salary data\n- 🍩 **Task Status Distribution** — pie chart from tasks\n- 📦 **Projects by Status** — bar chart\n- 👥 **Department Headcount** — horizontal bar chart\n\nAll charts auto-update from your live database — no manual refresh needed.\n\n*Want to know more about a specific metric?*`;
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help')) {
        return `**Hello! 👋 I'm your AI Workplace Assistant.**\n\nI can help you with:\n- 📅 Leave & Attendance policies\n- 💰 Salary & Payroll questions\n- ✅ Task & Project management\n- 👥 Team & HR queries\n- 📊 Reports & Analytics\n- 🎯 Goals & Recruitment\n\nJust type your question in plain English and I'll do my best to assist!\n\n*What would you like to know about?*`;
    }
    if (msg.includes('setting') || msg.includes('password') || msg.includes('profile')) {
        return `**Account Settings ⚙️**\n\nYou can manage your account under **Settings**:\n\n🧑 **Profile** — Update your display name\n🔐 **Security** — Change your password (min 6 chars, strength meter included)\n🎨 **Branding** (Admin) — Company name, logo, theme color\n👑 **Role Management** (Admin) — Change any user's role\n📋 **Audit Log** (Admin) — View all system events\n\n*Need help with a specific setting?*`;
    }

    // Generic fallback
    const topics = ['leave policy', 'salary/payroll', 'tasks & projects', 'attendance', 'recruitment', 'goals & OKRs', 'reports & exports', 'settings'];
    return `I understand you're asking about **"${userMessage}"**.\n\nHere are some topics I can help with:\n${topics.map(t => `- ${t}`).join('\n')}\n\nCould you please rephrase your question or pick one of the topics above? I'll provide detailed guidance.\n\n*Note: For complex HR or legal queries, please contact your HR department directly.*`;
}

const SUGGESTIONS = [
    'How do I apply for leave?',
    'Where can I view my payslip?',
    'How does the Kanban board work?',
    'What are the leave types available?',
    'How to change my password?',
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState<Message[]>([{
        id: '0',
        role: 'assistant',
        content: "**Hello! 👋 I'm your AI Workplace Assistant.**\n\nI can help you with leave policies, payroll questions, task management, recruitment, reports, and much more.\n\nWhat would you like to know today?",
        timestamp: new Date(),
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function send(text?: string) {
        const msg = text || input.trim();
        if (!msg) return;
        setInput('');
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        // Simulate AI response delay
        setTimeout(() => {
            const response = getMockResponse(msg);
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);
            setLoading(false);
        }, 800 + Math.random() * 700);
    }

    function copyMessage(id: string, content: string) {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    function formatMessage(content: string) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    return (
        <div className="flex flex-col h-[calc(100vh-112px)]">
            <div className="page-header flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="page-title">AI Assistant</h1>
                        <p className="page-subtitle">Ask anything about your workplace</p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([{ id: '0', role: 'assistant', content: "**Hello! 👋 I'm your AI Workplace Assistant.**\n\nI can help you with leave policies, payroll questions, task management, recruitment, reports, and much more.\n\nWhat would you like to know today?", timestamp: new Date() }])}
                    className="btn-secondary text-xs"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> New Chat
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
                {messages.map((msg) => (
                    <div key={msg.id} className={clsx('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                        <div className={clsx(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        )}>
                            {msg.role === 'assistant' ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                        </div>
                        <div className={clsx('max-w-[75%] group', msg.role === 'user' ? 'items-end' : 'items-start')}>
                            <div className={clsx(
                                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                                msg.role === 'assistant'
                                    ? 'bg-white border border-gray-100 shadow-sm text-gray-800'
                                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            )}>
                                <div
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                />
                            </div>
                            <div className={clsx('flex items-center gap-2 mt-1', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                <span className="text-[10px] text-gray-400">
                                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.role === 'assistant' && (
                                    <button
                                        onClick={() => copyMessage(msg.id, msg.content)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                                    >
                                        {copiedId === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
                <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
                    {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => send(s)} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 rounded-full px-3 py-1.5 transition-colors">
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Ask about leave, payroll, tasks, projects..."
                    className="input flex-1"
                    disabled={loading}
                />
                <button
                    onClick={() => send()}
                    disabled={loading || !input.trim()}
                    className="btn-primary px-4 disabled:opacity-40"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
