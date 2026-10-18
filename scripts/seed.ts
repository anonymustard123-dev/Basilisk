import { createClient } from '@supabase/supabase-js';
import { seeds } from '../lib/seeds.ts';
// Idempotent seed only: existing records are never overwritten.
const { SUPABASE_URL, SUPABASE_SECRET_KEY, BASILISK_TENANT_ID } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !BASILISK_TENANT_ID)
  throw new Error('Set SUPABASE_URL, SUPABASE_SECRET_KEY and BASILISK_TENANT_ID in .env.local.');
const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\broad\b/g, 'rd')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\b(south|north|east|west)\b/g, (m) => m[0])
    .replace(/[^a-z0-9]/g, '');
for (const facility of seeds) {
  const site_key = [
    normalize(facility.address),
    normalize(facility.city),
    facility.state,
    facility.postal_code.slice(0, 5),
  ].join('|');
  const { error } = await db
    .from('basilisk_facilities')
    .upsert(
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
