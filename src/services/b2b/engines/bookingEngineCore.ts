import type { B2BBookingStatus } from '../../../domain/b2b';

/** Bookings in these statuses do not consume capacity. */
export const BOOKING_NON_BLOCKING_STATUSES: B2BBookingStatus[] = ['canceled', 'failed'];

export function isBlockingBookingStatus(status: B2BBookingStatus): boolean {
  return !BOOKING_NON_BLOCKING_STATUSES.includes(status);
}

/** Half-open [startMs, endMs) overlaps Firestore interval [bStart, bEnd) if endMs > bStart && startMs < bEnd (same instant semantics). */
export function intervalsOverlapHalfOpen(startMs: number, endMs: number, bStartMs: number, bEndMs: number): boolean {
  return endMs > bStartMs && startMs < bEndMs;
}

export type OverlapBookingLike = {
  id: string;
  startsAtMs: number;
  endsAtMs: number;
  resourceIds: string[];
  status: B2BBookingStatus;
};

export function bookingConflictsWithWindow(b: OverlapBookingLike, startMs: number, endMs: number, resourceIds: Set<string>): boolean {
  if (!isBlockingBookingStatus(b.status)) return false;
  const touchesResource = b.resourceIds.some((r) => resourceIds.has(r));
  if (!touchesResource) return false;
  return intervalsOverlapHalfOpen(startMs, endMs, b.startsAtMs, b.endsAtMs);
}

export function anyConflict(
  candidates: OverlapBookingLike[],
  startMs: number,
  endMs: number,
  resourceIds: Set<string>
): OverlapBookingLike | undefined {
  return candidates.find((b) => bookingConflictsWithWindow(b, startMs, endMs, resourceIds));
}

/** Choose first candidate with no conflicts against existing bookings (single resource per candidate). */
export function pickFirstFreeResource(
  candidateOrder: string[],
  existing: OverlapBookingLike[],
  windowStartMs: number,
  windowEndMs: number,
  partySize: number | undefined,
  resourceCapacity: (resourceId: string) => number | undefined
): string[] | undefined {
  for (const rid of candidateOrder) {
    const cap = resourceCapacity(rid);
    if (partySize != null && cap != null && partySize > cap) continue;
    const conflict = anyConflict(existing, windowStartMs, windowEndMs, new Set([rid]));
    if (!conflict) return [String(rid)];
  }
  return undefined;
}
