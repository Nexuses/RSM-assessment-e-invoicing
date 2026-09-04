import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { DRAFT_STATUS } from "@/lib/assessment-drafts";
import {
  getInternalAssessmentRecipients,
  getReplyToEmail,
} from "@/lib/email-config";

const INCOMPLETE_AFTER_MS = 30 * 60 * 1000;

function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "https://www.rsm.global/uae/service/e-invoicing";
}

function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.FROM_EMAIL
  );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function processIncompleteAssessments(): Promise<{
  due: number;
  notified: number;
  failed: number;
}> {
  if (!process.env.DATABASE_URL) {
    console.warn("processIncompleteAssessments: DATABASE_URL not set");
    return { due: 0, notified: 0, failed: 0 };
  }

  if (!isSmtpConfigured()) {
    console.warn("processIncompleteAssessments: SMTP not configured");
    return { due: 0, notified: 0, failed: 0 };
  }

  const cutoff = new Date(Date.now() - INCOMPLETE_AFTER_MS);
  const drafts = await db.assessmentDraft.findMany({
    where: {
      status: DRAFT_STATUS.IN_PROGRESS,
      reminderSentAt: null,
      startedAt: { lte: cutoff },
    },
    orderBy: { startedAt: "asc" },
    take: 50,
  });

  if (drafts.length === 0) {
    return { due: 0, notified: 0, failed: 0 };
  }

  const transporter = createTransporter();
  const appUrl = getAppUrl();
  const replyTo = getReplyToEmail();
  const teamRecipients = getInternalAssessmentRecipients();
  let notified = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      const startedLabel = draft.startedAt.toISOString();
      const safeName = escapeHtml(draft.name);
      const safeCompany = escapeHtml(draft.company);
      const safeEmail = escapeHtml(draft.email);

      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: draft.email,
        replyTo,
        subject: "Your RSM e-invoicing assessment is incomplete",
        html: `
          <p>Dear ${safeName},</p>
          <p>You started the RSM UAE e-invoicing readiness assessment for <strong>${safeCompany}</strong>, but it looks like it was not completed.</p>
          <p>You can resume and finish the assessment here:</p>
          <p><a href="${appUrl}">${appUrl}</a></p>
          <p>If you already completed it in another session, you can ignore this message.</p>
          <p>Kind regards,<br/>RSM UAE</p>
        `,
      });

      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: teamRecipients,
        replyTo,
        subject: `Incomplete e-invoicing assessment – ${draft.company}`,
        html: `
          <p>An assessment was started but not completed within 30 minutes.</p>
          <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;">
            <tr><td><strong>Name</strong></td><td>${safeName}</td></tr>
            <tr><td><strong>Email</strong></td><td>${safeEmail}</td></tr>
            <tr><td><strong>Company</strong></td><td>${safeCompany}</td></tr>
            <tr><td><strong>Position</strong></td><td>${escapeHtml(draft.position)}</td></tr>
            <tr><td><strong>Started at (UTC)</strong></td><td>${startedLabel}</td></tr>
            <tr><td><strong>Last question index</strong></td><td>${draft.currentQuestion}</td></tr>
            <tr><td><strong>Draft ID</strong></td><td>${draft.id}</td></tr>
          </table>
        `,
      });

      await db.assessmentDraft.update({
        where: { id: draft.id },
        data: { reminderSentAt: new Date() },
      });
      notified += 1;
    } catch (error) {
      failed += 1;
      console.error(
        "Failed to send incomplete assessment reminder for draft",
        draft.id,
        error,
      );
    }
  }

  return { due: drafts.length, notified, failed };
}
