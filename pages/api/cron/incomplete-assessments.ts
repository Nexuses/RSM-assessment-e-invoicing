import type { NextApiRequest, NextApiResponse } from "next";
import { processIncompleteAssessments } from "@/lib/incomplete-assessments";

function isAuthorized(req: NextApiRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.authorization;
  if (header === `Bearer ${secret}`) return true;

  const querySecret = req.query.secret;
  if (typeof querySecret === "string" && querySecret === secret) return true;

  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await processIncompleteAssessments();
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("incomplete-assessments cron error:", error);
    return res.status(500).json({
      message: "Failed to process incomplete assessments.",
    });
  }
}
