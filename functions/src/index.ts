/**
 * Cloud Functions (Gen 2) — inbound telephony webhooks + AI orchestration callbacks.
 * Build: npm run build (bundles shared domain/services from ../src via esbuild alias @app).
 *
 * **Country-pack spine parity:** After changing `../src/config/countryPacks/**`, `PaymentsService`, or
 * `Pricing.ts` tier logic, run `cd functions && npm run build` so `lib/index.js` matches the app.
 * The bundle inlines `@app` modules (e.g. `pricingTierForUsageDebits`); stale `lib/` causes server/client drift.
 *
 * Optional App Check: set `FIREBASE_APP_CHECK_ENFORCE=1` to require `X-Firebase-AppCheck` on `aiProxy` + `walletOps` + `b2bStaffQueueSnapshot` (see `docs/G2_RUNTIME_TRUST.md`, `docs/G5_PLATFORM_TRUST.md`).
 * Client must send a valid token when enforced. Default: enforcement off; ID token remains required for wallet/AI. Web vs native posture: **explicit** in `functions/src/appCheckGate.ts`.
 *
 * Top-up receipt strictness: `docs/RECEIPT_STRICTNESS.md` (D10); `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT` and related env on `receiptAllowsTopup`.
 */
import './firebaseInit';
import type { Firestore } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';
import type { Request } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';

import type { VoiceOrchestrationRequest } from '@app/services/b2b/ai/inboundVoicePipelineTypes';
import { phoneRouteDocPath } from '@app/domain/b2b/collections';
import type { B2BInboundRouteResolution } from '@app/domain/b2b/models';
import type { B2BDb } from '@app/services/b2b/engines/bookingEngine';
import { resolveTenantByPhone } from '@app/services/b2b/ai/receptionistOrchestrator';
import type { B2BRepositoryBundle, PhoneRouteRepository } from '@app/services/b2b/repositories';

import { verifyAppCheckForRequest } from './appCheckGate';
import { logRuntimeTrustPostureOnce } from './trustRuntimeDiagnostics';
import type { B2BOrderStaffOpsRequest } from './b2b/order/processOrderStaffOpsRequest';
import { processOrderStaffOpsRequest } from './b2b/order/processOrderStaffOpsRequest';
import { processVoiceOrchestrationRequest } from './b2b/voice/processVoiceOrchestrationRequest';
import { takeAiProxyRateSlot } from './aiProxyRateLimit';
import {
  AI_PROXY_MAX_BODY_BYTES,
  parseAndValidateChatPayload,
  requestBodyByteLength,
  validateSttPayload,
  validateTtsPayload,
} from './aiProxyValidation';
import { paymentReceiptDocPath, type PaymentReceiptRecord } from './payments/paymentReceiptModel';
import { verifySignedRequest } from './security';
import { proxyChat, proxyStt, proxyTts } from './openaiProxy';
import { requireFirebaseBearerUser } from './walletAuth';

const db = getFirestore();
const B2B_WEBHOOK_SECRET = process.env.B2B_WEBHOOK_SECRET?.trim() ?? '';

/**
 * When `WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT=1`, topup requires a prior webhook-written receipt
 * (`platform_payment_receipts/*`). Default off: client verify + idempotent `verifiedTopups` only.
 */
async function receiptAllowsTopup(
  fs: Firestore,
  paymentEventId: string,
  walletUid: string,
  creditsAmount: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (process.env.WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT?.trim() !== '1') {
    return { ok: true };
  }
  const snap = await fs.doc(paymentReceiptDocPath(paymentEventId)).get();
  if (!snap.exists) return { ok: false, error: 'payment_receipt_missing' };
  const r = snap.data() as PaymentReceiptRecord;
  if (r.status !== 'paid') return { ok: false, error: 'payment_receipt_not_paid' };
  if (process.env.WALLET_TOPUP_RECEIPT_REQUIRE_WALLET_UID?.trim() === '1') {
    if (!r.walletUid || typeof r.walletUid !== 'string') {
      return { ok: false, error: 'payment_receipt_wallet_uid_required' };
    }
  }
  if (r.walletUid && r.walletUid !== walletUid) return { ok: false, error: 'payment_receipt_wallet_mismatch' };
  const grant = r.creditsToGrant;
  const strictCredits = process.env.WALLET_TOPUP_RECEIPT_REQUIRE_CREDITS_GRANT?.trim() === '1';
  if (strictCredits) {
    if (typeof grant !== 'number' || !Number.isFinite(grant) || grant <= 0) {
      return { ok: false, error: 'payment_receipt_credits_grant_required' };
    }
    if (grant !== creditsAmount) return { ok: false, error: 'payment_receipt_amount_mismatch' };
  } else if (typeof grant === 'number' && grant !== creditsAmount) {
    return { ok: false, error: 'payment_receipt_amount_mismatch' };
  }
  return { ok: true };
}

