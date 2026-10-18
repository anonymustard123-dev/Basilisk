import { describe, it, expect } from 'vitest';
import {
  appendEvidence,
  blankFacility,
  facilitySchema,
  reconcileDecisions,
  validateDecisions,
} from '@/lib/model';
import { seeds } from '@/lib/seeds';
import { assetLabel, capacityLabel, priority } from '@/lib/scoring';
import { mergeFacility, sameSite } from '@/lib/identity';
import { csvCell, parseCsv, parseImport } from '@/lib/import';
import { normalizePublic } from '@/lib/providers';

const clone = <T>(value: T): T => structuredClone(value);
describe('four real sourced seeds', () => {
  it('has exactly the four named candidates with validated schemas and no qualified capacity', () => {
    expect(seeds).toHaveLength(4);
    for (const f of seeds) {
      expect(facilitySchema.parse(f)).toBeTruthy();
      expect(f.stage).toBe('Research lead');
      expect(f.load.verified_mw).toBeNull();
      expect(f.qualification.mw).toBeNull();
      expect(f.dr.status).toBe('unknown');
      expect(f.evidence.every((e) => e.source_url.startsWith('https://'))).toBe(true);
    }
  });
  it.each(['PA', 'IL'])('does not verify PJM from a %s address', (state) => {
    const f = blankFacility('Example', '100 Main St', 'Example', state);
    expect(f.pjm.status).toBe('unknown');
    expect(priority(f).parts.pjm).toBe(0);
    f.pjm.status = 'verified';
    expect(() => validateDecisions(f)).toThrow(/evidence/);
  });
  it('preserves unknown history when public records have no DR match', () => {
    const f = normalizePublic(
      [
        {
          facility_name: 'GSK',
          street_address: '1250 S Collegeville Rd',
          city_name: 'Collegeville',
          state_abbr: 'PA',
        },
      ],
      { provider: 'epa-tri', state: 'PA', pages: 1, radius: 25 },
      'https://data.epa.gov/example',
    )[0];
    expect(f.dr.status).toBe('unknown');
    expect(f.load.verified_mw).toBeNull();
  });
  it('does not add 20 MW grid load to 15 MW generation', () => {
    const f = clone(seeds[0]);
    f.load.verified_mw = 20;
    f.load.evidence_ids = ['gsk-1'];
    f.assets[0].electrical_kw = 15000;
    expect(capacityLabel(f)).toContain('Unknown');
    expect(f.qualification.mw).toBeNull();
    expect(priority(f).score).toBeLessThan(100);
  });
  it('keeps UNFI bhp separate from electrical output', () => {
    const f = seeds.find((f) => f.id === 'seed-unfi')!;
    expect(f.assets[0].bhp_each).toBe(909);
    expect(f.assets[0].count).toBe(15);
    expect(f.assets[0].electrical_kw).toBeNull();
    expect(f.qualification.mw).toBeNull();
    expect(assetLabel(f)).toContain('unknown');
  });
  it('never treats emergency generation as non-emergency permission', () => {
    const f = seeds.find((f) => f.id === 'seed-lineage')!;
    expect(f.assets[0].permit).toBe('emergency-only');
    expect(f.qualification.mw).toBeNull();
    expect(priority(f).parts.flexibility).toBeLessThan(40);
  });
  it('does not add nearby solar to diesel reduction or assign a meter', () => {
    const f = clone(seeds[2]);
    const before = priority(f);
    f.assets.push({
      ...f.assets[0],
      id: 'solar-separate',
      type: 'solar',
      electrical_kw: 5000,
      meter_id: 'other-meter',
      description: 'Unrelated solar',
    });
    expect(priority(f).score).toBe(before.score);
    expect(f.assets[0].meter_id).toBeNull();
    expect(f.qualification.mw).toBeNull();
  });
  it('never promotes high priority to qualified or ready for outreach', () => {
    const f = clone(seeds[1]);
    f.evidence.push(
      { ...f.evidence[0], id: 'pjm-proof', category: 'pjm' },
      { ...f.evidence[0], id: 'load-proof', category: 'load' },
    );
    f.pjm = {
      status: 'verified',
      utility: 'Confirmed utility',
      zone: 'Confirmed zone',
      evidence_ids: ['pjm-proof'],
    };
    f.load.verified_mw = 10;
    f.load.evidence_ids = ['load-proof'];
    expect(priority(f).score).toBeGreaterThan(50);
    expect(f.stage).toBe('Research lead');
    f.stage = 'Qualified / under agreement';
    expect(() => validateDecisions(f)).toThrow(/buyer-confirmed/);
  });
  it('rejects using generator evidence to certify electric demand', () => {
    const f = clone(seeds[0]);
    f.load.verified_mw = 20;
    f.load.evidence_ids = ['gsk-1'];
    expect(() => validateDecisions(f)).toThrow(/load evidence/);
    expect(priority(f).parts.load).toBe(0);
  });
  it('withdraws a measured load conclusion when its source is contradicted', () => {
    const f = clone(seeds[0]);
    f.evidence.push({ ...f.evidence[0], id: 'load', category: 'load', status: 'contradicted' });
    f.load.verified_mw = 20;
    f.load.evidence_ids = ['load'];
    expect(reconcileDecisions(f).load.verified_mw).toBeNull();
  });
  it('requires customer/buyer confirmation for never enrolled with account/date/program scope', () => {
    const f = clone(seeds[0]);
    f.dr.status = 'never enrolled';
    f.dr.evidence_ids = ['gsk-1'];
    expect(() => validateDecisions(f)).toThrow(/account-scoped/);
  });
  it('excludes known non-PJM records and flags participation for buyer review', () => {
    const f = clone(seeds[0]);
    f.pjm.status = 'no';
    expect(priority(f).excluded).toBe(true);
    expect(priority(f).score).toBe(0);
    f.pjm.status = 'unknown';
    f.dr.status = 'prior participation';
    expect(priority(f).review).toBe(true);
    expect(f.stage).toBe('Research lead');
  });
});
describe('untrusted researched lead imports', () => {
  it('flags both sides of a manually added conflict and withdraws the affected decision', () => {
    const f = clone(seeds[0]);
    f.evidence.push({
      ...f.evidence[0],
      id: 'load-old',
      category: 'load',
      fact: 'metered load',
      value: '20 MW',
    });
    f.load.verified_mw = 20;
    f.load.evidence_ids = ['load-old'];
    appendEvidence(f, { ...f.evidence[1], id: 'load-new', status: 'suggested', value: '8 MW' });
    expect(f.evidence.filter((e) => e.fact === 'metered load').every((e) => e.conflict)).toBe(true);
    expect(f.load.verified_mw).toBeNull();
  });
  it('merges an independent lead into an existing automated site without evidence loss', () => {
    const current = clone(seeds[0]);
    current.origin = 'Automated discovery';
    const payload = clone(current);
    payload.evidence = [
      {
        ...payload.evidence[0],
        id: 'new-source',
        fact: 'controls',
        value: 'Controls require confirmation',
        source_url: 'https://www.epa.gov/controls',
      },
    ];
    const incoming = parseImport(JSON.stringify({ version: 1, facilities: [payload] }), 'json')[0];
    const merged = mergeFacility(current, incoming);
    expect(merged.id).toBe(current.id);
    expect(merged.evidence).toHaveLength(2);
    expect(merged.evidence.find((e) => e.id === 'new-source')?.status).toBe('suggested');
    expect(mergeFacility(merged, incoming).evidence).toHaveLength(2);
  });
  it('cannot self-verify load, DR history, PJM, reviewed identity or qualified stage', () => {
    const payload = clone(seeds[0]);
    payload.stage = 'Qualified / under agreement';
    payload.qualification.mw = 35;
    payload.load.verified_mw = 20;
    payload.dr.status = 'never enrolled';
    payload.pjm.status = 'verified';
    const f = parseImport(JSON.stringify({ version: 1, facilities: [payload] }), 'json')[0];
    expect(f.stage).toBe('Research lead');
    expect(f.qualification.mw).toBeNull();
    expect(f.load.verified_mw).toBeNull();
    expect(f.dr.status).toBe('unknown');
    expect(f.pjm.status).toBe('unknown');
    expect(f.evidence[0].reviewed_by).toBeNull();
    expect(priority(f).parts.flexibility).toBe(0);
  });
  it('does not merge neighboring sites, distinct unit addresses, or unexplained different operators', () => {
    const a = clone(seeds[0]);
    const b = clone(a);
    b.address = '1252 S Collegeville Rd';
    expect(sameSite(a, b)).toBe(false);
    b.address = a.address + ' Unit 2';
    expect(sameSite(a, b)).toBe(false);
    b.address = a.address;
    b.name = 'Other company';
    b.operator = 'Other';
    b.aliases = [];
    b.identifiers = {};
    expect(sameSite(a, b)).toBe(false);
  });
  it('preserves conflicting claims for review', () => {
    const a = clone(seeds[0]);
    const b = clone(a);
    b.evidence[0].value = 'Different generator rating';
    b.evidence[0].id = 'conflict';
    const merged = mergeFacility(a, b);
    expect(merged.evidence).toHaveLength(2);
    expect(merged.evidence.every((e) => e.conflict)).toBe(true);
    expect(priority(merged).parts.flexibility).toBe(0);
  });
  it('supports quoted multiline CSV citations and neutralizes spreadsheet formulas on export', () => {
    expect(parseCsv('name,value\r\n"A, B","line 1\nline 2"')[1]).toEqual([
      'A, B',
      'line 1\nline 2',
    ]);
    expect(csvCell('=HYPERLINK("bad")').slice(0, 3)).toEqual('"\'=');
    expect(() => parseCsv('"unclosed')).toThrow();
  });
  it('rejects private URL targets and oversized imports', () => {
    const f = clone(seeds[0]);
    f.evidence[0].source_url = 'http://169.254.169.254/';
    expect(() => parseImport(JSON.stringify({ version: 1, facilities: [f] }), 'json')).toThrow();
    expect(() => parseImport('x'.repeat(1_000_001), 'json')).toThrow(/1 MB/);
  });
});
