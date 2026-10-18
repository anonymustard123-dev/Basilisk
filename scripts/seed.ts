import { createClient } from '@supabase/supabase-js';
import { initialFacilities } from '../lib/initial-facilities.ts';
import { siteKey } from '../lib/identity.ts';
// Idempotent seed only: existing records are never overwritten.
const { SUPABASE_URL, SUPABASE_SECRET_KEY, BASILISK_TENANT_ID } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !BASILISK_TENANT_ID)
  throw new Error('Set SUPABASE_URL, SUPABASE_SECRET_KEY and BASILISK_TENANT_ID in .env.local.');
const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
for (const facility of initialFacilities) {
  const site_key = siteKey(facility);
  const { data: addressRows, error: lookupError } = await db
    .from('basilisk_facilities')
    .select('id,payload,version')
    .eq('tenant_id', BASILISK_TENANT_ID)
    .eq('site_key', site_key);
  if (lookupError) throw new Error('Seed lookup failed.');
  let existing = addressRows?.[0];
  if (facility.acquisition) {
    const sourceLookup = await db
      .from('basilisk_facilities')
      .select('id,payload,version')
      .eq('tenant_id', BASILISK_TENANT_ID)
      .eq('payload->acquisition->>source_id', facility.acquisition.source_id);
    if (sourceLookup.error) throw new Error('Acquisition source lookup failed.');
    if (sourceLookup.data?.[0] && existing && sourceLookup.data[0].id !== existing.id)
      throw new Error('Conflicting address/source identity. Resolve before seeding.');
    existing = existing ?? sourceLookup.data?.[0];
  }
  if (existing) {
    if (facility.acquisition) {
      const payload = {
        ...existing.payload,
        acquisition: {
          ...(existing.payload.acquisition ?? facility.acquisition),
          featured_order: facility.acquisition.featured_order,
        },
      };
      if (!existing.payload.acquisition)
        payload.evidence = [
          ...(existing.payload.evidence ?? []),
          ...facility.evidence.filter(
            (e) =>
              !(existing!.payload.evidence ?? []).some((old: { id: string }) => old.id === e.id),
          ),
        ];
      if (JSON.stringify(payload) !== JSON.stringify(existing.payload)) {
        const saved = await db
          .from('basilisk_facilities')
          .update({ payload, version: existing.version + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .eq('tenant_id', BASILISK_TENANT_ID)
          .eq('version', existing.version)
          .select('id');
        if (saved.error || !saved.data?.length)
          throw new Error('Seed conflict; rerun after refreshing the record.');
      }
    }
    console.log(`Seed preserved: ${facility.name}`);
    continue;
  }
  const { error } = await db.from('basilisk_facilities').upsert(
    {
      id: `${BASILISK_TENANT_ID}:${facility.id}`,
      tenant_id: BASILISK_TENANT_ID,
      site_key,
      payload: { ...facility, id: `${BASILISK_TENANT_ID}:${facility.id}` },
    },
    { onConflict: 'tenant_id,site_key', ignoreDuplicates: true },
  );
  if (error) throw new Error(`Seed failed: ${error.code}. Check migration and tenant ID.`);
  console.log(`Seed ensured: ${facility.name}`);
}
