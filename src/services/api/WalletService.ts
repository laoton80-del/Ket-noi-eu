/**
 * **Server-authoritative wallet façade** (ViGlobal Blueprint).
 *
 * - **Never** mutate VIG balances from React Native / Expo clients.
 * - All credits and debits flow through Prisma `WalletService` (`src/services/WalletService.ts`)
 *   with `Serializable` transactions where races matter.
 *
 * Import this module **only** from Express controllers, jobs, or trusted server scripts — not from UI bundles.
 */
export {
  createWalletForUser,
  creditWalletFromStripePaymentSucceeded,
  debitSpendableVigForAiGateway,
  getWalletBalanceByUserId,
  transferVIG,
  type DebitAiGatewayInput,
  type DebitAiGatewayOutput,
  type StripeTopUpCreditInput,
  type StripeTopUpCreditOutput,
  type TransferVIGInput,
  type TransferVIGOutput,
  type WalletBalanceRow,
  WalletServiceError,
} from '../WalletService';
