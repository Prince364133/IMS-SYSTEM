'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, RefreshCw, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import api from '../../../lib/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
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

    async function send(text?: string) {
        const msg = text || input.trim();
        if (!msg) return;
        setInput('');
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() };

        const historyToSend = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const { data } = await api.post('/api/ai/chat', {
                message: msg,
                history: historyToSend
            });
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: "Sorry, I had trouble connecting to the network or the AI provider wasn't configured properly.", timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
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
