/**
 * Maps voice slot text → persisted stay fields for `CreateBookingCommand`.
 * Phase 3.1 — inquiry-first hospitality: dates may remain phrases if not parseable to ISO date.
 */
export function normalizeStayDateInput(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return t.length > 0 ? t.slice(0, 80) : undefined;
}

export function parseOccupancyGuestCounts(occupancy?: string): { adults?: number; children?: number } {
  if (!occupancy?.trim()) return {};
  const adults =
    occupancy.match(/(\d+)\s*(?:adults?|người\s*lớn|khách(?:\s*lớn)?)/iu) ??
    occupancy.match(/\b(\d+)\s*(?:x\s*)?(?:người|người\s*đi)\b/iu);
  const children =
    occupancy.match(/(\d+)\s*(?:children|kids?|trẻ|trẻ\s*em)/iu) ?? occupancy.match(/(\d+)\s*(?:trẻ)/iu);
  const out: { adults?: number; children?: number } = {};
  if (adults?.[1]) {
    const n = parseInt(adults[1], 10);
    if (Number.isFinite(n)) out.adults = n;
  }
  if (children?.[1]) {
    const n = parseInt(children[1], 10);
    if (Number.isFinite(n)) out.children = n;
  }
  return out;
}

export function buildHospitalityStayInquiryNotes(existing?: string): string {
  const tag =
    '[Hospitality · voice inquiry] Recorded as reservation request / inquiry only — not billed; staff must confirm room, rate, and guarantee before treating as a firm booking.';
  if (!existing?.trim()) return tag;
  return `${existing.trim()}\n\n${tag}`;
}
