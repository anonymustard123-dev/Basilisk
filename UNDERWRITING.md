# Shortlist underwriting

Current shortlist: 1893 East 55th Street, 320 Phillips Avenue, 108 MacDade Boulevard and 4307 US Route 40 East. Wooster and Porter have been replaced. Park Avenue was excluded after the direct Crexi page showed Off-Market / Historical Flyer despite older search results advertising a sale. Legacy seed records and the historical SQL migration remain preserved; Supabase is deferred and the current UI uses the new shortlist.

Every property now displays an indicative offer and editable, property-specific defaults. All figures are assumption-based. There are no evidence checkboxes or blocking introductory notices. A short label stays beside each figure and detailed provenance is collapsed under Basis & calculation.

| Property  | Property value proxy | Repairs/upgrades | Holding reserve | Reduction / account cap |        Rate | Annual DR costs |
| --------- | -------------------: | ---------------: | --------------: | ----------------------: | ----------: | --------------: |
| East 55th |           $1,079,100 |         $100,000 |         $60,000 |          0.15 / 0.30 MW | $100/MW-day |          $3,000 |
| Phillips  |             $900,000 |          $75,000 |         $50,000 |          0.50 / 1.00 MW | $200/MW-day |         $12,000 |
| MacDade   |             $697,500 |          $75,000 |         $40,000 |         0.075 / 0.15 MW | $100/MW-day |          $2,500 |
| Lewisburg |           $2,910,150 |         $200,000 |        $150,000 |          1.00 / 1.50 MW | $200/MW-day |         $25,000 |

Property value is 90% of the advertised asking price as a negotiation proxy, not market-value evidence or an appraisal. Repairs and reserves are screening budgets, not quotes. MW/account caps are hypothetical operating scenarios, not inferred verified capacity from floor area. East 55th is reported vacant and the first three cases fall below the call's stated 1 MW minimum, so their offers exclude DR value. Lewisburg models a post-diligence eligible operating case; its rate assumes Tier 2 diesel suitability and income rights, neither confirmed.

Common defaults: 3% purchase costs, 80% retained income share, 80% receipt realization, 10 income years, first annual payment in year 3 and 15% unlevered discount. $100 refrigeration rate is an analyst sensitivity with no quote. $200 Tier 2 diesel rate and 10-year customer term originate in the supplied undated call, not a signed offer. No referral/event-energy income or terminal DR value is added. Call timing conflicts between 2028 and 2029; actual eligibility, payment date, rights, equipment and permits require confirmation. Default assumptions do not change qualification/evidence fields.

Annual net = min(reduction, account cap) × rate × 365 × share × receipt realization − annual costs. Discount annual payments at first-payment year through the contract term. Offer = (property value + included DR PV − repairs − reserve) / (1 + purchase cost percentage), floored at zero. Display rounds down to $5,000. No DR premium for vacant or sub-minimum cases; negative included DR PV is not discarded. Before tax/debt. Do not count DR in standalone property value as well as incremental PV.

Inputs are temporary, retained across Research/Underwriting tabs while a property panel remains open. Close/reopen resets defaults. No Supabase required. Vercel can deploy GitHub main. For actual bids: broker-confirmed sale/price, independent valuation, leases/consent, utility interval data/tags/history, equipment/permit review, written partner pricing/eligibility and cost quotes. Database onboarding remains deferred; see docs/DATA_ONBOARDING.md.

Sources checked October 18, 2026:

- https://crescorealestate.com/properties/1893-e-55th-street/
- https://www.crexi.com/properties/1890268/ohio-1893-e-55th-street
- https://rimarketplace.com/listing/71192/industrial/lewisburg/oh
- Excluded: https://www.crexi.com/properties/2366284/ohio-6000-park-ave-cleveland-oh-44105
