'use client';
import type { Facility } from '@/lib/model';
import { availabilityLabel, money, qualifyingMwLabel, readiness } from '@/lib/acquisitions';
import { Badge } from './shared';
export function AcquisitionCard({ facility: f, open }: { facility: Facility; open: () => void }) {
  const a = f.acquisition!;
  const ready = readiness(f);
  return (
    <article className="prospect-card acquisition-card">
      <div className="card-top">
        <span className="card-index">0{a.featured_order}</span>
        <Badge tone={a.availability === 'advertised' ? 'green' : 'amber'}>
          {availabilityLabel(f)}
        </Badge>
      </div>
      <button className="card-title-button" onClick={open}>
        <span className="card-name">{f.name}</span>
        <span className="card-arrow">↗</span>
      </button>
      <div className="card-location">
        {f.city}, {f.state} {f.postal_code}
      </div>
      <div className="acquisition-price">
        {money(a.asking_price_usd)}
        <small>
          {a.price_status === 'last-reported'
            ? 'Last reported · not current'
            : a.price_status === 'disputed'
              ? 'Asking · price conflict'
              : a.price_status === 'unverified'
                ? 'Reported asking · unverified'
                : 'Advertised asking'}
        </small>
      </div>
      <div className="acquisition-facts">
        <div>
          <span>Building size{a.area_status === 'disputed' ? ' · disputed' : ''}</span>
          <strong>
            {a.area_status !== 'reported' ? '≈ ' : ''}
            {a.building_sqft?.toLocaleString('en-US') ?? 'Unknown'} sq ft
          </strong>
        </div>
        <div>
          <span>Estimated qualifying MW</span>
          <strong>{qualifyingMwLabel(f)}</strong>
        </div>
        <div>
          <span>DR readiness</span>
          <Badge
            tone={
              ready === 'Promising' ? 'green' : ready === 'Not Currently Ready' ? 'red' : 'amber'
            }
          >
            {ready}
          </Badge>
        </div>
      </div>
      <p>{f.why}</p>
      <div className="acquisition-links">
        <button className="text-button" onClick={open}>
          Research details →
        </button>
        <a href={a.listing_url} target="_blank" rel="noreferrer">
          Original listing ↗
        </a>
      </div>
    </article>
  );
}
