import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HabitSignal } from './types';

import { STORAGE_KEYS } from '../../storage/storageKeys';

const KEY = STORAGE_KEYS.moatHabitSignals;
const MAX_ITEMS = 120;

export async function trackHabitSignal(signal: HabitSignal): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as HabitSignal[]) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    const next = [...list, signal].slice(-MAX_ITEMS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
}
