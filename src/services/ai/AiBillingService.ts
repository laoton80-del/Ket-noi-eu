export type AiPersona = 'LEONA' | 'MINH_KHANG';

export const AI_LEONA_VIG_TOKENS_PER_MIN = 200 as const;
export const AI_MINH_KHANG_VIG_TOKENS_PER_MIN = 500 as const;

export type AiConsumptionEstimate = Readonly<{
  persona: AiPersona;
  minutes: number;
  vigTokensCost: number;
}>;

export type AiConsumeResult =
  | Readonly<{
      ok: true;
      vigTokensSpent: number;
      remainingVigTokenBalance: number;
    }>
  | Readonly<{
      ok: false;
      code: 'invalid_minutes' | 'insufficient_vig_tokens';
      message: string;
    }>;

function costPerMinute(persona: AiPersona): number {
  return persona === 'MINH_KHANG' ? AI_MINH_KHANG_VIG_TOKENS_PER_MIN : AI_LEONA_VIG_TOKENS_PER_MIN;
}

export function estimateAiConsumption(persona: AiPersona, minutes: number): AiConsumptionEstimate {
  const mins = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
  const vigTokensCost = Math.ceil(mins * costPerMinute(persona));
  return { persona, minutes: mins, vigTokensCost };
}

/**
 * Charges AI usage in VIG Tokens.
 */
export function consumeAiMinutesFromVigBalance(
  currentVigTokenBalance: number,
  persona: AiPersona,
  minutes: number
): AiConsumeResult {
  const estimate = estimateAiConsumption(persona, minutes);
  if (estimate.minutes <= 0) {
    return { ok: false, code: 'invalid_minutes', message: 'Số phút sử dụng không hợp lệ.' };
  }
  const current = Math.max(0, Math.floor(currentVigTokenBalance));
  if (current < estimate.vigTokensCost) {
    return {
      ok: false,
      code: 'insufficient_vig_tokens',
      message: `Số dư VIG Token không đủ. Cần ${estimate.vigTokensCost}, hiện có ${current}.`,
    };
  }
  return {
    ok: true,
    vigTokensSpent: estimate.vigTokensCost,
    remainingVigTokenBalance: current - estimate.vigTokensCost,
  };
}
