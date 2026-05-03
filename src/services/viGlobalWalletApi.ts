import { applyRestApiVigBalance } from '../state/wallet';
import type { ServiceResult } from '../types/serviceResult';
import { restApiFetchJson } from './apiClient';
/**
 * VIG is **closed-loop** — any future “redeem to bank” API must call {@link assertVigFiatWithdrawalForbidden}
 * from `./billing/VigTokenService` (Pillar 4). P2P transfers stay in-app only.
 */

export type WalletBalanceData = Readonly<{
  balanceVIG: number;
  /** Present when API returns booking lock breakdown (V6.4+). */
  lockedBalanceVIG?: number;
  walletId: string;
}>;

export type WalletTransferData = Readonly<{
  senderWalletId: string;
  receiverWalletId: string;
  amountVIG: number;
  feeVIG: number;
  senderTransactionId: string;
  receiverTransactionId: string;
}>;

export async function fetchBalance(): Promise<ServiceResult<WalletBalanceData>> {
  const res = await restApiFetchJson<WalletBalanceData>('/api/wallet/balance', { method: 'GET' });
  if (!res.ok) {
    return { ok: false, error: res.error, status: res.status, unreachable: res.unreachable };
  }
  applyRestApiVigBalance(res.data.balanceVIG);
  return { ok: true, data: res.data };
}

export async function transferVIG(
  receiverId: string,
  amount: number,
  feeVIG?: number
): Promise<ServiceResult<WalletTransferData>> {
  const toUserId = receiverId.trim();
  if (toUserId.length === 0) {
    return { ok: false, error: 'receiverId không hợp lệ.', status: 400 };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Số VIG phải là số dương.', status: 400 };
  }

  const body: { toUserId: string; amountVIG: number; feeVIG?: number } = {
    toUserId,
    amountVIG: amount,
  };
  if (feeVIG !== undefined) body.feeVIG = feeVIG;

  const res = await restApiFetchJson<WalletTransferData>('/api/wallet/transfer', {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    return { ok: false, error: res.error, status: res.status, unreachable: res.unreachable };
  }

  const bal = await restApiFetchJson<WalletBalanceData>('/api/wallet/balance', { method: 'GET' });
  if (bal.ok) {
    applyRestApiVigBalance(bal.data.balanceVIG);
  }

  return { ok: true, data: res.data };
}
