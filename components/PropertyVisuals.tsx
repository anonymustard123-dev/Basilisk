'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { Facility } from '@/lib/model';
import { money } from '@/lib/acquisitions';
import { capacityScale, propertyVisual, profitBridge } from '@/lib/property-visuals';

export function PropertyPhoto({ f, priority }: { f: Facility; priority: boolean }) {
  const [failed, setFailed] = useState(false);
  const p = propertyVisual(f);
  return (
    <figure className="property-photo">
      {failed ? (
        <div className="photo-unavailable">Photo unavailable · view listing ↗</div>
      ) : (
        <Image
          src={p.photo}
          alt={`Listing photograph of ${f.name}, ${f.city}, ${f.state}`}
          width={1200}
          height={520}
          unoptimized
          priority={priority}
          onError={() => setFailed(true)}
        />
      )}
      <figcaption>
        <a href={p.source} target="_blank" rel="noreferrer">
          Photo: {p.credit} ↗
        </a>
      </figcaption>
    </figure>
  );
}

export function CapacityBars({ f, modeled }: { f: Facility; modeled: number }) {
  const p = propertyVisual(f),
    scale = Math.max(capacityScale, modeled);
  return (
    <div className="capacity-bars" aria-label="Reported power and modeled reduction">
      {[
        {
          label: 'Reported infrastructure',
          value: p.mw,
          suffix: p.plus ? '+' : '',
          kind: 'reported',
        },
        { label: 'Modeled reduction', value: modeled, suffix: '', kind: 'modeled' },
      ].map((row) => (
        <div className={`capacity-row ${row.kind}`} key={row.kind}>
          <div>
            <span>{row.label}</span>
            <strong>
              {row.value}
              {row.suffix} MW
            </strong>
          </div>
          <div className="capacity-track" aria-hidden="true">
            <span style={{ width: `${(row.value / scale) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfitBridge({
  gross,
  receipts,
  retained,
  cost,
  realization,
  share,
}: {
  gross: number;
  receipts: number;
  retained: number;
  cost: number;
  realization: number;
  share: number;
}) {
  return (
    <section className="profit-bridge" aria-label="Annual DR profit bridge">
      <div className="bridge-title">
        <h3>Profit bridge</h3>
        <span>Annual · modeled</span>
      </div>
      <div className="bridge-rows">
        {profitBridge(gross, receipts, retained, cost).map((row) => (
          <div className={`bridge-row ${row.kind}`} key={row.label}>
            <div className="bridge-label">
              <span>{row.label}</span>
              <strong>
                {row.value < 0 ? '−' : ''}
                {money(Math.abs(row.value))}
              </strong>
            </div>
            <div className="bridge-track" aria-hidden="true">
              <i style={{ left: `${row.zero}%` }} />
              <span style={{ left: `${row.left}%`, width: `${row.width}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="bridge-basis">
        {realization}% receipts · {share}% our share · net before debt & tax
      </p>
    </section>
  );
}
