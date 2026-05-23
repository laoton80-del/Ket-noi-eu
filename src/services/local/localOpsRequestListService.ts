import {
  LocalServiceRequestStatus,
  LocalWalletMode,
  LocalWalletPhase,
  Role,
  type BizType,
  type LocalServiceType,
} from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import { mapLocalUserRequestStatusLabel } from './localUserRequestListService';

export const LOCAL_OPS_REQUEST_LIST_SAFETY = {
  readOnly: true,
  requestOnlyNoCharge: true,
  noPaymentCaptured: true,
  confirmedDoesNotMeanPaid: true,
} as const;

export type LocalOpsRequestDisplayDto = Readonly<{
  noPaymentCaptured: true;
  requestOnlyNoCharge: boolean;
}>;

export type LocalOpsRequestActorLabelDto = Readonly<{
  userId: string;
  role: Role;
  roleLabel: string;
}>;

export type LocalOpsMerchantDecision = 'pending_review' | 'confirmed' | 'declined' | 'none';

export type LocalOpsRequestListItemDto = Readonly<{
  id: string;
  status: LocalServiceRequestStatus;
  statusLabel: string;
  serviceType: LocalServiceType;
  title: string;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  rejectedAt: string | null;
  merchantDecision: LocalOpsMerchantDecision;
  display: LocalOpsRequestDisplayDto;
  requester: LocalOpsRequestActorLabelDto;
  business: Readonly<{
    id: string;
    name: string;
    category: BizType;
    owner: LocalOpsRequestActorLabelDto;
  }>;
  tenantIsolation: Readonly<{
    requesterUserId: string;
    businessOwnerUserId: string;
    requesterIsBusinessOwner: boolean;
  }>;
}>;

export type ListOpsLocalServiceRequestsInput = Readonly<{
  adminUserId: string;
  status?: LocalServiceRequestStatus;
  businessId?: string;
  limit?: number;
  skip?: number;
}>;

export type ListOpsLocalServiceRequestsFailure = 'invalid_input' | 'forbidden';

export type ListOpsLocalServiceRequestsResult =
  | Readonly<{
      ok: true;
      data: Readonly<{
        requests: readonly LocalOpsRequestListItemDto[];
        pagination: Readonly<{ limit: number; skip: number; returned: number }>;
        safety: typeof LOCAL_OPS_REQUEST_LIST_SAFETY;
      }>;
    }>
  | Readonly<{ ok: false; reason: ListOpsLocalServiceRequestsFailure }>;

export type GetOpsLocalServiceRequestInput = Readonly<{
  adminUserId: string;
  requestId: string;
}>;

export type GetOpsLocalServiceRequestFailure =
  | 'invalid_input'
  | 'forbidden'
  | 'request_not_found';

export type GetOpsLocalServiceRequestResult =
  | Readonly<{ ok: true; data: LocalOpsRequestListItemDto }>
  | Readonly<{ ok: false; reason: GetOpsLocalServiceRequestFailure }>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toIso(d: Date): string {
  return d.toISOString();
}

function mapRoleLabel(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return 'ADMIN';
    case Role.B2C:
      return 'B2C';
    case Role.B2B_VN:
      return 'B2B_VN';
    case Role.B2B_EU:
      return 'B2B_EU';
    case Role.BROKER:
      return 'BROKER';
    default:
      return role;
  }
}

function mapDisplayFlags(
  walletMode: LocalWalletMode,
  walletPhase: LocalWalletPhase
): LocalOpsRequestDisplayDto {
  return {
    noPaymentCaptured: true,
    requestOnlyNoCharge:
      walletMode === LocalWalletMode.REQUEST_ONLY_NO_CHARGE &&
      walletPhase === LocalWalletPhase.NONE,
  };
}

function mapMerchantDecision(
  status: LocalServiceRequestStatus,
  confirmedAt: Date | null,
  rejectedAt: Date | null
): LocalOpsMerchantDecision {
  if (rejectedAt != null || status === LocalServiceRequestStatus.REJECTED) {
    return 'declined';
  }
  if (confirmedAt != null || status === LocalServiceRequestStatus.CONFIRMED) {
    return 'confirmed';
  }
  if (
    status === LocalServiceRequestStatus.MERCHANT_REVIEW ||
    status === LocalServiceRequestStatus.REQUESTED
  ) {
    return 'pending_review';
  }
  return 'none';
}

async function assertAdminUser(adminUserId: string): Promise<ListOpsLocalServiceRequestsFailure | null> {
  const trimmed = adminUserId.trim();
  if (trimmed.length === 0) {
    return 'invalid_input';
  }

  const admin = await getPrisma().user.findUnique({
    where: { id: trimmed },
    select: { role: true },
  });

  if (!admin || admin.role !== Role.ADMIN) {
    return 'forbidden';
  }

  return null;
}

