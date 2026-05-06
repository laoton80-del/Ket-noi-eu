import { getWalletIdToken } from '../walletFirebaseSession';
import { mergeTrustBackendHeaders } from '../../utils/trustBackendHeaders';

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
const REQUEST_TIMEOUT_MS = 20_000;

type VerifyReceiptResponse = {
  ok?: boolean;
  newBalance?: number;
  error?: string;
};

export async function verifyPurchaseReceipt(
  receiptToken: string,
  platform: 'ios' | 'android',
  tierId: string
): Promise<{ ok: boolean; newBalance?: number; error?: string }> {
  const normalizedReceipt = receiptToken.trim();
  const normalizedTierId = tierId.trim();
  if (!normalizedReceipt) return { ok: false, error: 'receipt_token_required' };
  if (!normalizedTierId) return { ok: false, error: 'tier_id_required' };
  if (!BACKEND_API_BASE) return { ok: false, error: 'backend_api_base_missing' };

  const token = await getWalletIdToken(true);
  if (!token) return { ok: false, error: 'wallet_auth_token_missing' };

  const headers = await mergeTrustBackendHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BACKEND_API_BASE}/verifyReceipt`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        receiptToken: normalizedReceipt,
        platform,
        tierId: normalizedTierId,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    let payload: VerifyReceiptResponse = {};
    try {
      if (text) payload = JSON.parse(text) as VerifyReceiptResponse;
    } catch {
      return { ok: false, error: 'verify_receipt_parse_error' };
    }
    if (!res.ok) {
      return {
        ok: false,
        error: typeof payload.error === 'string' ? payload.error : `verify_receipt_${res.status}`,
      };
    }
    return {
      ok: payload.ok === true,
      newBalance: typeof payload.newBalance === 'number' ? payload.newBalance : undefined,
      error: payload.ok === true ? undefined : typeof payload.error === 'string' ? payload.error : 'verify_receipt_failed',
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, error: 'verify_receipt_timeout' };
    }
    return { ok: false, error: 'verify_receipt_network_error' };
  } finally {
    clearTimeout(timeout);
  }
}
