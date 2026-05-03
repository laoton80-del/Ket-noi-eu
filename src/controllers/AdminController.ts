import type { Request, Response } from 'express';

import { computeAdminTourismStats } from '../services/api/AdminTourismStatsService';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

export async function getTourismStats(_req: Request, res: Response): Promise<void> {
  try {
    const data = await computeAdminTourismStats();
    jsonOk(res, data);
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
