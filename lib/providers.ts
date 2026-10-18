import { blankFacility, type Facility, pjmStates } from './model';
import { z } from 'zod';
export const discoverySchema = z.object({
  provider: z.enum(['epa-tri', 'epa-ghgrp', 'epa-frs', 'dataforseo']),
  state: z.enum(pjmStates),
  pages: z.number().int().min(1).max(10).default(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(1).max(100).default(25),
});
export type DiscoveryConfig = z.infer<typeof discoverySchema>;
export const PAGE_SIZE = 20;
export async function fetchBounded(url: string, init?: RequestInit) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(9000), cache: 'no-store' });
      if (!r.ok) {
        if (r.status === 429 || r.status >= 500) {
          if (attempt === 0) continue;
        }
        throw new Error(
          `Provider returned HTTP ${r.status}. Retry later; no replacement data was generated.`,
        );
      }
      return r;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  throw new Error('Provider unavailable.');
}
type Row = Record<string, unknown>;
const str = (r: Row, ...keys: string[]) => {
  for (const k of keys) {
    if (r[k] !== null && r[k] !== undefined && String(r[k]).trim()) return String(r[k]).trim();
  }
  return '';
};
export function normalizePublic(rows: Row[], config: DiscoveryConfig, url: string): Facility[] {
  return rows
    .filter((r) => r.fac_closed_ind !== '1')
    .flatMap((raw) => {
      const r = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
      if (
        config.provider === 'epa-ghgrp' &&
        str(r, 'reported_industry_types')
          .split(',')
          .map((s) => s.trim())
          .includes('D')
      )
        return [];
      const name = str(r, 'facility_name', 'primary_name');
      const address = str(r, 'street_address', 'address1', 'location_address');
      const city = str(r, 'city_name', 'city');
      if (!name || !address || !city) return [];
      const f = blankFacility(
        name,
        address,
        city,
        str(r, 'state_abbr', 'state', 'state_code') || config.state,
        str(r, 'zip_code', 'zip', 'postal_code'),
      );
      f.origin = 'Automated discovery';
      f.identifiers = {};
      for (const [key, value] of [
        ['frs', str(r, 'epa_registry_id', 'frs_id', 'registry_id')],
        ['tri', str(r, 'tri_facility_id')],
        ['ghgrp', str(r, 'eggrt_facility_id', 'facility_id')],
      ])
        if (value) f.identifiers[key] = value;
      f.evidence = [
        {
          id: crypto.randomUUID(),
          fact: 'facility identity',
          value: `${name} | ${address}, ${city}`,
          unit: null,
          status: 'verified',
          source_title:
            config.provider === 'dataforseo'
              ? 'DataForSEO business listing'
              : `EPA ${config.provider.replace('epa-', '').toUpperCase()} facility record`,
          source_url: url,
          document_date: null,
          captured_at: new Date().toISOString(),
          page_or_excerpt: `Provider facility identifiers: ${JSON.stringify(f.identifiers)}. Registry presence does not establish electric load, PJM service or DR capability.`,
          reviewed_by: 'Source adapter / identity only',
          reviewed_at: new Date().toISOString(),
          method: 'automated',
          confidence: 'high',
          author: config.provider === 'dataforseo' ? 'DataForSEO' : 'EPA public facility registry',
          conflict: false,
          category: 'identity',
        },
      ];
      f.why = 'A named operating-location record is available for site-specific investigation.';
      f.missing = 'Evidence of meaningful electric load and a controllable reduction method.';
      return [f];
    });
}
export async function discoverPage(config: DiscoveryConfig, page: number) {
  const offset = page * PAGE_SIZE;
  let url: string;
  let rows: Row[];
  if (config.provider === 'dataforseo') {
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD)
      throw new Error(
        'DataForSEO is not configured. Add its login/password; no demo results were generated.',
      );
    if (config.latitude === undefined || config.longitude === undefined)
      throw new Error('DataForSEO requires an explicit search latitude and longitude.');
    url = 'https://api.dataforseo.com/v3/business_data/business_listings/search/live';
    const r = await fetchBounded(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')}`,
      },
      body: JSON.stringify([
        {
          location_coordinate: `${config.latitude},${config.longitude},${config.radius}`,
          limit: PAGE_SIZE,
          offset,
        },
      ]),
    });
    const body = await r.json();
    if (body.tasks?.[0]?.status_code !== 20000)
      throw new Error('DataForSEO task failed. Check provider account and billing.');
    rows = (body.tasks?.[0]?.result?.[0]?.items ?? []).map((r: Row) => {
      const a = (r.address_info ?? {}) as Row;
      return {
        facility_name: r.title ?? r.name,
        street_address: a.address ?? r.address,
        city_name: a.city,
        state_abbr: config.state,
        zip_code: a.zip,
      };
    });
  } else {
    const end = offset + PAGE_SIZE - 1;
    url =
      config.provider === 'epa-tri'
        ? `https://data.epa.gov/dmapservice/tri.tri_facility/state_abbr/equals/${config.state}/${offset + 1}:${end + 1}/json`
        : config.provider === 'epa-frs'
          ? `https://data.epa.gov/efservice/FRS_FACILITY_SITE/STATE_CODE/${config.state}/ROWS/${offset}:${end}/JSON`
          : `https://data.epa.gov/efservice/PUB_DIM_FACILITY/STATE/=/${config.state}/ROWS/${offset}:${end}/JSON`;
    const response = await fetchBounded(url);
    const json = await response.json();
    rows = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.results)
          ? json.results
          : [];
    if (!Array.isArray(json) && !Array.isArray(json?.data) && !Array.isArray(json?.results))
      throw new Error(
        'Provider returned an unsupported response. Check the EPA endpoint; no fake results were generated.',
      );
  }
  return { facilities: normalizePublic(rows, config, url), received: rows.length, source: url };
}
