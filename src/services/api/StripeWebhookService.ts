/**
 * Stripe webhook fulfillment — **zero trust** in client “success” screens.
 * Only cryptographically verified events may credit VIG or flip SaaS tiers.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

import { tryCreditBrokerB2bPowerSubscriptionShare } from '../b2b/BrokerService';
import {
  creditWalletFromStripePaymentSucceeded,
  type StripeTopUpCreditOutput,
} from '../WalletService';

export type StripePaymentIntentSucceededPayload = Readonly<{
  stripeEventId: string;
  paymentIntentId: string;
  amountReceivedCents: number;
  currency: string;
  metadata: Readonly<Record<string, string>>;
}>;

function readStringRecord(v: unknown): Readonly<Record<string, string>> | null {
  if (typeof v !== 'object' || v === null) return null;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string') out[k] = val;
  }
  return out;
}

/**
 * Stripe `Stripe-Signature` header verification (v1 scheme).
 * @see https://docs.stripe.com/webhooks/signature
 */
export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  const sig = typeof signatureHeader === 'string' ? signatureHeader.trim() : '';
  const sec = secret.trim();
  if (sig.length === 0 || sec.length === 0) return false;

  let timestamp = '';
  const signatures: string[] = [];
  for (const part of sig.split(',')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't') timestamp = value;
    if (key === 'v1' && value.length > 0) signatures.push(value);
  }
  if (timestamp.length === 0 || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const hmac = createHmac('sha256', sec);
  hmac.update(signedPayload, 'utf8');
  const expectedHex = hmac.digest('hex');

  return signatures.some((candidate) => {
    try {
      const a = Buffer.from(expectedHex, 'hex');
      const b = Buffer.from(candidate, 'hex');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

function readFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return null;
}

function readString(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

/**
 * Extracts trusted fields from a parsed Stripe Event object (no `any` — explicit guards).
 */
export function parsePaymentIntentSucceeded(
  event: unknown
): StripePaymentIntentSucceededPayload | null {
  if (typeof event !== 'object' || event === null) return null;
  const e = event as { id?: unknown; type?: unknown; data?: { object?: unknown } };
  const id = readString(e.id);
  const type = readString(e.type);
  if (!id || type !== 'payment_intent.succeeded') return null;

  const obj = e.data?.object;
  if (typeof obj !== 'object' || obj === null) return null;
  const pi = obj as {
    id?: unknown;
    amount_received?: unknown;
    currency?: unknown;
    metadata?: unknown;
  };
  const paymentIntentId = readString(pi.id);
  const amountReceived = readFiniteNumber(pi.amount_received);
  const currency = readString(pi.currency);
  if (!paymentIntentId || amountReceived === null || !currency) return null;

  const meta = readStringRecord(pi.metadata) ?? {};

  return {
    stripeEventId: id,
    paymentIntentId,
    amountReceivedCents: amountReceived,
    currency: currency.toLowerCase(),
    metadata: meta,
  };
}

function resolveCreditUserId(meta: Readonly<Record<string, string>>): string | null {
  const a = meta.user_id?.trim() ?? '';
  const b = meta.userId?.trim() ?? '';
  const c = meta.creditUserId?.trim() ?? '';
  const v = a.length > 0 ? a : b.length > 0 ? b : c;
  return v.length > 0 ? v : null;
}

function resolveVigAmount(meta: Readonly<Record<string, string>>, amountCents: number): number {
  const raw = meta.vig_amount?.trim() ?? meta.vigAmount?.trim() ?? '';
  if (raw.length > 0) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  /** EUR-pegged VIG: major units = cents / 100 (adjust if you encode minor VIG in metadata). */
  return Math.round(amountCents) / 100;
}

function resolveB2bSaasPlan(meta: Readonly<Record<string, string>>): 'BASIC' | 'ELITE' | undefined {
  const t = meta.saas_tier?.trim().toUpperCase() ?? meta.saasTier?.trim().toUpperCase() ?? '';
  if (t === 'ELITE' || t === 'BASIC') return t;
  return undefined;
}

/**
 * Idempotent fulfillment: credits wallet + optional SaaS tier **only** after webhook verification upstream.
 */
export async function fulfillPaymentIntentSucceeded(
  payload: StripePaymentIntentSucceededPayload
): Promise<StripeTopUpCreditOutput> {
  const userId = resolveCreditUserId(payload.metadata);
  if (!userId) {
    throw new Error('stripe_metadata_missing_user');
  }
  const vig = resolveVigAmount(payload.metadata, payload.amountReceivedCents);
  const out = await creditWalletFromStripePaymentSucceeded({
    stripeEventId: payload.stripeEventId,
    paymentIntentId: payload.paymentIntentId,
    creditUserId: userId,
    vigAmount: vig,
    b2bSaasPlan: resolveB2bSaasPlan(payload.metadata),
  });
  await tryCreditBrokerB2bPowerSubscriptionShare({
    stripeEventId: payload.stripeEventId,
    metadata: payload.metadata,
  });
  return out;
}
