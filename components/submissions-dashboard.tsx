"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttachmentViewer } from "@/components/submissions/attachment-viewer";
import { SubmissionsPagination } from "@/components/submissions/submissions-pagination";
import { SubmissionsTable, type AssessmentRow } from "@/components/submissions/submissions-table";
import {
  DEFAULT_FILTER_STATE,
  SubmissionsToolbar,
} from "@/components/submissions/submissions-toolbar";
import { SubmissionsPageHeader } from "@/components/submissions/submissions-page-header";
import { getSubmissionAttachments } from "@/lib/submission-attachments";
import {
  filterAssessments,
  getDistinctCategories,
  getPaginationMeta,
  getYearOptions,
  hasActiveFilters,
  paginateRows,
  type SubmissionsFilterState,
} from "@/lib/submissions-filters";

type SubmissionResponse = {
  assessments: AssessmentRow[];
};

type Props = {
  isConfigured: boolean;
  initialAuthenticated: boolean;
};

const DEFAULT_PAGE_SIZE = 25;

export function SubmissionsDashboard({ isConfigured, initialAuthenticated }: Props) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [filters, setFilters] = useState<SubmissionsFilterState>(DEFAULT_FILTER_STATE);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(initialAuthenticated);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse>({ assessments: [] });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSubmission, setViewerSubmission] = useState<AssessmentRow | null>(null);

  useEffect(() => {
    if (authenticated && isConfigured) {
      void loadSubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, isConfigured]);

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  const filteredAssessments = useMemo(
    () => filterAssessments(submissions.assessments, filters),
    [submissions.assessments, filters],
  );

  useEffect(() => {
    const meta = getPaginationMeta(filteredAssessments.length, page, pageSize);
    if (meta.safePage && meta.safePage !== page) {
      setPage(meta.safePage);
    }
  }, [filteredAssessments.length, page, pageSize]);

  const paginationMeta = useMemo(
    () => getPaginationMeta(filteredAssessments.length, page, pageSize),
    [filteredAssessments.length, page, pageSize],
  );

  const paginatedAssessments = useMemo(
    () => paginateRows(filteredAssessments, paginationMeta.safePage ?? page, pageSize),
    [filteredAssessments, paginationMeta.safePage, page, pageSize],
  );

  const { urgency: urgencyCategories, complexity: complexityCategories } = useMemo(
    () => getDistinctCategories(submissions.assessments),
    [submissions.assessments],
  );

  const yearOptions = useMemo(
    () => getYearOptions(submissions.assessments),
    [submissions.assessments],
  );

  const filtersActive = hasActiveFilters(filters);

  async function loadSubmissions() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to load submissions.");
      }

      setSubmissions(data as SubmissionResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load submissions.";
      setError(message);
      if (message === "Unauthorized.") {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/submissions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setAuthenticated(true);
      setPassword("");
      await loadSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/submissions/logout", { method: "POST" });
    setAuthenticated(false);
    setExpandedId(null);
    setSubmissions({ assessments: [] });
    setFilters(DEFAULT_FILTER_STATE);
    setPage(1);
    setViewerOpen(false);
    setViewerSubmission(null);
    setError(null);
  }

  async function handleDownloadCsv() {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/submissions/export");

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download CSV.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] || "assessment-submissions.csv";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download CSV.";
      setError(message);
      if (message === "Unauthorized.") {
        setAuthenticated(false);
      }
    } finally {
      setExporting(false);
    }
  }

  function handleClearFilters() {
    setFilters(DEFAULT_FILTER_STATE);
    setPage(1);
  }

  function handleToggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  function handleOpenAttachments(submission: AssessmentRow) {
    setViewerSubmission(submission);
    setViewerOpen(true);
  }

  if (!isConfigured) {
    return (
      <Card className="border-[#009CD9]/20 shadow-lg">
        <CardHeader className="space-y-4">
          <SubmissionsPageHeader
            title="Submissions"
            subtitle="Set `SUBMISSIONS_PASSWORD` in your environment before using this page."
            size="compact"
          />
        </CardHeader>
      </Card>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-[#009CD9]/20 shadow-lg">
          <CardHeader className="space-y-4">
            <SubmissionsPageHeader
              title="Submissions Login"
              subtitle="Enter the shared admin password to view received submissions."
              size="compact"
            />
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter submissions password"
                autoComplete="current-password"
                className="focus-visible:ring-[#009CD9]"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                type="submit"
                className="w-full bg-[#009CD9] text-white hover:bg-[#0077a3]"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const viewerAttachments = viewerSubmission
    ? getSubmissionAttachments(viewerSubmission)
    : [];

  return (
    <div className="space-y-4">
      <SubmissionsToolbar
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={filtersActive}
        urgencyCategories={urgencyCategories}
        complexityCategories={complexityCategories}
        yearOptions={yearOptions}
        loading={loading}
        exporting={exporting}
        onRefresh={() => void loadSubmissions()}
        onDownloadCsv={() => void handleDownloadCsv()}
        onLogout={() => void handleLogout()}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <SubmissionsTable
        rows={paginatedAssessments}
        loading={loading}
        totalCount={submissions.assessments.length}
        hasActiveFilters={filtersActive}
        expandedId={expandedId}
        onToggleExpand={handleToggleExpand}
        onOpenAttachments={handleOpenAttachments}
      />

      {!loading && filteredAssessments.length > 0 ? (
        <SubmissionsPagination
          total={filteredAssessments.length}
          page={paginationMeta.safePage ?? page}
          pageSize={pageSize}
          start={paginationMeta.start}
          end={paginationMeta.end}
          totalPages={paginationMeta.totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      {viewerSubmission ? (
        <AttachmentViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          submissionId={viewerSubmission.id}
          attachments={viewerAttachments}
        />
      ) : null}
    </div>
  );
}
