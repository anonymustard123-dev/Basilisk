import { afterEach, describe, it, expect, vi } from 'vitest';
import { discoverPage, normalizePublic } from '@/lib/providers';
import { researchFacility } from '@/lib/research';
import { seeds } from '@/lib/seeds';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('honest provider behavior', () => {
  it('returns a clear error, not fake leads, when DataForSEO credentials are absent', async () => {
    vi.stubEnv('DATAFORSEO_LOGIN', '');
    vi.stubEnv('DATAFORSEO_PASSWORD', '');
    await expect(
      discoverPage({ provider: 'dataforseo', state: 'PA', pages: 1, radius: 25 }, 0),
    ).rejects.toThrow(/not configured/);
  });
  it('does not call AI when credentials are absent', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(researchFacility(seeds[0])).rejects.toThrow(/not configured/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('reports provider failures after bounded retry without substitution', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 }));
    vi.stubGlobal('fetch', fetch);
    await expect(
      discoverPage({ provider: 'epa-tri', state: 'PA', pages: 1, radius: 25 }, 0),
    ).rejects.toThrow(/503/);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('paginates state-specific EPA retrieval without converting emissions to load', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            facility_name: 'Plant',
            street_address: '100 Main St',
            city_name: 'Town',
            state_abbr: 'IL',
            zip_code: '60000',
            reported_total_emissions: 10000000,
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const r = await discoverPage({ provider: 'epa-tri', state: 'IL', pages: 2, radius: 25 }, 1);
    expect(fetch.mock.calls[0][0]).toContain('/IL/21:40/json');
    expect(r.facilities[0].load.verified_mw).toBeNull();
    expect(r.facilities[0].pjm.status).toBe('unknown');
  });
  it('discards rows without a physical address instead of inventing identity', () => {
    expect(
      normalizePublic(
        [{ facility_name: 'No address' }],
        { provider: 'epa-frs', state: 'PA', pages: 1, radius: 25 },
        'https://data.epa.gov/test',
      ),
    ).toEqual([]);
  });
});
