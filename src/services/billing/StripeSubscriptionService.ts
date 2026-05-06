/**
 * B2B SaaS subscription lifecycle — **EU / German fair-contract cancellation**: merchants must reach cancellation
 * without dark patterns. **Stripe secret keys never belong in the app** — this module calls a trusted backend
 * that executes `stripe.subscriptions.update(subId, { cancel_at_period_end: true })`.
 */

import type { AuthUser } from '../../context/authTypes';
import { isMerchantServerRole } from '../../context/authTypes';
import { mergeTrustBackendHeaders } from '../../utils/trustBackendHeaders';
import { TenantIsolationError, withTenantIsolation } from '../../utils/security/TenantIsolation';

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';

/**
 * Production: replace with `User.b2bPowerElite` (or Stripe subscription id map) from your profile API.
 * `combo` is the interim stand-in for paid Power SaaS in this client until tier is synced from the server.
 */
export function isMerchantOnPowerSaasTier(user: AuthUser | null): boolean {
  if (!user || !isMerchantServerRole(user.serverRole)) return false;
  if (process.env.EXPO_PUBLIC_DEV_FORCE_POWER_SUBSCRIPTION?.trim() === '1') return true;
  return user.subscriptionPlan === 'combo';
}

export type CancelStripeSubscriptionResult =
  | Readonly<{ ok: true; cancelAtPeriodEnd: true; message: string }>
  | Readonly<{ ok: false; code: string; message: string }>;

/**
 * Schedules cancellation at period end (`cancel_at_period_end: true`) — preserves access until billing period ends
 * (EU consumer-friendly; no punitive friction).
 */
export async function cancelStripeSubscription(merchantId: string): Promise<CancelStripeSubscriptionResult> {
  try {
    return await withTenantIsolation(merchantId, async (id) => {
    if (!BACKEND_API_BASE) {
      return {
        ok: true,
        cancelAtPeriodEnd: true,
        message:
          'Cancellation request recorded (demo). Set EXPO_PUBLIC_BACKEND_API_BASE and implement POST /billing/subscription/cancel with Stripe cancel_at_period_end.',
      };
    }

    try {
      const headers = await mergeTrustBackendHeaders({ 'Content-Type': 'application/json' });
      const res = await fetch(`${BACKEND_API_BASE}/billing/subscription/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          merchantId: id,
          cancelAtPeriodEnd: true,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        return {
          ok: false,
          code: `http_${res.status}`,
          message: text.slice(0, 400) || 'Subscription cancellation failed.',
        };
      }
      return {
        ok: true,
        cancelAtPeriodEnd: true,
        message: 'Your subscription will end after the current billing period. You can keep using Power until then.',
      };
    } catch (e) {
      return {
        ok: false,
        code: 'network',
        message: e instanceof Error ? e.message : 'Network error.',
      };
    }
    });
  } catch (e) {
    if (e instanceof TenantIsolationError) {
      return { ok: false, code: e.code, message: 'Merchant id required for cancellation.' };
    }
    throw e;
  }
}
