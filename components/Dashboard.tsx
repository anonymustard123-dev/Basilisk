'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Facility, stages, pjmStates } from '@/lib/model';
import { assetLabel, loadLabel, priority } from '@/lib/scoring';
import { api, Badge, errorText, Field, Modal } from './shared';
import { Detail } from './Detail';
import { ImportLead } from './ImportLead';
import type { Job } from '@/lib/jobs';

type Capabilities = { database: boolean; openai: boolean; dataforseo: boolean };
type Panel = 'import' | 'find' | 'sources' | 'login' | null;
export default function Dashboard({
  seedFacilities,
  readOnly,
}: {
  seedFacilities: Facility[];
  readOnly: boolean;
}) {
  const [facilities, setFacilities] = useState(seedFacilities);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(readOnly);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [dark, setDark] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [caps, setCaps] = useState<Capabilities>({
    database: !readOnly,
    openai: false,
    dataforseo: false,
  });
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [dr, setDr] = useState('');
  const [stage, setStage] = useState('');
  const [flex, setFlex] = useState('');
  const [min, setMin] = useState('');
  const [filters, setFilters] = useState(false);
  const [sort, setSort] = useState('priority');
  const [ascending, setAscending] = useState(false);
  const refresh = useCallback(async () => {
    const session = await api<{ mode: string; user: string | null }>('/api/session');
    setUser(session.user);
    if (!readOnly && !session.user) {
      setLoaded(true);
      return;
    }
    const [data, source] = await Promise.all([
      api<{ facilities: Facility[] }>('/api/facilities'),
      api<{ jobs: Job[]; capabilities: Capabilities }>('/api/jobs'),
    ]);
    setFacilities(data.facilities);
    setJobs(source.jobs);
    setCaps(source.capabilities);
    setLoaded(true);
  }, [readOnly]);
  useEffect(() => {
    refresh().catch((e) => setNotice(errorText(e)));
    const theme = localStorage.getItem('basilisk-theme');
    if (theme) setDark(theme === 'dark');
  }, [refresh]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('basilisk-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const run = async (label: string, work: () => Promise<void>) => {
    setBusy(label);
    setNotice('');
    try {
      await work();
    } catch (e) {
      setNotice(errorText(e));
    } finally {
      setBusy('');
    }
  };
  const top = useMemo(
    () =>
      facilities
        .filter(
          (f) =>
            f.researched &&
            !priority(f).excluded &&
            !['Disqualified', 'Deprioritized'].includes(f.stage),
        )
        .sort((a, b) => priority(b).score - priority(a).score)
        .slice(0, 4),
    [facilities],
  );
  const rows = useMemo(() => {
    const result = facilities.filter(
      (f) =>
        !priority(f).excluded &&
        `${f.name} ${f.address} ${f.city} ${f.operator}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!region || f.state === region || f.pjm.utility === region) &&
        (!dr || f.dr.status === dr) &&
        (!stage || f.stage === stage) &&
        (!flex || f.assets.some((a) => a.type === flex)) &&
        (!min || Number(f.load.verified_mw ?? f.load.estimated_min_mw ?? -1) >= Number(min)),
    );
    return result.sort((a, b) => {
      const value = (f: Facility) =>
        sort === 'priority'
          ? priority(f).score
          : sort === 'load'
            ? (f.load.verified_mw ?? f.load.estimated_min_mw ?? -1)
            : sort === 'pjm'
              ? f.pjm.status
              : sort === 'dr'
                ? f.dr.status
                : sort === 'flex'
                  ? assetLabel(f)
                  : f.name;
      const av = value(a),
        bv = value(b);
      return (
        (typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))) * (ascending ? 1 : -1)
      );
    });
  }, [facilities, query, region, dr, stage, flex, min, sort, ascending]);
  const sortBy = (key: string) => {
    if (sort === key) setAscending(!ascending);
    else {
      setSort(key);
      setAscending(key !== 'priority' && key !== 'load');
    }
  };
  const research = async (ids: string[]) => {
    if (readOnly)
      throw new Error(
        'Connect Supabase and OpenAI to queue research. You can import and preview independent research now.',
      );
    await api('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ kind: 'research', config: { ids } }),
    });
    await refresh();
    setSelected(null);
    setPanel('sources');
    setNotice('Research queued. Run the next batch in Sources; each request handles one facility.');
  };
  const locked = !readOnly && !user;
  return (
    <div className="shell">
      <aside className="rail">
        <Link className="brand-mark" href="/" aria-label="Basilisk home">
          <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
            <path
              d="M3 3h14l8 7-8 7 8 7-8 5H3V3Zm6 6v6h6l4-4-4-2H9Zm0 12v3h7l3-2-3-1H9Z"
              fill="currentColor"
            />
          </svg>
        </Link>
        <button
          className="rail-button active"
          onClick={() => setPanel(null)}
          aria-label="Prospects"
        >
          ▤
        </button>
        <button
          className="rail-button"
          onClick={() => setPanel('sources')}
          aria-label="Sources and jobs"
        >
          ⌁
        </button>
        <div className="rail-bottom">
          <span className="vertical">PJM ORIGINATION</span>
          <button
            className="rail-button"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? '☼' : '☾'}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link href="/" className="wordmark">
            BASILISK<span> / </span>
            <small>ORIGINATION</small>
          </Link>
          <div className="topbar-right">
            <span className={`status-dot ${readOnly ? 'amber' : 'green'}`} />
            <span>
              {readOnly
                ? 'PUBLIC SEEDS · READ ONLY'
                : user
                  ? 'PRIVATE WORKSPACE'
                  : 'PRIVATE · SIGN IN'}
            </span>
            {!readOnly &&
              (user ? (
                <button
                  className="text-button"
                  onClick={() =>
                    run('Signing out', async () => {
                      await api('/api/session', { method: 'DELETE' });
                      setUser(null);
                      setFacilities([]);
                      setJobs([]);
                    })
                  }
                >
                  Sign out
                </button>
              ) : (
                <button className="text-button" onClick={() => setPanel('login')}>
                  Sign in ↗
                </button>
              ))}
          </div>
        </header>
        <main>
          <div className="page-title">
            <div>
              <div className="eyebrow">BEHIND-THE-METER / PJM</div>
              <h1>
                Prospects<span className="title-dot">.</span>
              </h1>
              <p>Real facilities. Sourced evidence. A clear next move.</p>
            </div>
            <button className="subtle source-button" onClick={() => setPanel('sources')}>
              Sources & jobs <span>↗</span>
            </button>
          </div>
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
          {readOnly && (
            <div className="mode-note">
              <span className="status-dot amber" />
              <span>
                Four sourced research candidates. Connect Supabase to save imports, review evidence
                and track outreach.
              </span>
              <span className="mode-tag">NO LIVE FEEDS RUNNING</span>
            </div>
          )}
          {locked ? (
            <div className="empty auth-empty">
              <h2>Your origination workspace</h2>
              <p>Sign in to access prospects, research and confidential documents.</p>
              <button className="primary" onClick={() => setPanel('login')}>
                Sign in to Basilisk ↗
              </button>
            </div>
          ) : (
            <>
              <div className="section-label">
                <h2>Top 4 prospects</h2>
                <span>RESEARCH PRIORITY · BUYER CONFIRMATION REQUIRED</span>
              </div>
              <section className="top-grid" aria-label="Top researched prospects">
                {top.map((f, i) => (
                  <button className="prospect-card" key={f.id} onClick={() => setSelected(f)}>
                    <div className="card-top">
                      <span className="card-index">0{i + 1}</span>
                      <Badge tone="amber">{f.stage}</Badge>
                      <span className="card-arrow">↗</span>
                    </div>
                    <div className="card-name">{f.name}</div>
                    <div className="card-location">
                      {f.city}, {f.state}
                    </div>
                    <p>{f.why}</p>
                    <div className="card-bottom">
                      <span className="asset-indicator" />{' '}
                      <span>
                        {f.assets[0]?.electrical_kw !== null &&
                        f.assets[0]?.electrical_kw !== undefined
                          ? `${f.assets[0].electrical_kw / 1000} MW documented nameplate`
                          : 'Electrical MW unknown'}
                      </span>
                      <strong>
                        {priority(f).score}
                        <small> / 100</small>
                      </strong>
                    </div>
                  </button>
                ))}
              </section>
              {!top.length && (
                <div className="empty">
                  {loaded
                    ? 'No researched leads yet. Run the seed command or import researched leads.'
                    : 'Loading workspace…'}
                </div>
              )}
              <section className="table-section">
                <div className="table-toolbar">
                  <div>
                    <h2>
                      Prospect register <span>{rows.length}</span>
                    </h2>
                    <p>Four decision vectors. Every unknown stays visible.</p>
                  </div>
                  <div className="actions">
                    <button className="subtle" onClick={() => setPanel('find')}>
                      ＋ Find prospects
                    </button>
                    <button className="primary" onClick={() => setPanel('import')}>
                      ↓ Import researched lead
                    </button>
                    <button
                      className="subtle"
                      disabled={!!busy || !top.length}
                      onClick={() => run('Queueing research', () => research(top.map((f) => f.id)))}
                    >
                      ✧ Research
                    </button>
                    <a className="button subtle" href="/api/export">
                      Export short list ↗
                    </a>
                  </div>
                </div>
                <div className="search-row">
                  <label className="search">
                    <span>⌕</span>
                    <input
                      aria-label="Search prospects"
                      placeholder="Search facilities, operators or locations…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <button
                    className={`subtle ${filters ? 'selected' : ''}`}
                    onClick={() => setFilters(!filters)}
                  >
                    ☷ Filters
                    {[region, dr, stage, flex, min].filter(Boolean).length
                      ? ` · ${[region, dr, stage, flex, min].filter(Boolean).length}`
                      : ''}
                  </button>
                  <span className="table-caption">
                    Sorted by {sort}
                    {ascending ? ' ↑' : ' ↓'}
                  </span>
                </div>
                {filters && (
                  <div className="filters">
                    <Field label="Region / utility">
                      <select value={region} onChange={(e) => setRegion(e.target.value)}>
                        <option value="">All regions</option>
                        {[
                          ...new Set([
                            ...facilities.map((f) => f.state),
                            ...facilities.flatMap((f) => (f.pjm.utility ? [f.pjm.utility] : [])),
                          ]),
                        ]
                          .sort()
                          .map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Minimum load MW">
                      <input
                        type="number"
                        min="0"
                        placeholder="Include unknown"
                        value={min}
                        onChange={(e) => setMin(e.target.value)}
                      />
                    </Field>
                    <Field label="Flexibility">
                      <select value={flex} onChange={(e) => setFlex(e.target.value)}>
                        <option value="">Any method</option>
                        <option value="generator">Generator</option>
                        <option value="battery">Battery</option>
                        <option value="load-drop">Load drop</option>
                      </select>
                    </Field>
                    <Field label="DR history">
                      <select value={dr} onChange={(e) => setDr(e.target.value)}>
                        <option value="">Any history</option>
                        {[
                          'unknown',
                          'never enrolled',
                          'prior participation',
                          'currently enrolled',
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Stage">
                      <select value={stage} onChange={(e) => setStage(e.target.value)}>
                        <option value="">Any stage</option>
                        {stages.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <button
                      className="text-button"
                      onClick={() => {
                        setRegion('');
                        setMin('');
                        setFlex('');
                        setDr('');
                        setStage('');
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {[
                          ['name', 'Facility & location'],
                          ['pjm', 'PJM?'],
                          ['load', 'Load MW'],
                          ['flex', 'Flexibility / generator evidence'],
                          ['dr', 'DR history'],
                          ['priority', 'Priority / next step'],
                        ].map(([key, label]) => (
                          <th key={key}>
                            <button onClick={() => sortBy(key)}>
                              {label}
                              <span>{sort === key ? (ascending ? '↑' : '↓') : '↕'}</span>
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <button className="facility-link" onClick={() => setSelected(f)}>
                              {f.name} <span>↗</span>
                            </button>
                            <div className="secondary">
                              {f.city}, {f.state} · {f.postal_code}
                            </div>
                            <span className="origin-label">{f.origin}</span>
                          </td>
                          <td>
                            <Badge
                              tone={
                                f.pjm.status === 'verified'
                                  ? 'green'
                                  : f.pjm.status === 'likely'
                                    ? 'amber'
                                    : 'muted'
                              }
                            >
                              {f.pjm.status === 'likely'
                                ? 'Likely'
                                : f.pjm.status === 'verified'
                                  ? 'Verified'
                                  : 'Unknown'}
                            </Badge>
                            <div className="secondary">{f.pjm.zone ?? 'Account unconfirmed'}</div>
                          </td>
                          <td>
                            <span className="load-value">{loadLabel(f)}</span>
                            <div className="secondary">
                              {f.load.verified_mw === null
                                ? 'Utility bill / PLC needed'
                                : 'Grid demand only'}
                            </div>
                          </td>
                          <td className="flex-cell">
                            <span>{assetLabel(f)}</span>
                            <div className="secondary">
                              {f.assets.some((a) => a.permit === 'emergency-only')
                                ? 'Non-emergency rights unresolved'
                                : f.assets.length
                                  ? 'Current operation needs confirmation'
                                  : 'No equipment inferred'}
                            </div>
                          </td>
                          <td>
                            <Badge>{f.dr.status === 'unknown' ? 'Unknown' : f.dr.status}</Badge>
                            <div className="secondary">
                              {f.dr.status === 'unknown'
                                ? 'Buyer / customer check'
                                : (f.dr.program ?? 'Review program scope')}
                            </div>
                          </td>
                          <td className="next-cell">
                            <div className="priority">
                              <strong>{priority(f).score}</strong>
                              <span>/ 100</span>
                              {priority(f).review && <Badge tone="amber">Buyer review</Badge>}
                            </div>
                            <button className="next-link" onClick={() => setSelected(f)}>
                              {f.missing}
                              <span>→</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length === 0 && (
                  <div className="empty">
                    {loaded
                      ? 'No matching facilities. Clear filters or import a researched lead.'
                      : 'Loading prospects…'}
                  </div>
                )}
                <div className="table-foot">
                  <span>
                    <span className="status-dot amber" /> Priority guides research and contact. It
                    does not establish DR eligibility.
                  </span>
                  <span>
                    {facilities.filter((f) => priority(f).excluded).length} outside PJM excluded
                  </span>
                </div>
              </section>
            </>
          )}
          <footer>
            <span>
              BASILISK <i>/</i> INTERNAL ORIGINATION TERMINAL
            </span>
            <span>Evidence before assumptions.</span>
            <a href="/api/export?format=md">Research handoff ↗</a>
          </footer>
        </main>
      </div>
      {busy && (
        <div className="busy" role="status">
          <span className="spinner" />
          {busy}…
        </div>
      )}
      {selected && (
        <Detail
          initial={selected}
          readOnly={readOnly}
          close={() => setSelected(null)}
          changed={async () => {
            await refresh();
          }}
          research={() => run('Queueing research', () => research([selected.id]))}
        />
      )}
      {panel === 'import' && (
        <Modal title="Import researched lead" close={() => setPanel(null)} wide>
          <ImportLead
            readOnly={readOnly}
            done={async () => {
              await refresh();
              setPanel(null);
              setNotice(
                'Research imported. Review suggested evidence before confirming any decision vector.',
              );
            }}
          />
        </Modal>
      )}
      {panel === 'find' && (
        <Modal title="Find prospects" close={() => setPanel(null)}>
          <FindProspects
            readOnly={readOnly}
            caps={caps}
            done={async () => {
              await refresh();
              setPanel('sources');
            }}
          />
        </Modal>
      )}
      {panel === 'sources' && (
        <Modal title="Sources & batch jobs" close={() => setPanel(null)} wide>
          <div className="source-grid">
            <div>
              <Badge tone={caps.database ? 'green' : 'amber'}>
                {caps.database ? 'Configured' : 'Not connected'}
              </Badge>
              <h3>Supabase</h3>
              <p>
                {readOnly
                  ? 'Seed / read-only mode. No changes are stored.'
                  : 'Authenticated, tenant-separated storage. No GridSwitch tables are used.'}
              </p>
            </div>
            <div>
              <Badge>Public · no key</Badge>
              <h3>EPA TRI / GHGRP / FRS</h3>
              <p>
                Live facility identity discovery. Each job reports retrieval failures. Registry data
                does not prove demand.
              </p>
            </div>
            <div>
              <Badge tone={caps.openai ? 'green' : 'muted'}>
                {caps.openai ? 'Key configured' : 'Key required'}
              </Badge>
              <h3>Cited AI research</h3>
              <p>One facility per batch; seven-day cache. At most 5 jobs × 4 facilities per day.</p>
            </div>
            <div>
              <Badge tone={caps.dataforseo ? 'green' : 'muted'}>
                {caps.dataforseo ? 'Keys configured' : 'Keys required'}
              </Badge>
              <h3>DataForSEO</h3>
              <p>Optional business discovery. No directory-based load estimates.</p>
            </div>
          </div>
          <div className="section-label">
            <h3>Recent jobs</h3>
            <button className="text-button" onClick={() => run('Refreshing', refresh)}>
              Refresh ↻
            </button>
          </div>
          {jobs.length === 0 ? (
            <div className="empty">
              No live jobs have run. The four seed records were independently sourced.
            </div>
          ) : (
            jobs.map((job) => (
              <div className="job" key={job.id}>
                <div>
                  <strong>
                    {job.kind === 'research'
                      ? 'Facility research'
                      : String(job.config.provider)}{' '}
                  </strong>
                  <Badge
                    tone={
                      job.status === 'failed'
                        ? 'red'
                        : job.status === 'complete'
                          ? 'green'
                          : 'amber'
                    }
                  >
                    {job.status}
                  </Badge>
                  <p>{job.diagnostics || 'Queued; ready for its first bounded batch.'}</p>
                  <small>
                    Checkpoint {job.checkpoint} · {job.imported} records processed ·{' '}
                    {new Date(job.updated_at).toLocaleString()}
                  </small>
                </div>
                {['queued', 'running'].includes(job.status) && (
                  <button
                    className="subtle"
                    disabled={!!busy}
                    onClick={() =>
                      run('Running one batch', async () => {
                        await api(`/api/jobs/${job.id}/run`, { method: 'POST' });
                        await refresh();
                      })
                    }
                  >
                    Run next batch →
                  </button>
                )}
                {job.status === 'failed' && (
                  <span className="secondary">
                    Inspect error; start a new job after resolving it.
                  </span>
                )}
              </div>
            ))
          )}
          <p className="fineprint">
            Jobs persist their checkpoint and retry up to three batches. Closing this page pauses
            manual processing; an optional authenticated cron runner can continue one batch per
            invocation.
          </p>
        </Modal>
      )}
      {panel === 'login' && (
        <Modal title="Sign in to Basilisk" close={() => setPanel(null)}>
          <Login
            done={async () => {
              await refresh();
              setPanel(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
function Login({ done }: { done: () => Promise<void> }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await api('/api/session', {
            method: 'POST',
            body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
          });
          await done();
        } catch (e) {
          setError(errorText(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        Use the internal user provisioned in Supabase Auth. Sessions expire after approximately one
        hour.
      </p>
      <Field label="Email">
        <input type="email" name="email" autoComplete="username" required />
      </Field>
      <Field label="Password">
        <input type="password" name="password" autoComplete="current-password" required />
      </Field>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in →'}
      </button>
    </form>
  );
}
function FindProspects({
  readOnly,
  caps,
  done,
}: {
  readOnly: boolean;
  caps: Capabilities;
  done: () => Promise<void>;
}) {
  const [provider, setProvider] = useState('epa-tri');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        const f = new FormData(e.currentTarget);
        try {
          await api('/api/jobs', {
            method: 'POST',
            body: JSON.stringify({
              kind: 'discovery',
              config: {
                provider,
                state: f.get('state'),
                pages: Number(f.get('pages')),
                ...(provider === 'dataforseo'
                  ? {
                      latitude: Number(f.get('latitude')),
                      longitude: Number(f.get('longitude')),
                      radius: 25,
                    }
                  : {}),
              },
            }),
          });
          await done();
        } catch (e) {
          setError(errorText(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        Import named facilities, then research their demand and flexibility. State selection scopes
        discovery; it does not verify PJM service.
      </p>
      {readOnly && (
        <div className="mode-note">
          Supabase is required to save live discovery and job checkpoints.
        </div>
      )}
      <Field label="Source">
        <select value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="epa-tri">EPA TRI · public</option>
          <option value="epa-ghgrp">EPA GHGRP · public</option>
          <option value="epa-frs">EPA FRS · public</option>
          <option value="dataforseo" disabled={!caps.dataforseo}>
            DataForSEO · {caps.dataforseo ? 'configured' : 'keys needed'}
          </option>
        </select>
      </Field>
      <div className="form-grid">
        <Field label="State (partial PJM coverage)">
          <select name="state">
            {pjmStates.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Pages · up to 20 rows each">
          <input name="pages" type="number" min="1" max="10" defaultValue="1" required />
        </Field>
      </div>
      {provider === 'dataforseo' && (
        <div className="form-grid">
          <Field label="Latitude">
            <input name="latitude" type="number" min="-90" max="90" step="any" required />
          </Field>
          <Field label="Longitude">
            <input name="longitude" type="number" min="-180" max="180" step="any" required />
          </Field>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="primary" disabled={readOnly || busy}>
        {busy ? 'Queueing…' : 'Queue discovery →'}
      </button>
    </form>
  );
}
