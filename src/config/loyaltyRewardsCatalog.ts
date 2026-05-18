import type { LoyaltyRewardDefinition } from '../types/loyalty';

/** Redeemable catalog — copy tuned for conversion; fulfillment hooks to wallet / partners TBD. */
export const LOYALTY_REWARDS_CATALOG: readonly LoyaltyRewardDefinition[] = [
  {
    id: 'voucher_pho_10',
    titleVi: 'Voucher 10% Quán Phở đối tác',
    subtitleVi: 'Áp dụng chi nhánh tham gia VIONA Local (demo).',
    vigTokenCost: 350,
    kind: 'voucher',
  },
  {
    id: 'ai_mkhang_15min',
    titleVi: 'Tặng 15 phút gọi AI Minh Khang',
    subtitleVi: 'Ưu đãi phiên dịch / tổng đài — trừ trong hạn mức demo.',
    vigTokenCost: 500,
    kind: 'ai_minutes',
  },
  {
    id: 'vig_100_ai',
    titleVi: '100 VIO Credits gọi AI',
    subtitleVi: 'VIO Credits trong app (demo) — không phải tiền mặt, crypto hay rút được; mở khóa trong app.',
    vigTokenCost: 1_200,
    kind: 'vig_tokens',
  },
  {
    id: 'travel_lounge_pass',
    titleVi: 'Travel Pass Lounge (mock)',
    subtitleVi: 'Ưu tiên hàng chờ VIONA Travel Lite — xem trước lead vé & homestay (demo).',
    vigTokenCost: 2_800,
    kind: 'travel_perk',
  },
] as const;

export function findLoyaltyRewardById(rewardId: string): LoyaltyRewardDefinition | undefined {
  return LOYALTY_REWARDS_CATALOG.find((r) => r.id === rewardId);
}
