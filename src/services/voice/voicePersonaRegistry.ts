import type { B2BBusinessType } from '../../domain/b2b/models';
import type { VoiceScenario } from '../voicePersona/voicePersonaTypes';
import type {
  VoiceFillerStyle,
  VoiceHesitationStyle,
  VoicePersonaKey,
  VoicePersonaMode,
  VoicePersonaTone,
  VoicePitchStyle,
} from './voicePersonaTypes';

/** Map extended tones to the 3-slot voice catalog (voiceCatalog matrix). */
export function extendedToneToCatalogTone(tone: VoicePersonaTone): 'friendly' | 'formal' | 'neutral' {
  switch (tone) {
    case 'formal':
    case 'urgent':
      return 'formal';
    case 'reassuring':
    case 'friendly':
      return 'friendly';
    case 'neutral':
    default:
      return 'neutral';
  }
}

function scenarioBaseTone(scenario: VoiceScenario): VoicePersonaTone {
  switch (scenario) {
    case 'doctor':
    case 'government':
      return 'formal';
    case 'nails':
    case 'restaurant':
      return 'friendly';
    case 'potraviny':
    case 'grocery_wholesale':
    case 'work':
      return 'neutral';
    case 'hospitality_stay':
      return 'formal';
    case 'leona_outbound':
      return 'formal';
    case 'b2b_receptionist':
    case 'general':
    case 'live_interpreter':
      return 'friendly';
    default:
      return 'friendly';
  }
}

function businessWarmthAdjust(bt: B2BBusinessType | undefined): VoicePersonaTone | null {
  if (!bt) return null;
  if (bt === 'nails' || bt === 'restaurant') return 'friendly';
  if (bt === 'potraviny' || bt === 'grocery_retail' || bt === 'grocery_wholesale') return 'neutral';
  if (bt === 'hospitality_stay') return 'formal';
  return null;
}

/**
 * Deterministic persona key for analytics — not a voice id.
 */
export function buildPersonaKey(
  mode: VoicePersonaMode,
  scenario: VoiceScenario,
  businessType: B2BBusinessType | undefined,
  tone: VoicePersonaTone
): VoicePersonaKey {
  const vertical = businessType ?? 'generic';
  return `${mode}.${vertical}.${scenario}.${tone}`;
}

type PersonaDefaults = {
  speakingRate: number;
  pitchStyle: VoicePitchStyle;
  fillerStyle: VoiceFillerStyle;
  hesitationStyle: VoiceHesitationStyle;
};

export function defaultsForModeAndTone(mode: VoicePersonaMode, tone: VoicePersonaTone): PersonaDefaults {
  const formalLike = tone === 'formal' || tone === 'urgent';
  const warm = tone === 'reassuring' || tone === 'friendly';

  let base: PersonaDefaults = {
    speakingRate: formalLike ? 0.98 : warm ? 1.02 : 1.0,
    pitchStyle: warm ? 'warm' : formalLike ? 'neutral' : 'neutral',
    fillerStyle: formalLike ? 'minimal' : warm ? 'natural' : 'natural',
    hesitationStyle: formalLike ? 'light' : warm ? 'moderate' : 'light',
  };

  switch (mode) {
    case 'leona_outbound':
      base = { ...base, speakingRate: 0.97, fillerStyle: 'minimal', hesitationStyle: 'light' };
      break;
    case 'b2b_inbound':
      base = { ...base, fillerStyle: warm ? 'natural' : 'minimal' };
      break;
    case 'live_interpreter':
      base = { ...base, speakingRate: 1.0, hesitationStyle: 'light', fillerStyle: 'minimal' };
      break;
    case 'call_assist':
      base = { ...base, speakingRate: 0.99, fillerStyle: 'natural' };
      break;
    case 'chau_loan':
      base = { ...base, speakingRate: 1.01, fillerStyle: 'natural' };
      break;
    default:
      break;
  }

  return base;
}

/**
 * Resolve effective tone: scenario + business vertical + tenant preference + mode hints.
 */
export function resolveEffectiveTone(
  mode: VoicePersonaMode,
  scenario: VoiceScenario,
  businessType: B2BBusinessType | undefined,
  tenantPreferred?: VoicePersonaTone
): VoicePersonaTone {
  if (tenantPreferred) return tenantPreferred;

  let tone = scenarioBaseTone(scenario);
  const biz = businessWarmthAdjust(businessType);
  if (biz) {
    if (scenario === 'general' || scenario === 'b2b_receptionist' || scenario === 'live_interpreter') {
      tone = biz;
    }
  }

  if (mode === 'leona_outbound' && scenario === 'leona_outbound') {
    tone = 'formal';
  }

  return tone;
}
