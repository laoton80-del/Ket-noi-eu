/**
 * Pack35 — B2B Omni-Channel Webhook & Agent Routing: per-channel sliding-window rate limiter.
 *
 * Same in-memory, dependency-free sliding-window shape as `RateLimitMiddleware.ts`'s
 * `createIpRateLimiter()` — deliberately not reused directly, because that limiter's bucket key
 * is always the caller's IP (`clientIp()`), which is structurally wrong for this route: a single
 * WhatsApp Business number's traffic arrives from Meta's own shared, rotating IP ranges, never
 * attributable to one merchant. See docs/product/VIONA_PACK35_B2B_WEBHOOK_ROUTING_PLAN.md §6.2.
 *
 * Two independent buckets, both enforced by this one middleware, mirroring the plan's proposed
 * (a)/(b) split: a **global** webhook-route bucket (protects shared downstream LLM/Twilio spend)
 * and a **per-channel** bucket keyed by `(channelType, channelExternalId)` (protects one
 * merchant's own traffic from a self-inflicted spam/misconfigured-retry loop). The channel key is
 * read from the still-unverified raw request body — safe, because this is a bare rate-limit
 * lookup with no side effect and no information disclosure (§6.2); actual authentication happens
 * downstream in the controller via `verifyVionaWebhookSignature()`. A malformed/unparsable body
 * falls back to a single shared `'unknown'` channel bucket, never bypasses the limiter, and never
 * throws — that body is left completely untouched for the controller's own JSON parsing.
 */

import type { NextFunction, Request, Response } from 'express';

import { jsonFail } from '../utils/apiEnvelope';

type Bucket = { timestamps: number[] };

const globalBuckets = new Map<string, Bucket>();
const channelBuckets = new Map<string, Bucket>();

export type VionaWebhookRateLimitOptions = Readonly<{ windowMs: number; max: number }>;

/** Global webhook-route limit — protects shared downstream LLM/Twilio spend across all channels. */
export const VIONA_WEBHOOK_GLOBAL_RATE_LIMIT: VionaWebhookRateLimitOptions = {
  windowMs: 1_000,
  max: 50,
};

/** Per-channel limit — protects one merchant's own traffic from a self-inflicted spam/retry loop. */
export const VIONA_WEBHOOK_CHANNEL_RATE_LIMIT: VionaWebhookRateLimitOptions = {
  windowMs: 10_000,
  max: 20,
};

function prune(timestamps: number[], now: number, windowMs: number): number[] {
  const cutoff = now - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

function consume(buckets: Map<string, Bucket>, key: string, options: VionaWebhookRateLimitOptions, now: number): boolean {
  const previous = buckets.get(key)?.timestamps ?? [];
  const recent = prune(previous, now, options.windowMs);
  if (recent.length >= options.max) {
    buckets.set(key, { timestamps: recent });
    return false;
  }
  recent.push(now);
  buckets.set(key, { timestamps: recent });
  return true;
}

function readRawBuffer(req: Request): Buffer {
  const body = req.body;
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body, 'utf8');
  return Buffer.alloc(0);
}

/** Never throws — a malformed/unparsable body resolves to the shared `'unknown'` channel key. */
export function readVionaWebhookChannelKey(req: Request): string {
  try {
    const parsed = JSON.parse(readRawBuffer(req).toString('utf8')) as unknown;
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const channelType = typeof record.channelType === 'string' ? record.channelType.trim() : '';
      const channelExternalId = typeof record.channelExternalId === 'string' ? record.channelExternalId.trim() : '';
      if (channelType.length > 0 && channelExternalId.length > 0) {
        return `${channelType}:${channelExternalId}`;
      }
    }
  } catch {
    // Fall through — malformed JSON is a rate-limit-bucket concern only, never a crash here.
  }
  return 'unknown';
}

/**
 * Mounted after `express.raw()` and before the controller (see `vionaWebhookRoutes.ts`). Checks
 * the global bucket first, then the per-channel bucket — either exceeding its threshold is a
 * `429`, with zero further processing (never reaches signature verification or the controller).
 */
export function vionaWebhookChannelRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();

  if (!consume(globalBuckets, 'global', VIONA_WEBHOOK_GLOBAL_RATE_LIMIT, now)) {
    jsonFail(res, 'Webhook rate limit exceeded (global).', 429);
    return;
  }

  const channelKey = readVionaWebhookChannelKey(req);
  if (!consume(channelBuckets, channelKey, VIONA_WEBHOOK_CHANNEL_RATE_LIMIT, now)) {
    jsonFail(res, 'Webhook rate limit exceeded (per channel).', 429);
    return;
  }

  next();
}
