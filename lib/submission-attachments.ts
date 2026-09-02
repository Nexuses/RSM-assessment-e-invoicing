export type SubmissionAttachment = {
  id: string;
  label: string;
  type: "pdf";
  s3Url: string;
};

type SubmissionWithPdf = {
  pdfS3Url: string | null;
  company?: string;
};

export function getSubmissionAttachments(submission: SubmissionWithPdf): SubmissionAttachment[] {
  if (!submission.pdfS3Url) {
    return [];
  }

  const companyLabel = submission.company?.trim() || "Assessment";
  return [
    {
      id: "pdf",
      label: `${companyLabel} report.pdf`,
      type: "pdf",
      s3Url: submission.pdfS3Url,
    },
  ];
}

export function parseS3Url(s3Url: string): { bucket: string; key: string } | null {
  try {
    const url = new URL(s3Url);
    const hostParts = url.hostname.split(".");

    // https://bucket.s3.region.amazonaws.com/key
    if (hostParts.length >= 4 && hostParts[1] === "s3") {
      const bucket = hostParts[0];
      const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
      if (bucket && key) {
        return { bucket, key };
      }
    }

    // https://s3.region.amazonaws.com/bucket/key
    if (hostParts[0] === "s3" && url.pathname.length > 1) {
      const pathParts = url.pathname.replace(/^\//, "").split("/");
      const bucket = pathParts[0];
      const key = decodeURIComponent(pathParts.slice(1).join("/"));
      if (bucket && key) {
        return { bucket, key };
      }
    }
  } catch {
    return null;
  }

  return null;
}
