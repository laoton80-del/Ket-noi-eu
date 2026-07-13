/**
 * Pack30D-8 — deployment-stage gate for the internal real Twilio POC HTTP route.
 *
 * Operator authorization: `APPROVE_PACK30D_8_STAGING_WIRING_INTERNAL_ROUTE`.
 * Allows the route only on explicitly labeled staging or local/dev deployments;
 * production and unknown stages fail closed (403 before auth/controller).
 */

import {
  readVionaDeploymentStage,
  type VionaRealProviderExecutionEnvLike,
} from '../realProviderAdapter/vionaRealProviderExecutionFlag';

/** Twilio Test-Credentials happy-path magic number — zero cost, enforced at the controller layer. */
export const VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER = '+15005550006' as const;

/**
 * Returns `true` only when {@link readVionaDeploymentStage} resolves to `staging` or
 * `development` (local/dev). Production and unknown stages return `false`.
 */
export function isVionaInternalRealTwilioPocRouteAllowed(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  try {
    const stage = readVionaDeploymentStage(env);
    return stage === 'staging' || stage === 'development';
  } catch {
    return false;
  }
}

export const VIONA_INTERNAL_REAL_TWILIO_POC_ROUTE_SAFETY = {
  stagingOrLocalOnly: true,
  productionBlocked: true,
  unknownStageBlocked: true,
  magicNumbersOnly: true,
  forcedFromNumber: VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
  forcedToNumber: VIONA_INTERNAL_REAL_TWILIO_POC_FORCED_MAGIC_NUMBER,
  realProviderFlagStillRequired: true,
  circuitBreakerStillRequired: true,
  notProductionReady: true,
} as const;
