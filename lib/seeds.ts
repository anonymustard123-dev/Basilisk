import { blankFacility, type Evidence, type Facility } from './model.ts';
const captured = '2026-10-18T16:00:00.000Z';
function source(
  id: string,
  fact: string,
  value: string,
  url: string,
  title: string,
  date: string | null,
  excerpt: string,
  confidence: Evidence['confidence'] = 'high',
): Evidence {
  return {
    id,
    fact,
    value,
    unit: null,
    status: 'verified',
    source_title: title,
    source_url: url,
    document_date: date,
    captured_at: captured,
    page_or_excerpt: excerpt,
    reviewed_by: 'Basilisk seed source audit',
    reviewed_at: captured,
    method: 'primary-source',
    confidence,
    author: 'Basilisk seed research',
    conflict: false,
    category: fact === 'facility identity' ? 'identity' : 'flexibility',
  };
}
function base(
  id: string,
  name: string,
  address: string,
  city: string,
  state: string,
  zip: string,
): Facility {
  return {
    ...blankFacility(name, address, city, state, zip),
    id,
    researched: true,
    pjm: { status: 'likely', utility: null, zone: null, evidence_ids: [] },
    updated_at: captured,
  };
}
const gsk = base(
  'seed-gsk',
  'GSK · Upper Providence',
  '1250 S Collegeville Rd',
  'Collegeville',
  'PA',
  '19426',
);
gsk.operator = 'GlaxoSmithKline LLC';
gsk.aliases = ['GlaxoSmithKline LLC / Upper Providence', 'GlaxoSmithKline', 'GSK'];
gsk.identifiers = { pa_permit: '46-0031G' };
gsk.evidence = [
  source(
    'gsk-1',
    'generator / conversion plan',
    '2,000 kW diesel generator; emissions-control plan approval extended',
    'https://www.pacodeandbulletin.gov/secure/pabulletin/data/vol56/56-20/698c.html',
    'Pennsylvania Bulletin · 46-0031G',
    '2026-05-16',
    'Air Quality / plan approvals. Extension issued April 29, 2026 for SCR, oxidation catalyst and DPF on existing equipment, intended to meet non-emergency requirements.',
  ),
];
gsk.assets = [
  {
    id: 'gsk-diesel',
    type: 'generator',
    description: '2 MW diesel · conversion planned',
    count: 1,
    electrical_kw: 2000,
    bhp_each: null,
    fuel: 'Diesel',
    operation: 'existing',
    permit: 'conversion-planned',
    meter_id: null,
    constraints: 'Completion, current authorization, switchgear and dispatch constraints unknown.',
    evidence_ids: ['gsk-1'],
  },
];
gsk.why =
  'An existing 2 MW generator has a documented emissions-control conversion path aimed at non-emergency use. Completion remains unconfirmed.';
gsk.missing = 'Has the non-emergency conversion been completed and authorized?';
gsk.next_action =
  'Ask facilities for conversion status and the current air authorization, then confirm utility account, PLC and DR history.';
const swarthmore = base(
  'seed-swarthmore',
  'Swarthmore College',
  '500 College Ave',
  'Swarthmore',
  'PA',
  '19081',
);
swarthmore.identifiers = { pa_permit: '23-0030B' };
swarthmore.evidence = [
  source(
    'swarthmore-1',
    'generator / plan approval',
    'Two 2.5 MW natural-gas engines approved, including potential peak shaving / DR',
    'https://www.pacodeandbulletin.gov/secure/pabulletin/data/vol52/52-50/52_50_not.pdf#page=42',
    'Pennsylvania Bulletin · 23-0030B',
    '2022-12-10',
    'Printed p. 7556 / PDF p. 42. Approval issued November 21, 2022. Notice allows potential non-emergency peak shaving and demand-response operation; commissioning is not established.',
  ),
];
swarthmore.assets = [
  {
    id: 'swarthmore-gas',
    type: 'generator',
    description: '2 × 2.5 MW gas · approved, operation unconfirmed',
    count: 2,
    electrical_kw: 5000,
    bhp_each: null,
    fuel: 'Natural gas',
    operation: 'approved',
    permit: 'non-emergency-approved',
    meter_id: null,
    constraints:
      'Historical approval; current permit, commissioning, controls, grid load and existing DR commitments unknown.',
    evidence_ids: ['swarthmore-1'],
  },
];
swarthmore.why =
  'A 5 MW generation plan expressly contemplated demand response. Existing participation and commissioning need confirmation.';
