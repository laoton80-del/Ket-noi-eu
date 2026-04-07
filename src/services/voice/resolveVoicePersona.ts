import { getVoiceCatalog, languageToBucket, lookupVoiceIdInCatalog } from '../voicePersona/voiceCatalog';
import { resolveAssistantGender } from '../voicePersona/resolveVoiceProfile';
import type { ResolveVoicePersonaInput, VoicePersonaProfile } from './voicePersonaTypes';
import {
  buildPersonaKey,
  defaultsForModeAndTone,
  extendedToneToCatalogTone,
  resolveEffectiveTone,
} from './voicePersonaRegistry';

function normalizeLanguageTag(raw: string, tenantDefault?: string): string {
  const t = raw.trim();
  if (t) return t;
  return tenantDefault?.trim() || 'en';
}

/**
 * Production resolver — voice ids come from `voiceCatalog` + env; persona fields from registry + tenant.
 */
export function resolveVoicePersona(input: ResolveVoicePersonaInput): VoicePersonaProfile {
  const lang = normalizeLanguageTag(input.language, input.tenantConfig?.defaultLanguage);
  const tenant = input.tenantConfig;

  const tone = resolveEffectiveTone(
    input.mode,
    input.scenario,
    input.businessType,
    tenant?.preferredTone
  );

  const personaKey = tenant?.personaKeyOverride ?? buildPersonaKey(input.mode, input.scenario, input.businessType, tone);

  const gender =
    input.assistantVoiceGenderOverride ?? resolveAssistantGender(input.userGender);
  const catalogTone = extendedToneToCatalogTone(tone);
  const bucket = languageToBucket(lang);
  const catalog = getVoiceCatalog();
  const voiceId =
    tenant?.voiceIdOverride?.trim() ||
    lookupVoiceIdInCatalog(gender, catalogTone, bucket, catalog);

  const d = defaultsForModeAndTone(input.mode, tone);

  return {
    personaKey,
    gender,
    language: lang,
    tone,
    voiceId,
    speakingRate: tenant?.speakingRateOverride ?? d.speakingRate,
    pitchStyle: tenant?.pitchStyleOverride ?? d.pitchStyle,
    fillerStyle: tenant?.fillerStyleOverride ?? d.fillerStyle,
    hesitationStyle: tenant?.hesitationStyleOverride ?? d.hesitationStyle,
  };
}
