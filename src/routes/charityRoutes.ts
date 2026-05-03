import { Router } from 'express';

import * as CharityController from '../controllers/CharityController';

export const charityRouter = Router();

charityRouter.get('/totals', (req, res, next) => {
  void CharityController.getTotals(req, res).catch(next);
});
