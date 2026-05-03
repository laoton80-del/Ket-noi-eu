import type { Request, Response } from 'express';

import { getCharityLedgerTotals } from '../services/api/LedgerService';
import { jsonOk } from '../utils/apiEnvelope';

/**
 * Public aggregate — **CharityLedgerEntry** sum only (no mock math).
 */
export async function getTotals(_req: Request, res: Response): Promise<void> {
  const totals = await getCharityLedgerTotals();
  jsonOk(res, {
    totalUsd: totals.totalUsd,
    totalCharityVig: totals.totalCharityVig,
    rowCount: totals.rowCount,
    updatedAtIso: totals.updatedAtIso,
  });
}
