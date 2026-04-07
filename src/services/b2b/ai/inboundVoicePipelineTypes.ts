import type { B2BBusinessType, B2BCallSessionIntent, B2BVoiceDialogueState } from '../../../domain/b2b';

/**
 * Actions for `b2bVoiceOrchestrationHook` — AI / telephony platform posts JSON bodies.
 * Idempotent: repeat same externalCallId + action where noted.
 */
export type VoiceOrchestrationAction =
  | 'ensure_session'
  | 'append_transcript'
  | 'set_intent'
  | 'commit_booking'
  | 'commit_order'
  | 'finalize_session';

export type VoiceOrchestrationRequest = {
  action: VoiceOrchestrationAction;
  /** Telephony CallSid / provider leg id — primary dedup key with tenant. */
  externalCallId: string;
  /** Returned from ensure_session; speeds lookups and avoids ambiguity. */
  sessionId?: string;
  /**
   * Echo-only after ensure_session; never authoritative. Tenant is resolved from `to` (inbound DID)
   * on every orchestration action — mismatches are rejected server-side.
   */
  tenantId?: string;
  provider?: string;
  /** Inbound DID (E.164). Required for ensure_session and for all subsequent actions (trusted tenant resolution). */
  to?: string;
  /** Caller E.164. */
  from?: string;
  transcriptChunk?: string;
  /** Caller utterance for the current turn — used with set_intent for natural follow-up. */
  latestUserInput?: string;
  /** Skip TTS generation (bulk replay / tests). */
  skipVoiceResponse?: boolean;
  detectedIntent?: B2BCallSessionIntent;
  extractedPayload?: Record<string, unknown>;
  locationId?: string;
  businessType?: B2BBusinessType;
  serviceIds?: string[];
  resourceIds?: string[];
  resourceCandidateIds?: string[];
  startsAtMs?: number;
  endsAtMs?: number;
  partySize?: number;
  /** Required for commit_booking — joins with call session id for `bookingIdempotencyKey`. */
  slotDigest?: string;
  customerName?: string;
  /** Must be true — paired with session `bookingConfirmation.confirmed` from voice flow. */
  confirmed?: boolean;
  /** `commit_order` — idempotency with call session id (see `orderIdempotencyKey`). */
  orderDigest?: string;
  /** `commit_order` — pickup or delivery window (UTC ms). */
  windowStartMs?: number;
  windowEndMs?: number;
  fulfillment?: 'pickup' | 'delivery';
  /** `commit_order` — JSON array of `{ name, quantity, needsClarification?, notes? }`. */
  lines?: unknown;
  lineClarifications?: unknown;
  palletOrVolumeHint?: string;
};

export type VoiceOrchestrationResponse =
  | {
      ok: true;
      sessionId: string;
      /** Echoed after ensure_session for subsequent action payloads. */
      tenantId?: string;
      action: VoiceOrchestrationAction;
      bookingId?: string;
      billingEventId?: string;
      orderId?: string;
      orderBillingEventId?: string;
      outcome?: 'success' | 'fail';
      /** Present after append_transcript / set_intent when voice is not skipped. */
      voiceResponse?: {
        spokenText: string;
        voiceDialogueState: B2BVoiceDialogueState;
        tts: { synthesizeFromText: true; language?: string; voiceId?: string };
        audioEncoding: 'none' | 'base64_mp3';
        audioBase64?: string;
      };
    }
  | {
      ok: false;
      error: string;
      failureCode?: import('../../../domain/b2b').B2BCallSessionFailureCode;
      sessionId?: string;
    };
