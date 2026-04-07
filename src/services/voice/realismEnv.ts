import type { RealismEngineMode, RealismLevel } from './realismTypes';

/**
 * Client / Functions: toggle deterministic vs live realism without code changes.
 */
export function getVoiceRealismEngineConfig(): { mode: RealismEngineMode; level: RealismLevel } {
  const m = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_VOICE_REALISM_MODE
    ? process.env.EXPO_PUBLIC_VOICE_REALISM_MODE
    : 'live'
  ).toLowerCase();
  const mode: RealismEngineMode = m === 'deterministic' ? 'deterministic' : 'live';

  const raw = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_VOICE_REALISM_LEVEL
    ? process.env.EXPO_PUBLIC_VOICE_REALISM_LEVEL
    : 'medium'
  ).toLowerCase();
  const level: RealismLevel =
    raw === 'off' || raw === 'low' || raw === 'medium' || raw === 'high' ? raw : 'medium';

  return { mode, level };
}
