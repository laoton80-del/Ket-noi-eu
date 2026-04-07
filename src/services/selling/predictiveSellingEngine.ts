import { INTERPRETER_SESSION_CREDITS } from '../liveInterpreterService';
import { calculateCallCreditPrice, calculateLeTanBookingPrice } from '../PaymentsService';
import { LIFEOS_LEGAL_LEONA_CREDITS } from '../../constants/lifeOSConversion';
import {
  isLifeOSActionOnCooldown,
  loadRecentLifeOSActions,
  markLifeOSAutoSuggestionShown,
  type LifeOSPredictAction,
  type LifeOSRecentAction,
} from './lifeosPredictionStorage';

export type PredictiveEngineLifeOSInput = {
  userCountry?: string;
  segment: 'adult' | 'child';
  visaExpiryDate: string | null;
  daysToExpiry: number | null;
  learningProgress: number;
  creditBalance: number;
};

export type UserState = {
  visaExpiry: string | null;
  daysToExpiry: number | null;
  recentActions: LifeOSRecentAction[];
  learningProgress: number;
  creditBalance: number;
  upcomingEvents: Array<{ type: 'visa_expiry'; date: string; daysLeft: number }>;
  segment: 'adult' | 'child';
  userCountry?: string;
};

export type AutoCTA = {
  message: string;
  actions: Array<{
    label: string;
    action: LifeOSPredictAction;
    credits: number;
  }>;
};

export async function getUserState(input: PredictiveEngineLifeOSInput): Promise<UserState> {
  const recentActions = await loadRecentLifeOSActions();
  const upcomingEvents: UserState['upcomingEvents'] = [];
  if (input.visaExpiryDate && typeof input.daysToExpiry === 'number') {
    upcomingEvents.push({
      type: 'visa_expiry',
      date: input.visaExpiryDate,
      daysLeft: input.daysToExpiry,
    });
  }
  return {
    visaExpiry: input.visaExpiryDate,
    daysToExpiry: input.daysToExpiry,
    recentActions,
    learningProgress: input.learningProgress,
    creditBalance: input.creditBalance,
    upcomingEvents,
    segment: input.segment,
    userCountry: input.userCountry,
  };
}

function recentCount(state: UserState, action: LifeOSPredictAction, withinMs: number): number {
  const now = Date.now();
  return state.recentActions.filter((a) => a.action === action && now - a.at <= withinMs).length;
}

export function predictNextAction(userState: UserState): LifeOSPredictAction | null {
  if (typeof userState.daysToExpiry === 'number' && userState.daysToExpiry <= 30) {
    return 'call_booking';
  }
  if (typeof userState.daysToExpiry === 'number' && userState.daysToExpiry <= 90 && userState.creditBalance >= 50) {
    return 'call_booking';
  }
  const interpRecent = recentCount(userState, 'interpreter', 48 * 60 * 60 * 1000);
  if (interpRecent === 0 && userState.segment === 'adult' && userState.learningProgress < 70 && userState.creditBalance >= INTERPRETER_SESSION_CREDITS) {
    return 'interpreter';
  }
  const assistRecent = recentCount(userState, 'call_assist', 48 * 60 * 60 * 1000);
  if (assistRecent === 0 && userState.creditBalance >= 20) {
    return 'call_assist';
  }
  return null;
}

export function generateAutoCTA(action: LifeOSPredictAction, userCountry?: string): AutoCTA {
  const leonaCost = calculateCallCreditPrice(userCountry).localAmount;
  const assistCost = calculateLeTanBookingPrice(userCountry).localAmount;
  if (action === 'call_booking') {
    return {
      message: `Sắp tới hạn giấy tờ — nên đặt lịch ngay để tránh rủi ro trễ hạn.`,
      actions: [
        { label: 'Gọi Leona đặt lịch', action: 'call_booking', credits: LIFEOS_LEGAL_LEONA_CREDITS || leonaCost },
      ],
    };
  }
  if (action === 'interpreter') {
    return {
      message: 'Bạn có thể mở phiên dịch ngay để xử lý hội thoại khó trước khi gọi điện.',
      actions: [{ label: 'Mở phiên dịch', action: 'interpreter', credits: INTERPRETER_SESSION_CREDITS }],
    };
  }
  return {
    message: 'Có thể mở Lễ tân để chốt nhanh nhu cầu gọi/đặt dịch vụ.',
    actions: [{ label: 'Mở Lễ tân', action: 'call_assist', credits: assistCost }],
  };
}

export async function buildLifeOSAutoCTAs(
  input: PredictiveEngineLifeOSInput,
  maxSuggestions = 2
): Promise<AutoCTA[]> {
  const state = await getUserState(input);
  const ranked: LifeOSPredictAction[] = [];
  const primary = predictNextAction(state);
  if (primary) ranked.push(primary);
  if (typeof state.daysToExpiry === 'number' && state.daysToExpiry <= 90 && !ranked.includes('call_booking')) {
    ranked.push('call_booking');
  }
  if (state.segment === 'adult' && state.learningProgress < 60 && !ranked.includes('interpreter')) {
    ranked.push('interpreter');
  }
  if (!ranked.includes('call_assist')) ranked.push('call_assist');

  const selected: LifeOSPredictAction[] = [];
  for (const action of ranked) {
    if (selected.length >= maxSuggestions) break;
    if (await isLifeOSActionOnCooldown(action)) continue;
    selected.push(action);
  }
  if (selected.length === 0) return [];
  await markLifeOSAutoSuggestionShown(selected);
  return selected.map((a) => generateAutoCTA(a, input.userCountry));
}
