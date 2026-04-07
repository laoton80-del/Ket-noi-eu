/**
 * G1 — Merchant/staff queue snapshot (HTTPS, Admin SDK reads).
 *
 * **Tenant binding:** Firebase ID token custom claim **`b2bTenantId`** (string). The client does **not** pass
 * tenant id in the URL/body — avoids cross-tenant hints from the device.
 *
 * Set claims via Admin SDK, e.g. `functions/scripts/b2b-set-staff-claims.cjs`.
 *
 * @see docs/B2B_G1_MERCHANT_OPS.md
 */
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import type { Request } from 'firebase-functions/v2/https';

import { B2B_ROOT } from '@app/domain/b2b/collections';
import {
  liveStaffQueueRowFromBookingDoc,
  liveStaffQueueRowFromOrderDoc,
} from '@app/services/b2b/merchant/staffQueueRowMapping';
import type { LiveStaffQueueRow } from '@app/services/b2b/merchant/staffQueueTypes';
import { verifyAppCheckForRequest } from '../../appCheckGate';
import { requireFirebaseBearerUserDecoded } from '../../walletAuth';

const B2B_TENANT_CLAIM = 'b2bTenantId';

function parseLimit(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 40);
}

async function handle(req: Request, res: import('express').Response): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const ac = await verifyAppCheckForRequest(req, 'b2bStaffQueue');
  if (!ac.ok) {
    logger.warn('[b2b_staff_queue_snapshot] denied', {
      trust_surface: 'b2b_staff_queue_snapshot',
      gate: 'app_check',
      status: ac.status,
      error: ac.error,
    });
    res.status(ac.status).json({ ok: false, error: ac.error });
    return;
  }

  const auth = await requireFirebaseBearerUserDecoded(req);
  if (!auth.ok) {
    logger.warn('[b2b_staff_queue_snapshot] denied', {
      trust_surface: 'b2b_staff_queue_snapshot',
      gate: 'firebase_bearer',
      status: auth.status,
      error: auth.error,
    });
    res.status(auth.status).json({ ok: false, error: auth.error });
    return;
  }

  const claimRaw = auth.decoded[B2B_TENANT_CLAIM];
  const tenantId = typeof claimRaw === 'string' ? claimRaw.trim() : '';
  if (!tenantId) {
    logger.warn('[b2b_staff_queue_snapshot] denied', {
      trust_surface: 'b2b_staff_queue_snapshot',
      gate: 'b2b_tenant_claim',
      error: 'b2b_tenant_claim_missing',
    });
    res.status(403).json({ ok: false, error: 'b2b_tenant_claim_missing' });
    return;
  }

  const lim = parseLimit(typeof req.query?.limit === 'string' ? req.query.limit : undefined, 12);
  const db = getFirestore();
  const rows: LiveStaffQueueRow[] = [];
  const errs: string[] = [];

  try {
    const bSnap = await db
      .collection(B2B_ROOT.tenants)
      .doc(tenantId)
      .collection(B2B_ROOT.bookings)
      .orderBy('createdAt', 'desc')
      .limit(lim)
      .get();
    for (const doc of bSnap.docs) {
      const row = liveStaffQueueRowFromBookingDoc(doc.id, doc.data() as Record<string, unknown>, 'functions_https');
      if (row) rows.push(row);
    }
  } catch (e) {
    errs.push(`business_bookings: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const oSnap = await db
      .collection(B2B_ROOT.tenants)
      .doc(tenantId)
      .collection(B2B_ROOT.orders)
      .orderBy('createdAt', 'desc')
      .limit(lim)
      .get();
    for (const doc of oSnap.docs) {
      const row = liveStaffQueueRowFromOrderDoc(doc.id, doc.data() as Record<string, unknown>, 'functions_https');
      if (row) rows.push(row);
    }
  } catch (e) {
    errs.push(`business_orders: ${e instanceof Error ? e.message : String(e)}`);
  }

  rows.sort((a, b) => b.updatedAtLabel.localeCompare(a.updatedAtLabel));
  const sliced = rows.slice(0, lim * 2);

  logger.info('[b2b_staff_queue_snapshot] ok', {
    trust_surface: 'b2b_staff_queue_snapshot',
    firebaseUid: auth.uid,
    tenantId,
    rowCount: sliced.length,
    errors: errs.length ? errs : undefined,
  });

  if (errs.length && sliced.length === 0) {
    res.status(200).json({
      ok: true,
      rows: [],
      partialWarning: errs.join(' | '),
      error: null,
    });
    return;
  }

  res.status(200).json({
    ok: true,
    rows: sliced,
    partialWarning: errs.length ? `Một phần lỗi: ${errs.join(' | ')}` : null,
  });
}

export const b2bStaffQueueSnapshot = onRequest(
  {
    region: 'europe-west1',
    cors: true,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    try {
      await handle(req, res);
    } catch (e) {
      logger.error('[b2b_staff_queue_snapshot] unhandled', {
        trust_surface: 'b2b_staff_queue_snapshot',
        message: e instanceof Error ? e.message : String(e),
      });
      res.status(500).json({ ok: false, error: 'internal' });
    }
  }
);
