import { NextResponse } from 'next/server';
import { seeds } from '@/lib/seeds';
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('format') === 'csv')
    return new NextResponse(
      'name,address,city,state,postal_code,fact,value,source_title,source_url,document_date,page_or_excerpt,author,why,missing,next_action\r\n',
      {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="basilisk-research-template.csv"',
        },
      },
    );
  return NextResponse.json(
    { version: 1, facilities: [seeds[0]] },
    { headers: { 'Content-Disposition': 'attachment; filename="basilisk-research-example.json"' } },
  );
}
