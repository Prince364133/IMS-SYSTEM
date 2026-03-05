'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
    ChevronLeft, ChevronRight, Plus, X, Loader2, Calendar,
    Trash2, Circle
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay, parseISO } from 'date-fns';

const EVENT_TYPES = [
    { key: 'holiday', label: 'Holiday', color: '#ef4444' },
    { key: 'event', label: 'Event', color: '#4f46e5' },
    { key: 'meeting', label: 'Meeting', color: '#0ea5e9' },
    { key: 'deadline', label: 'Deadline', color: '#f59e0b' },
    { key: 'leave', label: 'Leave', color: '#10b981' },
    { key: 'other', label: 'Other', color: '#6b7280' },
];

function getEventColor(type: string) {
    return EVENT_TYPES.find(e => e.key === type)?.color || '#6b7280';
}

function AddEventModal({ date, onClose, onSuccess }: { date: Date; onClose: () => void; onSuccess: () => void }) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'event',
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'),
        allDay: true,
        color: '#4f46e5',
        isCompanyWide: true,
    });
    const [loading, setLoading] = useState(false);

    // Auto-update color when type changes
    function changeType(type: string) {
        const col = getEventColor(type);
        setForm(p => ({ ...p, type, color: col }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title) return toast.error('Title is required');
        setLoading(true);
        try {
            await api.post('/api/calendar', form);
            toast.success('Event created!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create event');
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Add Event — {format(date, 'MMM d, yyyy')}</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="label">Event Title *</label>
                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder="e.g. Company All Hands" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Type</label>
                            <select value={form.type} onChange={e => changeType(e.target.value)} className="select">
                                {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Color</label>
                            <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="input h-[42px] cursor-pointer" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input" />
                        </div>
                        <div>
                            <label className="label">End Date</label>
                            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input" />
                        </div>
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const isAdmin = user?.role === 'admin';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    function loadEvents() {
        setLoading(true);
        api.get('/api/calendar', { params: { year, month } })
            .then(({ data }) => setEvents(data.events || []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }

    useEffect(() => { loadEvents(); }, [year, month]);

    function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
    function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

    async function deleteEvent(id: string) {
        if (!confirm('Delete this event?')) return;
        try {
            await api.delete(`/api/calendar/${id}`);
            toast.success('Event deleted');
            setEvents(prev => prev.filter(e => e._id !== id));
        } catch { toast.error('Failed to delete'); }
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startOffset = getDay(monthStart); // 0 = Sunday

    function getEventsForDay(day: Date) {
        return events.filter(ev => {
            const start = parseISO(ev.startDate);
            const end = ev.endDate ? parseISO(ev.endDate) : start;
            return day >= start && day <= end;
        });
    }

    const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

    return (
        <div>
            {showAddModal && selectedDate && (
                <AddEventModal date={selectedDate} onClose={() => setShowAddModal(false)} onSuccess={loadEvents} />
            )}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Company Calendar</h1>
                    <p className="page-subtitle">Holidays, events, meetings, and deadlines</p>
                </div>
                {isAdmin && selectedDate && (
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        <Plus className="w-4 h-4" /> Add Event
                    </button>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5">
                {EVENT_TYPES.map(t => (
                    <div key={t.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Circle className="w-3 h-3" style={{ fill: t.color, color: t.color }} />
                        {t.label}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2 card p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-gray-900">{format(currentDate, 'MMMM yyyy')}</h2>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-medium">Today</button>
                            <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase py-1">{d}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-0.5">
                            {/* Offset */}
                            {Array.from({ length: startOffset }).map((_, i) => (
                                <div key={`off-${i}`} className="h-20 rounded-lg" />
                            ))}
                            {days.map(day => {
                                const dayEvents = getEventsForDay(day);
                                const selected = selectedDate && isSameDay(day, selectedDate);
                                const today = isToday(day);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={clsx(
                                            'h-20 rounded-lg p-1.5 cursor-pointer border transition-all',
                                            selected ? 'border-indigo-400 bg-indigo-50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                                        )}
                                    >
                                        <div className={clsx(
                                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1',
                                            today ? 'bg-indigo-600 text-white' : 'text-gray-700'
                                        )}>
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-0.5">
                                            {dayEvents.slice(0, 2).map(ev => (
                                                <div key={ev._id} className="w-full truncate text-[10px] font-medium px-1 py-0.5 rounded"
                                                    style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                                                    {ev.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-[9px] text-gray-400 font-medium pl-1">+{dayEvents.length - 2} more</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Selected Day Events */}
                <div className="card p-5">
                    <h3 className="text-base font-bold text-gray-900 mb-4">
                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a day'}
                    </h3>
                    {!selectedDate ? (
                        <div className="text-center py-12">
                            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Click any date to see events</p>
                        </div>
                    ) : selectedDayEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-sm">No events on this day</p>
                            {isAdmin && (
                                <button onClick={() => setShowAddModal(true)} className="btn-secondary text-xs mt-3">
                                    <Plus className="w-3.5 h-3.5" /> Add Event
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedDayEvents.map(ev => (
                                <div key={ev._id} className="p-3 rounded-xl border border-gray-100 hover:shadow-sm transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                                                <p className="text-xs text-gray-400 capitalize mt-0.5">{ev.type}</p>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <button onClick={() => deleteEvent(ev._id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                                            </button>
                                        )}
                                    </div>
                                    {ev.description && (
                                        <p className="text-xs text-gray-500 mt-2 pl-5">{ev.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
