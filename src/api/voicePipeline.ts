import type { SupportedLanguage } from '../i18n/strings';
import { buildPersonaUserContext } from '../config/aiPrompts';
import {
  getVoiceRealismEngineConfig,
  humanizeSpokenResponse,
  openAiVoiceFromPersona,
  resolveVoicePersona,
} from '../services/voice';
import { detectIntent } from '../services/ai/intentDetection';
import { maybeGenerateSellCTA } from '../services/selling/sellEngine';
import type { SellCTA } from '../services/selling/sellingTypes';
import { generateSpeech, getChatCompletion, transcribeAudio } from '../services/OpenAIService';
import { defaultPatternIdFor, trackNetworkEffectEvent } from '../services/networkEffect';
import { getAssistantSettings } from '../state/assistantSettings';
import type { VoicePersona } from './voiceClient';

export type VoicePipelineResult = {
  replyText: string;
  sellCta?: SellCTA | null;
  /** `file://` (TTS) hoặc `https://`; `null` = chỉ hiển thị chữ */
  audioUri: string | null;
  transcript: string;
};

function voicePersonaForPipeline(persona: VoicePersona, languageCode: string) {
  const mode = persona === 'loan' ? 'chau_loan' : 'leona_outbound';
  const scenario = persona === 'loan' ? 'general' : 'leona_outbound';
  const settings = getAssistantSettings();
  return resolveVoicePersona({
    mode,
    scenario,
    language: languageCode,
    userGender: 'unknown',
    assistantVoiceGenderOverride:
      persona === 'loan' ? settings.loanAssistantVoiceGender : undefined,
  });
}

function normalizeLang(code: string): SupportedLanguage {
  const k = code.toLowerCase() as SupportedLanguage;
  return k === 'en' || k === 'cs' || k === 'de' || k === 'vi' ? k : 'vi';
}
async function openaiAssistantReply(
  transcript: string,
  persona: VoicePersona,
  lang: SupportedLanguage,
  userId?: string
): Promise<string> {
  const content = buildPersonaUserContext(persona, lang, transcript);
  return getChatCompletion([{ role: 'user', content }], persona, {
    ...(userId ? { userId } : {}),
    serviceContext: 'call',
    networkContext: {
      actionType: 'call',
      language: lang,
      scenario: persona === 'loan' ? 'assistant_loan' : 'assistant_leona',
    },
  });
}

async function runOpenAiPipeline(
  audioUri: string,
  persona: VoicePersona,
  lang: SupportedLanguage,
  userId?: string
): Promise<VoicePipelineResult> {
  const startedAt = Date.now();
  const transcript = await transcribeAudio(audioUri);
  const replyText = await openaiAssistantReply(transcript, persona, lang, userId);
  const { cta: sellCta, opportunity } = maybeGenerateSellCTA({
    userInput: transcript,
    intent: detectIntent(transcript),
    context: {
      userCountry: undefined,
      scenario: persona,
    },
  });
  // Avoid suggesting interpreter when this pipeline is already translating for interpreter-like journeys.
  const effectiveSellCta = opportunity === 'interpreter' ? null : sellCta;
  const vp = voicePersonaForPipeline(persona, lang);
  const { mode, level } = getVoiceRealismEngineConfig();
  const humanized = humanizeSpokenResponse({
    rawText: effectiveSellCta ? `${replyText}\n\n${effectiveSellCta.message}` : replyText,
    language: lang,
    tone: vp.tone,
    dialoguePhase: 'collect',
    realismLevel: level,
    engineMode: mode,
  });
  const audioOut = await generateSpeech(humanized.spokenText, openAiVoiceFromPersona(vp));
  void trackNetworkEffectEvent({
    actionType: 'call',
    success: true,
    durationMs: Date.now() - startedAt,
    language: lang,
    scenario: persona === 'loan' ? 'assistant_loan' : 'assistant_leona',
    responsePatternId: defaultPatternIdFor('call'),
    flowId: 'call_triage',
  });
  return { replyText: humanized.spokenText, sellCta: effectiveSellCta, audioUri: audioOut, transcript };
}

/** Thả micro -> backend AI proxy -> STT/Chat/TTS */
export async function processVoiceUtterance(
  audioUri: string,
  persona: VoicePersona,
  languageCode: string,
  userId?: string
): Promise<VoicePipelineResult> {
  const lang = normalizeLang(languageCode);
  return runOpenAiPipeline(audioUri, persona, lang, userId);
}
