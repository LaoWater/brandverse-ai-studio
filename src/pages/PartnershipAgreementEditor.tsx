import React, { useState } from 'react';
import { Download, Eye, Edit3, FileText } from 'lucide-react';

const PartnershipAgreementEditor = () => {
  const [formData, setFormData] = useState({
    date: '',
    marketingPartnerName: 'Noah Riley Bethay',
    marketingPartnerAddress: '',
    marketingPartnerPhone: '',
    marketingPartnerEmail: '',
    marketingPartnerSSN: '',
    technicalPartnerName: 'Raul Baciu',
    technicalPartnerAddress: 'Str. Cetatii nr 3A, sat Floresti, jud Cluj, Romania, 407280',
    technicalPartnerPhone: '+40740476485',
    technicalPartnerEmail: 'lao.water7@Gmail.com',
    technicalPartnerSSN: '1701',
    businessAddress: 'Online',
    marketingPartnerInvestment: 0,
    technicalPartnerInvestment: 0,
    governingState: '',
    totalInitialCapital: ''
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate total initial capital
    if (field === 'marketingPartnerInvestment' || field === 'technicalPartnerInvestment') {
      const marketing = parseFloat(String(newFormData.marketingPartnerInvestment)) || 0;
      const technical = parseFloat(String(newFormData.technicalPartnerInvestment)) || 0;
      newFormData.totalInitialCapital = (marketing + technical).toLocaleString();
    }

    setFormData(newFormData);
  };

  const generatePDF = () => {
    // This is the complete HTML content for the agreement.
    const agreementContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Partnership Agreement - Bare App</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.4;
            margin: 40px;
            font-size: 12pt;
            color: #000;
            background: white;
        }
        h1 {
            text-align: center;
            font-size: 18pt;
            margin-bottom: 20px;
            text-transform: uppercase;
            font-weight: bold;
        }
        h2 {
            font-size: 14pt;
            margin-top: 25px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }
        h3 {
            font-size: 12pt;
            margin-top: 15px;
            margin-bottom: 8px;
            font-weight: bold;
        }
        .filled-field {
            background-color: #f0f0f0;
            padding: 2px 4px;
            border-bottom: 1px solid #333;
            font-weight: bold;
            display: inline-block;
            min-width: 100px;
        }
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        .signature-line {
            border-bottom: 1px solid #000;
            width: 300px;
            display: inline-block;
            margin-right: 50px;
            height: 20px;
        }
        ul, ol { margin-left: 20px; }
        li { margin-bottom: 5px; }
        .checkbox { margin-right: 8px; }
        @media print {
            body { margin: 30px; }
            .no-print { display: none; }
        }
        .page-break { page-break-before: always; }
        p { margin-bottom: 8px; text-align: justify; }
        .partner-info {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <h1>Partnership Agreement - Bare App</h1>

    <p><strong>Date:</strong> <span class="filled-field">${formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '_______________'}</span>, 2025</p>

    <h2>PARTNERS</h2>

    <div class="partner-info">
        <p><strong>Partner 1 (Marketing Partner):</strong></p>
        <p><strong>Name:</strong> <span class="filled-field">${formData.marketingPartnerName || '_________________'}</span></p>
        <p><strong>Address:</strong> <span class="filled-field">${formData.marketingPartnerAddress || '_________________'}</span></p>
        <p><strong>Phone:</strong> <span class="filled-field">${formData.marketingPartnerPhone || '_________________'}</span></p>
        <p><strong>Email:</strong> <span class="filled-field">${formData.marketingPartnerEmail || '_________________'}</span></p>
        <p><strong>SSN:</strong> <span class="filled-field">${formData.marketingPartnerSSN ? '***-**-' + formData.marketingPartnerSSN.slice(-4) : '___-__-____'}</span></p>
    </div>

    <div class="partner-info">
        <p><strong>Partner 2 (Technical Partner):</strong></p>
        <p><strong>Name:</strong> <span class="filled-field">${formData.technicalPartnerName || '_________________'}</span></p>
        <p><strong>Address:</strong> <span class="filled-field">${formData.technicalPartnerAddress || '_________________'}</span></p>
        <p><strong>Phone:</strong> <span class="filled-field">${formData.technicalPartnerPhone || '_________________'}</span></p>
        <p><strong>Email:</strong> <span class="filled-field">${formData.technicalPartnerEmail || '_________________'}</span></p>
        <p><strong>SSN:</strong> <span class="filled-field">${formData.technicalPartnerSSN ? '***-**-' + formData.technicalPartnerSSN.slice(-4) : '___-__-____'}</span></p>
    </div>

    <h2>1. BUSINESS OVERVIEW</h2>
    <p><strong>Company Name:</strong> Bare App</p>
    <p><strong>Business Description:</strong> AI-powered content generation platform for social media creators</p>
    <p><strong>Business Structure:</strong> Partnership (to be formalized as LLC upon business registration)</p>
    <p><strong>Ownership:</strong> 50% each partner</p>
    <p><strong>Principal Place of Business:</strong> <span class="filled-field">${formData.businessAddress || '_________________'}</span></p>

    <h2>2. ROLES & RESPONSIBILITIES</h2>

    <h3>Marketing Partner (${formData.marketingPartnerName || 'Partner 1'}):</h3>
    <ul>
        <li>Marketing strategy, sales, and customer acquisition</li>
        <li>Business development and strategic partnerships</li>
        <li>Financial management, accounting, and operations</li>
        <li>Legal compliance, contracts, and regulatory matters</li>
        <li>Customer support and relationship management</li>
    </ul>

    <h3>Technical Partner (${formData.technicalPartnerName || 'Partner 2'}):</h3>
    <ul>
        <li>Software development, engineering, and architecture</li>
        <li>AI technology development and platform infrastructure</li>
        <li>Technical support, security, and system maintenance</li>
        <li>Technology research, development, and innovation</li>
        <li>Data management and privacy compliance</li>
    </ul>

    <p><strong>Note:</strong> Partners may delegate responsibilities but remain ultimately accountable for their designated areas.</p>
<h2>3. FINANCIAL TERMS</h2>

<h3>Initial Investment:</h3>
<ul>
    <li>Marketing Partner (${formData.marketingPartnerName || 'Partner 1'}): $<span class="filled-field">${formData.marketingPartnerInvestment ? parseFloat(String(formData.marketingPartnerInvestment)).toLocaleString() : '________________'}</span></li>
    <li>Technical Partner (${formData.technicalPartnerName || 'Partner 2'}): $<span class="filled-field">${formData.technicalPartnerInvestment ? parseFloat(String(formData.technicalPartnerInvestment)).toLocaleString() : '________________'}</span></li>
    <li><strong>Total Initial Capital:</strong> $<span class="filled-field">${formData.totalInitialCapital || '________________'}</span></li>
</ul>

<h3>Ongoing Financial Contributions:</h3>
<ul>
    <li>Additional capital contributions require mutual written agreement</li>
    <li>If one partner cannot contribute to required capital calls, their ownership percentage may be diluted proportionally</li>
    <li>If one partner funds additional marketing or other company-related expenses on behalf of the business (when the other partner cannot or chooses not to invest), such contributions shall be recorded as <em>Reimbursable Partner Loans</em>.</li>
    <li>Reimbursable Partner Loans shall accrue no interest unless otherwise agreed in writing, and shall be repaid to the funding partner from the company's net profits <strong>before</strong> any profit distribution to the other partner occurs.</li>
    <li>Once the funding partner has been fully reimbursed for such additional investments, net profits shall be distributed in accordance with the standard profit-sharing arrangement described below.</li>
</ul>

<h3>Profit & Loss Distribution:</h3>
<ul>
    <li><strong>Profit Sharing:</strong> 50/50 split of net profits after expenses and after repayment of any outstanding Reimbursable Partner Loans</li>
    <li><strong>Loss Sharing:</strong> 50/50 split of any business losses</li>
    <li><strong>Distribution Schedule:</strong> Quarterly, within 30 days of quarter-end</li>
</ul>

<h3>Expense Authorization:</h3>
<ul>
    <li><strong>Individual Authority:</strong> Up to $2,500 per month per partner</li>
    <li><strong>Joint Approval Required:</strong> Expenses over $2,500</li>
    <li><strong>Emergency Expenses:</strong> Up to $5,000 with immediate notification to other partner</li>
</ul>

<h3>Compensation:</h3>
<ul>
    <li>No initial salaries - income through profit distributions</li>
    <li>Future salary arrangements require mutual written agreement</li>
    <li>Partners may take reasonable draws against anticipated profits with mutual consent</li>
</ul>

<div class="page-break"></div>


    <h2>4. DECISION MAKING & AUTHORITY</h2>

    <h3>Day-to-Day Operations:</h3>
    <p>Each partner has authority within their designated responsibility areas</p>

    <h3>Major Decisions Requiring Unanimous Consent:</h3>
    <ul>
        <li>Employee hiring with annual compensation over $75,000</li>
        <li>Single expenditures over $10,000</li>
        <li>Incurring debt or obligations over $5,000</li>
        <li>Adding new partners or investors</li>
        <li>Selling, merging, or dissolving the business</li>
        <li>Contracts exceeding 1 year or $25,000 in value</li>
        <li>Changing business structure or legal entity</li>
        <li>Licensing core intellectual property to third parties</li>
        <li>Opening new business locations or markets</li>
    </ul>

    <h3>Deadlock Resolution:</h3>
    <p>If partners cannot agree on a major decision after 30 days of good faith discussion, the matter will be resolved through mediation.</p>

    <h2>5. INTELLECTUAL PROPERTY</h2>

    <h3>Assignment to Partnership:</h3>
    <ul>
        <li>All business-related intellectual property belongs to the partnership</li>
        <li>Partners assign all relevant existing and future IP to the business</li>
        <li>Partnership owns all trademarks, copyrights, patents, trade secrets, and proprietary methods</li>
    </ul>

    <h3>Pre-Existing IP:</h3>
    <ul>
        <li>Each partner retains ownership of IP created before this partnership</li>
        <li>License granted to partnership for any pre-existing IP essential to business operations</li>
    </ul>

    <h3>Third-Party IP:</h3>
    <ul>
        <li>All third-party IP licenses and agreements require joint approval</li>
        <li>Partners responsible for ensuring no infringement of existing IP rights</li>
    </ul>

    <h2>6. CONFIDENTIALITY & RESTRICTIVE COVENANTS</h2>

    <h3>Confidentiality:</h3>
    <ul>
        <li>Perpetual confidentiality obligation for all business information</li>
        <li>Includes customer lists, financial data, trade secrets, and business strategies</li>
        <li>Obligation survives partnership termination</li>
    </ul>

    <h3>Non-Compete (24 months post-departure):</h3>
    <ul>
        <li>Cannot directly compete with Bare App or similar Dating platforms</li>
        <li>Cannot solicit partnership customers or employees</li>
        <li>Geographic restriction: United States and any international markets served</li>
    </ul>

    <h3>Non-Solicitation (24 months post-departure):</h3>
    <ul>
        <li>Cannot hire or attempt to hire partnership employees</li>
        <li>Cannot solicit customers for competing services</li>
    </ul>

    <h2>7. PARTNERSHIP CHANGES & EXIT</h2>

    <h3>Voluntary Withdrawal:</h3>
    <ul>
        <li><strong>Notice:</strong> 90 days written notice required</li>
        <li><strong>Buyout Right:</strong> Remaining partner may purchase departing partner's interest</li>
        <li><strong>Valuation:</strong> Independent business appraisal by certified business valuator</li>
        <li><strong>Payment Terms:</strong> 25% at closing, remainder over 36 months at 6% annual interest</li>
    </ul>

    <h3>Involuntary Removal:</h3>
    <p>Partner may be removed for:</p>
    <ul>
        <li>Material breach of partnership agreement (30-day cure period)</li>
        <li>Conviction of felony affecting business reputation</li>
        <li>Prolonged incapacity (6+ months)</li>
        <li>Competing with the business</li>
    </ul>

    <h3>Death or Disability:</h3>
    <ul>
        <li>Partnership continues with surviving partner</li>
        <li>Same valuation and payment terms as voluntary withdrawal</li>
        <li>Disabled partner's rights transfer to legal representative</li>
    </ul>

    <h3>Right of First Refusal:</h3>
    <p>Any partner wishing to sell their interest must first offer it to the other partner on the same terms as any third-party offer.</p>

    <div class="page-break"></div>

    <h2>8. DISPUTE RESOLUTION</h2>

    <h3>Progressive Resolution Process:</h3>
    <ol>
        <li><strong>Direct Negotiation:</strong> 30 days good faith discussion</li>
        <li><strong>Mediation:</strong> Binding mediation with qualified business mediator</li>
        <li><strong>Arbitration:</strong> Final binding arbitration under American Arbitration Association rules</li>
        <li><strong>Attorney Fees:</strong> Prevailing party entitled to reasonable attorney fees</li>
    </ol>

    <h3>Jurisdiction:</h3>
    <p>All disputes governed by the laws of <span class="filled-field">${formData.governingState || '________________'}</span> state.</p>

    <h2>9. ADDITIONAL PROVISIONS</h2>

    <h3>Books and Records:</h3>
    <ul>
        <li>Maintain accurate financial records and business documents</li>
        <li>Each partner has right to inspect books during reasonable business hours</li>
        <li>Annual financial statements prepared by qualified accountant</li>
    </ul>

    <h3>Insurance:</h3>
    <ul>
        <li>Maintain appropriate business insurance (general liability, professional liability, cyber liability)</li>
        <li>Key person life insurance on both partners ($500,000 minimum)</li>
    </ul>

    <h3>Banking:</h3>
    <ul>
        <li>All business conducted through partnership bank accounts</li>
        <li>Both partners required to sign checks over $5,000</li>
    </ul>

    <h3>Tax Elections:</h3>
    <ul>
        <li>Partnership files appropriate tax returns</li>
        <li>Partners receive K-1s for individual tax reporting</li>
        <li>Tax advisor consultation required for major tax decisions</li>
    </ul>

    <h3>Amendment:</h3>
    <ul>
        <li>Agreement modifications require written consent of both partners</li>
        <li>No oral modifications binding</li>
    </ul>

    <h3>Severability:</h3>
    <ul>
        <li>Invalid provisions do not affect remainder of agreement</li>
        <li>Good faith effort to replace invalid provisions with valid equivalents</li>
    </ul>

    <h3>Entire Agreement:</h3>
    <ul>
        <li>This agreement supersedes all prior negotiations and agreements</li>
        <li>Integration clause - complete agreement between parties</li>
    </ul>

    <div class="signature-section">
    <h2>EXECUTION</h2>

    <p><strong>Marketing Partner:</strong></p>
    <p>Signature: <span class="signature-line"></span> Date: <span class="signature-line" style="width: 150px;"></span></p>
    <p>Print Name: <span class="filled-field">${formData.marketingPartnerName || '_________________________________'}</span></p>
    <br>

    <p><strong>Technical Partner:</strong></p>
    <p>Signature: <span class="signature-line"></span> Date: <span class="signature-line" style="width: 150px;"></span></p>
    <p>Print Name: <span class="filled-field">${formData.technicalPartnerName || '_________________________________'}</span></p>
    </div>

</body>
</html>`;

    // Create a blob and download link for better PDF generation
    const blob = new Blob([agreementContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (newWindow) {
      newWindow.onload = () => {
        // A small delay helps ensure content and styles are loaded before printing
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    } else {
      alert('Please allow popups for this site to generate the PDF.');
    }
  };

  // Renders the Preview Mode
  if (isPreviewMode) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-white">Partnership Agreement Preview</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPreviewMode(false)}
              className="cosmic-button flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onClick={generatePDF}
              className="cosmic-button flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            >
              <Download size={16} />
              Print/PDF
            </button>
          </div>
        </div>

        {/*
          SOLUTION:
          1. Replaced the `bg-white` container with your `cosmic-card`.
          2. Updated highlighted spans from `bg-gray-100` to `bg-secondary` for dark theme visibility.
          3. Adjusted text colors (e.g., to text-white, text-gray-300) to match the theme.
          4. Used the theme's `border-border` for dividers.
        */}
        <div className="cosmic-card text-white">
          <h1 className="text-xl font-bold text-center mb-6">PARTNERSHIP AGREEMENT - Bare App</h1>

          <p className="mb-4">
            <strong>Date:</strong> <span className="bg-secondary px-2 py-1 rounded">{formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '_______________'}</span>, 2025
          </p>

          <div className="mb-6">
            <p className="mb-2"><strong>Partners:</strong></p>
            <ul className="list-disc ml-6">
              <li><strong>Partner 1:</strong> <span className="bg-secondary px-2 py-1 rounded">{formData.marketingPartnerName || '_________________'}</span> (Marketing Partner)</li>
              <li><strong>Partner 2:</strong> <span className="bg-secondary px-2 py-1 rounded">{formData.technicalPartnerName || '_________________'}</span> (Technical Partner)</li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-3 border-b border-border pb-1">1. BUSINESS OVERVIEW</h2>
              <p><strong>Company Name:</strong> Bare App</p>
              <p><strong>Business Description:</strong> Dating Application</p>
              <p><strong>Business Structure:</strong> Partnership (to be formalized as LLC upon business registration)</p>
              <p><strong>Ownership:</strong> 50% each partner</p>
              <p><strong>Principal Place of Business:</strong> <span className="bg-secondary px-2 py-1 rounded">{formData.businessAddress || '_________________'}</span></p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3 border-b border-border pb-1">3. FINANCIAL TERMS</h2>
              <h3 className="font-semibold mb-2">Initial Investment:</h3>
              <ul className="list-disc ml-6 mb-4">
                <li>Marketing Partner: $<span className="bg-secondary px-2 py-1 rounded">{formData.marketingPartnerInvestment ? parseFloat(String(formData.marketingPartnerInvestment)).toLocaleString() : '________________'}</span></li>
                <li>Technical Partner: $<span className="bg-secondary px-2 py-1 rounded">{formData.technicalPartnerInvestment ? parseFloat(String(formData.technicalPartnerInvestment)).toLocaleString() : '________________'}</span></li>
                <li><strong>Total Initial Capital:</strong> $<span className="bg-secondary px-2 py-1 rounded">{formData.totalInitialCapital || '________________'}</span></li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3 border-b border-border pb-1">8. DISPUTE RESOLUTION</h2>
              <h3 className="font-semibold mb-2">Jurisdiction:</h3>
              <p>All disputes governed by the laws of <span className="bg-secondary px-2 py-1 rounded">{formData.governingState || '________________'}</span> state.</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-lg font-bold mb-4">EXECUTION</h2>

            <div className="mb-8">
              <p className="mb-2"><strong>Marketing Partner:</strong></p>
              <p className="mb-2">Signature: _________________________________ Date: _____________</p>
              <p>Print Name: <span className="bg-secondary px-2 py-1 rounded">{formData.marketingPartnerName || '_________________________________'}</span></p>
            </div>

            <div>
              <p className="mb-2"><strong>Technical Partner:</strong></p>
              <p className="mb-2">Signature: _________________________________ Date: _____________</p>
              <p>Print Name: <span className="bg-secondary px-2 py-1 rounded">{formData.technicalPartnerName || '_________________________________'}</span></p>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-400">
            <p><em>This is a preview showing key sections. The complete agreement includes all detailed terms, conditions, and the full pre-signature checklist.</em></p>
          </div>
        </div>
      </div>
    );
  }

  // Renders the Editor Form
    // Renders the Editor Form
  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Partnership Agreement Editor</h1>
        <p className="text-gray-400">Fill in the required information to customize your partnership agreement</p>
      </div>

      {/*
        SOLUTION:
        1. Replaced `bg-white` with your custom `cosmic-card` class.
           This single change will apply all the correct dark-theme styles
           for the background, inputs, and labels that you defined in your global CSS.
        2. Updated text colors (e.g., text-gray-800 -> text-white) to match the dark theme.
        3. Updated button classes to use your `cosmic-button` style.
        4. Re-styled the yellow notice box to fit the dark "cosmic" theme.
      */}
      <div className="cosmic-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white border-b border-border pb-2 col-span-1 md:col-span-2">Marketing Partner Information</h3>

            <div>
              <label>Agreement Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div>
              <label>Full Name</label>
              <input
                type="text"
                value={formData.marketingPartnerName}
                onChange={(e) => handleInputChange('marketingPartnerName', e.target.value)}
                placeholder="Enter full legal name"
              />
            </div>

            <div>
              <label>Address</label>
              <textarea
                value={formData.marketingPartnerAddress}
                onChange={(e) => handleInputChange('marketingPartnerAddress', e.target.value)}
                placeholder="Street address, City, State, ZIP"
                rows={3}
                className="!h-auto" // Override fixed height for textareas
              />
            </div>

            <div>
              <label>Phone</label>
              <input
                type="tel"
                value={formData.marketingPartnerPhone}
                onChange={(e) => handleInputChange('marketingPartnerPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={formData.marketingPartnerEmail}
                onChange={(e) => handleInputChange('marketingPartnerEmail', e.target.value)}
                placeholder="partner@email.com"
              />
            </div>

            <div>
              <label>SSN (Last 4 digits for ID)</label>
              <input
                type="text"
                value={formData.marketingPartnerSSN}
                onChange={(e) => handleInputChange('marketingPartnerSSN', e.target.value)}
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>



           {/* Technical Partner Information */ }
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white border-b border-border pb-2">Technical Partner Information</h3>

            <div>
              <label>Full Name</label>
              <input
                type="text"
                value={formData.technicalPartnerName}
                onChange={(e) => handleInputChange('technicalPartnerName', e.target.value)}
                placeholder="Enter full legal name"
              />
            </div>

            <div>
              <label>Address</label>
              <textarea
                value={formData.technicalPartnerAddress}
                onChange={(e) => handleInputChange('technicalPartnerAddress', e.target.value)}
                placeholder="Street address, City, State, ZIP"
                rows={3}
                className="!h-auto" // Override fixed height for textareas
              />
            </div>

            <div>
              <label>Phone</label>
              <input
                type="tel"
                value={formData.technicalPartnerPhone}
                onChange={(e) => handleInputChange('technicalPartnerPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={formData.technicalPartnerEmail}
                onChange={(e) => handleInputChange('technicalPartnerEmail', e.target.value)}
                placeholder="partner@email.com"
              />
            </div>

            <div>
              <label>SSN (Last 4 digits for ID)</label>
              <input
                type="text"
                value={formData.technicalPartnerSSN}
                onChange={(e) => handleInputChange('technicalPartnerSSN', e.target.value)}
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-xl font-semibold text-white border-b border-border pb-2 mb-4">Business & Financial Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            <div>
              <label>Principal Business Address</label>
              <textarea
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                placeholder="Principal place of business"
                rows={3}
                className="!h-auto" // Override fixed height for textareas
              />
            </div>

            <div>
              <label>Governing State</label>
              <input
                type="text"
                value={formData.governingState}
                onChange={(e) => handleInputChange('governingState', e.target.value)}
                placeholder="e.g., California, New York, Delaware"
              />
            </div>

            <div>
              <label>Marketing Partner Initial Investment ($)</label>
               <input
                 type="number"
                 value={formData.marketingPartnerInvestment}
                 onChange={(e) => handleInputChange('marketingPartnerInvestment', Number(e.target.value))}
                 placeholder="e.g., 25000"
              />
            </div>

            <div>
              <label>Technical Partner Initial Investment ($)</label>
               <input
                 type="number"
                 value={formData.technicalPartnerInvestment}
                 onChange={(e) => handleInputChange('technicalPartnerInvestment', Number(e.target.value))}
                 placeholder="e.g., 25000"
              />
            </div>

            <div className="md:col-span-2">
              <label>Total Initial Capital</label>
              <input
                type="text"
                value={`$${formData.totalInitialCapital}`}
                readOnly
                className="cursor-not-allowed opacity-70"
              />
              <p className="text-xs text-gray-400 mt-2">Auto-calculated from individual investments.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => setIsPreviewMode(true)}
            className="cosmic-button flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-lg"
          >
            <Eye size={20} />
            Preview Agreement
          </button>

          <button
            onClick={generatePDF}
            className="cosmic-button flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 rounded-lg"
          >
            <FileText size={20} />
            Generate Full PDF for Printing
          </button>
        </div>

        <div className="mt-8 p-4 bg-primary/10 border-l-4 border-primary rounded-r-lg">
          <h4 className="font-semibold text-white mb-2">⚠️ Important Legal Notice</h4>
          <p className="text-sm text-gray-300">
            This agreement template is for informational purposes only. Before signing, we strongly recommend you:
          </p>
          <ul className="text-sm text-gray-300 mt-2 list-disc list-inside space-y-1">
            <li>Have the final document reviewed by a qualified business attorney in your state.</li>
            <li>Consider forming an LLC instead of a general partnership for liability protection.</li>
            <li>Ensure compliance with all local and state business registration requirements.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PartnershipAgreementEditor;