import { Router } from 'express';

import * as BrokerController from '../controllers/BrokerController';
import { authMiddleware } from '../middleware/authMiddleware';
import { brokerMiddleware } from '../middleware/brokerMiddleware';

export const brokerRouter = Router();

brokerRouter.use(authMiddleware);
brokerRouter.use(brokerMiddleware);

brokerRouter.post('/register-business', (req, res, next) => {
  void BrokerController.postRegisterBusiness(req, res).catch(next);
});

brokerRouter.get('/commissions', (req, res, next) => {
  void BrokerController.getCommissions(req, res).catch(next);
});
