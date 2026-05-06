import * as FileSystem from 'expo-file-system/legacy';
import type { InterpreterDirection, InterpreterScenario } from '../config/aiPrompts';
import { buildLiveInterpreterTranslationUserContent } from '../config/aiPrompts';
import type { LiveInterpreterProvider } from '../config/aiRuntime';
import { preferredLiveInterpreterProvider, readGeminiLivePilotConfig } from '../config/aiRuntime';
import { getChatCompletion, transcribeAudio } from './OpenAIService';
import { ensureWalletFirebaseAuth, getWalletIdToken } from './walletFirebaseSession';
import { mergeTrustBackendHeaders } from '../utils/trustBackendHeaders';
import { devWarn } from '../utils/devLog';
import type { VoiceUserGender } from './voicePersona';

export type InterpreterProviderParams = {
  scenario: InterpreterScenario;
  direction: InterpreterDirection;
  assistantLanguageCode: string;
  userGender?: VoiceUserGender;
  userId?: string;
  countryCode?: string;
};

export type InterpreterCoreResult = {
  transcript: string;
  translation: string;
  provider: LiveInterpreterProvider;
  fallbackFromGemini: boolean;
};

async function openAiInterpreterTurn(audioUri: string, params: InterpreterProviderParams): Promise<InterpreterCoreResult> {
  const transcript = await transcribeAudio(audioUri);
  const userContent = buildLiveInterpreterTranslationUserContent(
    params.scenario,
    params.direction,
    params.assistantLanguageCode,
    transcript,
    params.countryCode
  );
  const translation = await getChatCompletion([{ role: 'user', content: userContent }], 'loan', {
    ...(params.userId ? { userId: params.userId } : {}),
    serviceContext: 'interpreter',
    activeScenario: params.scenario,
    networkContext: {
      actionType: 'interpreter',
      language: params.assistantLanguageCode,
      scenario: params.scenario,
    },
  });
  return {
    transcript,
    translation,
    provider: 'openai',
    fallbackFromGemini: false,
  };
}

function parseGeminiPilotPayload(payload: unknown): { transcript: string; translation: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { transcript?: unknown; translation?: unknown };
  const transcript = typeof p.transcript === 'string' ? p.transcript.trim() : '';
  const translation = typeof p.translation === 'string' ? p.translation.trim() : '';
  if (!translation) return null;
  return {
    transcript,
    translation,
  };
}

/**
 * Gemini Live pilot adapter:
 * - Architecture slice only. Requires a backend endpoint that actually proxies Gemini Live.
 * - If endpoint/config is missing or returns invalid data, caller must fallback to OpenAI provider.
 */
async function geminiLivePilotTurn(audioUri: string, params: InterpreterProviderParams): Promise<InterpreterCoreResult> {
  const cfg = readGeminiLivePilotConfig();
  if (!cfg.enabled) throw new Error('gemini_live_pilot_disabled');
  if (!cfg.backendBase) throw new Error('gemini_live_backend_base_missing');

  await ensureWalletFirebaseAuth();
  const token = await getWalletIdToken();
  if (!token) throw new Error('gemini_live_auth_missing');

  const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const headers = await mergeTrustBackendHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });
  const res = await fetch(`${cfg.backendBase}/aiGeminiLivePilot`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      op: 'interpreter_turn',
      mime: 'audio/mp4',
      base64Audio,
      scenario: params.scenario,
      direction: params.direction,
      assistantLanguageCode: params.assistantLanguageCode,
      countryCode: params.countryCode,
      userGender: params.userGender,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`gemini_live_http_${res.status}`);
  }
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    throw new Error('gemini_live_invalid_json');
  }
  const payload = parseGeminiPilotPayload(parsed);
  if (!payload) throw new Error('gemini_live_invalid_payload');
  return {
    transcript: payload.transcript,
    translation: payload.translation,
    provider: 'gemini_live_pilot',
    fallbackFromGemini: false,
  };
}

export async function runInterpreterTurnCore(audioUri: string, params: InterpreterProviderParams): Promise<InterpreterCoreResult> {
  const preferred = preferredLiveInterpreterProvider();
  if (preferred !== 'gemini_live_pilot') {
    return openAiInterpreterTurn(audioUri, params);
  }
  try {
    return await geminiLivePilotTurn(audioUri, params);
  } catch (error) {
    devWarn('live_interpreter_provider', 'gemini_live_pilot_fallback_to_openai', {
      reason: error instanceof Error ? error.message : String(error),
    });
    const fallback = await openAiInterpreterTurn(audioUri, params);
    return {
      ...fallback,
      fallbackFromGemini: true,
    };
  }
}
