import { NextResponse } from 'next/server';
import { z } from 'zod';
import { facilitySchema, validateDecisions } from '@/lib/model';
import { context, failure, readJson, sameOrigin } from '@/lib/server';
import { getFacility, saveFacility } from '@/lib/store';
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const ctx = await context();
    const { id } = await params;
    const input = z
      .object({ facility: facilitySchema, version: z.number().int().positive() })
      .parse(await readJson(request));
    const { facility: current } = await getFacility(ctx, id);
    // Identity and all evidence changes go through dedicated review/import workflows.
    const f = validateDecisions({
      ...current,
      pjm: input.facility.pjm,
      load: input.facility.load,
      dr: input.facility.dr,
      assets: input.facility.assets,
      qualification: input.facility.qualification,
      stage: input.facility.stage,
      notes: input.facility.notes,
      checklist: input.facility.checklist,
      updated_at: new Date().toISOString(),
    });
    await saveFacility(ctx, f, input.version);
    return NextResponse.json({ facility: f, version: input.version + 1, persisted: true });
  } catch (e) {
    return failure(e);
  }
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    return NextResponse.json(await getFacility(await context(), (await params).id));
  } catch (e) {
    return failure(e);
  }
}
