import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LearningAggregate, LearningSignal } from './types';

import { STORAGE_KEYS } from '../../storage/storageKeys';

const KEY = STORAGE_KEYS.moatLearningAggregates;

type Store = Record<string, LearningAggregate>;

async function load(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function save(data: Store): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function trackLearningSignal(signal: LearningSignal): Promise<void> {
  const data = await load();
  const prev = data[signal.key];
  const base: LearningAggregate =
    prev ??
    {
      key: signal.key,
      domain: signal.domain,
      total: 0,
      success: 0,
      failure: 0,
      avgDurationMs: 0,
      avgQualityScore: null,
      updatedAt: signal.occurredAt,
    };
  const total = base.total + 1;
  const duration = typeof signal.durationMs === 'number' && signal.durationMs > 0 ? signal.durationMs : 0;
  const avgDurationMs = Math.round((base.avgDurationMs * base.total + duration) / total);
  const nextQuality =
    typeof signal.qualityScore === 'number'
      ? Math.max(0, Math.min(1, signal.qualityScore))
      : null;
  const avgQualityScore =
    nextQuality === null
      ? base.avgQualityScore
      : base.avgQualityScore === null
        ? nextQuality
        : Math.round(((base.avgQualityScore * base.total + nextQuality) / total) * 1000) / 1000;
  data[signal.key] = {
    ...base,
    total,
    success: base.success + (signal.success ? 1 : 0),
    failure: base.failure + (signal.success ? 0 : 1),
    avgDurationMs,
    avgQualityScore,
    updatedAt: signal.occurredAt,
  };
  await save(data);
}
