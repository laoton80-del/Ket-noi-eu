/**
 * Provider-agnostic voice persona — `voiceId` must match the active TTS backend
 * (resolved via voiceCatalog, not scattered literals in feature code).
 */
export type VoiceProfile = {
  gender: 'male' | 'female';
  tone: 'friendly' | 'formal' | 'neutral';
  /** BCP-47 / ISO-like tag used for catalog lookup (e.g. vi, en-GB, cs). */
  language: string;
  /** TTS voice identifier for the configured provider (e.g. OpenAI: alloy | nova | shimmer). */
  voiceId: string;
};

export type VoiceUserGender = 'male' | 'female' | 'unknown';

/**
 * High-level context — extend here as products grow; resolver maps to tone + catalog.
 */
export type VoiceScenario =
  | 'doctor'
  | 'government'
  | 'nails'
  | 'restaurant'
  | 'potraviny'
  | 'hospitality_stay'
  | 'grocery_wholesale'
  | 'work'
  | 'general'
  | 'live_interpreter'
  | 'leona_outbound'
  | 'b2b_receptionist';

export type ResolveVoiceProfileInput = {
  userGender: VoiceUserGender;
  scenario: VoiceScenario;
  /** Language for TTS (e.g. app locale, tenant default, assistant language). */
  language: string;
};
