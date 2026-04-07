import { loadRecentLifeOSActions } from '../selling/lifeosPredictionStorage';
import {
  loadCompanionMemory,
  markCompanionShown,
  updateCompanionRecurringNeeds,
  type CompanionMemory,
} from './companionMemoryStorage';
import { adaptResponse, getAIIdentity, updateAIIdentityRecurringNeeds } from '../identity';
import { getNetworkPromptHints } from '../networkEffect';

export type CompanionUserState = {
  userId?: string;
  segment: 'adult' | 'child';
  lowCredit: boolean;
  urgentVisa: boolean;
  holidayActions: string[];
  streakDays: number;
};

export type CompanionMessageResult = {
  messageKey: string;
  message: string;
  suggestedActions: string[];
};

export const COMPANION_COOLDOWN_MS = 8 * 60 * 60 * 1000;

function recurringNeedsFromState(state: CompanionUserState, memory: CompanionMemory): string[] {
  const out = new Set<string>(memory.recurringNeeds);
  if (state.urgentVisa) out.add('visa_followup');
  if (state.lowCredit) out.add('low_credit');
  if (state.segment === 'child') out.add('kids_learning');
  return [...out].slice(0, 8);
}

function buildMessage(state: CompanionUserState, memory: CompanionMemory, predictedActionHint?: string): CompanionMessageResult {
  if (state.urgentVisa) {
    return {
      messageKey: 'visa_support',
      message: 'Mình thấy hồ sơ của bạn đang gần hạn. Mình luôn ở đây để giúp bạn xử lý nhẹ nhàng từng bước.',
      suggestedActions: ['Gọi hỗ trợ gia hạn', 'Mở phiên dịch chuẩn bị cuộc gọi'],
    };
  }
  if (state.segment === 'child') {
    return {
      messageKey: 'kids_learning',
      message: 'Hôm nay mình có thể giúp bé giải 1 bài tập nhỏ theo từng bước thật dễ hiểu.',
      suggestedActions: ['Quét bài tập cho bé', 'Mở học tập'],
    };
  }
  if (state.lowCredit) {
    return {
      messageKey: 'low_credit_support',
      message: 'Mình muốn giữ trải nghiệm mượt cho bạn. Nạp nhẹ một ít Credits để không bị ngắt quãng nhé.',
      suggestedActions: ['Nạp Credits', 'Làm 1 việc nhanh ít tốn phí'],
    };
  }
  const modeHint =
    memory.preferences.preferredMode === 'learning'
      ? 'Mình gợi ý bạn dành 5 phút học.'
      : memory.preferences.preferredMode === 'calls'
        ? 'Mình gợi ý bạn chốt một cuộc gọi quan trọng.'
        : 'Mình gợi ý một việc nhỏ để giữ nhịp mỗi ngày.';
  return {
    messageKey: 'daily_support',
    message: `${modeHint}${predictedActionHint ? ` ${predictedActionHint}` : ''}`,
    suggestedActions: ['Phiên dịch nhanh', 'Hỗ trợ cuộc gọi'],
  };
}

/**
 * Friendly lightweight companion output (1-2 action hints), cooldown-protected.
 */
export async function generateCompanionMessage(
  userState: CompanionUserState
): Promise<{ message: string; suggestedActions: string[] }> {
  const memory = await loadCompanionMemory();
  const recentLifeOS = await loadRecentLifeOSActions();
  const predictedActionHint =
    recentLifeOS.length > 0
      ? recentLifeOS[recentLifeOS.length - 1]?.action === 'interpreter'
        ? 'Nếu muốn, mình giúp bạn chuyển sang bước gọi xác nhận ngay.'
        : undefined
      : undefined;
  const candidate = buildMessage(userState, memory, predictedActionHint);
  const networkHints = await getNetworkPromptHints({
    actionType: userState.urgentVisa ? 'booking' : 'call',
    language: 'vi',
    scenario: userState.urgentVisa ? 'visa_followup' : 'daily_support',
  });
  const tunedActions =
    networkHints.successRate !== null && networkHints.successRate < 0.6
      ? candidate.suggestedActions.slice(0, 1)
      : candidate.suggestedActions;
  const now = Date.now();
  const onCooldown = memory.lastShownAt !== null && now - memory.lastShownAt < COMPANION_COOLDOWN_MS;
  const repeated = memory.lastMessageKey === candidate.messageKey;

  if (onCooldown && repeated) {
    // no-spam fallback
    return {
      message: 'Mình vẫn đang theo dõi để nhắc bạn đúng lúc, không làm phiền quá nhiều.',
      suggestedActions: tunedActions.slice(0, 1),
    };
  }

  const recurring = recurringNeedsFromState(userState, memory);
  void updateCompanionRecurringNeeds(recurring);
  if (userState.userId) {
    void updateAIIdentityRecurringNeeds(userState.userId, recurring);
  }
  const identity = userState.userId ? await getAIIdentity(userState.userId) : null;
  if (recurring.length) {
    void markCompanionShown(candidate.messageKey);
    return {
      message: identity ? adaptResponse(candidate.message, identity) : candidate.message,
      suggestedActions: tunedActions.slice(0, 2),
    };
  }
  void markCompanionShown(candidate.messageKey);
  return {
    message: identity ? adaptResponse(candidate.message, identity) : candidate.message,
    suggestedActions: tunedActions.slice(0, 2),
  };
}
