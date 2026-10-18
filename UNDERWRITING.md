# Focused shortlist and underwriting

The homepage now shows only the four acquisition candidates. Supabase, source jobs and the broader origination dashboard are deferred; existing backend code remains available for later work. The shortlist is served from `lib/featured-acquisitions.ts` regardless of database configuration. Worksheet changes are temporary and disappear when the panel is closed or the page reloads.

## Commercial basis

The undated supplied call quotes approximately $200/MW-day customer receipts specifically for Tier 2 diesel and $10/MW-day referral income against actual annual cleared load. At 365 paid days those are $73,000 and $3,650 per MW-year respectively. Neither quote establishes a contracted rate for these properties. No ordinary load-drop rate was supplied. Customer and referral receipts are separate; owning a building does not establish ownership of tenant receipts.

The call describes a 10-year customer term, but does not establish a 10-year referral term. It mentions April 2028 readiness and June 2028 commencement, then says 2029 elsewhere. Written partner confirmation must resolve dates, minimum size, eligibility and prior participation rules. Promised future emissions upgrades, event energy income and paused-program re-entry are excluded from valuation. Public context: https://www.pjm.com/markets-and-operations/demand-response.aspx and https://www.pjm.com/markets-and-operations/etools/dr-hub.aspx . These sources do not substantiate the partner's commercial quotes.

## Model

Eligible MW = lower of entered partner-accepted reduction and account capacity limit. The partner must approve actual nomination; the minimum alone is not proof of eligible MW.
Annual gross = MW × rate × 365.
Our annual net = gross × retained share × receipt realization − full annual incremental costs.
DR present value discounts each annual net payment at its entered payment year, with no terminal DR value.
Purchase ceiling = (independent standalone property value + incremental DR PV − upfront repairs/upgrades − contingency/holding reserve) / (1 + purchase closing cost percentage).

Standalone value must come from independent comps, appraisal or normalized property NOI; asking prices are not valuations. Avoid counting DR twice in standalone NOI and incremental PV. Model is unlevered/pre-tax; buyer-specific financing/tax analysis is subsequent work. Annual costs need fuel, testing, maintenance, telemetry, insurance, administration and interruption/spoilage allowances. Inputs defaulting to zero are missing estimates, not evidence of free operation. Defaults of 3% purchase costs, 15% discount and first payment in year 3 are analyst assumptions. Sensitivities are receipt multipliers, not probabilities.

No property has a supported DR premium today. A DR-inclusive ceiling is only exposed after explicit user confirmations and positive valuation/MW/share/term inputs, and remains a conditional scenario rather than a verified recommendation. Reported-vacant Porter remains blocked. All evidence needs independent review before a binding bid.

## Immediate next steps

1. Confirm each property's availability and written asking price; resolve Wooster's area/premises and MacDade's price conflict. Porter is off-market.
2. Obtain leases/rent roll, operating expenses, condition/environmental diligence and independent standalone value.
3. Obtain tenant/account-holder consent, recent utility bills, interval load, capacity/transmission tags and account-specific DR enrollment history.
4. Phillips: generator nameplate, fuel/tier, test/maintenance records, permits and controls. Cold-storage sites: active refrigeration, safe curtailment study, equipment condition and insurer approval. Wooster: tenant production curtailment consent.
5. Get partner written eligible MW, rate, delivery year/payment schedule, term, income rights, performance/termination terms and all operating/upfront cost quotes. Populate the worksheet and review downside before an LOI.
6. Vercel can deploy the GitHub main branch as a Next.js project without Supabase for this shortlist. Later, create a separate Basilisk schema/tenant in the approved Gridswitch Supabase setup, apply the documented migrations, configure auth/RLS and environment variables, and restore persistent workflow features deliberately. See docs/DATA_ONBOARDING.md for the deferred database setup.
