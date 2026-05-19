import type { Request, Response } from 'express';

import {
  cancelBooking,
  completeBookingViaQr,
  createBooking,
} from '../services/api/BookingService';
import { parseBookingInstantFromClient } from '../utils/bookingUtcTime';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

/**
 * GLOBAL STANDARD: All incoming `timeSlot` (and any future `bookingDate` / `appointmentTime` aliases)
 * MUST be ISO 8601 with explicit `Z` or offset — parsed and stored as UTC instants in the database.
 * API responses use `Date.prototype.toISOString()` (ISO 8601 UTC). Never persist or return naive local
 * wall times without a timezone.
 *
 * QR completion moves VIG B2C→B2B then collects `platformFeeVIG` into the treasury wallet.
 * Set `VIGLOBAL_TREASURY_USER_ID` to a dedicated admin/treasury `User` id in production.
 */

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export async function postCreateBooking(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const businessId = readString((body as { businessId?: unknown }).businessId);
    const serviceId = readString((body as { serviceId?: unknown }).serviceId);
    const timeSlotRaw =
      readString((body as { timeSlot?: unknown }).timeSlot) ??
      readString((body as { bookingDate?: unknown }).bookingDate) ??
      readString((body as { appointmentTime?: unknown }).appointmentTime);

    if (!businessId || !serviceId || !timeSlotRaw) {
      jsonFail(
        res,
        'businessId, serviceId, and timeSlot (ISO-8601 UTC with Z or offset) are required. Aliases: bookingDate, appointmentTime.',
        400
      );
      return;
    }

    const parsed = parseBookingInstantFromClient(timeSlotRaw);
    if (!parsed.ok) {
      jsonFail(res, parsed.error, 400);
      return;
    }
    const timeSlot = parsed.instant;

    const result = await createBooking({
      userId,
      businessId,
      serviceId,
      timeSlot,
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        business_not_found: 404,
        service_not_found: 404,
        service_business_mismatch: 400,
        wallet_not_found: 404,
        insufficient_preauth: 409,
        self_booking_forbidden: 400,
        concurrency_conflict: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid booking request',
        business_not_found: 'Business not found',
        service_not_found: 'Service not found',
        service_business_mismatch: 'Service does not belong to the given business',
        wallet_not_found: 'Wallet not found',
        insufficient_preauth:
          'Insufficient spendable VIO Credits for full service price lock (100% pre-authorization)',
        self_booking_forbidden: 'Self-booking is prohibited for integrity reasons.',
        concurrency_conflict: 'Booking transaction conflict; please retry.',
      };
      const status = statusMap[result.reason];
      jsonFail(res, msgMap[result.reason], status);
      return;
    }

    jsonOk(
      res,
      {
        booking: result.booking,
        ...(result.qrCompletionToken !== undefined
          ? { qrCompletionToken: result.qrCompletionToken }
          : {}),
      },
      201
    );
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postCompleteBookingViaQr(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const bookingId = readString((body as { bookingId?: unknown }).bookingId);
    const qrCodeToken = readString((body as { qrCodeToken?: unknown }).qrCodeToken);

    if (!bookingId || !qrCodeToken) {
      jsonFail(res, 'bookingId and qrCodeToken are required', 400);
      return;
    }

    const result = await completeBookingViaQr({ authUserId, bookingId, qrCodeToken });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        booking_not_found: 404,
        forbidden: 403,
        invalid_token: 400,
        already_completed: 409,
        no_qr_handshake: 400,
        self_booking_forbidden: 400,
        wallet_not_found: 404,
        insufficient_locked_funds: 409,
        insufficient_merchant_funds: 409,
        treasury_not_configured: 503,
        concurrency_conflict: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid completion request',
        booking_not_found: 'Booking not found',
        forbidden: 'You are not allowed to complete this booking',
        invalid_token: 'Invalid or expired QR completion token',
        already_completed: 'Booking is already completed or cancelled',
        no_qr_handshake: 'This booking has no QR completion token (no funds were locked)',
        self_booking_forbidden: 'Self-booking is prohibited for integrity reasons.',
        wallet_not_found: 'Required wallet not found',
        insufficient_locked_funds: 'Booker locked balance is insufficient for this booking (funds mismatch)',
        insufficient_merchant_funds:
          'Merchant wallet has insufficient VIO Credits for the platform commission',
        treasury_not_configured: 'Treasury wallet is not configured (VIGLOBAL_TREASURY_USER_ID)',
        concurrency_conflict: 'Completion transaction conflict; please retry.',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, {
      bookingId: result.bookingId,
      releasedFromLockVIG: result.releasedFromLockVIG,
      paidFromBookerVIG: result.paidFromBookerVIG,
      platformFeeVIG: result.platformFeeVIG,
      merchantNetVIG: result.merchantNetVIG,
    });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postCancelBooking(req: Request, res: Response): Promise<void> {
  try {
    const authUserId = readAuthUserId(req);
    if (!authUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const bookingId = readString((body as { bookingId?: unknown }).bookingId);
    if (!bookingId) {
      jsonFail(res, 'bookingId is required', 400);
      return;
    }

    const result = await cancelBooking({ authUserId, bookingId });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        booking_not_found: 404,
        forbidden: 403,
        self_booking_forbidden: 400,
        already_completed: 409,
        wallet_not_found: 404,
        insufficient_locked_funds: 409,
        treasury_not_configured: 503,
        concurrency_conflict: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid cancel request',
        booking_not_found: 'Booking not found',
        forbidden: 'You are not allowed to cancel this booking',
        self_booking_forbidden: 'Self-booking is prohibited for integrity reasons.',
        already_completed: 'Booking is already completed or cancelled',
        wallet_not_found: 'Required wallet not found',
        insufficient_locked_funds: 'Locked balance does not match booking lock (reconciliation error)',
        treasury_not_configured: 'Treasury wallet is not configured (VIGLOBAL_TREASURY_USER_ID)',
        concurrency_conflict: 'Cancel transaction conflict; please retry.',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, {
      bookingId: result.bookingId,
      refundedToBookerVIG: result.refundedToBookerVIG,
      penaltyToMerchantVIG: result.penaltyToMerchantVIG,
      penaltyToTreasuryVIG: result.penaltyToTreasuryVIG,
    });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

/** @deprecated Insecure — escrow release requires POST /api/bookings/complete-via-qr with QR token. */
export async function postCompleteBookingLegacy(_req: Request, res: Response): Promise<void> {
  jsonFail(
    res,
    'Deprecated and disabled: booking completion without QR handshake is insecure. Use POST /api/bookings/complete-via-qr with bookingId and qrCodeToken.',
    410
  );
}
