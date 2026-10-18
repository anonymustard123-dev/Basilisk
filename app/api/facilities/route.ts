import { NextResponse } from 'next/server';
import { configured, context, failure } from '@/lib/server';
import { listFacilities } from '@/lib/store';
import { seeds } from '@/lib/seeds';
export async function GET() {
  try {
    return NextResponse.json({
      mode: configured() ? 'live' : 'seed',
      facilities: configured() ? await listFacilities(await context()) : seeds,
    });
  } catch (e) {
    return failure(e);
  }
}
