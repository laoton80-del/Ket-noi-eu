/**
 * Pack B — client-safe Local provider list DTO (mirrors public server fields only).
 * No Prisma / eligibility status / audit / lifecycle fields.
 */
import {
  isLocalServiceTypeClient,
  type LocalServiceTypeClient,
} from '../../domain/local/localServiceRequestClientContract';

export type LocalProviderOption = Readonly<{
  businessId: string;
  displayName: string;
  supportedServiceTypes: readonly LocalServiceTypeClient[];
}>;

export type LocalProviderListPagination = Readonly<{
  limit: number;
  skip: number;
  returned: number;
}>;

export type LocalProviderListData = Readonly<{
  items: readonly LocalProviderOption[];
  pagination: LocalProviderListPagination;
}>;

export const LOCAL_PROVIDER_LIST_CLIENT_LIMIT = 100;
export const LOCAL_PROVIDER_LIST_CLIENT_SKIP = 0;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSupportedTypes(raw: unknown): LocalServiceTypeClient[] | null {
  if (!Array.isArray(raw)) return null;
  const out: LocalServiceTypeClient[] = [];
  for (const item of raw) {
    if (!isLocalServiceTypeClient(item)) return null;
    out.push(item);
  }
  return out;
}

/**
 * Maps one public DTO item → client option. Rejects blank names and invalid types.
 * Retains only allowed fields.
 */
export function mapLocalProviderPublicItem(raw: unknown): LocalProviderOption | null {
  if (!isPlainObject(raw)) return null;
  const businessId = typeof raw.businessId === 'string' ? raw.businessId.trim() : '';
  const displayName = typeof raw.displayName === 'string' ? raw.displayName.trim() : '';
  const supportedServiceTypes = parseSupportedTypes(raw.supportedServiceTypes);
  if (!businessId || !displayName || supportedServiceTypes == null) return null;
  return { businessId, displayName, supportedServiceTypes };
}

/**
 * Validates the GET /api/local/providers success envelope.
 * Malformed → null (caller maps to PROVIDER_SERVER_ERROR).
 */
export function parseLocalProviderListData(raw: unknown): LocalProviderListData | null {
  if (!isPlainObject(raw)) return null;
  if (!Array.isArray(raw.items)) return null;
  if (!isPlainObject(raw.pagination)) return null;

  const limit = raw.pagination.limit;
  const skip = raw.pagination.skip;
  const returned = raw.pagination.returned;
  if (
    typeof limit !== 'number' ||
    !Number.isInteger(limit) ||
    typeof skip !== 'number' ||
    !Number.isInteger(skip) ||
    typeof returned !== 'number' ||
    !Number.isInteger(returned)
  ) {
    return null;
  }

  const items: LocalProviderOption[] = [];
  for (const row of raw.items) {
    const mapped = mapLocalProviderPublicItem(row);
    if (!mapped) return null;
    items.push(mapped);
  }

  if (returned !== items.length) return null;

  return {
    items,
    pagination: { limit, skip, returned },
  };
}

export function buildLocalProvidersQueryPath(input: {
  serviceType: LocalServiceTypeClient;
  limit?: number;
  skip?: number;
}): string {
  const limit = Math.min(
    Math.max(input.limit ?? LOCAL_PROVIDER_LIST_CLIENT_LIMIT, 1),
    LOCAL_PROVIDER_LIST_CLIENT_LIMIT
  );
  const skip = Math.max(input.skip ?? LOCAL_PROVIDER_LIST_CLIENT_SKIP, 0);
  const params = new URLSearchParams({
    serviceType: input.serviceType,
    limit: String(limit),
    skip: String(skip),
  });
  return `/api/local/providers?${params.toString()}`;
}
