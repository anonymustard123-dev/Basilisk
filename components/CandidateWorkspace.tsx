'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { Facility } from '@/lib/model';
import { money } from '@/lib/acquisitions';
import type { OfferInputs } from '@/lib/underwriting';
import {
  defaultOffer,
  defaultPurchasePrice,
  powerSignal,
  demandEconomics,
  offerBasis,
  offerScenario,
} from '@/lib/offer-defaults';
import { Modal } from './shared';

type Tab = 'Research' | 'Underwriting';
const percent = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(2)}%`);
export default function CandidateWorkspace({ facilities }: { facilities: Facility[] }) {
  const [selection, setSelection] = useState<{ f: Facility; tab: Tab } | null>(null);
  const [sort, setSort] = useState('priority');
  const ordered = [...facilities].sort((a, b) =>
    sort === 'yield'
      ? (demandEconomics(defaultOffer(b), defaultPurchasePrice(b)).annualYield ?? -Infinity) -
        (demandEconomics(defaultOffer(a), defaultPurchasePrice(a)).annualYield ?? -Infinity)
      : a.acquisition!.featured_order! - b.acquisition!.featured_order!,
  );
  return (
    <main className="candidate-workspace">
      <header className="quiet-header">
        <div className="quiet-brand">
          <strong>BASILISK</strong>
          <span>Acquisition intelligence</span>
        </div>
        <div className="header-signature">
          <span>
            PJM ORIGINATION<small>PRIVATE RESEARCH / 004</small>
          </span>
          <span className="basilisk-emblem">
            <Image
              src="/brand/basilisk-logo.svg"
              alt="Basilisk serpent and eye logo"
              width={86}
              height={86}
              unoptimized
              priority
            />
          </span>
        </div>
      </header>
      <section className="quiet-intro">
        <p className="eyebrow">
          <span aria-hidden="true" /> PJM / BEHIND THE METER
        </p>
        <h1>
          Acquisition <em>shortlist</em>
          <span>.</span>
        </h1>
        <span className="folio-count" aria-hidden="true">
          04<span>SELECTED ASSETS</span>
        </span>
      </section>
      <div className="shortlist-sort">
        <span>MW-first screening · operating scenarios</span>
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="priority">Research priority</option>
            <option value="yield">Modeled DR Yield</option>
          </select>
        </label>
      </div>
      <section aria-label="Four acquisition candidates" className="quiet-grid">
        {ordered.map((f, index) => {
          const a = f.acquisition!,
            r = offerScenario(f, defaultOffer(f)),
            earnings = demandEconomics(defaultOffer(f), defaultPurchasePrice(f));
          return (
            <article className="quiet-card" key={f.id} data-index={`0${index + 1}`}>
              <div className="quiet-card-meta">
                <span>
                  0{index + 1} / {f.city}, {f.state}
                </span>
                <span>Advertised for sale</span>
              </div>
              <h2>
                <button onClick={() => setSelection({ f, tab: 'Research' })}>{f.name}</button>
              </h2>
              <p className="quiet-type">
                {a.property_type} · {a.building_sqft?.toLocaleString()} SF
              </p>
              <p className="power-signal">{powerSignal(f)}</p>
              <div className="card-offer-pair">
                <div>
                  <span>Asking{a.price_status === 'disputed' ? ' · price conflict' : ''}</span>
                  <strong>
                    {a.asking_price_usd === null ? 'On request' : money(a.asking_price_usd)}
                  </strong>
                </div>
                <div>
                  <span>Indicative offer</span>
                  <strong>{money(Math.floor(r.offer / 5000) * 5000)}</strong>
                </div>
              </div>
              <dl className="card-dr-metrics">
                <div>
                  <dt>Modeled reduction</dt>
                  <dd>{earnings.mw} MW</dd>
                </div>
                <div>
                  <dt>Annual net DR</dt>
                  <dd>{money(earnings.annualNet)}</dd>
                </div>
                <div>
                  <dt>DR Yield</dt>
                  <dd>{percent(earnings.annualYield)}</dd>
                </div>
              </dl>
              <p className="card-scenario-note">
                {a.asking_price_usd === null
                  ? `$${(defaultPurchasePrice(f) / 1000000).toFixed(1)}m assumed purchase · `
                  : ''}
                {a.occupancy === 'vacant'
                  ? 'After activation · no current DR load'
                  : 'Operating scenario · DR MW unverified'}
              </p>
              <div className="quiet-actions">
                <button onClick={() => setSelection({ f, tab: 'Research' })}>
                  Research <span>↗</span>
                </button>
                <button onClick={() => setSelection({ f, tab: 'Underwriting' })}>
                  Underwriting <span>→</span>
                </button>
              </div>
            </article>
          );
        })}
      </section>
      <footer className="quiet-footer">
        DR Yield = annual net DR ÷ assumed purchase price · All earnings modeled · October 18, 2026
      </footer>
      {selection && (
        <Modal title={selection.f.name} close={() => setSelection(null)} wide>
          <div className="dossier-tabs" role="tablist" aria-label="Property dossier">
            {(['Research', 'Underwriting'] as Tab[]).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={selection.tab === tab}
                onClick={() => setSelection({ ...selection, tab })}
              >
                {tab}
              </button>
            ))}
          </div>
          <div hidden={selection.tab !== 'Research'} role="tabpanel" aria-label="Research">
            <Research f={selection.f} />
          </div>
          <div hidden={selection.tab !== 'Underwriting'} role="tabpanel" aria-label="Underwriting">
            <Underwriting key={selection.f.id} f={selection.f} />
          </div>
        </Modal>
      )}
    </main>
  );
}
function Research({ f }: { f: Facility }) {
  const a = f.acquisition!;
  return (
    <div className="dossier-content">
      <p className="dossier-lead">{f.why}</p>
      <p className="power-signal">{powerSignal(f)}</p>
      <dl className="dossier-facts">
        <div>
          <dt>Occupancy</dt>
          <dd>{a.occupancy.replace('-', ' ')}</dd>
        </div>
        <div>
          <dt>Operator</dt>
          <dd>{f.operator}</dd>
        </div>
        <div>
          <dt>Key question</dt>
          <dd>{f.missing}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>
            {a.asking_price_usd === null ? 'Price on request' : money(a.asking_price_usd)}
            {a.alternate_price_usd ? ` / ${money(a.alternate_price_usd)} reported` : ''}
          </dd>
        </div>
      </dl>
      <h3>Next action</h3>
      <p>{f.next_action}</p>
      <details>
        <summary>Listing notes & sources</summary>
        <p>{a.verification_notes}</p>
        {f.evidence.map((e) => (
          <div className="source-note" key={e.id}>
            <strong>{e.fact}</strong>
            <p>{e.value}</p>
            <a href={e.source_url ?? a.listing_url} target="_blank" rel="noreferrer">
              Source ↗
            </a>
          </div>
        ))}
      </details>
      <a className="dossier-source" href={a.listing_url} target="_blank" rel="noreferrer">
        Property listing ↗
      </a>
    </div>
  );
}
function Underwriting({ f }: { f: Facility }) {
  const [i, setI] = useState(() => defaultOffer(f)),
    [realization, setRealization] = useState(80),
    [purchasePrice, setPurchasePrice] = useState(() => defaultPurchasePrice(f));
  const valid =
    Object.values(i).every((x) => Number.isFinite(x) && x >= 0) &&
    i.discount > 0 &&
    i.firstPayment >= 1 &&
    i.years >= 1 &&
    i.years <= 30 &&
    Number.isInteger(i.years) &&
    i.share <= 100 &&
    Number.isFinite(realization) &&
    realization >= 0 &&
    realization <= 100 &&
    Number.isFinite(purchasePrice) &&
    purchasePrice >= 0;
  const r = valid ? offerScenario(f, i, realization / 100) : null;
  const earnings = valid ? demandEconomics(i, purchasePrice, realization / 100) : null;
  const ask = f.acquisition!.asking_price_usd;
  const fields: [keyof OfferInputs, string][] = [
    ['propertyValue', 'Property value ($)'],
    ['capex', 'Repairs & upgrades ($)'],
    ['reserve', 'Holding & contingency ($)'],
    ['closingPercent', 'Closing costs (%)'],
    ['mw', 'Reduction (MW)'],
    ['capacityTag', 'Capacity limit (MW)'],
    ['rate', 'Rate ($/MW-day)'],
    ['share', 'Our income share (%)'],
    ['annualCost', 'Annual DR costs ($)'],
    ['years', 'Income term (years)'],
    ['firstPayment', 'First payment (year)'],
    ['discount', 'Discount rate (%)'],
  ];
  return (
    <div className="dossier-content">
      <div className="offer-result">
        <span>Indicative offer · assumption-based</span>
        <strong>{r ? money(Math.floor(r.offer / 5000) * 5000) : '—'}</strong>
        <p>
          {r
            ? `${ask ? `${((1 - r.offer / ask) * 100).toFixed(1)}% below asking · ` : 'Asking undisclosed · '}${r.includeDr ? 'includes modeled DR upside' : 'property-only; DR excluded'}`
            : 'Check inputs below'}
        </p>
      </div>
      {earnings && (
        <section className="demand-model" aria-label="Demand response earnings">
          <div className="demand-title">
            <h3>Demand response earnings</h3>
            <span>
              {f.acquisition!.occupancy === 'vacant' ? 'After activation' : 'Operating scenario'}
            </span>
          </div>
          <dl className="earnings-grid">
            <div>
              <dt>Our annual net</dt>
              <dd>{money(earnings.annualNet)}</dd>
            </div>
            <div>
              <dt>DR Yield / year</dt>
              <dd>{percent(earnings.annualYield)}</dd>
            </div>
            <div>
              <dt>{i.years}-year net · pre-setup</dt>
              <dd>{money(earnings.contractNet)}</dd>
            </div>
            <div>
              <dt>Contract coverage</dt>
              <dd>{percent(earnings.contractCoverage)}</dd>
            </div>
            <div>
              <dt>Discounted DR value</dt>
              <dd>{money(earnings.drValue)}</dd>
            </div>
            <div>
              <dt>PV / purchase price</dt>
              <dd>{percent(earnings.pvCoverage)}</dd>
            </div>
          </dl>
          <p className="dossier-small">
            Scenario MW: {earnings.mw} · Purchase basis: {money(purchasePrice)} · Income rights and
            eligible demand unverified.
          </p>
          <details>
            <summary>Revenue → profit</summary>
            <dl className="dossier-facts">
              <div>
                <dt>Full customer capacity revenue / year</dt>
                <dd>{money(earnings.gross)}</dd>
              </div>
              <div>
                <dt>After {realization}% receipt realization</dt>
                <dd>{money(earnings.receipts)}</dd>
              </div>
              <div>
                <dt>Our {i.share}% share / year</dt>
                <dd>{money(earnings.retained)}</dd>
              </div>
              <div>
                <dt>Annual operating costs</dt>
                <dd>−{money(i.annualCost)}</dd>
              </div>
              <div>
                <dt>Our net / month · annual average</dt>
                <dd>{money(earnings.annualNet / 12)}</dd>
              </div>
              <div>
                <dt>Net yield on all-in cost</dt>
                <dd>{percent(earnings.yieldOnCost)}</dd>
              </div>
              <div>
                <dt>Contract net after works & reserve</dt>
                <dd>{money(earnings.contractAfterSetup)}</dd>
              </div>
            </dl>
            <p className="dossier-small">
              Referral-only alternative: {money(earnings.referralAnnual)}/year gross at the call’s
              $10/MW-day fee. Not added to owner income; duration and service costs unconfirmed.
            </p>
          </details>
          <details>
            <summary>Annual cash flow & cumulative earnings</summary>
            <p className="dossier-small">
              First annual receipt in year {i.firstPayment}. Net DR only; excludes property rent,
              sale proceeds, debt and tax. Setup/holding allowances: {money(i.capex + i.reserve)}{' '}
              outside annual cash flow.
            </p>
            <table className="scenario-table">
              <thead>
                <tr>
                  <th>Payment year</th>
                  <th>Our net</th>
                  <th>Cumulative net</th>
                  <th>Present value</th>
                </tr>
              </thead>
              <tbody>
                {earnings.payments.map((p) => (
                  <tr key={p.year}>
                    <td>{p.year}</td>
                    <td>{money(p.net)}</td>
                    <td>{money(p.cumulative)}</td>
                    <td>{money(p.presentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>
      )}
      <h3>
        Assumptions{' '}
        <button
          className="text-button reset-offer"
          onClick={() => {
            setI(defaultOffer(f));
            setRealization(80);
            setPurchasePrice(defaultPurchasePrice(f));
          }}
        >
          Reset
        </button>
      </h3>
      <div className="underwriting-inputs">
        <label>
          Purchase price assumption ($)
          <input
            type="number"
            min="0"
            step="1000"
            value={Number.isNaN(purchasePrice) ? '' : purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value === '' ? 0 : e.target.valueAsNumber)}
          />
        </label>
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={key === 'discount' ? 0.01 : key === 'years' || key === 'firstPayment' ? 1 : 0}
              max={key === 'share' ? 100 : key === 'years' ? 30 : undefined}
              step={key === 'years' ? 1 : 'any'}
              value={Number.isNaN(i[key]) ? '' : i[key]}
              onChange={(e) =>
                setI({ ...i, [key]: e.target.value === '' ? 0 : e.target.valueAsNumber })
              }
            />
          </label>
        ))}
        <label>
          Receipt realization (%)
          <input
            type="number"
            min="0"
            max="100"
            value={Number.isNaN(realization) ? '' : realization}
            onChange={(e) => setRealization(e.target.valueAsNumber)}
          />
        </label>
      </div>
      {!valid && (
        <p role="alert">
          Use nonnegative inputs, 1–30 whole years, a positive discount rate and percentages no
          greater than 100%.
        </p>
      )}
      <details>
        <summary>Basis & calculation</summary>
        <p>{offerBasis(f)}</p>
        <p>
          Property value starts at 90% of disclosed asking (or a separate proxy if unpriced), not an
          appraisal. 80% income share and 80% receipt realization are analyst assumptions. MW and
          account limits are unverified scenario inputs. No DR value is added for a vacant site or
          reduction below the call’s stated 1 MW minimum.
        </p>
        <p>
          DR Yield = our annual net DR / purchase price. Contract coverage = total undiscounted net
          DR / purchase price. PV coverage discounts the same payments. These are incremental DR
          metrics, not total property ROI. First annual payment and term use the editable inputs.
          Call timing and contract terms require confirmation. No terminal DR value or event energy
          revenue. Customer receipts only; no referral income added.
        </p>
        {r && (
          <>
            <p>
              Offer = (property value {money(i.propertyValue)} + included DR value{' '}
              {money(r.includeDr ? r.drValue : 0)} − repairs {money(i.capex)} − reserve{' '}
              {money(i.reserve)}) ÷ (1 + {i.closingPercent}% closing costs). Display rounded down to
              $5,000.
            </p>
            <table className="scenario-table">
              <thead>
                <tr>
                  <th>DR receipts</th>
                  <th>Annual net</th>
                  <th>DR Yield</th>
                  <th>Offer</th>
                </tr>
              </thead>
              <tbody>
                {[0, 0.5, 0.8, 1].map((s) => {
                  const x = offerScenario(f, i, s);
                  const e = demandEconomics(i, purchasePrice, s);
                  return (
                    <tr key={s}>
                      <td>{s * 100}%</td>
                      <td>{money(x.annualNet)}</td>
                      <td>{percent(e.annualYield)}</td>
                      <td>{money(Math.floor(x.offer / 5000) * 5000)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        <p>
          Annual net = lower MW input × rate × 365 × our share × receipt realization − annual costs.
          Unlevered, before tax. Confirm active load, permits, eligibility, income rights and costs
          before bidding.
        </p>
      </details>
    </div>
  );
}
