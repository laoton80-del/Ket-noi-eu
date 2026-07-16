/**
 * Pack40DR3B — deployment-stage gate for the operator internal recovery HTTP route.
 *
 * Staging/local only; production and unknown stages fail closed (403 before auth/controller).
 */

import {
  readVionaDeploymentStage,
  type VionaRealProviderExecutionEnvLike,
} from '../realProviderAdapter/vionaRealProviderExecutionFlag';

export function isVionaInternalRecoveryRouteAllowed(
  env: VionaRealProviderExecutionEnvLike = process.env,
): boolean {
  try {
    const stage = readVionaDeploymentStage(env);
    return stage === 'staging' || stage === 'development';
  } catch {
    return false;
  }
}

export const VIONA_INTERNAL_RECOVERY_ROUTE_SAFETY = {
  stagingOrLocalOnly: true,
  productionBlocked: true,
  unknownStageBlocked: true,
  exactAttemptOnly: true,
  noProviderSend: true,
  noScheduler: true,
  notProductionReady: true,
} as const;
