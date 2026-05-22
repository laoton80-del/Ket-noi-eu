import type { AuthUser } from '../context/authTypes';
import { isMerchantServerRole } from '../context/authTypes';
import { isRestApiConfigured } from '../services/apiClient';

export function hasB2BWorkspaceAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  // Current auth model only exposes free/premium/combo; treat paid plans as Pro/Power/Enterprise equivalent.
  return user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'combo';
}

/**
 * Staging manual walkthrough only — bypasses **client** B2B paywall for Local merchant inbox UI.
 * Server-side merchant ownership still enforced by JWT on `/api/local/merchant/*`.
 * Not a production or commercial unlock.
 *
 * Requires (all): `__DEV__`, `EXPO_PUBLIC_DEV_REST_JWT`, `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK=true`.
 */
export function hasLocalStagingWalkthroughUnlock(): boolean {
  if (!__DEV__) return false;
  return process.env.EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK?.trim() === 'true';
}

/**
 * Dev/staging Local merchant inbox — bypass client B2B paywall only for this surface.
 * Normal path: REST UI login with merchant `serverRole` + configured API base.
 * Legacy path: `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK` (still requires `__DEV__`).
 */
export function canOpenLocalMerchantInboxDevBypass(user: AuthUser | null): boolean {
  if (hasLocalStagingWalkthroughUnlock()) return true;
  if (!__DEV__ || !isRestApiConfigured()) return false;
  return user != null && isMerchantServerRole(user.serverRole);
}

