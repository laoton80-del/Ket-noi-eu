import type { Prisma } from '@prisma/client';
import { VionaRequestScopeKind } from '@prisma/client';

import { buildAuthorizedVionaRequestWhere } from './vionaRequestAccessScope';
import type { VionaRequestReadPrincipalContext } from './vionaRequestReadPrincipalContext';

/**
 * Pack40A — provenance-aware read scope layered on top of the existing user/participation predicate.
 * Excludes `legacyUnresolved` rows and malformed provenance combinations. Never uses client tenant
 * input, registry scans, or tenant-pattern inference.
 */
export function buildAuthorizedVionaRequestReadWhere(
  principal: VionaRequestReadPrincipalContext,
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
    principal.merchantProfile != null
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
