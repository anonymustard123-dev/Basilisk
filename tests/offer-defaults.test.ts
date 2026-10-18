import { describe, it, expect } from 'vitest';
import { acquisitionSeeds } from '../lib/featured-acquisitions';
import { defaultOffer, offerScenario } from '../lib/offer-defaults';
describe('prefilled shortlist offers', () => {
  it('provides a finite, positive figure and complete defaults for each property', () => {
    expect(acquisitionSeeds.map((f) => f.id)).toEqual([
      'acq-east55',
      'acq-phillips',
      'acq-macdade',
      'acq-lewisburg',
    ]);
    for (const f of acquisitionSeeds) {
      const i = defaultOffer(f),
        r = offerScenario(f, i);
      expect(Object.values(i).every((v) => Number.isFinite(v) && v > 0)).toBe(true);
      expect(r.offer).toBeGreaterThan(0);
      expect(r.offer).toBeLessThan(f.acquisition!.asking_price_usd!);
      expect(f.acquisition!.availability).toBe('advertised');
      expect(f.qualification.mw).toBeNull();
    }
  });
  it('excludes DR premium for vacancy or sub-minimum capacity without erasing assumptions', () => {
    for (const f of acquisitionSeeds.slice(0, 3)) {
      const r = offerScenario(f, defaultOffer(f));
      expect(r.includeDr).toBe(false);
      expect(r.offer).toBe(r.propertyOnly);
    }
    const f = acquisitionSeeds[3],
      i = defaultOffer(f);
    expect(offerScenario(f, i).includeDr).toBe(true);
    expect(offerScenario(f, i, 0).offer).toBeLessThan(offerScenario(f, i).offer);
  });
});
