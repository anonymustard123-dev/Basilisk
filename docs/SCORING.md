# Prospect priority: four vectors only

All point rules live in `lib/scoring.ts`. Weights: PJM 15; load 25; flexibility 40; DR history 20. Points rank research/contact effort, never probability of eligibility, available capacity or dollars.

- PJM: verified utility/zone evidence 15; likely geography 5; unknown/no 0. A known non-PJM site is excluded from the register/shortlist and remains stored.
- Load: reviewed site-specific measured grid demand ≥3 MW 25, ≥1 MW 20, smaller 5. Reviewed estimates ≥3 MW lower bound 10, lower bound otherwise 5. Unknown 0. Only category load evidence qualifies; generators, area and emissions do not.
- Flexibility: strongest reviewed non-solar method only. Existing equipment/process 20, approval-only 14, operation unknown 8; documented non-emergency authorization +10; battery/process method +5; documented electrical nameplate ≥1 MW +5, capped at 40. Emergency status contributes physical evidence points only; no legal/eligibility inference. Assets are not summed into demand or qualified MW.
- DR history: verified never-enrolled status with buyer/customer evidence, dated program and account scope 20; otherwise 0. Prior/current participation flags buyer review, not automatic disqualification. Buyer-confirmed incompatibility is flagged for exception review.

Seed ranking is intentionally modest: each account's grid load and enrollment remain unknown. A sourced generator inventory is a reason to investigate, not a qualified transaction. Qualified capacity remains null until separately entered against reviewed category qualification buyer evidence, account/date/buyer and verified PJM account status. CRM stages never advance because of score.

Unknown numeric demand stays null. Conflicts/contradicted evidence withdraw supported decisions. Claims are assigned to identity, PJM, load, DR history, flexibility or qualification so a verified generator source does not inadvertently certify other vectors.
