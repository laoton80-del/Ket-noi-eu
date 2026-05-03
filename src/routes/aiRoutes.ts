import { Router } from 'express';

import * as AIController from '../controllers/AIController';
import { authMiddleware } from '../middleware/authMiddleware';

export const aiRouter = Router();

aiRouter.use(authMiddleware);

aiRouter.post('/legal-scan', (req, res, next) => {
  void AIController.postLegalScan(req, res).catch(next);
});

aiRouter.post('/translate/travel-phrase', (req, res, next) => {
  void AIController.postTranslateTravelPhrase(req, res).catch(next);
});

aiRouter.post('/chat-completion', (req, res, next) => {
  void AIController.postChatCompletion(req, res).catch(next);
});
