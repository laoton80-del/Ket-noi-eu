import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { getPrisma } from '../lib/prisma';
import { jsonFail } from '../utils/apiEnvelope';

/**
 * Requires `authMiddleware` first (`req.authUserId`). Only `Role.BROKER` may proceed.
 */
export async function brokerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.authUserId;
    if (typeof userId !== 'string' || userId.length === 0) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== Role.BROKER) {
      jsonFail(res, 'Forbidden: broker role required', 403);
      return;
    }

    next();
  } catch {
    jsonFail(res, 'Forbidden', 403);
  }
}
