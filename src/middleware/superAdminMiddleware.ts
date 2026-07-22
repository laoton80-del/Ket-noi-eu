/**
 * Requires `authMiddleware` first (`req.authUserId`). Only `Role.ADMIN` may proceed.
 *
 * Optional 4th-arg deps are for deterministic tests only. Express route registration
 * passes three arguments, so production always resolves to Prisma.
 */
import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { getPrisma } from '../lib/prisma';
import { jsonFail } from '../utils/apiEnvelope';

export type SuperAdminMiddlewareDeps = Readonly<{
  findUserRole: (userId: string) => Promise<Role | null>;
}>;

function resolveSuperAdminDeps(deps?: SuperAdminMiddlewareDeps): SuperAdminMiddlewareDeps {
  if (deps) return deps;
  return {
    async findUserRole(userId: string) {
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      return user?.role ?? null;
    },
  };
}

export async function superAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
  deps?: SuperAdminMiddlewareDeps
): Promise<void> {
  try {
    const userId = req.authUserId;
    if (typeof userId !== 'string' || userId.length === 0) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const role = await resolveSuperAdminDeps(deps).findUserRole(userId);
    if (role !== Role.ADMIN) {
      jsonFail(res, 'Forbidden: super-admin role required', 403);
      return;
    }

    next();
  } catch {
    jsonFail(res, 'Forbidden', 403);
  }
}
