"use client";

import { Button } from "@/components/ui/button";

type Props = {
  total: number;
  page: number;
  pageSize: number;
  start: number;
  end: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function SubmissionsPagination({
  total,
  page,
  pageSize,
  start,
  end,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        {total === 0 ? "Showing 0 of 0" : `Showing ${start}–${end} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Rows per page
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009CD9]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="px-2 text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
