/**
 * Pack A2 — B2C selectable Local provider list (read-only; no eligibility mutation).
 */
import type { LocalServiceType } from '@prisma/client';

import { createPrismaLocalProviderAuthorityDeps } from './localProviderEligibilityAuthorityPrisma';
import type { LocalProviderAuthorityDeps } from './localProviderEligibilityAuthorityTypes';
import { isLocalProviderSelectable } from './localProviderEligibilityDomain';
import {
  LOCAL_PROVIDER_LIST_DEFAULT_LIMIT,
  LOCAL_PROVIDER_LIST_MAX_LIMIT,
} from './localProviderEligibilityValidation';

export type LocalProviderPublicDto = Readonly<{
  businessId: string;
  displayName: string;
  supportedServiceTypes: LocalServiceType[];
}>;

export type ListSelectableLocalProvidersInput = Readonly<{
  limit?: number;
  skip?: number;
  serviceType?: LocalServiceType;
}>;

export type ListSelectableLocalProvidersResult = Readonly<{
  items: LocalProviderPublicDto[];
  pagination: Readonly<{ limit: number; skip: number; returned: number }>;
}>;

function resolveDeps(deps?: LocalProviderAuthorityDeps): LocalProviderAuthorityDeps {
  return deps ?? createPrismaLocalProviderAuthorityDeps();
}

/**
 * Returns only ACTIVE public providers with non-empty types and valid Business name.
 * Stable order: Business.name ASC, businessId ASC (store candidate order preserved).
 */
export async function listSelectableLocalProviders(
  input: ListSelectableLocalProvidersInput = {},
  deps?: LocalProviderAuthorityDeps
): Promise<ListSelectableLocalProvidersResult> {
  const d = resolveDeps(deps);
  const limit = Math.min(
    Math.max(input.limit ?? LOCAL_PROVIDER_LIST_DEFAULT_LIMIT, 1),
    LOCAL_PROVIDER_LIST_MAX_LIMIT
  );
  const skip = Math.max(input.skip ?? 0, 0);
  const serviceType = input.serviceType;

  const rows = await d.listEligibilityCandidates({
    ...(serviceType ? { serviceType } : {}),
  });

  const items: LocalProviderPublicDto[] = [];
  for (const row of rows) {
    if (
      !isLocalProviderSelectable({
        business: { id: row.business.id, name: row.business.name },
        eligibility: {
          status: row.status,
          publicB2cVisible: row.publicB2cVisible,
          supportedServiceTypes: row.supportedServiceTypes,
        },
      })
    ) {
      continue;
    }
    if (serviceType && !row.supportedServiceTypes.includes(serviceType)) {
      continue;
    }
    items.push({
      businessId: row.businessId,
      displayName: row.business.name.trim(),
      supportedServiceTypes: [...row.supportedServiceTypes],
    });
  }

  const page = items.slice(skip, skip + limit);
  return {
    items: page,
    pagination: { limit, skip, returned: page.length },
  };
}
