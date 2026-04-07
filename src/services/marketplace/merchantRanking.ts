import type { MarketplaceMerchant, MarketplaceRankedMerchant, MarketplaceUserContext } from './types';

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function scoreMerchant(m: MarketplaceMerchant, ctx: MarketplaceUserContext): MarketplaceRankedMerchant {
  const distanceScore = clamp01(1 - m.distanceKm / 8);
  const ratingScore = clamp01((m.rating - 3.5) / 1.5);
  const availabilityScore = m.available ? 1 : 0;
  const typeScore = m.businessType === ctx.businessType ? 1 : ctx.businessType === 'general' ? 0.6 : 0.2;
  const aiBookingScore = m.supportsAiBooking ? 1 : 0.4;

  const score =
    distanceScore * 0.2 +
    ratingScore * 0.25 +
    availabilityScore * 0.25 +
    typeScore * 0.2 +
    aiBookingScore * 0.1;

  const reasons: string[] = [];
  if (m.available) reasons.push('Sẵn lịch');
  if (m.rating >= 4.7) reasons.push('Đánh giá cao');
  if (m.distanceKm <= 2) reasons.push('Gần bạn');
  if (m.supportsAiBooking) reasons.push('Hỗ trợ đặt lịch nhanh');
  return {
    ...m,
    score: Math.round(score * 1000) / 1000,
    rankingReason: reasons,
  };
}

export function rankMerchants(
  merchants: MarketplaceMerchant[],
  ctx: MarketplaceUserContext
): MarketplaceRankedMerchant[] {
  return merchants.map((m) => scoreMerchant(m, ctx)).sort((a, b) => b.score - a.score);
}
