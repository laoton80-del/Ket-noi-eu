/**
 * G1 — Merchant / staff access context (Kết Nối Global B2B).
 *
 * **Production direction (intended):** staff users authenticate with Firebase; tenant scope comes from
 * **custom claim `b2bTenantId`** (string) set via Admin SDK — not from a client-chosen tenant id in API body.
 * The HTTPS endpoint `b2bStaffQueueSnapshot` reads Firestore with the Admin SDK only after verifying
 * the ID token and matching `b2bTenantId`.
 *
 * **Legacy / dev:** `EXPO_PUBLIC_B2B_DEV_TENANT_ID` enables **direct Firestore client** reads when rules
 * (or emulator) allow it. This is **not** the long-term merchant path — it bypasses server-side tenant binding.
 *
 * @see docs/B2B_G1_MERCHANT_OPS.md
 */
/** Custom claim name on Firebase ID tokens for staff queue access (set via Admin SDK). */
export const B2B_TENANT_ID_CLAIM = 'b2bTenantId' as const;

/** When `1`, client tries `b2bStaffQueueSnapshot` on `EXPO_PUBLIC_BACKEND_API_BASE` before Firestore dev read. */
export function isB2bStaffQueueHttpsPreferred(): boolean {
  return process.env.EXPO_PUBLIC_B2B_STAFF_QUEUE_PREFER_HTTPS?.trim() === '1';
}

/**
 * When `EXPO_PUBLIC_B2B_STAFF_QUEUE_PREFER_HTTPS=1` and HTTPS fails, allow **legacy** Firestore client reads
 * only if this is exactly `1`. Default / unset = **no** fallback (avoids masking claim or HTTPS misconfig).
 *
 * When HTTPS is **not** preferred, direct Firestore dev reads still use `EXPO_PUBLIC_B2B_DEV_TENANT_ID` without
 * requiring this flag.
 *
 * @see docs/G2_RUNTIME_TRUST.md
 */
export function isB2bHttpsFailureFirestoreFallbackEnabled(): boolean {
  return process.env.EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK?.trim() === '1';
}

/** Decode JWT payload without verifying signature (client-side hint only; server verifies). */
function decodeJwtPayloadJson(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const atobFn = globalThis.atob as ((s: string) => string) | undefined;
    const raw = atobFn ? atobFn(b64 + pad) : '';
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Reads `b2bTenantId` from a Firebase ID token string (JWT). Does not verify signature.
 * Used for UI labels; **authoritative** tenant binding happens on `b2bStaffQueueSnapshot`.
 */
export function readB2bTenantIdFromJwt(token: string | null | undefined): string | null {
  if (!token) return null;
  const json = decodeJwtPayloadJson(token);
  if (!json) return null;
  const v = json[B2B_TENANT_ID_CLAIM];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/**
 * Legacy dev: tenant id from Expo env for **direct Firestore client** queue reads.
 * Production path: `b2bTenantId` custom claim + `b2bStaffQueueSnapshot` (no client-supplied tenant in body).
 */
export function readB2bLegacyEnvTenantId(): string | null {
  const id = process.env.EXPO_PUBLIC_B2B_DEV_TENANT_ID?.trim();
  return id || null;
}
