# Validation record

October 18, 2026. Node 24 on Windows.

- Production Next.js build: successful compilation, type validation, page generation and route tracing. Final full checks are recorded in the delivery message.
- Production HTTP smoke test: home page, four seed API records, CSV and Markdown attachments, JSON import preview and read-only commit rejection all passed.
- Automated tests: **42 passing tests** covering the original qualification/provider/API invariants plus acquisition pin order, reported price/area, conservative MW/readiness, import deduplication, budget/PJM/unknown filters, and a PostgreSQL migration test. No tests depend on paid credentials.
- Browser QA: main register and four real cards, UNFI detail with unknown electrical / qualified MW, JSON/CSV import UI (CSV preview succeeds, explicitly not saved), dark/light appearance, 1440 px desktop and 390 px mobile. No page-wide horizontal overflow at the mobile breakpoint; the prospect table has its own horizontal scroll area.
- Fixed an actual browser-discovered import defect: Next's internal request URL used localhost while the browser used 127.0.0.1. The origin guard now compares the browser Origin host to the incoming Host header, preserving cross-origin rejection. Covered by a regression test.
- Live public source probes: EPA TRI / DMAP, EPA GHGRP legacy and EPA FRS legacy each returned two real JSON facility records. Probe URLs and reproducible check are in `scripts/check-sources.mjs`. This verifies retrieval, not Supabase persistence, statewide completeness or regulatory qualification.
- Primary seed citations were opened and checked against the requested sites. GSK/Swarthmore approval status and UNFI engine/electrical distinction are preserved. Clickable links remain in the app and exports.

Not live-tested: Supabase migration/RLS/Auth/private bucket, tenant isolation against a real database, persistent imports/job leases, paid DataForSEO and OpenAI requests, Vercel hosting/cron. Credentials are intentionally deferred by the user. Before using customer data, run the migration, provision one authorized user/workspace, seed, then test an import/review, one discovery job and a confidential upload/download across two test tenants.

Acquisition update: the new migration was executed twice in an in-memory PostgreSQL engine for two tenants. Four pins per tenant remained unique, the original four leads remained stored, and existing notes/stage survived. This tests the actual migration SQL, not live Supabase Auth/RLS. Browser checks verified the four requested cards/order and listing URLs, MacDade's price conflict, no economics without a supported MW assumption, filters reducing the register from 8 → 5 → 0 while preserving four pins, and a 390px mobile detail view with no page overflow. Listing observations and data-loading instructions are in `ACQUISITION_RESEARCH.md` and `DATA_ONBOARDING.md`.

Final acquisition production smoke passed: correct four property pins and eight total records, unknown qualifying MW, off-market Porter status, acquisition-only CSV/Markdown exports, a JSON import preview that cannot self-pin or confirm availability, and explicit read-only commit rejection. Lint, production build and all 42 tests passed on the final source.

Environment notes: npm required Node's system CA support for the machine's certificate chain; TLS verification remained enabled. Windows sandbox prevented Vitest from resolving its own installed modules, so validation was run with normal filesystem/process access. A local PostCSS config prevents accidental discovery of an unrelated parent project's settings. These workarounds do not change Vercel's runtime configuration.
