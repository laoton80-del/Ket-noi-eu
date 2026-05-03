import { restApiFetchJson, type ApiRequestResult } from '../apiClient';

export type MerchantVietQrResponse = Readonly<{
  pngDataUrl: string;
  emvPayload: string;
  amountVnd: number;
  purpose: string;
  vigAmount: number;
  fx: Readonly<{ eurVnd: number; asOfIso: string; source: string }>;
}>;

/** GET `/api/pay/viet-qr?amountVig=` — B2B_VN merchant offline VietQR (requires bank fields on `Business`). */
export async function fetchMerchantVietQr(
  amountVig: number
): Promise<ApiRequestResult<MerchantVietQrResponse>> {
  const q = Number.isFinite(amountVig) && amountVig > 0 ? String(amountVig) : '100';
  return restApiFetchJson<MerchantVietQrResponse>(`/api/pay/viet-qr?amountVig=${encodeURIComponent(q)}`);
}
