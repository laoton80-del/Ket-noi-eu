import type { B2BBusinessType } from '../../../domain/b2b';

/** High-level steps for inbound voice orchestration (state machine). */
export type ReceptionistFlowStep =
  | 'incoming_call'
  | 'resolve_tenant'
  | 'load_tenant_config'
  | 'play_greeting'
  | 'detect_intent'
  | 'collect_slots' // multi-turn: service, time, party size, address, etc.
  | 'check_availability_or_capacity'
  | 'confirm_with_caller'
  | 'persist_booking_or_order'
  | 'emit_billing'
  | 'completed'
  | 'failed';

export type ReceptionistIntent =
  | 'booking'
  | 'stay_booking'
  | 'order'
  | 'wholesale_order'
  | 'faq'
  | 'transfer'
  | 'unknown';

export type ReceptionistFailureCode =
  | 'tenant_not_found'
  | 'suspended'
  | 'outside_hours'
  | 'no_availability'
  | 'slot_full'
  | 'validation'
  | 'persist_error'
  | 'billing_error'
  | 'abandoned'
  | 'internal';

export type FlowContextBase = {
  externalCallId: string;
  inboundNumberE164: string;
  callerNumberE164?: string;
  tenantId?: string;
  locationId?: string;
  businessType?: B2BBusinessType;
  intent?: ReceptionistIntent;
  extractedPayload?: Record<string, unknown>;
  /** Digest of last committed slot/cart for idempotency. */
  mutationDigest?: string;
};

export type FlowTransition =
  | { step: ReceptionistFlowStep; contextPatch?: Partial<FlowContextBase> }
  | { step: 'failed'; code: ReceptionistFailureCode; message?: string };
