import { NextResponse } from 'next/server';
import { checkDb, context, failure } from '@/lib/server';
import { getFacility } from '@/lib/store';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await context();
    const id = (await params).id;
    await getFacility(ctx, id);
    const { data, error } = await ctx.db
      .from('basilisk_research')
      .select('result,model,created_at')
      .eq('tenant_id', ctx.tenant)
      .eq('facility_id', id)
      .maybeSingle();
    checkDb(error);
    return NextResponse.json({ research: data });
  } catch (e) {
    return failure(e);
  }
}
