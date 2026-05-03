import { PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import {
  ensureMerchantHoneymoonProfile,
  getEffectiveBidPowerNow,
} from './GrowthHookService';

export type MerchantAdBid = Readonly<{
  merchantId: string;
  dailyBudgetMajor: number;
  bidPerPriorityImpressionMajor: number;
  walletBalanceMajorBefore: number;
  walletBalanceMajorAfter: number;
  active: boolean;
  updatedAtIso: string;
}>;

export type UpsertMerchantAdBidInput = Readonly<{
  merchantId: string;
  dailyBudgetMajor: number;
  bidPerPriorityImpressionMajor: number;
}>;

export type UpsertMerchantAdBidResult =
  | Readonly<{ ok: true; row: MerchantAdBid; currency: typeof PRICING_BASELINE_CURRENCY }>
  | Readonly<{ ok: false; code: 'invalid_input' | 'insufficient_wallet_balance'; messageVi: string }>;

const DEFAULT_WALLET_MAJOR = 250;
const PAYMENTS_API_BASE = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? '';

const walletByMerchant = new Map<string, number>();
const bidsByMerchant = new Map<string, MerchantAdBid>();

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function normalizePositive(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  return round2(v);
}

export function getMerchantWalletMajor(merchantId: string): number {
  const id = merchantId.trim();
  if (id.length === 0) return 0;
  ensureMerchantHoneymoonProfile({ merchantId: id });
  const cached = walletByMerchant.get(id);
  if (typeof cached === 'number') return cached;
  walletByMerchant.set(id, DEFAULT_WALLET_MAJOR);
  return DEFAULT_WALLET_MAJOR;
}

/**
 * Activates/updates a merchant's ad bid and deducts the daily budget from mock Stripe wallet.
 */
export function upsertMerchantAdBid(input: UpsertMerchantAdBidInput): UpsertMerchantAdBidResult {
  const merchantId = input.merchantId.trim();
  const dailyBudgetMajor = normalizePositive(input.dailyBudgetMajor);
  const bidPerPriorityImpressionMajor = normalizePositive(input.bidPerPriorityImpressionMajor);
  if (merchantId.length === 0 || dailyBudgetMajor <= 0 || bidPerPriorityImpressionMajor <= 0) {
    return { ok: false, code: 'invalid_input', messageVi: 'Dữ liệu ngân sách hoặc bid không hợp lệ.' };
  }
  const before = getMerchantWalletMajor(merchantId);
  if (before < dailyBudgetMajor) {
    return {
      ok: false,
      code: 'insufficient_wallet_balance',
      messageVi: 'Ví Stripe B2B không đủ số dư để kích hoạt chiến dịch.',
    };
  }
  const after = round2(before - dailyBudgetMajor);
  walletByMerchant.set(merchantId, after);
  const row: MerchantAdBid = {
    merchantId,
    dailyBudgetMajor,
    bidPerPriorityImpressionMajor,
    walletBalanceMajorBefore: before,
    walletBalanceMajorAfter: after,
    active: true,
    updatedAtIso: new Date().toISOString(),
  };
  bidsByMerchant.set(merchantId, row);
  return { ok: true, row, currency: PRICING_BASELINE_CURRENCY };
}

export function getActiveBidForMerchant(merchantId: string): MerchantAdBid | null {
  const id = merchantId.trim();
  const row = bidsByMerchant.get(id);
  if (!row || !row.active) return null;
  const freePower = getEffectiveBidPowerNow(id);
  if (freePower <= 0) return row;
  return {
    ...row,
    bidPerPriorityImpressionMajor: Math.max(row.bidPerPriorityImpressionMajor, freePower),
  };
}

export function getEffectiveAdBidPowerForMerchant(merchantId: string): number {
  const id = merchantId.trim();
  const paidBid = bidsByMerchant.get(id)?.bidPerPriorityImpressionMajor ?? 0;
  const honeymoonBid = getEffectiveBidPowerNow(id);
  return Math.max(paidBid, honeymoonBid);
}

export function resetBidPowerToZeroIfHoneymoonExpired(merchantId: string): void {
  const id = merchantId.trim();
  if (id.length === 0) return;
  const honeymoonBid = getEffectiveBidPowerNow(id);
  if (honeymoonBid > 0) return;
  const row = bidsByMerchant.get(id);
  if (!row) return;
  bidsByMerchant.set(id, {
    ...row,
    active: false,
    bidPerPriorityImpressionMajor: 0,
    updatedAtIso: new Date().toISOString(),
  });
}

export function listActiveAdBids(): MerchantAdBid[] {
  return Array.from(bidsByMerchant.values())
    .filter((r) => r.active)
    .sort((a, b) => b.bidPerPriorityImpressionMajor - a.bidPerPriorityImpressionMajor);
}

export async function getAdBidProjection(merchantId: string): Promise<MerchantAdBid | null> {
  const id = merchantId.trim();
  if (!PAYMENTS_API_BASE || id.length === 0) return getActiveBidForMerchant(id);
  try {
    const res = await fetch(
      `${PAYMENTS_API_BASE}/b2b/merchant/ad-bid-projection?merchantId=${encodeURIComponent(id)}`,
      { method: 'GET', headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return getActiveBidForMerchant(id);
    const row = (await res.json()) as MerchantAdBid;
    if (!row || row.merchantId !== id) return getActiveBidForMerchant(id);
    return row;
  } catch {
    return getActiveBidForMerchant(id);
  }
}
