import type { Prisma } from '@prisma/client';

/**
 * Requester-owned read/write scope: caller may access requests they created, own, or participate in.
 * Does not expose admin/global ops access (separate future pack).
 *
 * Pack34 — B2B Merchant Gateway (see docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §3.2)
 * adds one, additive, optional second parameter, `expectedTenantId`. This closes a real isolation
 * gap found during that pack's planning audit: `VionaRequest.tenantId` is a free-text column with
 * zero enforcement today — this function never filtered by it at all. When `expectedTenantId` is
 * omitted (every existing call site today), the returned `Prisma.VionaRequestWhereInput` is
 * **byte-for-byte identical** to this function's pre-Pack34 behavior — only `{ OR: [...] }`, no
 * `tenantId` key present at all — so no existing caller's behavior changes. A future caller that
 * has already resolved and validated a `MerchantProfile` (via
 * `assertVionaRequestTenantMatchesMerchant()`, `vionaMerchantTenantScope.ts`) may pass that
 * merchant's `tenantId` here to additionally scope every read/write to that one tenant. Wiring
 * this second argument into any of today's 3 existing call sites
 * (`vionaRequestReadService.ts`, `vionaRequestNoteActionService.ts`,
 * `vionaRequestStatusActionService.ts`) is explicitly **not** done by this pack — see the plan's
 * file allowlist §8 — and is left for a future, separately-reviewed increment.
 */
export function buildAuthorizedVionaRequestWhere(
  authUserId: string,
  expectedTenantId?: string
): Prisma.VionaRequestWhereInput {
  const trimmedTenantId = expectedTenantId?.trim();
  return {
    OR: [
      { requesterUserId: authUserId },
      { ownerUserId: authUserId },
      { participants: { some: { userRef: authUserId } } },
    ],
    ...(trimmedTenantId ? { tenantId: trimmedTenantId } : {}),
  };
}
