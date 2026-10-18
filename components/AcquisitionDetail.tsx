'use client';
import type { Acquisition, Facility } from '@/lib/model';
import { availabilityLabel, money, qualifyingMwLabel, readiness } from '@/lib/acquisitions';
import { Badge, Field } from './shared';
export function AcquisitionDetail({
  facility: f,
  readOnly,
  change,
}: {
  facility: Facility;
  readOnly: boolean;
  change: (a: Acquisition) => void;
}) {
  const a = f.acquisition!;
  const num = (v: string) => (v === '' ? null : Number(v));
  return (
    <section className="acquisition-detail">
      <div className="section-label">
        <h3>Acquisition research · Research required</h3>
        <Badge tone={a.availability === 'advertised' ? 'green' : 'amber'}>
          {availabilityLabel(f)}
        </Badge>
      </div>
      <div className="acquisition-facts">
        <div>
          <span>
            {a.price_status === 'last-reported' ? 'Last reported price' : 'Reported asking price'}
          </span>
          <strong>
            {money(a.asking_price_usd)}
            {a.alternate_price_usd !== null
              ? ` / ${money(a.alternate_price_usd)} in description`
              : ''}
          </strong>
        </div>
        <div>
          <span>Building size · {a.area_status}</span>
          <strong>{a.building_sqft?.toLocaleString('en-US') ?? 'Unknown'} sq ft</strong>
        </div>
        <div>
          <span>Estimated qualifying MW</span>
          <strong>{qualifyingMwLabel(f)}</strong>
        </div>
        <div>
          <span>DR readiness</span>
          <strong>{readiness(f)}</strong>
        </div>
        <div>
          <span>Property type / occupancy</span>
          <strong>
            {a.property_type} / {a.occupancy.replaceAll('-', ' ')}
          </strong>
        </div>
      </div>
      <p>{a.verification_notes}</p>
      <p className="fineprint">
        Listing check: {a.checked_at?.slice(0, 10) ?? 'Not reviewed'} · Source ID: {a.source_id}.
        Building size and asking price contribute no electric-load or eligibility points.
      </p>
      <a className="button subtle" href={a.listing_url} target="_blank" rel="noreferrer">
        Open original listing ↗
      </a>
      {!readOnly && (
        <details className="disclosure">
          <summary>Update acquisition facts / supported MW assumption</summary>
          <div className="form-grid">
            <Field label="Asking price USD">
              <input
                type="number"
                min="0"
                value={a.asking_price_usd ?? ''}
                onChange={(e) => change({ ...a, asking_price_usd: num(e.target.value) })}
              />
            </Field>
            <Field label="Price status">
              <select
                value={a.price_status}
                onChange={(e) =>
                  change({ ...a, price_status: e.target.value as Acquisition['price_status'] })
                }
              >
                {['listed', 'disputed', 'last-reported', 'unverified'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Building square feet">
              <input
                type="number"
                min="1"
                value={a.building_sqft ?? ''}
                onChange={(e) => change({ ...a, building_sqft: num(e.target.value) })}
              />
            </Field>
            <Field label="Availability">
              <select
                value={a.availability}
                onChange={(e) =>
                  change({
                    ...a,
                    availability: e.target.value as Acquisition['availability'],
                    checked_at: new Date().toISOString(),
                  })
                }
              >
                {['advertised', 'unverified', 'off-market', 'sold'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Occupancy">
              <select
                value={a.occupancy}
                onChange={(e) =>
                  change({ ...a, occupancy: e.target.value as Acquisition['occupancy'] })
                }
              >
                {['occupied', 'vacant', 'former-use', 'unknown'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Ability to reduce grid load">
              <select
                value={a.reduction}
                onChange={(e) =>
                  change({ ...a, reduction: e.target.value as Acquisition['reduction'] })
                }
              >
                {['confirmed', 'possible', 'unknown', 'no'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Reviewed flexibility claim">
              <select
                value={a.reduction_evidence_ids[0] ?? ''}
                onChange={(e) =>
                  change({ ...a, reduction_evidence_ids: e.target.value ? [e.target.value] : [] })
                }
              >
                <option value="">Unknown</option>
                {f.evidence
                  .filter(
                    (e) => e.category === 'flexibility' && e.status === 'verified' && !e.conflict,
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fact} · {e.id}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Estimated qualifying MW · not buyer clearance">
              <input
                type="number"
                min="0"
                step="any"
                value={a.qualifying_mw ?? ''}
                onChange={(e) => change({ ...a, qualifying_mw: num(e.target.value) })}
              />
            </Field>
            <Field label="Reviewed qualification claim">
              <select
                value={a.qualifying_evidence_ids[0] ?? ''}
                onChange={(e) =>
                  change({ ...a, qualifying_evidence_ids: e.target.value ? [e.target.value] : [] })
                }
              >
                <option value="">No supported assumption</option>
                {f.evidence
                  .filter(
                    (e) =>
                      e.category === 'qualification' &&
                      ['verified', 'estimated'].includes(e.status) &&
                      !e.conflict,
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fact} · {e.id}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
          <Field label="Explicit qualifying-MW assumption / basis">
            <textarea
              value={a.qualifying_assumption}
              onChange={(e) => change({ ...a, qualifying_assumption: e.target.value })}
            />
          </Field>
          <Field label="Verification notes / broker confirmation">
            <textarea
              value={a.verification_notes}
              onChange={(e) => change({ ...a, verification_notes: e.target.value })}
            />
          </Field>
          <p className="fineprint">
            Use Save reviewed changes below. Add and review source evidence before entering MW. A
            vacant site remains Not Currently Ready.
          </p>
        </details>
      )}
    </section>
  );
}
