import { z } from 'zod';
import { checkDb, type Context } from './server';
import { getFacility, importFacilities } from './store';
import { discoverySchema, discoverPage, PAGE_SIZE } from './providers';
import { researchFacility } from './research';
import { blankFacility } from './model';
export const jobInput = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('discovery'), config: discoverySchema }),
  z.object({
    kind: z.literal('research'),
    config: z.object({ ids: z.array(z.string().min(1).max(100)).min(1).max(4) }),
  }),
]);
export type Job = {
  id: string;
  kind: 'discovery' | 'research';
  status: string;
  config: Record<string, unknown>;
  checkpoint: number;
  imported: number;
  attempts: number;
  diagnostics: string;
  created_at: string;
  updated_at: string;
};
export async function listJobs(ctx: Context) {
  const { data, error } = await ctx.db
    .from('basilisk_jobs')
    .select('id,kind,status,config,checkpoint,imported,attempts,diagnostics,created_at,updated_at')
    .eq('tenant_id', ctx.tenant)
    .order('created_at', { ascending: false })
    .limit(30);
  checkDb(error);
  return (data ?? []) as Job[];
}
export async function runJob(ctx: Context, id: string) {
  const { data: claimed, error } = await ctx.db.rpc('basilisk_claim_job', { job_id: id });
  checkDb(error);
  if (!claimed?.length)
    return { message: 'Job is already running, complete, or waiting for its lease to expire.' };
  const job = claimed[0] as Job;
  let next = job.checkpoint,
    imported = job.imported;
  let complete = false;
  let diagnostic = '';
  try {
    if (job.kind === 'discovery') {
      const config = discoverySchema.parse(job.config);
      const result = await discoverPage(config, job.checkpoint);
      const counts = await importFacilities(ctx, result.facilities);
      imported += counts.inserted + counts.merged;
      next++;
      complete = next >= config.pages || result.received < PAGE_SIZE;
      diagnostic = `${config.provider}: page ${next}; ${result.received} source rows; ${counts.inserted} inserted / ${counts.merged} merged. ${result.source}`;
    } else {
      const ids = z.array(z.string()).parse(job.config.ids);
      const id = ids[job.checkpoint];
      const { facility } = await getFacility(ctx, id);
      const { data: cache, error: cacheError } = await ctx.db
        .from('basilisk_research')
        .select('created_at')
        .eq('tenant_id', ctx.tenant)
        .eq('facility_id', id)
        .maybeSingle();
      checkDb(cacheError);
      if (cache && Date.now() - Date.parse(cache.created_at) < 7 * 86400000) {
        diagnostic = 'Seven-day research cache reused. Previous findings are preserved.';
      } else {
        const { result, model } = await researchFacility(facility);
        const incoming = {
          ...blankFacility(
            facility.name,
            facility.address,
            facility.city,
            facility.state,
            facility.postal_code,
          ),
          researched: true,
          why: result.summary,
          missing: result.missing,
          next_action: result.next_action,
        };
        incoming.evidence = result.claims.map((c) => ({
          ...c,
          id: crypto.randomUUID(),
          unit: null,
          status: 'suggested' as const,
          captured_at: new Date().toISOString(),
          reviewed_by: null,
          reviewed_at: null,
          method: 'ai' as const,
          author: `OpenAI / ${model}`,
          conflict: false,
        }));
        // Merge current state instead of replacing a record that may have been edited during research.
        await importFacilities(ctx, [incoming]);
        const { error: saveError } = await ctx.db.from('basilisk_research').upsert({
          tenant_id: ctx.tenant,
          facility_id: id,
          result,
          model,
          created_at: new Date().toISOString(),
        });
        checkDb(saveError);
        imported++;
        diagnostic = `Research saved: ${result.claims.length} cited suggestions awaiting review.`;
      }
      next++;
      complete = next >= ids.length;
    }
    const { error: saveError } = await ctx.db
      .from('basilisk_jobs')
      .update({
        status: complete ? 'complete' : 'queued',
        checkpoint: next,
        imported,
        attempts: 0,
        diagnostics: diagnostic,
        lease_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', ctx.tenant)
      .eq('id', id);
    checkDb(saveError);
  } catch (error) {
    const attempts = job.attempts + 1;
    const { error: saveError } = await ctx.db
      .from('basilisk_jobs')
      .update({
        status: attempts >= 3 ? 'failed' : 'queued',
        attempts,
        diagnostics: error instanceof Error ? error.message.slice(0, 700) : 'Provider failed.',
        lease_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', ctx.tenant)
      .eq('id', id);
    checkDb(saveError);
  }
  return { jobs: await listJobs(ctx) };
}
