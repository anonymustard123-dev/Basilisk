import { NextResponse } from 'next/server';
import { admin, checkDb, configured, failure, HttpError } from '@/lib/server';
import { runJob } from '@/lib/jobs';
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    if (
      !process.env.CRON_SECRET ||
      request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
    )
      throw new HttpError(401, 'Unauthorized.');
    if (!configured()) throw new HttpError(503, 'Database not configured.');
    const db = admin();
    const { data, error } = await db
      .from('basilisk_jobs')
      .select('id,tenant_id')
      .in('status', ['queued', 'running'])
      .order('created_at')
      .limit(1);
    checkDb(error);
    if (!data?.length) return NextResponse.json({ message: 'No pending jobs.' });
    return NextResponse.json(
      await runJob({ db, tenant: data[0].tenant_id, user: 'cron', email: 'cron' }, data[0].id),
    );
  } catch (e) {
    return failure(e);
  }
}
