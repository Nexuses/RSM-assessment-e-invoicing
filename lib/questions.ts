export type ResponseType =
  | 'yesno'
  | 'yesno_details'
  | 'entities'
  | 'text'
  | 'number'
  | 'select'
  | 'select_other'
  | 'select_countries'
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
  /** For yesno_details: label and validation for follow-up list fields */
  detailsKind?: 'countries' | 'branches';
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
    id: 'q6_inbound',
    text: 'What is your estimated annual volume of Purchasing order excluding imports (Inbound)?',
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
    id: 'q9',
    text: 'Do you require e-invoicing compliance for countries other than the UAE?',
    subject: 'Part 2: Volume & Scope',
    responseType: 'select_countries',
    options: [
      { value: 'uae_only', label: 'No, UAE only' },
      { value: 'ksa', label: 'Yes, KSA (ZATCA)' },
      { value: 'global', label: 'Yes, other Global mandates' },
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
    id: 'q9_entities',
    text: 'Entity details (add each legal entity if part of a group)',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'entities',
  },
  {
    id: 'q8',
    text: 'Do you issue invoices from multiple locations or branches?',
    subject: 'Part 2: Volume & Scope',
    responseType: 'select',
    options: [
      { value: '1', label: 'Yes' },
      { value: '0', label: 'No' },
    ],
  },
  {
    id: 'q10',
    text: 'Which ERP or Accounting Software do you currently use?',
    subject: 'Part 3: Technical Readiness',
    responseType: 'select_other',
    options: [
      { value: 'tier1', label: 'SAP / Oracle / Microsoft Dynamics' },
      { value: 'tier2', label: 'Sage / Zoho / QuickBooks / Xero' },
      { value: 'custom', label: 'Legacy/Custom-built ERP' },
      { value: 'manual', label: 'Manual: Excel / Word' },
      { value: 'other', label: 'Other' },
    ],
    placeholder: 'Specify ERP or accounting software',
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
      { value: 'unknown', label: "I don't know" },
    ],
  },
  {
    id: 'q9_8',
    text: 'Who will handle system integration?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'select',
    options: [
      { value: 'customer_team', label: 'Client team' },
      { value: 'vendor', label: 'Vendor' },
      { value: 'require_asp_support', label: 'Require ASP support' },
    ],
  },
  {
    id: 'q9_9',
    text: 'Do you require integration with the ASP platform?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 'q9_12',
    text: 'What type of invoice integration do you require?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'select',
    options: [
      { value: 'sales_only', label: 'Sales invoices only' },
      { value: 'purchase_only', label: 'Purchase invoices only' },
      { value: 'both', label: 'Both sales and purchase invoices' },
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
    id: 'q9_11',
    text: 'Any additional requirements or comments?',
    subject: 'Part 2A: Additional Implementation Inputs',
    responseType: 'text',
    placeholder: 'Enter any additional notes',
  },
];
