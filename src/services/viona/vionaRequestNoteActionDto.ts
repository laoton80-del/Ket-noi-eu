import type { VionaRequestDetailDto } from './vionaRequestReadDto';

export const VIONA_REQUEST_NOTE_ACTION_SAFETY = {
  noteActionOnly: true,
  noStatusChange: true,
  noPaymentSettlement: true,
  noBookingFulfillment: true,
  noEmergencyEscalation: true,
  notProductionReady: true,
} as const;

export type AppendVionaRequestNoteInput = Readonly<{
  authUserId: string;
  requestId: string;
  note: string;
  idempotencyKey?: string;
  clientCorrelationId?: string;
}>;

export type AppendVionaRequestNoteFailure =
  | 'invalid_input'
  | 'request_not_found'
  | 'unsafe_note';

export type AppendVionaRequestNoteActionMeta = Readonly<{
  auditEventId: string;
  eventType: 'action.note';
  idempotentReplay: boolean;
}>;

export type AppendVionaRequestNoteResult =
  | Readonly<{
      ok: true;
      data: VionaRequestDetailDto;
      action: AppendVionaRequestNoteActionMeta;
      safety: typeof VIONA_REQUEST_NOTE_ACTION_SAFETY;
    }>
  | Readonly<{ ok: false; reason: AppendVionaRequestNoteFailure }>;
