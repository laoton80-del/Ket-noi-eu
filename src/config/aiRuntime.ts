/**
 * AI runtime switchboard (pilot-safe).
 * Default keeps current OpenAI production path unchanged.
 */
const GEMINI_LIVE_PILOT_ENABLED = process.env.EXPO_PUBLIC_GEMINI_LIVE_PILOT_ENABLED === '1';
const GEMINI_LIVE_PILOT_BACKEND_BASE = (process.env.EXPO_PUBLIC_GEMINI_LIVE_BACKEND_BASE ?? '').trim();

export type LiveInterpreterProvider = 'openai' | 'gemini_live_pilot';

export function preferredLiveInterpreterProvider(): LiveInterpreterProvider {
  return GEMINI_LIVE_PILOT_ENABLED ? 'gemini_live_pilot' : 'openai';
}

export function readGeminiLivePilotConfig() {
  return {
    enabled: GEMINI_LIVE_PILOT_ENABLED,
    backendBase: GEMINI_LIVE_PILOT_BACKEND_BASE,
  };
}
