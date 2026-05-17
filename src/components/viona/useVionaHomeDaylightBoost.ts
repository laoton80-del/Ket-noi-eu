import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'viona.daylightBoost.v1';

function readStored(): boolean {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') return false;
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStored(next: boolean): void {
  if (Platform.OS !== 'web' || typeof globalThis.localStorage === 'undefined') return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Home-only Daylight Boost (web localStorage). Default off; no backend sync.
 * Native keeps in-session memory only (no AsyncStorage in MVP).
 */
export function useVionaHomeDaylightBoost(): readonly [boolean, Dispatch<SetStateAction<boolean>>] {
  const [daylightBoost, setDaylightBoost] = useState(() => readStored());

  const setPersisted = useCallback((next: SetStateAction<boolean>) => {
    setDaylightBoost((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: boolean) => boolean)(prev) : next;
      writeStored(resolved);
      return resolved;
    });
  }, []);

  return [daylightBoost, setPersisted] as const;
}
