import type { NextFunction, Request, Response } from 'express';

import { jsonFail } from '../utils/apiEnvelope';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, number[]>();

function prune(tsList: number[], now: number): number[] {
  const cutoff = now - WINDOW_MS;
  return tsList.filter((t) => t > cutoff);
}

/**
 * In-memory limiter for POST /api/wallet/transfer (per authenticated user, rolling 1-minute window).
 * Not suitable for multi-instance production without a shared store — replace with Redis for scale.
 */
export function walletTransferRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.authUserId;
  if (typeof userId !== 'string' || userId.length === 0) {
    next();
    return;
  }

  const now = Date.now();
  const prev = buckets.get(userId) ?? [];
  const recent = prune(prev, now);

  if (recent.length >= MAX_REQUESTS) {
    jsonFail(res, 'Transfer rate limit exceeded (max 5 per minute). Try again shortly.', 429);
    return;
  }

  recent.push(now);
  buckets.set(userId, recent);
  next();
}
