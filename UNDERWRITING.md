# DR Yield and demand earnings

DR Yield = annual net demand-response income / independent purchase-price assumption.
Contract coverage = total undiscounted contract net DR / purchase price.
PV coverage = discounted net DR / purchase price.
Yield on cost = annual net DR / (purchase + closing costs + works + reserve).

All are incremental DR metrics, not property cap rates, equity IRRs, probability estimates, or total property returns. The price denominator is editable and independent of the calculated offer, avoiding circular valuations. Zero purchase price displays no ratio. Negative net earnings remain negative.

The underwriting tab now includes full gross customer capacity revenue, receipts after realization, our income share, annual costs, monthly annual-average net, contract net before setup, contract net after works/reserve, discounted value, annual/cumulative cash flows and 0/50/80/100% receipt sensitivities. Gross referral fee at $10/MW-day is a separate annual alternative, never added to customer receipts or assumed to run ten years. No event-energy revenue or terminal DR value. No property rent, appreciation, financing or taxes included.

| Property  |              Purchase assumption | DR MW / tag assumption | Rate / MW-day |      Works |  Reserve | Annual costs |
| --------- | -------------------------------: | ---------------------: | ------------: | ---------: | -------: | -----------: |
| Ravenna   | $6,000,000 (no asking disclosed) |                  5 / 7 |          $100 |   $500,000 | $300,000 |      $40,000 |
| Butler    |                       $5,525,000 |                2.5 / 4 |          $100 |   $350,000 | $250,000 |      $20,000 |
| Montana   |                       $4,675,000 |              1.5 / 1.8 |          $200 |   $200,000 | $200,000 |      $20,000 |
| Sandstone |                       $9,350,000 | 4 / 8 after activation |          $100 | $2,000,000 | $500,000 |      $30,000 |

Default purchase = 85% of disclosed asking; Ravenna $6M is a working sensitivity, not a quote/comparable. Standalone property value proxy = 90% of disclosed asking or $6.3M for Ravenna. These are negotiation assumptions, not independent appraisals. Common model: 3% purchase costs, 80% retained customer receipts, 80% receipt realization, 10 income years, first annual payment in year 3, 15% unlevered discount. Assumptions are editable and resettable; no Supabase needed.

MW/tag inputs are hypothetical operating-load scenarios below advertised infrastructure, never actual account measurements. $100 load-drop rate is an analyst sensitivity: the undated call supplied no load-drop quote. Montana's $200 rate assumes Tier 2 diesel suitability and valid dispatch rights; equipment tier and permitted use remain unknown. No generator equipment is established at Ravenna/Butler/Sandstone and no diesel price is applied to them. Their curtailment needs active process loads and tenant/operator consent. Costs require quotes, production-interruption/spoilage/insurance budgets and operating plans. Sandstone fitout is a generic $2M screening allowance, not a full specialized manufacturing/data-center development budget. Current vacancy excludes its DR from the offer ceiling, while earnings remain an explicitly labeled after-activation scenario. No operating income is verified at any candidate.

Annual gross = min(reduction MW, account cap MW) × rate × 365.
Receipts = annual gross × receipt realization.
Our annual net = receipts × our share − annual costs.
Contract net = annual net × income years; net after setup subtracts works and reserve once.
Discount each annual payment at first-payment year plus payment index. Annual costs begin with modeled operating payments; pre-operation carrying costs sit in reserve. First payment year/term are scenario assumptions: the call conflicts on 2028/2029 timing, and no written rate/rights/tenor is available.

Offer = (standalone property value + included DR present value − works − reserve) / (1 + purchase costs). Vacancy or sub-1 MW excludes DR premium in the current offer. Offers floor at zero and display rounded down to $5,000; ratios use the independent purchase assumption, not rounded offer. Do not count DR income in property value and incremental DR PV simultaneously.

No fixed asking-price filter remains in the shortlist UI. Default research order considers existing power evidence and operating blockers. Optional sorting compares modeled DR Yield; Ravenna's undisclosed asking and Sandstone's future activation are explicitly labeled so they do not masquerade as realized yields. Next work: written current broker quote and sale status, independent valuation, interval demand/capacity tags, prior DR enrollment, tenant rights/curtailment plan, equipment permits and partner approval. See docs/ACQUISITION_RESEARCH.md for sources and docs/DATA_ONBOARDING.md for deferred persistence.
