import type { NextApiRequest, NextApiResponse } from "next";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/lib/db";
import { parseS3Url } from "@/lib/submission-attachments";
import {
  isAuthenticatedRequest,
  isSubmissionsPasswordConfigured,
} from "@/lib/submissions-auth";

const SIGNED_URL_EXPIRY_SECONDS = 60 * 15;

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

  const submissionId = typeof req.query.submissionId === "string" ? req.query.submissionId : "";
  if (!submissionId) {
    return res.status(400).json({ message: "submissionId is required." });
  }

  const submission = await db.assessmentSubmission.findUnique({
    where: { id: submissionId },
    select: { pdfS3Url: true, company: true },
  });

  if (!submission?.pdfS3Url) {
    return res.status(404).json({ message: "No PDF attachment found for this submission." });
  }

  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
    return res.status(500).json({ message: "AWS S3 is not configured." });
  }

  const parsed = parseS3Url(submission.pdfS3Url);
  if (!parsed) {
    return res.status(400).json({ message: "Invalid stored PDF URL." });
  }

  const s3Client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  const command = new GetObjectCommand({
    Bucket: parsed.bucket || bucketName,
    Key: parsed.key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_EXPIRY_SECONDS,
    });

    const companyLabel = submission.company?.trim() || "Assessment";
    return res.status(200).json({
      url,
      fileName: `${companyLabel} report.pdf`,
      contentType: "application/pdf",
    });
  } catch {
    return res.status(500).json({ message: "Failed to generate signed URL." });
  }
}
