import type { Prisma } from '@prisma/client';

import { getPrisma } from '../../lib/prisma';
import {
  buildAuthorizedVionaRequestReadWhere,
} from './vionaRequestReadAccessScope';
import {
  buildAuthorizedVionaRequestWhere,
} from './vionaRequestAccessScope';
import type {
  GetVionaRequestByIdInput,
  GetVionaRequestByIdResult,
  ListVionaRequestsInput,
  ListVionaRequestsResult,
} from './vionaRequestReadDto';
import { VIONA_REQUEST_READ_SAFETY } from './vionaRequestReadDto';
import { resolveVionaRequestReadPrincipalContext } from './vionaRequestReadPrincipalContext';
import {
  mapVionaRequestDetail,
  mapVionaRequestListItem,
  VIONA_REQUEST_DETAIL_SELECT,
  VIONA_REQUEST_LIST_SELECT,
} from './vionaRequestReadSerializer';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

async function buildAuthorizedReadWhere(
  authUserId: string,
  directReadPolicy: ListVionaRequestsInput['directReadPolicy'],
): Promise<Prisma.VionaRequestWhereInput> {
  if (directReadPolicy !== 'pack40a_provenance') {
    return buildAuthorizedVionaRequestWhere(authUserId);
  }
  const principal = await resolveVionaRequestReadPrincipalContext(authUserId);
  return buildAuthorizedVionaRequestReadWhere(principal);
}

function buildListWhere(
  input: ListVionaRequestsInput,
  authorizedWhere: Prisma.VionaRequestWhereInput,
): Prisma.VionaRequestWhereInput {
  const where: Prisma.VionaRequestWhereInput = { ...authorizedWhere };

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
  const authorizedWhere = await buildAuthorizedReadWhere(authUserId, input.directReadPolicy);

  const rows = await getPrisma().vionaRequest.findMany({
    where: buildListWhere({ ...input, authUserId }, authorizedWhere),
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

  const authorizedWhere = await buildAuthorizedReadWhere(authUserId, input.directReadPolicy);

  const row = await getPrisma().vionaRequest.findFirst({
    where: {
      id: requestId,
      ...authorizedWhere,
    },
    select: VIONA_REQUEST_DETAIL_SELECT,
  });

  if (row == null) {
    return { ok: false, reason: 'request_not_found' };
  }

  return { ok: true, data: mapVionaRequestDetail(row) };
}
