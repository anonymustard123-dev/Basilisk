import { describe, it, expect } from 'vitest';
import { acquisitionSeeds } from '../lib/featured-acquisitions';
import {
  defaultOffer,
  defaultPurchasePrice,
  powerSignal,
  offerScenario,
  demandEconomics,
} from '../lib/offer-defaults';
import { facilitySchema } from '../lib/model';
import type { OfferInputs } from '../lib/underwriting';
const i: OfferInputs = {
  propertyValue: 1000000,
  closingPercent: 3,
  capex: 50000,
  reserve: 25000,
  mw: 3,
  capacityTag: 2,
  rate: 200,
  share: 50,
  annualCost: 8400,
  years: 2,
  firstPayment: 3,
  discount: 10,
};
describe('MW-first shortlist and earnings', () => {
  it('keeps reported infrastructure and modeled demand separate on four active leads', () => {
    expect(acquisitionSeeds.map((f) => f.id)).toEqual([
      'acq-ravenna',
      'acq-butler',
      'acq-montana',
      'acq-sandstone',
    ]);
    for (const f of acquisitionSeeds) {
      expect(facilitySchema.parse(f)).toBeTruthy();
      const inputs = defaultOffer(f),
        r = offerScenario(f, inputs);
      expect(Object.values(inputs).every((v) => Number.isFinite(v) && v > 0)).toBe(true);
      expect(inputs.mw).toBeGreaterThanOrEqual(1.5);
      expect(r.offer).toBeGreaterThan(0);
      expect(defaultPurchasePrice(f)).toBeGreaterThan(0);
      expect(powerSignal(f)).toContain('reported');
      expect(f.acquisition!.availability).toBe('advertised');
      expect(f.qualification.mw).toBeNull();
      expect(f.load.verified_mw).toBeNull();
    }
    expect(acquisitionSeeds[0].acquisition!.asking_price_usd).toBeNull();
  });
  it('caps MW, applies availability and our share once, and subtracts annual costs', () => {
    const r = demandEconomics(i, 1000000, 0.8);
    expect(r.mw).toBe(2);
    expect(r.gross).toBe(146000);
    expect(r.receipts).toBe(116800);
    expect(r.retained).toBe(58400);
    expect(r.annualNet).toBe(50000);
    expect(r.annualYield).toBe(0.05);
    expect(r.contractNet).toBe(100000);
    expect(r.contractAfterSetup).toBe(25000);
    expect(r.contractCoverage).toBe(0.1);
    expect(r.payments.map((p) => p.year)).toEqual([3, 4]);
    expect(r.payments.at(-1)!.cumulative).toBe(r.contractNet);
    expect(r.payments.reduce((v, p) => v + p.presentValue, 0)).toBeCloseTo(r.drValue);
    expect(r.pvCoverage).toBeCloseTo(r.drValue / 1000000);
    expect(r.referralAnnual).toBe(5840);
  });
  it('uses independent purchase denominator and returns no ratio at zero price', () => {
    const a = demandEconomics(i, 1000000),
      b = demandEconomics(i, 2000000);
    expect(b.annualNet).toBe(a.annualNet);
    expect(b.annualYield).toBe(a.annualYield! / 2);
    expect(demandEconomics(i, 0).annualYield).toBeNull();
    expect(demandEconomics(i, 0).contractCoverage).toBeNull();
    for (const p of [-1, NaN, Infinity]) expect(() => demandEconomics(i, p)).toThrow();
  });
  it('preserves zero-receipt losses and excludes a vacant shell from current offer premiums', () => {
    expect(demandEconomics(i, 1000000, 0).annualNet).toBe(-8400);
    const f = acquisitionSeeds[3],
      inputs = defaultOffer(f),
      r = offerScenario(f, inputs);
    expect(r.includeDr).toBe(false);
    expect(r.offer).toBe(r.propertyOnly);
    expect(demandEconomics(inputs, defaultPurchasePrice(f)).annualNet).toBeGreaterThan(0);
  });
});
