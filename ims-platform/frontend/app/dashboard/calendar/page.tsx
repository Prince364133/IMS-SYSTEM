'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';
import {
    ChevronLeft, ChevronRight, Plus, X, Loader2, Calendar,
    Trash2, Circle, Video, MapPin, Link2, Users, Clock,
    Mail, RefreshCw, ExternalLink, CheckCircle, Phone
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isSameDay, parseISO } from 'date-fns';
import ConfirmModal from '../../../components/ConfirmModal';

const EVENT_TYPES = [
    { key: 'holiday', label: 'Holiday', color: '#ef4444' },
    { key: 'event', label: 'Event', color: '#4f46e5' },
    { key: 'meeting', label: 'Meeting', color: '#0ea5e9' },
    { key: 'deadline', label: 'Deadline', color: '#f59e0b' },
    { key: 'leave', label: 'Leave', color: '#10b981' },
    { key: 'other', label: 'Other', color: '#6b7280' },
];

const PLATFORMS = [
    { key: 'google_meet', label: 'Google Meet', icon: <Video className="w-3.5 h-3.5 text-emerald-500" />, placeholder: 'https://meet.google.com/...' },
    { key: 'zoom', label: 'Zoom', icon: <Video className="w-3.5 h-3.5 text-blue-500" />, placeholder: 'https://zoom.us/j/...' },
    { key: 'teams', label: 'Microsoft Teams', icon: <Video className="w-3.5 h-3.5 text-purple-500" />, placeholder: 'https://teams.microsoft.com/...' },
    { key: 'in_person', label: 'In Person', icon: <MapPin className="w-3.5 h-3.5 text-amber-500" />, placeholder: '' },
    { key: 'phone', label: 'Phone Call', icon: <Phone className="w-3.5 h-3.5 text-indigo-500" />, placeholder: '' },
    { key: 'other', label: 'Other', icon: <Calendar className="w-3.5 h-3.5 text-gray-500" />, placeholder: '' },
];

function getEventColor(type: string) {
    return EVENT_TYPES.find(e => e.key === type)?.color || '#6b7280';
}

function PlatformBadge({ platform }: { platform: string }) {
    const p = PLATFORMS.find(x => x.key === platform);
    return p ? <span className="text-xs">{p.icon} {p.label}</span> : null;
}

