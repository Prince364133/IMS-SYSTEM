// ─── Company Branding Interface ────────────────────────────────────────────────
export interface BrandConfig {
  companyName: string;
  logoUrl?: string;
  brandColor?: string; // hex e.g. '#4f46e5'
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// ─── Template Definition ───────────────────────────────────────────────────────
export interface DocumentTemplate {
  id: string;
  category: 'contract' | 'offer_letter' | 'policy' | 'report' | 'other';
  title: string;
  description: string;
  /** Returns fully branded, print-ready HTML */
  generate: (brand: BrandConfig) => string;
}

// ─── Shared branded page wrapper ──────────────────────────────────────────────
function brandedPage(
  title: string,
  body: string,
  brand: BrandConfig
): string {
  const color = brand.brandColor || '#4f46e5';
  const company = brand.companyName || 'Your Company';
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ${company}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13.5px;
      color: #1a202c;
      background: #ffffff;
      line-height: 1.7;
    }
    .page { max-width: 780px; margin: 0 auto; padding: 40px 48px 60px; }

    /* Header */
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 3px solid ${color};
      margin-bottom: 36px;
    }
    .brand-block { display: flex; align-items: center; gap: 14px; }
    .brand-logo { width: 52px; height: 52px; border-radius: 10px; object-fit: contain; }
    .brand-logo-placeholder {
      width: 52px; height: 52px; border-radius: 10px;
      background: ${color}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; letter-spacing: -1px;
    }
    .company-name { font-size: 18px; font-weight: 800; color: ${color}; }
    .company-meta { font-size: 10.5px; color: #718096; margin-top: 2px; }
    .doc-title-block { text-align: right; }
    .doc-title-block h1 { font-size: 20px; font-weight: 800; color: ${color}; }
    .doc-title-block p { font-size: 11px; color: #718096; margin-top: 3px; }

    /* Document body */
    .doc-body { margin-bottom: 40px; }
    h2 { font-size: 15px; font-weight: 700; color: ${color}; margin: 28px 0 10px; border-left: 4px solid ${color}; padding-left: 10px; }
    h3 { font-size: 13px; font-weight: 700; color: #2d3748; margin: 20px 0 8px; }
    p { margin-bottom: 12px; }
    ul, ol { margin: 10px 0 16px 22px; }
    li { margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 12.5px; }
    th { background: ${color}; color: #fff; padding: 9px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: .5px; }
    td { padding: 9px 14px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f7f9fc; }
    .field { color: #4f46e5; background: #eef2ff; padding: 1px 6px; border-radius: 4px; font-weight: 600; font-style: italic; }

    /* Signature block */
    .signatures { display: flex; gap: 60px; margin-top: 44px; flex-wrap: wrap; }
    .sig-block { flex: 1; min-width: 180px; }
    .sig-line { border-bottom: 1.5px solid #cbd5e0; margin-bottom: 6px; height: 36px; }
    .sig-label { font-size: 11px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }

    /* Footer */
    .doc-footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 48px;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #a0aec0;
      font-size: 10px;
    }
    .confidential-badge {
      background: ${color}15;
      color: ${color};
      border: 1px solid ${color}40;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Print */
    @media print {
      body { background: #fff; }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="doc-header">
      <div class="brand-block">
        ${brand.logoUrl
      ? `<img class="brand-logo" src="${brand.logoUrl}" alt="${company} logo" />`
      : `<div class="brand-logo-placeholder">${company.charAt(0).toUpperCase()}</div>`
    }
        <div>
          <div class="company-name">${company}</div>
          <div class="company-meta">${[brand.address, brand.phone, brand.email].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;') || 'Internal Document'}</div>
        </div>
      </div>
      <div class="doc-title-block">
        <h1>${title}</h1>
        <p>Date: ${now}</p>
        <p>Ref: <strong>${company.substring(0, 3).toUpperCase()}-DOC-${Date.now().toString().slice(-6)}</strong></p>
      </div>
    </div>

    <!-- Body -->
    <div class="doc-body">${body}</div>

    <!-- Footer -->
    <div class="doc-footer">
      <span>${company} &mdash; ${brand.website || 'www.company.com'}</span>
      <span class="confidential-badge">Confidential</span>
      <span>Generated by IMS &middot; ${now}</span>
    </div>
  </div>
</body>
</html>`;
}

// ─── 25 Templates ─────────────────────────────────────────────────────────────
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 't1', category: 'offer_letter', title: 'Standard Offer Letter',
    description: 'Professional offer letter for full-time employees with salary and start date.',
    generate: (b) => brandedPage('Employment Offer Letter', `
      <p>Dear <span class="field">[Candidate Full Name]</span>,</p>
      <p>On behalf of <strong>${b.companyName}</strong>, it is our great pleasure to extend to you this formal offer of employment. After a thorough evaluation of your credentials and qualifications, we are delighted to offer you the position of:</p>
      <h2>Position Details</h2>
      <table>
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Job Title</td><td><span class="field">[Job Title]</span></td></tr>
        <tr><td>Department</td><td><span class="field">[Department]</span></td></tr>
        <tr><td>Reporting To</td><td><span class="field">[Manager Name]</span></td></tr>
        <tr><td>Employment Type</td><td>Full-Time, Permanent</td></tr>
        <tr><td>Start Date</td><td><span class="field">[Commencement Date]</span></td></tr>
        <tr><td>Annual CTC</td><td><span class="field">[Annual Salary]</span></td></tr>
        <tr><td>Work Location</td><td><span class="field">[Office Location / Remote]</span></td></tr>
      </table>
      <h2>Conditions of Employment</h2>
      <ul>
        <li>This offer is subject to successful completion of reference checks and background verification.</li>
        <li>You will be required to sign and abide by the Employee Code of Conduct and Confidentiality Agreement.</li>
        <li>A probation period of <span class="field">[X months]</span> will apply from your date of joining.</li>
      </ul>
      <p>Please indicate your acceptance of this offer by signing and returning one copy of this letter by <span class="field">[Acceptance Deadline]</span>.</p>
      <p>We look forward to welcoming you to the ${b.companyName} team!</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Authorised Signatory — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Candidate Signature &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't2', category: 'offer_letter', title: 'Executive Offer Letter',
    description: 'Offer letter for senior leadership roles including bonus and equity.',
    generate: (b) => brandedPage('Executive Employment Agreement', `
      <p>Dear <span class="field">[Executive Full Name]</span>,</p>
      <p>The Board of Directors and Leadership Team of <strong>${b.companyName}</strong> are pleased to offer you the executive position detailed below.</p>
      <h2>Executive Compensation Package</h2>
      <table>
        <tr><th>Component</th><th>Value</th></tr>
        <tr><td>Title</td><td><span class="field">[Executive Title, e.g. CTO / VP Engineering]</span></td></tr>
        <tr><td>Base Salary</td><td><span class="field">[Base Salary Per Annum]</span></td></tr>
        <tr><td>Annual Performance Bonus</td><td>Up to <span class="field">[X%]</span> of base salary</td></tr>
        <tr><td>Equity / Stock Options</td><td><span class="field">[ESOPs / RSUs details]</span></td></tr>
        <tr><td>Benefits</td><td>Executive health insurance, travel allowance, company device</td></tr>
        <tr><td>Notice Period</td><td><span class="field">[X months]</span></td></tr>
        <tr><td>Start Date</td><td><span class="field">[Expected Start Date]</span></td></tr>
      </table>
      <h2>Responsibilities</h2>
      <p>In this role, you will be expected to <span class="field">[brief summary of key responsibilities]</span> and report directly to the <span class="field">[CEO / Board]</span>.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">CEO / Chairman — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Executive Acceptance &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't3', category: 'offer_letter', title: 'Internship Offer Letter',
    description: 'Structured offer for interns with stipend, duration, and mentorship details.',
    generate: (b) => brandedPage('Internship Program Offer', `
      <p>Dear <span class="field">[Intern Name]</span>,</p>
      <p>We are excited to offer you an internship opportunity with <strong>${b.companyName}</strong>. This is a structured program designed to give you hands-on exposure to industry practices.</p>
      <h2>Internship Details</h2>
      <table>
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Role</td><td><span class="field">[Internship Role]</span></td></tr>
        <tr><td>Department</td><td><span class="field">[Department]</span></td></tr>
        <tr><td>Duration</td><td><span class="field">[Start Date]</span> to <span class="field">[End Date]</span></td></tr>
        <tr><td>Monthly Stipend</td><td><span class="field">[Stipend Amount]</span></td></tr>
        <tr><td>Mode</td><td><span class="field">[On-site / Remote / Hybrid]</span></td></tr>
        <tr><td>Mentor</td><td><span class="field">[Mentor Name & Designation]</span></td></tr>
      </table>
      <h2>Learning Outcomes</h2>
      <ul>
        <li>Exposure to real-world <span class="field">[domain]</span> projects.</li>
        <li>Mentored guidance from senior professionals.</li>
        <li>Certificate of Internship upon successful completion.</li>
      </ul>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR Manager — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Intern Acceptance &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't4', category: 'offer_letter', title: 'Contract Renewal Letter',
    description: 'Renew an existing employment/service contract with updated terms.',
    generate: (b) => brandedPage('Contract Renewal Letter', `
      <p>Dear <span class="field">[Name]</span>,</p>
      <p>With great pleasure, <strong>${b.companyName}</strong> wishes to renew your existing engagement effective <span class="field">[Renewal Date]</span>.</p>
      <h2>Renewal Terms</h2>
      <table>
        <tr><th>Item</th><th>Detail</th></tr>
        <tr><td>Contract Period</td><td><span class="field">[Start]</span> to <span class="field">[End]</span></td></tr>
        <tr><td>Role / Scope</td><td><span class="field">[Role or Scope of Services]</span></td></tr>
        <tr><td>Revised Remuneration</td><td><span class="field">[Revised Package]</span></td></tr>
        <tr><td>Modified Terms</td><td><span class="field">[Any changes from previous contract]</span></td></tr>
      </table>
      <p>All other terms and conditions from the original agreement dated <span class="field">[Original Date]</span> remain unchanged and in full force.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Authorised Signatory</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Recipient Signature &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't5', category: 'contract', title: 'Non-Disclosure Agreement (NDA)',
    description: 'Mutual NDA protecting confidential information of both parties.',
    generate: (b) => brandedPage('Non-Disclosure Agreement (NDA)', `
      <p>This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of <span class="field">[Date]</span>, between <strong>${b.companyName}</strong> ("Company") and <span class="field">[Second Party Name]</span> ("Counterparty").</p>
      <h2>1. Purpose</h2>
      <p>The parties wish to explore a potential business relationship and may share proprietary information solely for evaluating such a relationship (the "Purpose").</p>
      <h2>2. Confidential Information</h2>
      <p>"Confidential Information" means any non-public information disclosed by either party including business strategies, technical data, source code, financial information, customer lists, or trade secrets, whether disclosed verbally, electronically, or in writing.</p>
      <h2>3. Obligations</h2>
      <ul>
        <li>Each party shall hold the other's Confidential Information in strict confidence.</li>
        <li>Neither party shall disclose Confidential Information to any third party without prior written consent.</li>
        <li>Information shall only be used for the Purpose described above.</li>
      </ul>
      <h2>4. Term</h2>
      <p>This Agreement shall remain in effect for <span class="field">[X years]</span> from the date of signing, unless earlier terminated by mutual written consent.</p>
      <h2>5. Governing Law</h2>
      <p>This Agreement shall be governed by the laws of <span class="field">[Jurisdiction]</span>.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Counterparty Signature &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't6', category: 'contract', title: 'Independent Contractor Agreement',
    description: 'Outlines payment terms, deliverables and IP ownership for contractors.',
    generate: (b) => brandedPage('Independent Contractor Agreement', `
      <p>This Agreement is made between <strong>${b.companyName}</strong> ("Client") and <span class="field">[Contractor Name / Company]</span> ("Contractor") effective <span class="field">[Date]</span>.</p>
      <h2>1. Services</h2>
      <p>The Contractor agrees to provide: <span class="field">[Detailed description of services / deliverables]</span>.</p>
      <h2>2. Compensation</h2>
      <table>
        <tr><th>Item</th><th>Detail</th></tr>
        <tr><td>Payment Rate</td><td><span class="field">[Rate per hour / fixed fee]</span></td></tr>
        <tr><td>Payment Schedule</td><td><span class="field">[Weekly / Bi-weekly / On milestone]</span></td></tr>
        <tr><td>Invoicing</td><td>Contractor must submit invoices to <span class="field">[billing email]</span></td></tr>
      </table>
      <h2>3. Independent Contractor Status</h2>
      <p>The Contractor is an independent entity and not an employee of ${b.companyName}. No taxes, benefits, or insurance will be withheld by the Client.</p>
      <h2>4. Intellectual Property</h2>
      <p>All work product created under this Agreement shall be the exclusive property of ${b.companyName} upon full payment.</p>
      <h2>5. Termination</h2>
      <p>Either party may terminate this Agreement with <span class="field">[X days]</span> written notice.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Contractor Signature &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't7', category: 'contract', title: 'Service Level Agreement (SLA)',
    description: 'Defines uptime guarantees, support response times, and penalties.',
    generate: (b) => brandedPage('Service Level Agreement (SLA)', `
      <p>This Service Level Agreement ("SLA") is effective as of <span class="field">[Date]</span>, between <strong>${b.companyName}</strong> ("Service Provider") and <span class="field">[Client Name]</span> ("Client").</p>
      <h2>1. Service Scope</h2>
      <p>The Provider will deliver the following services: <span class="field">[Service description]</span>.</p>
      <h2>2. Performance Standards</h2>
      <table>
        <tr><th>Metric</th><th>Target</th></tr>
        <tr><td>Service Uptime</td><td>99.9% monthly</td></tr>
        <tr><td>Initial Response (Critical)</td><td>Within 1 hour</td></tr>
        <tr><td>Initial Response (Standard)</td><td>Within 4 business hours</td></tr>
        <tr><td>Resolution Time (Critical)</td><td>Within 8 hours</td></tr>
        <tr><td>Scheduled Maintenance Window</td><td><span class="field">[Window e.g. Sunday 02:00–04:00 IST]</span></td></tr>
      </table>
      <h2>3. Penalties</h2>
      <p>For every 1% below the uptime guarantee in a calendar month, a credit of <span class="field">[Credit %]</span> of the monthly fee shall be applied to the Client's next invoice.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Service Provider</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Client Authorised Signatory</div></div>
      </div>`, b)
  },
  {
    id: 't8', category: 'contract', title: 'Software Development Agreement',
    description: 'Full-stack project agreement with milestones, IP, and warranty clauses.',
    generate: (b) => brandedPage('Software Development Agreement', `
      <p>This Agreement is entered into by <strong>${b.companyName}</strong> ("Client") and <span class="field">[Developer / Agency Name]</span> ("Developer") on <span class="field">[Date]</span>.</p>
      <h2>1. Project Scope</h2>
      <p>The Developer agrees to design, develop, test, and deliver the software as described in <em>Exhibit A – Technical Specification</em>.</p>
      <h2>2. Milestones & Payments</h2>
      <table>
        <tr><th>Milestone</th><th>Deliverable</th><th>Amount</th><th>Due Date</th></tr>
        <tr><td>1</td><td>Wireframes & Design</td><td><span class="field">[Amount]</span></td><td><span class="field">[Date]</span></td></tr>
        <tr><td>2</td><td>Alpha Build</td><td><span class="field">[Amount]</span></td><td><span class="field">[Date]</span></td></tr>
        <tr><td>3</td><td>Final Delivery</td><td><span class="field">[Amount]</span></td><td><span class="field">[Date]</span></td></tr>
      </table>
      <h2>3. Warranty</h2>
      <p>The Developer warrants the software will function as specified for <span class="field">[X days]</span> post-delivery.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">${b.companyName} (Client)</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Developer / Agency</div></div>
      </div>`, b)
  },
  {
    id: 't9', category: 'contract', title: 'Vendor Supply Agreement',
    description: 'Terms for supply of goods or materials with payment and delivery clauses.',
    generate: (b) => brandedPage('Vendor Supply Agreement', `
      <p>This Supply Agreement is between <strong>${b.companyName}</strong> ("Buyer") and <span class="field">[Vendor Name]</span> ("Vendor") effective <span class="field">[Date]</span>.</p>
      <h2>1. Goods / Services</h2>
      <p>Vendor agrees to supply: <span class="field">[Description of goods or services]</span>.</p>
      <h2>2. Pricing & Payment</h2>
      <table>
        <tr><th>Item</th><th>Unit Price</th><th>Quantity</th><th>Total</th></tr>
        <tr><td><span class="field">[Item 1]</span></td><td><span class="field">[Price]</span></td><td><span class="field">[Qty]</span></td><td><span class="field">[Total]</span></td></tr>
      </table>
      <p>Payment terms: Net <span class="field">[30/60]</span> days from invoice. Late payments attract interest at <span class="field">[X%]</span> per month.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">${b.companyName} (Buyer)</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Vendor Authorised Signatory</div></div>
      </div>`, b)
  },
  {
    id: 't10', category: 'contract', title: 'Memorandum of Understanding (MoU)',
    description: 'Non-binding intent-to-collaborate document between two organisations.',
    generate: (b) => brandedPage('Memorandum of Understanding (MoU)', `
      <p>This Memorandum of Understanding ("MoU") is made between <strong>${b.companyName}</strong> ("Party A") and <span class="field">[Second Organisation]</span> ("Party B") on <span class="field">[Date]</span>.</p>
      <h2>1. Background</h2>
      <p>Both parties have agreed to collaborate on <span class="field">[Project / Initiative]</span>. This MoU sets out the framework for cooperation.</p>
      <h2>2. Roles & Responsibilities</h2>
      <table>
        <tr><th>Party</th><th>Responsibility</th></tr>
        <tr><td>${b.companyName}</td><td><span class="field">[Responsibilities of Party A]</span></td></tr>
        <tr><td><span class="field">[Party B Name]</span></td><td><span class="field">[Responsibilities of Party B]</span></td></tr>
      </table>
      <h2>3. Non-Binding Nature</h2>
      <p>This MoU reflects mutual intent and is not legally binding. It shall serve as a basis for a definitive agreement to be signed separately.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label"><span class="field">[Party B]</span></div></div>
      </div>`, b)
  },
  {
    id: 't11', category: 'contract', title: 'Freelance Design Contract',
    description: 'Creative services agreement with copyright transfer and revision policy.',
    generate: (b) => brandedPage('Freelance Creative Services Agreement', `
      <p>This Agreement is between <strong>${b.companyName}</strong> ("Client") and <span class="field">[Designer/Creative Name]</span> ("Designer") dated <span class="field">[Date]</span>.</p>
      <h2>1. Scope of Work</h2>
      <p>Designer will create: <span class="field">[e.g., Logo, Brand Book, UI Mockups, Marketing Collateral]</span>.</p>
      <h2>2. Revisions</h2>
      <p>This engagement includes up to <span class="field">[X]</span> rounds of revisions. Additional revisions will be billed at <span class="field">[hourly rate]</span>.</p>
      <h2>3. Ownership & Copyright</h2>
      <p>All final deliverables, upon receipt of full payment, shall become the exclusive intellectual property of ${b.companyName}.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Designer / Agency</div></div>
      </div>`, b)
  },
  {
    id: 't12', category: 'policy', title: 'Employee Code of Conduct',
    description: 'Standards of professional behavior, ethics, and company values.',
    generate: (b) => brandedPage('Employee Code of Conduct', `
      <p>At <strong>${b.companyName}</strong>, we hold all employees to the highest standards of professional conduct. This Code applies to all staff, contractors, and interns.</p>
      <h2>1. Professional Conduct</h2>
      <ul>
        <li>Treat all colleagues, clients, and partners with dignity and respect.</li>
        <li>Maintain a professional and positive work environment at all times.</li>
        <li>Report to work on time and adhere to the agreed work schedule.</li>
      </ul>
      <h2>2. Conflict of Interest</h2>
      <p>Employees must disclose any personal, financial, or professional interest that may conflict with their duties at ${b.companyName} to their manager immediately.</p>
      <h2>3. Protection of Company Assets</h2>
      <ul>
        <li>Company property, data, and intellectual property must not be misused.</li>
        <li>Confidential company information shall not be shared externally.</li>
      </ul>
      <h2>4. Compliance</h2>
      <p>All employees must comply with applicable laws, regulations, and internal policies at all times.</p>
      <h2>5. Consequences</h2>
      <p>Violations of this Code may result in disciplinary action up to and including immediate termination of employment.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR Manager — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Acknowledgement &amp; Date</div></div>
      </div>`, b)
  },
  {
    id: 't13', category: 'policy', title: 'Work from Home Policy',
    description: 'Guidelines for remote work eligibility, expectations, and equipment.',
    generate: (b) => brandedPage('Remote Work (WFH) Policy', `
      <p>This policy governs remote working arrangements at <strong>${b.companyName}</strong>. All remote work must be pre-approved by the respective department head.</p>
      <h2>1. Eligibility</h2>
      <p>Employees in roles classified as "Remote-Eligible" by HR may apply for WFH arrangements after completing <span class="field">[X months]</span> of service.</p>
      <h2>2. Expectations</h2>
      <ul>
        <li>Maintain core working hours: <span class="field">[Start Time]</span> to <span class="field">[End Time]</span>, Monday to Friday.</li>
        <li>Be reachable via company communication tools during work hours.</li>
        <li>Ensure a professional, distraction-free workspace with stable internet.</li>
        <li>Protect company data by using approved VPN and encrypted connections.</li>
      </ul>
      <h2>3. Equipment</h2>
      <p>The company will provide: <span class="field">[Laptop / Monitor / Stipend / None]</span>. Employees are responsible for maintaining provided equipment.</p>
      <h2>4. Non-Compliance</h2>
      <p>Failure to adhere to this policy may result in revocation of WFH privileges and/or disciplinary action.</p>`, b)
  },
  {
    id: 't14', category: 'policy', title: 'IT Security & Device Policy',
    description: 'Acceptable use of company devices, network, and data security standards.',
    generate: (b) => brandedPage('IT Security & Acceptable Use Policy', `
      <p>This policy applies to all ${b.companyName} employees and contractors who have access to company IT systems, devices, and networks.</p>
      <h2>1. Acceptable Use</h2>
      <ul>
        <li>Company devices must be used primarily for work-related activities.</li>
        <li>Do not install unapproved or unlicensed software on company devices.</li>
        <li>Do not store personal sensitive data on company systems.</li>
      </ul>
      <h2>2. Network & Data Security</h2>
      <ul>
        <li>All remote access must be performed exclusively via the company-approved VPN.</li>
        <li>Never bypass network security tools, firewalls, or monitoring systems.</li>
        <li>Report any security incident, breach, or suspicious activity immediately to the IT department.</li>
      </ul>
      <h2>3. Password Policy</h2>
      <ul>
        <li>Use strong, unique passwords (minimum 12 characters with mixed case, numbers, and symbols).</li>
        <li>Enable Multi-Factor Authentication (MFA) on all company accounts.</li>
        <li>Do not share login credentials under any circumstances.</li>
      </ul>
      <h2>4. Violatins</h2>
      <p>Breach of this policy may result in disciplinary action, including termination and legal proceedings where applicable.</p>`, b)
  },
  {
    id: 't15', category: 'policy', title: 'Leave & Attendance Policy',
    description: 'Entitlements, leave types, approval process, and attendance rules.',
    generate: (b) => brandedPage('Leave & Attendance Policy', `
      <p>This policy outlines the leave entitlements and attendance expectations for all employees of <strong>${b.companyName}</strong>.</p>
      <h2>1. Leave Entitlements</h2>
      <table>
        <tr><th>Leave Type</th><th>Days Per Year</th><th>Carry Forward</th></tr>
        <tr><td>Earned / Annual Leave</td><td><span class="field">[X days]</span></td><td>Up to <span class="field">[Y days]</span></td></tr>
        <tr><td>Sick Leave</td><td><span class="field">[X days]</span></td><td>No</td></tr>
        <tr><td>Casual Leave</td><td><span class="field">[X days]</span></td><td>No</td></tr>
        <tr><td>Maternity / Paternity Leave</td><td>As per applicable law</td><td>N/A</td></tr>
        <tr><td>Public Holidays</td><td><span class="field">[X days]</span></td><td>N/A</td></tr>
      </table>
      <h2>2. Leave Application Process</h2>
      <ul>
        <li>All leave requests must be submitted via the IMS portal at least <span class="field">[X days]</span> in advance.</li>
        <li>Sick leave beyond 3 consecutive days requires a medical certificate.</li>
        <li>Unapproved absence will be treated as Leave Without Pay (LWP).</li>
      </ul>
      <h2>3. Attendance</h2>
      <p>Employees are expected to maintain a minimum attendance of <span class="field">[X%]</span> per month. Persistent absenteeism will trigger a performance review.</p>`, b)
  },
  {
    id: 't16', category: 'policy', title: 'Expense Reimbursement Policy',
    description: 'Guidelines on claimable expenses, submission process, and limits.',
    generate: (b) => brandedPage('Expense Reimbursement Policy', `
      <p><strong>${b.companyName}</strong> will reimburse employees for reasonable, pre-approved business expenses incurred in carrying out company duties.</p>
      <h2>1. Eligible Expenses</h2>
      <table>
        <tr><th>Category</th><th>Max Per Claim</th><th>Requires Receipt</th></tr>
        <tr><td>Business Travel (flights, trains)</td><td><span class="field">[Limit]</span></td><td>Yes</td></tr>
        <tr><td>Local Travel / Taxi / Cab</td><td><span class="field">[Limit]</span></td><td>Yes</td></tr>
        <tr><td>Client Meals & Entertainment</td><td><span class="field">[Limit per person]</span></td><td>Yes</td></tr>
        <tr><td>Home Internet (WFH)</td><td><span class="field">[Limit per month]</span></td><td>Yes</td></tr>
        <tr><td>Approved Software Subscriptions</td><td>Actuals</td><td>Yes</td></tr>
      </table>
      <h2>2. Submission Deadline</h2>
      <p>All reimbursement claims must be submitted within 30 days of the expense date via the IMS Expenses module. Late submissions will not be processed.</p>
      <h2>3. Non-Reimbursable Expenses</h2>
      <p>Personal meals, entertainment without client involvement, fines, and non-approved subscriptions are not reimbursable.</p>`, b)
  },
  {
    id: 't17', category: 'policy', title: 'Anti-Harassment Policy',
    description: 'Zero-tolerance policy on workplace harassment with reporting procedures.',
    generate: (b) => brandedPage('Zero-Tolerance Anti-Harassment Policy', `
      <p><strong>${b.companyName}</strong> is committed to providing a workplace free from harassment, discrimination, and bullying in any form.</p>
      <h2>1. Prohibited Conduct</h2>
      <ul>
        <li>Verbal, written, or physical harassment based on gender, race, religion, disability, sexual orientation, or any other protected characteristic.</li>
        <li>Unwanted advances, threats, or coercion of any kind.</li>
        <li>Cyberbullying or harassment via digital channels or company systems.</li>
      </ul>
      <h2>2. Reporting</h2>
      <p>Any employee who experiences or witnesses harassment must report it to HR (<span class="field">[HR email]</span>) or use the anonymous grievance portal. All complaints will be treated with strict confidentiality.</p>
      <h2>3. Investigation</h2>
      <p>All reports will be investigated promptly and impartially. Retaliation against complainants is itself a serious violation of this policy.</p>
      <h2>4. Consequences</h2>
      <p>Proven violations will result in disciplinary action including — but not limited to — immediate termination and, where applicable, legal proceedings.</p>`, b)
  },
  {
    id: 't18', category: 'report', title: 'Quarterly Performance Review',
    description: 'Structured 360° employee performance appraisal with ratings and goals.',
    generate: (b) => brandedPage('Quarterly Performance Review', `
      <h2>Employee Information</h2>
      <table>
        <tr><th>Field</th><th>Value</th></tr>
        <tr><td>Employee Name</td><td><span class="field">[Name]</span></td></tr>
        <tr><td>Designation</td><td><span class="field">[Designation]</span></td></tr>
        <tr><td>Department</td><td><span class="field">[Department]</span></td></tr>
        <tr><td>Reviewer</td><td><span class="field">[Manager Name]</span></td></tr>
        <tr><td>Review Period</td><td><span class="field">[Q1/Q2/Q3/Q4 YYYY]</span></td></tr>
      </table>
      <h2>Performance Against Goals</h2>
      <table>
        <tr><th>Goal</th><th>Target</th><th>Achieved</th><th>Rating (1-5)</th></tr>
        <tr><td><span class="field">[Goal 1]</span></td><td><span class="field">[Target]</span></td><td><span class="field">[Result]</span></td><td><span class="field">[ ]</span></td></tr>
        <tr><td><span class="field">[Goal 2]</span></td><td><span class="field">[Target]</span></td><td><span class="field">[Result]</span></td><td><span class="field">[ ]</span></td></tr>
      </table>
      <h2>Key Strengths</h2>
      <p><span class="field">[List 2-3 strengths demonstrated this quarter]</span></p>
      <h2>Areas for Improvement</h2>
      <p><span class="field">[List 1-2 development areas]</span></p>
      <h2>Goals for Next Quarter</h2>
      <p><span class="field">[Set 3-5 SMART goals for upcoming quarter]</span></p>
      <h2>Overall Rating</h2>
      <table>
        <tr><th>Category</th><th>Score (1-5)</th></tr>
        <tr><td>Productivity & Quality</td><td><span class="field">[ ]</span></td></tr>
        <tr><td>Communication & Teamwork</td><td><span class="field">[ ]</span></td></tr>
        <tr><td>Initiative & Problem Solving</td><td><span class="field">[ ]</span></td></tr>
        <tr><td><strong>Overall Score</strong></td><td><strong><span class="field">[ ]</span> / 5</strong></td></tr>
      </table>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Reviewer / Manager</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Acknowledgement</div></div>
      </div>`, b)
  },
  {
    id: 't19', category: 'report', title: 'Incident Report',
    description: 'Formal incident documentation with timeline, cause, and corrective actions.',
    generate: (b) => brandedPage('Incident Report', `
      <h2>Incident Overview</h2>
      <table>
        <tr><th>Field</th><th>Detail</th></tr>
        <tr><td>Date & Time</td><td><span class="field">[Date & Time of Incident]</span></td></tr>
        <tr><td>Location</td><td><span class="field">[Physical Location / System / Server]</span></td></tr>
        <tr><td>Reported By</td><td><span class="field">[Name & Designation]</span></td></tr>
        <tr><td>Incident Type</td><td><span class="field">[Security / Safety / System / HR / Other]</span></td></tr>
        <tr><td>Severity</td><td><span class="field">[Critical / High / Medium / Low]</span></td></tr>
      </table>
      <h2>Description of Incident</h2>
      <p><span class="field">[Provide a factual, chronological description of what occurred. Include who was involved, what happened, and the immediate impact.]</span></p>
      <h2>Root Cause Analysis</h2>
      <p><span class="field">[What was the underlying cause of this incident? Use 5-Whys if applicable.]</span></p>
      <h2>Immediate Actions Taken</h2>
      <ul>
        <li><span class="field">[Action 1 taken immediately]</span></li>
        <li><span class="field">[Action 2]</span></li>
      </ul>
      <h2>Preventive Measures</h2>
      <p><span class="field">[What process changes, system improvements, or training will prevent recurrence?]</span></p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Reported By</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Manager / HOD</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR / Compliance</div></div>
      </div>`, b)
  },
  {
    id: 't20', category: 'report', title: 'Project Handover Document',
    description: 'Structured handover report for smooth project or role transitions.',
    generate: (b) => brandedPage('Project Handover Report', `
      <h2>Project Overview</h2>
      <table>
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Project Name</td><td><span class="field">[Project Name]</span></td></tr>
        <tr><td>Outgoing Responsible</td><td><span class="field">[Name & Designation]</span></td></tr>
        <tr><td>Incoming Responsible</td><td><span class="field">[Name & Designation]</span></td></tr>
        <tr><td>Handover Date</td><td><span class="field">[Date]</span></td></tr>
        <tr><td>Current Status</td><td><span class="field">[On Track / Delayed / At Risk / Completed]</span></td></tr>
      </table>
      <h2>Current Progress</h2>
      <p><span class="field">[Summary of work completed, percentage completion, and remaining deliverables]</span></p>
      <h2>Pending Action Items</h2>
      <table>
        <tr><th>Task</th><th>Priority</th><th>Due Date</th><th>Notes</th></tr>
        <tr><td><span class="field">[Task 1]</span></td><td><span class="field">[H/M/L]</span></td><td><span class="field">[Date]</span></td><td><span class="field">[Notes]</span></td></tr>
      </table>
      <h2>Key Contacts & Dependencies</h2>
      <p><span class="field">[List clients, vendors, or team members the incoming person must coordinate with]</span></p>
      <h2>Access & Credentials</h2>
      <p><span class="field">[List systems, repos, and dashboards the incoming person needs access to — do not include passwords in this document]</span></p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Outgoing Person</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Incoming Person</div></div>
      </div>`, b)
  },
  {
    id: 't21', category: 'report', title: 'Meeting Minutes',
    description: 'Formal MOM record with attendees, decisions, and action items.',
    generate: (b) => brandedPage('Minutes of Meeting (MOM)', `
      <h2>Meeting Details</h2>
      <table>
        <tr><th>Item</th><th>Detail</th></tr>
        <tr><td>Meeting Title</td><td><span class="field">[Meeting Title / Purpose]</span></td></tr>
        <tr><td>Date & Time</td><td><span class="field">[Date & Time]</span></td></tr>
        <tr><td>Venue / Link</td><td><span class="field">[Room / Zoom / Teams Link]</span></td></tr>
        <tr><td>Chairperson</td><td><span class="field">[Name]</span></td></tr>
        <tr><td>Minute-Taker</td><td><span class="field">[Name]</span></td></tr>
      </table>
      <h2>Attendees</h2>
      <p><span class="field">[Name 1, Designation] · [Name 2, Designation] · [Name 3, Designation]</span></p>
      <h2>Agenda Items & Discussion</h2>
      <table>
        <tr><th>#</th><th>Topic</th><th>Discussion Summary</th><th>Decision</th></tr>
        <tr><td>1</td><td><span class="field">[Topic]</span></td><td><span class="field">[Summary]</span></td><td><span class="field">[Decision]</span></td></tr>
        <tr><td>2</td><td><span class="field">[Topic]</span></td><td><span class="field">[Summary]</span></td><td><span class="field">[Decision]</span></td></tr>
      </table>
      <h2>Action Items</h2>
      <table>
        <tr><th>Action</th><th>Owner</th><th>Deadline</th></tr>
        <tr><td><span class="field">[Action 1]</span></td><td><span class="field">[Name]</span></td><td><span class="field">[Date]</span></td></tr>
      </table>
      <h2>Next Meeting</h2>
      <p><span class="field">[Date, Time & Location of next meeting, if applicable]</span></p>`, b)
  },
  {
    id: 't22', category: 'other', title: 'Written Warning Letter',
    description: 'Formal written warning for performance or behavioural issues.',
    generate: (b) => brandedPage('Official Written Warning', `
      <p>Date: <span class="field">[Date]</span></p>
      <p><strong>To:</strong> <span class="field">[Employee Full Name]</span><br/>
      <strong>Designation:</strong> <span class="field">[Designation]</span><br/>
      <strong>Department:</strong> <span class="field">[Department]</span></p>
      <h2>Subject: Written Warning</h2>
      <p>Dear <span class="field">[Employee Name]</span>,</p>
      <p>This letter serves as an official written warning regarding your recent conduct/performance, specifically: <span class="field">[Detailed description of the issue, incident, or pattern of behaviour with dates]</span>.</p>
      <h2>Expected Improvement</h2>
      <p>You are required to demonstrate measurable improvement in the following areas within <span class="field">[X days/weeks]</span>:</p>
      <ul>
        <li><span class="field">[Specific improvement area 1]</span></li>
        <li><span class="field">[Specific improvement area 2]</span></li>
      </ul>
      <h2>Consequences</h2>
      <p>Failure to meet the expectations outlined above may result in further disciplinary action, including suspension without pay or termination of employment.</p>
      <p>You may submit a written response to HR within 5 working days if you wish to contest this warning.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR Manager — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Acknowledgement</div></div>
      </div>`, b)
  },
  {
    id: 't23', category: 'other', title: 'Termination Letter',
    description: 'Professional termination notice with reason and final settlement details.',
    generate: (b) => brandedPage('Notice of Employment Termination', `
      <p>Date: <span class="field">[Date]</span></p>
      <p><strong>To:</strong> <span class="field">[Employee Full Name]</span><br/>
      <strong>Designation:</strong> <span class="field">[Designation]</span></p>
      <h2>Notification of Termination</h2>
      <p>Dear <span class="field">[Employee Name]</span>,</p>
      <p>We regret to inform you that your employment with <strong>${b.companyName}</strong> is being terminated effective <span class="field">[Last Working Day]</span>.</p>
      <h2>Reason for Termination</h2>
      <p><span class="field">[Performance / Misconduct / Redundancy / Restructuring — provide factual detail]</span></p>
      <h2>Final Settlement</h2>
      <table>
        <tr><th>Item</th><th>Details</th></tr>
        <tr><td>Final Salary (up to last working day)</td><td><span class="field">[Amount]</span></td></tr>
        <tr><td>Gratuity / Severance (if applicable)</td><td><span class="field">[Amount]</span></td></tr>
        <tr><td>Accrued Leave Encashment</td><td><span class="field">[Amount]</span></td></tr>
        <tr><td>Payment Date</td><td><span class="field">[Date]</span></td></tr>
      </table>
      <h2>Return of Company Property</h2>
      <p>You are required to return all company property including devices, access cards, and credentials by your last working day.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR Director — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Acknowledgement</div></div>
      </div>`, b)
  },
  {
    id: 't24', category: 'other', title: 'Promotion Letter',
    description: 'Formal promotion announcement with new title, salary, and responsibilities.',
    generate: (b) => brandedPage('Promotion Notification Letter', `
      <p>Date: <span class="field">[Date]</span></p>
      <p>Dear <strong><span class="field">[Employee Name]</span></strong>,</p>
      <p>It is with great pride and pleasure that <strong>${b.companyName}</strong> recognises your outstanding dedication, consistent performance, and significant contributions to the organisation.</p>
      <h2>Promotion Details</h2>
      <table>
        <tr><th>Field</th><th>Previous</th><th>New</th></tr>
        <tr><td>Designation</td><td><span class="field">[Previous Title]</span></td><td><span class="field">[New Title]</span></td></tr>
        <tr><td>Department</td><td><span class="field">[Department]</span></td><td><span class="field">[New Department if changed]</span></td></tr>
        <tr><td>Annual CTC</td><td><span class="field">[Previous Salary]</span></td><td><span class="field">[New Salary]</span></td></tr>
        <tr><td>Effective Date</td><td colspan="2"><span class="field">[Effective Date]</span></td></tr>
      </table>
      <p>In your new role, you will be expected to <span class="field">[briefly outline expanded responsibilities]</span>. We have full confidence in your ability to excel in this capacity.</p>
      <p>Congratulations once again on this well-deserved milestone!</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">CEO / HR Director — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Acknowledgement</div></div>
      </div>`, b)
  },
  {
    id: 't25', category: 'other', title: 'Salary Revision Letter',
    description: 'Annual salary increment notification with revised compensation breakup.',
    generate: (b) => brandedPage('Salary Revision Letter', `
      <p>Date: <span class="field">[Date]</span></p>
      <p>Dear <span class="field">[Employee Name]</span>,</p>
      <p>Following the annual performance and compensation review cycle, <strong>${b.companyName}</strong> is pleased to revise your compensation package effective <span class="field">[Date]</span>.</p>
      <h2>Revised Compensation Breakup</h2>
      <table>
        <tr><th>Component</th><th>Previous (p.a.)</th><th>Revised (p.a.)</th></tr>
        <tr><td>Basic Salary</td><td><span class="field">[Amount]</span></td><td><span class="field">[Amount]</span></td></tr>
        <tr><td>HRA</td><td><span class="field">[Amount]</span></td><td><span class="field">[Amount]</span></td></tr>
        <tr><td>Special Allowance</td><td><span class="field">[Amount]</span></td><td><span class="field">[Amount]</span></td></tr>
        <tr><td>Performance Bonus (variable)</td><td><span class="field">[Amount]</span></td><td><span class="field">[Amount]</span></td></tr>
        <tr><td><strong>Total CTC</strong></td><td><span class="field">[Previous CTC]</span></td><td><strong><span class="field">[New CTC]</span></strong></td></tr>
      </table>
      <p>This revision reflects our appreciation for your hard work, commitment, and the value you add to our team. We look forward to your continued growth with ${b.companyName}.</p>
      <div class="signatures">
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR Manager — ${b.companyName}</div></div>
        <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Acknowledgement</div></div>
      </div>`, b)
  },
];
