/** Allowlisted `cancelReason` values for super-admin tourism ops cancel (pre-confirm hold release only). */
export const TOURISM_OPS_CANCEL_REASONS = ['OPS_CANCEL', 'SYSTEM_SAFETY_RELEASE'] as const;

export type TourismOpsCancelReason = (typeof TOURISM_OPS_CANCEL_REASONS)[number];

export type TourismOpsCancelReasonError = Readonly<{
  code: 'invalid_cancel_reason';
  message: string;
}>;

/**
 * Normalize and validate ops cancel reason. Returns canonical allowlisted code.
 */
export function normalizeOpsTourismCancelReason(
  raw: string | undefined
): TourismOpsCancelReason | TourismOpsCancelReasonError {
  const trimmed = raw?.trim() ?? '';
  if (trimmed.length === 0) {
    return {
      code: 'invalid_cancel_reason',
      message: 'cancelReason is required for ops cancel (OPS_CANCEL or SYSTEM_SAFETY_RELEASE)',
    };
  }
  const upper = trimmed.toUpperCase();
  if (upper === 'OPS_CANCEL' || upper === 'SYSTEM_SAFETY_RELEASE') {
    return upper;
  }
  return {
    code: 'invalid_cancel_reason',
    message: `cancelReason must be one of: ${TOURISM_OPS_CANCEL_REASONS.join(', ')}`,
  };
}
