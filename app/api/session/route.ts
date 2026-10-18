import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, configured, context, failure, HttpError, readJson, sameOrigin } from '@/lib/server';
export async function GET() {
  try {
    if (!configured()) return NextResponse.json({ mode: 'seed', user: null });
    const ctx = await context();
    return NextResponse.json({ mode: 'live', user: ctx.email });
  } catch {
    return NextResponse.json({ mode: 'live', user: null });
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!configured()) throw new HttpError(503, 'Supabase is not configured.');
    const { email, password } = z
      .object({ email: z.string().email().max(250), password: z.string().min(1).max(256) })
      .parse(await readJson(request, 2000));
    const allowed = (process.env.BASILISK_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((v) => v.trim().toLowerCase());
    if (!allowed.includes(email.toLowerCase())) throw new HttpError(401, 'Sign-in failed.');
    const { data, error } = await admin().auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new HttpError(401, 'Sign-in failed.');
    const response = NextResponse.json({ ok: true });
    response.cookies.set('basilisk_session', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: data.session.expires_in,
    });
    return response;
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const r = NextResponse.json({ ok: true });
    r.cookies.delete('basilisk_session');
    return r;
  } catch (e) {
    return failure(e);
  }
}
