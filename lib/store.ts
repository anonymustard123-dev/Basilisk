import { facilitySchema, type Facility } from './model';
import { mergeFacility, sameSite, siteKey } from './identity';
import { checkDb, HttpError, type Context } from './server';
export async function listFacilities(ctx: Context) {
  const [recent, pinned] = await Promise.all([
    ctx.db
      .from('basilisk_facilities')
      .select('payload')
      .eq('tenant_id', ctx.tenant)
      .order('updated_at', { ascending: false })
      .limit(500),
    ctx.db
      .from('basilisk_facilities')
      .select('payload')
      .eq('tenant_id', ctx.tenant)
      .not('payload->acquisition->>featured_order', 'is', null),
  ]);
  checkDb(recent.error);
  checkDb(pinned.error);
  return [
    ...new Map(
      [...(pinned.data ?? []), ...(recent.data ?? [])].map((row) => {
        const f = facilitySchema.parse(row.payload);
        return [f.id, f] as const;
      }),
    ).values(),
  ];
}
export async function getFacility(ctx: Context, id: string) {
  const { data, error } = await ctx.db
    .from('basilisk_facilities')
    .select('payload,version')
    .eq('tenant_id', ctx.tenant)
    .eq('id', id)
    .single();
  checkDb(error);
  if (!data) throw new HttpError(404, 'Facility not found.');
  return { facility: facilitySchema.parse(data.payload), version: data.version as number };
}
export async function saveFacility(ctx: Context, f: Facility, version: number) {
  const { data, error } = await ctx.db
    .from('basilisk_facilities')
    .update({
      payload: facilitySchema.parse(f),
      version: version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', ctx.tenant)
    .eq('id', f.id)
    .eq('version', version)
    .select('id');
  checkDb(error);
  if (!data?.length)
    throw new HttpError(409, 'This facility changed. Refresh and review before saving.');
}
export async function importFacilities(ctx: Context, facilities: Facility[]) {
  let inserted = 0,
    merged = 0;
  for (const incoming of facilities) {
    const identity = siteKey(incoming);
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await ctx.db
        .from('basilisk_facilities')
        .select('payload,version')
        .eq('tenant_id', ctx.tenant)
        .eq('site_key', identity);
      checkDb(error);
      let candidates = data ?? [];
      if (incoming.acquisition) {
        const sourceMatch = await ctx.db
          .from('basilisk_facilities')
          .select('payload,version')
          .eq('tenant_id', ctx.tenant)
          .eq('payload->acquisition->>source_id', incoming.acquisition.source_id);
        checkDb(sourceMatch.error);
        candidates = [...candidates, ...(sourceMatch.data ?? [])];
      }
      const existing = candidates.find((row) =>
        sameSite(facilitySchema.parse(row.payload), incoming),
      );
      if (existing) {
        try {
          await saveFacility(
            ctx,
            mergeFacility(facilitySchema.parse(existing.payload), incoming),
            existing.version,
          );
          merged++;
          break;
        } catch (error) {
          if (error instanceof HttpError && error.status === 409 && attempt < 2) continue;
          throw error;
        }
      } else {
        if (candidates.length)
          throw new HttpError(
            409,
            'An existing site shares this address with a different operator. Confirm aliases / facility IDs before import.',
          );
        const { error: insertError } = await ctx.db.from('basilisk_facilities').insert({
          id: incoming.id,
          tenant_id: ctx.tenant,
          site_key: identity,
          payload: incoming,
        });
        if (insertError?.code === '23505' && attempt < 2) continue;
        checkDb(insertError);
        inserted++;
        break;
      }
    }
  }
  return { inserted, merged };
}
