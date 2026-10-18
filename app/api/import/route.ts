import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseImport } from '@/lib/import';
import { configured, context, failure, readJson, sameOrigin } from '@/lib/server';
import { importFacilities } from '@/lib/store';
export const maxDuration=60;
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const input = z
      .object({
        content: z.string().max(1_000_000),
        format: z.enum(['json', 'csv']),
        commit: z.boolean().default(false),
      })
      .parse(await readJson(request, 1_100_000));
    if (configured()) await context();
    const facilities = parseImport(input.content, input.format);
    if (!input.commit) return NextResponse.json({ preview: facilities, persisted: false });
    const ctx = await context();
    const result = await importFacilities(ctx, facilities);
    return NextResponse.json({ ...result, persisted: true });
  } catch (e) {
    return failure(e);
  }
}
