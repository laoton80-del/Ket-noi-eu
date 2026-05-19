/**
 * Tourism B2C checkout settlement mode (server-only).
 *
 * `TOURISM_SETTLEMENT_MODE`:
 * - `hold` (default) — hold VIO Credits on submit; no provider/treasury payout until confirm pack.
 * - `legacy_settle_on_book` — kill switch / staging QA; immediate settle-on-book + metadata tags.
 * - `preview_only` — quote row only; no wallet mutation (demo / pilot preview).
 */
export type TourismSettlementModeEnv = 'hold' | 'legacy_settle_on_book' | 'preview_only';

export function getTourismSettlementMode(): TourismSettlementModeEnv {
  const raw = process.env.TOURISM_SETTLEMENT_MODE?.trim().toLowerCase() ?? '';
  if (raw === 'legacy_settle_on_book' || raw === 'legacy') {
    return 'legacy_settle_on_book';
  }
  if (raw === 'preview_only' || raw === 'preview') {
    return 'preview_only';
  }
  if (raw === 'hold' || raw === 'hold_on_submit') {
    return 'hold';
  }
  return 'hold';
}
