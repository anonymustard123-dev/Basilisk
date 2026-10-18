'use client';
import { useState } from 'react';
import { acquisitionSchema, blankFacility, type Facility } from '@/lib/model';
import { api, Badge, errorText, Field } from './shared';
export function ImportLead({ readOnly, done }: { readOnly: boolean; done: () => Promise<void> }) {
  const [tab, setTab] = useState<'file' | 'form'>('file');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [preview, setPreview] = useState<Facility[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const validate = async (text: string, kind: 'json' | 'csv') => {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ preview: Facility[] }>('/api/import', {
        method: 'POST',
        body: JSON.stringify({ content: text, format: kind }),
      });
      setPreview(r.preview);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <p>
        Independent research joins the same register and ranking as automated discovery. Every
        imported claim starts as a suggestion; existing CRM and account decisions are preserved.
      </p>
      <div className="tabs">
        <button
          className={tab === 'file' ? 'active' : ''}
          onClick={() => {
            setTab('file');
            setPreview([]);
          }}
        >
          JSON / CSV
        </button>
        <button
          className={tab === 'form' ? 'active' : ''}
          onClick={() => {
            setTab('form');
            setPreview([]);
          }}
        >
          Single lead form
        </button>
      </div>
      {tab === 'file' ? (
        <>
          <div className="import-templates">
            <a href="/api/template">JSON example ↗</a>
            <a href="/api/template?format=csv">CSV template ↗</a>
          </div>
          <label className="dropzone">
            <span>↓</span>
            <strong>Choose a research file</strong>
            <small>JSON or CSV · maximum 1 MB · public research only</small>
            <input
              aria-label="Research file"
              type="file"
              accept=".json,.csv"
              onChange={async (e) => {
                setPreview([]);
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 1_000_000) {
                  setError('Import files must be under 1 MB.');
                  return;
                }
                const kind = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
                setFormat(kind);
                setContent(await file.text());
              }}
            />
          </label>
          <Field label="Or paste structured research">
            <textarea
              className="code-input"
              rows={8}
              placeholder='{"version": 1, "facilities": […]}'
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setPreview([]);
              }}
            />
          </Field>
          <div className="inline">
            <Field label="Format">
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as 'json' | 'csv');
                  setPreview([]);
                }}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </Field>
            <button
              className="primary"
              disabled={!content || busy}
              onClick={() => validate(content, format)}
            >
              {busy ? 'Validating…' : 'Validate & preview →'}
            </button>
          </div>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const value = (key: string) => String(form.get(key) ?? '');
            const f = blankFacility(
              value('name'),
              value('address'),
              value('city'),
              value('state').toUpperCase(),
              value('postal'),
            );
            if (value('listing_url')) {
              const parsed = acquisitionSchema.safeParse({
                source_id: value('listing_id') || value('listing_url'),
                listing_url: value('listing_url'),
                asking_price_usd: value('asking_price_usd')
                  ? Number(value('asking_price_usd'))
                  : null,
                price_status: 'unverified',
                building_sqft: value('building_sqft') ? Number(value('building_sqft')) : null,
                area_status: 'reported',
                property_type: 'Industrial',
                occupancy: value('occupancy') || 'unknown',
                availability: 'unverified',
                checked_at: null,
                verification_notes:
                  'Manual acquisition entry; review the cited listing and current price/availability.',
              });
              if (!parsed.success) {
                setError(parsed.error.issues[0].message);
                return;
              }
              f.acquisition = parsed.data;
            }
            f.why = value('why');
            f.missing = value('missing');
            f.next_action = value('next');
            f.evidence = [
              {
                id: crypto.randomUUID(),
                fact: value('fact'),
                value: value('value'),
                unit: null,
                status: 'suggested',
                source_title: value('title'),
                source_url: value('url'),
                document_date: value('date') || null,
                captured_at: new Date().toISOString(),
                page_or_excerpt: value('excerpt'),
                reviewed_by: null,
                reviewed_at: null,
                method: 'independent-research',
                confidence: 'medium',
                author: value('author'),
                conflict: false,
                category: 'other',
              },
            ];
            const text = JSON.stringify({ version: 1, facilities: [f] });
            setContent(text);
            setFormat('json');
            await validate(text, 'json');
          }}
        >
          <div className="form-grid">
            <Field label="Facility name">
              <input name="name" required maxLength={250} />
            </Field>
            <Field label="Street / unit / campus">
              <input name="address" required maxLength={300} />
            </Field>
            <Field label="City">
              <input name="city" required />
            </Field>
            <Field label="State">
              <input name="state" required pattern="[A-Za-z]{2}" maxLength={2} />
            </Field>
            <Field label="Postal code">
              <input name="postal" />
            </Field>
            <Field label="Researcher / author">
              <input name="author" required />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Fact">
              <input name="fact" placeholder="Generator inventory" required />
            </Field>
            <Field label="Value">
              <input name="value" placeholder="Two 1,500 kW emergency diesels" required />
            </Field>
            <Field label="Source title">
              <input name="title" required />
            </Field>
            <Field label="Source URL · public HTTPS">
              <input name="url" type="url" required />
            </Field>
            <Field label="Publication / as-of date">
              <input name="date" type="date" />
            </Field>
          </div>
          <Field label="Supporting excerpt or page">
            <textarea name="excerpt" rows={2} required />
          </Field>
          <Field label="Why this facility?">
            <input name="why" required />
          </Field>
          <Field label="Single biggest missing fact">
            <input name="missing" required />
          </Field>
          <Field label="Next action">
            <input name="next" required />
          </Field>
          <details className="disclosure">
            <summary>Optional acquisition / property listing</summary>
            <div className="form-grid">
              <Field label="Original listing URL">
                <input name="listing_url" type="url" />
              </Field>
              <Field label="Listing source ID">
                <input name="listing_id" placeholder="crexi:123456" />
              </Field>
              <Field label="Reported asking price USD">
                <input name="asking_price_usd" type="number" min="0" />
              </Field>
              <Field label="Building square feet">
                <input name="building_sqft" type="number" min="1" />
              </Field>
              <Field label="Occupancy">
                <select name="occupancy">
                  <option value="unknown">Unknown</option>
                  <option value="occupied">Occupied</option>
                  <option value="vacant">Vacant</option>
                  <option value="former-use">Former use</option>
                </select>
              </Field>
            </div>
          </details>
          <button className="primary" disabled={busy}>
            {busy ? 'Validating…' : 'Validate & preview →'}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {preview.length > 0 && (
        <div className="import-preview">
          <div className="section-label">
            <h3>
              {preview.length} lead{preview.length === 1 ? '' : 's'} validated
            </h3>
            <Badge tone="amber">Not yet saved</Badge>
          </div>
          {preview.map((f, i) => (
            <div className="preview-row" key={i}>
              <strong>{f.name}</strong>
              <span>
                {f.address}, {f.city}, {f.state}
              </span>
              <small>
                {f.evidence.length} cited suggestion(s) · DR unknown · Qualified MW unknown
              </small>
            </div>
          ))}
          {readOnly ? (
            <div className="mode-note">
              Preview successful. Connect Supabase to persist this import; nothing has been saved.
            </div>
          ) : (
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api('/api/import', {
                    method: 'POST',
                    body: JSON.stringify({ content, format, commit: true }),
                  });
                  await done();
                } catch (e) {
                  setError(errorText(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Import into register →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
