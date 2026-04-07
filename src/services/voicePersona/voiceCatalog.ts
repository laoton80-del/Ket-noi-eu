import type { VoiceProfile } from './voicePersonaTypes';

/** Bucket for registry lookup — avoids per-locale explosion while staying deterministic. */
export type VoiceLangBucket = 'vi' | 'en' | 'cs' | 'de' | 'other';

export type OpenAiTtsVoiceName = 'nova' | 'alloy' | 'shimmer';

/**
 * Single catalog of TTS voice IDs per provider.
 * Replace values via EXPO_PUBLIC_VOICE_* without changing resolver rules.
 */
export type VoiceCatalog = {
  provider: 'openai_tts';
  /** Keys: `${gender}:${tone}:${bucket}` → OpenAI TTS voice name */
  matrix: Record<string, OpenAiTtsVoiceName>;
  /** When no matrix hit — stable default. */
  fallback: OpenAiTtsVoiceName;
};

function envVoice(key: string, fallback: OpenAiTtsVoiceName): OpenAiTtsVoiceName {
  const raw = process.env[key]?.trim()?.toLowerCase();
  if (raw === 'nova' || raw === 'alloy' || raw === 'shimmer') return raw;
  return fallback;
}

/** Load catalog — env overrides matrix slots; IDs are not embedded in resolver logic. */
export function getVoiceCatalog(): VoiceCatalog {
  return {
    provider: 'openai_tts',
    matrix: {
      'female:friendly:vi': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_VI', 'shimmer'),
      'male:friendly:vi': envVoice('EXPO_PUBLIC_VOICE_MALE_FRIENDLY_VI', 'alloy'),
      'female:formal:vi': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FORMAL_VI', 'nova'),
      'male:formal:vi': envVoice('EXPO_PUBLIC_VOICE_MALE_FORMAL_VI', 'alloy'),
      'female:neutral:vi': envVoice('EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_VI', 'shimmer'),
      'male:neutral:vi': envVoice('EXPO_PUBLIC_VOICE_MALE_NEUTRAL_VI', 'alloy'),
      'female:friendly:en': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_EN', 'shimmer'),
      'male:friendly:en': envVoice('EXPO_PUBLIC_VOICE_MALE_FRIENDLY_EN', 'alloy'),
      'female:formal:en': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FORMAL_EN', 'nova'),
      'male:formal:en': envVoice('EXPO_PUBLIC_VOICE_MALE_FORMAL_EN', 'alloy'),
      'female:neutral:en': envVoice('EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_EN', 'shimmer'),
      'male:neutral:en': envVoice('EXPO_PUBLIC_VOICE_MALE_NEUTRAL_EN', 'alloy'),
      'female:friendly:cs': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_CS', 'shimmer'),
      'male:friendly:cs': envVoice('EXPO_PUBLIC_VOICE_MALE_FRIENDLY_CS', 'alloy'),
      'female:formal:cs': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FORMAL_CS', 'nova'),
      'male:formal:cs': envVoice('EXPO_PUBLIC_VOICE_MALE_FORMAL_CS', 'alloy'),
      'female:neutral:cs': envVoice('EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_CS', 'shimmer'),
      'male:neutral:cs': envVoice('EXPO_PUBLIC_VOICE_MALE_NEUTRAL_CS', 'alloy'),
      'female:friendly:de': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_DE', 'shimmer'),
      'male:friendly:de': envVoice('EXPO_PUBLIC_VOICE_MALE_FRIENDLY_DE', 'alloy'),
      'female:formal:de': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FORMAL_DE', 'nova'),
      'male:formal:de': envVoice('EXPO_PUBLIC_VOICE_MALE_FORMAL_DE', 'alloy'),
      'female:neutral:de': envVoice('EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_DE', 'shimmer'),
      'male:neutral:de': envVoice('EXPO_PUBLIC_VOICE_MALE_NEUTRAL_DE', 'alloy'),
      'female:friendly:other': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FRIENDLY_OTHER', 'shimmer'),
      'male:friendly:other': envVoice('EXPO_PUBLIC_VOICE_MALE_FRIENDLY_OTHER', 'alloy'),
      'female:formal:other': envVoice('EXPO_PUBLIC_VOICE_FEMALE_FORMAL_OTHER', 'nova'),
      'male:formal:other': envVoice('EXPO_PUBLIC_VOICE_MALE_FORMAL_OTHER', 'alloy'),
      'female:neutral:other': envVoice('EXPO_PUBLIC_VOICE_FEMALE_NEUTRAL_OTHER', 'shimmer'),
      'male:neutral:other': envVoice('EXPO_PUBLIC_VOICE_MALE_NEUTRAL_OTHER', 'alloy'),
    },
    fallback: envVoice('EXPO_PUBLIC_VOICE_FALLBACK', 'alloy'),
  };
}

export function languageToBucket(language: string): VoiceLangBucket {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] ?? 'en';
  if (base === 'vi') return 'vi';
  if (base === 'en') return 'en';
  if (base === 'cs' || base === 'sk') return 'cs';
  if (base === 'de') return 'de';
  return 'other';
}

export function lookupVoiceIdInCatalog(
  gender: VoiceProfile['gender'],
  tone: VoiceProfile['tone'],
  bucket: VoiceLangBucket,
  catalog: VoiceCatalog = getVoiceCatalog()
): OpenAiTtsVoiceName {
  const key = `${gender}:${tone}:${bucket}`;
  const hit = catalog.matrix[key];
  if (hit) return hit;
  const fallbackKey = `${gender}:${tone}:en`;
  const hitEn = catalog.matrix[fallbackKey];
  if (hitEn) return hitEn;
  return catalog.fallback;
}

/** Narrow arbitrary TTS id to OpenAI union for existing `generateSpeech` signature. */
export function toOpenAiTtsVoice(voiceId: string): OpenAiTtsVoiceName {
  const v = voiceId.toLowerCase();
  if (v === 'nova' || v === 'alloy' || v === 'shimmer') return v;
  return getVoiceCatalog().fallback;
}
