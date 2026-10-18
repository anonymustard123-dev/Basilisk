'use client';
import { useState } from 'react';
import type { Facility } from '@/lib/model';
import { money } from '@/lib/acquisitions';
import type { OfferInputs } from '@/lib/underwriting';
import { defaultOffer, offerBasis, offerScenario } from '@/lib/offer-defaults';
import { Modal } from './shared';

type Tab = 'Research' | 'Underwriting';
export default function CandidateWorkspace({ facilities }: { facilities: Facility[] }) {
  const [selection, setSelection] = useState<{ f: Facility; tab: Tab } | null>(null);
  return (
    <main className="candidate-workspace">
      <header className="quiet-header">
        <div className="quiet-brand">
          BASILISK<span> / ACQUISITIONS</span>
        </div>
        <span>Shortlist · 04</span>
      </header>
      <section className="quiet-intro">
        <p className="eyebrow">PJM · BEHIND THE METER</p>
        <h1>
          Acquisition shortlist<span>.</span>
        </h1>
      </section>
      <section aria-label="Four acquisition candidates" className="quiet-grid">
        {facilities.map((f, index) => {
          const a = f.acquisition!,
            r = offerScenario(f, defaultOffer(f));
          return (
            <article className="quiet-card" key={f.id}>
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
              <div className="card-offer-pair">
                <div>
                  <span>Asking{a.price_status === 'disputed' ? ' · price conflict' : ''}</span>
                  <strong>{money(a.asking_price_usd)}</strong>
                </div>
                <div>
                  <span>Indicative offer</span>
                  <strong>{money(Math.floor(r.offer / 5000) * 5000)}</strong>
                </div>
              </div>
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
      <footer className="quiet-footer">Offers are assumption-based · October 18, 2026</footer>
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
            {money(a.asking_price_usd)}
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
    [realization, setRealization] = useState(80);
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
    realization <= 100;
  const r = valid ? offerScenario(f, i, realization / 100) : null;
  const ask = f.acquisition!.asking_price_usd!;
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
            ? `${((1 - r.offer / ask) * 100).toFixed(1)}% below asking · ${r.includeDr ? 'includes modeled DR upside' : 'property-only; DR excluded'}`
            : 'Check inputs below'}
        </p>
      </div>
      {r && (
        <dl className="dossier-facts">
          <div>
            <dt>Our annual DR cash flow · modeled</dt>
            <dd>{money(r.annualNet)}</dd>
          </div>
          <div>
            <dt>DR value included in offer</dt>
            <dd>{money(r.includeDr ? r.drValue : 0)}</dd>
          </div>
        </dl>
      )}
      <h3>
        Assumptions{' '}
        <button
          className="text-button reset-offer"
          onClick={() => {
            setI(defaultOffer(f));
            setRealization(80);
          }}
        >
          Reset
        </button>
      </h3>
      <div className="underwriting-inputs">
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
          Property value starts at 90% of asking as a negotiation proxy, not an appraisal. 80%
          income share and 80% receipt realization are analyst assumptions. MW and account limits
          are unverified scenario inputs. No DR value is added for a vacant site or reduction below
          the call’s stated 1 MW minimum.
        </p>
        <p>
          First annual payment in year 3; 10 income years; 15% discount. Call timing and contract
          terms require confirmation. No terminal DR value or event energy revenue. Customer
          receipts only; no referral income added.
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
                  <th>Offer</th>
                </tr>
              </thead>
              <tbody>
                {[0, 0.5, 0.8, 1].map((s) => {
                  const x = offerScenario(f, i, s);
                  return (
                    <tr key={s}>
                      <td>{s * 100}%</td>
                      <td>{money(x.annualNet)}</td>
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
