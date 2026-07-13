/**
 * Pack30D-2 (real-provider POC) + Pack30D-7 (staging deployment-stage fix) — feature-flag gate
 * for `executeReal()` (no network, no DB).
 *
 * Per docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md §4 and Pack30D-7 operator
 * directive (`APPROVE_PACK30D_7_STAGING_DEPLOYMENT_STAGE_FIX`):
 *   - Default is `false` for any unset/empty/non-`"true"` value on
 *     `PACK30_REAL_PROVIDER_EXECUTION_ENABLED` — never flipped at code-level.
 *   - Real Twilio execution is allowed **only** when `VIONA_DEPLOYMENT_STAGE === 'staging'`
 *     **and** the flag is explicitly `"true"` (typically via Fly secrets on the staging app).
 *   - `VIONA_DEPLOYMENT_STAGE === 'production'` hard-blocks real execution regardless of the flag
 *     or `NODE_ENV` — production can never enable real-provider calls through misconfiguration.
 *   - Local/dev/unknown deployment stages fail closed (blocked) even if the flag is `"true"`.
 *   - `NODE_ENV === 'production'` on the Fly staging app is normal DevOps practice and does **not**
 *     by itself gate real execution — {@link readVionaDeploymentStage} is the authoritative gate.
 *   - Fails closed on any error reading the environment.
 *   - Only ever gates `executeReal()` — the existing Pack30A `executeMock()` path is never
 *     affected by this flag.
 */

export const VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG = 'PACK30_REAL_PROVIDER_EXECUTION_ENABLED';

/** Pack30D-7 — deployment identity separate from Node's `NODE_ENV` (staging Fly apps run `NODE_ENV=production`). */
export const VIONA_DEPLOYMENT_STAGE_ENV = 'VIONA_DEPLOYMENT_STAGE';

export type VionaRealProviderExecutionEnvLike = Readonly<Record<string, string | undefined>>;

export type VionaDeploymentStage = 'staging' | 'production' | 'development' | 'unknown';

/**
 * Reads the explicit VIONA deployment stage label. Unset/empty/unrecognized values resolve to
 * `'unknown'` (fail-closed for real execution — not treated as staging).
 */
export function readVionaDeploymentStage(
  env: VionaRealProviderExecutionEnvLike = process.env,
): VionaDeploymentStage {
  try {
    const raw = env[VIONA_DEPLOYMENT_STAGE_ENV]?.trim().toLowerCase();
    if (raw === 'staging') return 'staging';
    if (raw === 'production') return 'production';
    if (raw === 'development' || raw === 'dev' || raw === 'local') return 'development';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function isVionaProductionDeploymentStage(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  return readVionaDeploymentStage(env) === 'production';
}

export function isVionaStagingDeploymentStage(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  return readVionaDeploymentStage(env) === 'staging';
}

/**
 * Mirrors the inline `NODE_ENV === 'production'` checks already used elsewhere in this repo
 * (`src/config/httpSecurity.ts`, `src/utils/Logger.ts`) — retained for non-real-execution modules
 * (mock payment adapter, logging, etc.) that predated Pack30D-7. Real-provider gating uses
 * {@link readVionaDeploymentStage} instead so Fly staging (`NODE_ENV=production`,
 * `VIONA_DEPLOYMENT_STAGE=staging`) is not misclassified as a production deployment.
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
 * Returns `true` only when the deployment stage is explicitly `staging`, the real-provider flag is
 * explicitly `"true"`, and the deployment stage is not `production`. Any other input (unset stage,
 * local/dev/unknown stage, unset flag, `"1"`, `"TRUE"`, malformed env, or thrown error) resolves
 * to `false`.
 */
export function isRealProviderExecutionEnabled(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  try {
    if (isVionaProductionDeploymentStage(env)) {
      return false;
    }
    if (!isVionaStagingDeploymentStage(env)) {
      return false;
    }
    return env[VIONA_REAL_PROVIDER_EXECUTION_ENV_FLAG] === 'true';
  } catch {
    return false;
  }
}

/**
 * Pack30D-5 — symmetric flag for the new, **unwired** OpenAI real-execution adapter (see
 * docs/internal-ops/VIONA_PACK30D_5_REAL_PROVIDER_PLAN.md §4). Uses the same Pack30D-7 deployment
 * stage gate as Twilio — still default-off and unwired; this flag governs only
 * `vionaOpenAiRealProviderAdapter.ts`'s `executeReal()`; it has no effect on, and is never read
 * by, any existing, already-shipped OpenAI call site (`AIRouterService.ts`'s
 * `createRoutedChatCompletion()` remains ungated by this flag, exactly as before this pack).
 */
export const VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG = 'PACK30D_OPENAI_REAL_EXECUTION_ENABLED';

/**
 * Returns `true` only when the OpenAI real-execution flag is explicitly `"true"`, the deployment
 * stage is `staging`, and the deployment stage is not `production`. Same fail-closed semantics as
 * {@link isRealProviderExecutionEnabled}, kept as a separate function so each provider's flag can be
 * independently named, read, and — in a future pack — independently deprecated without touching the
 * other.
 */
export function isOpenAiRealExecutionEnabled(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  try {
    if (isVionaProductionDeploymentStage(env)) {
      return false;
    }
    if (!isVionaStagingDeploymentStage(env)) {
      return false;
    }
    return env[VIONA_OPENAI_REAL_EXECUTION_ENV_FLAG] === 'true';
  } catch {
    return false;
  }
}
