import type { AuthUser } from '../context/authTypes';

export function hasB2BWorkspaceAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  // Current auth model only exposes free/premium/combo; treat paid plans as Pro/Power/Enterprise equivalent.
  return user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'combo';
}

