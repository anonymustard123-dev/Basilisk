import { NextResponse } from 'next/server';
import { runJob } from '@/lib/jobs';
import { context, failure, sameOrigin } from '@/lib/server';
export const maxDuration = 60;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    return NextResponse.json(await runJob(await context(), (await params).id));
  } catch (e) {
    return failure(e);
  }
}
