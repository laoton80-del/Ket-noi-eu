import { Router } from 'express';

import * as BusinessController from '../controllers/BusinessController';
import { authMiddleware } from '../middleware/authMiddleware';

export const businessRouter = Router();

businessRouter.use(authMiddleware);

businessRouter.get('/ranking/me', (req, res, next) => {
  void BusinessController.getMyBusinessRanking(req, res).catch(next);
});

businessRouter.get('/:businessId/ranking', (req, res, next) => {
  void BusinessController.getBusinessRankingById(req, res).catch(next);
});
