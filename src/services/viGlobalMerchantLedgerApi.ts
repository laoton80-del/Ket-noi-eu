import { restApiFetchJson } from './apiClient';

export type MerchantLedgerItem = Readonly<{
  id: string;
  senderId: string;
  amountVIG: number;
  feeAmount: number;
  createdAt: string;
}>;

export type MerchantLedgerResponse = Readonly<{
  items: readonly MerchantLedgerItem[];
  page?: number;
  limit?: number;
}>;

export async function fetchMerchantLedger(): Promise<MerchantLedgerResponse | null> {
  const res = await restApiFetchJson<MerchantLedgerResponse>('/api/pay/merchant-ledger', { method: 'GET' });
  if (!res.ok) return null;
  return res.data;
}
