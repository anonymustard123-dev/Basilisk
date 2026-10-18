import { NextResponse } from 'next/server';
import { configured, context, failure } from '@/lib/server';
import { listFacilities } from '@/lib/store';
import { initialFacilities } from '@/lib/initial-facilities';
import { featuredAcquisitions, availabilityLabel, qualifyingMwLabel } from '@/lib/acquisitions';
import { exportCsv } from '@/lib/import';
import { priority, loadLabel, capacityLabel } from '@/lib/scoring';
export async function GET(request: Request) {
  try {
    const all = configured() ? await listFacilities(await context()) : initialFacilities;
    const featured = featuredAcquisitions(all);
    const rows = featured.length
      ? featured
      : all
          .filter(
            (f) =>
              f.researched &&
              !priority(f).excluded &&
              !['Deprioritized', 'Disqualified'].includes(f.stage),
          )
          .sort((a, b) => priority(b).score - priority(a).score)
          .slice(0, 4);
    const md = new URL(request.url).searchParams.get('format') === 'md';
    const body = md
      ? '# BASILISK · research shortlist\n\nResearch candidates; no inferred qualification or customer availability.\n\n' +
        rows
          .map(
            (f) =>
              `## ${f.name}\n${f.address}, ${f.city}, ${f.state} ${f.postal_code}\n\n${f.why}\n\n${f.acquisition ? `- Availability: ${availabilityLabel(f)}\n- Reported asking price: $${f.acquisition.asking_price_usd} (${f.acquisition.price_status})\n- Building SF: ${f.acquisition.building_sqft} (${f.acquisition.area_status})\n- Estimated qualifying MW: ${qualifyingMwLabel(f)}\n- Listing: ${f.acquisition.listing_url}\n` : ''}- PJM: ${f.pjm.status}; account confirmation required.\n- Grid demand: ${loadLabel(f)}\n- Assets: ${f.assets.map((a) => a.description).join('; ')}\n- DR history: ${f.dr.status}\n- Buyer-qualified capacity: ${capacityLabel(f)}\n- Missing: ${f.missing}\n- Next action: ${f.next_action}\n- Approach: ${f.target_role}\n\nSources:\n${f.evidence.map((e) => `- [${e.source_title}](${e.source_url}) · ${e.document_date ?? 'Undated'} · ${e.status}`).join('\n')}\n`,
          )
          .join('\n')
      : exportCsv(rows);
    return new NextResponse(body, {
      headers: {
        'Content-Type': md ? 'text/markdown; charset=utf-8' : 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="basilisk-shortlist.${md ? 'md' : 'csv'}"`,
      },
    });
  } catch (e) {
    return failure(e);
  }
}
