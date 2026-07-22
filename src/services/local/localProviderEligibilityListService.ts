/**
 * Pack A2 — B2C selectable Local provider list (read-only; no eligibility mutation).
 */
import {
  LocalProviderEligibilityStatus,
  type LocalServiceType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
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

/**
 * Returns only ACTIVE public providers with non-empty types and valid Business name.
 * Stable order: Business.name ASC, businessId ASC.
 */
export async function listSelectableLocalProviders(
  input: ListSelectableLocalProvidersInput = {}
): Promise<ListSelectableLocalProvidersResult> {
  const limit = Math.min(
    Math.max(input.limit ?? LOCAL_PROVIDER_LIST_DEFAULT_LIMIT, 1),
    LOCAL_PROVIDER_LIST_MAX_LIMIT
  );
  const skip = Math.max(input.skip ?? 0, 0);
  const serviceType = input.serviceType;

  const prisma = getPrisma();

  const rows = await prisma.localProviderEligibility.findMany({
    where: {
      status: LocalProviderEligibilityStatus.ACTIVE,
      publicB2cVisible: true,
      ...(serviceType
        ? { supportedServiceTypes: { has: serviceType } }
        : { supportedServiceTypes: { isEmpty: false } }),
    },
    include: {
      business: { select: { id: true, name: true } },
    },
    orderBy: [{ business: { name: 'asc' } }, { businessId: 'asc' }],
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
