import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';
import { STORAGE_SCHEMA_VERSION } from './storageVersion';

/**
 * Runs sequentially from `currentVersion + 1` to STORAGE_SCHEMA_VERSION.
 * Add functions here when keys or JSON shapes need one-time rewrites (avoid silent drift).
 */
export async function runStorageMigrations(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.schemaVersion);
    let current = Number(raw ?? 0);
    if (!Number.isFinite(current)) current = 0;
    if (current >= STORAGE_SCHEMA_VERSION) return;

    if (current < 1) {
      await AsyncStorage.setItem(STORAGE_KEYS.schemaVersion, '1');
      current = 1;
    }
    if (current < 2) {
      // v2: central registry + ownership docs only; no key renames (strings unchanged in code paths).
      await AsyncStorage.setItem(STORAGE_KEYS.schemaVersion, String(STORAGE_SCHEMA_VERSION));
    }
  } catch {
    // no-op, app should continue with defaults.
  }
}
