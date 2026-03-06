'use client';

import { useState } from 'react';
import { Sparkles, X, Wand2, Loader2, RotateCcw, Check } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface AIEmailDraftModalProps {
    onClose: () => void;
    onApply: (draft: string) => void;
    recipientName?: string;
    context?: string;
}

export default function AIEmailDraftModal({ onClose, onApply, recipientName, context }: AIEmailDraftModalProps) {
    const [idea, setIdea] = useState('');
    const [tone, setTone] = useState('professional');
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState('');

    const handleGenerate = async () => {
        if (!idea.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.post('/api/ai/generate-email-draft', {
                idea,
                recipientName,
                tone,
                context
            });
            setDraft(data.draft);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-indigo-100 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">AI Writing Assistant</h3>
                            <p className="text-xs text-indigo-600 font-medium">Professional email drafting powered by AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!draft ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider text-[10px]">What is this email about?</label>
                                <textarea
                                    value={idea}
                                    onChange={(e) => setIdea(e.target.value)}
                                    placeholder="e.g., Asking for project update, announcing a holiday, or replying to a client query..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-h-[120px] transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider text-[10px]">Tone</label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="friendly">Friendly</option>
                                        <option value="formal">Formal</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="empathetic">Empathetic</option>
                                    </select>
                                </div>
                                {recipientName && (
                                    <div>
                                        <label className="text-sm font-bold text-gray-700 mb-2 block uppercase tracking-wider text-[10px]">Recipient</label>
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-700 font-medium truncate">
                                            {recipientName}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading || !idea.trim()}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                {loading ? 'Generating Magic Draft...' : 'Generate Draft'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider text-[10px]">Generated Draft</h4>
                                <button onClick={() => setDraft('')} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Re-start
                                </button>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                                {draft}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={() => onApply(draft)}
                                    className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
                                >
                                    <Check className="w-5 h-5" /> Use This Draft
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
