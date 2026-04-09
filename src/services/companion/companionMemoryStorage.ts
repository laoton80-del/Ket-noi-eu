import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackHabitSignal } from '../moat';
import { STORAGE_KEYS } from '../../storage/storageKeys';

export type CompanionActionType = 'learning' | 'call_help' | 'interpreter' | 'call_assist' | 'radar';

export type CompanionMemory = {
  recentActions: { action: CompanionActionType; at: number }[];
  preferences: {
    preferredMode: 'learning' | 'calls' | 'mixed';
    tone: 'friendly' | 'supportive';
  };
  recurringNeeds: string[];
  lastShownAt: number | null;
  lastMessageKey: string | null;
};

const KEY = STORAGE_KEYS.companionMemory;
const MAX_ACTIONS = 20;

const defaultMemory: CompanionMemory = {
  recentActions: [],
  preferences: { preferredMode: 'mixed', tone: 'friendly' },
  recurringNeeds: [],
  lastShownAt: null,
  lastMessageKey: null,
};

export async function loadCompanionMemory(): Promise<CompanionMemory> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultMemory;
    const parsed = JSON.parse(raw) as Partial<CompanionMemory>;
    const recentActions = Array.isArray(parsed.recentActions)
      ? parsed.recentActions
          .filter((x) => x && typeof x.at === 'number' && typeof x.action === 'string')
          .slice(-MAX_ACTIONS) as CompanionMemory['recentActions']
      : [];
    return {
      ...defaultMemory,
      ...parsed,
      recentActions,
      preferences: { ...defaultMemory.preferences, ...(parsed.preferences ?? {}) },
      recurringNeeds: Array.isArray(parsed.recurringNeeds) ? parsed.recurringNeeds.slice(0, 8) : [],
      lastShownAt: typeof parsed.lastShownAt === 'number' ? parsed.lastShownAt : null,
      lastMessageKey: typeof parsed.lastMessageKey === 'string' ? parsed.lastMessageKey : null,
    };
  } catch {
    return defaultMemory;
  }
}

async function save(memory: CompanionMemory): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(memory));
}

function inferPreferredMode(actions: CompanionMemory['recentActions']): CompanionMemory['preferences']['preferredMode'] {
  const recent = actions.slice(-8);
  const learningCount = recent.filter((a) => a.action === 'learning').length;
  const callCount = recent.filter((a) => a.action === 'call_help' || a.action === 'call_assist').length;
  if (learningCount >= callCount + 2) return 'learning';
  if (callCount >= learningCount + 2) return 'calls';
  return 'mixed';
}

export async function noteCompanionAction(action: CompanionActionType): Promise<CompanionMemory> {
  const current = await loadCompanionMemory();
  const nextActions = [...current.recentActions, { action, at: Date.now() }].slice(-MAX_ACTIONS);
  const next: CompanionMemory = {
    ...current,
    recentActions: nextActions,
    preferences: {
      ...current.preferences,
      preferredMode: inferPreferredMode(nextActions),
    },
  };
  await save(next);
  return next;
}

export async function markCompanionShown(messageKey: string): Promise<CompanionMemory> {
  const current = await loadCompanionMemory();
  const next: CompanionMemory = {
    ...current,
    lastShownAt: Date.now(),
    lastMessageKey: messageKey,
  };
  await save(next);
  void trackHabitSignal({
    streakDays: 0,
    dailyAction: `companion:${messageKey}`,
    companionShown: true,
    at: Date.now(),
  });
  return next;
}

export async function updateCompanionRecurringNeeds(needs: string[]): Promise<CompanionMemory> {
  const current = await loadCompanionMemory();
  const next: CompanionMemory = {
    ...current,
    recurringNeeds: [...new Set(needs)].slice(0, 8),
  };
  await save(next);
  return next;
}
