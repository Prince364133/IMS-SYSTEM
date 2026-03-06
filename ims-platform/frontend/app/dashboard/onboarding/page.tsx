'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { useSettings } from '../../../lib/settings-context';
import { useAuth } from '../../../lib/auth-context';
import { Loader2, CheckCircle, UploadCloud, UserCircle, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

function WizardStep({ step, currentStep, icon: Icon, title, desc }: any) {
    const isCompleted = currentStep > step;
    const isActive = currentStep === step;
    return (
        <div className="flex flex-col items-center flex-1 relative">
            <div className={clsx(
                "w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 z-10 bg-white transition-colors",
                isCompleted ? "border-green-500 bg-green-50 text-green-600" :
                    isActive ? "border-indigo-600 text-indigo-600 shadow-md" : "border-gray-200 text-gray-400"
            )}>
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
            </div>
            <p className={clsx("font-bold text-sm", isActive ? "text-indigo-900" : "text-gray-500")}>{title}</p>
            <p className="text-xs text-gray-400 mt-1 hidden sm:block">{desc}</p>
        </div>
    );
}

export default function OnboardingPage() {
    const { user } = useAuth();
    const { company } = useSettings();
    const companyName = company?.companyName || 'Internal Management System';
    const [loading, setLoading] = useState(true);
    const [ob, setOb] = useState<any>(null); // Current employee's onboarding
    const [allObs, setAllObs] = useState<any[]>([]); // For HR/Admin view
    const [saving, setSaving] = useState(false);

    // Forms
    const [personal, setPersonal] = useState({ phone: '', address: '', dateOfBirth: '', emergencyContact: '', emergencyPhone: '', bloodGroup: '' });
    const [docs, setDocs] = useState({ idProofUrl: '', offerLetterUrl: '', educationCertUrl: '' });

    useEffect(() => {
        api.get('/api/onboarding')
            .then(({ data }) => {
                if (data.onboardings) setAllObs(data.onboardings); // Admin/HR view
                if (data.onboarding) {
                    setOb(data.onboarding);
                    if (data.onboarding.personalInfo) setPersonal(prev => ({ ...prev, ...data.onboarding.personalInfo }));
                    if (data.onboarding.documents) setDocs(prev => ({ ...prev, ...data.onboarding.documents }));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    async function savePersonalInfo(e: React.FormEvent) {
        e.preventDefault();
        if (!ob) return;
        setSaving(true);
        try {
            const { data } = await api.put(`/api/onboarding/${ob._id}/personal`, personal);
            setOb(data.onboarding);
            toast.success('Saved Personal Info');
        } catch (err) { toast.error('Failed to save'); }
        finally { setSaving(false); }
    }

    async function saveDocuments(e: React.FormEvent) {
        e.preventDefault();
        if (!ob) return;
        setSaving(true);
        try {
            const { data } = await api.put(`/api/onboarding/${ob._id}/documents`, docs);
            setOb(data.onboarding);
            toast.success('Saved Documents');
        } catch (err) { toast.error('Failed to save'); }
        finally { setSaving(false); }
    }

    async function completeOnboarding() {
        if (!ob) return;
        setSaving(true);
        try {
            const { data } = await api.put(`/api/onboarding/${ob._id}/complete`);
            setOb(data.onboarding);
            toast.success('Onboarding Completed!');
        } catch (err) { toast.error('Failed to complete'); }
        finally { setSaving(false); }
    }

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    }

    // HR / Admin View
    if (['admin', 'hr'].includes(user?.role || '') && allObs.length > 0 && !ob) {
        return (
            <div>
                <div className="page-header">
                    <h1 className="page-title">Onboarding Management</h1>
                    <p className="page-subtitle">Track new hire onboarding progress</p>
                </div>
                <div className="card">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Current Step</th>
                                    <th>Completed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allObs.map(o => (
                                    <tr key={o._id}>
                                        <td>
                                            <p className="font-semibold text-gray-900">{o.employeeId?.name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{o.employeeId?.email}</p>
                                        </td>
                                        <td className="text-sm text-gray-600">{o.employeeId?.department || '—'}</td>
                                        <td>
                                            <span className={clsx('badge capitalize text-xs',
                                                o.status === 'complete' ? 'badge-green' : 'badge-orange'
                                            )}>{o.status?.replace('_', ' ')}</span>
                                        </td>
                                        <td className="font-medium text-gray-700">Step {o.step} of 3</td>
                                        <td className="text-sm text-gray-500">{o.completedAt ? format(new Date(o.completedAt), 'MMM d, yyyy') : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    // Employee Wizard View
    if (!ob) {
        return (
            <div className="text-center py-20 max-w-lg mx-auto">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-500">No active onboarding tasks require your attention. Welcome to the team!</p>
            </div>
        );
    }

    const currentStep = ob.status === 'complete' ? 4 : ob.step;

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome to {companyName}, {user?.name?.split(' ')[0]}! 🎉</h1>
                <p className="text-lg text-gray-500">Let's get your profile set up in just a few steps.</p>
            </div>

            {/* Stepper */}
            <div className="flex justify-between relative mb-12 max-w-2xl mx-auto">
                <div className="absolute top-6 left-12 right-12 h-1 bg-gray-100 -z-10">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(Math.min(currentStep, 3) - 1) * 50}%` }} />
                </div>
                <WizardStep step={1} currentStep={currentStep} icon={UserCircle} title="Personal Info" desc="Emergency contacts & details" />
                <WizardStep step={2} currentStep={currentStep} icon={UploadCloud} title="Documents" desc="ID and certificates" />
                <WizardStep step={3} currentStep={currentStep} icon={CheckCircle} title="Complete" desc="Final review & welcome" />
            </div>

            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
                <div className="card max-w-2xl mx-auto p-8 border-t-4 border-t-indigo-500 shadow-xl">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Step 1: Personal Information</h2>
                    <form onSubmit={savePersonalInfo} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Phone Number *</label><input required value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} className="input" /></div>
                            <div><label className="label">Date of Birth</label><input type="date" value={personal.dateOfBirth} onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} className="input" /></div>
                        </div>
                        <div><label className="label">Full Address *</label><textarea required value={personal.address} onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} className="input" rows={2} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Emergency Contact Name *</label><input required value={personal.emergencyContact} onChange={e => setPersonal(p => ({ ...p, emergencyContact: e.target.value }))} className="input" /></div>
                            <div><label className="label">Emergency Contact Phone *</label><input required value={personal.emergencyPhone} onChange={e => setPersonal(p => ({ ...p, emergencyPhone: e.target.value }))} className="input" /></div>
                        </div>
                        <div><label className="label">Blood Group</label><input value={personal.bloodGroup} onChange={e => setPersonal(p => ({ ...p, bloodGroup: e.target.value }))} className="input" placeholder="e.g. O+" /></div>
                        <div className="flex justify-end pt-4"><button disabled={saving} className="btn-primary shadow-md">Continue to Documents <ChevronRight className="w-4 h-4 ml-1" /></button></div>
                    </form>
                </div>
            )}

            {/* Step 2: Documents */}
            {currentStep === 2 && (
                <div className="card max-w-2xl mx-auto p-8 border-t-4 border-t-indigo-500 shadow-xl">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Step 2: Important Documents</h2>
                    <p className="text-sm text-gray-500 mb-6">Please provide links (e.g. Google Drive/Dropbox) to the following documents for our HR records.</p>
                    <form onSubmit={saveDocuments} className="space-y-5">
                        <div><label className="label">Government ID Proof URL *</label><input required value={docs.idProofUrl} onChange={e => setDocs(p => ({ ...p, idProofUrl: e.target.value }))} className="input" placeholder="https://..." /></div>
                        <div><label className="label">Signed Offer Letter URL</label><input value={docs.offerLetterUrl} onChange={e => setDocs(p => ({ ...p, offerLetterUrl: e.target.value }))} className="input" placeholder="https://..." /></div>
                        <div><label className="label">Highest Education Certificate URL</label><input value={docs.educationCertUrl} onChange={e => setDocs(p => ({ ...p, educationCertUrl: e.target.value }))} className="input" placeholder="https://..." /></div>
                        <div className="flex justify-between pt-4">
                            <button type="button" onClick={() => setOb((p: any) => ({ ...p, step: 1 }))} className="btn-secondary">Back</button>
                            <button type="submit" disabled={saving} className="btn-primary shadow-md">Complete Step 2 <ChevronRight className="w-4 h-4 ml-1" /></button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Complete */}
            {currentStep === 3 && (
                <div className="card max-w-2xl mx-auto p-8 text-center shadow-xl border-t-4 border-t-green-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">You're almost done!</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Thank you for submitting your details. HR will review your documents shortly. By clicking complete below, you acknowledge receipt of the Employee Handbook and Welcome Kit.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setOb((p: any) => ({ ...p, step: 2 }))} className="btn-secondary">Go Back</button>
                        <button onClick={completeOnboarding} className="btn-primary bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200">
                            Acknowledge & Finish
                        </button>
                    </div>
                </div>
            )}

            {/* Completed View */}
            {currentStep === 4 && (
                <div className="text-center py-20 max-w-lg mx-auto">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Completed!</h2>
                    <p className="text-gray-500">Your profile is 100% set up. You can now use all features of the {companyName} IMS portal.</p>
                </div>
            )}
        </div>
    );
}
