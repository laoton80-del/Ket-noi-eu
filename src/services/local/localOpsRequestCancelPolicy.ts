import { LocalCancelReason } from '@prisma/client';

/** Allowlisted cancel reasons for Local ops cancel (maps to `LocalCancelReason`). */
export const LOCAL_OPS_CANCEL_REASON_CODES = ['OPS_CANCEL', 'SYSTEM_SAFETY_RELEASE'] as const;

export type LocalOpsCancelReasonCode = (typeof LOCAL_OPS_CANCEL_REASON_CODES)[number];

export type LocalOpsCancelReasonError = Readonly<{
  code: 'invalid_cancel_reason';
  message: string;
}>;

export function normalizeLocalOpsCancelReason(
  raw: string | undefined
): LocalOpsCancelReasonCode | LocalOpsCancelReasonError {
  const trimmed = raw?.trim() ?? '';
  if (trimmed.length === 0) {
    return 'OPS_CANCEL';
  }
  const upper = trimmed.toUpperCase();
  if (upper === 'OPS_CANCEL' || upper === 'SYSTEM_SAFETY_RELEASE') {
    return upper;
  }
  return {
    code: 'invalid_cancel_reason',
    message: `cancelReason must be one of: ${LOCAL_OPS_CANCEL_REASON_CODES.join(', ')}`,
  };
}

export function localOpsCancelReasonToEnum(code: LocalOpsCancelReasonCode): LocalCancelReason {
  if (code === 'SYSTEM_SAFETY_RELEASE') {
    return LocalCancelReason.SYSTEM_SAFETY_RELEASE;
  }
  return LocalCancelReason.OPS_CANCEL;
}