swarthmore.missing = 'Are these engines operating, and are the accounts already committed to DR?';
swarthmore.next_action =
  'Contact campus energy management to confirm commissioning, current permits, PLC and existing CSP agreements.';
swarthmore.target_role = 'Campus energy manager / facilities director';
const lineage = base(
  'seed-lineage',
  'Lineage · Joliet',
  '1101 Cherry Hill Rd',
  'Joliet',
  'IL',
  '60433',
);
lineage.operator = 'Lineage';
lineage.aliases = ['Joliet Cold Storage', 'Lineage Joliet'];
lineage.evidence = [
  source(
    'lineage-1',
    'facility identity',
    'Lineage cold-storage facility at 1101 Cherry Hill Road',
    'https://www.onelineage.com/facilities/joliet',
    'Lineage · Joliet facility',
    null,
    'Operator directory identifies this street address in Joliet, Illinois.',
  ),
  source(
    'lineage-2',
    'generator / construction evidence',
    'Dual 1,500 kW diesel emergency generators',
    'https://www.powerconstruction.net/projects/cold-storage-food-processing/joliet-cold-storage',
    'Power Construction · Joliet Cold Storage',
    null,
    'Design/build project description reports two 1,500 kW diesel emergency generators. Confirm current inventory and project-to-meter match.',
    'medium',
  ),
];
lineage.assets = [
  {
    id: 'lineage-diesel',
    type: 'generator',
    description: '2 × 1.5 MW diesel · emergency use',
    count: 2,
    electrical_kw: 3000,
    bhp_each: null,
    fuel: 'Diesel',
    operation: 'existing',
    permit: 'emergency-only',
    meter_id: null,
    constraints:
      'Builder-reported equipment; current site match and installation need confirmation. Emergency use does not establish compensated DR rights. Solar assets are excluded.',
    evidence_ids: ['lineage-2'],
  },
];
lineage.why =
  'Builder-reported 3 MW emergency generation gives this operating cold-storage site a concrete flexibility research lead.';
lineage.missing = 'Can the generators legally operate for compensated non-emergency DR?';
lineage.next_action =
  'Confirm the exact equipment/site match and obtain air permits, generator nameplates and utility account/PLC data.';
const unfi = base('seed-unfi', 'UNFI · York', '1025 Locust Point Rd', 'York', 'PA', '17406');
unfi.operator = 'United Natural Foods Inc';
unfi.aliases = ['United Natural Foods Inc / Locust Point Rd', 'United Natural Foods'];
unfi.identifiers = { pa_permit: '67-03195' };
unfi.evidence = [
  source(
    'unfi-1',
    'generator / permit inventory',
    '15 emergency diesel engines, 909 bhp each; electrical rating unverified',
    'https://files.dep.state.pa.us/air/AirQuality/AQPortalFiles/Permits/PermitDocuments/1563094%5B67-03195%5D_Issued_v1.pdf#page=41',
    'PA DEP · UNFI operating permit 67-03195',
    '2026-06-08',
    'Permit pp. 4, 41: 15 Caterpillar model-year-2022 emergency engines at 909 bhp each. P. 29 also contains a 600 kW parenthetical in emissions standards; it is not treated as an independently verified alternator nameplate.',
  ),
];
unfi.assets = [
  {
    id: 'unfi-diesel',
    type: 'generator',
    description: '15 diesel engines · 909 bhp each; electrical MW unknown',
    count: 15,
    electrical_kw: null,
    bhp_each: 909,
    fuel: 'Diesel',
    operation: 'existing',
    permit: 'emergency-only',
    meter_id: null,
    constraints:
      'No bhp-to-electric conversion. Current electrical nameplates, operating rights, switchgear and dispatch capacity need diligence.',
    evidence_ids: ['unfi-1'],
  },
];
unfi.why =
  'A recent operating permit documents a substantial emergency-engine inventory. Electrical output and DR operating rights remain unresolved.';
unfi.missing = 'What are the electrical kW ratings and permitted non-emergency operating rights?';
unfi.next_action =
  'Request electrical nameplates and current air-permit review before assigning any usable MW; obtain account/PLC and enrollment history.';
export const seeds: Facility[] = [gsk, swarthmore, lineage, unfi];
