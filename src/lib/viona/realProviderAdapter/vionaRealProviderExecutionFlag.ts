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

/**
 * Pack30D-5 — symmetric flag for the new, **unwired** OpenAI real-execution adapter (see
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §4). Reuses {@link isProductionEnvironment}
 * unchanged — no duplicated production-detection logic. This flag governs only
 * `vionaOpenAiRealProviderAdapter.ts`'s `executeReal()`; it has no effect on, and is never read
 * by, any existing, already-shipped OpenAI call site (`AIRouterService.ts`'s
 * `createRoutedChatCompletion()` remains ungated by this flag, exactly as before this pack).
 */
export const VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG = 'PACK30D_OPENAI_REAL_EXECUTION_ENABLED';

/**
 * Returns `true` only when the OpenAI real-execution flag is explicitly `"true"` **and** the
 * environment is not production. Same fail-closed semantics as
 * {@link isRealProviderExecutionEnabled}, kept as a separate function (rather than a shared
 * parameterized one) so each provider's flag can be independently named, read, and — in a future
 * pack — independently deprecated without touching the other.
 */
export function isOpenAiRealExecutionEnabled(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  try {
    if (isProductionEnvironment(env)) {
      return false;
    }
    return env[VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG] === 'true';
  } catch {
    return false;
  }
}
