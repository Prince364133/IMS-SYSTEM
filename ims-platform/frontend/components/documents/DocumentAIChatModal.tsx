'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, MessageSquare, ClipboardList, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface DocumentAIChatModalProps {
    document: any;
    onClose: () => void;
}

export default function DocumentAIChatModal({ document: doc, onClose }: DocumentAIChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (msg?: string, summarizeOnly = false) => {
        const text = msg || input;
        if (!text.trim() && !summarizeOnly) return;

        if (!summarizeOnly) {
            setMessages(prev => [...prev, { role: 'user', content: text }]);
            setInput('');
        }

        setLoading(true);
        try {
            const { data } = await api.post('/api/ai/analyze-document', {
                documentId: doc._id,
                message: text,
                summarizeOnly
            });

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to get AI response');
        } finally {
            setLoading(false);
        }
    };

    const handleSummarize = () => {
        setMessages(prev => [...prev, { role: 'user', content: 'Summarize this document for me.' }]);
        handleSend('Summarize', true);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden border border-indigo-100">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">AI Document Assistant</h2>
                            <p className="text-xs text-indigo-600 font-medium truncate max-w-[300px]">
                                Chatting with: <span className="text-gray-500 font-normal">{doc.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full hover:bg-white hover:shadow-md flex items-center justify-center transition-all group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                    </button>
                </div>

                {/* Chat Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50"
                >
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-10">
                            <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-2 animate-bounce cursor-default">
                                <Sparkles className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Hello! I've read this document.</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                I can help you understand the contents, extract key dates, summarize sections, or help you draft a reply. What would you like to know?
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                                <button onClick={handleSummarize} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                                    <ClipboardList className="w-4 h-4" /> Summarize
                                </button>
                                <button onClick={() => setInput('What are the key terms?')} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
                                    <MessageSquare className="w-4 h-4" /> Key Terms
                                </button>
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={clsx('flex items-end gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                            {m.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-indigo-200">
                                    <Bot className="w-4 h-4 text-indigo-600" />
                                </div>
                            )}
                            <div className={clsx(
                                'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                                m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            )}>
                                <div className="whitespace-pre-wrap">{m.content}</div>
                            </div>
                            {m.role === 'user' && (
                                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-end gap-3 justify-start animate-pulse">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-center gap-3"
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about this document..."
                            disabled={loading}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 transition-all"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                    <div className="mt-2 px-1 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-medium">AI can make mistakes. Verify important info.</p>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSummarize} className="text-[10px] font-bold text-indigo-600 hover:underline">Quick Summary</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => setInput('Can you draft a reply to this?')} className="text-[10px] font-bold text-indigo-600 hover:underline">Draft Reply</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
