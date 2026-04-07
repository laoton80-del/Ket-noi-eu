import type { InterpreterDirection, InterpreterScenario } from '../config/aiPrompts';
import { buildLiveInterpreterTranslationUserContent } from '../config/aiPrompts';
import {
  getVoiceRealismEngineConfig,
  humanizeSpokenResponse,
  openAiVoiceFromPersona,
  resolveVoicePersona,
} from './voice';
import { interpreterScenarioToVoiceScenario } from './voicePersona';
import type { VoiceUserGender } from './voicePersona';
import { generateSpeech, getChatCompletion, transcribeAudio } from './OpenAIService';
import { detectIntent } from './ai/intentDetection';
import { maybeGenerateSellCTA } from './selling/sellEngine';
import type { SellCTA } from './selling/sellingTypes';
import { defaultPatternIdFor, trackNetworkEffectEvent } from './networkEffect';
import { getAssistantSettings } from '../state/assistantSettings';

export type InterpreterTurnResult = {
  transcript: string;
  translation: string;
  translationForDisplay: string;
  sellCta?: SellCTA | null;
  /** TTS file URI or null */
  spokenUri: string | null;
};

/** Flat fee per interpreter session (deducted once when session starts). */
export const INTERPRETER_SESSION_CREDITS = 25;

/** Hard cap on session length (cost control + UX). */
export const INTERPRETER_MAX_SESSION_MINUTES = 8;
export const INTERPRETER_MAX_SESSION_MS = INTERPRETER_MAX_SESSION_MINUTES * 60 * 1000;

/**
 * If user completes at least one turn then stays idle (no new utterance) for this long, session auto-ends.
 */
export const INTERPRETER_SILENCE_AUTO_END_MS = 120_000;

/** Prepared for future persistence / analytics (local or backend). */
export type LiveInterpreterSessionSnapshot = {
  scenario: InterpreterScenario;
  durationMs: number;
  turns: number;
  endedByUser: boolean;
};

/**
 * audio → Whisper STT → Minh Khang (persona `loan`) translation prompt → TTS playback URI.
 */
