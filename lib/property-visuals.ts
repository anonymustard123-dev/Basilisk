import type { Facility } from './model';

// Reported infrastructure is not measured demand or a qualified DR commitment.
const properties: Record<
  string,
  { mw: number; plus?: boolean; photo: string; credit: string; source: string }
> = {
  'acq-ravenna': {
    mw: 10,
    photo:
      'https://images1.showcase.com/i2/nG5u_V0Q2rgShCbLzd3wd_FqBcYVKLvmsjyPp0oEvC8/116/image.jpg',
    credit: 'SVN / Showcase',
    source: 'https://www.showcase.com/6800-n-chestnut-st-ravenna-oh-44266/37959305/',
  },
  'acq-butler': {
    mw: 5,
    photo:
      'https://crexi.com/images/format=auto,width=3000,height=2000/assets/1151843/c4891d731a97465c9a73842d57eaec30.jpg',
    credit: 'NAI Burns Scalo / Crexi',
    source: 'https://www.crexi.com/properties/1151843/pennsylvania-629-e-butler-rd',
  },
  'acq-montana': {
    mw: 2,
    photo:
      'https://www.cincinnatilisting.com/wp-content/uploads/swa-current-listings/2300-montana-ave-cincinnati-oh-45239-61-web.webp',
    credit: 'CincinnatiListing.com',
    source: 'https://cincinnatilisting.com/listings/2300-montana-ave-cincinnati-oh-45239/',
  },
  'acq-sandstone': {
    mw: 14,
    plus: true,
    photo:
      'https://images1.loopnet.com/i2/sMLFvPUCH991eLJiJMSOia7R7gTWruh3eMUiFJtia3c/110/5-Sandstone-way-Dunbar-PA-Building-Photo-1-Large.jpg',
    credit: 'SVN / LoopNet',
    source: 'https://www.loopnet.com/Listing/5-Sandstone-way-Dunbar-PA/28499335/',
  },
};
export const propertyVisual = (f: Facility) => properties[f.id];
export const capacityScale = Math.max(...Object.values(properties).map((p) => p.mw));

export function profitBridge(gross: number, receipts: number, retained: number, cost: number) {
  const net = retained - cost;
  const rows = [
    { label: 'Capacity revenue', start: 0, end: gross, value: gross, kind: 'gross' },
    {
      label: 'Unrealized receipts',
      start: receipts,
      end: gross,
      value: receipts - gross,
      kind: 'deduction',
    },
    {
      label: 'Partner share',
      start: retained,
      end: receipts,
      value: retained - receipts,
      kind: 'deduction',
    },
    { label: 'Operating costs', start: net, end: retained, value: -cost, kind: 'deduction' },
    { label: 'Our annual net', start: 0, end: net, value: net, kind: net < 0 ? 'loss' : 'net' },
  ];
  const min = Math.min(0, net),
    max = Math.max(gross, 0),
    range = max - min || 1;
  return rows.map((row) => ({
    ...row,
    left: ((Math.min(row.start, row.end) - min) / range) * 100,
    width: (Math.abs(row.end - row.start) / range) * 100,
    zero: (-min / range) * 100,
  }));
}
