/**
 * IP-based rate limits — in-memory (single instance). Use Redis for multi-node production.
 */

import type { NextFunction, Request, Response } from 'express';

import { getTrustProxyHops } from '../config/httpSecurity';
import { jsonFail } from '../utils/apiEnvelope';

type Bucket = Readonly<{
  timestamps: number[];
}>;

const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const trustHops = getTrustProxyHops();
  if (trustHops > 0) {
    const xf = req.headers['x-forwarded-for'];
    const first = Array.isArray(xf) ? xf[0] : typeof xf === 'string' ? xf.split(',')[0] : '';
    const trimmed = first?.trim() ?? '';
    if (trimmed.length > 0) return trimmed;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function prune(ts: number[], now: number, windowMs: number): number[] {
  const cutoff = now - windowMs;
  return ts.filter((t) => t > cutoff);
}

export type IpRateLimitOptions = Readonly<{
  windowMs: number;
  max: number;
  message: string;
}>;

/**
 * Sliding window: at most `max` requests per `windowMs` per IP.
 */
export function createIpRateLimiter(options: IpRateLimitOptions): (req: Request, res: Response, next: NextFunction) => void {
  const { windowMs, max, message } = options;
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = clientIp(req);
    const now = Date.now();
    const prev = buckets.get(ip)?.timestamps ?? [];
    const recent = prune(prev, now, windowMs);
    if (recent.length >= max) {
      jsonFail(res, message, 429);
      return;
    }
    recent.push(now);
    buckets.set(ip, { timestamps: recent });
    next();
  };
}

/** Max 5 requests / second / IP (general API). */
export const generalApiRateLimiter = createIpRateLimiter({
  windowMs: 1000,
  max: 5,
  message: 'Rate limit exceeded (max 5 requests per second per IP).',
});

/** Max 1 request / 2 seconds / IP (LLM & heavy AI routes). */
export const aiGatewayRateLimiter = createIpRateLimiter({
  windowMs: 2000,
  max: 1,
  message: 'AI rate limit exceeded (max 1 request per 2 seconds per IP).',
});

/** Authentication endpoints — same envelope as general (5/s) but separate bucket key prefix. */
export const authApiRateLimiter = createIpRateLimiter({
  windowMs: 1000,
  max: 5,
  message: 'Auth rate limit exceeded (max 5 requests per second per IP).',
});

/**
 * Apply path-aware limits: webhook excluded by caller; AI stricter; auth separate; default general.
 */
export function pathAwareApiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl.split('?')[0] ?? '';
  if (path === '/health') {
    next();
    return;
  }
  if (path.startsWith('/api/ai/')) {
    aiGatewayRateLimiter(req, res, next);
    return;
  }
  if (path.startsWith('/api/auth/')) {
    authApiRateLimiter(req, res, next);
    return;
  }
  generalApiRateLimiter(req, res, next);
}
