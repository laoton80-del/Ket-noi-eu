/**
 * Client-safe Local create business option model + Pack B provider-source states.
 * No network / Travel discover / Prisma imports (safe for Node behavioral tests).
 */
import type { LocalServiceTypeClient } from '../../domain/local/localServiceRequestClientContract';

export type LocalCreateBusinessOption = Readonly<{
  businessId: string;
  displayName: string;
  supportedServiceTypes: readonly LocalServiceTypeClient[];
  /** Optional subtitle only — never eligibility status. */
  categoryLabel?: string;
}>;

/**
 * Pack B provider-authority UX states — distinct from create-result UI states.
 */
export type LocalCreateProviderSourceStatus =
  | 'PROVIDER_IDLE'
  | 'PROVIDER_LOADING'
  | 'PROVIDER_READY'
  | 'PROVIDER_EMPTY'
  | 'PROVIDER_AUTH_REQUIRED_OR_EXPIRED'
  | 'PROVIDER_NETWORK_ERROR'
  | 'PROVIDER_SERVER_ERROR';

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

/** True when selection exists in current options and supports the wire service type. */
export function isLocalProviderSelectionCompatible(
  businessId: string,
  serviceType: LocalServiceTypeClient | null,
  options: readonly LocalCreateBusinessOption[]
): boolean {
  if (!serviceType) return false;
  const option = findLocalCreateBusinessOption(businessId, options);
  if (!option) return false;
  return option.supportedServiceTypes.includes(serviceType);
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
    const types = Array.isArray(row.supportedServiceTypes)
      ? [...row.supportedServiceTypes]
      : [];
    out.push({
      businessId,
      displayName,
      supportedServiceTypes: types,
      ...(row.categoryLabel?.trim()
        ? { categoryLabel: row.categoryLabel.trim() }
        : {}),
    });
  }
  return out;
}

export function mapProviderOptionsToCreateOptions(
  rows: readonly Readonly<{
    businessId: string;
    displayName: string;
    supportedServiceTypes: readonly LocalServiceTypeClient[];
  }>[]
): readonly LocalCreateBusinessOption[] {
  return sanitizeLocalCreateBusinessOptions(
    rows.map((row) => ({
      businessId: row.businessId,
      displayName: row.displayName,
      supportedServiceTypes: row.supportedServiceTypes,
    }))
  );
}
