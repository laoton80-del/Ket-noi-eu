import type { Prisma } from '@prisma/client';
import { VionaRequestScopeKind } from '@prisma/client';

import type { VionaRequestStatusPrincipalContext } from './vionaRequestStatusPrincipalContext';

/**
 * Pack40C — provenance-aware direct status mutation scope with owner-only DB predicate.
 * Excludes `legacyUnresolved` and malformed provenance. Merchant branch requires an active profile.
 * Never uses requester/participant OR scope, client tenant input, or registry scans.
 */
export function buildAuthorizedVionaRequestStatusWhere(
  principal: VionaRequestStatusPrincipalContext,
): Prisma.VionaRequestWhereInput {
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
    ownerUserId: principal.authUserId,
    OR: provenanceBranches,
  };
}
