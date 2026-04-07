import type { B2BBusinessType } from '../../domain/b2b/models';
import type { VoiceScenario, VoiceUserGender } from '../voicePersona/voicePersonaTypes';

/**
 * Product-facing voice modes — map to resolver + registry defaults.
 */
export type VoicePersonaMode =
  | 'leona_outbound'
  | 'b2b_inbound'
  | 'live_interpreter'
  | 'call_assist'
  | 'chau_loan';

/** TTS backends may map these to provider-specific curves. */
export type VoicePitchStyle = 'neutral' | 'warm' | 'bright' | 'low';

/** How much implicit filler/hesitation the *persona* allows (humanize may still cap by realismLevel). */
export type VoiceFillerStyle = 'minimal' | 'natural' | 'expressive';

export type VoiceHesitationStyle = 'none' | 'light' | 'moderate';

/**
 * Extended tone set — values not in the OpenAI matrix map to catalog tones in resolveVoicePersona.
 */
export type VoicePersonaTone =
  | 'friendly'
  | 'formal'
  | 'neutral'
  | 'urgent'
  | 'reassuring';

/**
 * Stable key for analytics, A/B, and remote overrides (not a raw voice id).
 * e.g. `leona.outbound.formal`, `b2b.nails.friendly`
 */
export type VoicePersonaKey = string;

/**
 * Optional tenant overrides — forward-compatible; unknown fields ignored by resolver.
 */
export type VoiceTenantPersonaConfig = {
  /** Force persona key for logging / backend routing */
  personaKeyOverride?: VoicePersonaKey;
  /** Override default language for this tenant (BCP-47-ish). */
  defaultLanguage?: string;
  /** Prefer a fixed tone when business rules allow */
  preferredTone?: VoicePersonaTone;
  /** Optional explicit provider voice id (must still be validated in catalog layer if used). */
  voiceIdOverride?: string;
  speakingRateOverride?: number;
  pitchStyleOverride?: VoicePitchStyle;
  fillerStyleOverride?: VoiceFillerStyle;
  hesitationStyleOverride?: VoiceHesitationStyle;
};

export type VoicePersonaProfile = {
  personaKey: VoicePersonaKey;
  gender: 'male' | 'female';
  language: string;
  tone: VoicePersonaTone;
  /** Provider voice name (e.g. OpenAI: alloy | nova | shimmer) — from catalog, not hardcoded in features. */
  voiceId: string;
  /** 0.85–1.15 suggested; actual TTS may ignore until backend supports rate. */
  speakingRate: number;
  pitchStyle: VoicePitchStyle;
  fillerStyle: VoiceFillerStyle;
  hesitationStyle: VoiceHesitationStyle;
};

export type ResolveVoicePersonaInput = {
  mode: VoicePersonaMode;
  /** Domain scenario — reuse existing VoiceScenario union for consistency. */
  scenario: VoiceScenario;
  language: string;
  userGender: VoiceUserGender;
  /** When set (B2C Minh Khang / `chau_loan` / interpreter), overrides gender from `userGender` for TTS catalog lookup. */
  assistantVoiceGenderOverride?: 'male' | 'female';
  businessType?: B2BBusinessType;
  tenantConfig?: VoiceTenantPersonaConfig | null;
};

export type { VoiceScenario, VoiceUserGender };
