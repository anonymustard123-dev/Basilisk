import { reconcileDecisions, type Facility } from './model';
const normalize = (v: string) =>
  v
    .toLowerCase()
    .replace(/\broad\b/g, 'rd')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\b(south|north|east|west)\b/g, (m) => m[0])
    .replace(/[^a-z0-9]/g, '');
export const siteKey = (f: Pick<Facility, 'address' | 'city' | 'state' | 'postal_code'>) =>
  [normalize(f.address), normalize(f.city), f.state, f.postal_code.slice(0, 5)].join('|');
export function sameSite(a: Facility, b: Facility) {
  if (siteKey(a) !== siteKey(b)) return false;
  const names = [a.name, a.operator, ...a.aliases].map(normalize);
  return (
    [b.name, b.operator, ...b.aliases].some((n) => names.includes(normalize(n))) ||
    Object.entries(a.identifiers).some(([k, v]) => v && b.identifiers[k] === v)
  );
}
export function mergeFacility(current: Facility, incoming: Facility): Facility {
  if (!sameSite(current, incoming))
    throw new Error(
      'Ambiguous site identity; review the operator, address, unit and identifiers before merging.',
    );
  const unique = new Map(
    current.evidence.map((e) => [`${e.fact}|${e.value}|${e.source_url}|${e.page_or_excerpt}`, e]),
  );
  const idMap = new Map<string, string>();
  for (const e of incoming.evidence) {
    const key = `${e.fact}|${e.value}|${e.source_url}|${e.page_or_excerpt}`;
    const old = unique.get(key);
    const id =
      old?.id ?? (current.evidence.some((c) => c.id === e.id) ? crypto.randomUUID() : e.id);
    idMap.set(e.id, id);
    if (!old) unique.set(key, { ...e, id });
  }
  const evidence = [...unique.values()].map((e) => ({
    ...e,
    conflict:
      e.conflict ||
      [...unique.values()].some(
        (other) => other.fact === e.fact && String(other.value) !== String(e.value),
      ),
  }));
  const assets = current.assets.map((a) => ({ ...a, evidence_ids: [...a.evidence_ids] }));
  for (const asset of incoming.assets) {
    const mapped = { ...asset, evidence_ids: asset.evidence_ids.map((id) => idMap.get(id) ?? id) };
    const old = assets.find((a) => a.id === mapped.id || a.description === mapped.description);
    if (old) old.evidence_ids = [...new Set([...old.evidence_ids, ...mapped.evidence_ids])];
    else assets.push(mapped);
  }
  const firstResearch = incoming.researched && !current.researched;
  return reconcileDecisions({
    ...current,
    ...(firstResearch
      ? {
          why: incoming.why,
          missing: incoming.missing,
          next_action: incoming.next_action,
          target_role: incoming.target_role,
        }
      : {}),
    researched: current.researched || incoming.researched,
    identifiers: { ...incoming.identifiers, ...current.identifiers },
    evidence,
    assets,
    updated_at: new Date().toISOString(),
  });
}
