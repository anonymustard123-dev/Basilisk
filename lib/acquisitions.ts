import { accepted, type Facility } from './model.ts';

export const money = (value: number | null) =>
  value === null
    ? 'Unknown'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
export function availabilityLabel(f: Facility) {
  return f.acquisition?.availability === 'advertised'
    ? 'Advertised for sale'
    : f.acquisition?.availability === 'off-market'
      ? 'Off Market'
      : f.acquisition?.availability === 'sold'
        ? 'Sold'
        : 'Availability Unverified';
}
export function qualifyingMwLabel(f: Facility) {
  if (f.acquisition?.occupancy === 'vacant') return 'Unknown';
  if (
    f.qualification.mw !== null &&
    accepted(f, f.qualification.evidence_ids, 'qualification').some((e) => e.method === 'buyer')
  )
    return `${f.qualification.mw} MW · buyer confirmed`;
  const a = f.acquisition;
  if (
    a?.qualifying_mw !== null &&
    a?.qualifying_mw !== undefined &&
    a.qualifying_assumption &&
    f.evidence.some(
      (e) =>
        a.qualifying_evidence_ids.includes(e.id) &&
        e.category === 'qualification' &&
        ['verified', 'estimated'].includes(e.status) &&
        !e.conflict,
    )
  )
    return `${a.qualifying_mw} MW · assumption`;
  return 'Unknown';
}
export function economicsBasis(f: Facility): { mw: number; label: string } | null {
  if (qualifyingMwLabel(f) === 'Unknown') return null;
  if (f.qualification.mw !== null)
    return { mw: f.qualification.mw, label: 'Buyer-confirmed capacity' };
  return f.acquisition?.qualifying_mw !== null && f.acquisition?.qualifying_mw !== undefined
    ? { mw: f.acquisition.qualifying_mw, label: f.acquisition.qualifying_assumption }
    : null;
}
export function reductionStatus(f: Facility): 'confirmed' | 'possible' | 'unknown' | 'no' {
  if (f.acquisition?.occupancy === 'vacant') return 'no';
  if (f.acquisition?.reduction === 'no') return 'no';
  if (
    f.acquisition?.reduction === 'confirmed' &&
    accepted(f, f.acquisition.reduction_evidence_ids, 'flexibility').length
  )
    return 'confirmed';
  if (f.assets.some((a) => a.type !== 'solar' && accepted(f, a.evidence_ids, 'flexibility').length))
    return 'possible';
  return f.acquisition?.reduction === 'possible' ? 'possible' : 'unknown';
}
export function readiness(f: Facility) {
  if (
    f.acquisition?.occupancy === 'vacant' ||
    f.pjm.status === 'no' ||
    f.dr.premium === 'incompatible'
  )
    return 'Not Currently Ready';
  const load = f.load.verified_mw !== null && accepted(f, f.load.evidence_ids, 'load').length > 0;
  return load && f.pjm.status === 'verified' && reductionStatus(f) === 'confirmed'
    ? 'Promising'
    : 'Needs Verification';
}
export function featuredAcquisitions(rows: Facility[]) {
  return rows
    .filter(
      (f) => f.acquisition?.featured_order !== null && f.acquisition?.featured_order !== undefined,
    )
    .sort((a, b) => a.acquisition!.featured_order! - b.acquisition!.featured_order!)
    .slice(0, 4);
}
export type AcquisitionFilters = {
  maxPrice: string;
  includeUnknownPrice: boolean;
  minMw: string;
  includeUnknownMw: boolean;
  pjm: 'potential' | 'verified';
  reduction: string;
};
export function matchesAcquisitionFilters(f: Facility, filters: AcquisitionFilters) {
  if (f.pjm.status === 'no' || (filters.pjm === 'verified' && f.pjm.status !== 'verified'))
    return false;
  const price = f.acquisition?.asking_price_usd;
  if (
    filters.maxPrice &&
    (price == null ? !filters.includeUnknownPrice : price > Number(filters.maxPrice))
  )
    return false;
  const reviewed = f.evidence.some(
    (e) =>
      f.load.evidence_ids.includes(e.id) &&
      e.category === 'load' &&
      ['verified', 'estimated'].includes(e.status) &&
      !e.conflict,
  );
  const mw = reviewed ? (f.load.verified_mw ?? f.load.estimated_min_mw) : null;
  if (filters.minMw && (mw === null ? !filters.includeUnknownMw : mw < Number(filters.minMw)))
    return false;
  return !filters.reduction || reductionStatus(f) === filters.reduction;
}
