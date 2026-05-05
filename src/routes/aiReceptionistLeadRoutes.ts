import { Router } from 'express';

import * as AiReceptionistLeadController from '../controllers/AiReceptionistLeadController';
import { authMiddleware } from '../middleware/authMiddleware';
import { createIpRateLimiter } from '../middleware/RateLimitMiddleware';
import { validateBody } from '../middleware/validateBody';
import { postAiReceptionistLeadEmailBodySchema } from '../validation/aiReceptionistLeadSchema';

export const aiReceptionistLeadRouter = Router();

const aiReceptionistLeadRateLimiter = createIpRateLimiter({
  windowMs: 60_000,
  max: 5,
  message: 'AI Receptionist lead capture rate limit exceeded. Please try again in a minute.',
});

aiReceptionistLeadRouter.post(
  '/pilot-leads/email',
  authMiddleware,
  aiReceptionistLeadRateLimiter,
  validateBody(postAiReceptionistLeadEmailBodySchema),
  (req, res, next) => {
    void AiReceptionistLeadController.postPilotLeadEmail(req, res).catch(next);
  }
);

