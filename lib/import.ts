import { z } from 'zod';
import {
  acquisitionSchema,
  blankFacility,
  facilitySchema,
  publicUrl,
  type Facility,
} from './model';
import { availabilityLabel, qualifyingMwLabel } from './acquisitions';
export const importSchema = z.object({
  version: z.literal(1),
  facilities: z.array(facilitySchema).min(1).max(100),
});
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
export function parseImport(input: string, format: 'json' | 'csv'): Facility[] {
  if (Buffer.byteLength(input, 'utf8') > 1_000_000)
    throw new Error('Research imports must be under 1 MB.');
  let facilities: Facility[];
  if (format === 'json') facilities = importSchema.parse(JSON.parse(input)).facilities;
  else {
    const [headers, ...rows] = parseCsv(input.replace(/^\uFEFF/, ''));
    if (!headers) throw new Error('CSV is empty.');
    const required = [
      'name',
      'address',
      'city',
      'state',
      'postal_code',
      'fact',
      'value',
      'source_title',
      'source_url',
      'document_date',
      'page_or_excerpt',
      'author',
    ];
    if (required.some((h) => !headers.includes(h)))
      throw new Error(`CSV requires: ${required.join(', ')}`);
    if (!rows.length || rows.length > 100) throw new Error('Import 1–100 CSV rows at a time.');
    facilities = rows.map((row) => {
      const r = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']));
      const f = blankFacility(r.name, r.address, r.city, r.state.toUpperCase(), r.postal_code);
      f.researched = true;
      if (r.listing_url) {
        f.acquisition = acquisitionSchema.parse({
          source_id: r.listing_id || r.listing_url,
          listing_url: r.listing_url,
          asking_price_usd: r.asking_price_usd ? Number(r.asking_price_usd) : null,
          price_status: 'unverified',
          building_sqft: r.building_sqft ? Number(r.building_sqft) : null,
          area_status: 'reported',
          property_type: r.property_type || 'Industrial',
          occupancy: r.occupancy || 'unknown',
          availability: 'unverified',
          checked_at: null,
          verification_notes: 'Imported listing details need human source and broker verification.',
        });
        f.identifiers.listing = f.acquisition.source_id;
      }
      f.evidence = [
        {
          id: crypto.randomUUID(),
          fact: r.fact,
          value: r.value,
          unit: null,
          status: 'suggested',
          source_title: r.source_title,
          source_url: publicUrl.parse(r.source_url),
          document_date: r.document_date || null,
          captured_at: new Date().toISOString(),
          page_or_excerpt: r.page_or_excerpt,
          reviewed_by: null,
          reviewed_at: null,
          method: 'independent-research',
          confidence: 'low',
          author: r.author,
          conflict: false,
          category: 'other',
        },
      ];
      if (r.next_action) f.next_action = r.next_action;
      if (r.missing) f.missing = r.missing;
      if (r.why) f.why = r.why;
      return facilitySchema.parse(f);
    });
  }
  // Imports cannot self-certify eligibility, retain customer documents, or overwrite CRM.
  return facilities.map(
    (f) =>
      ({
        ...f,
        id: crypto.randomUUID(),
        origin: 'Independent research',
        researched: true,
        stage: 'Research lead',
        notes: '',
        checklist: [],
        acquisition: f.acquisition
          ? {
              ...f.acquisition,
              featured_order: null,
              availability: 'unverified',
              price_status: 'unverified',
              checked_at: null,
              qualifying_mw: null,
              qualifying_assumption: '',
              qualifying_evidence_ids: [],
              reduction: f.acquisition.reduction === 'no' ? 'no' : 'unknown',
              reduction_evidence_ids: [],
            }
          : null,
        pjm: { status: 'unknown', utility: f.pjm.utility, zone: f.pjm.zone, evidence_ids: [] },
        load: {
          verified_mw: null,
          estimated_min_mw: null,
          estimated_max_mw: null,
          evidence_ids: [],
        },
        dr: blankFacility('x', 'x', 'x', 'PA').dr,
        qualification: blankFacility('x', 'x', 'x', 'PA').qualification,
        evidence: f.evidence.map((e) => ({
          ...e,
          status: 'suggested',
          reviewed_by: null,
          reviewed_at: null,
          method: e.method === 'ai' ? 'ai' : 'independent-research',
        })),
        updated_at: new Date().toISOString(),
      }) as Facility,
  );
}
export function csvCell(value: unknown) {
  const v = String(value ?? '');
  return `"${(/^\s*[=+\-@]|^[\t\r\n]/.test(v) ? "'" : '') + v.replaceAll('"', '""')}"`;
}
export function exportCsv(rows: Facility[]) {
  return [
    [
      'Facility',
      'Address',
      'PJM',
      'Load MW',
      'Flexibility evidence',
      'DR history',
      'Buyer-qualified MW',
      'Next action',
      'Sources',
      'Asking price USD',
      'Price status',
      'Building SF',
      'Availability',
      'Estimated qualifying MW',
      'Listing URL',
    ],
    ...rows.map((f) => [
      f.name,
      `${f.address}, ${f.city}, ${f.state} ${f.postal_code}`,
      f.pjm.status,
      f.load.verified_mw ?? 'Unknown',
      f.assets.map((a) => a.description).join('; '),
      f.dr.status,
      f.qualification.mw ?? 'Unknown',
      f.next_action,
      f.evidence.map((e) => e.source_url).join(' | '),
      f.acquisition?.asking_price_usd ?? 'Unknown',
      f.acquisition?.price_status ?? '',
      f.acquisition?.building_sqft ?? 'Unknown',
      f.acquisition ? availabilityLabel(f) : '',
      qualifyingMwLabel(f),
      f.acquisition?.listing_url ?? '',
    ]),
  ]
    .map((r) => r.map(csvCell).join(','))
    .join('\r\n');
}
