export type YesNoDetailsAnswer = {
  choice: '0' | '1';
  countries?: string[];
};

function normalizeCountries(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((c) => (typeof c === 'string' ? c : String(c)));
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((c) => c.trim());
  }
  return [];
}

export function parseYesNoDetails(value: string): YesNoDetailsAnswer | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value) as Partial<YesNoDetailsAnswer> & { countries?: unknown };
    if (parsed.choice === '0' || parsed.choice === '1') {
      return {
        choice: parsed.choice,
        countries: normalizeCountries(parsed.countries),
      };
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}

export function getCountriesList(details: YesNoDetailsAnswer | null): string[] {
  if (!details || details.choice !== '1') return [''];
  const list = details.countries ?? [];
  return list.length > 0 ? list : [''];
}

export function stringifyYesNoDetails(data: YesNoDetailsAnswer): string {
  return JSON.stringify({
    choice: data.choice,
    countries:
      data.choice === '1'
        ? (data.countries ?? []).map((c) => c.trim())
        : [],
  });
}

export function hasAtLeastOneCountry(details: YesNoDetailsAnswer | null): boolean {
  if (!details || details.choice !== '1') return false;
  return (details.countries ?? []).some((c) => c.trim().length > 0);
}

export function formatYesNoDetailsDisplay(
  value: string,
  detailsKind: 'countries' | 'branches' = 'countries',
): string {
  const parsed = parseYesNoDetails(value);
  if (!parsed) return value || 'Not answered';
  if (parsed.choice === '0') {
    return detailsKind === 'branches' ? 'No, centralized invoicing' : 'No';
  }
  const items = (parsed.countries ?? []).map((c) => c.trim()).filter(Boolean);
  if (detailsKind === 'branches') {
    return items.length > 0
      ? `Yes, multiple branches — ${items.join(', ')}`
      : 'Yes, multiple branches issuing independently';
  }
  return items.length > 0 ? `Yes — ${items.join(', ')}` : 'Yes';
}
