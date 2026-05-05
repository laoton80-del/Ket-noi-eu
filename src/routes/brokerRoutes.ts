import { Router, type NextFunction, type Request, type Response } from 'express';

import * as BrokerController from '../controllers/BrokerController';
import { getFeatureFlags } from '../core/feature-flags/featureFlags';
import { authMiddleware } from '../middleware/authMiddleware';
import { brokerMiddleware } from '../middleware/brokerMiddleware';

export const brokerRouter = Router();

const BROKER_QR_DISABLED_MESSAGE = 'Broker QR is not available in this MVP.' as const;

function brokerQrApiFeatureGate(_req: Request, res: Response, next: NextFunction): void {
  if (!getFeatureFlags().brokerQrEnabled) {
    res.status(403).json({
      success: false,
      code: 'FEATURE_DISABLED',
      message: BROKER_QR_DISABLED_MESSAGE,
      error: BROKER_QR_DISABLED_MESSAGE,
    });
    return;
  }
  next();
}

brokerRouter.use(authMiddleware);
brokerRouter.use(brokerQrApiFeatureGate);
brokerRouter.use(brokerMiddleware);

brokerRouter.post('/register-business', (req, res, next) => {
  void BrokerController.postRegisterBusiness(req, res).catch(next);
});

brokerRouter.get('/commissions', (req, res, next) => {
  void BrokerController.getCommissions(req, res).catch(next);
});
