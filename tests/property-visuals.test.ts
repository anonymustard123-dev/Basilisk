import { describe, expect, it } from 'vitest';
import { acquisitionSeeds } from '../lib/featured-acquisitions';
import { capacityScale, propertyVisual, profitBridge } from '../lib/property-visuals';

describe('property comparison visuals', () => {
  it('keeps a common capacity scale and attributed listing photos for every property', () => {
    expect(capacityScale).toBe(14);
    expect(acquisitionSeeds.map((f) => propertyVisual(f).mw)).toEqual([10, 5, 2, 14]);
    for (const f of acquisitionSeeds) {
      const p = propertyVisual(f);
      expect(new URL(p.photo).protocol).toBe('https:');
      expect(new URL(p.source).protocol).toBe('https:');
      expect(p.credit).toBeTruthy();
    }
    expect(propertyVisual(acquisitionSeeds[3]).plus).toBe(true);
  });
  it('reconciles gross revenue through each deduction to net profit', () => {
    const rows = profitBridge(182500, 146000, 116800, 40000);
    expect(rows.map((r) => r.value)).toEqual([182500, -36500, -29200, -40000, 76800]);
    expect(rows.slice(0, -1).reduce((sum, r) => sum + r.value, 0)).toBe(rows.at(-1)!.value);
    expect(rows[3].start).toBe(rows[4].end);
  });
  it('renders losses and a zero-revenue scenario without invalid bar geometry', () => {
    for (const args of [
      [0, 0, 0, 0],
      [0, 0, 0, 40000],
      [100, 80, 40, 200],
    ] as const) {
      for (const row of profitBridge(args[0], args[1], args[2], args[3])) {
        expect(Number.isFinite(row.left + row.width + row.zero)).toBe(true);
        expect(row.width).toBeGreaterThanOrEqual(0);
        expect(row.left).toBeGreaterThanOrEqual(0);
        expect(row.left + row.width).toBeLessThanOrEqual(100.000001);
      }
    }
    expect(profitBridge(0, 0, 0, 40000).at(-1)!.kind).toBe('loss');
  });
});
