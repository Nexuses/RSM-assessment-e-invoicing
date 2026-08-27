import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import {
  isAuthenticatedRequest,
  isSubmissionsPasswordConfigured,
} from "@/lib/submissions-auth";
import {
  buildAssessmentSubmissionsCsv,
  buildConsultationRequestsCsv,
} from "@/lib/submissions-csv";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!isSubmissionsPasswordConfigured()) {
    return res.status(500).json({ message: "SUBMISSIONS_PASSWORD is not configured." });
  }

  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const type = typeof req.query.type === "string" ? req.query.type : "assessments";

  if (type !== "assessments" && type !== "consultations") {
    return res.status(400).json({
      message: 'Invalid type. Use "assessments" or "consultations".',
    });
  }

  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "consultations") {
    const consultations = await db.consultationRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    const csv = buildConsultationRequestsCsv(consultations);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="consultation-requests-${stamp}.csv"`,
    );
    return res.status(200).send(csv);
  }

  const assessments = await db.assessmentSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
  const csv = buildAssessmentSubmissionsCsv(assessments);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="assessment-submissions-${stamp}.csv"`,
  );
  return res.status(200).send(csv);
}
