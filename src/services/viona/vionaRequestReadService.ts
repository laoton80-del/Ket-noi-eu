import type { Prisma } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import type {
  GetVionaRequestByIdInput,
  GetVionaRequestByIdResult,
  ListVionaRequestsInput,
  ListVionaRequestsResult,
} from './vionaRequestReadDto';
import { VIONA_REQUEST_READ_SAFETY } from './vionaRequestReadDto';
import {
  mapVionaRequestDetail,
  mapVionaRequestListItem,
  VIONA_REQUEST_DETAIL_SELECT,
  VIONA_REQUEST_LIST_SELECT,
} from './vionaRequestReadSerializer';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Requester-owned read scope: caller may read requests they created, own, or participate in.
 * Does not expose admin/global ops reads (separate future pack).
 */
function buildAuthorizedReadWhere(authUserId: string): Prisma.VionaRequestWhereInput {
  return {
    OR: [
      { requesterUserId: authUserId },
      { ownerUserId: authUserId },
      { participants: { some: { userRef: authUserId } } },
    ],
  };
}

function buildListWhere(input: ListVionaRequestsInput): Prisma.VionaRequestWhereInput {
  const where: Prisma.VionaRequestWhereInput = buildAuthorizedReadWhere(input.authUserId);

  if (input.status != null) {
    where.status = input.status;
  }

  if (input.universe != null) {
    where.sourceUniverse = input.universe;
  }

  if (input.createdFrom != null || input.createdTo != null) {
    where.createdAt = {
      ...(input.createdFrom != null ? { gte: input.createdFrom } : {}),
      ...(input.createdTo != null ? { lte: input.createdTo } : {}),
    };
  }

  return where;
}

/**
 * Read-only list of VionaRequest rows visible to the authenticated user.
 * No writes, no payment/booking/SOS/wallet side effects.
 */
export async function listVionaRequests(
  input: ListVionaRequestsInput
): Promise<ListVionaRequestsResult> {
  const authUserId = input.authUserId.trim();
  if (authUserId.length === 0) {
    return {
      requests: [],
      pagination: { limit: DEFAULT_LIMIT, skip: 0, returned: 0 },
      safety: VIONA_REQUEST_READ_SAFETY,
    };
  }

  const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
  const skip = Math.max(0, input.skip ?? 0);

  const rows = await getPrisma().vionaRequest.findMany({
    where: buildListWhere({ ...input, authUserId }),
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    select: VIONA_REQUEST_LIST_SELECT,
  });

  const requests = rows.map(mapVionaRequestListItem);

  return {
    requests,
    pagination: { limit, skip, returned: requests.length },
    safety: VIONA_REQUEST_READ_SAFETY,
  };
}

/**
 * Read-only detail for one VionaRequest including safe related child projections.
 */
export async function getVionaRequestById(
  input: GetVionaRequestByIdInput
): Promise<GetVionaRequestByIdResult> {
  const authUserId = input.authUserId.trim();
  const requestId = input.requestId.trim();

  if (authUserId.length === 0 || requestId.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const row = await getPrisma().vionaRequest.findFirst({
    where: {
      id: requestId,
      ...buildAuthorizedReadWhere(authUserId),
    },
    select: VIONA_REQUEST_DETAIL_SELECT,
  });

  if (row == null) {
    return { ok: false, reason: 'request_not_found' };
  }

  return { ok: true, data: mapVionaRequestDetail(row) };
}
