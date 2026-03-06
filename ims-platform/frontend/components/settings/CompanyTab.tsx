'use client';

import { useState, useEffect } from 'react';
import { Building2, Save, Loader2, Mail, Phone, MapPin, Landmark, PenTool, Hash, Globe, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useSettings } from '../../lib/settings-context';

export default function CompanyTab() {
    const { company, refreshSettings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        companyLogo: '',
        emailLogo: '',
        tagline: '',
        brandColor: '#6366f1',
        websiteUrl: '',
        companyEmail: '',
        supportEmail: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        gstNumber: '',
        registrationNumber: '',
        bankName: '',
        accountHolderName: '',
        bankAccountNumber: '',
        ifscCode: '',
        authorizedSignatory: '',
        designation: '',
        signatureImage: '',
        salaryReleaseDate: 1,
        workingDaysPerMonth: 22
    });

    useEffect(() => {
        if (company) {
            setFormData({
                companyName: company.companyName || '',
                companyLogo: company.companyLogo || '',
                emailLogo: company.emailLogo || '',
                tagline: company.tagline || '',
                brandColor: company.brandColor || '#6366f1',
                websiteUrl: company.websiteUrl || '',
                companyEmail: company.companyEmail || '',
                supportEmail: company.supportEmail || '',
                phoneNumber: company.phoneNumber || '',
                address: company.address || '',
                city: company.city || '',
                state: company.state || '',
                country: company.country || '',
                postalCode: company.postalCode || '',
                gstNumber: company.gstNumber || '',
                registrationNumber: company.registrationNumber || '',
                bankName: company.bankName || '',
                accountHolderName: company.accountHolderName || '',
                bankAccountNumber: company.bankAccountNumber || '',
                ifscCode: company.ifscCode || '',
                authorizedSignatory: company.authorizedSignatory || '',
                designation: company.designation || '',
                signatureImage: company.signatureImage || '',
                salaryReleaseDate: company.salaryReleaseDate || 1,
                workingDaysPerMonth: company.workingDaysPerMonth || 22
            });
        }
    }, [company]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/api/company-config', formData);
            await refreshSettings();
            toast.success('Company configuration updated successfully');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Failed to update company config');
        } finally {
            setLoading(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 mt-6 first:mt-0">
            <Icon className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{title}</h3>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="card max-w-4xl">
                <div className="card-header flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <div>
                            <h2 className="font-bold text-gray-900">Company Identity & White-Labeling</h2>
                            <p className="text-xs text-gray-500">Manage how your company appears across the system, emails, and documents.</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={loading} className="btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>

                <div className="card-body">
                    {/* Branding & Identity */}
                    <SectionHeader icon={ImageIcon} title="Branding & Visuals" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">Company Display Name</label>
                            <input name="companyName" value={formData.companyName} onChange={handleChange} className="input" placeholder="e.g. Acme Corp" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Tagline / Motto</label>
                            <input name="tagline" value={formData.tagline} onChange={handleChange} className="input" placeholder="Precision in Management" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Brand Color</label>
                            <div className="flex gap-2">
                                <input type="color" name="brandColor" value={formData.brandColor} onChange={handleChange} className="w-10 h-10 p-1 rounded-lg border border-gray-200 cursor-pointer bg-white" />
                                <input name="brandColor" value={formData.brandColor} onChange={handleChange} className="input flex-1 font-mono" placeholder="#6366f1" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Website URL</label>
                            <div className="relative group">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="input pl-10" placeholder="https://example.com" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Dashboard Logo URL</label>
                            <input name="companyLogo" value={formData.companyLogo} onChange={handleChange} className="input" placeholder="https://drive.google.com/file/d/..." />
                            {formData.companyLogo && <img src={formData.companyLogo} alt="Logo Preview" className="h-10 mt-2 object-contain rounded-md border border-gray-100 p-1 bg-white" />}
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Email Header Logo URL</label>
                            <input name="emailLogo" value={formData.emailLogo} onChange={handleChange} className="input" placeholder="Optimized for email (width: 200px)" />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <SectionHeader icon={Mail} title="Contact Information" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">Official Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input name="companyEmail" value={formData.companyEmail} onChange={handleChange} className="input pl-10" placeholder="contact@example.com" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Support Email</label>
                            <input name="supportEmail" value={formData.supportEmail} onChange={handleChange} className="input" placeholder="support@example.com" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="input pl-10" placeholder="+1 234 567 890" />
                            </div>
                        </div>
                    </div>

                    {/* Address Detail */}
                    <SectionHeader icon={MapPin} title="Registered Address" />
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="label">Street Address</label>
                            <textarea name="address" value={formData.address} onChange={handleChange} className="input min-h-[80px]" placeholder="123 Business St, Suite 400" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="label">City</label>
                                <input name="city" value={formData.city} onChange={handleChange} className="input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label">State / Province</label>
                                <input name="state" value={formData.state} onChange={handleChange} className="input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label">Country</label>
                                <input name="country" value={formData.country} onChange={handleChange} className="input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label">Zip / Postal Code</label>
                                <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    </div>

                    {/* Legal & Compliance */}
                    <SectionHeader icon={Hash} title="Legal & Compliance" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">GST / VAT Number</label>
                            <input name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="input" placeholder="22AAAAA0000A1Z5" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Registration Number</label>
                            <input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className="input" />
                        </div>
                    </div>

                    {/* Financial & Payouts */}
                    <SectionHeader icon={Landmark} title="Banking Details (For Invoices/Salaries)" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">Bank Name</label>
                            <input name="bankName" value={formData.bankName} onChange={handleChange} className="input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Account Holder Name</label>
                            <input name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Account Number</label>
                            <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">IFSC / Swift Code</label>
                            <input name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="input" />
                        </div>
                    </div>

                    {/* Payroll Settings */}
                    <SectionHeader icon={Landmark} title="Payroll Settings" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-1.5">
                            <label className="label">Salary Release Date (1-28)</label>
                            <input type="number" min="1" max="28" name="salaryReleaseDate" value={formData.salaryReleaseDate} onChange={handleChange} className="input" placeholder="1" />
                            <p className="text-[10px] text-gray-400">The day of the month when salaries are typically released.</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Working Days Per Month</label>
                            <input type="number" min="1" max="31" name="workingDaysPerMonth" value={formData.workingDaysPerMonth} onChange={handleChange} className="input" placeholder="22" />
                            <p className="text-[10px] text-gray-400">Used to calculate daily salary deductions for absences.</p>
                        </div>
                    </div>

                    {/* Document Verification */}
                    <SectionHeader icon={PenTool} title="HR & Document Signing" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="label">Authorized Signatory Name</label>
                            <input name="authorizedSignatory" value={formData.authorizedSignatory} onChange={handleChange} className="input" placeholder="John Doe" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">Designation</label>
                            <input name="designation" value={formData.designation} onChange={handleChange} className="input" placeholder="Operations Manager" />
                        </div>
                        <div className="col-span-full space-y-1.5">
                            <label className="label">Signature Image URL (Transparent PNG)</label>
                            <input name="signatureImage" value={formData.signatureImage} onChange={handleChange} className="input" placeholder="https://..." />
                            {formData.signatureImage && <img src={formData.signatureImage} alt="Signature Preview" className="h-16 mt-2 object-contain rounded bg-white border border-gray-100 p-1" />}
                            <p className="text-[10px] text-gray-400">Used for automated generation of salary slips and invoices.</p>
                        </div>
                    </div>
                </div>

                <div className="card-footer bg-gray-50 flex justify-end gap-3 p-4">
                    <button onClick={handleSave} disabled={loading} className="btn-primary w-full md:w-auto px-12">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Saving Changes...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
}
