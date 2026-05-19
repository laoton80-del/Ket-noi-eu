import type { Request, Response } from 'express';

import {
  createTourismBooking,
  getTourismDiscover,
  quoteTourismBooking,
} from '../services/api/TourismHubService';
import {
  completeTourismBookingAsMerchant,
  confirmTourismHeldBookingAsMerchant,
  TourismBookingCompletionError,
  TourismBookingConfirmError,
} from '../services/WalletService';
import { generateUserTripSummary, ViralWrapError } from '../services/marketing/ViralWrapEngine';
import { jsonFail, jsonOk } from '../utils/apiEnvelope';

function readAuthUserId(req: Request): string | null {
  const id = req.authUserId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readPositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < 1) return null;
  return value;
}

function parseIsoInstant(raw: string): Date | null {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function getDiscover(_req: Request, res: Response): Promise<void> {
  try {
    const data = await getTourismDiscover();
    jsonOk(res, data);
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postQuote(req: Request, res: Response): Promise<void> {
  try {
    const body: unknown = req.body;
    if (typeof body !== 'object' || body === null) {
      jsonFail(res, 'Invalid JSON body', 400);
      return;
    }

    const businessId = readString((body as { businessId?: unknown }).businessId);
    const serviceId = readString((body as { serviceId?: unknown }).serviceId);
    const startRaw =
      readString((body as { startDate?: unknown }).startDate) ??
      readString((body as { start?: unknown }).start);
    const endRaw =
      readString((body as { endDate?: unknown }).endDate) ??
      readString((body as { end?: unknown }).end);
    const guestCount = readPositiveInt((body as { guestCount?: unknown }).guestCount);

    if (!businessId || !serviceId || !startRaw || !endRaw || guestCount === null) {
      jsonFail(
        res,
        'businessId, serviceId, startDate, endDate (ISO-8601), and guestCount (positive integer) are required.',
        400
      );
      return;
    }

    const startDate = parseIsoInstant(startRaw);
    const endDate = parseIsoInstant(endRaw);
    if (!startDate || !endDate) {
      jsonFail(res, 'startDate and endDate must be valid ISO-8601 instants.', 400);
      return;
    }

    const result = await quoteTourismBooking({
      businessId,
      serviceId,
      startDate,
      endDate,
      guestCount,
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        business_not_found: 404,
        service_not_found: 404,
        service_business_mismatch: 400,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid tourism quote request',
        business_not_found: 'Business not found',
        service_not_found: 'Tourism service not found',
        service_business_mismatch: 'Service does not belong to the given business',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, { quote: result.quote });
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postBook(req: Request, res: Response): Promise<void> {
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
    const startRaw =
      readString((body as { startDate?: unknown }).startDate) ??
      readString((body as { start?: unknown }).start);
    const endRaw =
      readString((body as { endDate?: unknown }).endDate) ??
      readString((body as { end?: unknown }).end);
    const guestCount = readPositiveInt((body as { guestCount?: unknown }).guestCount);

    if (!businessId || !serviceId || !startRaw || !endRaw || guestCount === null) {
      jsonFail(
        res,
        'businessId, serviceId, startDate, endDate (ISO-8601), and guestCount (positive integer) are required.',
        400
      );
      return;
    }

    const startDate = parseIsoInstant(startRaw);
    const endDate = parseIsoInstant(endRaw);
    if (!startDate || !endDate) {
      jsonFail(res, 'startDate and endDate must be valid ISO-8601 instants.', 400);
      return;
    }

    const result = await createTourismBooking({
      userId,
      businessId,
      serviceId,
      startDate,
      endDate,
      guestCount,
    });

    if (!result.ok) {
      const statusMap: Record<typeof result.reason, number> = {
        invalid_input: 400,
        business_not_found: 404,
        service_not_found: 404,
        service_business_mismatch: 400,
        wallet_not_found: 404,
        insufficient_funds: 409,
        self_booking_forbidden: 400,
        treasury_not_configured: 503,
        treasury_wallet_missing: 503,
        concurrency_conflict: 409,
      };
      const msgMap: Record<typeof result.reason, string> = {
        invalid_input: 'Invalid tourism booking request',
        business_not_found: 'Business not found',
        service_not_found: 'Tourism service not found',
        service_business_mismatch: 'Service does not belong to the given business',
        wallet_not_found: 'Wallet not found',
        insufficient_funds: 'Insufficient spendable VIG for this tourism booking (dual-fee total)',
        self_booking_forbidden: 'Self-booking is prohibited.',
        treasury_not_configured: 'Treasury wallet is not configured (VIGLOBAL_TREASURY_USER_ID)',
        treasury_wallet_missing: 'Treasury user has no wallet row',
        concurrency_conflict: 'Booking transaction conflict; please retry.',
      };
      jsonFail(res, msgMap[result.reason], statusMap[result.reason]);
      return;
    }

    jsonOk(res, { booking: result.booking }, 201);
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

/** `GET /api/tourism/wrap/:bookingId` — AI “Trip Wrapped” stats + viral tagline (auth user must own booking). */
export async function getViralWrap(req: Request, res: Response): Promise<void> {
  try {
    const userId = readAuthUserId(req);
    if (!userId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }
    const bookingId = readString(req.params.bookingId);
    if (!bookingId) {
      jsonFail(res, 'bookingId is required', 400);
      return;
    }
    const data = await generateUserTripSummary(userId, bookingId);
    jsonOk(res, data);
  } catch (e) {
    if (e instanceof ViralWrapError) {
      jsonFail(res, e.message, e.statusCode);
      return;
    }
    console.error('[TourismController] getViralWrap', e);
    jsonFail(res, 'Unexpected error', 500);
  }
}

/** `POST /api/tourism/bookings/:bookingId/confirm` — merchant ACK; settle held VIO Credits. */
export async function postConfirmBooking(req: Request, res: Response): Promise<void> {
  try {
    const merchantUserId = readAuthUserId(req);
    if (!merchantUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const bookingId = readString(req.params.bookingId);
    if (!bookingId) {
      jsonFail(res, 'bookingId is required', 400);
      return;
    }

    try {
      const out = await confirmTourismHeldBookingAsMerchant({ bookingId, merchantUserId });
      jsonOk(res, out);
    } catch (e) {
      if (e instanceof TourismBookingConfirmError) {
        const statusMap: Record<TourismBookingConfirmError['code'], number> = {
          invalid_input: 400,
          booking_not_found: 404,
          forbidden: 403,
          invalid_settlement_mode: 409,
          invalid_status: 409,
          not_held: 409,
          inconsistent_state: 409,
          wallet_not_found: 404,
          treasury_not_configured: 503,
          treasury_wallet_missing: 503,
          insufficient_locked_funds: 409,
          concurrency_conflict: 409,
        };
        jsonFail(res, e.message, statusMap[e.code]);
        return;
      }
      throw e;
    }
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}

export async function postCompleteBooking(req: Request, res: Response): Promise<void> {
  try {
    const merchantUserId = readAuthUserId(req);
    if (!merchantUserId) {
      jsonFail(res, 'Unauthorized', 401);
      return;
    }

    const bookingId = readString(req.params.bookingId);
    if (!bookingId) {
      jsonFail(res, 'bookingId is required', 400);
      return;
    }

    try {
      const out = await completeTourismBookingAsMerchant({ bookingId, merchantUserId });
      jsonOk(res, out);
    } catch (e) {
      if (e instanceof TourismBookingCompletionError) {
        const statusMap: Record<TourismBookingCompletionError['code'], number> = {
          invalid_input: 400,
          booking_not_found: 404,
          forbidden: 403,
          invalid_status: 409,
          treasury_not_configured: 503,
          treasury_wallet_missing: 503,
          insufficient_treasury: 503,
          broker_wallet_missing: 503,
          concurrency_conflict: 409,
        };
        jsonFail(res, e.message, statusMap[e.code]);
        return;
      }
      throw e;
    }
  } catch {
    jsonFail(res, 'Unexpected error', 500);
  }
}
