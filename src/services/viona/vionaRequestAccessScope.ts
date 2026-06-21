import type { Prisma } from '@prisma/client';

/**
 * Requester-owned read/write scope: caller may access requests they created, own, or participate in.
 * Does not expose admin/global ops access (separate future pack).
 */
export function buildAuthorizedVionaRequestWhere(
  authUserId: string
): Prisma.VionaRequestWhereInput {
  return {
    OR: [
      { requesterUserId: authUserId },
      { ownerUserId: authUserId },
      { participants: { some: { userRef: authUserId } } },
    ],
  };
}
