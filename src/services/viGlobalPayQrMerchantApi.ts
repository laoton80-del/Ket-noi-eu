import { restApiFetchJson } from './apiClient';

export type QrMerchantPayResponse = Readonly<{
  grossVIG: number;
  platformFeeVIG: number;
  vendorNetVIG: number;
  feePercentApplied: number;
  payerTransactionId: string;
  merchantTransactionId: string;
  treasuryTransactionId: string;
}>;

/** Tourist wallet → VN merchant + treasury split (requires JWT + configured treasury). */
export async function postQrMerchantPayment(input: Readonly<{
  merchantUserId?: string;
  merchantPhone?: string;
  amountVIG: number;
  feePercent?: number;
}>): Promise<{ ok: true; data: QrMerchantPayResponse } | { ok: false; error: string; status: number }> {
  const res = await restApiFetchJson<QrMerchantPayResponse>('/api/pay/qr-merchant', {
    method: 'POST',
    body: {
      merchantUserId: input.merchantUserId,
      merchantPhone: input.merchantPhone,
      amountVIG: input.amountVIG,
      feePercent: input.feePercent,
    },
  });
  if (!res.ok) return { ok: false, error: res.error, status: res.status };
  return { ok: true, data: res.data };
}
