/**
 * Pack30D-5 — Real-provider spend Circuit Breaker (pure decision logic, no I/O).
 *
 * Per docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §3. This module contains zero
 * network/DB access — it only decides `open`/`closed` given a pre-computed spend window and a
 * pre-computed cap. The window itself is computed by `vionaProviderSpendWindowQueryService.ts`
 * (a read-only aggregate query over the existing `VionaRequestAuditEvent` table — no new table,
 * no Redis, no new infra, per the plan's §8 rejected-alternatives list).
 *
 * Deliberately no "half-open" probe state: this is a *budget* breaker, not a *latency/error*
 * breaker — probing whether it's safe to spend by spending is a contradiction. Once `open`, a
 * provider stays blocked for the rest of the UTC-day window; the only resets are (a) the window
 * naturally rolling over to the next UTC day, or (b) a future, separately authorized manual
 * operator reset (not built by this pack).
 */

export type VionaProviderCircuitBreakerProvider = 'twilio' | 'openai';

export type VionaProviderCircuitBreakerState = 'closed' | 'open';

export type VionaProviderCircuitBreakerReason = 'under_cap' | 'daily_cap_exceeded';

export type VionaProviderSpendWindow = Readonly<{
  provider: VionaProviderCircuitBreakerProvider;
  windowStartIso: string;
  windowEndIso: string;
  callCount: number;
  estimatedSpendUsdCents: number;
}>;

export type VionaProviderCircuitBreakerDecision = Readonly<{
  state: VionaProviderCircuitBreakerState;
  reason: VionaProviderCircuitBreakerReason;
  window: VionaProviderSpendWindow;
  capUsdCents: number;
}>;

/**
 * Per-provider env var names for the daily USD-cent spend cap. Missing/unparseable resolves to a
 * `0` cap in `readVionaProviderSpendCapUsdCentsFromEnv` — **never** "unlimited" (fail-closed).
 */
export const VIONA_PROVIDER_CIRCUIT_BREAKER_CAP_ENV_VARS: Readonly<
  Record<VionaProviderCircuitBreakerProvider, string>
> = {
  twilio: 'PACK30D5_TWILIO_DAILY_CAP_USD_CENTS',
  openai: 'PACK30D5_OPENAI_DAILY_CAP_USD_CENTS',
};

export type VionaProviderCircuitBreakerEnvLike = Readonly<Record<string, string | undefined>>;

/**
 * Reads the daily cap for one provider from its dedicated env var. Any missing, empty,
 * non-numeric, negative, or non-finite value resolves to `0` — a breaker with a `0` cap is
 * always `open` (§3.3 of the plan), which is the safe, fail-closed default, never "unlimited."
 */
export function readVionaProviderSpendCapUsdCentsFromEnv(
  provider: VionaProviderCircuitBreakerProvider,
  env: VionaProviderCircuitBreakerEnvLike = process.env,
): number {
  try {
    const raw = env[VIONA_PROVIDER_CIRCUIT_BREAKER_CAP_ENV_VARS[provider]];
    if (raw === undefined) return 0;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  } catch {
    // Fail closed: any error reading the environment resolves to the most restrictive cap.
    return 0;
  }
}

/**
 * Pure decision function — no I/O. `window` and `capUsdCents` are both pre-computed by the
 * caller (see `vionaProviderSpendWindowQueryService.ts` for the real, DB-backed window builder).
 * A `0` cap (missing/invalid config) always resolves to `open`, even with zero recorded spend.
 */
export function evaluateVionaProviderCircuitBreaker(
  window: VionaProviderSpendWindow,
  capUsdCents: number,
): VionaProviderCircuitBreakerDecision {
  const safeCap = Number.isFinite(capUsdCents) && capUsdCents > 0 ? Math.floor(capUsdCents) : 0;
  const isOpen = safeCap <= 0 || window.estimatedSpendUsdCents >= safeCap;
  return {
    state: isOpen ? 'open' : 'closed',
    reason: isOpen ? 'daily_cap_exceeded' : 'under_cap',
    window,
    capUsdCents: safeCap,
  };
}
