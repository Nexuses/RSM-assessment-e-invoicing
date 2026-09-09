import { questionsData } from "@/lib/questions";
import { formatAnswerValue } from "@/lib/submission-format";

type AssessmentRow = {
  id: string;
  createdAt: Date | string;
  name: string;
  email: string;
  company: string;
  position: string;
  phone: string | null;
  website: string | null;
  totalScore: number;
  urgencyScore: number;
  urgencyCategory: string;
  complexityScore: number;
  complexityCategory: string;
  eligible: boolean;
  answers: unknown;
  pdfS3Url: string | null;
};

type ConsultationRow = {
  id: string;
  createdAt: Date | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  score: number | null;
};

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toIsoDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function questionHeader(question: (typeof questionsData)[number]): string {
  const qNum = question.id.replace(/^q/i, "");
  const cleanText = (question.text || "").replace(/\s+/g, " ").trim();
  const label = `Q${qNum} - ${cleanText}`;
  return label.length > 140 ? `${label.slice(0, 137)}...` : label;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

export function buildAssessmentSubmissionsCsv(rows: AssessmentRow[]): string {
  const headers = [
    "Timestamp",
    "Name",
    "Email",
    "Company",
    "Position",
    "Phone",
    "Website",
    "Total Score",
    "Axis A (Urgency) Score",
    "Axis A Category",
    "Axis B (Complexity) Score",
    "Axis B Category",
    "Eligible",
    "PDF S3 Link",
    ...questionsData.map(questionHeader),
  ];

  const csvRows = rows.map((item) => {
    const answers = (item.answers ?? {}) as Record<string, string>;
    return [
      toIsoDate(item.createdAt),
      item.name,
      item.email,
      item.company,
      item.position,
      item.phone || "",
      item.website || "",
      item.totalScore,
      item.urgencyScore,
      item.urgencyCategory,
      item.complexityScore,
      item.complexityCategory,
      item.eligible ? "Yes" : "No",
      item.pdfS3Url || "",
      ...questionsData.map((question) => formatAnswerValue(question.id, answers[question.id])),
    ];
  });

  return buildCsv(headers, csvRows.map((row) => row.map((value) => String(value))));
}

export function buildConsultationRequestsCsv(rows: ConsultationRow[]): string {
  const headers = [
    "Timestamp",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Company",
    "Score",
  ];

  const csvRows = rows.map((item) => [
    toIsoDate(item.createdAt),
    item.firstName,
    item.lastName,
    item.email,
    item.phone || "",
    item.company || "",
    item.score === null || item.score === undefined ? "" : String(item.score),
  ]);

  return buildCsv(headers, csvRows);
}
