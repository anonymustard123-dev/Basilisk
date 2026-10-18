'use client';
import { useState } from 'react';
import type { Facility } from '@/lib/model';
import { availabilityLabel, money } from '@/lib/acquisitions';
import { underwrite, type OfferInputs } from '@/lib/underwriting';
import { Modal } from './shared';

const dossiers: Record<
  string,
  { thesis: string; risks: string[]; requests: string[]; walk: string }
> = {
  'acq-wooster': {
    thesis:
      'An occupied manufacturing property could offer an existing load and a tenant relationship. The potential transaction is first a real-estate investment; any DR upside depends on the tenant’s account, production schedule and contractual consent.',
    risks: [
      'The supplied listing redirects; current sale availability and exact premises are unresolved.',
      'Reported areas differ: 88,438 versus 87,806 SF. Nearby 951 Wooster records must not be treated as this property.',
      'A landlord does not automatically own a tenant’s utility account or DR receipts. No generator or qualifying MW is documented.',
    ],
    requests: [
      'Broker confirmation of parcel, current ask, sale status and measured area.',
      'Rent roll, leases, tenant credit, expense history, roof/structure and environmental reports appropriate to prior rubber manufacturing.',
      'Tenant LOA, 12–24 months of interval load and bills, capacity/transmission tags and scoped enrollment history.',
      'Tenant-approved curtailment plan, interruption costs and signed allocation of DR rights and income.',
    ],
    walk: 'Do not pay a DR premium without tenant cooperation. Reject an acquisition thesis that requires interrupting production without a signed operational plan.',
  },
  'acq-phillips': {
    thesis:
      'The reported Kohler backup generator gives this site the most concrete equipment diligence path of the four. It does not establish a Tier 2 diesel asset, an available MW rating, or an operating customer.',
    risks: [
      'Former industrial/R&D use does not establish current occupancy or active grid demand.',
      'Generator fuel, tier, electrical kW, maintenance condition, transfer controls and permits are unknown.',
      'The transcript’s $200 rate is specific to Tier 2 diesel; it cannot automatically price this equipment.',
    ],
    requests: [
      'Current occupancy, broker-confirmed ask, survey and condition assessment; listing reports 53,847 SF.',
      'Kohler nameplate photos, model/serial, electrical output, fuel, emissions tier, service logs and witnessed load test.',
      'Single-line diagram, transfer scheme, air permits and written review of permissible event operation.',
      'Metered demand, tags, account history and buyer-approved eligible reduction; obtain upgrade, telemetry and maintenance quotes.',
    ],
    walk: 'If current demand is absent or the equipment cannot legally support events, value only the real estate and documented equipment salvage/use value.',
  },
  'acq-macdade': {
    thesis:
      'A small former cold-storage building may have reusable insulation and refrigeration infrastructure. Thermal load shifting is an operating hypothesis that needs an active refrigeration business and a temperature-safe curtailment study.',
    risks: [
      'The broker header asks $775,000 while the description says $800,000.',
      'Approximately 7,000 SF is a building measure, not evidence of one MW of flexible load.',
      'Current refrigeration operation, tenant, equipment condition and prior DR participation are unknown.',
    ],
    requests: [
      'Written asking price and availability; occupancy, equipment inventory and refrigeration service history.',
      'Utility bills, interval data, tags and compressor electrical ratings; identify current meter/account.',
      'Product temperature limits, thermal ride-through study, restart demand, spoilage risk and insurer/customer approval.',
      'Independent property valuation, refrigeration recommissioning quotes and signed operating/customer participation rights.',
    ],
    walk: 'Treat it as a real-estate/reuse opportunity if active eligible reduction cannot meet the partner’s stated one-MW threshold. Do not manufacture load to justify a premium.',
  },
  'acq-porter': {
    thesis:
      'A historical refrigerated-storage lead with a possible future reuse case. Off-market status and reported vacancy put acquisition availability and a viable operating plan ahead of any DR calculation.',
    risks: [
      'The source shows Off Market and Unpriced. $420,000 is historical, not a live offer.',
      'Approximately 6,300 SF and freezer details are historical/user-reported.',
      'Vacant space has no demonstrated curtailable operating demand. No current DR revenue is supported.',
    ],
    requests: [
      'Owner/broker confirmation that a sale is possible and a current written price.',
      'Title/parcel records, inspection, refrigeration integrity, utilities and activation costs.',
      'An economically viable tenant/use, funding plan and schedule independent of DR receipts.',
      'After activation: measured demand, tags, account history and written partner eligibility review.',
    ],
    walk: 'Keep current DR acquisition value at zero. Stop diligence if the owner will not sell or a viable independent use cannot be established.',
  },
};
type Tab = 'Research' | 'Underwriting';
export default function CandidateWorkspace({ facilities }: { facilities: Facility[] }) {
  const [selection, setSelection] = useState<{ f: Facility; tab: Tab } | null>(null);
  return (
    <main className="candidate-workspace">
      <header className="quiet-header">
        <div className="quiet-brand">
          BASILISK<span> / ACQUISITIONS</span>
        </div>
        <span>Research shortlist · 04</span>
      </header>
      <section className="quiet-intro">
        <p className="eyebrow">PJM · BEHIND THE METER</p>
        <h1>
          Four properties. <span>A closer look.</span>
        </h1>
        <p>Property research, the open questions, and the economics of a possible offer.</p>
      </section>
      <section aria-label="Four acquisition candidates" className="quiet-grid">
        {facilities.map((f, index) => {
          const a = f.acquisition!;
          return (
            <article className="quiet-card" key={f.id}>
              <div className="quiet-card-meta">
                <span>
                  0{index + 1} / {f.city}, {f.state}
                </span>
                <span className={a.availability === 'off-market' ? 'quiet-warning' : ''}>
                  {availabilityLabel(f)}
                </span>
              </div>
              <h2>
                <button onClick={() => setSelection({ f, tab: 'Research' })}>{f.name}</button>
              </h2>
              <p className="quiet-type">
                {a.property_type} · {a.building_sqft?.toLocaleString()} SF
                {a.area_status !== 'reported' ? ' (reported / approximate)' : ''}
              </p>
              <div className="quiet-price">
                {money(a.asking_price_usd)}
                <span>
                  {a.price_status === 'last-reported'
                    ? 'Historical price'
                    : a.price_status === 'disputed'
                      ? 'Asking · $800,000 also reported'
                      : a.price_status === 'unverified'
                        ? 'Reported asking · unverified'
                        : 'Advertised asking'}
                </span>
              </div>
              <p className="quiet-thesis">{f.why}</p>
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
        No qualifying MW verified. Listing observations checked October 18, 2026; confirm with the
        broker before acting.
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
          <div role="tabpanel" aria-label={selection.tab}>
            {selection.tab === 'Research' ? (
              <Research f={selection.f} />
            ) : (
              <Underwriting key={selection.f.id} f={selection.f} />
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}
function Research({ f }: { f: Facility }) {
  const d = dossiers[f.id],
    a = f.acquisition!;
  return (
    <div className="dossier-content">
      <p className="dossier-lead">{d.thesis}</p>
      <dl className="dossier-facts">
        <div>
          <dt>Occupancy</dt>
          <dd>{a.occupancy.replace('-', ' ')} · listing reported</dd>
        </div>
        <div>
          <dt>Operator / tenant</dt>
          <dd>{f.operator}</dd>
        </div>
        <div>
          <dt>Qualifying reduction</dt>
          <dd>Unknown · no verified MW</dd>
        </div>
        <div>
          <dt>Utility / PJM zone</dt>
          <dd>Unverified at account level</dd>
        </div>
      </dl>
      <h3>What needs resolving</h3>
      <ul>
        {d.risks.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <h3>Request before making an offer</h3>
      <ol>
        {d.requests.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ol>
      <div className="dossier-callout">
        <strong>Investment discipline</strong>
        <p>{d.walk}</p>
      </div>
      <h3>Source record</h3>
      <p>{a.verification_notes}</p>
      {f.evidence.map((e) => (
        <details key={e.id}>
          <summary>
            {e.fact} ·{' '}
            {e.conflict
              ? 'conflicting source claims'
              : e.status === 'verified'
                ? 'listing observation'
                : 'unconfirmed report'}
          </summary>
          <p>{e.value}</p>
          <p>{e.page_or_excerpt}</p>
          <a href={e.source_url ?? a.listing_url} target="_blank" rel="noreferrer">
            View source ↗
          </a>
        </details>
      ))}
      <p className="dossier-small">
        A reviewed listing claim verifies what a page says; it does not verify physical condition,
        current availability or program eligibility.
      </p>
      <a className="dossier-source" href={a.listing_url} target="_blank" rel="noreferrer">
        Original property listing ↗
      </a>
    </div>
  );
}
const initial: OfferInputs = {
  propertyValue: 0,
  closingPercent: 3,
  capex: 0,
  reserve: 0,
  mw: 0,
  capacityTag: 0,
  rate: 200,
  share: 0,
  annualCost: 0,
  years: 10,
  firstPayment: 3,
  discount: 15,
};
function Underwriting({ f }: { f: Facility }) {
  const [i, setI] = useState(initial),
    [mode, setMode] = useState('customer'),
    [checks, setChecks] = useState<string[]>([]);
  const gates = [
    'Account-level eligible MW and capacity tag accepted by partner',
    'Prior enrollment and current program eligibility confirmed in writing',
    'Signed revenue rights / tenant consent and income allocation',
    'Signed rate, payment timing and duration for this income stream',
    'Legal operating permissions, equipment condition and dispatch plan confirmed',
    'Property valuation, operating costs and capital budget independently supported',
  ];
  const valid =
    Object.values(i).every((x) => Number.isFinite(x) && x >= 0) &&
    i.discount > 0 &&
    i.firstPayment >= 1 &&
    i.years >= 1 &&
    i.years <= 30 &&
    Number.isInteger(i.years) &&
    i.share <= 100;
  const r = valid ? underwrite(i) : null;
  const ready =
    checks.length === gates.length &&
    i.propertyValue > 0 &&
    i.mw > 0 &&
    i.capacityTag > 0 &&
    i.share > 0 &&
    i.years > 0 &&
    f.acquisition!.occupancy !== 'vacant';
  const fields: [keyof OfferInputs, string][] = [
    ['propertyValue', 'Standalone property value ($)'],
    ['closingPercent', 'Purchase closing costs (%)'],
    ['capex', 'Upfront repairs / DR upgrades ($)'],
    ['reserve', 'Contingency / holding reserve ($)'],
    ['mw', 'Partner-accepted reduction (MW)'],
    ['capacityTag', 'Account capacity limit (MW)'],
    ['rate', 'Contract rate ($/MW-day)'],
    ['share', 'Income retained by us (%)'],
    ['annualCost', 'Annual incremental costs ($)'],
    ['years', 'Contract income years'],
    ['firstPayment', 'Years until first annual payment'],
    ['discount', 'Unlevered discount rate (%)'],
  ];
  return (
    <div className="dossier-content">
      <p className="dossier-lead">What can this property support?</p>
      <p>
        Start with an independently supported property value that excludes DR income. Add only the
        present value of DR cash flow we have the contractual right to receive, then deduct capital
        costs, reserves and purchase costs.
      </p>
      <div className="offer-verdict">
        <span>Current evidence-based position</span>
        <h3>No defensible acquisition offer yet.</h3>
        <p>
          All four properties lack verified qualifying MW and account eligibility. Current supported
          DR premium: <strong>$0</strong>. Asking price is not an appraisal.
        </p>
      </div>
      <h3>Build a conditional scenario</h3>
      <p className="dossier-small">
        Inputs are working assumptions in this browser session. Nothing is saved or independently
        verified. Blank starting values appear as zero; zero costs are placeholders requiring
        quotes.
      </p>
      <label className="scenario-mode">
        Income stream
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setChecks([]);
            setI({
              ...i,
              rate: e.target.value === 'referral' ? 10 : 200,
              years: e.target.value === 'referral' ? 1 : 10,
            });
          }}
        >
          <option value="customer">Customer receipts · Tier 2 diesel illustration</option>
          <option value="referral">Referral fee · separate income stream</option>
        </select>
      </label>
      <div className="underwriting-inputs">
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={key === 'discount' ? 0.01 : key === 'firstPayment' || key === 'years' ? 1 : 0}
              max={key === 'share' ? 100 : key === 'years' ? 30 : undefined}
              step={key === 'years' ? 1 : 'any'}
              value={i[key]}
              onChange={(e) =>
                setI({ ...i, [key]: e.target.value === '' ? 0 : e.target.valueAsNumber })
              }
            />
          </label>
        ))}
      </div>
      <p className="dossier-small">
        Defaults: 3% purchase costs, 15% discount rate and first annual payment in year 3 are
        analyst assumptions. The 10-year customer term is a call claim; the one-year referral term
        is a conservative placeholder because referral duration was not stated. Share begins at 0%
        until income rights are established.
      </p>
      {!valid && (
        <p role="alert">
          Enter finite, nonnegative inputs, a positive discount rate, 1–30 whole contract years,
          first payment at least one year away and a share no greater than 100%.
        </p>
      )}
      {r && (
        <>
          <dl className="dossier-facts">
            <div>
              <dt>Modeled eligible MW · lower of inputs</dt>
              <dd>{r.mw.toLocaleString()} MW</dd>
            </div>
            <div>
              <dt>
                {mode === 'referral'
                  ? 'Gross referral receipts / year'
                  : 'Gross customer receipts / year'}
              </dt>
              <dd>{money(r.gross)}</dd>
            </div>
            <div>
              <dt>Our annual net · before tax / debt</dt>
              <dd>{money(r.annualNet)}</dd>
            </div>
            <div>
              <dt>Present value of incremental DR</dt>
              <dd>{money(r.drValue)}</dd>
            </div>
          </dl>
          <h3>Offer bridge</h3>
          <p>
            Standalone value {money(i.propertyValue)} + DR present value {money(r.drValue)} −
            upfront costs {money(i.capex)} − reserve {money(i.reserve)}, divided by (1 +{' '}
            {i.closingPercent}% purchase costs).
          </p>
          <div className="dossier-callout">
            <strong>
              {i.propertyValue <= 0
                ? 'Enter an independent property value to calculate a ceiling.'
                : `Property-only ceiling: ${money(r.propertyOnly)}`}
            </strong>
            <p>
              {ready
                ? `Conditional scenario ceiling: ${money(r.ceiling)}. User confirmations only; supporting documents still require review.`
                : 'DR-inclusive offer withheld until the evidence checks below are complete. Scenario cash flows above are illustrative.'}
            </p>
            {i.propertyValue > 0 && r.propertyOnly < 0 && (
              <p>Costs exceed standalone value; no positive property-only offer is supported.</p>
            )}
          </div>
          <details>
            <summary>Cash-flow sensitivities and calculation</summary>
            <p>
              Annual net = eligible MW × $/MW-day × 365 × our share × receipt realization − full
              annual costs. Discount each annual payment at years {i.firstPayment} through{' '}
              {i.firstPayment + i.years - 1}. No terminal DR value, event revenue, tax benefits,
              financing or equipment resale value is included. The 365-day convention is an
              assumption; replace the rate with an effective annualized rate if paid days differ.
            </p>
            <table className="scenario-table">
              <thead>
                <tr>
                  <th>Receipt realization*</th>
                  <th>Our net / year</th>
                  <th>DR present value</th>
                </tr>
              </thead>
              <tbody>
                {[0, 0.5, 0.8, 1].map((s) => {
                  const x = underwrite(i, s);
                  return (
                    <tr key={s}>
                      <td>{s * 100}%</td>
                      <td>{money(x.annualNet)}</td>
                      <td>{money(x.drValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p>
              *Sensitivity assumptions, not estimated probabilities. Full annual operating costs
              remain payable even at zero receipts. No DR scenario assumes no project and avoids
              these incremental costs; it is reflected in the property-only ceiling.
            </p>
          </details>
        </>
      )}
      <h3>Evidence required to support a DR premium</h3>
      <div className="underwriting-checks">
        {gates.map((g) => (
          <label key={g}>
            <input
              type="checkbox"
              checked={checks.includes(g)}
              onChange={(e) =>
                setChecks(e.target.checked ? [...checks, g] : checks.filter((x) => x !== g))
              }
            />
            {g}
          </label>
        ))}
      </div>
      {f.acquisition!.occupancy === 'vacant' && (
        <p className="quiet-warning">
          This property is reported vacant. DR-inclusive offers remain blocked pending an active
          operating load; checking boxes cannot resolve this.
        </p>
      )}
      <h3>What the call actually supports</h3>
      <ul>
        <li>
          <strong>$200/MW-day:</strong> about $73,000 per MW-year gross to a Tier 2 diesel customer
          at 365 paid days. No rate was provided for ordinary load-drop or other equipment.
        </li>
        <li>
          <strong>$10/MW-day:</strong> about $3,650 per cleared MW-year referral receipts. Do not
          add customer and referral receipts without separate signed rights. Referral duration was
          not confirmed.
        </li>
        <li>
          <strong>Timing:</strong> April 2028 readiness and June 2028 commencement were stated, but
          another passage says 2029. Obtain delivery-year and first-payment dates in writing.
        </li>
        <li>
          <strong>Eligibility:</strong> the speaker described a one-MW BTM minimum, account-level
          prior-enrollment restrictions and capacity-tag limits. These are partner claims, not
          verified universal PJM rules.
        </li>
        <li>
          <strong>Excluded upside:</strong> event energy payments, promised future emissions
          upgrades and paused-program re-entry are not capitalized. Obtain written performance,
          nonpayment, termination, fuel and maintenance terms.
        </li>
      </ul>
      <p className="dossier-small">
        Source: user-supplied commercial call transcript (undated). Public PJM materials explain
        load-reduction participation and account registration but do not validate this partner’s
        quoted pricing or offer.
      </p>
      <a
        href="https://www.pjm.com/markets-and-operations/demand-response.aspx"
        target="_blank"
        rel="noreferrer"
      >
        PJM demand response overview ↗
      </a>
    </div>
  );
}
