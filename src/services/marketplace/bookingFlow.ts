import { calculateCallCreditPrice } from '../PaymentsService';
import { trackGrowthEvent } from '../growth';
import { findBestService } from './marketplaceEngine';
import { trackMarketplaceTransaction } from './transactionTracking';
import type { MarketplaceBookingResult, MarketplaceBusinessType, MarketplaceUserContext } from './types';

export async function runMarketplaceAiBookingFlow(input: {
  userCountry?: string;
  userContext: MarketplaceUserContext;
}): Promise<MarketplaceBookingResult | null> {
  const { selected } = findBestService(input.userContext);
  if (!selected) return null;
  const feeCredits = calculateCallCreditPrice(input.userCountry).localAmount;
  const conversionValue = Math.max(1, Math.round(selected.rating * 10));
  const bookingId = `mkp-${Date.now()}`;
  const confirmationMessage = `Đã chốt lịch với ${selected.name}. Leona sẽ gọi xác nhận ngay.`;
  const outboundCallPrefill = [
    `Đặt lịch giúp tôi với ${selected.name}.`,
    `Loại dịch vụ: ${selected.businessType}.`,
    `Ưu tiên khung giờ gần nhất có sẵn.`,
    `Xác nhận giúp tên cơ sở và giờ hẹn.`,
  ].join(' ');

  await trackMarketplaceTransaction({
    bookingId,
    merchantId: selected.id,
    businessType: selected.businessType as MarketplaceBusinessType,
    status: 'confirmed',
    feeCredits,
    conversionValue,
    createdAt: Date.now(),
  });
  void trackGrowthEvent('successful_booking', {
    meta: { merchantId: selected.id, via: 'marketplace_auto' },
  });

  return {
    status: 'confirmed',
    merchantId: selected.id,
    feeCredits,
    conversionValue,
    outboundCallPrefill,
    confirmationMessage,
  };
}

export function buildMarketplaceSuggestion(userContext: MarketplaceUserContext): string | null {
  const match = findBestService(userContext).selected;
  if (!match) return null;
  const reasons = match.rankingReason.slice(0, 2).join(', ').toLowerCase();
  return `Đã gợi ý ${match.name} (${Math.round(match.distanceKm * 10) / 10}km, ${match.rating}/5) — ${reasons}.`;
}
