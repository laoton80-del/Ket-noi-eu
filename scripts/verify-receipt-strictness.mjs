/**
 * Wave 1 W1-04 — Receipt strictness evidence harness (HTTP against deployed `walletOps`).
 *
 * Produces binary-friendly output for `docs/WAVE1_CLOSURE_EVIDENCE.md`.
 *
 * Required env:
 *   TRUST_SMOKE_BACKEND_BASE — Cloud Functions base (no trailing slash), same as trust-live-smoke
 *   TRUST_SMOKE_ID_TOKEN     — Firebase ID token (Bearer) for wallet owner
 *
 * Optional:
 *   TRUST_SMOKE_APP_CHECK    — App Check JWT when FIREBASE_APP_CHECK_ENFORCE=1
 *
 * Modes:
 *   (default) auto — classify server receipt mode, then run applicable checks
 *   missing-only — POST topup without prior receipt; expect 409 payment_receipt_* if strict is ON
 *
 * Exit codes:
 *   0 — checks passed (see stdout; attach log as evidence)
 *   1 — check failed or misconfiguration
 *   2 — partial only (e.g. strict ON: missing path passed; full success requires seed — see stdout)
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const base = (process.env.TRUST_SMOKE_BACKEND_BASE ?? process.env.EXPO_PUBLIC_BACKEND_API_BASE ?? '').replace(
  /\/$/,
  ''
);
const idToken = (process.env.TRUST_SMOKE_ID_TOKEN ?? '').trim();
const appCheck = (process.env.TRUST_SMOKE_APP_CHECK ?? '').trim();
const mode = (process.argv[2] ?? 'auto').trim().toLowerCase();

function headersJSON() {
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` };
  if (appCheck) h['X-Firebase-AppCheck'] = appCheck;
  return h;
}

async function walletOps(body) {
  const res = await fetch(`${base}/walletOps`, {
    method: 'POST',
    headers: headersJSON(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let j = {};
  try {
    if (text) j = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { res, text, j };
}

function logEvidence(step, detail) {
  console.log(JSON.stringify({ wave1: 'receipt_strictness', step, ...detail }));
}

async function main() {
  if (!base || !idToken) {
    console.error(
      '[verify-receipt-strictness] FAIL: set TRUST_SMOKE_BACKEND_BASE (or EXPO_PUBLIC_BACKEND_API_BASE) and TRUST_SMOKE_ID_TOKEN'
    );
    process.exit(1);
  }

  const probeId = `w1-receipt-probe-${Date.now()}`;
  const amount = 1;

  if (mode === 'missing-only') {
    const r = await walletOps({ op: 'topup', amount, paymentEventId: probeId });
    const err = typeof r.j.error === 'string' ? r.j.error : '';
    if (r.res.status === 409 && err.startsWith('payment_receipt_')) {
      logEvidence('missing_receipt_denied', { status: r.res.status, error: err, paymentEventId: probeId });
      console.log('[verify-receipt-strictness] OK: server requires receipt (strict path observable).');
      process.exit(0);
    }
    if (r.res.ok && r.j.ok === true) {
      console.error(
        '[verify-receipt-strictness] FAIL: topup succeeded without seeded receipt — WALLET_TOPUP_REQUIRE_PAYMENT_RECEIPT likely off on this deployment (not a strict-mode evidence run).'
      );
      process.exit(1);
    }
    logEvidence('unexpected_response', { status: r.res.status, body: r.text.slice(0, 500) });
    process.exit(1);
  }

  // auto: probe strict on/off
  const probe = await walletOps({ op: 'topup', amount, paymentEventId: probeId });
  const probeErr = typeof probe.j.error === 'string' ? probe.j.error : '';

  if (probe.res.status === 409 && probeErr.startsWith('payment_receipt_')) {
    logEvidence('server_receipt_strict_on', { status: probe.res.status, error: probeErr });
    console.log('[verify-receipt-strictness] Detected: receipt strict ON (missing doc → 409).');

    console.log(
      '[verify-receipt-strictness] PARTIAL (exit 2): missing-receipt 409 captured. For success + duplicate replay, run:'
    );
    console.log(
      '  GOOGLE_APPLICATION_CREDENTIALS=... VERIFY_RECEIPT_FIREBASE_UID=<wallet-owner-firebase-uid> \\'
    );
    console.log('  node scripts/verify-receipt-strictness.mjs seeded-flow');
    console.log('Or: npm run receipt:seed --prefix functions -- <paymentEventId> <uid> <credits>');
    process.exit(2);
  }

  if (probe.res.ok && probe.j.ok === true) {
    logEvidence('server_receipt_strict_off', {
      status: probe.res.status,
      note: 'topup succeeded without prior receipt document',
    });
    const dupId = `w1-receipt-dup-${Date.now()}`;
    const first = await walletOps({ op: 'topup', amount: 25, paymentEventId: dupId });
    if (!first.res.ok || first.j.duplicate === true) {
      logEvidence('duplicate_first_failed', { status: first.res.status, text: first.text.slice(0, 300) });
      process.exit(1);
    }
    const second = await walletOps({ op: 'topup', amount: 25, paymentEventId: dupId });
    if (!second.res.ok || second.j.duplicate !== true) {
      logEvidence('duplicate_second_failed', { status: second.res.status, text: second.text.slice(0, 300) });
      process.exit(1);
    }
    logEvidence('duplicate_idempotent_ok', { paymentEventId: dupId });
    console.log('[verify-receipt-strictness] OK: receipt strict OFF; duplicate replay returns duplicate:true.');
    process.exit(0);
  }

  logEvidence('probe_unexpected', { status: probe.res.status, text: probe.text.slice(0, 500) });
  console.error('[verify-receipt-strictness] FAIL: unexpected probe response');
  process.exit(1);
}

/** Full path: seed receipt via Admin, then topup, then replay (strict ON). */
async function seededFlow() {
  const uid = process.env.VERIFY_RECEIPT_FIREBASE_UID?.trim();
  const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!base || !idToken || !uid || !creds) {
    console.error(
      '[verify-receipt-strictness] seeded-flow needs TRUST_SMOKE_BACKEND_BASE, TRUST_SMOKE_ID_TOKEN, VERIFY_RECEIPT_FIREBASE_UID, GOOGLE_APPLICATION_CREDENTIALS'
    );
    process.exit(1);
  }
  const paymentEventId = process.env.VERIFY_RECEIPT_PAYMENT_EVENT_ID?.trim() || `w1-seeded-${Date.now()}`;
  const amount = Number(process.env.VERIFY_RECEIPT_CREDITS_AMOUNT ?? '10') || 10;

  const seed = spawnSync(
    process.execPath,
    [path.join(root, 'functions', 'scripts', 'seed-payment-receipt.cjs'), paymentEventId, uid, String(amount)],
    { cwd: root, stdio: 'inherit', env: process.env, shell: false }
  );
  if (seed.status !== 0) {
    console.error('[verify-receipt-strictness] FAIL: seed-payment-receipt exited non-zero');
    process.exit(1);
  }

  const first = await walletOps({ op: 'topup', amount, paymentEventId });
  if (!first.res.ok || first.j.ok !== true) {
    logEvidence('seeded_topup_failed', { status: first.res.status, text: first.text.slice(0, 400) });
    process.exit(1);
  }
  const second = await walletOps({ op: 'topup', amount, paymentEventId });
  if (!second.res.ok || second.j.duplicate !== true) {
    logEvidence('seeded_duplicate_failed', { status: second.res.status, text: second.text.slice(0, 400) });
    process.exit(1);
  }
  logEvidence('seeded_success_and_duplicate', { paymentEventId, amount });
  console.log('[verify-receipt-strictness] OK: seeded receipt → topup → duplicate replay.');
  process.exit(0);
}

if (mode === 'seeded-flow') {
  await seededFlow();
} else {
  await main();
}
