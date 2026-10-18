import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const configured = () =>
  Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.SUPABASE_PUBLISHABLE_KEY,
  );
export const admin = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
export type Context = { db: SupabaseClient; tenant: string; user: string; email: string };
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? new URL(request.url).host;
  if (
    !origin ||
    new URL(origin).host !== host ||
    !['http:', 'https:'].includes(new URL(origin).protocol)
  )
    throw new HttpError(403, 'Same-origin request required.');
}
export async function context(): Promise<Context> {
  if (!configured())
    throw new HttpError(
      503,
      'Seed / read-only mode. Configure Supabase to save changes or run jobs.',
    );
  const token = (await cookies()).get('basilisk_session')?.value;
  if (!token) throw new HttpError(401, 'Sign in to your Basilisk workspace.');
  const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  const allowed = (process.env.BASILISK_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (error || !data.user?.email || !allowed.includes(data.user.email.toLowerCase()))
    throw new HttpError(401, 'Session expired or user is not allowed.');
  const { data: membership, error: membershipError } = await db
    .from('basilisk_memberships')
    .select('tenant_id')
    .eq('user_id', data.user.id)
    .limit(2);
  if (membershipError || membership?.length !== 1)
    throw new HttpError(403, 'Provision exactly one Basilisk workspace membership for this user.');
  return { db, tenant: membership[0].tenant_id, user: data.user.id, email: data.user.email };
}
export function checkDb(error: unknown) {
  if (error)
    throw new HttpError(
      502,
      'Database operation failed. Check the Basilisk migration and workspace permissions.',
    );
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .slice(0, 5)
          .join('; '),
      },
      { status: 400 },
    );
  return NextResponse.json(
    { error: error instanceof Error ? error.message.slice(0, 500) : 'Operation failed.' },
    { status: 400 },
  );
}
export async function readJson(request: Request, max = 1_000_000) {
  if (Number(request.headers.get('content-length') ?? 0) > max)
    throw new HttpError(413, 'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body required.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, 'Request is too large.');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
