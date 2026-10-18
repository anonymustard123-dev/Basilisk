import type { Facility } from './model';
import { underwrite, type OfferInputs } from './underwriting';
type Profile = {
  mw: number;
  tag: number;
  capex: number;
  reserve: number;
  cost: number;
  rate: number;
  purchase: number;
  power: string;
  basis: string;
};
const profiles: Record<string, Profile> = {
  'acq-ravenna': {
    mw: 5,
    tag: 7,
    capex: 500000,
    reserve: 300000,
    cost: 40000,
    rate: 100,
    purchase: 6000000,
    power: '10 MW incoming service · reported',
    basis:
      '5 MW controllable-load scenario against a hypothetical 7 MW account limit, below the reported 10 MW service. Neither is measured. $100/MW-day load-drop rate is an analyst sensitivity, not a partner quote. $6M purchase and $6.3M standalone value are working assumptions because asking is undisclosed. $500k works and $40k annual costs need quotes. Excludes 22 MW expansion and 1 MW solar.',
  },
  'acq-butler': {
    mw: 2.5,
    tag: 4,
    capex: 350000,
    reserve: 250000,
    cost: 20000,
    rate: 100,
    purchase: 5525000,
    power: '5 MW building service · reported',
    basis:
      '2.5 MW tenant curtailment scenario against a hypothetical 4 MW account limit. Listing reports 5 MW incoming service and partial leasing, not reduction. $100/MW-day is an unquoted analyst load-drop assumption. $350k works and $20k annual interruption/administration costs need tenant and engineering review; no new generator purchase assumed.',
  },
  'acq-montana': {
    mw: 1.5,
    tag: 1.8,
    capex: 200000,
    reserve: 200000,
    cost: 20000,
    rate: 200,
    purchase: 4675000,
    power: '2 MW data-center capacity · reported',
    basis:
      '1.5 MW generator-supported reduction scenario and hypothetical 1.8 MW account cap, below reported 2 MW available power. No current demand or usable generator kW established. $200/MW-day assumes the call’s Tier 2 diesel product is applicable; fuel/tier, permits and redundancy constraints are unresolved. $200k controls/repairs and $20k annual costs are screening budgets.',
  },
  'acq-sandstone': {
    mw: 4,
    tag: 8,
    capex: 2000000,
    reserve: 500000,
    cost: 30000,
    rate: 100,
    purchase: 9350000,
    power: '14+ MW site availability · reported',
    basis:
      'Future operating case: 4 MW reduction and hypothetical 8 MW tag after funded tenant fitout. The advertised 14+ MW is utility availability, not operating load. $2M generic fitout allowance excludes specialized production or data-center plant and must be replaced with an operator budget. $100/MW-day is an unquoted analyst rate. Current property-only offer excludes DR; earnings are after-activation scenarios.',
  },
};
export function defaultPurchasePrice(f: Facility) {
  return profiles[f.id].purchase;
}
export function powerSignal(f: Facility) {
  return profiles[f.id].power;
}
export function defaultOffer(f: Facility): OfferInputs {
  const p = profiles[f.id];
  return {
    propertyValue: Math.round(
      f.acquisition?.asking_price_usd ? f.acquisition.asking_price_usd * 0.9 : p.purchase * 1.05,
    ),
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
/** DR Yield uses an independent purchase-price input, never the calculated offer ceiling. */
export function demandEconomics(i: OfferInputs, purchasePrice: number, realization = 0.8) {
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0)
    throw new Error('Invalid purchase price');
  const r = underwrite(i, realization);
  const receipts = r.gross * realization;
  const retained = (receipts * i.share) / 100;
  const contractNet = r.annualNet * i.years;
  const allIn = purchasePrice * (1 + i.closingPercent / 100) + i.capex + i.reserve;
  const ratio = (v: number, d: number) => (d > 0 ? v / d : null);
  const payments = Array.from({ length: i.years }, (_, index) => ({
    year: i.firstPayment + index,
    net: r.annualNet,
    cumulative: r.annualNet * (index + 1),
    presentValue: r.annualNet / (1 + i.discount / 100) ** (i.firstPayment + index),
  }));
  return {
    ...r,
    receipts,
    retained,
    contractNet,
    contractAfterSetup: contractNet - i.capex - i.reserve,
    contractGross: receipts * i.years,
    allIn,
    annualYield: ratio(r.annualNet, purchasePrice),
    contractCoverage: ratio(contractNet, purchasePrice),
    pvCoverage: ratio(r.drValue, purchasePrice),
    yieldOnCost: ratio(r.annualNet, allIn),
    referralAnnual: r.mw * 10 * 365 * realization,
    payments,
  };
}
