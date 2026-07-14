/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing routes.
 *
 * Mounted in `app.ts` **before** `express.json()` with `express.raw()` — same pattern as the
 * Stripe webhook. No `authMiddleware` — signature verification happens inside the controller.
 */

import { Router } from 'express';

import { postVionaWebhookMerchantAgent } from '../controllers/VionaWebhookMerchantAgentController';
import { vionaWebhookChannelRateLimiter } from '../middleware/vionaWebhookRateLimitMiddleware';

export const vionaWebhookRouter = Router();

vionaWebhookRouter.post(
  '/merchant-agent',
  vionaWebhookChannelRateLimiter,
  (req, res, next) => {
    void postVionaWebhookMerchantAgent(req, res).catch(next);
  },
);
