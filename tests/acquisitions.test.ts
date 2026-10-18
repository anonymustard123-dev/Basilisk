import { describe, it, expect } from 'vitest';
import { acquisitionSeeds } from '@/lib/featured-acquisitions';
import { initialFacilities } from '@/lib/initial-facilities';
import { seeds } from '@/lib/seeds';
import { blankFacility, facilitySchema, validateDecisions } from '@/lib/model';
import {
  featuredAcquisitions,
  qualifyingMwLabel,
  readiness,
  economicsBasis,
  matchesAcquisitionFilters,
} from '@/lib/acquisitions';
import { mergeFacility, sameSite } from '@/lib/identity';
import { parseImport, exportCsv } from '@/lib/import';
const clone = <T>(v: T): T => structuredClone(v);
describe('pinned acquisition records', () => {
  it('matches Boulevard and Blvd variants of the same listing without merging a neighbor', () => {
    const f = clone(acquisitionSeeds[2]);
    const incoming = clone(f);
    incoming.address = '108 MacDade Blvd';
    expect(sameSite(f, incoming)).toBe(true);
    incoming.address = '110 MacDade Blvd';
    expect(sameSite(f, incoming)).toBe(false);
  });
  it('validates four actual records in requested order while preserving four original prospects', () => {
    expect(initialFacilities).toHaveLength(8);
    expect(seeds).toHaveLength(4);
    expect(featuredAcquisitions([...initialFacilities].reverse()).map((f) => f.address)).toEqual([
      '1893 East 55th Street',
      '320 Phillips Avenue',
      '108 MacDade Boulevard',
      '4307 US Route 40 East',
    ]);
    for (const f of acquisitionSeeds) expect(facilitySchema.parse(f)).toBeTruthy();
  });
  it('keeps asking price, area, generator rating, grid demand and qualifying MW separate', () => {
    expect(acquisitionSeeds.map((f) => f.acquisition!.asking_price_usd)).toEqual([
      1199000, 1000000, 775000, 3233500,
    ]);
    expect(acquisitionSeeds.map((f) => f.acquisition!.building_sqft)).toEqual([
      31158, 53847, 7000, 129340,
    ]);
    for (const f of acquisitionSeeds) {
      expect(f.load.verified_mw).toBeNull();
      expect(f.qualification.mw).toBeNull();
      expect(qualifyingMwLabel(f)).toBe('Unknown');
      expect(f.dr.status).toBe('unknown');
      expect(economicsBasis(f)).toBeNull();
    }
    expect(acquisitionSeeds[1].assets[0].electrical_kw).toBeNull();
  });
  it('does not call off-market, ambiguous or vacant property presently eligible', () => {
    expect(acquisitionSeeds[0].acquisition!.availability).toBe('advertised');
    expect(acquisitionSeeds[2].acquisition!.price_status).toBe('disputed');
    expect(acquisitionSeeds[2].acquisition!.alternate_price_usd).toBe(800000);
    expect(acquisitionSeeds[3].acquisition!.availability).toBe('advertised');
    expect(readiness(acquisitionSeeds[0])).toBe('Not Currently Ready');
    expect(acquisitionSeeds.slice(0, 3).map(readiness)).toEqual([
      'Not Currently Ready',
      'Needs Verification',
      'Needs Verification',
    ]);
  });
  it('does not displace pins when discovery returns better-scored or more recent facilities', () => {
    const others = Array.from({ length: 600 }, (_, i) => ({ ...clone(seeds[1]), id: `auto-${i}` }));
    expect(featuredAcquisitions([...others, ...acquisitionSeeds]).map((f) => f.id)).toEqual(
      acquisitionSeeds.map((f) => f.id),
    );
  });
  it('keeps unknown MW explicitly supported under min-MW filters and excludes known non-PJM', () => {
    const filters = {
      maxPrice: '1500000',
      includeUnknownPrice: true,
      minMw: '3',
      includeUnknownMw: true,
      pjm: 'potential' as const,
      reduction: '',
    };
    expect(matchesAcquisitionFilters(acquisitionSeeds[0], filters)).toBe(true);
    expect(
      matchesAcquisitionFilters(acquisitionSeeds[0], { ...filters, includeUnknownMw: false }),
    ).toBe(false);
    expect(matchesAcquisitionFilters(acquisitionSeeds[0], { ...filters, pjm: 'verified' })).toBe(
      false,
    );
    expect(matchesAcquisitionFilters(acquisitionSeeds[0], { ...filters, maxPrice: '500000' })).toBe(
      false,
    );
    const f = clone(acquisitionSeeds[0]);
    f.pjm.status = 'no';
    expect(matchesAcquisitionFilters(f, filters)).toBe(false);
  });
  it('deduplicates normalized address/source and preserves acquisition pins and reviewed notes on import', () => {
    const f = clone(acquisitionSeeds[1]);
    f.notes = 'Broker follow-up';
    f.stage = 'Contacted';
    const incoming = parseImport(JSON.stringify({ version: 1, facilities: [f] }), 'json')[0];
    incoming.address = '320 Phillips Ave';
    incoming.postal_code = '';
    expect(sameSite(f, incoming)).toBe(true);
    expect(incoming.acquisition!.featured_order).toBeNull();
    expect(incoming.acquisition!.availability).toBe('unverified');
    const merged = mergeFacility(f, incoming);
    expect(merged.notes).toBe('Broker follow-up');
    expect(merged.stage).toBe('Contacted');
    expect(merged.acquisition!.featured_order).toBe(2);
    expect(merged.evidence).toHaveLength(f.evidence.length);
  });
  it('requires reviewed evidence and an explicit assumption before displaying estimated qualifying MW', () => {
    const f = clone(acquisitionSeeds[1]);
    f.acquisition!.qualifying_mw = 2;
    expect(() => validateDecisions(f)).toThrow(/assumption/);
    expect(qualifyingMwLabel(f)).toBe('Unknown');
    f.acquisition!.qualifying_assumption =
      '2 MW controllable reduction supported by a reviewed engineering study; subject to buyer clearance';
    f.evidence.push({
      ...f.evidence[0],
      id: 'capacity-study',
      fact: 'controllable capacity',
      category: 'qualification',
      status: 'estimated',
      value: '2 MW engineering assumption',
    });
    f.acquisition!.qualifying_evidence_ids = ['capacity-study'];
    expect(validateDecisions(f)).toBeTruthy();
    expect(qualifyingMwLabel(f)).toContain('2 MW');
    expect(economicsBasis(f)?.mw).toBe(2);
    f.acquisition!.occupancy = 'vacant';
    expect(qualifyingMwLabel(f)).toBe('Unknown');
    expect(economicsBasis(f)).toBeNull();
  });
  it('imports acquisition CSV and exports listing facts without automatically confirming availability', () => {
    const csv =
      'name,address,city,state,postal_code,fact,value,source_title,source_url,document_date,page_or_excerpt,author,listing_id,listing_url,asking_price_usd,building_sqft\nExample,100 Main St,Town,PA,19000,Listing,Research required,Broker,https://example.com/listing,2026-10-18,Listing header,Analyst,example:1,https://example.com/listing,1000000,10000';
    const f = parseImport(csv, 'csv')[0];
    expect(f.acquisition!.asking_price_usd).toBe(1000000);
    expect(f.acquisition!.availability).toBe('unverified');
    expect(exportCsv([f])).toContain('Estimated qualifying MW');
    expect(qualifyingMwLabel(f)).toBe('Unknown');
  });
  it('keeps old non-acquisition imports backward-compatible', () => {
    const f = blankFacility('Old lead', '100 Main St', 'Town', 'PA');
    const raw = JSON.parse(JSON.stringify(f));
    delete raw.acquisition;
    expect(facilitySchema.parse(raw).acquisition).toBeNull();
  });
});
