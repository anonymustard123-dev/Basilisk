# Independent research → Basilisk

Use **Import researched lead** for JSON, CSV or a single sourced claim form. The app provides downloadable JSON and CSV templates. Both automated and independent leads share the same register, scoring and facility detail.

## Ready-to-copy research prompt

> Research this exact physical facility for PJM behind-the-meter demand-response origination: [NAME, OPERATOR, STREET INCLUDING UNIT/CAMPUS, CITY, STATE, ZIP]. Use primary public sources. Establish site identity first; do not combine nearby facilities, solar plants or utility meters. Investigate (1) actual PJM utility/zone/account evidence, (2) measured grid demand/PLC or a justified demand range, (3) account- and program-specific historical DR participation, and (4) onsite generation/batteries or a specific curtailable process. Keep generator electrical nameplate, engine bhp, grid load and buyer-qualified capacity separate. Do not convert bhp to electric MW. Emergency generators do not establish compensated non-emergency permission. A missing public DR match means Unknown. Do not infer qualified MW, name contacts or invent permit contents. Return 2–5 primary citations, one factual blocker and one next action. For each claim include its exact fact/value/unit, source title/URL, publication/as-of date or null, capture timestamp, supporting excerpt or page, confidence and researcher identity. Download the Basilisk JSON example from /api/template and preserve that shape; replace the facility identity, assets, summaries and evidence only. Set all new evidence status to suggested, reviewed_by/reviewed_at to null, stage to Research lead, load values and qualification MW to null, and DR status to unknown. Use category identity, pjm, load, dr-history, flexibility, qualification or other for each claim. Return one JSON object {"version":1,"facilities":[…]}. Unknown numeric quantities must be null, never zero.

Use public research imports only. Upload customer bills/account documents through the confidential document workflow with authorization; never paste them into an external research prompt.

## JSON contract

Authoritative runtime schema: `lib/model.ts` (`facilitySchema`/`evidenceSchema`/`assetSchema`), and `lib/import.ts` (`importSchema`). Download a complete runnable example from `/api/template`. The full facility includes `id`, `name`, `operator`, `aliases`, `address`, `city`, `state`, `postal_code`, `identifiers`, `origin`, `researched`, `pjm`, `load`, `dr`, `assets`, `evidence`, `qualification`, `stage`, `notes`, `why`, `missing`, `next_action`, `target_role`, `checklist`, `updated_at`.

Evidence example (inside a complete facility):

```json
{
  "id": "research-claim-1",
  "fact": "generator / permit inventory",
  "value": "Two diesel emergency generators; electrical kW unknown",
  "unit": null,
  "status": "suggested",
  "category": "flexibility",
  "source_title": "Actual site-specific permit title",
  "source_url": "https://www.epa.gov/actual-document-path",
  "document_date": null,
  "captured_at": "2026-10-18T16:00:00.000Z",
  "page_or_excerpt": "Actual supporting excerpt or page, not an invented quote",
  "reviewed_by": null,
  "reviewed_at": null,
  "method": "independent-research",
  "confidence": "medium",
  "author": "Researcher name / ChatGPT research",
  "conflict": false
}
```

The illustrative URL above is a schema placeholder; replace it with a real accessible document URL. URLs must be public HTTPS syntax. The app never fetches arbitrary imported URLs; the reviewer opens and checks the source. AI-generated URLs must additionally appear in the research tool's returned sources. Source accessibility/currentness still needs human checking.

Asset `electrical_kw` is **total documented electrical nameplate** for the asset group; `count` is unit count, `bhp_each` is separate. Never multiply an already-total electrical rating by count again. `meter_id` remains null unless evidenced. Keep source claim IDs in `evidence_ids`. Type is generator, battery, load-drop or solar. Operation is existing, approved or unknown; permit status is emergency-only, conversion-planned, non-emergency-approved or unknown.

## CSV template

Download `/api/template?format=csv`. Required header:

```csv
name,address,city,state,postal_code,fact,value,source_title,source_url,document_date,page_or_excerpt,author,why,missing,next_action
```

Each row carries one sourced claim. Repeat identical facility identity to import multiple sources; exact normalized street/unit + city + state + ZIP plus matching names/aliases or regulatory identifiers are required to merge. CSV claims default to category other; use the evidence form / JSON for typed decision evidence. Quoted commas and newlines are supported. A different entity at the same address yields an explicit identity conflict rather than an automatic merge. Do not merge campuses/meters by proximity.

## Review

Validate & preview → commit import in an authenticated workspace → open source → review the factual claim → choose its decision evidence in the expanded decision editor. Imports cannot promote their own stage, set verified load/PJM/history, or assert qualified MW. A conflicting import preserves both claims and removes affected certainty until resolution.

For buyer/customer confirmation, add a typed evidence record in the facility panel, cite the authenticated confidential document URL if appropriate, verify it, then set account, program, date and the relevant decision. A source about generator existence cannot support verified grid load or buyer qualification. Multiple utility accounts require separate scoped diligence; this MVP shows one selected account per site.
