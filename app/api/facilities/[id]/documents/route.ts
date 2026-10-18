import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkDb, context, failure, HttpError, sameOrigin } from '@/lib/server';
import { getFacility } from '@/lib/store';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await context();
    const id = (await params).id;
    await getFacility(ctx, id);
    const { data, error } = await ctx.db
      .from('basilisk_documents')
      .select('id,original_name,kind,created_at')
      .eq('tenant_id', ctx.tenant)
      .eq('facility_id', id)
      .order('created_at', { ascending: false });
    checkDb(error);
    return NextResponse.json({ documents: data });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    sameOrigin(request);
    const ctx = await context();
    const id = (await params).id;
    await getFacility(ctx, id);
    const limit = 4_200_000;
    if (Number(request.headers.get('content-length') ?? 0) > limit)
      throw new HttpError(413, 'Document uploads must be under 4 MB.');
    const reader = request.body?.getReader();
    if (!reader) throw new HttpError(400, 'Upload required.');
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new HttpError(413, 'Document uploads must be under 4 MB.');
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { 'content-type': request.headers.get('content-type') ?? '' },
    }).formData();
    if (form.get('authorized') !== 'true')
      throw new HttpError(400, 'Confirm authorization to store this confidential document.');
    const kind = z
      .enum([
        'Utility bill',
        'Interval load',
        'PLC / NSPL tag',
        'Generator nameplate',
        'Air permit',
      ])
      .parse(form.get('kind'));
    const file = form.get('file');
    if (!(file instanceof File) || file.size > 4_000_000 || file.size === 0)
      throw new HttpError(400, 'Provide a PDF, PNG, JPEG or CSV under 4 MB.');
    const bytes = Buffer.from(await file.arrayBuffer());
    const type =
      bytes.subarray(0, 5).toString() === '%PDF-'
        ? 'application/pdf'
        : bytes[0] === 0xff && bytes[1] === 0xd8
          ? 'image/jpeg'
          : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? 'image/png'
            : file.name.toLowerCase().endsWith('.csv') &&
                !bytes.includes(0) &&
                !/<(?:html|script|svg)/i.test(bytes.toString())
              ? 'text/csv'
              : null;
    if (!type) throw new HttpError(400, 'Unsupported file contents.');
    const original = file.name.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 150);
    const path = `${ctx.tenant}/${id}/${crypto.randomUUID()}-${original}`;
    const { error: uploadError } = await ctx.db.storage
      .from('basilisk-confidential')
      .upload(path, bytes, { contentType: type, upsert: false });
    checkDb(uploadError);
    const { error } = await ctx.db
      .from('basilisk_documents')
      .insert({
        tenant_id: ctx.tenant,
        facility_id: id,
        storage_path: path,
        original_name: original,
        kind,
        uploaded_by: ctx.user,
        authorized_at: new Date().toISOString(),
      });
    if (error) {
      await ctx.db.storage.from('basilisk-confidential').remove([path]);
      checkDb(error);
    }
    return NextResponse.json({ persisted: true, confidential: true });
  } catch (e) {
    return failure(e);
  }
}
