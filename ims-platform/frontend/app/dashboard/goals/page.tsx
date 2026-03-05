'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Target, Plus, Loader2, TrendingUp, CheckCircle2, Clock, Pencil, ChevronDown, ChevronUp, Check } from 'lucide-react';
import clsx from 'clsx';
import CreateGoalModal from '../../../components/CreateGoalModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';

const STATUS_COLORS: Record<string, string> = {
    active: 'badge-blue',
    completed: 'badge-green',
    cancelled: 'badge-red',
    paused: 'badge-orange',
};

interface KeyResult { id: string; text: string; done: boolean; }

function GoalCard({ goal, onEdit, onProgressUpdate }: { goal: any; onEdit: () => void; onProgressUpdate: (id: string, progress: number) => void }) {
    const [expanded, setExpanded] = useState(false);
    const [keyResults, setKeyResults] = useState<KeyResult[]>(
        goal.keyResults?.map((kr: any, i: number) => ({ id: i.toString(), text: kr.text || kr, done: kr.done || false })) || []
    );
    const [newKR, setNewKR] = useState('');
    const [savingKR, setSavingKR] = useState(false);

    async function addKeyResult() {
        if (!newKR.trim()) return;
        const updated = [...keyResults, { id: Date.now().toString(), text: newKR.trim(), done: false }];
        setKeyResults(updated);
        setNewKR('');
        try {
            const payload = updated.map(kr => ({ text: kr.text, done: kr.done }));
            await api.put(`/api/goals/${goal._id}`, { keyResults: payload });
        } catch { toast.error('Failed to save key result'); }
    }

    async function toggleKR(id: string) {
        const updated = keyResults.map(kr => kr.id === id ? { ...kr, done: !kr.done } : kr);
        setKeyResults(updated);
        // auto-update progress based on done KRs
        const pct = updated.length > 0 ? Math.round((updated.filter(k => k.done).length / updated.length) * 100) : goal.progress;
        try {
            const payload = updated.map(kr => ({ text: kr.text, done: kr.done }));
            await api.put(`/api/goals/${goal._id}`, { keyResults: payload, progress: pct });
            onProgressUpdate(goal._id, pct);
        } catch { toast.error('Failed to update'); }
    }

    const doneCount = keyResults.filter(k => k.done).length;

    return (
        <div className="card p-5 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        {goal.description && <p className="text-sm text-gray-500 mt-0.5">{goal.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={clsx('badge flex-shrink-0', STATUS_COLORS[goal.status] || 'badge-gray')}>{goal.status}</span>
                    <button onClick={onEdit} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-semibold">{goal.progress || 0}%{keyResults.length > 0 && ` · ${doneCount}/${keyResults.length} KRs`}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                        style={{ width: `${goal.progress || 0}%` }}
                    />
                </div>
            </div>

            {goal.dueDate && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    Due: {new Date(goal.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            )}

            {/* Key Results Toggle */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:underline mt-1"
            >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Key Results {keyResults.length > 0 && `(${keyResults.length})`}
            </button>

            {expanded && (
                <div className="mt-3 space-y-2">
                    {keyResults.map(kr => (
                        <div key={kr.id} className="flex items-center gap-2 group">
                            <button
                                onClick={() => toggleKR(kr.id)}
                                className={clsx(
                                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                                    kr.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 hover:border-indigo-400'
                                )}
                            >
                                {kr.done && <Check className="w-2.5 h-2.5" />}
                            </button>
                            <span className={clsx('text-sm', kr.done ? 'line-through text-gray-400' : 'text-gray-700')}>{kr.text}</span>
                        </div>
                    ))}
                    {keyResults.length === 0 && <p className="text-xs text-gray-400 italic">No key results yet</p>}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            value={newKR}
                            onChange={e => setNewKR(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addKeyResult()}
                            placeholder="Add key result..."
                            className="input text-xs py-1.5 flex-1"
                        />
                        <button onClick={addKeyResult} className="btn-secondary text-xs px-3 py-1.5">Add</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editGoal, setEditGoal] = useState<any>(null);
    const [filterOwner, setFilterOwner] = useState('');
    const { user } = useAuth();

    function loadGoals() {
        setLoading(true);
        api.get('/api/goals')
            .then(({ data }) => setGoals(data.goals))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadGoals(); }, []);

    function handleProgressUpdate(id: string, progress: number) {
        setGoals(prev => prev.map(g => g._id === id ? { ...g, progress } : g));
    }

    const displayed = filterOwner
        ? goals.filter(g => g.ownerId?._id === filterOwner || g.ownerId === filterOwner)
        : goals;

    // unique owners from goals
    const owners: { id: string; name: string }[] = [];
    goals.forEach(g => {
        if (g.ownerId && !owners.find(o => o.id === (g.ownerId._id || g.ownerId))) {
            owners.push({ id: g.ownerId._id || g.ownerId, name: g.ownerId.name || 'Unknown' });
        }
    });

    return (
        <div>
            {(showCreate || editGoal) && (
                <CreateGoalModal
                    editGoal={editGoal}
                    onClose={() => { setShowCreate(false); setEditGoal(null); }}
                    onSuccess={() => { setShowCreate(false); setEditGoal(null); loadGoals(); }}
                />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Goals & OKRs</h1>
                    <p className="page-subtitle">{goals.length} goals tracked</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus className="w-4 h-4" />New Goal</button>
            </div>

            {/* Owner filter */}
            {owners.length > 0 && (
                <div className="flex gap-3 mb-5">
                    <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="select w-52">
                        <option value="">All Owners</option>
                        {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <div className="space-y-3">
                    {displayed.map((goal) => (
                        <GoalCard
                            key={goal._id}
                            goal={goal}
                            onEdit={() => setEditGoal(goal)}
                            onProgressUpdate={handleProgressUpdate}
                        />
                    ))}
                </div>
            )}

            {!loading && displayed.length === 0 && (
                <div className="text-center py-20">
                    <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No goals yet</p>
                    <p className="text-gray-300 text-sm mt-1">Set your first goal to track progress</p>
                </div>
            )}
        </div>
    );
}
