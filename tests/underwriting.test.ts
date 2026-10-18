import { describe, expect, it } from 'vitest';
import { underwrite, type OfferInputs } from '../lib/underwriting';
const inputs: OfferInputs = {
  propertyValue: 1000000,
  closingPercent: 3,
  capex: 100000,
  reserve: 50000,
  mw: 2,
  capacityTag: 1,
  rate: 200,
  share: 50,
  annualCost: 6500,
  years: 2,
  firstPayment: 3,
  discount: 10,
};
describe('acquisition underwriting', () => {
  it('caps MW, allocates income, discounts delayed payments and includes closing costs', () => {
    const r = underwrite(inputs);
    expect(r.mw).toBe(1);
    expect(r.gross).toBe(73000);
    expect(r.annualNet).toBe(30000);
    expect(r.drValue).toBeCloseTo(30000 / 1.1 ** 3 + 30000 / 1.1 ** 4);
    expect(r.ceiling).toBeCloseTo((850000 + r.drValue) / 1.03);
  });
  it('retains costs in a zero-receipt stress and separates no-project value', () => {
    const r = underwrite(inputs, 0);
    expect(r.annualNet).toBe(-6500);
    expect(r.drValue).toBeLessThan(0);
    expect(r.propertyOnly).toBeCloseTo(850000 / 1.03);
  });
  it('does not turn customer income into our income without rights', () => {
    expect(underwrite({ ...inputs, share: 0, annualCost: 0 }).drValue).toBe(0);
    expect(underwrite({ ...inputs, rate: 10, share: 100, annualCost: 0 }).gross).toBe(3650);
  });
  it('rejects invalid financial inputs', () => {
    for (const override of [
      { discount: 0 },
      { mw: NaN },
      { share: 101 },
      { years: 1.5 },
      { firstPayment: 0 },
      { capex: -1 },
    ])
      expect(() => underwrite({ ...inputs, ...override })).toThrow();
  });
});
