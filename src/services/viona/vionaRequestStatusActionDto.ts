import type { VionaRequestDetailDto } from './vionaRequestReadDto';

export const VIONA_REQUEST_STATUS_ACTION_SAFETY = {
  statusActionOnly: true,
  noPaymentSettlement: true,
  noBookingFulfillment: true,
  noEmergencyEscalation: true,
  notProductionReady: true,
} as const;

/** Pack25 narrow first transition — owner-only staging pilot scope. */
export const VIONA_REQUEST_STATUS_ACTION_ALLOWED_TRANSITION = {
  from: 'submitted',
  to: 'triage',
} as const;

export type TransitionVionaRequestStatusInput = Readonly<{
  authUserId: string;
  requestId: string;
  targetStatus: string;
  reason?: string;
  note?: string;
  idempotencyKey?: string;
  clientCorrelationId?: string;
}>;

export type TransitionVionaRequestStatusFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'invalid_transition'
  | 'unsafe_content';

export type TransitionVionaRequestStatusActionMeta = Readonly<{
  statusEventId: string;
  auditEventId: string;
  eventType: 'action.status';
  fromStatus: string;
  toStatus: string;
  idempotentReplay: boolean;
}>;

export type TransitionVionaRequestStatusResult =
  | Readonly<{
      ok: true;
      data: VionaRequestDetailDto;
      action: TransitionVionaRequestStatusActionMeta;
      safety: typeof VIONA_REQUEST_STATUS_ACTION_SAFETY;
    }>
  | Readonly<{ ok: false; reason: TransitionVionaRequestStatusFailure }>;
