import type { BizType, LocalServiceRequestStatus, LocalWalletMode, LocalWalletPhase } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

export type LocalMerchantRequestInboxItemDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  businessId: string;
  serviceId: string | null;
  title: string;
  description: string;
  category: BizType | null;
  locationText: string | null;
  city: string | null;
  countryCode: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  createdAt: string;
  updatedAt: string;
  requester: Readonly<{
    userId: string;
    displayName: string | null;
  }>;
}>;

export type ListMerchantLocalServiceRequestsInput = Readonly<{
  merchantUserId: string;
  businessId?: string;
  status?: LocalServiceRequestStatus;
  limit?: number;
  skip?: number;
}>;

export type ListMerchantLocalServiceRequestsResult = Readonly<{
  requests: readonly LocalMerchantRequestInboxItemDto[];
}>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toIso(d: Date): string {
  return d.toISOString();
}

/**
 * Read-only merchant inbox for LocalServiceRequest rows on businesses owned by `merchantUserId`.
 * Does not expose wallet balances, ledger rows, or requester contact PII.
 */
export async function listMerchantLocalServiceRequests(
  input: ListMerchantLocalServiceRequestsInput
): Promise<ListMerchantLocalServiceRequestsResult> {
  const merchantUserId = input.merchantUserId.trim();
  if (merchantUserId.length === 0) {
    return { requests: [] };
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
  const skip = Math.max(0, input.skip ?? 0);

  const businesses = await getPrisma().business.findMany({
    where: { ownerId: merchantUserId },
    select: { id: true },
  });

  if (businesses.length === 0) {
    return { requests: [] };
  }

  const ownedBusinessIds = businesses.map((b) => b.id);
  const businessIdFilter = input.businessId?.trim();

  let businessIds = ownedBusinessIds;
  if (businessIdFilter && businessIdFilter.length > 0) {
    if (!ownedBusinessIds.includes(businessIdFilter)) {
      return { requests: [] };
    }
    businessIds = [businessIdFilter];
  }

  const rows = await getPrisma().localServiceRequest.findMany({
    where: {
      businessId: { in: businessIds },
      ...(input.status != null ? { status: input.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: {
      id: true,
      status: true,
      businessId: true,
      serviceId: true,
      title: true,
      description: true,
      category: true,
      locationText: true,
      city: true,
      countryCode: true,
      walletMode: true,
      walletPhase: true,
      createdAt: true,
      updatedAt: true,
      requester: {
        select: {
          id: true,
          profile: { select: { fullName: true } },
        },
      },
    },
  });

  const requests = rows.map(
    (row): LocalMerchantRequestInboxItemDto => ({
      id: row.id,
      status: row.status,
      businessId: row.businessId,
      serviceId: row.serviceId,
      title: row.title,
      description: row.description,
      category: row.category,
      locationText: row.locationText,
      city: row.city,
      countryCode: row.countryCode,
      walletMode: row.walletMode,
      walletPhase: row.walletPhase,
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
      requester: {
        userId: row.requester.id,
        displayName: row.requester.profile?.fullName ?? null,
      },
    })
  );

  return { requests };
}
