/**
 * GLOBAL STANDARD (ViGlobal bookings):
 * All incoming `timeSlot` / `bookingDate` / `appointmentTime` from clients MUST be ISO 8601 instants
 * with an explicit UTC designator (`Z`) or numeric offset (`±hh:mm`). Never accept naive wall-clock
 * strings without a timezone — that would make US / EU / Asia behavior ambiguous.
 *
 * PostgreSQL `DateTime` is persisted in UTC; Prisma returns JS `Date` in the runtime’s local
 * interpretation — always serialize to the API as `Date.prototype.toISOString()` (ISO 8601 UTC).
 */

export type ParseBookingInstantResult =
  | Readonly<{ ok: true; instant: Date }>
  | Readonly<{ ok: false; error: string }>;

/**
 * Validates and parses a client-supplied booking instant. Rejects timezone-less ISO strings.
 */
export function parseBookingInstantFromClient(raw: string): ParseBookingInstantResult {
  const s = raw.trim();
  if (s.length === 0) {
    return { ok: false, error: 'Datetime string is required' };
  }

  const hasExplicitZone =
    /Z$/i.test(s) || /[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s);
  if (!hasExplicitZone) {
    return {
      ok: false,
      error:
        'GLOBAL STANDARD: booking time must be ISO 8601 with explicit UTC (Z) or offset (e.g. +00:00). Do not send naive local datetimes without a timezone.',
    };
  }

  const instant = new Date(s);
  if (Number.isNaN(instant.getTime())) {
    return { ok: false, error: 'Invalid ISO 8601 datetime' };
  }

  return { ok: true, instant };
}
