"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronRight, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSubmissionAttachments } from "@/lib/submission-attachments";
import { SubmissionDetailPanel } from "@/components/submissions/submission-detail-panel";
import { cn } from "@/lib/utils";

type FormattedAnswer = {
  questionId: string;
  question: string;
  subject: string;
  answer: string;
};

export type AssessmentRow = {
  id: string;
  createdAt: string;
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
  pdfS3Url: string | null;
  formattedAnswers: FormattedAnswer[];
};

type Props = {
  rows: AssessmentRow[];
  loading: boolean;
  totalCount: number;
  hasActiveFilters: boolean;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onOpenAttachments: (submission: AssessmentRow) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoadingSkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell colSpan={7}>
            <Skeleton className="h-10 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function SubmissionsTable({
  rows,
  loading,
  totalCount,
  hasActiveFilters,
  expandedId,
  onToggleExpand,
  onOpenAttachments,
}: Props) {
  const emptyMessage =
    totalCount === 0
      ? "No assessments yet."
      : hasActiveFilters
        ? "No assessments match your filters."
        : "No assessments yet.";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="min-w-[180px] text-xs uppercase tracking-wide text-slate-500">
                Contact
              </TableHead>
              <TableHead className="min-w-[160px] text-xs uppercase tracking-wide text-slate-500">
                Company
              </TableHead>
              <TableHead className="min-w-[140px] text-xs uppercase tracking-wide text-slate-500">
                Submitted
              </TableHead>
              <TableHead className="min-w-[120px] text-xs uppercase tracking-wide text-slate-500">
                Score
              </TableHead>
              <TableHead className="min-w-[100px] text-xs uppercase tracking-wide text-slate-500">
                Eligibility
              </TableHead>
              <TableHead className="min-w-[90px] text-xs uppercase tracking-wide text-slate-500">
                Attachments
              </TableHead>
              <TableHead className="w-12 text-xs uppercase tracking-wide text-slate-500">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingSkeletonRows />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const attachments = getSubmissionAttachments(row);
                const isExpanded = expandedId === row.id;

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-slate-50/80",
                        isExpanded && "bg-slate-50/60",
                      )}
                      onClick={() => onToggleExpand(row.id)}
                    >
                      <TableCell>
                        <p className="font-medium text-[#1b3a57]">{row.name}</p>
                        <p className="truncate text-sm text-slate-600">{row.email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900">{row.company}</p>
                        <p className="truncate text-sm text-slate-600">{row.position}</p>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell>
                        <p className="text-lg font-semibold text-[#3F9C35]">{row.totalScore}</p>
                        <p className="truncate text-xs text-slate-500">
                          {row.urgencyCategory} · {row.complexityCategory}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-semibold",
                            row.eligible
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {row.eligible ? "Eligible" : "Not eligible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attachments.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 px-2 text-[#009CD9] hover:bg-[#e6f5fc] hover:text-[#0077a3]"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenAttachments(row);
                            }}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {attachments.length}
                          </Button>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500"
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleExpand(row.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0">
                          <SubmissionDetailPanel
                            formattedAnswers={row.formattedAnswers}
                            urgencyScore={row.urgencyScore}
                            urgencyCategory={row.urgencyCategory}
                            complexityScore={row.complexityScore}
                            complexityCategory={row.complexityCategory}
                            phone={row.phone}
                            website={row.website}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
