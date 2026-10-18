import { accepted, type Facility } from './model';
// These are research-priority points, never eligibility or a capacity estimate.
export const WEIGHTS = { pjm: 15, load: 25, flexibility: 40, history: 20 };
export function priority(f: Facility) {
  const pjm =
    f.pjm.status === 'verified' && accepted(f, f.pjm.evidence_ids, 'pjm').length
      ? WEIGHTS.pjm
      : f.pjm.status === 'likely'
        ? 5
        : 0;
  const proof = accepted(f, f.load.evidence_ids, 'load').length > 0;
  const mw = proof ? f.load.verified_mw : null;
  const estimated = f.evidence.some(
    (e) =>
      f.load.evidence_ids.includes(e.id) &&
      e.category === 'load' &&
      ['verified', 'estimated'].includes(e.status) &&
      !e.conflict,
  );
  const load =
    mw !== null
      ? mw >= 3
        ? 25
        : mw >= 1
          ? 20
          : 5
      : estimated && f.load.estimated_min_mw !== null
        ? f.load.estimated_min_mw >= 3
          ? 10
          : 5
        : 0;
  const strongest = f.assets
    .filter((a) => a.type !== 'solar' && accepted(f, a.evidence_ids, 'flexibility').length)
    .map((a) => {
      const base = a.operation === 'existing' ? 20 : a.operation === 'approved' ? 14 : 8;
      return Math.min(
        WEIGHTS.flexibility,
        base +
          (a.permit === 'non-emergency-approved' ? 10 : 0) +
          (a.type === 'load-drop' || a.type === 'battery' ? 5 : 0) +
          (a.electrical_kw !== null && a.electrical_kw >= 1000 ? 5 : 0),
      );
    });
  const flexibility = Math.max(0, ...strongest);
  const history =
    accepted(f, f.dr.evidence_ids, 'dr-history').some((e) =>
      ['buyer', 'customer'].includes(e.method),
    ) && f.dr.status === 'never enrolled'
      ? WEIGHTS.history
      : 0;
  const excluded = f.pjm.status === 'no';
  const review =
    f.dr.premium === 'incompatible' ||
    ['prior participation', 'currently enrolled'].includes(f.dr.status);
  return {
    score: excluded ? 0 : pjm + load + flexibility + history,
    parts: { pjm, load, flexibility, history },
    excluded,
    review,
    label: excluded
      ? 'Outside PJM'
      : f.dr.premium === 'incompatible'
        ? 'Buyer exception required'
        : 'Research priority',
  };
}
export const loadLabel = (f: Facility) =>
  f.load.verified_mw !== null && accepted(f, f.load.evidence_ids, 'load').length
    ? `${f.load.verified_mw} MW verified`
    : f.load.estimated_min_mw !== null &&
        f.evidence.some(
          (e) =>
            f.load.evidence_ids.includes(e.id) &&
            e.category === 'load' &&
            ['verified', 'estimated'].includes(e.status) &&
            !e.conflict,
        )
      ? `${f.load.estimated_min_mw}–${f.load.estimated_max_mw ?? '?'} MW estimated`
      : 'Unknown';
export const capacityLabel = (f: Facility) =>
  f.qualification.mw === null
    ? 'Unknown — buyer diligence required'
    : `${f.qualification.mw} MW · buyer confirmed`;
export function assetLabel(f: Facility) {
  return f.assets.length
    ? f.assets.map((a) => a.description).join(' · ')
    : 'Unknown — research flexibility';
}
