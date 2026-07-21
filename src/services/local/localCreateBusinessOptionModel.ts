/**
 * Client-safe Local create business option model + pure helpers.
 * No network / Travel discover / Prisma imports (safe for Node behavioral tests).
 */
export type LocalCreateBusinessOption = Readonly<{
  businessId: string;
  displayName: string;
  categoryLabel?: string;
}>;

/**
 * Provider-source UX states — distinct from create-result UI states.
 * Path 2 (no Local eligibility authority): PROVIDER_SELECTION_UNAVAILABLE.
 */
export type LocalCreateProviderSourceStatus =
  | 'PROVIDERS_LOADING'
  | 'PROVIDERS_READY'
  | 'PROVIDERS_EMPTY'
  | 'PROVIDERS_LOAD_ERROR'
  | 'PROVIDER_SELECTION_UNAVAILABLE';

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

/** Deduplicate by businessId; keep first occurrence; drop empty id/name. */
export function sanitizeLocalCreateBusinessOptions(
  rows: readonly LocalCreateBusinessOption[]
): readonly LocalCreateBusinessOption[] {
  const seen = new Set<string>();
  const out: LocalCreateBusinessOption[] = [];
  for (const row of rows) {
    const businessId = row.businessId.trim();
    const displayName = row.displayName.trim();
    if (!businessId || !displayName) continue;
    if (seen.has(businessId)) continue;
    seen.add(businessId);
    out.push({
      businessId,
      displayName,
      ...(row.categoryLabel?.trim()
        ? { categoryLabel: row.categoryLabel.trim() }
        : {}),
    });
  }
  return out;
}
