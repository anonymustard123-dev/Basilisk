const sources = {
  'EPA TRI / DMAP':
    'https://data.epa.gov/dmapservice/tri.tri_facility/state_abbr/equals/PA/1:2/json',
  'EPA GHGRP / legacy': 'https://data.epa.gov/efservice/PUB_DIM_FACILITY/STATE/=/PA/ROWS/0:1/JSON',
  'EPA FRS / legacy':
    'https://data.epa.gov/efservice/FRS_FACILITY_SITE/STATE_CODE/PA/ROWS/0:1/JSON',
};
await Promise.all(
  Object.entries(sources).map(async ([name, url]) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = await r.json();
      const rows = Array.isArray(body) ? body : (body.data ?? body.results);
      if (!Array.isArray(rows)) throw new Error('Unsupported response shape');
      console.log(
        JSON.stringify({
          name,
          status: 'reachable',
          rows: rows.length,
          firstKeys: rows[0] ? Object.keys(rows[0]).slice(0, 8) : [],
          url,
        }),
      );
    } catch (e) {
      console.log(JSON.stringify({ name, status: 'unavailable', reason: e.message, url }));
    }
  }),
);
