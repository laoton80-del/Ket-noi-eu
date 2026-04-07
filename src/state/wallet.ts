import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { CurrencyCode } from '../config/Pricing';
import { getWalletIdToken } from '../services/walletFirebaseSession';
import { devWarn } from '../utils/devLog';
import { mergeTrustBackendHeaders } from '../utils/trustBackendHeaders';
import { STORAGE_KEYS } from '../storage/storageKeys';

/**
 * Client wallet snapshot (display + cached history). Authoritative balances come from `walletOps` + `syncWalletFromServer`.
 *
 * **Do not** debit or grant Credits locally for product flows — use:
 * - `topupCreditsServer` (+ prior payment verify)
 * - `chargeTrustedService`, `reserveAndCommitCredits`, `rollbackReservedCredits`
 *
 * `deductCredits` / `addCredits` / `rollbackConsumeByTxId` were removed (Phase 1); they mutated local state only and were a trust footgun.
 * `setWalletState` is not exported (Phase 2) — no supported client path to rewrite balances outside server sync.
 */
export type Transaction = {
  id: string;
  type: 'topup' | 'consume';
  amount: number;
  date: string;
  description: string;
  paymentAmount?: number;
  paymentCurrencyCode?: CurrencyCode;
  paymentCurrencySymbol?: string;
  paymentSnapshotLabel?: string;
  timestampSnapshotLabel?: string;
};

export type WalletState = {
  credits: number;
  lifetimeSpent: number;
  transactions: Transaction[];
};

let walletState: WalletState = {
  credits: 0,
  lifetimeSpent: 0,
  transactions: [],
};
const WALLET_STORAGE_KEY = STORAGE_KEYS.wallet;
const BACKEND_API_BASE = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

void (async () => {
  try {
    const raw = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<WalletState>;
    if (typeof parsed.credits !== 'number' || !Array.isArray(parsed.transactions)) return;
    walletState = {
      credits: parsed.credits,
      lifetimeSpent: typeof parsed.lifetimeSpent === 'number' ? parsed.lifetimeSpent : 0,
      transactions: parsed.transactions as Transaction[],
    };
    emit();
  } catch {
    // Ignore corrupted local wallet snapshots.
  }
})();

function persistWalletState() {
  void AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletState));
}

async function callWalletOps<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  if (!BACKEND_API_BASE) throw new Error('backend_api_base_missing');
  const token = await getWalletIdToken();
  if (!token) throw new Error('wallet_auth_token_missing');
  const headers = await mergeTrustBackendHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });
  const res = await fetch(`${BACKEND_API_BASE}/walletOps`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let parsed: T & { ok?: boolean; error?: string } = {} as T & { ok?: boolean; error?: string };
  try {
    if (text) parsed = JSON.parse(text) as typeof parsed;
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    if (__DEV__) {
      const errStr = typeof parsed.error === 'string' ? parsed.error : undefined;
      devWarn('walletOps', 'wallet_ops_http_error', {
        status: res.status,
        error: errStr,
        op: String(payload.op ?? ''),
        bodyPreview: text.slice(0, 200),
      });
      if (String(payload.op ?? '') === 'topup' && errStr?.startsWith('payment_receipt_')) {
        devWarn('walletOps', 'wallet_topup_receipt_gate', {
          error: errStr,
          doc: 'docs/RECEIPT_STRICTNESS.md',
        });
      }
    }
    const code = typeof parsed.error === 'string' ? parsed.error : `wallet_ops_${res.status}`;
    throw new Error(code);
  }
  return parsed as T;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWalletState(): WalletState {
  return walletState;
}

export function useWalletState(): WalletState {
  return useSyncExternalStore(subscribe, getWalletState, getWalletState);
}

export async function syncWalletFromServer(): Promise<void> {
  try {
    const data = await callWalletOps<{ ok: boolean; credits?: number; lifetimeSpent?: number }>({ op: 'get' });
    if (!data.ok) return;
    walletState = {
      ...walletState,
      credits: typeof data.credits === 'number' ? data.credits : walletState.credits,
      lifetimeSpent: typeof data.lifetimeSpent === 'number' ? data.lifetimeSpent : walletState.lifetimeSpent,
    };
    persistWalletState();
    emit();
  } catch {
    // keep local snapshot
  }
}

export async function reserveAndCommitCredits(
  amount: number,
  idempotencyKey: string
): Promise<{ ok: boolean }> {
  try {
    const reserve = await callWalletOps<{ ok: boolean }>({ op: 'reserve', amount, idempotencyKey });
    if (!reserve.ok) return { ok: false };
    const commit = await callWalletOps<{ ok: boolean }>({ op: 'commit', idempotencyKey });
    if (!commit.ok) {
      await callWalletOps({ op: 'rollback', idempotencyKey });
      return { ok: false };
    }
    await syncWalletFromServer();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function rollbackReservedCredits(idempotencyKey: string): Promise<void> {
  try {
    await callWalletOps({ op: 'rollback', idempotencyKey });
    await syncWalletFromServer();
  } catch {
    // ignore
  }
}

export type TrustedMonetizedServiceKind = 'leona_outbound' | 'letan_booking';

/** Server-authoritative debit for monetized flows; idempotent per key. */
export async function chargeTrustedService(params: {
  amount: number;
  idempotencyKey: string;
  serviceKind: TrustedMonetizedServiceKind;
}): Promise<{ ok: boolean }> {
  try {
    const key = params.idempotencyKey.trim();
    if (!key) return { ok: false };
    const out = await callWalletOps<{ ok: boolean }>({
      op: 'chargeTrustedService',
      amount: params.amount,
      idempotencyKey: key,
      serviceKind: params.serviceKind,
    });
    if (!out.ok) return { ok: false };
    await syncWalletFromServer();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Grant credits only once per immutable payment event id (server ledger). */
export async function topupCreditsServer(amount: number, paymentEventId: string): Promise<{ ok: boolean }> {
  const pei = paymentEventId.trim();
  if (!pei) return { ok: false };
  try {
    const out = await callWalletOps<{ ok: boolean }>({ op: 'topup', amount, paymentEventId: pei });
    if (!out.ok) return { ok: false };
    await syncWalletFromServer();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
