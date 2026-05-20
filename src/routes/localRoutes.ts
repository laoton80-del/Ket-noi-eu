import { Router } from 'express';

import * as LocalRequestController from '../controllers/LocalRequestController';
import { authMiddleware } from '../middleware/authMiddleware';
import { createLocalMutationRateLimiter } from '../middleware/localRateLimitMiddleware';
import { superAdminMiddleware } from '../middleware/superAdminMiddleware';

export const localRouter = Router();

localRouter.use(authMiddleware);

localRouter.get('/merchant/requests', (req, res, next) => {
  void LocalRequestController.getMerchantLocalServiceRequests(req, res).catch(next);
});

localRouter.post(
  '/merchant/requests/:id/confirm',
  createLocalMutationRateLimiter('merchant_confirm', { scopeRequestId: true }),
  (req, res, next) => {
    void LocalRequestController.postConfirmMerchantLocalServiceRequest(req, res).catch(next);
  }
);

localRouter.post(
  '/merchant/requests/:id/reject',
  createLocalMutationRateLimiter('merchant_reject', { scopeRequestId: true }),
  (req, res, next) => {
    void LocalRequestController.postRejectMerchantLocalServiceRequest(req, res).catch(next);
  }
);

localRouter.post(
  '/requests',
  createLocalMutationRateLimiter('create_request'),
  (req, res, next) => {
    void LocalRequestController.postCreateLocalServiceRequest(req, res).catch(next);
  }
);

localRouter.post(
  '/requests/:id/cancel',
  createLocalMutationRateLimiter('user_cancel', { scopeRequestId: true }),
  (req, res, next) => {
    void LocalRequestController.postCancelUserLocalServiceRequest(req, res).catch(next);
  }
);

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
  createLocalMutationRateLimiter('ops_cancel', { scopeRequestId: true }),
  (req, res, next) => {
    void LocalRequestController.postOpsCancelLocalServiceRequest(req, res).catch(next);
  }
);
