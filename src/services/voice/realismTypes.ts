import type { B2BVoiceDialoguePhase } from '../../domain/b2b/models';
import type { VoicePersonaTone } from './voicePersonaTypes';

/**
 * Engine dialogue phases — map from B2B and other surfaces.
 */
export type DialoguePhase = 'greeting' | 'clarify' | 'collect' | 'confirm' | 'fallback' | 'close';

export type RealismLevel = 'off' | 'low' | 'medium' | 'high';

/**
 * `deterministic`: stable fillers/delays from content hash (tests, CI).
 * `live`: bounded randomness for production.
 */
export type RealismEngineMode = 'deterministic' | 'live';

export type HumanizeSpokenResponseInput = {
  rawText: string;
  language: string;
  tone: VoicePersonaTone;
  dialoguePhase: DialoguePhase;
  realismLevel: RealismLevel;
  engineMode: RealismEngineMode;
  /** Optional seed for deterministic tests (overrides hash of rawText). */
  deterministicSeed?: string;
};

export type HumanizeSpokenResponseResult = {
  spokenText: string;
  humanizationMeta: {
    appliedFiller: boolean;
    appliedDelayMs: number;
    appliedChunks: number;
    pauseMarkersInserted: number;
  };
};

/**
 * Map persisted B2B phases to realism phases.
 */
export function b2bPhaseToDialoguePhase(phase: B2BVoiceDialoguePhase): DialoguePhase {
  switch (phase) {
    case 'greeting':
      return 'greeting';
    case 'intent_clarify':
      return 'clarify';
    case 'booking_collect':
    case 'order_collect':
    case 'booking_slot_fill':
    case 'faq':
      return 'collect';
    case 'booking_confirm':
    case 'confirm_handoff':
      return 'confirm';
    case 'closing':
      return 'close';
    default:
      return 'collect';
  }
}
