'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Briefcase, MapPin, Clock, Users, FileText, Send, CheckCircle, ArrowLeft, Loader2, Globe, Mail, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function CandidateApplicationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [form, setForm] = useState({
        applicantName: '',
        applicantEmail: '',
        phone: '',
        resumeUrl: '',
        coverLetter: '',
        customFields: {} as Record<string, any>,
    });

    useEffect(() => {
        api.get(`/api/public/jobs/${id}`)
            .then(({ data }) => {
                setJob(data.job);
                // Initialize custom fields from job definition
                const initialFields: Record<string, any> = {};
                data.job.customFields?.forEach((f: any) => {
                    initialFields[f.name] = '';
                });
                setForm(prev => ({ ...prev, customFields: initialFields }));
            })
            .catch(() => toast.error('Job not found or closed'))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const setCustom = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({
            ...prev,
            customFields: { ...prev.customFields, [name]: e.target.value }
        }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/public/apply', { jobId: id, ...form });
            setSubmitted(true);
            toast.success('Application submitted successfully!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            toast.error(err?.response?.data?.error || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">Loading job details...</p>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-500 mb-6">This job posting may have been closed or removed.</p>
            <button onClick={() => window.close()} className="btn-primary">Return Home</button>
        </div>
    );

    if (submitted) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Application Received!</h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Thank you for applying to <strong>{job.title}</strong>. Our recruiting team will review your application and get back to you soon.
            </p>
            <div className="flex gap-3">
                <button onClick={() => window.location.reload()} className="btn-secondary">New Application</button>
                <button onClick={() => window.close()} className="btn-primary">Finish</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pb-20">
            {/* Header / Banner */}
            <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10 backdrop-blur-md bg-white/80">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight">Instaura Recruitment</span>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Job Info */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="animate-in slide-in-from-left-4 duration-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-3">
                            {job.roleCategory} • {job.type?.replace('_', ' ')}
                        </span>
                        <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{job.title}</h1>
                        <div className="flex flex-col gap-3 text-sm text-gray-500">
                            <div className="flex items-center gap-2 font-medium">
                                <MapPin className="w-4 h-4 text-gray-400" /> {job.location || 'Remote'}
                            </div>
                            <div className="flex items-center gap-2 font-medium">
                                <Globe className="w-4 h-4 text-gray-400" /> {job.department || 'Instaura Tech'}
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 bg-white border border-gray-100 shadow-sm animate-in slide-in-from-left-6 duration-700">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                            <Briefcase className="w-4 h-4 text-indigo-600" /> Role Overview
                        </h2>
                        <div className="prose prose-sm text-gray-600 max-w-none space-y-4">
                            <p className="whitespace-pre-wrap">{job.description}</p>
                            {job.requirements && (
                                <div className="pt-4">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Basic Requirements</h3>
                                    <p className="whitespace-pre-wrap">{job.requirements}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Application Form */}
                <div className="lg:col-span-7">
                    <div className="card p-8 bg-white border border-gray-100 shadow-xl shadow-indigo-500/5 animate-in slide-in-from-right-4 duration-500">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Your Application</h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            value={form.applicantName}
                                            onChange={set('applicantName')}
                                            className="input pl-10 focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Jane Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={form.applicantEmail}
                                            onChange={set('applicantEmail')}
                                            className="input pl-10 focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="jane@example.com"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            value={form.phone}
                                            onChange={set('phone')}
                                            className="input pl-10 focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="+91 XXXXX XXXXX"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Resume Link (G-Drive/Direct) *</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            value={form.resumeUrl}
                                            onChange={set('resumeUrl')}
                                            className="input pl-10 focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="https://drive.google.com/..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Fields */}
                            {job.customFields?.length > 0 && (
                                <div className="pt-4 border-t border-gray-50 flex flex-col gap-4">
                                    {job.customFields.map((field: any) => (
                                        <div key={field.name} className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                {field.label} {field.required && '*'}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    value={form.customFields[field.name]}
                                                    onChange={setCustom(field.name)}
                                                    className="input min-h-[100px] resize-none"
                                                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                    required={field.required}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : 'text'}
                                                    value={form.customFields[field.name]}
                                                    onChange={setCustom(field.name)}
                                                    className="input"
                                                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                    required={field.required}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cover Letter / Introduction</label>
                                <textarea
                                    value={form.coverLetter}
                                    onChange={set('coverLetter')}
                                    className="input min-h-[120px] resize-none"
                                    placeholder="Tell us why you're a great fit for this role..."
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary w-full h-12 text-base font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-shadow disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" /> Submit Application
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-gray-400 text-center mt-4">
                                    By submitting, you agree to our recruitment privacy policy.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
