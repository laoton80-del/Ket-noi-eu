import { Router } from 'express';

import * as VionaRequestController from '../controllers/VionaRequestController';
import { authMiddleware } from '../middleware/authMiddleware';

export const vionaRouter = Router();

vionaRouter.use(authMiddleware);

vionaRouter.get('/requests', (req, res, next) => {
  void VionaRequestController.getVionaRequests(req, res).catch(next);
});

vionaRouter.post('/requests', (req, res, next) => {
  void VionaRequestController.postCreateVionaRequest(req, res).catch(next);
});

vionaRouter.get('/requests/:id', (req, res, next) => {
  void VionaRequestController.getVionaRequestDetail(req, res).catch(next);
});

vionaRouter.post('/requests/:id/actions/note', (req, res, next) => {
  void VionaRequestController.postVionaRequestNoteAction(req, res).catch(next);
});

vionaRouter.post('/requests/:id/actions/status', (req, res, next) => {
  void VionaRequestController.postVionaRequestStatusAction(req, res).catch(next);
});

vionaRouter.post('/requests/:id/actions/execution-preview', (req, res, next) => {
  void VionaRequestController.postVionaRequestExecutionPreviewAction(req, res).catch(next);
});

vionaRouter.post('/requests/:id/actions/execution-plan-preview', (req, res, next) => {
  void VionaRequestController.postVionaRequestExecutionPlanPreviewAction(req, res).catch(next);
});
