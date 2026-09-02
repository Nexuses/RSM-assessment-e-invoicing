"use client";

import { ChevronDown, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_FILTER_STATE,
  MONTH_LABELS,
  type SubmissionsFilterState,
} from "@/lib/submissions-filters";
import { cn } from "@/lib/utils";

type Props = {
  filters: SubmissionsFilterState;
  onFiltersChange: (filters: SubmissionsFilterState) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  urgencyCategories: string[];
  complexityCategories: string[];
  yearOptions: number[];
  loading: boolean;
  exporting: boolean;
  onRefresh: () => void;
  onDownloadCsv: () => void;
  onLogout: () => void;
};

function FilterSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009CD9]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function PopoverSelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm normal-case tracking-normal text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009CD9]"
      >
        {children}
      </select>
    </label>
  );
}

export function SubmissionsToolbar({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  urgencyCategories,
  complexityCategories,
  yearOptions,
  loading,
  exporting,
  onRefresh,
  onDownloadCsv,
  onLogout,
}: Props) {
  function updateFilters(partial: Partial<SubmissionsFilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  const popoverFiltersActive =
    filters.eligibility !== "all" ||
    filters.hasPdf !== "all" ||
    filters.urgencyCategory !== "all" ||
    filters.complexityCategory !== "all";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold text-[#1b3a57]">Submissions</h1>
        <p className="mt-1 text-sm text-slate-600">
          View all received assessment submissions.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => updateFilters({ search: event.target.value })}
              placeholder="Search assessments..."
              className="h-9 bg-white pl-9 pr-9 focus-visible:ring-[#009CD9]"
            />
            {filters.search ? (
              <button
                type="button"
                onClick={() => updateFilters({ search: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <FilterSelect
            value={filters.month ?? "all"}
            onChange={(value) =>
              updateFilters({ month: value === "all" ? null : Number(value) })
            }
            className="w-[130px]"
          >
            <option value="all">All months</option>
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={filters.year ?? "all"}
            onChange={(value) =>
              updateFilters({ year: value === "all" ? null : Number(value) })
            }
            className="w-[110px]"
          >
            <option value="all">All years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </FilterSelect>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 gap-2",
                  popoverFiltersActive &&
                    "border-[#009CD9]/40 bg-[#e6f5fc] text-[#1b3a57]",
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-4 p-4">
              <PopoverSelectField
                label="Eligibility"
                value={filters.eligibility}
                onChange={(value) =>
                  updateFilters({
                    eligibility: value as SubmissionsFilterState["eligibility"],
                  })
                }
              >
                <option value="all">All</option>
                <option value="eligible">Eligible</option>
                <option value="not_eligible">Not eligible</option>
              </PopoverSelectField>

              <PopoverSelectField
                label="PDF attachment"
                value={filters.hasPdf}
                onChange={(value) =>
                  updateFilters({
                    hasPdf: value as SubmissionsFilterState["hasPdf"],
                  })
                }
              >
                <option value="all">All</option>
                <option value="yes">Has PDF</option>
                <option value="no">No PDF</option>
              </PopoverSelectField>

              <PopoverSelectField
                label="Urgency category"
                value={filters.urgencyCategory}
                onChange={(value) => updateFilters({ urgencyCategory: value })}
              >
                <option value="all">All</option>
                {urgencyCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </PopoverSelectField>

              <PopoverSelectField
                label="Complexity category"
                value={filters.complexityCategory}
                onChange={(value) => updateFilters({ complexityCategory: value })}
              >
                <option value="all">All</option>
                {complexityCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </PopoverSelectField>
            </PopoverContent>
          </Popover>

          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 text-slate-600">
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className="h-9" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outline"
            className="h-9"
            onClick={onDownloadCsv}
            disabled={exporting || loading}
          >
            {exporting ? "Downloading..." : "Download CSV"}
          </Button>
          <Button
            onClick={onLogout}
            className="h-9 bg-[#1b3a57] text-white hover:bg-[#12273c]"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_FILTER_STATE };
