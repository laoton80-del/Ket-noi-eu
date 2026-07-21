/**
 * Client-safe Local create business option model + pure mappers.
 * No network / apiClient imports (safe for Node behavioral tests).
 */
import type { TourismDiscoverPayload } from '../viGlobalTourismApi';

export type LocalCreateBusinessOption = Readonly<{
  businessId: string;
  displayName: string;
  categoryLabel: string;
}>;

type TourismDiscoverRow = TourismDiscoverPayload['localFixers'][number];

function mapBucket(
  rows: readonly TourismDiscoverRow[],
  categoryLabel: string
): LocalCreateBusinessOption[] {
  return rows
    .filter((row) => typeof row.id === 'string' && row.id.trim().length > 0)
    .filter((row) => typeof row.name === 'string' && row.name.trim().length > 0)
    .map((row) => ({
      businessId: row.id.trim(),
      displayName: row.name.trim(),
      categoryLabel,
    }));
}

/** Deterministic flatten: localFixers first, then gastronomy, stays, tours — dedupe by businessId. */
export function mapTourismDiscoverToLocalCreateOptions(
  payload: TourismDiscoverPayload
): readonly LocalCreateBusinessOption[] {
  const ordered: LocalCreateBusinessOption[] = [
    ...mapBucket(payload.localFixers, 'LOCAL_EXPERIENCE'),
    ...mapBucket(payload.gastronomy, 'RESTAURANT'),
    ...mapBucket(payload.stays, 'STAY'),
    ...mapBucket(payload.tours, 'TOUR'),
  ];
  const seen = new Set<string>();
  const out: LocalCreateBusinessOption[] = [];
  for (const row of ordered) {
    if (seen.has(row.businessId)) continue;
    seen.add(row.businessId);
    out.push(row);
  }
  return out;
}

export function mergeHistoryBusinessHints(
  sourceOptions: readonly LocalCreateBusinessOption[],
  history: readonly Readonly<{ id: string; name: string }>[]
): readonly LocalCreateBusinessOption[] {
  const byId = new Map(sourceOptions.map((o) => [o.businessId, o]));
  for (const h of history) {
    const id = h.id.trim();
    const name = h.name.trim();
    if (!id || !name) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        businessId: id,
        displayName: name,
        categoryLabel: 'RECENT',
      });
    }
  }
  const out: LocalCreateBusinessOption[] = [...sourceOptions];
  const sourceIds = new Set(sourceOptions.map((o) => o.businessId));
  for (const h of history) {
    const id = h.id.trim();
    if (!id || sourceIds.has(id)) continue;
    const opt = byId.get(id);
    if (opt) out.push(opt);
  }
  return out;
}

export function isLocalCreateBusinessSelected(
  businessId: string,
  options: readonly LocalCreateBusinessOption[]
): boolean {
  const id = businessId.trim();
  if (!id) return false;
  return options.some((o) => o.businessId === id);
}

export function findLocalCreateBusinessOption(
  businessId: string,
  options: readonly LocalCreateBusinessOption[]
): LocalCreateBusinessOption | null {
  const id = businessId.trim();
  return options.find((o) => o.businessId === id) ?? null;
}
