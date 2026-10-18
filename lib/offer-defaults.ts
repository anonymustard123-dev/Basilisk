import type { Facility } from './model';
import { underwrite, type OfferInputs } from './underwriting';
const profiles: Record<
  string,
  {
    mw: number;
    tag: number;
    capex: number;
    reserve: number;
    cost: number;
    rate: number;
    basis: string;
  }
> = {
  'acq-east55': {
    mw: 0.15,
    tag: 0.3,
    capex: 100000,
    reserve: 60000,
    cost: 3000,
    rate: 100,
    basis:
      'Vacant cold-storage reuse. $100k repairs/recommissioning and $60k holding reserve. 0.15 MW is a screening sensitivity, not a measured load. No DR premium while vacant.',
  },
  'acq-phillips': {
    mw: 0.5,
    tag: 1,
    capex: 75000,
    reserve: 50000,
    cost: 12000,
    rate: 200,
    basis:
      'Generator-led screening case: 0.5 MW reduction, $75k repairs/controls and $12k annual testing, maintenance and fuel. $200 rate assumes Tier 2 diesel compatibility; equipment tier and rating are unconfirmed.',
  },
  'acq-macdade': {
    mw: 0.075,
    tag: 0.15,
    capex: 75000,
    reserve: 40000,
    cost: 2500,
    rate: 100,
    basis:
      'Small refrigeration reuse case: 0.075 MW sensitivity, $75k recommissioning and $40k holding reserve. $100 rate is an analyst assumption for load reduction, not a quote.',
  },
  'acq-lewisburg': {
    mw: 1,
    tag: 1.5,
    capex: 200000,
    reserve: 150000,
    cost: 25000,
    rate: 200,
    basis:
      'Post-diligence operating case: 1 MW reduction, $200k repairs/controls and $25k annual testing, maintenance and fuel. $200 rate assumes suitable Tier 2 diesel equipment and signed rights. Neither is confirmed.',
  },
};
export function defaultOffer(f: Facility): OfferInputs {
  const p = profiles[f.id];
  return {
    propertyValue: Math.round((f.acquisition?.asking_price_usd ?? 0) * 0.9),
    closingPercent: 3,
    capex: p.capex,
    reserve: p.reserve,
    mw: p.mw,
    capacityTag: p.tag,
    rate: p.rate,
    share: 80,
    annualCost: p.cost,
    years: 10,
    firstPayment: 3,
    discount: 15,
  };
}
export function offerBasis(f: Facility) {
  return profiles[f.id].basis;
}
export function offerScenario(f: Facility, i: OfferInputs, realization = 0.8) {
  const r = underwrite(i, realization);
  const includeDr = r.mw >= 1 && f.acquisition?.occupancy !== 'vacant';
  return { ...r, includeDr, offer: Math.max(0, includeDr ? r.ceiling : r.propertyOnly) };
}
