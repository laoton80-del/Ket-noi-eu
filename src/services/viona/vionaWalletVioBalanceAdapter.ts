/**
 * Pack31 — Wallet VIO-Credits balance adapter (terminology-correction boundary, mock/legacy-safe).
 *
 * The platform's internal-currency brand name is "VIO Credits" (VIO). The existing, live
 * `Wallet.balanceVIG` / `Wallet.lockedBalanceVIG` Prisma fields (shared with Tourism, the
 * AI-gateway debit, and every other vertical) are **intentionally left unrenamed** — renaming a
 * live, shared column would require its own migration and would risk breaking those other
 * verticals. This module is the **one, narrow** place that reads those legacy field names and
 * maps them to a `VIO`-named interface; every other Pack31 file (`vionaRequestEscrowHoldService.ts`
 * and its callers) only ever sees `VionaWalletVioBalance` — never `balanceVIG`/`lockedBalanceVIG`
 * directly — matching the operator's Adapter Pattern instruction exactly.
 *
 * No DB access of its own: this is a pure mapping function. The actual `Wallet` read/write still
 * happens inside `vionaRequestEscrowHoldService.ts`'s own `$transaction` (which necessarily uses
 * the real Prisma field names when talking to Postgres — that is the unavoidable DB boundary, not
 * a "new Vig-named variable").
 */

export type VionaLegacyWalletRow = Readonly<{
  id: string;
  balanceVIG: number;
  lockedBalanceVIG: number;
}>;

export type VionaWalletVioBalance = Readonly<{
  walletId: string;
  balanceVIO: number;
  lockedBalanceVIO: number;
}>;

/**
 * Maps a raw `Wallet` row (legacy Prisma field names) to the `VIO`-named shape every Pack31
 * function consumes. Pure, synchronous, no side effects.
 */
export function mapLegacyWalletRowToVioBalance(row: VionaLegacyWalletRow): VionaWalletVioBalance {
  return {
    walletId: row.id,
    balanceVIO: row.balanceVIG,
    lockedBalanceVIO: row.lockedBalanceVIG,
  };
}
