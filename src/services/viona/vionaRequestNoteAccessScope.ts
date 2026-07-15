import type { Prisma } from '@prisma/client';
import { VionaRequestScopeKind } from '@prisma/client';

import { buildAuthorizedVionaRequestWhere } from './vionaRequestAccessScope';
import type { VionaRequestNotePrincipalContext } from './vionaRequestNotePrincipalContext';

/**
 * Pack40B — provenance-aware note mutation scope layered on existing user/participation predicate.
 * Excludes `legacyUnresolved` and malformed provenance. Merchant branch requires an active profile.
 * Never uses client tenant input, registry scans, or tenant-pattern inference.
 */
export function buildAuthorizedVionaRequestNoteWhere(
  principal: VionaRequestNotePrincipalContext,
): Prisma.VionaRequestWhereInput {
  const userScope = buildAuthorizedVionaRequestWhere(principal.authUserId);

  const provenanceBranches: Prisma.VionaRequestWhereInput[] = [
    {
      scopeKind: VionaRequestScopeKind.consumer,
      merchantProfileId: null,
    },
  ];

  if (
    principal.merchantProfileResolution === 'single' &&
    principal.merchantProfile != null &&
    principal.merchantProfile.isActive
  ) {
    provenanceBranches.push({
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: principal.merchantProfile.id,
      tenantId: principal.merchantProfile.tenantId,
    });
  }

  return {
    AND: [userScope, { OR: provenanceBranches }],
  };
}
