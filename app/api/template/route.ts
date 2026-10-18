import { NextResponse } from 'next/server';
import { acquisitionSeeds } from '@/lib/featured-acquisitions';
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get('format') === 'csv')
    return new NextResponse(
      'name,address,city,state,postal_code,fact,value,source_title,source_url,document_date,page_or_excerpt,author,why,missing,next_action,listing_id,listing_url,asking_price_usd,building_sqft,property_type,occupancy\r\n',
      {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="basilisk-research-template.csv"',
        },
      },
    );
  return NextResponse.json(
    { version: 1, facilities: [acquisitionSeeds[1]] },
    { headers: { 'Content-Disposition': 'attachment; filename="basilisk-research-example.json"' } },
  );
}
