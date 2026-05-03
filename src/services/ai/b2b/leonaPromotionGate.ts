/**
 * Leona hesitation path — only merchant-approved promos; never AI-invented discounts.
 */

export type LeonaHesitationOutcome =
  | Readonly<{
      kind: 'offer_preapproved';
      /** Staff HUD — Vietnamese, no JSON. */
      staffNoticeVi: string;
    }>
  | Readonly<{
      kind: 'needs_human_touch';
      staffNoticeVi: string;
      reason: 'policy_off' | 'below_threshold';
    }>;

export type LeonaPromotionPolicyInput = Readonly<{
  estimatedCartUsd: number;
  allowPreApprovedPromos: boolean;
  minCartUsd: number;
  promoCode: string;
  discountPercent: number;
}>;

export function resolveLeonaHesitation(input: LeonaPromotionPolicyInput): LeonaHesitationOutcome {
  const code = input.promoCode.trim().toUpperCase();
  const pct = Math.min(90, Math.max(0, input.discountPercent));
  const min = Math.max(0, input.minCartUsd);
  const cart = input.estimatedCartUsd;

  if (!input.allowPreApprovedPromos) {
    return {
      kind: 'needs_human_touch',
      reason: 'policy_off',
      staffNoticeVi:
        'Leona: Khách phân vân giá — chưa bật ưu đãi trước duyệt. Cần chủ tiệm (Needs Human Touch).',
    };
  }

  if (cart + 1e-6 < min) {
    return {
      kind: 'needs_human_touch',
      reason: 'below_threshold',
      staffNoticeVi: `Leona: Khách phân vân — giỏi ước ~$${cart.toFixed(0)} chưa đạt ngưỡng $${min.toFixed(0)}. Cần chủ tiệm.`,
    };
  }

  if (code.length === 0 || pct <= 0) {
    return {
      kind: 'needs_human_touch',
      reason: 'policy_off',
      staffNoticeVi:
        'Leona: Khách phân vân giá — chưa cấu hình mã ưu đãi hợp lệ. Cần chủ tiệm.',
    };
  }

  return {
    kind: 'offer_preapproved',
    staffNoticeVi: `Leona: Khách phân vân — đã gợi ý mã ${code} (-${pct}%) theo quy tắc chủ tiệm (giỏ ≥ $${min.toFixed(0)}).`,
  };
}
