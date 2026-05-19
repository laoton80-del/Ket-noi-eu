import { TourismBookingStatus, TourismSettlementMode } from '@prisma/client';

import { evaluateTourismHeldBookingCancelEligibility } from './tourismHeldBookingCancelEligibility';

const DEFAULT_TIMEOUT_HOURS = 48;

export type TourismHeldBookingTimeoutRow = Readonly<{
  status: TourismBookingStatus;
  settlementMode: TourismSettlementMode;
  providerSettledAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date | null;
  fxLockedAt: Date | null;
  startDate: Date;
  totalPaidVIG: number;
}>;

export type TourismTimeoutCandidateBucket =
  | 'eligible'
  | 'not_yet_due'
  | 'already_cancelled'
  | 'already_settled_or_terminal'
  | 'manual_review'
  | 'ineligible_mode_or_status';

export type TourismTimeoutCandidateClassification = Readonly<{
  bucket: TourismTimeoutCandidateBucket;
  reason: string;
  anchorAt: Date;
  anchorUsedStartDateFallback: boolean;
  ageMs: number;
}>;

/** Resolve review timeout hours from env (default 48). */
export function resolveTourismHoldReviewTimeoutHours(): number {
  const raw = process.env.TOURISM_HOLD_REVIEW_TIMEOUT_HOURS?.trim() ?? '';
  if (raw.length === 0) return DEFAULT_TIMEOUT_HOURS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_TIMEOUT_HOURS;
  return Math.min(24 * 365, Math.floor(n));
}

/** Clock anchor for merchant review timeout — prefer createdAt, then fxLockedAt. */
export function resolveTourismHoldReviewAnchorAt(
  row: Pick<TourismHeldBookingTimeoutRow, 'createdAt' | 'fxLockedAt' | 'startDate'>
): Readonly<{ anchorAt: Date; usedStartDateFallback: boolean }> {
  if (row.createdAt != null && !Number.isNaN(row.createdAt.getTime())) {
    return { anchorAt: row.createdAt, usedStartDateFallback: false };
  }
  if (row.fxLockedAt != null && !Number.isNaN(row.fxLockedAt.getTime())) {
    return { anchorAt: row.fxLockedAt, usedStartDateFallback: false };
  }
  return { anchorAt: row.startDate, usedStartDateFallback: true };
}

/**
 * Classify a row for timeout dry-run (read-only). Wallet lock evidence is checked separately in the job script.
 */
export function classifyTourismHeldBookingTimeoutCandidate(
  row: TourismHeldBookingTimeoutRow,
  now: Date,
  timeoutHours: number = resolveTourismHoldReviewTimeoutHours()
): TourismTimeoutCandidateClassification {
  const { anchorAt, usedStartDateFallback } = resolveTourismHoldReviewAnchorAt(row);
  const ageMs = now.getTime() - anchorAt.getTime();
  const thresholdMs = timeoutHours * 60 * 60 * 1000;
  const pastThreshold = ageMs >= thresholdMs;

  const cancelEligibility = evaluateTourismHeldBookingCancelEligibility({
    status: row.status,
    settlementMode: row.settlementMode,
    providerSettledAt: row.providerSettledAt,
    confirmedAt: row.confirmedAt,
  });

  if (cancelEligibility.kind === 'idempotent') {
    return {
      bucket: 'already_cancelled',
      reason: 'Booking already CANCELLED',
      anchorAt,
      anchorUsedStartDateFallback: usedStartDateFallback,
      ageMs,
    };
  }

  if (cancelEligibility.kind === 'reject') {
    if (
      cancelEligibility.code === 'invalid_settlement_mode' &&
      (row.settlementMode === TourismSettlementMode.UNKNOWN ||
        row.confirmedAt != null ||
        (row.providerSettledAt == null &&
          row.settlementMode === TourismSettlementMode.SETTLE_ON_CONFIRM))
    ) {
      return {
        bucket: 'manual_review',
        reason: cancelEligibility.message,
        anchorAt,
        anchorUsedStartDateFallback: usedStartDateFallback,
        ageMs,
      };
    }

    if (
      row.providerSettledAt != null ||
      row.status === TourismBookingStatus.CONFIRMED ||
      row.status === TourismBookingStatus.COMPLETED ||
      row.settlementMode === TourismSettlementMode.LEGACY_SETTLE_ON_BOOK ||
      row.settlementMode === TourismSettlementMode.PREVIEW_ONLY ||
      row.settlementMode === TourismSettlementMode.SETTLE_ON_CONFIRM
    ) {
      return {
        bucket: 'already_settled_or_terminal',
        reason: cancelEligibility.message,
        anchorAt,
        anchorUsedStartDateFallback: usedStartDateFallback,
        ageMs,
      };
    }

    return {
      bucket: 'ineligible_mode_or_status',
      reason: cancelEligibility.message,
      anchorAt,
      anchorUsedStartDateFallback: usedStartDateFallback,
      ageMs,
    };
  }

  if (!pastThreshold) {
    return {
      bucket: 'not_yet_due',
      reason: `Within ${timeoutHours}h review window`,
      anchorAt,
      anchorUsedStartDateFallback: usedStartDateFallback,
      ageMs,
    };
  }

  if (usedStartDateFallback) {
    return {
      bucket: 'manual_review',
      reason: 'Missing createdAt and fxLockedAt; timeout anchor fell back to startDate',
      anchorAt,
      anchorUsedStartDateFallback: true,
      ageMs,
    };
  }

  return {
    bucket: 'eligible',
    reason: 'Past review timeout; pending wallet lock verification in job script',
    anchorAt,
    anchorUsedStartDateFallback: false,
    ageMs,
  };
}
