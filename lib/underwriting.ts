export type OfferInputs = {
  propertyValue: number;
  closingPercent: number;
  capex: number;
  reserve: number;
  mw: number;
  capacityTag: number;
  rate: number;
  share: number;
  annualCost: number;
  years: number;
  firstPayment: number;
  discount: number;
};
/** Unlevered, pre-tax incremental DR value. No terminal DR value or event revenue. */
export function underwrite(i: OfferInputs, realization = 1) {
  if (
    Object.values(i).some((v) => !Number.isFinite(v) || v < 0) ||
    i.discount <= 0 ||
    i.share > 100 ||
    i.years < 1 ||
    i.years > 30 ||
    !Number.isInteger(i.years) ||
    i.firstPayment < 1 ||
    realization < 0 ||
    realization > 1
  ) {
    throw new Error('Invalid underwriting assumptions');
  }
  const mw = Math.min(i.mw, i.capacityTag);
  const gross = mw * i.rate * 365;
  const annualNet = ((gross * i.share) / 100) * realization - i.annualCost;
  let drValue = 0;
  for (let y = 0; y < i.years; y++)
    drValue += annualNet / (1 + i.discount / 100) ** (i.firstPayment + y);
  const ceiling = (i.propertyValue + drValue - i.capex - i.reserve) / (1 + i.closingPercent / 100);
  const propertyOnly = (i.propertyValue - i.capex - i.reserve) / (1 + i.closingPercent / 100);
  return { mw, gross, annualNet, drValue, ceiling, propertyOnly };
}
