import type { InterpreterScenario } from '../../config/aiPrompts';
import { getVoiceCatalog, languageToBucket, lookupVoiceIdInCatalog } from './voiceCatalog';
import type { ResolveVoiceProfileInput, VoiceProfile, VoiceScenario, VoiceUserGender } from './voicePersonaTypes';

function scenarioToTone(scenario: VoiceScenario): VoiceProfile['tone'] {
  switch (scenario) {
    case 'doctor':
    case 'government':
    case 'leona_outbound':
      return 'formal';
    case 'nails':
    case 'restaurant':
    case 'general':
    case 'live_interpreter':
    case 'b2b_receptionist':
      return 'friendly';
    case 'potraviny':
    case 'grocery_wholesale':
    case 'work':
      return 'neutral';
    case 'hospitality_stay':
      return 'formal';
    default:
      return 'friendly';
  }
}

/** Prefer matching caller gender when catalog has both; unknown → female (product default). */
export function resolveAssistantGender(userGender: VoiceUserGender): VoiceProfile['gender'] {
  if (userGender === 'male') return 'male';
  if (userGender === 'female') return 'female';
  return 'female';
}

function normalizeLanguageTag(raw: string): string {
  const t = raw.trim();
  if (!t) return 'en';
  return t;
}

/**
 * Deterministic voice persona resolution — tone from scenario, gender from user when known,
 * voiceId from catalog (env-overridable), never from ad-hoc strings in callers.
 */
export function resolveVoiceProfile(input: ResolveVoiceProfileInput): VoiceProfile {
  const tone = scenarioToTone(input.scenario);
  const gender = resolveAssistantGender(input.userGender);
  const language = normalizeLanguageTag(input.language);
  const bucket = languageToBucket(language);
  const voiceId = lookupVoiceIdInCatalog(gender, tone, bucket, getVoiceCatalog());

  return {
    gender,
    tone,
    language,
    voiceId,
  };
}

/** Map Live Interpreter scenario to voice scenario (tone rules: doctor/gov formal). */
export function interpreterScenarioToVoiceScenario(scenario: InterpreterScenario): VoiceScenario {
  switch (scenario) {
    case 'doctor':
    case 'government':
      return scenario;
    case 'work':
      return 'work';
    case 'travel':
      return 'live_interpreter';
    default:
      return 'live_interpreter';
  }
}
