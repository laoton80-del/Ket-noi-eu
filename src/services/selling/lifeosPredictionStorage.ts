import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, STORAGE_KEY_BUILDERS } from '../../storage/storageKeys';

export type LifeOSPredictAction = 'call_booking' | 'interpreter' | 'call_assist';

export type LifeOSRecentAction = {
  action: LifeOSPredictAction;
  at: number;
};

const RECENT_ACTIONS_KEY = STORAGE_KEYS.lifeOsRecentActions;

export const LIFEOS_AUTO_SUGGEST_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours
const MAX_RECENT_ACTIONS = 10;

function toAtSafe(v: unknown): number | null {
  const n = typeof v === 'number' ? v : null;
  if (typeof n !== 'number') return null;
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function loadRecentLifeOSActions(): Promise<LifeOSRecentAction[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_ACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<LifeOSRecentAction>[];
    const cleaned: LifeOSRecentAction[] = [];
    for (const item of parsed) {
      if (!item?.action) continue;
      if (!['call_booking', 'interpreter', 'call_assist'].includes(item.action)) continue;
      const at = toAtSafe(item.at);
      if (!at) continue;
      cleaned.push({ action: item.action, at });
    }
    return cleaned.slice(-MAX_RECENT_ACTIONS);
  } catch {
    return [];
  }
}

export async function recordLifeOSRecentAction(action: LifeOSPredictAction): Promise<void> {
  const now = Date.now();
  const prev = await loadRecentLifeOSActions();
  const next = [...prev, { action, at: now }].slice(-MAX_RECENT_ACTIONS);
  await AsyncStorage.setItem(RECENT_ACTIONS_KEY, JSON.stringify(next));
}

export async function loadLastSuggestedAt(action: LifeOSPredictAction): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BUILDERS.lifeOsSuggestionCooldown(action));
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function markLifeOSAutoSuggestionShown(actions: LifeOSPredictAction[]): Promise<void> {
  const now = Date.now();
  await Promise.all(
    actions.map(async (a) => {
      await AsyncStorage.setItem(STORAGE_KEY_BUILDERS.lifeOsSuggestionCooldown(a), String(now));
    })
  );
}

export async function isLifeOSActionOnCooldown(
  action: LifeOSPredictAction,
  now = Date.now(),
  cooldownMs = LIFEOS_AUTO_SUGGEST_COOLDOWN_MS
): Promise<boolean> {
  const last = await loadLastSuggestedAt(action);
  if (!last) return false;
  return now - last < cooldownMs;
}

