# Start plugging real data into Basilisk

The screenshot's **PUBLIC SEEDS · READ ONLY** label means Supabase is not connected. Import validation works, but imports, research jobs, reviews and documents cannot be saved yet. The four pinned properties do not constitute a connected listing feed.

## 1. Connect persistence first

Use the existing GridSwitch Supabase project. In its SQL editor run `supabase/migrations/202610180001_basilisk.sql` **only if it has not been applied**, then `202610180002_featured_acquisitions.sql`. The second migration is restartable and adds/backfills the four pins without resetting original leads, CRM or qualification. New workspaces are populated by `npm run seed`.

Create your user in Supabase Auth and a Basilisk tenant/membership using the README SQL. Add these **server environment variables** to the Vercel project's Production environment and local `.env.local`:

| Variable                   | Value                                                |
| -------------------------- | ---------------------------------------------------- |
| `SUPABASE_URL`             | GridSwitch project root URL, without `/rest/v1`      |
| `SUPABASE_PUBLISHABLE_KEY` | Project publishable key                              |
| `SUPABASE_SECRET_KEY`      | Project secret/service-role key; server only         |
| `BASILISK_ALLOWED_EMAILS`  | Your approved Auth-user email(s), comma separated    |
| `BASILISK_TENANT_ID`       | Tenant UUID from SQL; used by the local seed command |

Run `npm run seed` locally once for the workspace, then redeploy Vercel so the new environment variables take effect. Sign in. A configured private workspace no longer shows public seed mode. Verify one import/save, evidence review and private upload/download before using confidential bills. Existing users/workspaces should retain their records after the acquisition migration.

## 2. Start with a single researched property

Use **Import researched lead → Single lead form** and expand **Optional acquisition / property listing**, or download the CSV template / JSON example from the same dialog. Provide:

- Exact physical address, unit/campus, city, state, ZIP and operator if known.
- Stable listing/source identifier and original URL.
- Asking price and building size as property facts, not load estimates.
- Each factual claim's citation, publication/as-of date, excerpt/page and researcher.
- One blocker and one next action. Unknown MW/history remain unknown.

CSV keeps its original required research columns; optional acquisition columns are `listing_id,listing_url,asking_price_usd,building_sqft,property_type,occupancy`. Example identifier: `crexi:2215844`. For a field guide and research prompt, see `docs/RESEARCH_HANDOFF.md`.

Click **Validate & preview**, inspect the result, then **Import into register** when connected. Imported claims start suggested; imported prices/availability are unverified and cannot pin themselves or self-certify qualification. Review citations in the detail view before changing verified decisions. Reimporting a matched address/source enriches the existing record rather than duplicating it; ambiguous site identities require resolution.

## 3. Add discovery and research when useful

| Source                                         | Setup                                       | What it actually supplies                                                              |
| ---------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Broker research / licensed listing CSV or JSON | No paid API key; connected Supabase to save | Properties, prices, area and sale-status claims requiring current verification         |
| EPA TRI / GHGRP / FRS                          | No vendor key; connected Supabase           | Facility identity / regulatory records, not sale listings, measured MW or DR clearance |
| DataForSEO                                     | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`   | Optional business discovery; not a for-sale inventory feed                             |
| Cited AI research                              | `OPENAI_API_KEY`, optionally `OPENAI_MODEL` | Source-backed suggestions, never automatic approval; private bills/notes are excluded  |

For EPA use **Find prospects → source/state → queue → Sources & batch jobs → Run next batch**. Each invocation processes one bounded page. For AI use **Research** or a facility's **Research facility**, then run its queued batch and review findings. A paid key is not needed for manual research/import or public EPA discovery. An always-on licensed commercial-real-estate feed is not yet integrated; bring its permitted CSV/JSON exports first.

## 4. Collect account data that can resolve DR eligibility

After the owner/operator authorizes sharing, collect a recent utility bill, utility/account and meter identity, PLC/capacity tag, interval profile, generator electrical nameplates, operating permits/constraints, and dated account/program DR history. Use the confidential upload workflow for private documents. Buying a building does not automatically transfer a tenant's utility-account rights or permission to curtail.

Before pursuing the four pins: resolve Wooster's current availability and area/site discrepancies; confirm Toledo's current load and generator rating; resolve MacDade's $775k/$800k conflict and active refrigeration; reconfirm whether off-market, reportedly vacant Porter can be acquired and reactivated. Do not assign qualifying MW or calculate an economic scenario until a reviewed explicit basis exists.
