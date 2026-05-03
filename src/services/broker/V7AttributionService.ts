/**
 * **Pillar 3 — Legal & entitlements (Trojan Horse broker tracking).**
 *
 * V7 Broker attribution — **legal-grade** merchant↔broker mapping for lifelong commission.
 * Client prepares **Supabase-shaped** mutations; server enforces uniqueness + audit trail.
 * **Never** mint merchant entitlements from a client-only `brokerId` claim without server verification.
 *
 * Deep link: `viglobal://onboard?brokerId=<UUID>` (verifiable, parseable, no ambiguous query keys).
 * Flyer / tour links must preserve the same `brokerId` query key for CMO attribution parity.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const V7_ATTRIBUTION_SCHEME = 'viglobal' as const;
export const V7_ATTRIBUTION_ONBOARD_PATH = 'onboard' as const;
export const V7_ATTRIBUTION_BROKER_QUERY_KEY = 'brokerId' as const;

/** Default lifelong commission basis points — **server is source of truth**; this is contract default for migrations. */
export const V7_DEFAULT_BROKER_COMMISSION_LIFELONG_BPS = 500 as const;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Canonical onboarding deep link for field QR / printed materials.
 * @throws if brokerId is not a UUID (prevents junk attribution rows).
 */
export function buildBrokerOnboardDeepLink(brokerId: string): string {
  const id = brokerId.trim();
  if (!isValidUuid(id)) {
    throw new Error('V7Attribution: brokerId must be a UUID');
  }
  return `${V7_ATTRIBUTION_SCHEME}://${V7_ATTRIBUTION_ONBOARD_PATH}?${V7_ATTRIBUTION_BROKER_QUERY_KEY}=${encodeURIComponent(id)}`;
}

/**
 * Parse `brokerId` from our onboard URL or returns null (do not guess).
 */
export function parseBrokerIdFromOnboardUrl(raw: string): string | null {
  const s = raw.trim();
  if (s.length === 0) return null;
  const re = new RegExp(`[?&]${V7_ATTRIBUTION_BROKER_QUERY_KEY}=([^&]+)`, 'i');
  const m = s.match(re);
  if (!m?.[1]) return null;
  try {
    const id = decodeURIComponent(m[1].trim());
    return isValidUuid(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * Supabase `broker_merchant_attributions` row (additive; **first-touch wins** on server via unique index).
 * @see Prisma migration — table must enforce `UNIQUE(merchant_id)` and RLS for broker read.
 */
export type V7BrokerMerchantAttributionRow = Readonly<{
  merchant_id: string;
  broker_id: string;
  attributed_at: string;
  /** Basis points on qualifying GMV — legal schedule in `commission_schedule_id` server-side. */
  commission_lifelong_bps: number;
  /** Idempotency / webhook correlation */
  source: 'qr_onboard' | 'admin_link' | 'stripe_connect_metadata';
}>;

export type V7BrokerMerchantAttributionMutation = Readonly<{
  schema: 'public';
  table: 'broker_merchant_attributions';
  operation: 'insert';
  /** Server should use ON CONFLICT (merchant_id) DO NOTHING or DO UPDATE per policy */
  conflictTarget: readonly ['merchant_id'];
  row: V7BrokerMerchantAttributionRow;
  /** PostgREST / Supabase client hint */
  preferResolution: 'merge-duplicates' | 'ignore-duplicates';
}>;

/**
 * Prepares the **immutable** broker↔merchant link for persistence (no network I/O here).
 * Call from onboarding completion after KYC — **never** grant entitlements without this row when broker-attributed.
 */
export function registerMerchantWithBroker(
  merchantId: string,
  brokerId: string,
  options?: Readonly<{
    commissionLifelongBps?: number;
    source?: V7BrokerMerchantAttributionRow['source'];
  }>
): V7BrokerMerchantAttributionMutation {
  const mid = merchantId.trim();
  const bid = brokerId.trim();
  if (!isValidUuid(mid)) {
    throw new Error('V7Attribution: merchantId must be a UUID');
  }
  if (!isValidUuid(bid)) {
    throw new Error('V7Attribution: brokerId must be a UUID');
  }
  const bps = options?.commissionLifelongBps ?? V7_DEFAULT_BROKER_COMMISSION_LIFELONG_BPS;
  const source = options?.source ?? 'qr_onboard';

  return {
    schema: 'public',
    table: 'broker_merchant_attributions',
    operation: 'insert',
    conflictTarget: ['merchant_id'],
    preferResolution: 'ignore-duplicates',
    row: {
      merchant_id: mid,
      broker_id: bid,
      attributed_at: new Date().toISOString(),
      commission_lifelong_bps: bps,
      source,
    },
  };
}
