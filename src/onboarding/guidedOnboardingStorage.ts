import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, STORAGE_KEY_BUILDERS } from '../storage/storageKeys';

const INTENT_COMPLETED = STORAGE_KEYS.guidedIntentCompleted;
const MICRO_PREFIX = STORAGE_KEYS.guidedMicroPrefix;
const LETAN_AI_SEED = STORAGE_KEYS.guidedLeTanAiSeed;

export type GuidedIntentId = 'call_book' | 'language' | 'documents' | 'services';

export type GuidedMicroFeature = 'letan' | 'interpreter' | 'vault' | 'radar' | 'leona';

export async function isGuidedIntentEntryCompleted(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(INTENT_COMPLETED)) === '1';
  } catch {
    return true;
  }
}

export async function completeGuidedIntentEntry(): Promise<void> {
  await AsyncStorage.setItem(INTENT_COMPLETED, '1');
}

export async function resetGuidedOnboarding(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const toRemove = keys.filter(
    (k) =>
      k === INTENT_COMPLETED ||
      k === LETAN_AI_SEED ||
      k.startsWith(MICRO_PREFIX)
  );
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
}

export async function hasSeenMicroHint(feature: GuidedMicroFeature): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY_BUILDERS.guidedMicro(feature))) === '1';
  } catch {
    return true;
  }
}

export async function markMicroHintSeen(feature: GuidedMicroFeature): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_BUILDERS.guidedMicro(feature), '1');
}

/** One-line AI coach seed for Lễ tân after guided "call/book" path (consumed on LeTan mount). */
export async function setLeTanGuidedAiSeed(text: string): Promise<void> {
  await AsyncStorage.setItem(LETAN_AI_SEED, text);
}

export async function consumeLeTanGuidedAiSeed(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(LETAN_AI_SEED);
    await AsyncStorage.removeItem(LETAN_AI_SEED);
    return v?.trim() || null;
  } catch {
    return null;
  }
}
