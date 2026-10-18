import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET as facilities } from '@/app/api/facilities/route';
import { POST as importLead } from '@/app/api/import/route';
import { POST as createJob } from '@/app/api/jobs/route';
import { GET as cron } from '@/app/api/cron/route';
import { GET as session } from '@/app/api/session/route';
import { seeds } from '@/lib/seeds';
import { sameOrigin } from '@/lib/server';
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_SECRET_KEY', '');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', '');
  vi.stubEnv('CRON_SECRET', '');
});
afterEach(() => vi.unstubAllEnvs());
const request = (path: string, body: unknown, origin = 'https://basilisk.example') =>
  new Request(`https://basilisk.example${path}`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
describe('seed-mode API boundaries', () => {
  it('accepts a same-host browser when Next internally constructs a localhost URL', () => {
    expect(() =>
      sameOrigin(
        new Request('http://localhost:3000/api/import', {
          headers: { Host: '127.0.0.1:3000', Origin: 'http://127.0.0.1:3000' },
        }),
      ),
    ).not.toThrow();
    expect(() =>
      sameOrigin(
        new Request('http://localhost:3000/api/import', {
          headers: { Host: '127.0.0.1:3000', Origin: 'http://attacker.example' },
        }),
      ),
    ).toThrow();
  });
  it('serves four acquisitions plus the four preserved leads and no signed-in user', async () => {
    const r = await facilities();
    expect(r.status).toBe(200);
    expect((await r.json()).facilities).toHaveLength(8);
    expect(await (await session()).json()).toEqual({ mode: 'seed', user: null });
  });
  it('validates researched imports without claiming persistence', async () => {
    const r = await importLead(
      request('/api/import', {
        format: 'json',
        content: JSON.stringify({ version: 1, facilities: [seeds[0]] }),
      }),
    );
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.persisted).toBe(false);
    expect(body.preview[0].evidence[0].status).toBe('suggested');
  });
  it('rejects writes and job creation without database credentials', async () => {
    const r = await importLead(
      request('/api/import', {
        format: 'json',
        content: JSON.stringify({ version: 1, facilities: [seeds[0]] }),
        commit: true,
      }),
    );
    expect(r.status).toBe(503);
    const job = await createJob(
      request('/api/jobs', {
        kind: 'discovery',
        config: { provider: 'epa-tri', state: 'PA', pages: 1 },
      }),
    );
    expect(job.status).toBe(503);
  });
  it('rejects cross-origin mutations and unauthenticated cron', async () => {
    const r = await importLead(request('/api/import', {}, 'https://other.example'));
    expect(r.status).toBe(403);
    expect((await cron(new Request('https://basilisk.example/api/cron'))).status).toBe(401);
  });
  it('bounds request streams before JSON parsing', async () => {
    const r = await importLead(request('/api/import', { content: 'x'.repeat(1_100_001) }));
    expect(r.status).toBe(413);
  });
});
