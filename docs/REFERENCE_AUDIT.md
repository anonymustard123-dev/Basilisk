# GridSwitch reference audit

Inspected the authorized local GridSwitch_Dashboard checkout, including public-industrial.ts, dataforseo.ts, openai-research.ts, supabase.ts, migrations, environment template and README. GridSwitch was not modified.

Reused techniques: EPA facility identity normalization, TRI/GHGRP HTTP retrieval, bounded requests, DataForSEO server-side Basic auth, cited Responses API research, and Supabase server persistence. Basilisk adapters are independently adapted to the new typed facility model rather than copied wholesale.

Changed: state-selectable public discovery across PJM states, exact address identity, conservative evidence-based DR scoring, account-scoped review, durable one-page jobs, AI suggestions awaiting explicit review, and private authorized document access.

Excluded: maps, Regrid, building area/NAICS/industrial-intensity energy scores, microgrid economics and automatic eligibility. FRS/DEP are supported as citation/identifier evidence and manual research; automatic FRS match and state air-permit scraping are deferred until reliable site-specific matching is validated. GHGRP legacy endpoint availability is reported honestly, never silently substituted.

Basilisk remote was reachable with authorized Git access and had no refs at implementation start. No credentials were copied from GridSwitch. Supabase and vendor credentials are not yet configured.
