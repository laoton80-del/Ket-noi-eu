import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SellResume } from './sellingTypes';
import { STORAGE_KEYS } from '../../storage/storageKeys';

const PENDING_KEY = STORAGE_KEYS.sellPendingResume;

function isPilotAllowedSellResume(value: unknown): value is SellResume {
  if (!value || typeof value !== 'object') return false;
  const o = value as { route?: unknown; params?: unknown };
  if (o.route === 'LeonaCall') return typeof o.params === 'object' && o.params !== null;
  if (o.route === 'LiveInterpreter') return typeof o.params === 'object' && o.params !== null;
  if (o.route === 'Tabs') {
    const p = o.params as { screen?: unknown } | null;
    return !!p && typeof p === 'object' && p.screen === 'LeTan';
  }
  return false;
}

export async function setPendingSellResume(resume: SellResume): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(resume));
}

export async function consumePendingSellResume(): Promise<SellResume | null> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(PENDING_KEY);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPilotAllowedSellResume(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

