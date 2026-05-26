export type EntityRecord = {
  legalName: string;
  trn: string;
  turnoverBand: string;
  salesInvoicesPerYear: string;
  purchaseInvoicesPerYear: string;
  ftaPilotAdoption: string;
};

export const FTA_PILOT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'planning', label: 'Planning voluntary adoption by July 2026' },
  { value: 'not_sure', label: 'Not sure' },
] as const;

export const TURNOVER_BAND_OPTIONS = [
  { value: 'gt_50m', label: 'Greater than AED 50M (Phase 1)' },
  { value: 'lt_50m', label: 'Less than AED 50M (Phase 2)' },
  { value: 'not_registered_vat', label: 'Not registered for VAT' },
  { value: 'unknown', label: 'Not sure / To be confirmed' },
] as const;

export function createEmptyEntity(): EntityRecord {
  return {
    legalName: '',
    trn: '',
    turnoverBand: '',
    salesInvoicesPerYear: '',
    purchaseInvoicesPerYear: '',
    ftaPilotAdoption: '',
  };
}

export function parseEntities(value: string): EntityRecord[] | null {
  if (!value?.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => ({
      legalName: typeof item?.legalName === 'string' ? item.legalName : '',
      trn: typeof item?.trn === 'string' ? item.trn : '',
      turnoverBand: typeof item?.turnoverBand === 'string' ? item.turnoverBand : '',
      salesInvoicesPerYear:
        typeof item?.salesInvoicesPerYear === 'string'
          ? item.salesInvoicesPerYear
          : String(item?.salesInvoicesPerYear ?? ''),
      purchaseInvoicesPerYear:
        typeof item?.purchaseInvoicesPerYear === 'string'
          ? item.purchaseInvoicesPerYear
          : String(item?.purchaseInvoicesPerYear ?? ''),
      ftaPilotAdoption:
        typeof item?.ftaPilotAdoption === 'string' ? item.ftaPilotAdoption : '',
    }));
  } catch {
    return null;
  }
}

export function stringifyEntities(entities: EntityRecord[]): string {
  return JSON.stringify(entities);
}

export function getEntitiesList(value: string): EntityRecord[] {
  const parsed = parseEntities(value);
  return parsed && parsed.length > 0 ? parsed : [createEmptyEntity()];
}

export function validateEntities(value: string): string | null {
  const entities = getEntitiesList(value);

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const label = `Entity #${i + 1}`;

    if (!entity.legalName.trim()) {
      return `${label}: Entity legal name is required.`;
    }
    if (entity.trn.trim() && !/^\d{15}$/.test(entity.trn.trim())) {
      return `${label}: TRN must be 15 digits when provided.`;
    }
    if (!entity.turnoverBand) {
      return `${label}: Please select an annual turnover band.`;
    }
    if (!entity.salesInvoicesPerYear.trim()) {
      return `${label}: Sales invoices per year is required.`;
    }
    if (!entity.purchaseInvoicesPerYear.trim()) {
      return `${label}: Purchase invoices per year is required.`;
    }
    if (!entity.ftaPilotAdoption) {
      return `${label}: Please select FTA pilot / voluntary adoption status.`;
    }
    const sales = Number(entity.salesInvoicesPerYear);
    const purchase = Number(entity.purchaseInvoicesPerYear);
    if (Number.isNaN(sales) || sales < 0) {
      return `${label}: Enter a valid sales invoices per year value.`;
    }
    if (Number.isNaN(purchase) || purchase < 0) {
      return `${label}: Enter a valid purchase invoices per year value.`;
    }
  }

  return null;
}

export function formatEntitiesDisplay(value: string): string {
  const entities = parseEntities(value);
  if (!entities?.length) return 'Not answered';

  return entities
    .map((entity, index) => {
      const turnover =
        TURNOVER_BAND_OPTIONS.find((o) => o.value === entity.turnoverBand)?.label ||
        entity.turnoverBand ||
        '—';
      const trn = entity.trn.trim() ? entity.trn.trim() : '—';
      const ftaPilot =
        FTA_PILOT_OPTIONS.find((o) => o.value === entity.ftaPilotAdoption)?.label ||
        entity.ftaPilotAdoption ||
        '—';
      return [
        `Entity ${index + 1}: ${entity.legalName.trim()}`,
        `TRN: ${trn}`,
        `Turnover: ${turnover}`,
        `Sales invoices/year (B2B & B2G): ${entity.salesInvoicesPerYear.trim()}`,
        `Purchase invoices/year: ${entity.purchaseInvoicesPerYear.trim()}`,
        `FTA pilot / voluntary adoption by Jul 2026: ${ftaPilot}`,
      ].join(' | ');
    })
    .join('\n');
}
