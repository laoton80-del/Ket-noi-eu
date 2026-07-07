import type { VionaRequestDetailDto } from './vionaRequestReadDto';

/**
 * Pack19 R1 create-submit path — safety contract.
 *
 * This path creates exactly one `VionaRequest` row (VionaRequest domain/model only) with initial
 * status `submitted`. It performs no status transition, no note/execution/payment/booking/SOS/AI
 * side effects, and makes no production-readiness claim. Staging-testable only.
 */
export const VIONA_REQUEST_CREATE_ACTION_SAFETY = {
  createActionOnly: true,
  initialStatusSubmittedOnly: true,
  noStatusTransition: true,
  noNoteSideEffect: true,
  noPaymentSettlement: true,
  noBookingFulfillment: true,
  noEmergencyEscalation: true,
  noMerchantAction: true,
  noAiCall: true,
  noExecutionWiring: true,
  noExternalSideEffect: true,
  notProductionReady: true,
} as const;

/** Create-submit path writes only this fixed initial status. */
export const VIONA_REQUEST_CREATE_INITIAL_STATUS = 'submitted' as const;

/** Audit event type recorded on creation. */
export const VIONA_REQUEST_CREATE_AUDIT_EVENT_TYPE = 'action.create';

/** Marker recorded in `metadataJson.createdVia` for provenance. */
export const VIONA_REQUEST_CREATE_VIA = 'pack19-r1-create-submit-path' as const;

/**
 * Safe request categories allowed by this bounded path. Anything outside this allowlist is rejected.
 * Kept intentionally narrow: this path currently exists only to produce Pack19 staging test rows.
 */
export const VIONA_REQUEST_CREATE_SAFE_REQUEST_TYPES = [
  'generic',
  'pack19-precondition-test',
] as const;

/** Exact safety labels required on every row created by this path (Pack19 staging precondition). */
export const VIONA_REQUEST_CREATE_REQUIRED_SAFETY_LABELS = [
  'pack19-safe-submitted-row-precondition',
  'staging-only',
  'non-production',
  'non-hold',
  'non-customer-critical',
  'test-remediation',
] as const;

/**
 * Exact labels that must never appear (production / customer-critical / hold claims).
 * Exact-match (not substring) so safe labels like `non-production` / `non-hold` are not caught.
 */
export const VIONA_REQUEST_CREATE_FORBIDDEN_SAFETY_LABELS = [
  'production',
  'prod',
  'production-ready',
  'live',
  'real',
  'real-customer',
  'customer-critical',
  'hold',
  'pack25-hold',
] as const;

/**
 * Top-level payload keys that indicate bulk creation — rejected. This path creates exactly one row.
 */
export const VIONA_REQUEST_CREATE_BULK_KEYS = [
  'items',
  'rows',
  'batch',
  'bulk',
  'count',
  'requests',
] as const;

/**
 * Top-level payload keys that would attempt a status transition or a downstream side effect
 * (execution / payment / booking / SOS / AI call / merchant action / note / notification) — rejected.
 */
export const VIONA_REQUEST_CREATE_FORBIDDEN_SIDE_EFFECT_KEYS = [
  'status',
  'targetstatus',
  'statustransition',
  'transition',
  'execute',
  'execution',
  'executiontask',
  'payment',
  'pay',
  'booking',
  'book',
  'sos',
  'aicall',
  'ai',
  'notify',
  'notification',
  'callback',
  'webhook',
  'note',
  'notes',
  'assign',
  'confirm',
  'cancel',
  'merchant',
  'merchantaction',
] as const;

export type CreateVionaRequestInput = Readonly<{
  authUserId: string;
  tenantId: string;
  sourceUniverse: string;
  requestType: string;
  title: string;
  summary?: string;
  locale?: string;
  countryCode?: string;
  sourceFeature?: string;
  safetyLabels: readonly string[];
  idempotencyKey?: string;
  clientCorrelationId?: string;
}>;

export type CreateVionaRequestFailure =
  | 'invalid_input'
  | 'unsafe_content'
  | 'unsafe_request_type'
  | 'unsafe_universe'
  | 'missing_safety_labels'
  | 'forbidden_labels'
  | 'forbidden_side_effect'
  | 'bulk_forbidden';

export type CreateVionaRequestActionMeta = Readonly<{
  requestId: string;
  auditEventId: string;
  eventType: 'action.create';
  status: 'submitted';
  idempotentReplay: boolean;
}>;

export type CreateVionaRequestResult =
  | Readonly<{
      ok: true;
      data: VionaRequestDetailDto;
      action: CreateVionaRequestActionMeta;
      safety: typeof VIONA_REQUEST_CREATE_ACTION_SAFETY;
    }>
  | Readonly<{ ok: false; reason: CreateVionaRequestFailure }>;
