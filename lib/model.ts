import { z } from 'zod';

export const stages = [
  'Research lead',
  'Ready for outreach',
  'Contacted',
  'Buyer reviewing',
  'Qualified / under agreement',
  'Disqualified',
  'Deprioritized',
] as const;
export const pjmStates = [
  'PA',
  'IL',
  'OH',
  'NJ',
  'MD',
  'DE',
  'VA',
  'WV',
  'DC',
  'NC',
  'KY',
  'IN',
  'MI',
  'TN',
] as const;
const text = z.string().trim().max(5000);
export const publicUrl = z
  .string()
  .url()
  .max(2000)
  .refine((value) => {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.hostname.includes(':') &&
      !/^(localhost|.*\.local|.*\.internal|127\..*|10\..*|192\.168\..*|169\.254\..*|172\.(1[6-9]|2\d|3[01])\..*|\d+(\.\d+){0,3})$/i.test(
        u.hostname,
      )
    );
  }, 'Use a public HTTPS source URL');
export const evidenceSchema = z.object({
  id: z.string().min(1).max(100),
  fact: text.min(1),
  value: z.union([text, z.number()]),
  unit: z.string().max(50).nullable().default(null),
  status: z.enum(['verified', 'estimated', 'inferred', 'unknown', 'contradicted', 'suggested']),
  source_title: text.min(1),
  source_url: publicUrl,
  document_date: z.string().max(40).nullable(),
  captured_at: z.string().datetime(),
  page_or_excerpt: text,
  reviewed_by: z.string().max(200).nullable().default(null),
  reviewed_at: z.string().datetime().nullable().default(null),
  method: z.enum([
    'primary-source',
    'independent-research',
    'automated',
    'ai',
    'customer',
    'buyer',
  ]),
  confidence: z.enum(['high', 'medium', 'low']),
  author: z.string().max(200),
  conflict: z.boolean().default(false),
  category: z
    .enum(['identity', 'pjm', 'load', 'dr-history', 'flexibility', 'qualification', 'other'])
    .default('other'),
});
export type Evidence = z.infer<typeof evidenceSchema>;
export const assetSchema = z.object({
  id: z.string().max(100),
  type: z.enum(['generator', 'battery', 'load-drop', 'solar']),
  description: text,
  count: z.number().int().positive().max(10000).nullable(),
  electrical_kw: z.number().nonnegative().max(1000000).nullable(),
  bhp_each: z.number().nonnegative().nullable(),
  fuel: z.string().max(100),
  operation: z.enum(['existing', 'approved', 'unknown']),
  permit: z.enum(['emergency-only', 'conversion-planned', 'non-emergency-approved', 'unknown']),
  meter_id: z.string().max(100).nullable(),
  constraints: text,
  evidence_ids: z.array(z.string()).max(30),
});
export const acquisitionSchema = z.object({
  source_id: z.string().min(1).max(200),
  listing_url: publicUrl,
  featured_order: z.number().int().min(1).max(4).nullable().default(null),
  asking_price_usd: z.number().nonnegative().nullable(),
  price_status: z.enum(['listed', 'disputed', 'last-reported', 'unverified']),
  alternate_price_usd: z.number().nonnegative().nullable().default(null),
  building_sqft: z.number().positive().nullable(),
  area_status: z.enum(['reported', 'approximate', 'disputed']),
  property_type: z.string().max(250),
  occupancy: z.enum(['occupied', 'vacant', 'former-use', 'unknown']),
  availability: z.enum(['advertised', 'unverified', 'off-market', 'sold']),
  checked_at: z.string().datetime().nullable(),
  verification_notes: text,
  qualifying_mw: z.number().nonnegative().nullable().default(null),
  qualifying_assumption: text.default(''),
  qualifying_evidence_ids: z.array(z.string()).max(30).default([]),
  reduction: z.enum(['confirmed', 'possible', 'unknown', 'no']).default('unknown'),
  reduction_evidence_ids: z.array(z.string()).max(30).default([]),
});
export type Acquisition = z.infer<typeof acquisitionSchema>;
export const facilitySchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(250),
  operator: z.string().max(250),
  aliases: z.array(z.string().max(250)).max(20).default([]),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(150),
  state: z.string().regex(/^[A-Z]{2}$/),
  postal_code: z.string().max(20),
  identifiers: z.record(z.string().max(200)).default({}),
  origin: z.enum(['Independent research', 'Automated discovery', 'AI research']),
  researched: z.boolean().default(false),
  acquisition: acquisitionSchema.nullable().default(null),
  pjm: z.object({
    status: z.enum(['verified', 'likely', 'unknown', 'no']),
    utility: z.string().max(150).nullable(),
    zone: z.string().max(150).nullable(),
    evidence_ids: z.array(z.string()).max(30),
  }),
  load: z.object({
    verified_mw: z.number().nonnegative().max(100000).nullable(),
    estimated_min_mw: z.number().nonnegative().max(100000).nullable(),
    estimated_max_mw: z.number().nonnegative().max(100000).nullable(),
    evidence_ids: z.array(z.string()).max(30),
  }),
  dr: z.object({
    status: z.enum(['never enrolled', 'prior participation', 'currently enrolled', 'unknown']),
    as_of: z.string().max(40).nullable(),
    program: z.string().max(250).nullable(),
    account_ref: z.string().max(100).nullable(),
    confidence: z.enum(['high', 'medium', 'low']),
    premium: z.enum(['unknown', 'buyer-review', 'incompatible', 'exception-confirmed']),
    evidence_ids: z.array(z.string()).max(30),
  }),
  assets: z
    .array(assetSchema)
    .max(100)
    .refine(
      (rows) => new Set(rows.map((r) => r.id)).size === rows.length,
      'Asset IDs must be unique',
    ),
  evidence: z
    .array(evidenceSchema)
    .max(200)
    .refine(
      (rows) => new Set(rows.map((r) => r.id)).size === rows.length,
      'Claim IDs must be unique',
    ),
  qualification: z.object({
    mw: z.number().nonnegative().max(100000).nullable(),
    buyer: z.string().max(200).nullable(),
    confirmed_at: z.string().max(40).nullable(),
    account_ref: z.string().max(100).nullable(),
    evidence_ids: z.array(z.string()).max(30),
  }),
  stage: z.enum(stages),
  notes: text.default(''),
  why: text,
  missing: text,
  next_action: text,
  target_role: z.string().max(200),
  checklist: z.array(z.string().max(100)).max(12).default([]),
  updated_at: z.string().datetime(),
});
export type Facility = z.infer<typeof facilitySchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Stage = Facility['stage'];
export const blankFacility = (
  name: string,
  address: string,
  city: string,
  state: string,
  postal_code = '',
): Facility => ({
  id: crypto.randomUUID(),
  name,
  operator: name,
  aliases: [],
  address,
  city,
  state,
  postal_code,
  identifiers: {},
  origin: 'Independent research',
  researched: false,
  acquisition: null,
  pjm: { status: 'unknown', utility: null, zone: null, evidence_ids: [] },
  load: { verified_mw: null, estimated_min_mw: null, estimated_max_mw: null, evidence_ids: [] },
  dr: {
    status: 'unknown',
    as_of: null,
    program: null,
    account_ref: null,
    confidence: 'low',
    premium: 'unknown',
    evidence_ids: [],
  },
  assets: [],
  evidence: [],
  qualification: { mw: null, buyer: null, confirmed_at: null, account_ref: null, evidence_ids: [] },
  stage: 'Research lead',
  notes: '',
  why: 'Site identity supplied; demand-response potential needs research.',
  missing: 'Site-specific load and flexibility evidence.',
  next_action: 'Request operator introduction and a recent utility bill.',
  target_role: 'Facilities director / energy manager',
  checklist: [],
  updated_at: new Date().toISOString(),
});
export function accepted(f: Facility, ids: string[], category?: Evidence['category']) {
  return f.evidence.filter(
    (e) =>
      ids.includes(e.id) &&
      e.status === 'verified' &&
      !e.conflict &&
      (!category || e.category === category),
  );
}
export function validateDecisions(f: Facility) {
  const has = (ids: string[], category: Evidence['category']) =>
    accepted(f, ids, category).length > 0;
  if (f.acquisition?.qualifying_mw !== null && f.acquisition?.qualifying_mw !== undefined) {
    if (
      !f.acquisition.qualifying_assumption.trim() ||
      !f.evidence.some(
        (e) =>
          f.acquisition!.qualifying_evidence_ids.includes(e.id) &&
          e.category === 'qualification' &&
          ['verified', 'estimated'].includes(e.status) &&
          !e.conflict,
      )
    )
      throw new Error(
        'Estimated qualifying MW needs an explicit assumption and reviewed qualification evidence.',
      );
  }
  if (
    f.acquisition?.reduction === 'confirmed' &&
    !has(f.acquisition.reduction_evidence_ids, 'flexibility')
  )
    throw new Error('Confirmed reduction needs reviewed flexibility evidence.');
  if (
    ['verified', 'no'].includes(f.pjm.status) &&
    (!has(f.pjm.evidence_ids, 'pjm') || !f.pjm.utility || !f.pjm.zone)
  )
    throw new Error('PJM confirmation needs reviewed site/account evidence, utility and zone.');
  if (f.load.verified_mw !== null && !has(f.load.evidence_ids, 'load'))
    throw new Error('Verified load needs reviewed load evidence.');
  if (
    (f.load.estimated_min_mw !== null || f.load.estimated_max_mw !== null) &&
    !f.load.evidence_ids.some((id) =>
      f.evidence.some(
        (e) =>
          e.id === id &&
          e.category === 'load' &&
          ['verified', 'estimated'].includes(e.status) &&
          !e.conflict,
      ),
    )
  )
    throw new Error('Estimated load needs reviewed load evidence.');
  if (
    f.load.estimated_min_mw !== null &&
    f.load.estimated_max_mw !== null &&
    f.load.estimated_min_mw > f.load.estimated_max_mw
  )
    throw new Error('Estimated load range is reversed.');
  const drProof = accepted(f, f.dr.evidence_ids, 'dr-history').some((e) =>
    ['buyer', 'customer'].includes(e.method),
  );
  if (
    (f.dr.status !== 'unknown' || f.dr.premium !== 'unknown') &&
    (!drProof || !f.dr.account_ref || !f.dr.as_of || !f.dr.program)
  )
    throw new Error(
      'DR history needs dated, account-scoped buyer/customer confirmation and program scope.',
    );
  if (f.qualification.mw !== null || f.stage === 'Qualified / under agreement') {
    if (f.acquisition?.occupancy === 'vacant')
      throw new Error(
        'A vacant property cannot be treated as currently qualified; confirm active load and occupancy first.',
      );
    if (
      f.qualification.mw === null ||
      !f.qualification.buyer ||
      !f.qualification.confirmed_at ||
      !f.qualification.account_ref ||
      !accepted(f, f.qualification.evidence_ids, 'qualification').some((e) => e.method === 'buyer')
    )
      throw new Error(
        'Qualification requires buyer-confirmed MW, date, account and reviewed buyer evidence.',
      );
    if (f.pjm.status !== 'verified' || f.dr.premium === 'incompatible')
      throw new Error('Resolve PJM and buyer eligibility before qualification.');
  }
  if (['Disqualified', 'Deprioritized'].includes(f.stage) && !f.notes.trim())
    throw new Error('Provide the reason in notes.');
  return f;
}
/** Withdraw stale conclusions when supporting evidence is contradicted or conflicts. */
export function reconcileDecisions(f: Facility): Facility {
  if (['verified', 'no'].includes(f.pjm.status) && !accepted(f, f.pjm.evidence_ids, 'pjm').length)
    f.pjm = { ...f.pjm, status: 'unknown' };
  if (f.load.verified_mw !== null && !accepted(f, f.load.evidence_ids, 'load').length)
    f.load = { ...f.load, verified_mw: null };
  if (
    !f.evidence.some(
      (e) =>
        f.load.evidence_ids.includes(e.id) &&
        e.category === 'load' &&
        ['verified', 'estimated'].includes(e.status) &&
        !e.conflict,
    )
  )
    f.load = { ...f.load, estimated_min_mw: null, estimated_max_mw: null };
  if (
    !accepted(f, f.dr.evidence_ids, 'dr-history').some((e) =>
      ['buyer', 'customer'].includes(e.method),
    )
  )
    f.dr = { ...f.dr, status: 'unknown', premium: 'unknown', confidence: 'low' };
  if (
    f.qualification.mw !== null &&
    (!accepted(f, f.qualification.evidence_ids, 'qualification').some(
      (e) => e.method === 'buyer',
    ) ||
      f.pjm.status !== 'verified')
  ) {
    f.qualification = { ...f.qualification, mw: null };
    if (f.stage === 'Qualified / under agreement') f.stage = 'Buyer reviewing';
  }
  return f;
}
export function appendEvidence(f: Facility, claim: Evidence): Facility {
  const conflicts = f.evidence.some(
    (e) => e.fact === claim.fact && String(e.value) !== String(claim.value),
  );
  f.evidence = [
    ...f.evidence.map((e) => (conflicts && e.fact === claim.fact ? { ...e, conflict: true } : e)),
    { ...claim, conflict: claim.conflict || conflicts },
  ];
  return reconcileDecisions(f);
}
