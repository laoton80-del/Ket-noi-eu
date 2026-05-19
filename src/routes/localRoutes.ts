import { Router } from 'express';

import * as LocalRequestController from '../controllers/LocalRequestController';
import { authMiddleware } from '../middleware/authMiddleware';

export const localRouter = Router();

localRouter.use(authMiddleware);

localRouter.get('/merchant/requests', (req, res, next) => {
  void LocalRequestController.getMerchantLocalServiceRequests(req, res).catch(next);
});

localRouter.post('/merchant/requests/:id/confirm', (req, res, next) => {
  void LocalRequestController.postConfirmMerchantLocalServiceRequest(req, res).catch(next);
});

localRouter.post('/merchant/requests/:id/reject', (req, res, next) => {
  void LocalRequestController.postRejectMerchantLocalServiceRequest(req, res).catch(next);
});

localRouter.post('/requests', (req, res, next) => {
  void LocalRequestController.postCreateLocalServiceRequest(req, res).catch(next);
});
