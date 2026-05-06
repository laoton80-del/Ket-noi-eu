/**
 * Time discipline: persist **UTC** ISO 8601 (`…Z`) for Supabase `timestamptz`;
 * render using device timezone or explicit IANA zone via `Intl` (no extra deps).
 */

export function nowUtcIso(): string {
  return new Date().toISOString();
}

export function parseUtcIso(isoUtc: string): Date {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`Invalid UTC ISO string: ${isoUtc}`);
  }
  return d;
}

/** Serialize for Supabase — always UTC with `Z` suffix. */
export function toSupabaseUtcIso(date: Date): string {
  return date.toISOString();
}

export function formatDeviceLocalFromUtc(
  isoUtc: string,
  options?: Intl.DateTimeFormatOptions,
  locales?: string | readonly string[]
): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return isoUtc;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locales, {
    timeZone: tz,
    ...options,
  }).format(d);
}

export function formatInTimeZone(
  isoUtc: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions,
  locales?: string | readonly string[]
): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return isoUtc;
  try {
    return new Intl.DateTimeFormat(locales, {
      timeZone,
      ...options,
    }).format(d);
  } catch {
    return formatDeviceLocalFromUtc(isoUtc, options, locales);
  }
}
