'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { DollarSign, Loader2, CheckCircle, Clock, AlertCircle, Plus, Printer, FileText, XCircle, X } from 'lucide-react';
import clsx from 'clsx';
import GeneratePayrollModal from '../../../components/GeneratePayrollModal';
import toast from 'react-hot-toast';
import { useAuth } from '../../../lib/auth-context';

const STATUS_CONFIG: Record<string, { cls: string; icon: any }> = {
    pending: { cls: 'badge-orange', icon: Clock },
    approved: { cls: 'badge-blue', icon: CheckCircle },
    paid: { cls: 'badge-green', icon: CheckCircle },
    rejected: { cls: 'badge-red', icon: AlertCircle },
};
const LEAVE_TYPE_COLORS: Record<string, string> = {
    sick: 'badge-red', casual: 'badge-blue', annual: 'badge-green',
    maternity: 'badge-purple', paternity: 'badge-purple', unpaid: 'badge-gray', other: 'badge-gray',
};

function thisMonthStr() { return new Date().toISOString().slice(0, 7); }

import { format } from 'date-fns';
import { useSettings } from '../../../lib/settings-context';

function numberToWords(num) {
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const regex = /^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/;
    const n = ('000000000' + num).substr(-9).match(regex);
    if (!n) return '';
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim();
}

