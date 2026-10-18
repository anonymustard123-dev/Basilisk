import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { acquisitionSeeds } from '@/lib/featured-acquisitions';
import { seeds } from '@/lib/seeds';
import { siteKey } from '@/lib/identity';
describe('acquisition Postgres migration', () => {
  it('backfills existing tenants idempotently without deleting original leads or overwriting diligence', async () => {
    const db = new PGlite();
    try {
      await db.exec(
        `create table basilisk_tenants(id uuid primary key);create table basilisk_facilities(id text primary key,tenant_id uuid,site_key text,payload jsonb,version integer default 1,updated_at timestamptz default now(),unique(tenant_id,site_key));insert into basilisk_tenants values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');`,
      );
      const tenant = '00000000-0000-0000-0000-000000000001';
      for (const f of seeds)
        await db.query(
          'insert into basilisk_facilities(id,tenant_id,site_key,payload)values($1,$2,$3,$4)',
          [f.id, tenant, siteKey(f), JSON.stringify(f)],
        );
      const existing = {
        ...acquisitionSeeds[0],
        id: 'already-researched',
        acquisition: null,
        stage: 'Contacted',
        notes: 'Keep my broker notes',
      };
      await db.query(
        'insert into basilisk_facilities(id,tenant_id,site_key,payload)values($1,$2,$3,$4)',
        [existing.id, tenant, siteKey(existing), JSON.stringify(existing)],
      );
      const legacyMac = {
        ...acquisitionSeeds[2],
        id: 'legacy-macdade',
        acquisition: null,
        notes: 'Preserve my occupancy research',
      };
      await db.query(
        'insert into basilisk_facilities(id,tenant_id,site_key,payload)values($1,$2,$3,$4)',
        [
          legacyMac.id,
          tenant,
          '108macdadeboulevard|collingdale|PA|19023',
          JSON.stringify(legacyMac),
        ],
      );
      const sql = readFileSync(
        'supabase/migrations/202610180002_featured_acquisitions.sql',
        'utf8',
      );
      await db.exec(sql);
      await db.exec(sql);
      const first = await db.query<{
        payload: { notes: string; stage: string; acquisition: { featured_order: number } };
        version: number;
      }>('select payload,version from basilisk_facilities where id=$1', ['already-researched']);
      expect(first.rows[0].payload.notes).toBe('Keep my broker notes');
      expect(first.rows[0].payload.stage).toBe('Contacted');
      expect(first.rows[0].payload.acquisition.featured_order).toBe(1);
      expect(first.rows[0].version).toBe(2);
      const legacy = await db.query<{
        payload: { notes: string; acquisition: { featured_order: number } };
      }>('select payload from basilisk_facilities where id=$1', ['legacy-macdade']);
      expect(legacy.rows[0].payload.notes).toBe('Preserve my occupancy research');
      expect(legacy.rows[0].payload.acquisition.featured_order).toBe(3);
      const count = await db.query<{ count: number }>(
        'select count(*)::integer as count from basilisk_facilities',
      );
      expect(count.rows[0].count).toBe(12);
      const pins = await db.query<{ count: number }>(
        "select count(*)::integer as count from basilisk_facilities where tenant_id=$1 and payload #>> '{acquisition,featured_order}' is not null",
        [tenant],
      );
      expect(pins.rows[0].count).toBe(4);
    } finally {
      await db.close();
    }
  }, 30000);
});
