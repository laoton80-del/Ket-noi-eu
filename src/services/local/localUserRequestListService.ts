import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  type BizType,
  type LocalServiceType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';

export const LOCAL_USER_REQUEST_LIST_SAFETY = {
  readOnly: true,
  requestOnlyNoCharge: true,
  noPaymentCaptured: true,
} as const;

export type LocalUserRequestListItemDisplayDto = Readonly<{
  noPaymentCaptured: true;
  requestOnlyNoCharge: boolean;
}>;

export type LocalUserRequestListItemDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  serviceType: LocalServiceType;
  category: BizType | null;
  title: string;
  description: string;
  businessId: string;
  serviceId: string | null;
  locationText: string | null;
  city: string | null;
  countryCode: string | null;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  statusLabel: string;
  display: LocalUserRequestListItemDisplayDto;
  business: Readonly<{
    id: string;
    name: string;
    category: BizType;
  }>;
}>;

export type ListUserLocalServiceRequestsInput = Readonly<{
  requesterUserId: string;
  status?: LocalServiceRequestStatus;
  limit?: number;
  skip?: number;
}>;

export type ListUserLocalServiceRequestsResult = Readonly<{
  requests: readonly LocalUserRequestListItemDto[];
  safety: typeof LOCAL_USER_REQUEST_LIST_SAFETY;
}>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toIso(d: Date): string {
  return d.toISOString();
}

/** Safe requester-facing status label (no payment/settlement implication). */
export function mapLocalUserRequestStatusLabel(status: LocalServiceRequestStatus): string {
  switch (status) {
    case LocalServiceRequestStatus.REQUESTED:
      return 'Request submitted';
    case LocalServiceRequestStatus.MERCHANT_REVIEW:
      return 'Waiting for merchant review';
    case LocalServiceRequestStatus.CONFIRMED:
      return 'Confirmed';
    case LocalServiceRequestStatus.IN_PROGRESS:
      return 'In progress';
    case LocalServiceRequestStatus.COMPLETED:
      return 'Completed';
    case LocalServiceRequestStatus.REJECTED:
      return 'Rejected';
    case LocalServiceRequestStatus.USER_CANCELLED:
      return 'Cancelled';
    case LocalServiceRequestStatus.OPS_CANCELLED:
      return 'Cancelled by support';
    case LocalServiceRequestStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Request updated';
  }
}

function mapDisplayFlags(
  walletMode: LocalWalletMode,
  walletPhase: LocalWalletPhase
): LocalUserRequestListItemDisplayDto {
  return {
    noPaymentCaptured: true,
    requestOnlyNoCharge: walletMode === LocalWalletMode.REQUEST_ONLY_NO_CHARGE && walletPhase === LocalWalletPhase.NONE,
  };
}

/**
 * Read-only list of LocalServiceRequest rows owned by `requesterUserId`.
 * Does not expose wallet balances, ledger rows, audit events, or other users' requests.
 */
export async function listUserLocalServiceRequests(
  input: ListUserLocalServiceRequestsInput
): Promise<ListUserLocalServiceRequestsResult> {
  const requesterUserId = input.requesterUserId.trim();
  if (requesterUserId.length === 0) {
    return { requests: [], safety: LOCAL_USER_REQUEST_LIST_SAFETY };
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
  const skip = Math.max(0, input.skip ?? 0);

  const rows = await getPrisma().localServiceRequest.findMany({
    where: {
      requesterUserId,
      ...(input.status != null ? { status: input.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: {
      id: true,
      status: true,
      serviceType: true,
      category: true,
      title: true,
      description: true,
      businessId: true,
      serviceId: true,
      locationText: true,
      city: true,
      countryCode: true,
      walletMode: true,
      walletPhase: true,
      requestedAt: true,
      createdAt: true,
      updatedAt: true,
      business: {
        select: {
          id: true,
          name: true,
          category: true,
        },
      },
    },
  });

  const requests = rows.map(
    (row): LocalUserRequestListItemDto => ({
      id: row.id,
      status: row.status,
      serviceType: row.serviceType,
      category: row.category,
      title: row.title,
      description: row.description,
      businessId: row.businessId,
      serviceId: row.serviceId,
      locationText: row.locationText,
      city: row.city,
      countryCode: row.countryCode,
      walletMode: row.walletMode,
      walletPhase: row.walletPhase,
      requestedAt: toIso(row.requestedAt),
      createdAt: toIso(row.createdAt),
      updatedAt: toIso(row.updatedAt),
      statusLabel: mapLocalUserRequestStatusLabel(row.status),
      display: mapDisplayFlags(row.walletMode, row.walletPhase),
      business: {
        id: row.business.id,
        name: row.business.name,
        category: row.business.category,
      },
    })
  );

  return { requests, safety: LOCAL_USER_REQUEST_LIST_SAFETY };
}
