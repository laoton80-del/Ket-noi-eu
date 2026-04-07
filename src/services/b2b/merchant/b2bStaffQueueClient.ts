/**
 * Merchant/staff queue — two consumption paths (G1):
 *
 * 1) **Preferred (production-shaped):** HTTPS `b2bStaffQueueSnapshot` on `EXPO_PUBLIC_BACKEND_API_BASE`
 *    with Firebase **ID token** carrying custom claim **`b2bTenantId`**. Server reads Firestore with Admin SDK;
 *    client never supplies tenant id in the request body.
 *
 * 2) **Legacy dev:** direct Firestore client reads when `EXPO_PUBLIC_B2B_DEV_TENANT_ID` is set and rules allow.
 *    After an **HTTPS failure** when (1) is preferred, Firestore fallback requires **`EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK=1`**
 *    (G2 fail-closed default).
 *
 * Enable (1) with `EXPO_PUBLIC_B2B_STAFF_QUEUE_PREFER_HTTPS=1`.
 *
 * @see docs/B2B_G1_MERCHANT_OPS.md
 */
import { collection, getDocs, getFirestore, limit, orderBy, query, type Firestore } from 'firebase/firestore';

import { B2B_ROOT } from '../../../domain/b2b/collections';
import {
  isB2bHttpsFailureFirestoreFallbackEnabled,
  isB2bStaffQueueHttpsPreferred,
  readB2bLegacyEnvTenantId,
} from '../../../config/b2bMerchantAccess';
import { devWarn } from '../../../utils/devLog';
import { mergeTrustBackendHeaders } from '../../../utils/trustBackendHeaders';
import { getFirebaseApp } from '../../../config/firebaseApp';
import { liveStaffQueueRowFromBookingDoc, liveStaffQueueRowFromOrderDoc } from './staffQueueRowMapping';
import type { LiveStaffQueueRow } from './staffQueueTypes';

export type { LiveStaffQueueRow } from './staffQueueTypes';

export type FetchStaffQueueResult = {
  rows: LiveStaffQueueRow[];
  error: string | null;
  partialWarning: string | null;
  /** How rows were loaded (for UI truth). */
  transport?: 'functions_https' | 'firestore_client_dev' | null;
  /** Server error code when HTTPS fails (e.g. claim missing). */
  httpsErrorCode?: string | null;
};

const DEFAULT_LIMIT = 12;

/** @deprecated Prefer `readB2bLegacyEnvTenantId` from `config/b2bMerchantAccess` — name kept for imports. */
export function readB2bDevTenantId(): string | null {
  return readB2bLegacyEnvTenantId();
}