// ── Add Event Modal ──────────────────────────────────────────────────────────
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

    // Meeting-specific
    const [meeting, setMeeting] = useState({
        startTime: '10:00',
        endTime: '11:00',
        platform: 'google_meet',
        meetingLink: '',
        location: '',
        agenda: '',
        attendeeIds: [] as string[],
        externalAttendees: '',
        reminderMinutes: 15,
        notes: '',
    });

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const isMeeting = form.type === 'meeting';
    const selectedPlatform = PLATFORMS.find(p => p.key === meeting.platform);
    const needsLink = ['google_meet', 'zoom', 'teams', 'other'].includes(meeting.platform);
    const needsLocation = meeting.platform === 'in_person';

    useEffect(() => {
        api.get('/api/users', { params: { limit: 200 } })
            .then(r => setUsers(r.data.users || []))
            .catch(() => { });
    }, []);

    function changeType(type: string) {
        const col = getEventColor(type);
        setForm(p => ({ ...p, type, color: col }));
    }

    function toggleAttendee(id: string) {
        setMeeting(m => ({
            ...m,
            attendeeIds: m.attendeeIds.includes(id)
                ? m.attendeeIds.filter(x => x !== id)
                : [...m.attendeeIds, id]
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title) return toast.error('Title is required');

        setLoading(true);
        setSendingEmail(isMeeting);

        try {
            const payload: any = { ...form };

            if (isMeeting) {
                payload.meeting = {
                    startTime: meeting.startTime,
                    endTime: meeting.endTime,
                    platform: meeting.platform,
                    meetingLink: meeting.meetingLink || null,
                    location: meeting.location || null,
                    agenda: meeting.agenda || null,
                    attendees: meeting.attendeeIds,
                    externalAttendees: meeting.externalAttendees
                        .split(/[\n,;]+/)
                        .map(s => s.trim())
                        .filter(Boolean),
                    reminderMinutes: Number(meeting.reminderMinutes),
                    notes: meeting.notes || null,
                };
                payload.allDay = false;
            }

            await api.post('/api/calendar', payload);
            toast.success(isMeeting ? 'Meeting created! Invite emails sent to all attendees.' : 'Event created!');
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to create event');
        } finally {
            setLoading(false);
            setSendingEmail(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Add Event — {format(date, 'MMM d, yyyy')}</h2>
                        {isMeeting && (
                            <p className="text-xs text-sky-500 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Invite emails will be sent automatically
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Base Fields */}
                        <div>
                            <label className="label">Event Title *</label>
                            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input" placeholder={isMeeting ? 'e.g. Q1 Strategy Meeting' : 'e.g. Company All Hands'} required />
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
                            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input resize-none" rows={2} placeholder="Brief description..." />
                        </div>

                        {/* ── MEETING FIELDS ─────────────────────────────────── */}
                        {isMeeting && (
                            <div className="space-y-5 pt-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-sky-100" />
                                    <span className="text-xs font-bold text-sky-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Video className="w-3.5 h-3.5" /> Meeting Details
                                    </span>
                                    <div className="flex-1 h-px bg-sky-100" />
                                </div>

                                {/* Time */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Start Time *</label>
                                        <input type="time" required value={meeting.startTime} onChange={e => setMeeting(m => ({ ...m, startTime: e.target.value }))} className="input" />
                                    </div>
                                    <div>
                                        <label className="label flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> End Time</label>
                                        <input type="time" value={meeting.endTime} onChange={e => setMeeting(m => ({ ...m, endTime: e.target.value }))} className="input" />
                                    </div>
                                </div>

                                {/* Platform */}
                                <div>
                                    <label className="label flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Platform</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PLATFORMS.map(p => (
                                            <button
                                                key={p.key}
                                                type="button"
                                                onClick={() => setMeeting(m => ({ ...m, platform: p.key, meetingLink: '' }))}
                                                className={clsx(
                                                    'px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5',
                                                    meeting.platform === p.key
                                                        ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-sm'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                )}
                                            >
                                                <span>{p.icon}</span> {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Meeting link (for online platforms) */}
                                {needsLink && (
                                    <div>
                                        <label className="label flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Meeting Link</label>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                value={meeting.meetingLink}
                                                onChange={e => setMeeting(m => ({ ...m, meetingLink: e.target.value }))}
                                                className="input pl-4 pr-10"
                                                placeholder={selectedPlatform?.placeholder || 'https://...'}
                                            />
                                            {meeting.meetingLink && (
                                                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-500">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Location (for in-person) */}
                                {needsLocation && (
                                    <div>
                                        <label className="label flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location *</label>
                                        <input
                                            required={needsLocation}
                                            type="text"
                                            value={meeting.location}
                                            onChange={e => setMeeting(m => ({ ...m, location: e.target.value }))}
                                            className="input"
                                            placeholder="e.g. Conference Room A, Floor 3"
                                        />
                                    </div>
                                )}

                                {/* Agenda */}
                                <div>
                                    <label className="label">Agenda <span className="text-gray-400 font-normal">(optional)</span></label>
                                    <textarea
                                        value={meeting.agenda}
                                        onChange={e => setMeeting(m => ({ ...m, agenda: e.target.value }))}
                                        className="input resize-none font-mono text-sm"
                                        rows={3}
                                        placeholder={"1. Project status update\n2. Q&A\n3. Next steps"}
                                    />
                                </div>

                                {/* Internal Attendees */}
                                <div>
                                    <label className="label flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Team Members to Invite</label>
                                    <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-50">
                                        {users.length === 0 ? (
                                            <p className="text-xs text-gray-400 p-3">Loading users...</p>
                                        ) : users.map(u => {
                                            const checked = meeting.attendeeIds.includes(u._id);
                                            return (
                                                <button
                                                    key={u._id}
                                                    type="button"
                                                    onClick={() => toggleAttendee(u._id)}
                                                    className={clsx(
                                                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',
                                                        checked ? 'bg-sky-50' : 'hover:bg-gray-50'
                                                    )}
                                                >
                                                    <div className={clsx('w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-all', checked ? 'bg-sky-500 border-sky-500' : 'border-gray-300')}>
                                                        {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                                                        {u.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-800 truncate">{u.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{u.email} · {u.role}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {meeting.attendeeIds.length > 0 && (
                                        <p className="text-xs text-sky-600 mt-1.5">{meeting.attendeeIds.length} team member{meeting.attendeeIds.length > 1 ? 's' : ''} selected</p>
                                    )}
                                </div>

                                {/* External Attendees */}
                                <div>
                                    <label className="label flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> External Attendees <span className="text-gray-400 font-normal">(email addresses)</span></label>
                                    <textarea
                                        value={meeting.externalAttendees}
                                        onChange={e => setMeeting(m => ({ ...m, externalAttendees: e.target.value }))}
                                        className="input resize-none"
                                        rows={2}
                                        placeholder={"client@example.com, partner@agency.com"}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Separate multiple emails with commas or new lines</p>
                                </div>

                                {/* Notes & Reminder */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="label flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Reminder (minutes before)</label>
                                        <select value={meeting.reminderMinutes} onChange={e => setMeeting(m => ({ ...m, reminderMinutes: Number(e.target.value) }))} className="select">
                                            {[5, 10, 15, 30, 60, 120].map(v => <option key={v} value={v}>{v} min before</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Notes</label>
                                        <input type="text" value={meeting.notes} onChange={e => setMeeting(m => ({ ...m, notes: e.target.value }))} className="input" placeholder="Additional notes..." />
                                    </div>
                                </div>

                                {/* Email notice */}
                                <div className="flex items-start gap-2.5 p-3 bg-sky-50 rounded-xl border border-sky-100">
                                    <Mail className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-sky-700">
                                        <strong>Auto-email enabled:</strong> A full meeting invite (with date, time, platform, link & agenda) will be sent to all {meeting.attendeeIds.length + meeting.externalAttendees.split(/[\n,;]+/).filter(Boolean).length} attendee{(meeting.attendeeIds.length + meeting.externalAttendees.split(/[\n,;]+/).filter(Boolean).length) !== 1 ? 's' : ''} upon creation.
                                    </p>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button
                        type="submit"
                        form="event-form"
                        disabled={loading}
                        className="btn-primary min-w-[140px]"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {sendingEmail ? 'Sending Invites...' : 'Creating...'}</>
                        ) : isMeeting ? (
                            <><Video className="w-4 h-4" /> Create Meeting</>
                        ) : (
                            <><Plus className="w-4 h-4" /> Create Event</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Calendar Page ────────────────────────────────────────────────────────────
export default function CalendarPage() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Default to today so events display immediately
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [resendingId, setResendingId] = useState<string | null>(null);
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

    async function handleDeleteEvent() {
        if (!showDeleteConfirm) return;
        setDeleting(true);
        try {
            await api.delete(`/api/calendar/${showDeleteConfirm}`);
            toast.success('Event deleted');
            setEvents(prev => prev.filter(e => e._id !== showDeleteConfirm));
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(null);
        }
    }

    async function resendInvite(id: string) {
        setResendingId(id);
        try {
            await api.post(`/api/calendar/${id}/resend-invite`);
            toast.success('Meeting invites resent!');
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to resend');
        } finally { setResendingId(null); }
    }

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startOffset = getDay(monthStart);

    // Compare only date part (YYYY-MM-DD) to avoid UTC vs local timezone issues
    function toDateStr(d: Date) {
        return d.toISOString().slice(0, 10);
    }
    function toEventDateStr(dateStr: string) {
        // Handle both ISO strings and date-only strings
        return dateStr.slice(0, 10);
    }
    function getEventsForDay(day: Date) {
        const dayStr = toDateStr(day);
        return events.filter(ev => {
            const startStr = toEventDateStr(ev.startDate);
            const endStr = ev.endDate ? toEventDateStr(ev.endDate) : startStr;
            return dayStr >= startStr && dayStr <= endStr;
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
                {isAdmin && (
                    <button onClick={() => { if (!selectedDate) setSelectedDate(new Date()); setShowAddModal(true); }} className="btn-primary">
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
                                                <div key={ev._id} className="w-full truncate text-[10px] font-medium px-1 py-0.5 rounded flex items-center gap-0.5"
                                                    style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                                                    {ev.type === 'meeting' && <Video className="w-2.5 h-2.5 flex-shrink-0" />}
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
                <div className="card p-5 overflow-y-auto max-h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900">
                            {format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                        {isAdmin && (
                            <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs px-3 py-1.5">
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        )}
                    </div>
                    {selectedDayEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
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
                                <div key={ev._id} className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: ev.color }} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                                                <p className="text-xs text-gray-400 capitalize mt-0.5">{ev.type}</p>

                                                {/* Meeting-specific display */}
                                                {ev.type === 'meeting' && ev.meeting && (
                                                    <div className="mt-2 space-y-1.5">
                                                        {(ev.meeting.startTime || ev.meeting.endTime) && (
                                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                <Clock className="w-3 h-3 text-sky-400" />
                                                                {ev.meeting.startTime}{ev.meeting.endTime ? ` – ${ev.meeting.endTime}` : ''}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-600 flex items-center gap-1">
                                                            <PlatformBadge platform={ev.meeting.platform} />
                                                        </p>
                                                        {ev.meeting.meetingLink && (
                                                            <a href={ev.meeting.meetingLink} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                                                                <Link2 className="w-3 h-3" /> Join Meeting
                                                            </a>
                                                        )}
                                                        {ev.meeting.location && (
                                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-gray-400" /> {ev.meeting.location}
                                                            </p>
                                                        )}
                                                        {ev.meeting.attendees?.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-3 h-3 text-gray-400" />
                                                                <div className="flex -space-x-1">
                                                                    {ev.meeting.attendees.slice(0, 5).map((a: any) => (
                                                                        <div key={a._id} title={a.name} className="w-5 h-5 rounded-full bg-indigo-200 border border-white flex items-center justify-center text-[9px] font-bold text-indigo-700">
                                                                            {a.name?.[0]?.toUpperCase()}
                                                                        </div>
                                                                    ))}
                                                                    {ev.meeting.attendees.length > 5 && (
                                                                        <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[9px] text-gray-600">
                                                                            +{ev.meeting.attendees.length - 5}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-400">{ev.meeting.attendees.length} attendee{ev.meeting.attendees.length !== 1 ? 's' : ''}</span>
                                                            </div>
                                                        )}
                                                        {ev.meeting.agenda && (
                                                            <details className="text-xs">
                                                                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View Agenda</summary>
                                                                <pre className="mt-1 text-gray-600 font-sans whitespace-pre-wrap bg-gray-50 rounded p-2 text-[11px]">{ev.meeting.agenda}</pre>
                                                            </details>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                {ev.type === 'meeting' && (
                                                    <button
                                                        onClick={() => resendInvite(ev._id)}
                                                        disabled={resendingId === ev._id}
                                                        title="Resend invite emails"
                                                        className="p-1.5 hover:bg-sky-50 rounded text-sky-400 hover:text-sky-600"
                                                    >
                                                        {resendingId === ev._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                                <button onClick={() => setShowDeleteConfirm(ev._id)} className="p-1.5 hover:bg-red-50 rounded text-red-300 hover:text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
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
