import { NextResponse } from 'next/server';
import {
  checkDb,
  configured,
  context,
  failure,
  HttpError,
  readJson,
  sameOrigin,
} from '@/lib/server';
import { jobInput, listJobs } from '@/lib/jobs';
export async function GET() {
  try {
    const capabilities = {
      openai: !!process.env.OPENAI_API_KEY,
      dataforseo: !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
      database: configured(),
    };
    if (!configured()) return NextResponse.json({ jobs: [], capabilities });
    return NextResponse.json({ jobs: await listJobs(await context()), capabilities });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const ctx = await context();
    const input = jobInput.parse(await readJson(request, 10000));
    if (input.kind === 'research' && !process.env.OPENAI_API_KEY)
      throw new HttpError(503, 'OpenAI is not configured. Use Import researched lead.');
    if (
      input.kind === 'discovery' &&
      input.config.provider === 'dataforseo' &&
      !(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
    )
      throw new HttpError(503, 'DataForSEO is not configured. EPA discovery needs no vendor key.');
    const { data, error } = await ctx.db.rpc('basilisk_enqueue_job', {
      workspace: ctx.tenant,
      job_kind: input.kind,
      job_config: input.config,
    });
    checkDb(error);
    if (!data?.length)
      throw new HttpError(
        429,
        'Daily job limit reached (5 research / 10 discovery jobs). Try tomorrow.',
      );
    return NextResponse.json({ job: data[0] });
  } catch (e) {
    return failure(e);
  }
}