function PayslipModal({ salary, onClose }: { salary: any; onClose: () => void }) {
    const { company } = useSettings();
    const brandColor = company?.brandColor || '#cf1d29';

    const handlePrint = () => {
        const printContent = document.getElementById('payslip-content');
        if (!printContent) return;

        const originalContent = document.body.innerHTML;
        const printStyles = `
            <style>
                @media print {
                    body { margin: 0; padding: 20px; font-family: sans-serif; background: #fff !important; }
                    .no-print { display: none !important; }
                    .print-shadow { box-shadow: none !important; border: 1px solid #ccc !important; }
                    #payslip-content { width: 100% !important; max-width: none !important; }
                }
            </style>
        `;

        document.body.innerHTML = printStyles + printContent.outerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
    };

    const handleDownloadPDF = async () => {
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const printContent = document.getElementById('payslip-content');
            if (!printContent) return;

            // Prepare for PDF
            const origBorder = printContent.style.border;
            const origShadow = printContent.style.boxShadow;
            printContent.style.border = 'none';
            printContent.style.boxShadow = 'none';

            const canvas = await html2canvas(printContent, { scale: 2, useCORS: true });

            // Restore
            printContent.style.border = origBorder;
            printContent.style.boxShadow = origShadow;

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Payslip_${salary.employeeId?.name || 'Employee'}_${salary.month}.pdf`);
            toast.success('PDF generated successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate PDF');
        }
    };

    const handleDownloadDOCX = async () => {
        try {
            const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } = await import('docx');
            const { saveAs } = await import('file-saver');

            const empName = salary.employeeId?.name || 'Employee';
            const monthStr = format(new Date(salary.month), 'MMMM yyyy');
            const companyName = company?.companyName || 'Internal Management System';

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: companyName,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            text: `Payslip for ${monthStr}`,
                            heading: HeadingLevel.HEADING_2,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 }
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "Employee Details", bold: true, size: 24 })],
                            spacing: { after: 200 }
                        }),
                        new Paragraph({ text: `Name: ${empName}` }),
                        new Paragraph({ text: `ID/Department: ${salary.employeeId?.employeeId || 'N/A'} | ${salary.employeeId?.department || 'N/A'}` }),
                        new Paragraph({ text: `Designation: ${salary.employeeId?.position || 'N/A'}` }),
                        new Paragraph({ text: `Status: ${salary.status?.toUpperCase()}`, spacing: { after: 400 } }),

                        new Paragraph({
                            children: [new TextRun({ text: "Salary Details", bold: true, size: 24 })],
                            spacing: { after: 200 }
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true })] })], margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount (₹)", bold: true })] })], margins: { top: 100, bottom: 100, left: 100 } }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Base Salary")], margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(salary.baseSalary?.toString() || '0')], margins: { top: 100, bottom: 100, left: 100 } }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Allowances & Bonuses")], margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(((salary.allowances || 0) + (salary.bonuses || 0)).toString())], margins: { top: 100, bottom: 100, left: 100 } }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph("Deductions")], margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph(`-${salary.deductions || 0}`)], margins: { top: 100, bottom: 100, left: 100 } }),
                                    ],
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Net Payable", bold: true })] })], margins: { top: 100, bottom: 100, left: 100 } }),
                                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: salary.netSalary?.toString() || '0', bold: true })] })], margins: { top: 100, bottom: 100, left: 100 } }),
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({ text: `Net Payable (in words): ${numberToWords(salary.netSalary || 0)} Rupees Only.`, spacing: { before: 200, after: 400 } }),
                        new Paragraph({ text: company?.authorizedSignatory ? `Authorized Signatory: ${company.authorizedSignatory}` : "Authorized Signatory", alignment: AlignmentType.RIGHT })
                    ],
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `Payslip_${empName}_${salary.month}.docx`);
            toast.success('DOCX generated successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to generate DOCX');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 print:p-0 no-print-scroll overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 print:my-0 print-shadow relative">

                {/* Header Actions */}
                <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl no-print sticky top-0 z-10">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Payslip — {format(new Date(salary.month), 'MMMM yyyy')}</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <button className="btn-secondary text-xs flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Download</button>
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden">
                                <button onClick={handleDownloadPDF} className="text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">As PDF</button>
                                <button onClick={handleDownloadDOCX} className="text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 border-t border-gray-50">As DOCX</button>
                            </div>
                        </div>
                        <button onClick={handlePrint} className="btn-secondary text-xs flex items-center gap-1.5"><Printer className="w-3.5 h-3.5" />Print</button>
                        <div className="w-px h-6 bg-gray-300 mx-2" />
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
                    </div>
                </div>

                {/* Printable Payslip Body */}
                <div id="payslip-content" className="p-10 bg-white relative">
                    {/* Watermark Logo (Optional) */}
                    {company?.companyLogo && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                            <img src={company.companyLogo} alt="watermark" className="w-96 h-auto grayscale" />
                        </div>
                    )}

                    {/* Company Header */}
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            {company?.companyLogo ? (
                                <img src={company.companyLogo} alt={company.companyName} className="h-14 w-auto mb-3" />
                            ) : (
                                <h1 className="text-3xl font-black tracking-tighter mb-1" style={{ color: brandColor }}>{company?.companyName || 'Internal IMS'}</h1>
                            )}
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{company?.tagline || 'Precision in Management'}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500 space-y-1">
                            <p className="font-extrabold text-gray-800 text-sm">{company?.companyName || 'Company'}</p>
                            <p>{company?.address || '123 Business Avenue'}</p>
                            <p>{company?.city || 'New Delhi'}, {company?.state || 'DL'} {company?.postalCode || '110001'}</p>
                            <p>{company?.companyEmail || 'support@company.com'} | {company?.phoneNumber || '+91 00000 00000'}</p>
                            {company?.gstNumber && <p className="font-bold text-gray-600 mt-2">GSTIN: {company.gstNumber}</p>}
                        </div>
                    </div>

                    {/* Payslip Title & Period */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Payslip</h2>
                            <p className="text-sm text-gray-500 mt-1">For the month of <span className="font-bold text-gray-800">{format(new Date(salary.month), 'MMMM yyyy')}</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Status</p>
                            <div className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                                salary.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                            )}>
                                {salary.status === 'paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                {salary.status?.toUpperCase()}
                            </div>
                            {salary.paidAt && <p className="text-[10px] text-gray-400 mt-1.5">Paid: {format(new Date(salary.paidAt), 'dd MMM yyyy')}</p>}
                        </div>
                    </div>

                    {/* Employee Info Grid */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm relative z-10">
                        <div className="flex border-b border-gray-100 pb-2">
                            <span className="w-32 text-gray-500 font-medium">Employee Name:</span>
                            <span className="font-bold text-gray-900">{salary.employeeId?.name}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-2">
                            <span className="w-32 text-gray-500 font-medium">Employee ID:</span>
                            <span className="font-bold text-gray-900">{salary.employeeId?.employeeId || '—'}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-2">
                            <span className="w-32 text-gray-500 font-medium">Department:</span>
                            <span className="font-bold text-gray-900">{salary.employeeId?.department || '—'}</span>
                        </div>
                        <div className="flex border-b border-gray-100 pb-2">
                            <span className="w-32 text-gray-500 font-medium">Designation:</span>
                            <span className="font-bold text-gray-900">{salary.employeeId?.position || '—'}</span>
                        </div>
                    </div>

                    {/* Split Table: Earnings & Deductions */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8 relative z-10">
                        {/* Earnings */}
                        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Earnings</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100">
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">Basic Salary</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">₹{salary.baseSalary?.toLocaleString('en-IN') || 0}</td>
                                    </tr>
                                    {salary.allowances > 0 && (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-700">Allowances</td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600">₹{salary.allowances.toLocaleString('en-IN')}</td>
                                        </tr>
                                    )}
                                    {salary.bonuses > 0 && (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-700">Bonuses</td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600">₹{salary.bonuses.toLocaleString('en-IN')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Deductions */}
                        <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Deductions</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100">
                                    {salary.deductions > 0 ? (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-700">Tax & Deductions</td>
                                            <td className="px-4 py-3 text-right font-medium text-red-600">₹{salary.deductions.toLocaleString('en-IN')}</td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-400 italic">No deductions</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900">₹0</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals & Net Payable */}
                    <div className="bg-gray-900 rounded-lg p-6 text-white mb-6 flex justify-between items-center relative z-10 shadow-lg">
                        <div className="space-y-1">
                            <p className="text-gray-400 text-sm">Gross Earnings: <span className="font-medium text-white">₹{((salary.baseSalary || 0) + (salary.allowances || 0) + (salary.bonuses || 0)).toLocaleString('en-IN')}</span></p>
                            <p className="text-gray-400 text-sm">Total Deductions: <span className="font-medium text-white">₹{(salary.deductions || 0).toLocaleString('en-IN')}</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Net Payable</p>
                            <p className="text-4xl font-black tracking-tight" style={{ color: brandColor }}>₹{salary.netSalary?.toLocaleString('en-IN') || 0}</p>
                        </div>
                    </div>

                    {/* Amount in words */}
                    <div className="mb-12 relative z-10">
                        <p className="text-xs text-gray-500">
                            <span className="font-bold text-gray-700 uppercase tracking-widest">Amount in words:</span> {numberToWords(salary.netSalary || 0)} Rupees Only.
                        </p>
                        {salary.notes && (
                            <div className="mt-4 p-4 bg-yellow-50/50 border border-yellow-100 rounded-lg">
                                <p className="text-[10px] font-bold text-yellow-800 uppercase tracking-widest mb-1">Remarks</p>
                                <p className="text-xs text-yellow-900">{salary.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end pt-8 border-t border-gray-200 relative z-10">
                        <div className="text-center w-48">
                            <div className="h-12 border-b border-gray-300 mb-2" />
                            <p className="text-xs font-bold text-gray-800">Employee Signature</p>
                            <p className="text-[10px] text-gray-400 uppercase mt-0.5">Date: ____________</p>
                        </div>
                        <div className="text-center w-48">
                            {company?.signatureImage ? (
                                <img src={company.signatureImage} alt="Signature" className="h-16 mx-auto mix-multiply object-contain mb-1" />
                            ) : (
                                <div className="h-16 border-b border-gray-300 mb-1" />
                            )}
                            <p className="text-xs font-bold text-gray-800">{company?.authorizedSignatory || 'Authorized Signatory'}</p>
                            <p className="text-[10px] text-gray-400 uppercase mt-0.5">For {company?.companyName || 'Company'}</p>
                        </div>
                    </div>

                    {/* Footer Warning */}
                    <div className="mt-8 text-[9px] text-center text-gray-400 uppercase tracking-widest relative z-10">
                        This is a computer generated document and does not require a physical signature unless specified otherwise.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function HRPage() {
    const [salaries, setSalaries] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [leavesLoading, setLeavesLoading] = useState(true);
    const [month, setMonth] = useState(thisMonthStr());
    const [showGenerate, setShowGenerate] = useState(false);
    const [payslipSalary, setPayslipSalary] = useState<any>(null);
    const [tab, setTab] = useState<'payroll' | 'leaves'>('payroll');
    const { user } = useAuth();

    function loadSalaries() {
        setLoading(true);
        api.get('/api/salary', { params: { month } })
            .then(({ data }) => setSalaries(data.salaries))
            .finally(() => setLoading(false));
    }

    function loadLeaves() {
        setLeavesLoading(true);
        api.get('/api/leaves', { params: { status: 'pending' } })
            .then(({ data }) => setLeaves(data.leaves || []))
            .finally(() => setLeavesLoading(false));
    }

    useEffect(() => { loadSalaries(); }, [month]);
    useEffect(() => { loadLeaves(); }, []);

    async function handleApprove(id: string) {
        try {
            await api.put(`/api/salary/${id}/approve`);
            toast.success('Salary approved!');
            setSalaries(prev => prev.map(s => s._id === id ? { ...s, status: 'approved' } : s));
        } catch { toast.error('Failed to approve'); }
    }

    async function handleMarkPaid(id: string) {
        try {
            await api.put(`/api/salary/${id}/mark-paid`);
            toast.success('Marked as paid!');
            setSalaries(prev => prev.map(s => s._id === id ? { ...s, status: 'paid' } : s));
        } catch { toast.error('Failed to update'); }
    }

    async function handleReviewLeave(id: string, status: 'approved' | 'rejected') {
        try {
            await api.put(`/api/leaves/${id}/review`, { status });
            toast.success(`Leave ${status}`);
            setLeaves(prev => prev.filter(l => l._id !== id));
        } catch { toast.error('Failed to update leave'); }
    }

    const totalNet = salaries.reduce((sum, s) => sum + (s.netSalary || 0), 0);
    const pendingLeaves = leaves.length;

    return (
        <div>
            {showGenerate && (
                <GeneratePayrollModal
                    onClose={() => setShowGenerate(false)}
                    onSuccess={() => { setShowGenerate(false); loadSalaries(); }}
                />
            )}
            {payslipSalary && <PayslipModal salary={payslipSalary} onClose={() => setPayslipSalary(null)} />}

            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">HR & Salary</h1>
                    <p className="page-subtitle">Manage payroll and HR operations</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                    <button onClick={() => setShowGenerate(true)} className="btn-primary"><DollarSign className="w-4 h-4" />Generate Salary</button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-max">
                <button onClick={() => setTab('payroll')} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', tab === 'payroll' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    Payroll
                </button>
                <button onClick={() => setTab('leaves')} className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5', tab === 'leaves' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500')}>
                    Leave Management
                    {pendingLeaves > 0 && <span className="bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">{pendingLeaves}</span>}
                </button>
            </div>

            {tab === 'payroll' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="card p-5">
                            <p className="text-sm text-gray-500 mb-1">Total Payroll</p>
                            <p className="text-2xl font-bold text-gray-900">₹{totalNet.toLocaleString()}</p>
                        </div>
                        <div className="card p-5">
                            <p className="text-sm text-gray-500 mb-1">Paid</p>
                            <p className="text-2xl font-bold text-emerald-600">{salaries.filter(s => s.status === 'paid').length}</p>
                        </div>
                        <div className="card p-5">
                            <p className="text-sm text-gray-500 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-amber-500">{salaries.filter(s => s.status === 'pending').length}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-5">
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input w-48" />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                    ) : (
                        <div className="card">
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th>
                                            <th>Base Salary</th>
                                            <th>Deductions</th>
                                            <th>Bonuses</th>
                                            <th>Net Salary</th>
                                            <th>Status</th>
                                            {(user?.role === 'admin' || user?.role === 'hr') && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salaries.map((s) => {
                                            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                                            const Icon = cfg.icon;
                                            return (
                                                <tr key={s._id}>
                                                    <td>
                                                        <p className="font-medium text-gray-900">{s.employeeId?.name}</p>
                                                        <p className="text-xs text-gray-400">{s.employeeId?.department}</p>
                                                    </td>
                                                    <td className="text-gray-700">₹{s.baseSalary?.toLocaleString()}</td>
                                                    <td className="text-red-500">-₹{s.deductions?.toLocaleString() || 0}</td>
                                                    <td className="text-emerald-600">+₹{s.bonuses?.toLocaleString() || 0}</td>
                                                    <td className="font-bold text-gray-900">₹{s.netSalary?.toLocaleString()}</td>
                                                    <td><span className={clsx('badge gap-1', cfg.cls)}><Icon className="w-3 h-3" />{s.status}</span></td>
                                                    {(user?.role === 'admin' || user?.role === 'hr') && (
                                                        <td>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => setPayslipSalary(s)} className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                                                                    <FileText className="w-3.5 h-3.5" />Payslip
                                                                </button>
                                                                {s.status === 'pending' && (
                                                                    <button onClick={() => handleApprove(s._id)} className="text-xs text-blue-600 hover:underline font-medium">Approve</button>
                                                                )}
                                                                {s.status === 'approved' && (
                                                                    <button onClick={() => handleMarkPaid(s._id)} className="text-xs text-emerald-600 hover:underline font-medium">Mark Paid</button>
                                                                )}
                                                                {s.status === 'paid' && <span className="text-xs text-gray-400">Paid ✓</span>}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {salaries.length === 0 && (
                                            <tr><td colSpan={7} className="text-center py-10 text-gray-400">No salary records for {month}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {tab === 'leaves' && (
                leavesLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : (
                    <div className="card">
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Type</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Days</th>
                                        <th>Reason</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((l: any) => (
                                        <tr key={l._id}>
                                            <td>
                                                <p className="font-medium text-gray-900 text-sm">{l.employeeId?.name}</p>
                                                <p className="text-xs text-gray-400">{l.employeeId?.department}</p>
                                            </td>
                                            <td><span className={clsx('badge', LEAVE_TYPE_COLORS[l.type] || 'badge-gray')}>{l.type}</span></td>
                                            <td className="text-sm text-gray-600">{l.startDate}</td>
                                            <td className="text-sm text-gray-600">{l.endDate}</td>
                                            <td className="text-sm font-medium">{l.days}d</td>
                                            <td className="text-sm text-gray-500 max-w-[150px] truncate">{l.reason || '—'}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleReviewLeave(l._id, 'approved')} className="btn-secondary text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                                        <CheckCircle className="w-3.5 h-3.5" />Approve
                                                    </button>
                                                    <button onClick={() => handleReviewLeave(l._id, 'rejected')} className="btn-secondary text-xs text-red-500 border-red-200 hover:bg-red-50">
                                                        <XCircle className="w-3.5 h-3.5" />Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {leaves.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">No pending leave requests 🎉</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
