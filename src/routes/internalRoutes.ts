import { Router } from 'express';

import * as VionaInternalExecutionAttemptRecoveryController from '../controllers/VionaInternalExecutionAttemptRecoveryController';
import * as VionaInternalRealTwilioPocController from '../controllers/VionaInternalRealTwilioPocController';
import { authMiddleware } from '../middleware/authMiddleware';
import { superAdminMiddleware } from '../middleware/superAdminMiddleware';
import { vionaInternalDeploymentStageGateMiddleware } from '../middleware/vionaInternalDeploymentStageGateMiddleware';

export const internalRouter = Router();

/** Pack30D-8 — fail closed on production/unknown before any authenticated handler runs. */
internalRouter.use(vionaInternalDeploymentStageGateMiddleware);

const vionaInternalRouter = Router();
vionaInternalRouter.use(authMiddleware);

vionaInternalRouter.post('/trigger-real-twilio-poc', (req, res, next) => {
  void VionaInternalRealTwilioPocController.postVionaInternalTriggerRealTwilioPoc(req, res).catch(next);
});

/** Pack40DR3B — operator internal recovery (Role.ADMIN + exact attempt route binding). */
vionaInternalRouter.post(
  '/execution-attempts/:attemptId/recovery',
  superAdminMiddleware,
  (req, res, next) => {
    void VionaInternalExecutionAttemptRecoveryController.postVionaInternalExecutionAttemptRecovery(
      req,
      res,
    ).catch(next);
  },
);

internalRouter.use('/viona', vionaInternalRouter);
