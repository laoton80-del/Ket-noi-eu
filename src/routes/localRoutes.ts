import { Router } from 'express';

import * as LocalRequestController from '../controllers/LocalRequestController';
import { authMiddleware } from '../middleware/authMiddleware';

export const localRouter = Router();

localRouter.use(authMiddleware);

localRouter.post('/requests', (req, res, next) => {
  void LocalRequestController.postCreateLocalServiceRequest(req, res).catch(next);
});
