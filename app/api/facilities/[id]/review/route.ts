import { NextResponse } from 'next/server';
import { z } from 'zod';
import { context, failure, HttpError, readJson, sameOrigin } from '@/lib/server';
import { getFacility, saveFacility } from '@/lib/store';
import { reconcileDecisions } from '@/lib/model';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const ctx = await context();
    const { evidence_id, status, resolve_conflict } = z
      .object({
        evidence_id: z.string(),
        status: z.enum(['verified', 'estimated', 'contradicted']),
        resolve_conflict: z.boolean().default(false),
      })
      .parse(await readJson(request, 2000));
    const { facility, version } = await getFacility(ctx, (await params).id);
    if (!facility.evidence.some((e) => e.id === evidence_id))
      throw new HttpError(404, 'Evidence not found.');
    facility.evidence = facility.evidence.map((e) =>
      e.id === evidence_id
        ? {
            ...e,
            status,
            reviewed_by: ctx.email,
            reviewed_at: new Date().toISOString(),
            conflict: resolve_conflict ? false : e.conflict,
          }
        : e,
    );
    facility.updated_at = new Date().toISOString();
    reconcileDecisions(facility);
    await saveFacility(ctx, facility, version);
    return NextResponse.json({ facility, version: version + 1 });
  } catch (e) {
    return failure(e);
  }
}
