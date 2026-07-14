/**
 * Pack34 — B2B Merchant Gateway: tenant-isolation gate (pure, no I/O).
 *
 * Every future AI-Gateway call site that resolves a `MerchantProfile` for an inbound
 * `VionaRequest` must call this gate before doing anything else with that merchant's context,
 * tools, or wallet — see docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §3.3. Mirrors
 * `canTransitionRequestStatus()`'s role in the Pack31 orchestrator: a small, pure,
 * independently-testable gate every write path is designed to call, rather than each call site
 * re-implementing its own isolation check ad hoc.
 *
 * Fail-closed ordering: a `tenantId` mismatch is reported before an inactive-profile check, so a
 * caller can never learn "this (wrong) merchant is inactive" — the mismatch itself is the more
 * fundamental failure and is always surfaced first.
 */

export type VionaMerchantTenantScopeCheckResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'tenant_mismatch' | 'merchant_inactive' }>;

export type VionaMerchantTenantScopeProfile = Readonly<{
  tenantId: string;
  isActive: boolean;
}>;

/**
 * Pure. Never throws. `requestTenantId` is compared with exact, trimmed string equality against
 * `merchantProfile.tenantId` — no normalization/case-folding, since `VionaRequest.tenantId` is
 * validated as required, non-empty text at create time (`vionaRequestCreateService.ts`) and
 * `MerchantProfile.tenantId` is `@unique`, so an exact match is the only correct semantics.
 */
export function assertVionaRequestTenantMatchesMerchant(
  requestTenantId: string,
  merchantProfile: VionaMerchantTenantScopeProfile,
): VionaMerchantTenantScopeCheckResult {
  const trimmedRequestTenantId = requestTenantId.trim();
  const trimmedMerchantTenantId = merchantProfile.tenantId.trim();

  if (trimmedRequestTenantId.length === 0 || trimmedRequestTenantId !== trimmedMerchantTenantId) {
    return { ok: false, reason: 'tenant_mismatch' };
  }

  if (!merchantProfile.isActive) {
    return { ok: false, reason: 'merchant_inactive' };
  }

  return { ok: true };
}
