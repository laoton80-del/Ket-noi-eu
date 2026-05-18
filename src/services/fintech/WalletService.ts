import { getVioCreditsLabel } from '../../core/monetization/vioDisplayLabels';
import { syncWalletFromServer } from '../../state/wallet';
import { trackEvent } from '../AnalyticsService';

const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export type P2PTransferResult =
  | Readonly<{
      ok: true;
      transferId: string;
      senderPhone: string;
      recipientPhone: string;
      amountVig: number;
      createdAtIso: string;
    }>
  | Readonly<{
      ok: false;
      code:
        | 'invalid_input'
        | 'self_transfer_not_allowed'
        | 'insufficient_balance'
        | 'service_unavailable'
        | 'server_error';
      messageVi: string;
    }>;

function normalizePhone(raw: string): string {
  return raw.trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
}

function vigTransferAmountBand(amountVig: number): 'small' | 'medium' | 'large' {
  if (amountVig < 100) return 'small';
  if (amountVig < 1_000) return 'medium';
  return 'large';
}

export async function transferVigTokensByPhone(params: Readonly<{
  senderPhone: string;
  recipientPhone: string;
  amountVig: number;
  idempotencyKey: string;
}>): Promise<P2PTransferResult> {
  const senderPhone = normalizePhone(params.senderPhone);
  const recipientPhone = normalizePhone(params.recipientPhone);
  const amountVig = Math.floor(params.amountVig);
  const idempotencyKey = params.idempotencyKey.trim();
  if (senderPhone.length < 8 || recipientPhone.length < 8 || amountVig <= 0 || idempotencyKey.length < 8) {
    return {
      ok: false,
      code: 'invalid_input',
      messageVi: `Thông tin chuyển ${getVioCreditsLabel()} không hợp lệ.`,
    };
  }
  if (senderPhone === recipientPhone) {
    return {
      ok: false,
      code: 'self_transfer_not_allowed',
      messageVi: `Không thể tự chuyển ${getVioCreditsLabel()} cho chính bạn.`,
    };
  }

  if (BACKEND_API_BASE) {
    try {
      const res = await fetch(`${BACKEND_API_BASE}/walletOps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'p2pTransfer',
          senderPhone,
          recipientPhone,
          amount: amountVig,
          idempotencyKey,
        }),
      });
      const text = await res.text();
      const parsed = text ? (JSON.parse(text) as { ok?: boolean; error?: string; transferId?: string }) : {};
      if (!res.ok || parsed.ok !== true) {
        if (parsed.error === 'insufficient_balance') {
          return {
            ok: false,
            code: 'insufficient_balance',
            messageVi: `Số dư ${getVioCreditsLabel()} không đủ để chuyển.`,
          };
        }
        return { ok: false, code: 'server_error', messageVi: 'Không thể xử lý chuyển khoản lúc này.' };
      }
      await syncWalletFromServer();
      return {
        ok: true,
        transferId: parsed.transferId ?? `p2p_${Date.now()}`,
        senderPhone,
        recipientPhone,
        amountVig,
        createdAtIso: new Date().toISOString(),
      };
    } catch {
      return {
        ok: false,
        code: 'service_unavailable',
        messageVi: `Dịch vụ chuyển ${getVioCreditsLabel()} tạm thời gián đoạn.`,
      };
    }
  }

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/transfer_vig_tokens_p2p`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_phone: senderPhone,
          recipient_phone: recipientPhone,
          amount_vig: amountVig,
          p_idempotency_key: idempotencyKey,
        }),
      });
      if (!res.ok) {
        return {
          ok: false,
          code: 'server_error',
          messageVi: `Supabase từ chối giao dịch chuyển ${getVioCreditsLabel()}.`,
        };
      }
      const parsed = (await res.json()) as {
        ok?: boolean;
        transfer_id?: string;
        code?: string;
        message_vi?: string;
      };
      if (parsed.ok !== true) {
        if (parsed.code === 'insufficient_balance') {
          return { ok: false, code: 'insufficient_balance', messageVi: parsed.message_vi ?? 'Số dư không đủ.' };
        }
        return { ok: false, code: 'server_error', messageVi: parsed.message_vi ?? 'Chuyển khoản thất bại.' };
      }
      await syncWalletFromServer();
      trackEvent('wallet_p2p_transfer_completed', {
        rail: 'supabase_rpc',
        amountBand: vigTransferAmountBand(amountVig),
      });
      return {
        ok: true,
        transferId: parsed.transfer_id ?? `p2p_${Date.now()}`,
        senderPhone,
        recipientPhone,
        amountVig,
        createdAtIso: new Date().toISOString(),
      };
    } catch {
      return { ok: false, code: 'service_unavailable', messageVi: 'Không thể kết nối Supabase để chuyển khoản.' };
    }
  }

  return {
    ok: false,
    code: 'service_unavailable',
    messageVi: `Chưa cấu hình backend/Supabase cho chuyển P2P ${getVioCreditsLabel()}.`,
  };
}

