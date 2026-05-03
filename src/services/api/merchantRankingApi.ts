import type { MerchantRankingResult } from '../b2b/merchantRankingLogic';
import { restApiFetchJson } from '../apiClient';

/**
 * Authenticated: returns 90-day trap status for the merchant’s first `Business` row.
 */
export async function fetchMyBusinessRanking(): Promise<MerchantRankingResult | null> {
  const res = await restApiFetchJson<MerchantRankingResult>('/api/business/ranking/me');
  if (!res.ok) return null;
  return res.data;
}
