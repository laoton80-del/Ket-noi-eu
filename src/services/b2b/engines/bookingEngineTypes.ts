import type { BusinessBooking, B2BBusinessType } from '../../../domain/b2b';

export type BookingAvailabilityResult =
  | { ok: true; suggestedResourceIds: string[] }
  | { ok: false; reason: 'overlap' | 'outside_hours' | 'invalid_resource' | 'party_size' | 'unknown' };

export type CreateBookingCommand = {
  tenantId: string;
  locationId: string;
  businessType: B2BBusinessType;
  serviceIds: string[];
  /** Explicit resources to book (multi-resource supported, e.g. nail table + chair). */
  resourceIds: string[];
  /**
   * When resourceIds is empty, engine picks the first free resource from candidates (order preserved).
   * Must align with location and active resources.
   */
  resourceCandidateIds?: string[];
  startsAtMs: number;
  endsAtMs: number;
  customerPhoneE164?: string;
  customerName?: string;
  partySize?: number;
  /** Stable per attempt — use `bookingIdempotencyKey(callSessionId, slotDigest)` from reliability/idempotency. */
  idempotencyKey: string;
  sourceCallSessionId?: string;
  notes?: string;
  /**
   * When false, persist as `pending_confirm` / inquiry — **no** usage billing or wallet debit.
   * Hospitality default-inquiry flows should use false until staff confirms.
   */
  billable?: boolean;
  stayCheckInDate?: string;
  stayCheckOutDate?: string;
  adults?: number;
  children?: number;
  roomUnitLabel?: string;
  isInquiryOnly?: boolean;
  /** Optional; server may also generate from `buildBookingHandoffSummary` after persist. */
  staffHandoffSummary?: string;
  /**
   * Voice `stay_booking` on a non–hospitality_stay tenant: allow provisional record without resource ids
   * (inquiry-only; same billing rules as hospitality stay inquiry).
   */
  treatAsStayInquiry?: boolean;
};

export type CreateBookingResult =
  | { ok: true; booking: BusinessBooking; billingEventId?: string }
  | { ok: false; code: string; message?: string };
