import type { NextFunction, Request, Response } from 'express';

import { isVionaInternalRealTwilioPocRouteAllowed } from '../lib/viona/internalRoute/vionaInternalRealTwilioPocRouteGate';
import { jsonFail } from '../utils/apiEnvelope';

export type VionaInternalDeploymentStageGateDeps = Readonly<{
  isAllowed?: typeof isVionaInternalRealTwilioPocRouteAllowed;
}>;

/**
 * Pack30D-8 — blocks internal real-provider QA routes on production/unknown deployment stages.
 * Runs before `authMiddleware` so forbidden deployments never reach authenticated handlers.
 */
export function vionaInternalDeploymentStageGateMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
  deps: VionaInternalDeploymentStageGateDeps = {},
): void {
  const isAllowed = deps.isAllowed ?? isVionaInternalRealTwilioPocRouteAllowed;
  if (!isAllowed()) {
    jsonFail(res, 'Internal real Twilio POC route is not available in this deployment', 403);
    return;
  }
  next();
}
