const DEFAULT_INQUIRY_EMAIL = 'e-invoice-inquiry@rsm.ae';

const DEFAULT_CONSULTATION_RECIPIENTS =
  'anisha@cs.rsm.ae, GRC-Inquiry@RSM.ae, rsm-tech-aaaahib5qyhpf2k6egbqwrugwa@nexuses.slack.com';

/** RSM inquiry / contact email (reply-to, internal notifications, UI). */
export function getInquiryEmail(): string {
  return (
    process.env.RSM_INQUIRY_EMAIL ||
    process.env.NEXT_PUBLIC_RSM_INQUIRY_EMAIL ||
    DEFAULT_INQUIRY_EMAIL
  );
}

/** Reply-To address for outgoing emails. Defaults to inquiry email. */
export function getReplyToEmail(): string {
  return process.env.REPLY_TO_EMAIL || getInquiryEmail();
}

/** Recipient for internal assessment submission notifications. */
export function getInternalAssessmentRecipients(): string {
  return process.env.INTERNAL_ASSESSMENT_RECIPIENTS || getInquiryEmail();
}

/** Comma-separated recipients for consultation booking admin notifications. */
export function getConsultationRecipients(): string {
  return process.env.CONSULTATION_RECIPIENTS || DEFAULT_CONSULTATION_RECIPIENTS;
}

/** Client-safe inquiry email for mailto links and on-page contact text. */
export const PUBLIC_INQUIRY_EMAIL =
  process.env.NEXT_PUBLIC_RSM_INQUIRY_EMAIL ||
  process.env.RSM_INQUIRY_EMAIL ||
  DEFAULT_INQUIRY_EMAIL;
