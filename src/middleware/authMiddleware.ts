import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

import { jsonFail } from '../utils/apiEnvelope';

type JwtBody = Readonly<{
  sub?: unknown;
}>;

function readBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const m = authorization.match(/^Bearer\s+(.+)$/i);
  const raw = m?.[1]?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = readBearerToken(req.headers.authorization);
    if (!token) {
      jsonFail(res, 'Missing or invalid Authorization header', 401);
      return;
    }

    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
      jsonFail(res, 'Server misconfiguration', 500);
      return;
    }

    const decoded: unknown = jwt.verify(token, secret);
    if (typeof decoded !== 'object' || decoded === null) {
      jsonFail(res, 'Invalid token', 401);
      return;
    }

    const sub = (decoded as JwtBody).sub;
    if (typeof sub !== 'string' || sub.length === 0) {
      jsonFail(res, 'Invalid token', 401);
      return;
    }

    req.authUserId = sub;
    next();
  } catch {
    jsonFail(res, 'Unauthorized', 401);
  }
}
