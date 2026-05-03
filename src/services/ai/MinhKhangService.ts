/**
 * Minh Khang — AI Translation / Concierge for Tourism & legal-adjacent scenarios.
 *
 * **Travel Mode**: optimized for low-latency voice↔voice path — delegates live audio to `liveInterpreterService`
 * with scenario `travel`; this module owns text + vision glue + pricing visibility.
 *
 * **Vision**: menu / foreign document OCR+translate via vision-capable model (OpenAI `gpt-4o-mini` behind proxy)
 * with graceful offline mock when backend/auth unavailable.
 */

import { trackEvent } from '../AnalyticsService';
import { PRICING_AUTHORITY } from '../../config/pricingConfig';
import { getPersonaCapability } from '../../config/aiPersonaCapabilities';
import { isRestApiConfigured, restApiFetchJson } from '../apiClient';
import { analyzeImage, getChatCompletion } from '../OpenAIService';

export type MinhKhangTravelVoiceSessionInfo = {
  readonly mode: 'travel_low_latency';
  readonly creditsPerClockMinute: number;
  readonly recommendedInterpreterScenario: 'travel';
  readonly notesVi: string;
};

export type MinhKhangTextTranslationResult = {
  readonly translatedVi: string;
  readonly sourceLangGuess: string;
  /** `cached_server` = DB hit on API route; `openai_proxy` = live model (direct or API miss). */
  readonly provider: 'openai_proxy' | 'cached_server' | 'mock_offline';
};

export type MinhKhangVisionMenuResult = {
  readonly translationVi: string;
  readonly highlightsVi: readonly string[];
  readonly provider: 'openai_vision' | 'mock_offline';
};

const MENU_SYSTEM_PROMPT =
  'Bạn là Minh Khang — phiên dịch du lịch. Trả về JSON object duy nhất với keys: translation_vi (string đầy đủ), highlights (array string, tối đa 5 gạch đầu dòng ngắn). Không markdown ngoài JSON.';

const MENU_USER_PROMPT =
  'Dịch toàn bộ chữ trong ảnh sang tiếng Việt tự nhiên; giữ số tiền, đơn vị, và dị ứng nếu có.';

function phraseLengthBand(charCount: number): 'short' | 'medium' | 'long' {
  if (charCount <= 80) return 'short';
  if (charCount <= 400) return 'medium';
  return 'long';
}

function parseMenuJson(raw: string): { translationVi: string; highlightsVi: readonly string[] } {
  try {
    const parsed = JSON.parse(raw) as {
      translation_vi?: string;
      highlights?: unknown;
    };
    const translationVi =
      typeof parsed.translation_vi === 'string' && parsed.translation_vi.trim().length > 0
        ? parsed.translation_vi.trim()
        : raw;
    const highlightsVi = Array.isArray(parsed.highlights)
      ? parsed.highlights.filter((h): h is string => typeof h === 'string').slice(0, 5)
      : [];
    return { translationVi, highlightsVi };
  } catch {
    return { translationVi: raw, highlightsVi: [] };
  }
}

/** Credits debited per clock minute when Minh Khang live interpreter meter runs (see pricing SSOT). */
export function getMinhKhangInterpreterCreditsPerMinute(): number {
  return PRICING_AUTHORITY.b2cCredits.minhKhangLiveInterpreterPerMinCredits;
}

/** Prepare Travel Mode metadata before opening Live Interpreter / voice pipeline. */
export async function prepareTravelVoiceSession(): Promise<MinhKhangTravelVoiceSessionInfo> {
  const persona = getPersonaCapability('minh_khang');
  return {
    mode: 'travel_low_latency',
    creditsPerClockMinute: getMinhKhangInterpreterCreditsPerMinute(),
    recommendedInterpreterScenario: 'travel',
    notesVi:
      `Travel Mode: ưu tiên câu ngắn, giảm độ trễ — tuyến ${persona.telemetryTag} qua backend policy middleware.`,
  };
}

/**
 * Lightweight text translation for typed phrases (e.g. SMS / clipboard).
 * Production: route through same proxy as interpreter text fallback.
 */
export async function translateTravelPhrase(text: string, sourceLangHint: string): Promise<MinhKhangTextTranslationResult> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { translatedVi: '', sourceLangGuess: sourceLangHint, provider: 'mock_offline' };
  }

  if (isRestApiConfigured()) {
    const api = await restApiFetchJson<{ translatedText: string; fromCache: boolean }>(
      '/api/ai/translate/travel-phrase',
      { method: 'POST', body: { text: trimmed, sourceLangHint } }
    );
    if (api.ok) {
      return {
        translatedVi: api.data.translatedText,
        sourceLangGuess: sourceLangHint,
        provider: api.data.fromCache ? 'cached_server' : 'openai_proxy',
      };
    }
  }

  try {
    const out = await getChatCompletion(
      [
        {
          role: 'user',
          content:
            `Minh Khang — chỉ trả về bản dịch tiếng Việt thuần (một đoạn), không tiền tố hay giải thích. ` +
            `Ngôn ngữ nguồn gợi ý: ${sourceLangHint}.\n\n${trimmed}`,
        },
      ],
      'loan',
      { serviceContext: 'interpreter' }
    );
    trackEvent('travel_phrase_translation_used', {
      surface: 'client_llm_fallback',
      fromCache: false,
      inputLengthBand: phraseLengthBand(trimmed.length),
    });
    return {
      translatedVi: out.trim(),
      sourceLangGuess: sourceLangHint,
      provider: 'openai_proxy',
    };
  } catch {
    return {
      translatedVi: `[Offline/mock] ${trimmed}`,
      sourceLangGuess: sourceLangHint,
      provider: 'mock_offline',
    };
  }
}

/**
 * Vision translation for menus, museum plaques, tickets — uses multimodal `analyzeImage`.
 */
export async function translateForeignMenuOrDocument(imageBase64: string): Promise<MinhKhangVisionMenuResult> {
  const stripped = imageBase64.trim();
  if (stripped.length === 0) {
    return {
      translationVi: '',
      highlightsVi: [],
      provider: 'mock_offline',
    };
  }
  try {
    const raw = await analyzeImage(stripped, {
      systemPrompt: MENU_SYSTEM_PROMPT,
      userPrompt: MENU_USER_PROMPT,
    });
    const { translationVi, highlightsVi } = parseMenuJson(raw);
    return {
      translationVi,
      highlightsVi,
      provider: 'openai_vision',
    };
  } catch {
    return {
      translationVi:
        '[Vision offline/mock] Quét ảnh thực đơn — kết nối backend `aiProxy` + GPT-4o mini vision để dịch đầy đủ.',
      highlightsVi: ['Wi‑Fi backend để bật OCR đa ngôn ngữ', 'Travel Pass 7 ngày gồm Xu không đổi'],
      provider: 'mock_offline',
    };
  }
}
