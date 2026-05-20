import type { NextFunction, Request, Response } from 'express';

import {
  LOCAL_RATE_LIMIT_TOO_MANY_MESSAGE,
  tryConsumeLocalRateLimit,
  type LocalRateLimitAction,
} from '../services/local/localRateLimitGuard';
import { jsonFail } from '../utils/apiEnvelope';

export type LocalMutationRateLimiterOptions = Readonly<{
  /** When true, include `req.params.id` in the rate-limit bucket (per request). */
  scopeRequestId?: boolean;
}>;

function readRequestIdParam(req: Request): string | undefined {
  const raw = req.params.id;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * In-memory limiter for Local mutation routes (per authenticated user, sliding window).
 * Not suitable for multi-instance production without a shared store.
 */
export function createLocalMutationRateLimiter(
  action: LocalRateLimitAction,
  options?: LocalMutationRateLimiterOptions
): (req: Request, res: Response, next: NextFunction) => void {
  const scopeRequestId = options?.scopeRequestId === true;

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.authUserId;
    if (typeof userId !== 'string' || userId.length === 0) {
      next();
      return;
    }

    const requestId = scopeRequestId ? readRequestIdParam(req) : undefined;
    const allowed = tryConsumeLocalRateLimit(userId, action, requestId);
    if (!allowed) {
      jsonFail(res, LOCAL_RATE_LIMIT_TOO_MANY_MESSAGE, 429);
      return;
    }

    next();
  };
}