export async function runInterpreterTurn(
  audioUri: string,
  params: {
    scenario: InterpreterScenario;
    direction: InterpreterDirection;
    assistantLanguageCode: string;
    /** When known, assistant voice gender can mirror the user (catalog permitting). */
    userGender?: VoiceUserGender;
    userId?: string;
    /** Profile country for locale-aware interpreter prompts. */
    countryCode?: string;
  }
): Promise<InterpreterTurnResult> {
  const startedAt = Date.now();
  try {
    const transcript = await transcribeAudio(audioUri);
    const userContent = buildLiveInterpreterTranslationUserContent(
      params.scenario,
      params.direction,
      params.assistantLanguageCode,
      transcript,
      params.countryCode
    );
    const translation = await getChatCompletion(
      [{ role: 'user', content: userContent }],
      'loan',
      {
        ...(params.userId ? { userId: params.userId } : {}),
        serviceContext: 'interpreter',
        activeScenario: params.scenario,
        networkContext: {
          actionType: 'interpreter',
          language: params.assistantLanguageCode,
          scenario: params.scenario,
        },
      }
    );
    const intent = detectIntent(transcript);
    const { cta, opportunity } = maybeGenerateSellCTA({
      userInput: transcript,
      intent,
      context: {
        userCountry: undefined,
        scenario: params.scenario,
      },
    });
    // Interpreter screen is already "interpreter" mode: avoid suggesting starting interpreter again.
    const sellCta = opportunity === 'interpreter' ? null : cta;

    const voiceScenario = interpreterScenarioToVoiceScenario(params.scenario);
    const voicePref = getAssistantSettings().loanAssistantVoiceGender;
    const profile = resolveVoicePersona({
      mode: 'live_interpreter',
      scenario: voiceScenario,
      language: params.assistantLanguageCode,
      userGender: params.userGender ?? 'unknown',
      assistantVoiceGenderOverride: voicePref,
    });
    const { mode, level } = getVoiceRealismEngineConfig();

    const humanizedDisplay = humanizeSpokenResponse({
      rawText: translation,
      language: params.assistantLanguageCode,
      tone: profile.tone,
      dialoguePhase: 'collect',
      realismLevel: level,
      engineMode: mode,
    });
    const spokenRawText = sellCta ? `${translation}\n\n${sellCta.message}` : translation;
    const humanizedSpoken = humanizeSpokenResponse({
      rawText: spokenRawText,
      language: params.assistantLanguageCode,
      tone: profile.tone,
      dialoguePhase: 'collect',
      realismLevel: level,
      engineMode: mode,
    });
    const voice = openAiVoiceFromPersona(profile);
    let spokenUri: string | null = null;
    try {
      spokenUri = await generateSpeech(humanizedSpoken.spokenText, voice);
    } catch {
      spokenUri = null;
    }
    void trackNetworkEffectEvent({
      actionType: 'interpreter',
      success: true,
      durationMs: Date.now() - startedAt,
      language: params.assistantLanguageCode,
      scenario: params.scenario,
      responsePatternId: defaultPatternIdFor('interpreter'),
      flowId: 'interpreter_loop',
    });
    return {
      transcript,
      translation: humanizedSpoken.spokenText,
      translationForDisplay: humanizedDisplay.spokenText,
      sellCta,
      spokenUri,
    };
  } catch {
    return {
      transcript: '',
      translation: 'Mình chưa xử lý kịp. Bạn thử nói lại ngắn hơn hoặc đổi hướng phiên dịch nhé.',
      translationForDisplay: 'Mình chưa xử lý kịp. Bạn thử nói lại ngắn hơn hoặc đổi hướng phiên dịch nhé.',
      sellCta: null,
      spokenUri: null,
    };
  }
}

export function buildPostSessionFollowUp(scenario: InterpreterScenario): {
  message: string;
  prefillRequest: string;
} {
  const base =
    'Tóm tắt nhu cầu sau phiên phiên dịch trực tiếp và gọi đặt lịch / hỗ trợ nếu cần.';
  switch (scenario) {
    case 'doctor':
      return {
        message: 'Bạn có muốn Leona gọi hỗ trợ đặt lịch khám hoặc nhắc lịch tái khám không?',
        prefillRequest: `${base} Ngữ cảnh: khám bệnh.`,
      };
    case 'government':
      return {
        message: 'Bạn có muốn hỗ trợ đặt lịch hoặc gọi xác nhận giấy tờ không?',
        prefillRequest: `${base} Ngữ cảnh: cơ quan / giấy tờ.`,
      };
    case 'work':
      return {
        message: 'Bạn có muốn ghi nhận lịch phỏng vấn / làm việc và nhắc sau phiên này không?',
        prefillRequest: `${base} Ngữ cảnh: công việc.`,
      };
    case 'travel': {
      const travelBase =
        'Tóm tắt nhu cầu sau phiên phiên dịch; hỗ trợ gọi xác minh hoặc đặt chỗ bên ngoài nếu cần (không đặt vé máy bay trong app).';
      return {
        message:
          'Bạn có muốn Leona hỗ trợ gọi xác minh hoặc đặt chỗ bên ngoài (khách sạn, xe, nhà hàng…) sau phiên phiên dịch không?',
        prefillRequest: `${travelBase} Ngữ cảnh: du lịch / di chuyển — xác nhận cuối vẫn do hãng / đại lý / nền tảng bạn chọn.`,
      };
    }
    default:
      return {
        message: 'Bạn có muốn mình gợi ý đặt lịch hoặc gọi hỗ trợ tiếp theo không?',
        prefillRequest: `${base} Ngữ cảnh: đời sống chung.`,
      };
  }
}
