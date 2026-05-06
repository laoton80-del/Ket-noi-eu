import type { Request, Response } from 'express';

import {
  fulfillPaymentIntentSucceeded,
  parsePaymentIntentSucceeded,
  verifyStripeWebhookSignature,
} from '../services/api/StripeWebhookService';

function readRawBuffer(req: Request): Buffer {
  const b = req.body;
  if (Buffer.isBuffer(b)) return b;
  if (typeof b === 'string') return Buffer.from(b, 'utf8');
  return Buffer.alloc(0);
}

/**
 * POST `/api/pay/webhook/stripe` — raw JSON body (see `app.ts`); **no JWT** — Stripe signature only.
 */
export async function postStripeWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? '';
  if (!secret) {
    res.status(500).type('text/plain').send('Webhook secret not configured');
    return;
  }

  const raw = readRawBuffer(req);
  const sigHeader = req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

  if (!verifyStripeWebhookSignature(raw, typeof sig === 'string' ? sig : undefined, secret)) {
    res.status(400).type('text/plain').send('Invalid signature');
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString('utf8')) as unknown;
  } catch {
    res.status(400).type('text/plain').send('Invalid JSON');
    return;
  }

  const piPayload = parsePaymentIntentSucceeded(parsed);
  if (!piPayload) {
    res.status(200).json({ received: true, ignored: true, reason: 'not_payment_intent_succeeded' });
    return;
  }

  try {
    const out = await fulfillPaymentIntentSucceeded(piPayload);
    res.status(200).json({ received: true, fulfillment: out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fulfillment_error';
    if (msg === 'stripe_metadata_missing_user') {
      res.status(400).json({ received: true, error: 'metadata.user_id / userId required on PaymentIntent' });
      return;
    }
    console.error('[stripe webhook]', e);
    res.status(500).json({ received: false, error: 'fulfillment_failed' });
  }
}
