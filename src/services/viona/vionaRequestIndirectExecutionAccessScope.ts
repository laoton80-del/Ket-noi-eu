/**
 * Pack40D2 — merchant-only indirect execution access predicate (dormant; no runtime wiring).
 *
 * Builds the exact claim WHERE from resolved current MerchantProfile.
 * No consumer OR branch, legacy branch, requester/participant branch, or client policy flags.
 */

import { VionaRequestScopeKind, type Prisma } from '@prisma/client';

import type { VionaRequestExecutionPrincipalContext } from './vionaRequestExecutionPrincipalContext';

export const VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS = 'triage' as const;

export type BuildMerchantIndirectExecutionClaimWhereResult =
  | Readonly<{ ok: true; where: Prisma.VionaRequestWhereInput }>
  | Readonly<{ ok: false; code: 'merchant_execution_not_authorized' }>;

/**
 * Construct the exact merchant execution claim predicate from the resolved principal profile.
 * Requires an active MerchantProfile; inactive profiles fail closed before predicate use.
 */
export function buildMerchantIndirectExecutionClaimWhere(
  principal: VionaRequestExecutionPrincipalContext,
): BuildMerchantIndirectExecutionClaimWhereResult {
  if (!principal.merchantProfile.isActive) {
    return { ok: false, code: 'merchant_execution_not_authorized' };
  }

  if (principal.triggeringUserId !== principal.merchantProfile.ownerUserId) {
    return { ok: false, code: 'merchant_execution_not_authorized' };
  }

  return {
    ok: true,
    where: {
      id: principal.requestId,
      status: VIONA_REQUEST_INDIRECT_CLAIM_FROM_STATUS,
      ownerUserId: principal.merchantProfile.ownerUserId,
      scopeKind: VionaRequestScopeKind.merchant,
      merchantProfileId: principal.merchantProfile.id,
      tenantId: principal.merchantProfile.tenantId,
    },
  };
}
