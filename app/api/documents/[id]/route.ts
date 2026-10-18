import { NextResponse } from 'next/server';
import { checkDb, context, failure, HttpError } from '@/lib/server';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await context();
    const { data, error } = await ctx.db
      .from('basilisk_documents')
      .select('storage_path,original_name')
      .eq('tenant_id', ctx.tenant)
      .eq('id', (await params).id)
      .single();
    checkDb(error);
    if (!data) throw new HttpError(404, 'Document not found.');
    const { data: link, error: linkError } = await ctx.db.storage
      .from('basilisk-confidential')
      .createSignedUrl(data.storage_path, 60, { download: data.original_name });
    checkDb(linkError);
    if (!link) throw new HttpError(502, 'Cannot create download link.');
    return NextResponse.redirect(link.signedUrl);
  } catch (e) {
    return failure(e);
  }
}
