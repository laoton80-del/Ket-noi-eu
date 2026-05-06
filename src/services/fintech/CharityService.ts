/**
 * Charity ledger contract.
 *
 * IMPORTANT:
 * - 1% deduction logic MUST run server-side from real platform net revenue.
 * - Client only reads aggregated totals and can send non-sensitive payment event references.
 */

/** Prefer Node API that exposes `GET /api/charity/totals` (CharityLedgerEntry aggregate). */
function resolveLedgerApiBase(): string {
  const a = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
  const b = process.env.EXPO_PUBLIC_PAYMENTS_API_BASE?.trim() ?? '';
  return a.length > 0 ? a : b;
}

export type CharityLedgerRow = Readonly<{
  id: string;
  amountAddedUsd: number;
  createdAt: string;
}>;

export type CharityTotals = Readonly<{
  totalUsd: number;
  rowCount: number;
  updatedAtIso: string;
}>;

type CharityTotalsResponse = Readonly<{
  totalUsd?: number;
  rowCount?: number;
  updatedAtIso?: string;
}>;

/**
 * Server-side webhook contract (documented for backend implementation):
 * - input: captured Stripe payment event (trusted backend context)
 * - compute: charity = platform_net_revenue * 0.01
 * - persist into Supabase `charity_ledger`:
 *   `id`, `amount_added_usd`, `created_at`
 *
 * NOTE: this function intentionally throws in app runtime to prevent client-side usage.
 */
export async function processCharityLedgerServerOnly(_stripeEventId: string): Promise<never> {
  throw new Error('charity_server_only: run this in backend webhook environment');
}

/**
 * Optional client signal to backend after payment success.
 * Backend must independently verify event and compute 1% from private revenue data.
 */
export async function notifyCharityEligiblePayment(params: Readonly<{
  paymentEventId: string;
  source: 'wallet_topup' | 'marketplace' | 'subscription' | 'other';
}>): Promise<boolean> {
  const payBase = resolveLedgerApiBase();
  if (!payBase) return false;
  const eventId = params.paymentEventId.trim();
  if (eventId.length < 12) return false;
  try {
    const res = await fetch(`${payBase.replace(/\/+$/, '')}/charity/notify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentEventId: eventId,
        source: params.source,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Backend-only reconciliation contract:
 * compare monthly platform settled fee totals versus charity ledger totals.
 */
export async function reconcileCharityLedgerServerOnly(_monthKey: string): Promise<never> {
  throw new Error('charity_reconciliation_server_only');
}

/**
 * Public aggregate used by Charity Corner widget.
 */
type CharityTotalsEnvelope = Readonly<{
  success?: boolean;
  data?: CharityTotalsResponse;
}>;

export async function readCharityLedgerTotals(): Promise<CharityTotals> {
  const base = resolveLedgerApiBase();
  if (!base) {
    return {
      totalUsd: 0,
      rowCount: 0,
      updatedAtIso: new Date().toISOString(),
    };
  }
  try {
    const url = `${base.replace(/\/+$/, '')}/api/charity/totals`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        totalUsd: 0,
        rowCount: 0,
        updatedAtIso: new Date().toISOString(),
      };
    }
    const raw: unknown = await res.json();
    const data: CharityTotalsResponse =
      typeof raw === 'object' && raw !== null && 'data' in raw && typeof (raw as CharityTotalsEnvelope).data === 'object'
        ? ((raw as CharityTotalsEnvelope).data ?? {})
        : (raw as CharityTotalsResponse);
    return {
      totalUsd: Number.isFinite(data.totalUsd) ? Math.max(0, data.totalUsd ?? 0) : 0,
      rowCount: Number.isFinite(data.rowCount) ? Math.max(0, Math.floor(data.rowCount ?? 0)) : 0,
      updatedAtIso: typeof data.updatedAtIso === 'string' && data.updatedAtIso.length > 0 ? data.updatedAtIso : new Date().toISOString(),
    };
  } catch {
    return {
      totalUsd: 0,
      rowCount: 0,
      updatedAtIso: new Date().toISOString(),
    };
  }
}
