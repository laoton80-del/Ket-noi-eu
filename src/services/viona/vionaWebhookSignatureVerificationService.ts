/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: generic webhook signature verifier.
 *
 * Deliberately mirrors `verifyStripeWebhookSignature()`'s exact shape (see
 * `src/services/api/StripeWebhookService.ts`) — raw body, timestamp-bounded, HMAC-SHA256,
 * `crypto.timingSafeEqual` comparison. No new cryptographic scheme is invented; see
 * docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §4.2.
 *
 * Header format (generic, provider-agnostic, chosen to match Stripe's exact `t=,v1=` shape):
 *   `X-Viona-Webhook-Signature: t=<unixSeconds>,v1=<hex(hmacSha256(secret, "${t}.${rawBody}"))>`
 *
 * Deliberate, documented scope note for this increment: a real WhatsApp Cloud API integration
 * would use Meta's own native `X-Hub-Signature-256: sha256=<hex>` header (no timestamp component
 * at all). Per the plan's §4.2/§9, this increment does not implement that native Meta format —
 * every channel type verifies against this one generic, Stripe-shaped scheme instead. Wiring a
 * real Meta App Secret / native header format is explicitly out of scope (plan §9).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Replay-protection bound — a cryptographically valid but stale signature is still rejected. */
export const VIONA_WEBHOOK_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export type VerifyVionaWebhookSignatureFailureReason =
  | 'missing_header'
  | 'bad_format'
  | 'stale_timestamp'
  | 'signature_mismatch';

export type VerifyVionaWebhookSignatureResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: VerifyVionaWebhookSignatureFailureReason }>;

/**
 * Pure (besides reading `nowMs()`, injectable for deterministic tests) — no DB, no network.
 * Never throws; every malformed/missing input resolves to a typed `ok: false` result.
 */
export function verifyVionaWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  signingSecret: string,
  nowMs: () => number = Date.now,
): VerifyVionaWebhookSignatureResult {
  const header = typeof signatureHeader === 'string' ? signatureHeader.trim() : '';
  const secret = signingSecret.trim();
  if (header.length === 0) {
    return { ok: false, reason: 'missing_header' };
  }
  if (secret.length === 0) {
    return { ok: false, reason: 'bad_format' };
  }

  let timestampRaw = '';
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't') timestampRaw = value;
    if (key === 'v1' && value.length > 0) signatures.push(value);
  }
  if (timestampRaw.length === 0 || signatures.length === 0 || !/^\d+$/.test(timestampRaw)) {
    return { ok: false, reason: 'bad_format' };
  }

  const timestampMs = Number(timestampRaw) * 1000;
  if (!Number.isFinite(timestampMs)) {
    return { ok: false, reason: 'bad_format' };
  }

  const now = nowMs();
  if (Math.abs(now - timestampMs) > VIONA_WEBHOOK_SIGNATURE_MAX_AGE_MS) {
    return { ok: false, reason: 'stale_timestamp' };
  }

  const signedPayload = `${timestampRaw}.${rawBody.toString('utf8')}`;
  const expectedHex = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  const matched = signatures.some((candidate) => {
    try {
      const a = Buffer.from(expectedHex, 'hex');
      const b = Buffer.from(candidate, 'hex');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });

  return matched ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}

/**
 * Test/ops convenience — builds a valid header for a given secret + raw body. Never used by the
 * verifier itself; exists so the test suite and any future channel-provisioning tooling can
 * construct a real, valid signature without duplicating the HMAC logic above.
 */
export function buildVionaWebhookSignatureHeader(
  rawBody: Buffer,
  signingSecret: string,
  timestampMs: number = Date.now(),
): string {
  const timestampSeconds = Math.floor(timestampMs / 1000).toString();
  const signedPayload = `${timestampSeconds}.${rawBody.toString('utf8')}`;
  const hex = createHmac('sha256', signingSecret.trim()).update(signedPayload, 'utf8').digest('hex');
  return `t=${timestampSeconds},v1=${hex}`;
}
