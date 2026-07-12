/**
 * Pack30D-2 (real-provider POC) — feature-flag gate for `executeReal()` (no network, no DB).
 *
 * Per docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §4:
 *   - Default is `false` for any unset/empty/non-`"true"` value.
 *   - Hard-blocked in production regardless of the flag's literal value — production can never
 *     enable the flag's effect, even if `PACK30_REAL_PROVIDER_EXECUTION_ENABLED=true` is set by
 *     misconfiguration.
 *   - Fails closed on any error reading the environment.
 *   - Only ever gates `executeReal()` — the existing Pack30A `executeMock()` path is never
 *     affected by this flag.
 */

export const VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG = 'PACK30_REAL_PROVIDER_EXECUTION_ENABLED';

export type VionaRealProviderExecutionEnvLike = Readonly<Record<string, string | undefined>>;

/**
 * Mirrors the inline `NODE_ENV === 'production'` checks already used elsewhere in this repo
 * (`src/config/httpSecurity.ts`, `src/utils/Logger.ts`) — no new environment-detection mechanism
 * is introduced, per the plan's instruction to reuse rather than invent one.
 */
export function isProductionEnvironment(env: VionaRealProviderExecutionEnvLike = process.env): boolean {
  try {
    return env.NODE_ENV === 'production';
  } catch {
    // Fail closed: if reading the environment throws for any reason, treat it as production
    // (the more restrictive outcome) so a real call is never mistakenly allowed.
    return true;
  }
}

/**
 * Returns `true` only when the flag is explicitly `"true"` **and** the environment is not
 * production. Any other input (unset, empty, `"1"`, `"TRUE"`, malformed, or a thrown error while
 * reading `process.env`) resolves to `false`.
 */
export function isRealProviderExecutionEnabled(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  try {
    if (isProductionEnvironment(env)) {
      return false;
    }
    return env[VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG] === 'true';
  } catch {
    return false;
  }
}
