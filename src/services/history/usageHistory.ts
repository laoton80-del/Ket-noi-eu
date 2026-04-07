import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../storage/storageKeys';

export type UsageHistoryType = 'call' | 'leona' | 'booking' | 'interpreter' | 'ocr' | 'emergency';
export type UsageHistoryItem = {
  id: string;
  type: UsageHistoryType;
  status: 'success' | 'failed';
  createdAt: number;
  note?: string;
};

const KEY = STORAGE_KEYS.usageHistory;
const MAX_ITEMS = 200;

export async function appendUsageHistory(item: Omit<UsageHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const prev = raw ? ((JSON.parse(raw) as UsageHistoryItem[]) || []) : [];
    const next: UsageHistoryItem = {
      id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      ...item,
    };
    const merged = [...prev, next].slice(-MAX_ITEMS);
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // no-op
  }
}

export async function loadUsageHistory(limit = 40): Promise<UsageHistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UsageHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-Math.max(1, limit)).reverse();
  } catch {
    return [];
  }
}
