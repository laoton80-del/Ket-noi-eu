import type {
  B2BBookingConfirmationState,
  B2BBookingSlotState,
  B2BBusinessType,
  B2BCallSessionIntent,
  B2BVoiceDialogueState,
} from '../../../domain/b2b';

/** Minimal session slice for response generation (no Firestore types). */
export type CallSessionVoiceContext = {
  id: string;
  transcript?: string;
  intent?: B2BCallSessionIntent;
  detectedIntent?: B2BCallSessionIntent;
  extractedPayload?: Record<string, unknown>;
  voiceDialogueState?: B2BVoiceDialogueState;
  bookingSlotState?: B2BBookingSlotState;
  bookingConfirmation?: B2BBookingConfirmationState;
};

export type GenerateCallResponseInput = {
  session: CallSessionVoiceContext;
  /** Latest caller utterance (STT). May be empty after intent-only updates. */
  latestUserInput: string;
  /** Tenant display name and vertical for slot questions. */
  tenantDisplayName: string;
  businessType: B2BBusinessType;
  /** From tenant.ai — forwarded to telephony TTS. */
  defaultLanguage?: string;
  ttsVoiceId?: string;
};

/**
 * Spoken output for telephony: prefer `spokenText` + TTS; optional inline audio for providers that support it.
 */
export type CallVoiceResponse = {
  spokenText: string;
  voiceDialogueState: B2BVoiceDialogueState;
  tts: {
    synthesizeFromText: true;
    language?: string;
    voiceId?: string;
  };
  /** When false, generator asked a clarification instead of advancing. */
  advancedPhase: boolean;
  audioEncoding: 'none' | 'base64_mp3';
  audioBase64?: string;
};

export type CallResponseGenerator = (input: GenerateCallResponseInput) => CallVoiceResponse;
