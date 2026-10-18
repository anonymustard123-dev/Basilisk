# BASILISK

The current homepage is a focused four-property acquisition shortlist with research dossiers and a prefilled underwriting worksheet with indicative offers, demand-response earnings and DR Yield comparisons. Supabase and the broader origination dashboard are deferred. Original research leads and backend workflow code remain available for later work. See [underwriting and immediate next steps](UNDERWRITING.md).

## Run

Node 22.18+ (Node 24 recommended).

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The homepage uses four MW-first acquisition records and needs no Supabase credentials. Worksheet inputs are temporary; they are not saved. Backend import, jobs, confidential uploads and the wider dashboard are outside the current UI. See [data onboarding](docs/DATA_ONBOARDING.md) for the deferred persistent workflow.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Connect GridSwitch Supabase

1. Run `supabase/migrations/202610180001_basilisk.sql` once in the existing project's SQL editor, then `supabase/migrations/202610180002_featured_acquisitions.sql`. The second migration backfills four acquisition records for existing workspaces, preserves original records/diligence, and adds a tenant/source uniqueness index. It is repeatable. Do not rerun the first migration if already applied. These migrations do not alter GridSwitch's tables.
2. Create an internal user through Supabase Auth (email/password). No public registration is exposed. Provision a workspace and membership in SQL, substituting the actual existing Auth user UUID:

```sql
insert into public.basilisk_tenants(name) values ('Basilisk') returning id;
-- Use the returned workspace UUID below:
insert into public.basilisk_memberships(tenant_id,user_id)
values ('WORKSPACE_UUID','AUTH_USER_UUID');
```

3. Copy `.env.example` to `.env.local`. Set `SUPABASE_URL` to the project root (without `/rest/v1`), `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `BASILISK_ALLOWED_EMAILS`, and `BASILISK_TENANT_ID`. These values are server-only; none use `NEXT_PUBLIC_`. A user must be allowlisted and belong to exactly one workspace. Only the server uses the secret key for login, seeding and the authenticated cron runner; normal database operations carry the user's token and enforce RLS.
4. Run `npm run seed`. This ensures the four acquisition pins and four original leads for new workspaces, preserves analyst edits, and never resets CRM/qualification fields. Restart the app and sign in. The one-hour session is an HttpOnly, SameSite cookie; production requires HTTPS. There is no public fallback to live data when sign-in expires.

Each facility has one explicitly scoped DR account record in this MVP. Multiple meters can be noted in evidence/assets; never propagate enrollment or qualification to another account. Add separate account records before modeling multi-account portfolios.

## Deploy a new Vercel project

Import `anonymustard123-dev/Basilisk` as a **new** Vercel project. Use the detected Next.js preset, `npm ci`, `npm run build` and repository root. Pin Node 24 in project settings. No extra infrastructure is needed. Set environment variables separately for Production and Preview; keep preview workspaces isolated if testing private records. The app can deploy in public-seed mode before credentials arrive.

After adding Supabase variables, run the migration and seed locally, redeploy, and validate sign-in, one import, evidence review and a private upload/download before using customer data. `.env.local` and Vercel secrets must never be committed. A failed/missing database connection does not silently downgrade a configured workspace to public seeds.

The jobs runner handles **one page or one facility per request**, with 60-second route budgets, two-minute atomic leases and persisted checkpoints. Use **Sources & batch jobs → Run next batch** to continue. A provider failure is retried across at most three batch attempts, then retained as failed. Imports are idempotent and recoverable; a multi-row import may partially succeed before an error, so reimport the same file after fixing it.

Optionally configure a Vercel Cron invoking `/api/cron` with `CRON_SECRET`. Each invocation runs one pending batch; choose a schedule supported by your Vercel plan. No cron is enabled by default, avoiding unintended API spend. A browser tab is not required for cron processing.

## Sources & actual integration boundaries

- **Seed citations:** PA Bulletin / PA DEP permits, Lineage operating directory and Power Construction site description. These are researched candidates, not customers. Read `docs/SEED_RESEARCH.md` for exact unknowns.
- **Featured acquisitions:** Wooster / Phillips / MacDade / Porter, in that fixed order, stored in facility payloads with price/area/availability provenance. Porter is off-market, Wooster availability is unverified, and MacDade has a price conflict. Original listing links are retained. See `docs/ACQUISITION_RESEARCH.md`. Real-estate listings enter through manual research or licensed CSV/JSON; EPA/DataForSEO are not live for-sale inventory feeds.
- **EPA TRI:** updated DMAP HTTP facility adapter, state filter, pages of 20; no key. GHGRP and FRS adapters retain legacy Envirofacts endpoints. Endpoint downtime, response changes and zero usable rows are surfaced per job. Run `node --use-system-ca scripts/check-sources.mjs` for a bounded live connectivity check; see `docs/VALIDATION.md` for observed results.
- **DataForSEO:** optional Business Listings discovery requires login/password, explicit center coordinates and provider credit. Directory presence never verifies load or flexibility. Live vendor access is untested without credentials.
- **OpenAI:** optional Responses API with web search and schema-validated cited suggestions. Configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` (defaults to GridSwitch's `gpt-5.4-mini`). Provider/model access must be verified with your account. Seven-day tenant/facility cache, at most five research jobs × four facilities per 24 hours, three search tool calls per facility. Cached summaries and next actions remain suggestions in `basilisk_research`; factual claims appear in the evidence panel. Private documents, account references and notes are excluded from AI requests.
- **FRS / state permits:** FRS facility discovery is implemented; automated exact-site identity reconciliation and permit-PDF extraction are deferred. Import externally checked permit evidence rather than treating registry matches as permits.
- No Regrid, Redis, map, financial projection pipeline, or square-footage-to-load estimates.

## Workflow

Start with the pinned acquisitions → open a property → inspect listing status and cited evidence → confirm the single missing blocker → approach the broker/operator. Pins remain separate from table filters and priority order, including off-market examples. Filters default to a $1.5M price ceiling, exclude known non-PJM sites and explicitly permit unknown load/price during research. Verify utility/account PJM status before qualification. Import independent research using JSON, CSV or the single-lead form, including optional acquisition fields. Acquisition price/area never alter DR scores; economic scenarios require a reviewed and explicitly identified qualifying-MW basis and are unavailable for vacant sites. Existing identity, provenance and CRM are preserved; ambiguous operators sharing an address require manual identity resolution. Suggested claims carry no verified scoring points until reviewed.

Before buyer submission, use the expandable checklist to collect the authorized bill, tags, interval profile, generator details, air permits and scoped DR history. Documents are private (4 MB per upload), with tenant authorization and 60-second signed download links. They are never part of the public seed bundle or AI prompt.

See `docs/RESEARCH_HANDOFF.md`, `docs/SCORING.md`, `docs/SECURITY.md` and `docs/VALIDATION.md`.