function mapRowToListItem(row: {
  id: string;
  status: LocalServiceRequestStatus;
  serviceType: LocalServiceType;
  title: string;
  walletMode: LocalWalletMode;
  walletPhase: LocalWalletPhase;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  rejectedAt: Date | null;
  requesterUserId: string;
  requester: { id: string; role: Role };
  business: {
    id: string;
    name: string;
    category: BizType;
    ownerId: string;
    owner: { id: string; role: Role };
  };
}): LocalOpsRequestListItemDto {
  const requesterActor: LocalOpsRequestActorLabelDto = {
    userId: row.requester.id,
    role: row.requester.role,
    roleLabel: mapRoleLabel(row.requester.role),
  };

  const ownerActor: LocalOpsRequestActorLabelDto = {
    userId: row.business.owner.id,
    role: row.business.owner.role,
    roleLabel: mapRoleLabel(row.business.owner.role),
  };

  return {
    id: row.id,
    status: row.status,
    statusLabel: mapLocalUserRequestStatusLabel(row.status),
    serviceType: row.serviceType,
    title: row.title,
    walletMode: row.walletMode,
    walletPhase: row.walletPhase,
    requestedAt: toIso(row.requestedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    confirmedAt: row.confirmedAt != null ? toIso(row.confirmedAt) : null,
    rejectedAt: row.rejectedAt != null ? toIso(row.rejectedAt) : null,
    merchantDecision: mapMerchantDecision(row.status, row.confirmedAt, row.rejectedAt),
    display: mapDisplayFlags(row.walletMode, row.walletPhase),
    requester: requesterActor,
    business: {
      id: row.business.id,
      name: row.business.name,
      category: row.business.category,
      owner: ownerActor,
    },
    tenantIsolation: {
      requesterUserId: row.requesterUserId,
      businessOwnerUserId: row.business.ownerId,
      requesterIsBusinessOwner: row.requesterUserId === row.business.ownerId,
    },
  };
}

const listSelect = {
  id: true,
  status: true,
  serviceType: true,
  title: true,
  walletMode: true,
  walletPhase: true,
  requestedAt: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
  rejectedAt: true,
  requesterUserId: true,
  requester: { select: { id: true, role: true } },
  business: {
    select: {
      id: true,
      name: true,
      category: true,
      ownerId: true,
      owner: { select: { id: true, role: true } },
    },
  },
} as const;

/**
 * Ops read-only paginated list of LocalServiceRequest rows (super-admin only).
 * Does not expose phone, email, PIN, wallet balances, ledger, or payment rails.
 */
export async function listOpsLocalServiceRequests(
  input: ListOpsLocalServiceRequestsInput
): Promise<ListOpsLocalServiceRequestsResult> {
  const adminGate = await assertAdminUser(input.adminUserId);
  if (adminGate === 'invalid_input') {
    return { ok: false, reason: 'invalid_input' };
  }
  if (adminGate === 'forbidden') {
    return { ok: false, reason: 'forbidden' };
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
  const skip = Math.max(0, input.skip ?? 0);
  const businessId =
    input.businessId != null && input.businessId.trim().length > 0
      ? input.businessId.trim()
      : undefined;

  const rows = await getPrisma().localServiceRequest.findMany({
    where: {
      ...(input.status != null ? { status: input.status } : {}),
      ...(businessId != null ? { businessId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: listSelect,
  });

  const requests = rows.map(mapRowToListItem);

  return {
    ok: true,
    data: {
      requests,
      pagination: { limit, skip, returned: requests.length },
      safety: LOCAL_OPS_REQUEST_LIST_SAFETY,
    },
  };
}

/**
 * Ops read-only detail for one LocalServiceRequest (super-admin only).
 */
export async function getOpsLocalServiceRequestById(
  input: GetOpsLocalServiceRequestInput
): Promise<GetOpsLocalServiceRequestResult> {
  const adminGate = await assertAdminUser(input.adminUserId);
  if (adminGate === 'invalid_input') {
    return { ok: false, reason: 'invalid_input' };
  }
  if (adminGate === 'forbidden') {
    return { ok: false, reason: 'forbidden' };
  }

  const requestId = input.requestId.trim();
  if (requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const row = await getPrisma().localServiceRequest.findUnique({
    where: { id: requestId },
    select: listSelect,
  });

  if (!row) {
    return { ok: false, reason: 'request_not_found' };
  }

  return { ok: true, data: mapRowToListItem(row) };
}
