export type ResponseType =
  | 'yesno'
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'ynlist';

export type Question = {
  id: string;
  text: string;
  subject: string; // Technical / Commercial / Scope & Departmental Involvement / etc.
  responseType: ResponseType;
  options?: Array<{ value: string; label: string }>; // For yesno, select, multiselect
  placeholder?: string; // For text and number inputs
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
};

export const questionsData: Question[] = [
  {
    id: 'q2',
    text: "What is your entity's approximate Annual Aggregate Turnover?",
    subject: 'Part 1: Mandate Applicability',
    responseType: 'select',
    options: [
      { value: 'gt_50m', label: 'Greater than AED 50 Million (Likely Phase 1)' },
      { value: 'lt_50m', label: 'Less than AED 50 Million (Likely Phase 2)' },
      { value: 'not_registered_vat', label: 'Not Registered for VAT' },
    ],
  },
  {
    id: 'q1',
    text: 'Where is your business entity legally established?',
    subject: 'Part 1: Mandate Applicability',
    responseType: 'select',
    options: [
      { value: 'uae_mainland', label: 'UAE Mainland' },
      { value: 'uae_free_zone', label: 'UAE Free Zone' },
      { value: 'outside_uae', label: 'Outside UAE (Non-Resident)' },
    ],
  },
  {
    id: 'q3',
    text: 'What is the nature of your primary transactions? (Select all that apply)',
    subject: 'Part 1: Mandate Applicability',
    responseType: 'multiselect',
    options: [
      { value: 'b2b', label: 'B2B (Business to Business)' },
      { value: 'b2g', label: 'B2G (Business to Government)' },
      { value: 'b2c', label: 'B2C (Business to Consumer)' },
    ],
  },
  {
    id: 'q4',
    text: 'Do you operate in any of the following exempt or special sectors?',
    subject: 'Part 1: Mandate Applicability',
    responseType: 'select',
    options: [
      { value: 'financial_services', label: 'Financial Services / Banking' },
      { value: 'passenger_transport', label: 'Passenger Transport Services' },
      { value: 'healthcare_education', label: 'Healthcare / Education' },
      { value: 'general_trading', label: 'None of the above (General Trading/Services/Manufacturing)' },
    ],
  },
  {
    id: 'q5',
    text: 'Are you currently registered for VAT in the UAE?',
    subject: 'Part 1: Mandate Applicability',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
  },
  {
    id: 'q6',
    text: 'What is your estimated annual volume of Sales Invoices (Outbound)?',
    subject: 'Part 2: Volume & Scope',
    responseType: 'select',
    options: [
      { value: 'lt_1k', label: 'Less than 1,000 invoices/year' },
      { value: '1k_10k', label: '1,000 - 10,000 invoices/year' },
      { value: '10k_100k', label: '10,000 - 100,000 invoices/year' },
      { value: 'gt_100k', label: '100,000+ invoices/year' },
    ],
  },
  {
    id: 'q7',
    text: 'How many distinct Legal Entities (Tax Registration Numbers) need to be onboarded?',
    subject: 'Part 2: Volume & Scope',
    responseType: 'select',
    options: [
      { value: 'single_trn', label: 'Single Entity (1 TRN)' },
      { value: 'multiple_trn', label: 'Multiple Entities (Separate TRNs)' },
      { value: 'tax_group', label: 'Tax Group (1 TRN for multiple entities)' },
    ],
  },
  {
    id: 'q8',
    text: 'Do you issue invoices from multiple locations or branches?',
    subject: 'Part 2: Volume & Scope',
    responseType: 'yesno',
    options: [
      { value: '0', label: 'No, centralized invoicing' },
      { value: '1', label: 'Yes, multiple branches issuing independently' },
    ],
  },
  {
    id: 'q9',
    text: 'Do you require e-invoicing compliance for countries other than the UAE?',
    subject: 'Part 2: Volume & Scope',
    responseType: 'select',
    options: [
      { value: 'uae_only', label: 'No, UAE only' },
      { value: 'ksa', label: 'Yes, KSA (ZATCA)' },
      { value: 'global', label: 'Yes, other Global mandates' },
    ],
  },
  {
    id: 'q9_1',
    text: 'Company Name (list all entities if part of a group)',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'text',
    placeholder: 'Enter company name(s) and entity list',
  },
  {
    id: 'q9_2',
    text: 'Are any entities part of the FTA pilot or planning voluntary adoption by July 2026? (If yes, specify entities)',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'text',
    placeholder: 'Enter Yes/No and entity names if applicable',
  },
  {
    id: 'q9_3',
    text: 'Number of entities with revenue above AED 50M (Phase 1)',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'number',
    placeholder: 'Enter number of entities',
    validation: { min: 0 },
  },
  {
    id: 'q9_4',
    text: 'Number of entities with revenue below AED 50M (Phase 2)',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'number',
    placeholder: 'Enter number of entities',
    validation: { min: 0 },
  },
  {
    id: 'q9_5',
    text: 'Estimated number of sales invoices per year (B2B & B2G) per entity',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'number',
    placeholder: 'Enter estimated annual sales invoices per entity',
    validation: { min: 0 },
  },
  {
    id: 'q9_6',
    text: 'Estimated number of purchase invoices per year (excluding imports) per entity',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'number',
    placeholder: 'Enter estimated annual purchase invoices per entity',
    validation: { min: 0 },
  },
  {
    id: 'q9_7',
    text: 'Which ERP or invoicing systems are currently used?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'text',
    placeholder: 'List ERP and invoicing systems in use',
  },
  {
    id: 'q9_8',
    text: 'Who will handle system integration?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'select',
    options: [
      { value: 'customer_team', label: 'Customer team' },
      { value: 'vendor', label: 'Vendor' },
      { value: 'require_asp_support', label: 'Require ASP support' },
    ],
  },
  {
    id: 'q9_9',
    text: 'Do you need purchase invoice (AP) integration with ERP?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'select',
    options: [
      { value: 'full_integration', label: 'Full integration' },
      { value: 'dashboard_manual', label: 'Dashboard only (manual entry)' },
    ],
  },
  {
    id: 'q9_10',
    text: 'Do you have e-invoicing requirements in other countries? (If yes, specify countries)',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'text',
    placeholder: 'Enter Yes/No and country names if applicable',
  },
  {
    id: 'q9_11',
    text: 'Any additional requirements or comments?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'text',
    placeholder: 'Enter any additional notes',
  },
  {
    id: 'q10',
    text: 'Which ERP or Accounting Software do you currently use?',
    subject: 'Part 3: Technical Readiness',
    responseType: 'select',
    options: [
      { value: 'tier1', label: 'Tier 1: SAP / Oracle / Microsoft Dynamics' },
      { value: 'tier2', label: 'Tier 2/Cloud: Sage / Zoho / QuickBooks / Xero' },
      { value: 'custom', label: 'Legacy/Custom-built ERP' },
      { value: 'manual', label: 'Manual: Excel / Word' },
    ],
  },
  {
    id: 'q11',
    text: 'Does your current system support API connectivity?',
    subject: 'Part 3: Technical Readiness',
    responseType: 'select',
    options: [
      { value: 'api', label: 'Yes, REST/SOAP APIs are available' },
      { value: 'sftp', label: 'No, we use SFTP / File exports (CSV/XML)' },
      { value: 'manual', label: 'No, Manual Only' },
    ],
  },
  {
    id: 'q12',
    text: 'Where is your invoice data currently hosted (Data Residency)?',
    subject: 'Part 3: Technical Readiness',
    responseType: 'select',
    options: [
      { value: 'cloud_uae', label: 'Cloud (UAE Region)' },
      { value: 'cloud_global', label: 'Cloud (Global/Outside UAE)' },
      { value: 'onprem_uae', label: 'On-Premise Server (UAE)' },
      { value: 'local', label: 'Local Computers/Laptops' },
    ],
  },
  {
    id: 'q13',
    text: 'Do you have an internal IT team capable of managing system integration?',
    subject: 'Part 3: Technical Readiness',
    responseType: 'select',
    options: [
      { value: 'inhouse', label: 'Yes, in-house team' },
      { value: 'external', label: 'No, we rely on an external vendor' },
      { value: 'none', label: 'No IT resources available' },
    ],
  },
  {
    id: 'q14',
    text: 'Do you handle "Self-Billing" (generating invoices on behalf of suppliers)?',
    subject: 'Part 4: Invoice Complexity',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
  },
  {
    id: 'q15',
    text: 'Do you have transactions involving the "Reverse Charge Mechanism" (RCM)?',
    subject: 'Part 4: Invoice Complexity',
    responseType: 'yesno',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
  },
  {
    id: 'q16',
    text: 'How many different invoice templates/formats do you actively use?',
    subject: 'Part 4: Invoice Complexity',
    responseType: 'select',
    options: [
      { value: 'one', label: '1 Standard Template' },
      { value: 'two_to_five', label: '2-5 Variations' },
      { value: 'five_plus', label: '5+ Complex Templates' },
    ],
  },
  {
    id: 'q17',
    text: 'What is your preferred integration model?',
    subject: 'Part 4: Invoice Complexity',
    responseType: 'select',
    options: [
      { value: 'full', label: 'Full Integration' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'manual', label: 'Manual' },
    ],
  },
];
