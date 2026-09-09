export type EligibilityFilter = "all" | "eligible" | "not_eligible";

export type HasPdfFilter = "all" | "yes" | "no";

export type SubmissionsFilterState = {
  search: string;
  month: number | null;
  year: number | null;
  eligibility: EligibilityFilter;
  hasPdf: HasPdfFilter;
  urgencyCategory: string;
  complexityCategory: string;
};

export type AssessmentFilterRow = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  company: string;
  position: string;
  eligible: boolean;
  pdfS3Url: string | null;
  urgencyCategory: string;
  complexityCategory: string;
};

export const DEFAULT_FILTER_STATE: SubmissionsFilterState = {
  search: "",
  month: null,
  year: null,
  eligibility: "all",
  hasPdf: "all",
  urgencyCategory: "all",
  complexityCategory: "all",
};

export function hasActiveFilters(filters: SubmissionsFilterState): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.month !== null ||
    filters.year !== null ||
    filters.eligibility !== "all" ||
    filters.hasPdf !== "all" ||
    filters.urgencyCategory !== "all" ||
    filters.complexityCategory !== "all"
  );
}

function matchesSearch(row: AssessmentFilterRow, query: string): boolean {
  if (!query) return true;
  const haystack = [row.name, row.email, row.company, row.position]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesDate(row: AssessmentFilterRow, filters: SubmissionsFilterState): boolean {
  const created = new Date(row.createdAt);

  if (filters.year !== null && created.getFullYear() !== filters.year) {
    return false;
  }

  if (filters.month !== null && created.getMonth() !== filters.month) {
    return false;
  }

  return true;
}

export function filterAssessments<T extends AssessmentFilterRow>(
  rows: T[],
  filters: SubmissionsFilterState,
): T[] {
  const query = filters.search.trim().toLowerCase();

  return rows.filter((row) => {
    if (!matchesSearch(row, query)) return false;
    if (!matchesDate(row, filters)) return false;

    if (filters.eligibility === "eligible" && !row.eligible) return false;
    if (filters.eligibility === "not_eligible" && row.eligible) return false;

    if (filters.hasPdf === "yes" && !row.pdfS3Url) return false;
    if (filters.hasPdf === "no" && row.pdfS3Url) return false;

    if (filters.urgencyCategory !== "all" && row.urgencyCategory !== filters.urgencyCategory) {
      return false;
    }

    if (
      filters.complexityCategory !== "all" &&
      row.complexityCategory !== filters.complexityCategory
    ) {
      return false;
    }

    return true;
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function getPaginationMeta(total: number, page: number, pageSize: number) {
  if (total === 0) {
    return { start: 0, end: 0, totalPages: 1 };
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return { start, end, totalPages, safePage };
}

export function getDistinctCategories(rows: AssessmentFilterRow[]) {
  const urgency = Array.from(new Set(rows.map((row) => row.urgencyCategory))).sort();
  const complexity = Array.from(new Set(rows.map((row) => row.complexityCategory))).sort();
  return { urgency, complexity };
}

export function getYearOptions(rows: AssessmentFilterRow[]): number[] {
  const years = rows.map((row) => new Date(row.createdAt).getFullYear());
  const currentYear = new Date().getFullYear();
  const uniqueYears = Array.from(new Set([currentYear, ...years])).sort((a, b) => b - a);
  return uniqueYears;
}

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
