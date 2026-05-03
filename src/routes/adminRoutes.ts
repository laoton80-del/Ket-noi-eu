import { Router } from 'express';

import * as AdminController from '../controllers/AdminController';
import * as AdminMarketingController from '../controllers/AdminMarketingController';
import { authMiddleware } from '../middleware/authMiddleware';
import { superAdminMiddleware } from '../middleware/superAdminMiddleware';

export const adminRouter = Router();

adminRouter.use(authMiddleware);
adminRouter.use(superAdminMiddleware);

adminRouter.get('/tourism-stats', (req, res, next) => {
  void AdminController.getTourismStats(req, res).catch(next);
});

adminRouter.get('/marketing/posts', (req, res, next) => {
  void AdminMarketingController.getMarketingPosts(req, res).catch(next);
});

adminRouter.put('/marketing/posts/:id', (req, res, next) => {
  void AdminMarketingController.putMarketingPost(req, res).catch(next);
});

adminRouter.post('/marketing/posts/:id/publish', (req, res, next) => {
  void AdminMarketingController.postMarketingPostPublish(req, res).catch(next);
});

adminRouter.post('/marketing/posts/:id/approve-and-translate', (req, res, next) => {
  void AdminMarketingController.postMarketingApproveAndTranslate(req, res).catch(next);
});

adminRouter.delete('/marketing/posts/:id', (req, res, next) => {
  void AdminMarketingController.deleteMarketingDraft(req, res).catch(next);
});

adminRouter.post('/trigger-auto-post', (req, res, next) => {
  void AdminMarketingController.postTriggerAutoPost(req, res).catch(next);
});
