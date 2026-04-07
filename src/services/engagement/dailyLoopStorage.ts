import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackHabitSignal } from '../moat';
import { STORAGE_KEYS } from '../../storage/storageKeys';

export type DailyLoopAction = 'learning' | 'call_help' | 'interpreter' | 'call_assist' | 'none';

export type DailyLoopState = {
  lastOpen: string | null;
  streakDays: number;
  lastAction: DailyLoopAction;
};

const KEY = STORAGE_KEYS.dailyLoop;

function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function dayDiff(fromDay: string, toDay: string): number {
  const a = new Date(`${fromDay}T00:00:00Z`).getTime();
  const b = new Date(`${toDay}T00:00:00Z`).getTime();
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

export async function loadDailyLoopState(): Promise<DailyLoopState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { lastOpen: null, streakDays: 0, lastAction: 'none' };
    const parsed = JSON.parse(raw) as Partial<DailyLoopState>;
    return {
      lastOpen: typeof parsed.lastOpen === 'string' ? parsed.lastOpen : null,
      streakDays: typeof parsed.streakDays === 'number' ? Math.max(0, parsed.streakDays) : 0,
      lastAction:
        parsed.lastAction === 'learning' ||
        parsed.lastAction === 'call_help' ||
        parsed.lastAction === 'interpreter' ||
        parsed.lastAction === 'call_assist'
          ? parsed.lastAction
          : 'none',
    };
  } catch {
    return { lastOpen: null, streakDays: 0, lastAction: 'none' };
  }
}

export async function markDailyOpen(now = new Date()): Promise<DailyLoopState> {
  const current = await loadDailyLoopState();
  const today = todayKey(now);
  let streak = current.streakDays;
  if (!current.lastOpen) {
    streak = 1;
  } else {
    const d = dayDiff(current.lastOpen, today);
    if (d === 0) {
      streak = current.streakDays;
    } else if (d === 1) {
      streak = current.streakDays + 1;
    } else {
      streak = 1;
    }
  }
  const next: DailyLoopState = {
    ...current,
    lastOpen: today,
    streakDays: streak,
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  void trackHabitSignal({
    streakDays: next.streakDays,
    dailyAction: next.lastAction,
    companionShown: false,
    at: now.getTime(),
  });
  return next;
}

export async function markDailyAction(action: DailyLoopAction): Promise<DailyLoopState> {
  const current = await loadDailyLoopState();
  const next: DailyLoopState = { ...current, lastAction: action };
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  void trackHabitSignal({
    streakDays: next.streakDays,
    dailyAction: action,
    companionShown: false,
    at: Date.now(),
  });
  return next;
}
