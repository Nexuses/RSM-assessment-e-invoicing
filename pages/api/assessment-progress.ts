import type { NextApiRequest, NextApiResponse } from "next";
import {
  createOrReuseDraft,
  DRAFT_STATUS,
  updateDraftProgress,
  type DraftStatus,
} from "@/lib/assessment-drafts";

type PersonalInfoBody = {
  name?: string;
  email?: string;
  company?: string;
  position?: string;
  phone?: string;
  website?: string;
};

function requireDbConfigured(res: NextApiResponse): boolean {
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ message: "Database is not configured." });
    return false;
  }
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireDbConfigured(res)) return;

  try {
    if (req.method === "POST") {
      const personalInfo = (req.body?.personalInfo || req.body) as PersonalInfoBody;
      if (
        !personalInfo?.name?.trim() ||
        !personalInfo?.email?.trim() ||
        !personalInfo?.company?.trim() ||
        !personalInfo?.position?.trim()
      ) {
        return res.status(400).json({
          message: "name, email, company, and position are required.",
        });
      }

      const draft = await createOrReuseDraft({
        name: personalInfo.name.trim(),
        email: personalInfo.email.trim(),
        company: personalInfo.company.trim(),
        position: personalInfo.position.trim(),
        phone: personalInfo.phone?.trim() || "",
        website: personalInfo.website?.trim() || "",
      });

      return res.status(200).json({ draftId: draft.id, status: draft.status });
    }

    if (req.method === "PATCH") {
      const {
        draftId,
        answers,
        currentQuestion,
        status,
      } = req.body as {
        draftId?: string;
        answers?: Record<string, string>;
        currentQuestion?: number;
        status?: DraftStatus;
      };

      if (!draftId || typeof draftId !== "string") {
        return res.status(400).json({ message: "draftId is required." });
      }

      if (
        status &&
        status !== DRAFT_STATUS.IN_PROGRESS &&
        status !== DRAFT_STATUS.COMPLETED &&
        status !== DRAFT_STATUS.OUT_OF_SCOPE
      ) {
        return res.status(400).json({ message: "Invalid status." });
      }

      const draft = await updateDraftProgress(draftId, {
        answers,
        currentQuestion:
          typeof currentQuestion === "number" ? currentQuestion : undefined,
        status,
      });

      return res.status(200).json({
        draftId: draft.id,
        status: draft.status,
        currentQuestion: draft.currentQuestion,
      });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (error) {
    console.error("assessment-progress error:", error);
    return res.status(500).json({
      message: "Failed to save assessment progress.",
    });
  }
}