const AI_PROXY_REQUIRE_AUTH = process.env.AI_PROXY_REQUIRE_AUTH?.trim() !== '0';
const AI_PROXY_MAX_RPM = Math.max(0, Number.parseInt(process.env.AI_PROXY_MAX_RPM ?? '120', 10) || 120);
const AI_PROXY_RATE_WINDOW_MS = Math.max(10_000, Number.parseInt(process.env.AI_PROXY_RATE_WINDOW_MS ?? '60000', 10) || 60_000);

logRuntimeTrustPostureOnce();

/** Minimal phone route adapter — replace with Admin get() + typed mapper when deploying. */
function adminPhoneRouteRepo(): PhoneRouteRepository {
  return {
    async getByInboundE164(_db: B2BDb, e164: string) {
      void _db;
      const snap = await db.doc(phoneRouteDocPath(e164)).get();
      if (!snap.exists) return null;
      const d = snap.data() as B2BInboundRouteResolution & Record<string, unknown>;
      if (!d?.tenantId || !d?.locationId) return null;
      return {
        tenantId: String(d.tenantId),
        locationId: String(d.locationId),
        inboundNumberE164: String(d.inboundNumberE164 ?? e164),
      };
    },
  };
}

const reposStub: Pick<B2BRepositoryBundle, 'phoneRoute'> = {
  phoneRoute: adminPhoneRouteRepo(),
};

export const b2bInboundVoiceWebhook = onRequest(
  {
    region: 'europe-west1',
    cors: false,
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: 'missing_webhook_secret' });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? 'unauthorized' });
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    // Provider-specific signature verification belongs here; body maps to VoiceOrchestrationRequest when using JSON bridge.
    const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Partial<VoiceOrchestrationRequest>;
    if (body.action && body.externalCallId) {
      const result = await processVoiceOrchestrationRequest(db, body as VoiceOrchestrationRequest);
      res.status(result.ok ? 200 : 400).json(result);
      return;
    }
    res.status(501).json({
      error: 'not_implemented',
      hint: 'POST JSON { action, externalCallId, ... } for pipeline, or implement Twilio/form parser → processVoiceOrchestrationRequest.',
    });
  }
);

export const b2bVoiceOrchestrationHook = onRequest(
  {
    region: 'europe-west1',
    timeoutSeconds: 120,
    memory: '512MiB',
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: 'missing_webhook_secret' });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? 'unauthorized' });
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const raw = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Partial<VoiceOrchestrationRequest>;
    if (!raw.action || !raw.externalCallId) {
      const to = String((raw as { to?: string }).to ?? req.query?.to ?? '');
      if (!to) {
        res.status(400).json({ ok: false, error: 'missing_action_or_externalCallId_and_to' });
        return;
      }
      const route = await resolveTenantByPhone(db as unknown, reposStub, { inboundNumberE164: to });
      if (!route) {
        res.status(404).json({ ok: false, error: 'tenant_not_found', failureCode: 'tenant_not_found' });
        return;
      }
      res.status(200).json({ ok: true, tenantId: route.tenantId, locationId: route.locationId });
      return;
    }
    const result = await processVoiceOrchestrationRequest(db, raw as VoiceOrchestrationRequest);
    const status = result.ok ? 200 : result.failureCode === 'tenant_not_found' ? 404 : 400;
    res.status(status).json(result);
  }
);

