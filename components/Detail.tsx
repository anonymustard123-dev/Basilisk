'use client';
import { useEffect, useState } from 'react';
import { accepted, stages, type Facility } from '@/lib/model';
import { assetLabel, capacityLabel, loadLabel, priority } from '@/lib/scoring';
import { api, Badge, errorText, Field, Modal } from './shared';
import { AcquisitionDetail } from './AcquisitionDetail';
import { economicsBasis } from '@/lib/acquisitions';
const checklist = [
  'Operator & account / meters',
  'Recent utility bill',
  'PLC / capacity tag',
  'NSPL & interval profile',
  'Dispatch commitment',
  'Generator electrical nameplate',
  'Air permit & operating rights',
  'Buyer DR-history confirmation',
];
type Doc = { id: string; original_name: string; kind: string; created_at: string };
type ResearchBrief = {
  result: { summary: string; missing: string; next_action: string };
  model: string;
  created_at: string;
};
export function Detail({
  initial,
  readOnly,
  close,
  changed,
  research,
}: {
  initial: Facility;
  readOnly: boolean;
  close: () => void;
  changed: () => Promise<void>;
  research: () => void;
}) {
  const [f, setF] = useState(initial);
  const [version, setVersion] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [brief, setBrief] = useState<ResearchBrief | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [assetJson, setAssetJson] = useState(JSON.stringify(initial.assets, null, 2));
  const reload = async () => {
    const [r, docs, research] = await Promise.all([
      api<{ facility: Facility; version: number }>(`/api/facilities/${initial.id}`),
      api<{ documents: Doc[] }>(`/api/facilities/${initial.id}/documents`),
      api<{ research: ResearchBrief | null }>(`/api/facilities/${initial.id}/research`),
    ]);
    setF(r.facility);
    setVersion(r.version);
    setAssetJson(JSON.stringify(r.facility.assets, null, 2));
    setDocuments(docs.documents);
    setBrief(research.research);
  };
  useEffect(() => {
    if (!readOnly) reload().catch((e) => setError(errorText(e)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const action = async (work: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await work();
      await changed();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const save = () =>
    action(async () => {
      const candidate = { ...f, assets: advanced ? JSON.parse(assetJson) : f.assets };
      const result = await api<{ facility: Facility; version: number }>(`/api/facilities/${f.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ facility: candidate, version }),
      });
      setF(result.facility);
      setVersion(result.version);
    });
  const parts = priority(f).parts;
  const number = (value: string) => (value === '' ? null : Number(value));
  const proofOptions = f.evidence.filter(
    (e) => ['verified', 'estimated'].includes(e.status) && !e.conflict,
  );
  const proof = (label: string, ids: string[], update: (ids: string[]) => void) => (
    <Field label={label}>
      <select
        disabled={readOnly}
        value={ids[0] ?? ''}
        onChange={(e) => update(e.target.value ? [e.target.value] : [])}
      >
        <option value="">No reviewed evidence selected</option>
        {proofOptions
          .filter(
            (e) =>
              e.category ===
                (label.startsWith('PJM')
                  ? 'pjm'
                  : label.startsWith('Load')
                    ? 'load'
                    : label.startsWith('DR')
                      ? 'dr-history'
                      : 'qualification') &&
              (label.startsWith('Load') || e.status === 'verified'),
          )
          .map((e) => (
            <option key={e.id} value={e.id}>
              {e.fact} · {e.id}
            </option>
          ))}
      </select>
    </Field>
  );
  return (
    <Modal title={f.name} close={close} wide>
      <div className="detail-subhead">
        <span>
          {f.address}, {f.city}, {f.state} {f.postal_code}
        </span>
        <Badge tone="amber">{f.stage}</Badge>
      </div>
      <div className="detail-intro">
        <div className="eyebrow">WHY THIS FACILITY?</div>
        <p>{f.why}</p>
        <span className="origin-label">
          {f.origin} · last updated {new Date(f.updated_at).toLocaleDateString()}
        </span>
      </div>
      {f.acquisition && (
        <AcquisitionDetail
          facility={f}
          readOnly={readOnly}
          change={(a) => setF({ ...f, acquisition: a })}
        />
      )}
      <div className="vector-grid">
        <div>
          <span>01 / IN PJM?</span>
          <strong>
            {f.pjm.status === 'likely' ? 'Likely · not account verified' : f.pjm.status}
          </strong>
          <small>
            {f.pjm.utility ?? 'Utility unknown'} / {f.pjm.zone ?? 'Zone unknown'}
          </small>
        </div>
        <div>
          <span>02 / GRID DEMAND</span>
          <strong>{loadLabel(f)}</strong>
          <small>Generator nameplate is separate.</small>
        </div>
        <div>
          <span>03 / PRIOR DR?</span>
          <strong>{f.dr.status}</strong>
          <small>
            {f.dr.account_ref
              ? `Account ${f.dr.account_ref} · ${f.dr.as_of}`
              : 'Account / program history unconfirmed'}
          </small>
        </div>
        <div>
          <span>04 / REAL REDUCTION?</span>
          <strong>{assetLabel(f)}</strong>
          <small>Dispatch rights and deliverability need diligence.</small>
        </div>
      </div>
      {brief && (
        <details className="disclosure">
          <summary>Latest AI research brief · suggested, not reviewed</summary>
          <p>{brief.result.summary}</p>
          <p>
            <strong>Missing:</strong> {brief.result.missing}
          </p>
          <p>
            <strong>Next action:</strong> {brief.result.next_action}
          </p>
          <small>
            {brief.model} · {brief.created_at.slice(0, 10)} · Review individual cited claims below
            before changing qualification.
          </small>
        </details>
      )}
      <div className="next-box">
        <div>
          <span className="eyebrow">WHAT’S MISSING?</span>
          <h3>{f.missing}</h3>
          <p>{f.next_action}</p>
          <small>Approach: {f.target_role}</small>
        </div>
        <span>↗</span>
      </div>
      <div className="capacity-line">
        <span>Buyer-qualified capacity</span>
        <strong>{capacityLabel(f)}</strong>
      </div>
      <details className="disclosure">
        <summary>Priority {priority(f).score} / 100 · show transparent scoring</summary>
        <p>
          PJM {parts.pjm}/15 · load {parts.load}/25 · flexibility {parts.flexibility}/40 · DR
          history {parts.history}/20. Unknowns earn no verification points. The strongest evidenced
          reduction method is scored once; assets are never added to grid demand. This score cannot
          promote a CRM stage.
        </p>
      </details>
      <section className="detail-section">
        <div className="section-label">
          <h3>Physical assets</h3>
          <span>NAMEPLATE ≠ QUALIFIED MW</span>
        </div>
        {f.assets.length ? (
          f.assets.map((a) => (
            <div className="asset-row" key={a.id}>
              <strong>{a.description}</strong>
              <div className="inline">
                <Badge tone={a.permit === 'emergency-only' ? 'amber' : 'muted'}>
                  {a.permit.replaceAll('-', ' ')}
                </Badge>
                <Badge>{a.operation === 'approved' ? 'Approval only' : a.operation}</Badge>
                {!accepted(f, a.evidence_ids).length && (
                  <Badge tone="amber">Suggested evidence</Badge>
                )}
              </div>
              <p>{a.constraints}</p>
              <small>
                Fuel: {a.fuel} · meter: {a.meter_id ?? 'Unknown'} · electrical nameplate:{' '}
                {a.electrical_kw === null ? 'Unknown' : `${a.electrical_kw} kW total`}
                {a.bhp_each !== null ? ` · ${a.bhp_each} bhp per engine (not electric kW)` : ''}
              </small>
            </div>
          ))
        ) : (
          <p className="secondary">No documented controllable equipment or process yet.</p>
        )}
      </section>
      <section className="detail-section">
        <div className="section-label">
          <h3>Evidence & provenance</h3>
          <button className="text-button" disabled={readOnly || busy} onClick={research}>
            ✧ Research facility
          </button>
        </div>
        {f.evidence.map((e) => (
          <article className="evidence" key={e.id}>
            <div className="inline">
              <Badge
                tone={
                  e.status === 'verified' ? 'green' : e.status === 'contradicted' ? 'red' : 'amber'
                }
              >
                {e.status}
              </Badge>
              {e.conflict && <Badge tone="red">Conflicting claim</Badge>}
              <small>
                {e.method} · {e.document_date ?? 'Undated'}
              </small>
            </div>
            <h4>{e.fact}</h4>
            <p>{e.value}</p>
            <a href={e.source_url} target="_blank" rel="noreferrer">
              {e.source_title} ↗
            </a>
            <blockquote>{e.page_or_excerpt}</blockquote>
            <small>
              Author: {e.author} · captured {new Date(e.captured_at).toLocaleDateString()}
              <br />
              {e.reviewed_by
                ? `Reviewed by ${e.reviewed_by} · ${e.reviewed_at?.slice(0, 10)}`
                : 'Awaiting human review'}{' '}
              · claim ID: {e.id}
            </small>
            {!readOnly && (
              <div className="review-actions">
                {['verified', 'estimated', 'contradicted'].map((status) => (
                  <button
                    key={status}
                    className="subtle"
                    disabled={busy}
                    onClick={() =>
                      action(async () => {
                        await api(`/api/facilities/${f.id}/review`, {
                          method: 'POST',
                          body: JSON.stringify({
                            evidence_id: e.id,
                            status,
                            resolve_conflict: e.conflict,
                          }),
                        });
                        await reload();
                      })
                    }
                  >
                    {status === 'verified'
                      ? 'Verify source'
                      : status === 'estimated'
                        ? 'Mark estimated'
                        : 'Contradict'}
                    {e.conflict ? ' / resolve' : ''}
                  </button>
                ))}
              </div>
            )}
          </article>
        ))}
        <p className="fineprint">
          Verifying a source confirms only the stated fact. It does not establish demand-response
          permission or account eligibility. Keep conflicting claims and document their resolution.
        </p>
        {!readOnly && (
          <details className="disclosure">
            <summary>Add sourced evidence / buyer confirmation</summary>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                action(async () => {
                  await api(`/api/facilities/${f.id}/evidence`, {
                    method: 'POST',
                    body: JSON.stringify({
                      fact: data.get('fact'),
                      value: data.get('value'),
                      unit: null,
                      source_title: data.get('title'),
                      source_url: data.get('url'),
                      document_date: data.get('date') || null,
                      page_or_excerpt: data.get('excerpt'),
                      confidence: 'high',
                      category: data.get('category'),
                      method: data.get('method'),
                    }),
                  });
                  form.reset();
                  await reload();
                });
              }}
            >
              <div className="form-grid">
                <Field label="Fact">
                  <input name="fact" required />
                </Field>
                <Field label="Value">
                  <input name="value" required />
                </Field>
                <Field label="Source title">
                  <input name="title" required />
                </Field>
                <Field label="HTTPS source / private document reference">
                  <input name="url" type="url" required />
                </Field>
                <Field label="As-of date">
                  <input name="date" type="date" required />
                </Field>
                <Field label="Claim category">
                  <select name="category">
                    {[
                      'identity',
                      'pjm',
                      'load',
                      'dr-history',
                      'flexibility',
                      'qualification',
                      'other',
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Confirmation source">
                  <select name="method">
                    <option value="independent-research">Independent research</option>
                    <option value="buyer">Buyer confirmation</option>
                    <option value="customer">Customer confirmation</option>
                  </select>
                </Field>
              </div>
              <Field label="Supporting excerpt / page / confirmation record">
                <textarea name="excerpt" required />
              </Field>
              <p className="fineprint">
                For confidential confirmation, cite the authenticated Basilisk document URL, and
                keep the claim concise. Private documents are never sent to AI.
              </p>
              <button className="subtle" disabled={busy}>
                Add suggestion →
              </button>
            </form>
          </details>
        )}
      </section>
      <section className="detail-section">
        <h3>Outreach & due diligence</h3>
        {readOnly && (
          <p className="mode-note">
            Read-only: connect Supabase to save stages, notes, documents or reviewed decisions.
          </p>
        )}
        <div className="form-grid">
          <Field label="CRM stage">
            <select
              value={f.stage}
              disabled={readOnly}
              onChange={(e) => setF({ ...f, stage: e.target.value as Facility['stage'] })}
            >
              {stages.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="stack">
            <span className="secondary">Operator</span>
            <strong>{f.operator}</strong>
          </div>
        </div>
        <Field label="Notes / disqualification reason">
          <textarea
            rows={3}
            value={f.notes}
            disabled={readOnly}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
            placeholder="Keep next steps and account-specific diligence here."
          />
        </Field>
        <details className="disclosure">
          <summary>
            Needed before buyer submission · {f.checklist.length}/{checklist.length}
          </summary>
          <div className="checklist">
            {checklist.map((item) => (
              <label key={item}>
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={f.checklist.includes(item)}
                  onChange={(e) =>
                    setF({
                      ...f,
                      checklist: e.target.checked
                        ? [...f.checklist, item]
                        : f.checklist.filter((v) => v !== item),
                    })
                  }
                />
                {item}
              </label>
            ))}
          </div>
        </details>
        <details
          className="disclosure"
          open={advanced}
          onToggle={(e) => setAdvanced(e.currentTarget.open)}
        >
          <summary>Review the four decision vectors & buyer qualification</summary>
          <p className="fineprint">
            Select reviewed evidence for every verified value. DR confirmation must be dated and
            scoped to one account/program. Only buyer confirmation can establish qualified capacity.
          </p>
          <div className="form-grid">
            <Field label="PJM account status">
              <select
                disabled={readOnly}
                value={f.pjm.status}
                onChange={(e) =>
                  setF({
                    ...f,
                    pjm: { ...f.pjm, status: e.target.value as Facility['pjm']['status'] },
                  })
                }
              >
                {['unknown', 'likely', 'verified', 'no'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Utility">
              <input
                disabled={readOnly}
                value={f.pjm.utility ?? ''}
                onChange={(e) => setF({ ...f, pjm: { ...f.pjm, utility: e.target.value || null } })}
              />
            </Field>
            <Field label="Zone / subzone">
              <input
                disabled={readOnly}
                value={f.pjm.zone ?? ''}
                onChange={(e) => setF({ ...f, pjm: { ...f.pjm, zone: e.target.value || null } })}
              />
            </Field>
            {proof('PJM evidence', f.pjm.evidence_ids, (ids) =>
              setF({ ...f, pjm: { ...f.pjm, evidence_ids: ids } }),
            )}
            <Field label="Verified grid demand MW">
              <input
                disabled={readOnly}
                type="number"
                min="0"
                step="any"
                value={f.load.verified_mw ?? ''}
                onChange={(e) =>
                  setF({ ...f, load: { ...f.load, verified_mw: number(e.target.value) } })
                }
              />
            </Field>
            {proof('Load evidence', f.load.evidence_ids, (ids) =>
              setF({ ...f, load: { ...f.load, evidence_ids: ids } }),
            )}
            <Field label="Estimated demand · lower MW">
              <input
                disabled={readOnly}
                type="number"
                min="0"
                step="any"
                value={f.load.estimated_min_mw ?? ''}
                onChange={(e) =>
                  setF({ ...f, load: { ...f.load, estimated_min_mw: number(e.target.value) } })
                }
              />
            </Field>
            <Field label="Estimated demand · upper MW">
              <input
                disabled={readOnly}
                type="number"
                min="0"
                step="any"
                value={f.load.estimated_max_mw ?? ''}
                onChange={(e) =>
                  setF({ ...f, load: { ...f.load, estimated_max_mw: number(e.target.value) } })
                }
              />
            </Field>
            <Field label="DR history">
              <select
                disabled={readOnly}
                value={f.dr.status}
                onChange={(e) =>
                  setF({
                    ...f,
                    dr: { ...f.dr, status: e.target.value as Facility['dr']['status'] },
                  })
                }
              >
                {['unknown', 'never enrolled', 'prior participation', 'currently enrolled'].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Utility account reference (internal)">
              <input
                disabled={readOnly}
                value={f.dr.account_ref ?? ''}
                onChange={(e) =>
                  setF({ ...f, dr: { ...f.dr, account_ref: e.target.value || null } })
                }
              />
            </Field>
            <Field label="DR confirmation as of">
              <input
                disabled={readOnly}
                type="date"
                value={f.dr.as_of ?? ''}
                onChange={(e) => setF({ ...f, dr: { ...f.dr, as_of: e.target.value || null } })}
              />
            </Field>
            <Field label="Program / product scope">
              <input
                disabled={readOnly}
                value={f.dr.program ?? ''}
                onChange={(e) => setF({ ...f, dr: { ...f.dr, program: e.target.value || null } })}
              />
            </Field>
            <Field label="Premium eligibility">
              <select
                disabled={readOnly}
                value={f.dr.premium}
                onChange={(e) =>
                  setF({
                    ...f,
                    dr: { ...f.dr, premium: e.target.value as Facility['dr']['premium'] },
                  })
                }
              >
                {['unknown', 'buyer-review', 'incompatible', 'exception-confirmed'].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
            {proof('DR confirmation evidence', f.dr.evidence_ids, (ids) =>
              setF({ ...f, dr: { ...f.dr, evidence_ids: ids, confidence: 'high' } }),
            )}
            <Field label="Buyer-approved / cleared MW">
              <input
                disabled={readOnly}
                type="number"
                min="0"
                step="any"
                value={f.qualification.mw ?? ''}
                onChange={(e) =>
                  setF({ ...f, qualification: { ...f.qualification, mw: number(e.target.value) } })
                }
              />
            </Field>
            <Field label="Confirming buyer / CSP">
              <input
                disabled={readOnly}
                value={f.qualification.buyer ?? ''}
                onChange={(e) =>
                  setF({
                    ...f,
                    qualification: { ...f.qualification, buyer: e.target.value || null },
                  })
                }
              />
            </Field>
            <Field label="Buyer confirmation date">
              <input
                disabled={readOnly}
                type="date"
                value={f.qualification.confirmed_at ?? ''}
                onChange={(e) =>
                  setF({
                    ...f,
                    qualification: { ...f.qualification, confirmed_at: e.target.value || null },
                  })
                }
              />
            </Field>
            <Field label="Qualified account reference">
              <input
                disabled={readOnly}
                value={f.qualification.account_ref ?? ''}
                onChange={(e) =>
                  setF({
                    ...f,
                    qualification: { ...f.qualification, account_ref: e.target.value || null },
                  })
                }
              />
            </Field>
            {proof('Buyer qualification evidence', f.qualification.evidence_ids, (ids) =>
              setF({ ...f, qualification: { ...f.qualification, evidence_ids: ids } }),
            )}
          </div>
          <Field label="Physical assets · structured editor">
            <textarea
              className="code-input"
              rows={9}
              disabled={readOnly}
              value={assetJson}
              onChange={(e) => setAssetJson(e.target.value)}
            />
          </Field>
          <p className="fineprint">
            electrical_kw is total documented electrical nameplate, never bhp conversion. Reference
            claim IDs in evidence_ids. Keep account/meter assignments and operating constraints
            explicit. Solar is excluded from reduction scoring.
          </p>
        </details>
        <button className="primary" disabled={readOnly || busy} onClick={save}>
          {busy ? 'Saving…' : 'Save reviewed changes →'}
        </button>
      </section>
      <section className="detail-section">
        <h3>Confidential documents</h3>
        <p className="secondary">
          Private storage, account-authorized uploads, signed downloads. Files are never submitted
          to AI.
        </p>
        {documents.map((d) => (
          <a
            className="document"
            key={d.id}
            href={`/api/documents/${d.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <span>
              ▤ {d.original_name}
              <small>
                {d.kind} · {d.created_at.slice(0, 10)}
              </small>
            </span>
            <Badge>Confidential ↗</Badge>
          </a>
        ))}
        {!readOnly && (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              data.set('authorized', data.get('authorized') === 'on' ? 'true' : 'false');
              action(async () => {
                await api(`/api/facilities/${f.id}/documents`, { method: 'POST', body: data });
                form.reset();
                await reload();
              });
            }}
          >
            <div className="form-grid">
              <Field label="Document type">
                <select name="kind">
                  {[
                    'Utility bill',
                    'Interval load',
                    'PLC / NSPL tag',
                    'Generator nameplate',
                    'Air permit',
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="File · under 4 MB">
                <input name="file" type="file" accept=".pdf,.csv,.png,.jpg,.jpeg" required />
              </Field>
            </div>
            <label className="authorization">
              <input name="authorized" type="checkbox" required />I am authorized to store this
              confidential customer document in this Basilisk workspace.
            </label>
            <button className="subtle" disabled={busy}>
              Upload privately →
            </button>
          </form>
        )}
      </section>
      <details className="disclosure">
        <summary>Illustrative referral-fee scenario</summary>
        <Economics facility={f} />
      </details>
      {error && (
        <p className="error sticky-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
function Economics({ facility }: { facility: Facility }) {
  const basis = economicsBasis(facility);
  const [fee, setFee] = useState('10');
  const [term, setTerm] = useState('1');
  if (!basis)
    return (
      <p className="fineprint">
        No supported qualifying-MW assumption. Collect and review site/account evidence before
        calculating a hypothetical referral fee. Vacant properties do not provide current qualified
        demand.
      </p>
    );
  const capacity = String(basis.mw);
  return (
    <div className="stack">
      <p className="fineprint">
        Buyer quote — unverified contract terms; illustrative referral fee only. No assumed ten-year
        fee stream or customer payout. Basis: {basis.label}.
      </p>
      <div className="form-grid">
        <Field label="Supported qualifying-MW basis">
          <input type="number" min="0" value={capacity} readOnly />
        </Field>
        <Field label="Illustrative $ / MW / day">
          <input type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
        <Field label="Illustrative years">
          <input type="number" min="0" value={term} onChange={(e) => setTerm(e.target.value)} />
        </Field>
      </div>
      <strong>
        {capacity === ''
          ? 'Enter approved MW'
          : `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(capacity) * Number(fee) * 365)} / year · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(capacity) * Number(fee) * 365 * Number(term))} over entered term`}
      </strong>
      <small>Scenario values are not saved as pipeline revenue.</small>
    </div>
  );
}
