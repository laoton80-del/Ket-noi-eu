import type { Request, Response } from 'express';

import { getPrisma } from '../lib/prisma';
import { calculateMerchantRankingStatus } from '../services/b2b/MerchantRankingService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readBusinessId(req: Request): string | null {
  const p = req.params.businessId;
  const raw = Array.isArray(p) ? p[0] : p;
  const t = typeof raw === 'string' ? raw.trim() : '';
  return t.length > 0 ? t : null;
}

/**
 * GET /api/business/ranking/me — first owned business for authenticated B2B user.
 */
export async function getMyBusinessRanking(req: Request, res: Response): Promise<void> {
  const userId = req.authUserId;
  if (!userId) {
    jsonFail(res, 'Unauthorized', 401);
    return;
  }

  try {
    const prisma = getPrisma();
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      orderBy: { joinedAt: 'asc' },
      select: { id: true },
    });

    if (!business) {
      jsonFail(res, 'No business profile for this account', 404);
      return;
    }

    const ranking = await calculateMerchantRankingStatus(business.id);
    jsonOk(res, ranking);
  } catch (e) {
    console.error('[business] ranking', e);
    jsonFail(res, 'Could not load ranking status', 500);
  }
}

/**
 * GET /api/business/:businessId/ranking — owner must match JWT `sub`.
 */
export async function getBusinessRankingById(req: Request, res: Response): Promise<void> {
  const userId = req.authUserId;
  if (!userId) {
    jsonFail(res, 'Unauthorized', 401);
    return;
  }

  const businessId = readBusinessId(req);
  if (!businessId) {
    jsonFail(res, 'businessId required', 400);
    return;
  }

  try {
    const prisma = getPrisma();
    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: userId },
      select: { id: true },
    });

    if (!business) {
      jsonFail(res, 'Business not found', 404);
      return;
    }

    const ranking = await calculateMerchantRankingStatus(business.id);
    jsonOk(res, ranking);
  } catch (e) {
    console.error('[business] ranking by id', e);
    jsonFail(res, 'Could not load ranking status', 500);
  }
}
