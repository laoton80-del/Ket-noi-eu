/**
 * Tourism B2C checkout settlement mode (server-only).
 *
 * `TOURISM_SETTLEMENT_MODE` (explicit opt-in only for hold):
 *
 * - **(unset)** → `legacy_settle_on_book` — preserves pre-hold behavior until rollout.
 * - `legacy_settle_on_book` | `legacy` — compatibility / kill switch; settle tourist + pay
 *   provider/treasury at book; tags `LEGACY_SETTLE_ON_BOOK` + `providerSettledAt`.
 * - `hold` | `hold_on_submit` — **requires explicit env.** Hold VIO Credits on submit
 *   (`balanceVIG` → `lockedBalanceVIG`, `BOOKING_LOCK` tx). No provider/treasury payout on
 *   `PENDING`. Enable only after: metadata migration deployed, legacy backfill applied +
 *   finance sign-off, and confirm/settle + cancel/release APIs shipped (or ops-approved pilot).
 * - `preview_only` | `preview` — demo / no-ledger; creates `TourismBooking` row with quote
 *   amounts but **no** wallet mutation (not for production consumer checkout).
 */
export type TourismSettlementModeEnv = 'hold' | 'legacy_settle_on_book' | 'preview_only';

/** Default when `TOURISM_SETTLEMENT_MODE` is unset — must not lock funds without explicit hold opt-in. */
const DEFAULT_TOURISM_SETTLEMENT_MODE: TourismSettlementModeEnv = 'legacy_settle_on_book';

export function getTourismSettlementMode(): TourismSettlementModeEnv {
  const raw = process.env.TOURISM_SETTLEMENT_MODE?.trim().toLowerCase() ?? '';
  if (raw.length === 0) {
    return DEFAULT_TOURISM_SETTLEMENT_MODE;
  }
  if (raw === 'legacy_settle_on_book' || raw === 'legacy') {
    return 'legacy_settle_on_book';
  }
  if (raw === 'preview_only' || raw === 'preview') {
    return 'preview_only';
  }
  if (raw === 'hold' || raw === 'hold_on_submit') {
    return 'hold';
  }
  return DEFAULT_TOURISM_SETTLEMENT_MODE;
}
