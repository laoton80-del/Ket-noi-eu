/**
 * V7 OMNIVERSE — "90-Day Trap" merchant lifecycle (SEO runway → VIG gate).
 * **No mock day counters** — use {@link calculateActualTrialDays} from Supabase `merchants.created_at` (ISO-8601).
 */

/** Inclusive: days 1…90 receive organic / Top-SEO style placement (product-defined). */
export const V7_TRIAL_TOP_SEO_DAY_CAP = 90 as const;

export type V7MerchantTrialPhase = 'top_seo_window' | 'vig_token_gate';

export function resolveV7MerchantTrialPhase(daySinceMerchantStart: number): V7MerchantTrialPhase {
  const d = Math.max(0, Math.floor(daySinceMerchantStart));
  return d <= V7_TRIAL_TOP_SEO_DAY_CAP ? 'top_seo_window' : 'vig_token_gate';
}

export function isV7PostTrapDay(daySinceMerchantStart: number): boolean {
  return resolveV7MerchantTrialPhase(daySinceMerchantStart) === 'vig_token_gate';
}

/**
 * Calendar-accurate day count from merchant record creation (UTC midnight-safe via ms diff).
 * @param merchantCreatedAt — ISO-8601 from DB (e.g. `2025-01-15T12:00:00.000Z`)
 */
export function calculateActualTrialDays(merchantCreatedAt: string): number {
  const t = Date.parse(merchantCreatedAt.trim());
  if (Number.isNaN(t)) {
    throw new Error('v7_trap: merchantCreatedAt must be a valid ISO-8601 timestamp');
  }
  const now = Date.now();
  const diffMs = Math.max(0, now - t);
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Strict enforcement for ranking + VIG gate. **daysActive > 90** ⇒ no high rank, VIG top-up required.
 * (Day 90 is still in runway; day 91 triggers gate — aligns with `> 90`.)
 */
export type V7TrapEnforcement = Readonly<{
  merchantId: string;
  daysActive: number;
  isRankedHigh: boolean;
  requiresVigTopUp: boolean;
  phase: V7MerchantTrialPhase;
}>;

export function enforceV7TrapRestrictions(merchantId: string, daysActive: number): V7TrapEnforcement {
  const mid = merchantId.trim();
  if (mid.length === 0) {
    throw new Error('v7_trap: merchantId required for enforcement audit trail');
  }
  const d = Math.max(0, Math.floor(daysActive));
  const pastCap = d > V7_TRIAL_TOP_SEO_DAY_CAP;
  return {
    merchantId: mid,
    daysActive: d,
    isRankedHigh: !pastCap,
    requiresVigTopUp: pastCap,
    phase: resolveV7MerchantTrialPhase(d),
  };
}

/** UI / notification copy — pass **real** days from {@link calculateActualTrialDays}. */
export function getV7TrialTrapSurfaceCopy(daySinceMerchantStart: number): string {
  const phase = resolveV7MerchantTrialPhase(daySinceMerchantStart);
  const day = Math.max(0, Math.floor(daySinceMerchantStart));
  if (phase === 'top_seo_window') {
    return `Days 1–${V7_TRIAL_TOP_SEO_DAY_CAP}: Top SEO & discovery boost active (you are on day ${Math.min(day, V7_TRIAL_TOP_SEO_DAY_CAP)}).`;
  }
  return `Day ${V7_TRIAL_TOP_SEO_DAY_CAP + 1}+: Top SEO runway ended — VIO Credits top-up required to restore featured placement and AI reception capacity (in-app only).`;
}

/** When merchant `created_at` is not yet synced, show compliance-safe copy (no fabricated day). */
export function getV7TrialTrapPendingSyncCopy(): string {
  return 'Merchant profile creation date must be loaded from VIONA to enforce the 90-day SEO runway and in-app credits gate — sync your business account.';
}
