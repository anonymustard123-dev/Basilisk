import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appendEvidence, evidenceSchema } from '@/lib/model';
import { context, failure, readJson, sameOrigin } from '@/lib/server';
import { getFacility, saveFacility } from '@/lib/store';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const ctx = await context();
    const input = evidenceSchema
      .pick({
        fact: true,
        value: true,
        unit: true,
        source_title: true,
        source_url: true,
        document_date: true,
        page_or_excerpt: true,
        confidence: true,
        category: true,
      })
      .extend({ method: z.enum(['independent-research', 'customer', 'buyer']) })
      .parse(await readJson(request, 20000));
    const { facility, version } = await getFacility(ctx, (await params).id);
    appendEvidence(facility, {
      ...input,
      id: crypto.randomUUID(),
      status: 'suggested',
      captured_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      author: ctx.email,
      conflict: facility.evidence.some(
        (e) => e.fact === input.fact && String(e.value) !== String(input.value),
      ),
    });
    facility.updated_at = new Date().toISOString();
    await saveFacility(ctx, facility, version);
    return NextResponse.json({ facility, version: version + 1 });
  } catch (e) {
    return failure(e);
  }
}
