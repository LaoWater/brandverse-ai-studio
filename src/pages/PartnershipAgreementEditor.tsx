import React, { useState } from 'react';
import { Download, Eye, Edit3 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

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
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.4; padding: 40px; font-size: 12pt; color: #000; background: white;">
        <h1 style="text-align: center; font-size: 18pt; margin-bottom: 20px; text-transform: uppercase; font-weight: bold;">Partnership Agreement - Creators Multiverse</h1>

        <p style="margin-bottom: 8px;"><strong>Date:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; border-bottom: 1px solid #333; font-weight: bold;">${formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '_______________'}</span>, 2025</p>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">PARTNERS</h2>

        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9;">
          <p style="margin-bottom: 8px;"><strong>Partner 1 (Marketing Partner):</strong></p>
          <p style="margin-bottom: 8px;"><strong>Name:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerName || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>Address:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerAddress || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>Phone:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerPhone || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>Email:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerEmail || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>SSN:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerSSN ? '***-**-' + formData.marketingPartnerSSN.slice(-4) : '___-__-____'}</span></p>
        </div>

        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9;">
          <p style="margin-bottom: 8px;"><strong>Partner 2 (Technical Partner):</strong></p>
          <p style="margin-bottom: 8px;"><strong>Name:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerName || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>Address:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerAddress || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>Phone:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerPhone || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>Email:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerEmail || '_________________'}</span></p>
          <p style="margin-bottom: 8px;"><strong>SSN:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerSSN ? '***-**-' + formData.technicalPartnerSSN.slice(-4) : '___-__-____'}</span></p>
        </div>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">1. BUSINESS OVERVIEW</h2>
        <p style="margin-bottom: 8px;"><strong>Company Name:</strong> Creators Multiverse</p>
        <p style="margin-bottom: 8px;"><strong>Business Description:</strong> AI-powered content generation platform for social media creators, brands, and digital entrepreneurs</p>
        <p style="margin-bottom: 8px;"><strong>Business Structure:</strong> Partnership (to be formalized as LLC upon business registration)</p>
        <p style="margin-bottom: 8px;"><strong>Ownership:</strong> 50% each partner</p>
        <p style="margin-bottom: 8px;"><strong>Principal Place of Business:</strong> <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.businessAddress || '_________________'}</span></p>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">2. ROLES & RESPONSIBILITIES</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Marketing Partner (${formData.marketingPartnerName || 'Partner 1'}):</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Marketing strategy, sales, and customer acquisition</li>
          <li style="margin-bottom: 5px;">Business development and strategic partnerships</li>
          <li style="margin-bottom: 5px;">Financial management, accounting, and operations</li>
          <li style="margin-bottom: 5px;">Legal compliance, contracts, and regulatory matters</li>
          <li style="margin-bottom: 5px;">Customer support and relationship management</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Technical Partner (${formData.technicalPartnerName || 'Partner 2'}):</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Software development, engineering, and architecture</li>
          <li style="margin-bottom: 5px;">AI technology development and platform infrastructure</li>
          <li style="margin-bottom: 5px;">Technical support, security, and system maintenance</li>
          <li style="margin-bottom: 5px;">Technology research, development, and innovation</li>
          <li style="margin-bottom: 5px;">Data management and privacy compliance</li>
        </ul>

        <p style="margin-bottom: 8px;"><strong>Note:</strong> Partners may delegate responsibilities but remain ultimately accountable for their designated areas.</p>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">3. FINANCIAL TERMS</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Initial Investment:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Marketing Partner (${formData.marketingPartnerName || 'Partner 1'}): $<span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerInvestment ? parseFloat(String(formData.marketingPartnerInvestment)).toLocaleString() : '________________'}</span></li>
          <li style="margin-bottom: 5px;">Technical Partner (${formData.technicalPartnerName || 'Partner 2'}): $<span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerInvestment ? parseFloat(String(formData.technicalPartnerInvestment)).toLocaleString() : '________________'}</span></li>
          <li style="margin-bottom: 5px;"><strong>Total Initial Capital:</strong> $<span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.totalInitialCapital || '________________'}</span></li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Ongoing Financial Contributions:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Additional capital contributions require mutual written agreement</li>
          <li style="margin-bottom: 5px;">If one partner cannot contribute to required capital calls, their ownership percentage may be diluted proportionally</li>
          <li style="margin-bottom: 5px;">If one partner funds additional marketing or other company-related expenses on behalf of the business (when the other partner cannot or chooses not to invest), such contributions shall be recorded as <em>Reimbursable Partner Loans</em>.</li>
          <li style="margin-bottom: 5px;">Reimbursable Partner Loans shall accrue no interest unless otherwise agreed in writing, and shall be repaid to the funding partner from the company's net profits <strong>before</strong> any profit distribution to the other partner occurs.</li>
          <li style="margin-bottom: 5px;">Once the funding partner has been fully reimbursed for such additional investments, net profits shall be distributed in accordance with the standard profit-sharing arrangement described below.</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Profit & Loss Distribution:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;"><strong>Profit Sharing:</strong> 50/50 split of net profits after expenses and after repayment of any outstanding Reimbursable Partner Loans</li>
          <li style="margin-bottom: 5px;"><strong>Loss Sharing:</strong> 50/50 split of any business losses</li>
          <li style="margin-bottom: 5px;"><strong>Distribution Schedule:</strong> Quarterly, within 30 days of quarter-end</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Expense Authorization:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;"><strong>Individual Authority:</strong> Up to $100 per month per partner</li>
          <li style="margin-bottom: 5px;"><strong>Joint Approval Required:</strong> Expenses over $100</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Compensation:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">No initial salaries - income through profit distributions</li>
          <li style="margin-bottom: 5px;">Future salary arrangements require mutual written agreement</li>
          <li style="margin-bottom: 5px;">Partners may take reasonable draws against anticipated profits with mutual consent</li>
        </ul>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">4. DECISION MAKING & AUTHORITY</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Day-to-Day Operations:</h3>
        <p style="margin-bottom: 8px;">Each partner has authority within their designated responsibility areas</p>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Major Decisions Requiring Unanimous Consent:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Employee hiring with annual compensation over $75,000</li>
          <li style="margin-bottom: 5px;">Single expenditures over $10,000</li>
          <li style="margin-bottom: 5px;">Incurring debt or obligations over $5,000</li>
          <li style="margin-bottom: 5px;">Adding new partners or investors</li>
          <li style="margin-bottom: 5px;">Selling, merging, or dissolving the business</li>
          <li style="margin-bottom: 5px;">Contracts exceeding 1 year or $25,000 in value</li>
          <li style="margin-bottom: 5px;">Changing business structure or legal entity</li>
          <li style="margin-bottom: 5px;">Licensing core intellectual property to third parties</li>
          <li style="margin-bottom: 5px;">Opening new business locations or markets</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Deadlock Resolution:</h3>
        <p style="margin-bottom: 8px;">If partners cannot agree on a major decision after 30 days of good faith discussion, the matter will be resolved through mediation.</p>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">5. INTELLECTUAL PROPERTY</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Assignment to Partnership:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">All business-related intellectual property belongs to the partnership</li>
          <li style="margin-bottom: 5px;">Partners assign all relevant existing and future IP to the business</li>
          <li style="margin-bottom: 5px;">Partnership owns all trademarks, copyrights, patents, trade secrets, and proprietary methods</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Pre-Existing IP:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Each partner retains ownership of IP created before this partnership</li>
          <li style="margin-bottom: 5px;">License granted to partnership for any pre-existing IP essential to business operations</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Third-Party IP:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">All third-party IP licenses and agreements require joint approval</li>
          <li style="margin-bottom: 5px;">Partners responsible for ensuring no infringement of existing IP rights</li>
        </ul>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">6. CONFIDENTIALITY & RESTRICTIVE COVENANTS</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Confidentiality:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Perpetual confidentiality obligation for all business information</li>
          <li style="margin-bottom: 5px;">Includes customer lists, financial data, trade secrets, and business strategies</li>
          <li style="margin-bottom: 5px;">Obligation survives partnership termination</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Non-Compete (24 months post-departure):</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Cannot directly compete with Creators Multiverse or similar AI content generation platforms</li>
          <li style="margin-bottom: 5px;">Cannot solicit partnership customers or employees</li>
          <li style="margin-bottom: 5px;">Geographic restriction: United States and any international markets served</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Non-Solicitation (24 months post-departure):</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Cannot hire or attempt to hire partnership employees</li>
          <li style="margin-bottom: 5px;">Cannot solicit customers for competing services</li>
        </ul>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">7. PARTNERSHIP CHANGES & EXIT</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Voluntary Withdrawal:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;"><strong>Notice:</strong> 30 days written notice required</li>
          <li style="margin-bottom: 5px;"><strong>Buyout Right:</strong> Remaining partner may purchase departing partner's interest</li>
          <li style="margin-bottom: 5px;"><strong>Valuation:</strong> Independent business appraisal by certified business valuator</li>
          <li style="margin-bottom: 5px;"><strong>Payment Terms:</strong> 25% at closing, remainder over 36 months at 6% annual interest</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Involuntary Removal:</h3>
        <p style="margin-bottom: 8px;">Partner may be removed for:</p>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Material breach of partnership agreement (30-day cure period)</li>
          <li style="margin-bottom: 5px;">Conviction of felony affecting business reputation</li>
          <li style="margin-bottom: 5px;">Prolonged incapacity (6+ months)</li>
          <li style="margin-bottom: 5px;">Competing with the business</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Death or Disability:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Partnership continues with surviving partner</li>
          <li style="margin-bottom: 5px;">Same valuation and payment terms as voluntary withdrawal</li>
          <li style="margin-bottom: 5px;">Disabled partner's rights transfer to legal representative</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Right of First Refusal:</h3>
        <p style="margin-bottom: 8px;">Any partner wishing to sell their interest must first offer it to the other partner on the same terms as any third-party offer.</p>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">8. DISPUTE RESOLUTION</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Progressive Resolution Process:</h3>
        <ol style="margin-left: 20px;">
          <li style="margin-bottom: 5px;"><strong>Direct Negotiation:</strong> 30 days good faith discussion</li>
          <li style="margin-bottom: 5px;"><strong>Mediation:</strong> Binding mediation with qualified business mediator</li>
          <li style="margin-bottom: 5px;"><strong>Arbitration:</strong> Final binding arbitration under American Arbitration Association rules</li>
          <li style="margin-bottom: 5px;"><strong>Attorney Fees:</strong> Prevailing party entitled to reasonable attorney fees</li>
        </ol>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Jurisdiction:</h3>
        <p style="margin-bottom: 8px;">All disputes governed by the laws of <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.governingState || '________________'}</span> state.</p>

        <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">9. ADDITIONAL PROVISIONS</h2>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Books and Records:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Maintain accurate financial records and business documents</li>
          <li style="margin-bottom: 5px;">Each partner has right to inspect books during reasonable business hours</li>
          <li style="margin-bottom: 5px;">Annual financial statements prepared by qualified accountant</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Insurance:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Maintain appropriate business insurance (general liability, professional liability, cyber liability)</li>
          <li style="margin-bottom: 5px;">Key person life insurance on both partners ($500,000 minimum)</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Banking:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">All business conducted through partnership bank accounts</li>
          <li style="margin-bottom: 5px;">Both partners required to sign checks over $5,000</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Tax Elections:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Partnership files appropriate tax returns</li>
          <li style="margin-bottom: 5px;">Partners receive K-1s for individual tax reporting</li>
          <li style="margin-bottom: 5px;">Tax advisor consultation required for major tax decisions</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Amendment:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Agreement modifications require written consent of both partners</li>
          <li style="margin-bottom: 5px;">No oral modifications binding</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Severability:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">Invalid provisions do not affect remainder of agreement</li>
          <li style="margin-bottom: 5px;">Good faith effort to replace invalid provisions with valid equivalents</li>
        </ul>

        <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 8px; font-weight: bold;">Entire Agreement:</h3>
        <ul style="margin-left: 20px;">
          <li style="margin-bottom: 5px;">This agreement supersedes all prior negotiations and agreements</li>
          <li style="margin-bottom: 5px;">Integration clause - complete agreement between parties</li>
        </ul>

        <div style="margin-top: 40px; page-break-inside: avoid;">
          <h2 style="font-size: 14pt; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 3px;">EXECUTION</h2>

          <p style="margin-bottom: 8px;"><strong>Marketing Partner:</strong></p>
          <p style="margin-bottom: 8px;">Signature: <span style="border-bottom: 1px solid #000; display: inline-block; width: 300px; height: 20px; margin-right: 50px;"></span> Date: <span style="border-bottom: 1px solid #000; display: inline-block; width: 150px; height: 20px;"></span></p>
          <p style="margin-bottom: 8px;">Print Name: <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.marketingPartnerName || '_________________________________'}</span></p>
          <br>

          <p style="margin-bottom: 8px;"><strong>Technical Partner:</strong></p>
          <p style="margin-bottom: 8px;">Signature: <span style="border-bottom: 1px solid #000; display: inline-block; width: 300px; height: 20px; margin-right: 50px;"></span> Date: <span style="border-bottom: 1px solid #000; display: inline-block; width: 150px; height: 20px;"></span></p>
          <p style="margin-bottom: 8px;">Print Name: <span style="background-color: #f0f0f0; padding: 2px 4px; font-weight: bold;">${formData.technicalPartnerName || '_________________________________'}</span></p>
        </div>
      </div>
    `;

    // Configure html2pdf options
    const options = {
      margin: 10,
      filename: `Partnership_Agreement_Creators_Multiverse_${formData.date || 'DRAFT'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generate and download PDF
    html2pdf().set(options).from(container).save();
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
              Download PDF
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
          <h1 className="text-xl font-bold text-center mb-6">PARTNERSHIP AGREEMENT - Creators Multiverse</h1>

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
              <p><strong>Company Name:</strong> Creators Multiverse</p>
              <p><strong>Business Description:</strong> AI-powered content generation platform for social media creators</p>
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
            <Download size={20} />
            Download PDF
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