export async function fetchLiveB2bStaffQueue(
  tenantId: string,
  maxPerCollection: number = DEFAULT_LIMIT
): Promise<FetchStaffQueueResult> {
  const app = getFirebaseApp();
  if (!app) {
    return {
      rows: [],
      error: 'Firebase client chưa cấu hình (EXPO_PUBLIC_FIREBASE_*).',
      partialWarning: null,
      transport: null,
    };
  }
  const db = getFirestore(app);
  const rows: LiveStaffQueueRow[] = [];
  const errs: string[] = [];

  try {
    rows.push(...(await loadBookings(db, tenantId, maxPerCollection)));
  } catch (e) {
    errs.push(`business_bookings: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    rows.push(...(await loadOrders(db, tenantId, maxPerCollection)));
  } catch (e) {
    errs.push(`business_orders: ${e instanceof Error ? e.message : String(e)}`);
  }

  rows.sort((a, b) => b.updatedAtLabel.localeCompare(a.updatedAtLabel));
  const sliced = rows.slice(0, maxPerCollection * 2);
  if (errs.length && sliced.length === 0) {
    return { rows: [], error: errs.join(' | '), partialWarning: null, transport: 'firestore_client_dev' };
  }
  return {
    rows: sliced,
    error: null,
    partialWarning: errs.length ? `Một phần lỗi: ${errs.join(' | ')}` : null,
    transport: 'firestore_client_dev',
  };
}

/**
 * Fetch queue via Cloud Function HTTP — tenant bound **only** from `b2bTenantId` on the verified ID token.
 */
export async function fetchB2bStaffQueueFromHttps(
  apiBase: string,
  bearerToken: string,
  maxPerCollection: number = DEFAULT_LIMIT
): Promise<FetchStaffQueueResult> {
  const base = apiBase.replace(/\/$/, '');
  const url = `${base}/b2bStaffQueueSnapshot?limit=${encodeURIComponent(String(maxPerCollection))}`;
  try {
    const headers = await mergeTrustBackendHeaders({
      Authorization: `Bearer ${bearerToken}`,
      Accept: 'application/json',
    });
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    const text = await res.text();
    let body: { ok?: boolean; error?: string; rows?: LiveStaffQueueRow[]; partialWarning?: string | null } = {};
    try {
      body = text ? (JSON.parse(text) as typeof body) : {};
    } catch {
      return {
        rows: [],
        error: `Phản hồi không phải JSON (${res.status})`,
        partialWarning: null,
        transport: null,
        httpsErrorCode: 'invalid_json',
      };
    }
    if (!res.ok) {
      const errCode = typeof body.error === 'string' ? body.error : `http_${res.status}`;
      return {
        rows: [],
        error: typeof body.error === 'string' ? body.error : `HTTP ${res.status}`,
        partialWarning: null,
        transport: null,
        httpsErrorCode: errCode,
      };
    }
    if (!body.ok || !Array.isArray(body.rows)) {
      return {
        rows: [],
        error: 'Phản hồi queue không hợp lệ',
        partialWarning: null,
        transport: null,
        httpsErrorCode: 'invalid_shape',
      };
    }
    return {
      rows: body.rows.map((r) => ({ ...r, queueDataSource: 'functions_https' as const })),
      error: null,
      partialWarning: body.partialWarning ?? null,
      transport: 'functions_https',
    };
  } catch (e) {
    return {
      rows: [],
      error: e instanceof Error ? e.message : String(e),
      partialWarning: null,
      transport: null,
      httpsErrorCode: 'network',
    };
  }
}

async function loadBookings(db: Firestore, tenantId: string, lim: number): Promise<LiveStaffQueueRow[]> {
  const col = collection(db, B2B_ROOT.tenants, tenantId, B2B_ROOT.bookings);
  const q = query(col, orderBy('createdAt', 'desc'), limit(lim));
  const snap = await getDocs(q);
  const out: LiveStaffQueueRow[] = [];
  for (const doc of snap.docs) {
    const row = liveStaffQueueRowFromBookingDoc(doc.id, doc.data() as Record<string, unknown>, 'firestore_client_dev');
    if (row) out.push(row);
  }
  return out;
}

async function loadOrders(db: Firestore, tenantId: string, lim: number): Promise<LiveStaffQueueRow[]> {
  const col = collection(db, B2B_ROOT.tenants, tenantId, B2B_ROOT.orders);
  const q = query(col, orderBy('createdAt', 'desc'), limit(lim));
  const snap = await getDocs(q);
  const out: LiveStaffQueueRow[] = [];
  for (const doc of snap.docs) {
    const row = liveStaffQueueRowFromOrderDoc(doc.id, doc.data() as Record<string, unknown>, 'firestore_client_dev');
    if (row) out.push(row);
  }
  return out;
}

/**
 * G1 unified loader: optional HTTPS (claim-scoped) first, then legacy Firestore dev read when allowed.
 */
export async function fetchMerchantStaffQueueUnified(
  getIdToken: () => Promise<string | null>
): Promise<FetchStaffQueueResult> {
  const apiBase = process.env.EXPO_PUBLIC_BACKEND_API_BASE?.trim() ?? '';
  const prefer = isB2bStaffQueueHttpsPreferred();
  const devTenant = readB2bLegacyEnvTenantId();
  const httpsFailFirestoreFallback = isB2bHttpsFailureFirestoreFallbackEnabled();

  const tryFirestore = async (): Promise<FetchStaffQueueResult> => {
    if (!devTenant) {
      return { rows: [], error: null, partialWarning: null, transport: null };
    }
    return fetchLiveB2bStaffQueue(devTenant);
  };

  if (prefer && apiBase) {
    const token = await getIdToken();
    if (token) {
      const httpsRes = await fetchB2bStaffQueueFromHttps(apiBase, token);
      if (!httpsRes.error) {
        return httpsRes;
      }
      if (httpsFailFirestoreFallback && devTenant) {
        const fb = await tryFirestore();
        return {
          ...fb,
          partialWarning: [fb.partialWarning, `Queue HTTPS: ${httpsRes.error}`].filter(Boolean).join(' · ') || null,
          httpsErrorCode: httpsRes.httpsErrorCode ?? null,
        };
      }
      if (__DEV__ && devTenant && !httpsFailFirestoreFallback) {
        devWarn('b2bStaffQueue', 'https_failed_no_firestore_fallback', {
          httpsErrorCode: httpsRes.httpsErrorCode,
          hint: 'Set EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK=1 only for dev after HTTPS errors.',
        });
      }
      return httpsRes;
    }
  }

  return tryFirestore();
}
