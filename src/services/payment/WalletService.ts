/**
 * **VIG internal settlement rail** — Prisma `$transaction` only.
 * Do not import Stripe or card PSP clients into this module; fiat top-up stays in `../WalletService` webhooks.
 */

export type {
  QrMerchantPaymentInput,
  QrMerchantPaymentOutput,
  TransferVIGInput,
  TransferVIGOutput,
} from '../WalletService';

export {
  executeQrMerchantVigPayment,
  QrMerchantPaymentError,
  transferVIG,
  WalletServiceError,
} from '../WalletService';

import type { QrMerchantPaymentInput, QrMerchantPaymentOutput } from '../WalletService';
import { executeQrMerchantVigPayment } from '../WalletService';

/**
 * QR merchant payment settled purely in VIG ledgers (tourist debit → vendor + treasury credit).
 * **No Stripe** — card rails are not invoked on this path.
 */
export async function routeVigQrMerchantPaymentInternal(
  input: QrMerchantPaymentInput
): Promise<QrMerchantPaymentOutput> {
  return executeQrMerchantVigPayment(input);
}
