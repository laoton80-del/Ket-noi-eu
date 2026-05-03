/**
 * Live EUR→VND spot for VIG cash/VietQR hints (VIG ≡ EUR 1:1 in ledger policy).
 * Server-only — uses public FX with env fallback when the network is unavailable.
 */

const DEFAULT_FALLBACK_EUR_VND = 27_000;
const FETCH_TIMEOUT_MS = 6_000;

function readFallbackEurVnd(): number {
  const raw = process.env.EUR_VND_FALLBACK_RATE?.trim();
  if (!raw || raw.length === 0) return DEFAULT_FALLBACK_EUR_VND;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1_000 || n > 200_000) return DEFAULT_FALLBACK_EUR_VND;
  return n;
}

export type EurVndSpot = Readonly<{
  /** VND per 1 EUR (major). */
  eurVnd: number;
  asOfIso: string;
  source: string;
}>;

/**
 * Real-time EUR/VND mid rate (exchangerate.host). Falls back to `EUR_VND_FALLBACK_RATE` or 27000.
 */
export async function fetchEurVndSpot(): Promise<EurVndSpot> {
  const fallback = readFallbackEurVnd();
  const asOfIso = new Date().toISOString();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=VND', {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { eurVnd: fallback, asOfIso, source: 'fallback_http_error' };
    }
    const body = (await res.json()) as { rates?: { VND?: number } };
    const vnd = body.rates?.VND;
    if (typeof vnd === 'number' && Number.isFinite(vnd) && vnd > 1_000 && vnd < 200_000) {
      return { eurVnd: vnd, asOfIso, source: 'exchangerate.host' };
    }
    return { eurVnd: fallback, asOfIso, source: 'fallback_parse' };
  } catch {
    return { eurVnd: fallback, asOfIso, source: 'fallback_network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Convert VIG (EUR-pegged) to integer VND using a locked spot. */
export function vigToVndInteger(vigAmount: number, eurVndRate: number): number {
  if (!Number.isFinite(vigAmount) || !Number.isFinite(eurVndRate)) return 0;
  return Math.max(0, Math.round(vigAmount * eurVndRate));
}
