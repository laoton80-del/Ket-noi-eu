import { Router } from 'express';

import * as LocalRequestController from '../controllers/LocalRequestController';
import { authMiddleware } from '../middleware/authMiddleware';
import { superAdminMiddleware } from '../middleware/superAdminMiddleware';

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

localRouter.post('/requests/:id/cancel', (req, res, next) => {
  void LocalRequestController.postCancelUserLocalServiceRequest(req, res).catch(next);
});

localRouter.get('/requests/:id/timeline', (req, res, next) => {
  void LocalRequestController.getUserLocalRequestTimeline(req, res).catch(next);
});

localRouter.get(
  '/ops/requests/:id/audit-events',
  superAdminMiddleware,
  (req, res, next) => {
    void LocalRequestController.getOpsLocalRequestAuditEvents(req, res).catch(next);
  }
);

localRouter.post(
  '/ops/requests/:id/cancel',
  superAdminMiddleware,
  (req, res, next) => {
    void LocalRequestController.postOpsCancelLocalServiceRequest(req, res).catch(next);
  }
);