/** Trusted HMAC webhook — wholesale qualification + optional usage debit (no inbound DID required). */
export const b2bOrderStaffOps = onRequest(
  {
    region: 'europe-west1',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    if (!B2B_WEBHOOK_SECRET) {
      res.status(500).json({ ok: false, error: 'missing_webhook_secret' });
      return;
    }
    const verified = verifySignedRequest(req, B2B_WEBHOOK_SECRET);
    if (!verified.ok) {
      res.status(401).json({ ok: false, error: verified.reason ?? 'unauthorized' });
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    const raw = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Partial<B2BOrderStaffOpsRequest>;
    if (
      raw.action !== 'set_wholesale_qualification' ||
      typeof raw.tenantId !== 'string' ||
      typeof raw.orderId !== 'string' ||
      !raw.wholesaleQualification
    ) {
      res.status(400).json({ ok: false, error: 'invalid_staff_ops_body' });
      return;
    }
    const result = await processOrderStaffOpsRequest(db, raw as B2BOrderStaffOpsRequest);
    res.status(result.ok ? 200 : 400).json(result);
  }
);

export const aiProxy = onRequest(
  { region: 'europe-west1', cors: true, timeoutSeconds: 120, memory: '1GiB' },
  async (req, res) => {
    if (req.method !== 'POST') return void res.status(405).send('Method Not Allowed');
    try {
      const byteLen = requestBodyByteLength(req);
      if (byteLen > AI_PROXY_MAX_BODY_BYTES) {
        logger.warn('[aiProxy] body_too_large', { byteLen, max: AI_PROXY_MAX_BODY_BYTES });
        return void res.status(413).json({ ok: false, error: 'payload_too_large' });
      }

      const acAi = await verifyAppCheckForRequest(req, 'aiProxy');
      if (!acAi.ok) {
        logger.warn('[aiProxy] denied', { trust_surface: 'ai_proxy', gate: 'app_check', status: acAi.status, error: acAi.error });
        return void res.status(acAi.status).json({ ok: false, error: acAi.error });
      }

      let uid = 'anonymous';
      if (AI_PROXY_REQUIRE_AUTH) {
        const auth = await requireFirebaseBearerUser(req);
        if (!auth.ok) {
          logger.warn('[aiProxy] denied', { trust_surface: 'ai_proxy', gate: 'firebase_bearer', status: auth.status, error: auth.error });
          return void res.status(auth.status).json({ ok: false, error: auth.error });
        }
        uid = auth.uid;
      }

      if (AI_PROXY_MAX_RPM > 0 && uid !== 'anonymous') {
        const allowed = takeAiProxyRateSlot(uid, AI_PROXY_MAX_RPM, AI_PROXY_RATE_WINDOW_MS);
        if (!allowed) {
          logger.warn('[aiProxy] rate_limited', { firebaseUid: uid });
          return void res.status(429).json({ ok: false, error: 'rate_limited' });
        }
      }

      const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Record<string, unknown>;
      const op = String(body.op ?? '');
      if (op === 'chat') {
        const parsed = parseAndValidateChatPayload(body);
        if (!parsed.ok) {
          return void res.status(400).json({ ok: false, error: parsed.error });
        }
        const out = await proxyChat(parsed.messages, parsed.temperature, parsed.maxTokens);
        return void res.status(200).json(out);
      }
      if (op === 'stt') {
        const parsed = validateSttPayload(body);
        if (!parsed.ok) return void res.status(400).json({ ok: false, error: parsed.error });
        const out = await proxyStt(parsed.base64Audio, parsed.mime);
        return void res.status(200).json(out);
      }
      if (op === 'tts') {
        const parsed = validateTtsPayload(body);
        if (!parsed.ok) return void res.status(400).json({ ok: false, error: parsed.error });
        const audioBase64 = await proxyTts(parsed.text, parsed.voice);
        return void res.status(200).json({ audioBase64 });
      }
      return void res.status(400).json({ ok: false, error: 'unknown_op' });
    } catch (e) {
      logger.error('[aiProxy] error', e instanceof Error ? e : undefined);
      return void res.status(500).json({ ok: false, error: 'proxy_error' });
    }
  }
);

/**
 * Credits ledger: `wallets/{firebaseUid}` only. The authenticated subject is always Firebase Auth `uid`
 * (client: anonymous auth + ID token). Older pilots may have used `wallets/{phone}` — see WALLET_MIGRATION.md.
 */
export const walletOps = onRequest(
  { region: 'europe-west1', cors: true, timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    if (req.method !== 'POST') return void res.status(405).send('Method Not Allowed');
    const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(body, 'userId')) {
      return void res.status(400).json({ ok: false, error: 'userId_in_body_not_allowed' });
    }
    const acWallet = await verifyAppCheckForRequest(req, 'walletOps');
    if (!acWallet.ok) {
      logger.warn('[walletOps] denied', { trust_surface: 'wallet_ops', gate: 'app_check', status: acWallet.status, error: acWallet.error });
      return void res.status(acWallet.status).json({ ok: false, error: acWallet.error });
    }
    const who = await requireFirebaseBearerUser(req);
    if (!who.ok) {
      logger.warn('[walletOps] denied', { trust_surface: 'wallet_ops', gate: 'firebase_bearer', status: who.status, error: who.error });
      return void res.status(who.status).json({ ok: false, error: who.error });
    }
    const userId = who.uid;
    const op = String(body.op ?? '');
    logger.info('[walletOps] request', { trust_surface: 'wallet_ops', firebaseUid: userId, op });
    const ref = db.collection('wallets').doc(userId);
    if (op === 'get') {
      const snap = await ref.get();
      const d = snap.data() as { credits?: number; lifetimeSpent?: number };
      return void res.status(200).json({
        ok: true,
        credits: typeof d?.credits === 'number' ? d.credits : 0,
        lifetimeSpent: typeof d?.lifetimeSpent === 'number' ? d.lifetimeSpent : 0,
      });
    }
    if (op === 'topup') {
      /**
       * Receipt → wallet flow (see `payments/paymentReceiptModel.ts`):
       * 1) Optional precondition: webhook sets `platform_payment_receipts/{paymentEventId}` to `paid`.
       * 2) This handler applies credits once and mirrors idempotency in `wallets/{uid}/verifiedTopups/...`.
       *
       * **Pack identity:** `walletOps` topup does **not** accept `comboId` / pack id. Credits granted are
       * exactly `body.amount` after receipt checks. Client must send the same credit count the user saw
       * at checkout; payments microservice may correlate `comboId` + fiat separately (not in this repo).
       */
      const amount = Number(body.amount ?? 0);
      const paymentEventId = String(body.paymentEventId ?? '').trim().replace(/\//g, '_');
      if (!paymentEventId) return void res.status(400).json({ ok: false, error: 'payment_event_id_required' });
      if (!Number.isFinite(amount) || amount <= 0) return void res.status(400).json({ ok: false, error: 'invalid_amount' });
      if (paymentEventId.length > 900) return void res.status(400).json({ ok: false, error: 'payment_event_id_too_long' });
      const pre = await receiptAllowsTopup(db, paymentEventId, userId, amount);
      if (!pre.ok) {
        logger.warn('[walletOps] topup_receipt_denied', { firebaseUid: userId, paymentEventId, error: pre.error });
        return void res.status(409).json({ ok: false, error: pre.error });
      }
      const ledgerRef = ref.collection('verifiedTopups').doc(paymentEventId);
      const result = await db.runTransaction(async (tx) => {
        const led = await tx.get(ledgerRef);
        if (led.exists) {
          const st = String(led.data()?.status ?? '');
          if (st === 'applied') return { ok: true, duplicate: true as const };
        }
        const snap = await tx.get(ref);
        const d = (snap.data() ?? {}) as { credits?: number; lifetimeSpent?: number };
        const nextCredits = (d.credits ?? 0) + amount;
        tx.set(
          ref,
          { credits: nextCredits, lifetimeSpent: d.lifetimeSpent ?? 0, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(ledgerRef, {
          status: 'applied',
          creditsGranted: amount,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { ok: true, duplicate: false as const };
      });
      logger.info('[walletOps] topup', {
        firebaseUid: userId,
        paymentEventId,
        amount,
        duplicate: result.duplicate === true,
      });
      // duplicate: true = idempotent replay; balance already updated on first success.
      return void res.status(200).json({ ok: true, duplicate: result.duplicate === true });
    }
    if (op === 'chargeTrustedService') {
      const amount = Number(body.amount ?? 0);
      const idempotencyKey = String(body.idempotencyKey ?? '').trim().replace(/\//g, '_');
      const serviceKind = String(body.serviceKind ?? '').trim();
      const allowed = new Set(['leona_outbound', 'letan_booking']);
      if (!allowed.has(serviceKind)) return void res.status(400).json({ ok: false, error: 'invalid_service_kind' });
      if (!Number.isFinite(amount) || amount <= 0 || !idempotencyKey) {
        return void res.status(400).json({ ok: false, error: 'invalid_charge_trusted' });
      }
      if (idempotencyKey.length > 900) return void res.status(400).json({ ok: false, error: 'idempotency_key_too_long' });
      const chargeRef = ref.collection('trustedServiceCharges').doc(idempotencyKey);
      const result = await db.runTransaction(async (tx) => {
        const ch = await tx.get(chargeRef);
        if (ch.exists && String(ch.data()?.status ?? '') === 'applied') {
          return { ok: true, duplicate: true as const };
        }
        const snap = await tx.get(ref);
        const d = (snap.data() ?? {}) as { credits?: number; lifetimeSpent?: number };
        const credits = d.credits ?? 0;
        if (credits < amount) return { ok: false, error: 'insufficient_credits' };
        const spent = d.lifetimeSpent ?? 0;
        tx.set(
          ref,
          { credits: credits - amount, lifetimeSpent: spent + amount, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(chargeRef, {
          status: 'applied',
          serviceKind,
          amount,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { ok: true, duplicate: false as const };
      });
      if (!result.ok) return void res.status(400).json(result);
      logger.info('[walletOps] chargeTrustedService', {
        firebaseUid: userId,
        serviceKind,
        amount,
        idempotencyKey,
        duplicate: result.duplicate === true,
      });
      return void res.status(200).json({ ok: true, duplicate: result.duplicate === true });
    }
    if (op === 'reserve') {
      const amount = Number(body.amount ?? 0);
      const key = String(body.idempotencyKey ?? '');
      if (!Number.isFinite(amount) || amount <= 0 || !key) return void res.status(400).json({ ok: false, error: 'invalid_reserve' });
      const holdRef = ref.collection('holds').doc(key);
      const result = await db.runTransaction(async (tx) => {
        const hold = await tx.get(holdRef);
        if (hold.exists) return { ok: true, holdId: key };
        const snap = await tx.get(ref);
        const d = (snap.data() ?? {}) as { credits?: number; lifetimeSpent?: number };
        const credits = d.credits ?? 0;
        if (credits < amount) return { ok: false, error: 'insufficient_credits' };
        tx.set(ref, { credits: credits - amount, lifetimeSpent: d.lifetimeSpent ?? 0, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.set(holdRef, { amount, status: 'reserved', createdAt: FieldValue.serverTimestamp() });
        return { ok: true, holdId: key };
      });
      return void res.status(result.ok ? 200 : 400).json(result);
    }
    if (op === 'commit' || op === 'rollback') {
      const key = String(body.idempotencyKey ?? '');
      if (!key) return void res.status(400).json({ ok: false, error: 'missing_hold_key' });
      const holdRef = ref.collection('holds').doc(key);
      const result = await db.runTransaction(async (tx) => {
        const hold = await tx.get(holdRef);
        if (!hold.exists) return { ok: false, error: 'hold_not_found' };
        const h = hold.data() as { amount?: number; status?: string };
        if (h.status === 'committed' && op === 'commit') return { ok: true };
        if (h.status === 'rolled_back' && op === 'rollback') return { ok: true };
        if (op === 'rollback') {
          const snap = await tx.get(ref);
          const d = (snap.data() ?? {}) as { credits?: number };
          tx.set(ref, { credits: (d.credits ?? 0) + (h.amount ?? 0), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          tx.set(holdRef, { status: 'rolled_back', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          return { ok: true };
        }
        tx.set(holdRef, { status: 'committed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { ok: true };
      });
      return void res.status(result.ok ? 200 : 400).json(result);
    }
    logger.warn('[walletOps] unknown_op', { trust_surface: 'wallet_ops', firebaseUid: userId, op });
    return void res.status(400).json({ ok: false, error: 'unknown_wallet_op' });
  }
);

export { b2bStaffQueueSnapshot } from './b2b/staff/b2bStaffQueueSnapshot';
