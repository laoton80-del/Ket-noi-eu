import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AggregatedBucket } from './types';
import { STORAGE_KEYS } from '../../storage/storageKeys';

const STORE_KEY = STORAGE_KEYS.networkEffectAggregates;

export async function loadAggregates(): Promise<Record<string, AggregatedBucket>> {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, AggregatedBucket>;
  } catch {
    return {};
  }
}

export async function saveAggregates(data: Record<string, AggregatedBucket>): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(data));
}
