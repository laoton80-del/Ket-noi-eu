import { toOpenAiTtsVoice } from '../voicePersona/voiceCatalog';
import type { HumanizeSpokenResponseResult } from './realismTypes';
import type { VoicePersonaProfile } from './voicePersonaTypes';

export type TtsChunkStrategy = 'single' | 'sentence' | 'clause';

export type NormalizedTtsOutput = {
  spokenText: string;
  voicePersona: VoicePersonaProfile;
  tts: {
    voiceId: string;
    language: string;
    speakingRate: number;
    chunkStrategy: TtsChunkStrategy;
    /** Markers like `…` or ` — ` already embedded in spokenText when applicable */
    pauseHints: string[];
  };
  humanizationMeta: HumanizeSpokenResponseResult['humanizationMeta'];
};

/**
 * Single contract for app + Functions + future telephony — does not perform I/O.
 */
export function buildTtsOutput(
  persona: VoicePersonaProfile,
  humanized: HumanizeSpokenResponseResult,
  opts?: { chunkStrategy?: TtsChunkStrategy; extraPauseHints?: string[] }
): NormalizedTtsOutput {
  const chunkStrategy = opts?.chunkStrategy ?? (humanized.humanizationMeta.appliedChunks > 1 ? 'sentence' : 'single');
  return {
    spokenText: humanized.spokenText,
    voicePersona: persona,
    tts: {
      voiceId: toOpenAiTtsVoice(persona.voiceId),
      language: persona.language,
      speakingRate: persona.speakingRate,
      chunkStrategy,
      pauseHints: opts?.extraPauseHints ?? [],
    },
    humanizationMeta: humanized.humanizationMeta,
  };
}

/** Narrow persona voice id to OpenAI union for `generateSpeech`. */
export function openAiVoiceFromPersona(persona: VoicePersonaProfile): ReturnType<typeof toOpenAiTtsVoice> {
  return toOpenAiTtsVoice(persona.voiceId);
}
