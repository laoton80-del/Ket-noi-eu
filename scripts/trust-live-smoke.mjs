/**
 * G3 — Live trust smoke (optional). Verifies **real HTTP status + JSON shape** for sensitive Functions — not file presence.
 *
 * Required env:
 *   TRUST_SMOKE_BACKEND_BASE  — e.g. https://europe-west1-PROJECT.cloudfunctions.net (no trailing slash) or custom API base
 *   TRUST_SMOKE_ID_TOKEN      — Firebase ID token (user JWT), e.g. from devtools / temporary script
 *
 * Optional:
 *   TRUST_SMOKE_APP_CHECK     — App Check token for X-Firebase-AppCheck (required when Functions use FIREBASE_APP_CHECK_ENFORCE=1)
 *   TRUST_SMOKE_EXPECT_APP_CHECK_HEADER=1 — exit 1 if TRUST_SMOKE_APP_CHECK is empty (release gate: “enforced backend + token supplied”)
 *   TRUST_SMOKE_CLIENT_KIND   — informational label only for logs, e.g. web_recaptcha | native_rn_firebase | manual_ci
 *
 * Behavior:
 *   - walletOps: POST { op: "get" } → expect 200 + ok true when token valid
 *   - b2bStaffQueueSnapshot: GET ?limit=1 → expect 200 or 403 (403 with b2b_tenant_claim_missing is a valid trust outcome)
 *   - aiProxy: POST minimal chat → expect 200 or 4xx with JSON { error } (502/5xx from upstream still indicates reachability)
 *
 * Exit: 0 on success; 1 on failure; 0 on skip when env missing (use TRUST_SMOKE_STRICT=1 to exit 1 on skip). On success writes `.trust-live-stamp` for `preflight:commercial` (optional COMMERCIAL_GATE_REQUIRE_TRUST_LIVE_STAMP).
 *
 * @see docs/G3_APP_CHECK_AND_RELEASE.md
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const base = (process.env.TRUST_SMOKE_BACKEND_BASE ?? process.env.EXPO_PUBLIC_BACKEND_API_BASE ?? '').replace(/\/$/, '');
const idToken = (process.env.TRUST_SMOKE_ID_TOKEN ?? '').trim();
const appCheck = (process.env.TRUST_SMOKE_APP_CHECK ?? '').trim();
const strict = process.env.TRUST_SMOKE_STRICT === '1';
const expectAppCheck = process.env.TRUST_SMOKE_EXPECT_APP_CHECK_HEADER === '1';
const clientKind = (process.env.TRUST_SMOKE_CLIENT_KIND ?? '').trim() || 'unspecified';

function headersJSON() {
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` };
  if (appCheck) h['X-Firebase-AppCheck'] = appCheck;
  return h;
}

function headersGET() {
  const h = { Accept: 'application/json', Authorization: `Bearer ${idToken}` };
  if (appCheck) h['X-Firebase-AppCheck'] = appCheck;
  return h;
}

async function main() {
  if (expectAppCheck && !appCheck) {
    console.error(
      '[trust-live-smoke] FAIL: TRUST_SMOKE_EXPECT_APP_CHECK_HEADER=1 but TRUST_SMOKE_APP_CHECK empty — paste a real token from web or native client.'
    );
    process.exit(1);
  }

  if (!base || !idToken) {
    const msg =
      '[trust-live-smoke] SKIP: set TRUST_SMOKE_BACKEND_BASE (or EXPO_PUBLIC_BACKEND_API_BASE) and TRUST_SMOKE_ID_TOKEN. See docs/G3_APP_CHECK_AND_RELEASE.md';
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(msg);
    process.exit(0);
  }

  console.log(`[trust-live-smoke] client_kind=${clientKind} app_check_header=${appCheck ? 'present' : 'absent'}`);

  const results = [];

  // 1) walletOps
  try {
    const res = await fetch(`${base}/walletOps`, {
      method: 'POST',
      headers: headersJSON(),
      body: JSON.stringify({ op: 'get' }),
    });
    const text = await res.text();
    let j = {};
    try {
      j = text ? JSON.parse(text) : {};
    } catch {
      j = { parseError: true };
    }
    const ok = res.status === 200 && j.ok === true && typeof j.credits === 'number';
    results.push({ name: 'walletOps', status: res.status, ok, detail: ok ? 'ledger readable' : text.slice(0, 120) });
  } catch (e) {
    results.push({ name: 'walletOps', status: 0, ok: false, detail: e instanceof Error ? e.message : String(e) });
  }

  // 2) b2bStaffQueueSnapshot
  try {
    const res = await fetch(`${base}/b2bStaffQueueSnapshot?limit=1`, {
      method: 'GET',
      headers: headersGET(),
    });
    const text = await res.text();
    let j = {};
    try {
      j = text ? JSON.parse(text) : {};
    } catch {
      j = {};
    }
    const trustOk =
      res.status === 200 && j.ok === true && Array.isArray(j.rows)
        ? true
        : res.status === 403 && j.error === 'b2b_tenant_claim_missing'
          ? true
          : res.status === 401 && (j.error === 'app_check_token_required' || j.error === 'app_check_invalid');
    results.push({
      name: 'b2bStaffQueueSnapshot',
      status: res.status,
      ok: trustOk,
      detail: trustOk ? 'expected success or claim/app-check denial' : text.slice(0, 120),
    });
  } catch (e) {
    results.push({
      name: 'b2bStaffQueueSnapshot',
      status: 0,
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  // 3) aiProxy minimal chat
  try {
    const res = await fetch(`${base}/aiProxy`, {
      method: 'POST',
      headers: headersJSON(),
      body: JSON.stringify({
        op: 'chat',
        messages: [{ role: 'user', content: 'ping' }],
        temperature: 0.2,
        maxTokens: 8,
      }),
    });
    const text = await res.text();
    let j = {};
    try {
      j = text ? JSON.parse(text) : {};
    } catch {
      j = {};
    }
    const ok =
      res.status === 200 ||
      (res.status >= 400 &&
        res.status < 500 &&
        (typeof j.error === 'string' || typeof j.ok === 'boolean'));
    results.push({
      name: 'aiProxy',
      status: res.status,
      ok,
      detail: ok ? 'reachable (2xx or structured 4xx)' : text.slice(0, 120),
    });
  } catch (e) {
    results.push({ name: 'aiProxy', status: 0, ok: false, detail: e instanceof Error ? e.message : String(e) });
  }

  for (const r of results) {
    const mark = r.ok ? 'OK' : 'FAIL';
    console.log(`[trust-live-smoke] ${mark} ${r.name} status=${r.status} ${r.detail}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error('[trust-live-smoke] One or more checks failed. Fix token, base URL, App Check, or deployment.');
    process.exit(1);
  }
  try {
    writeFileSync(path.join(repoRoot, '.trust-live-stamp'), `${new Date().toISOString()}\n`);
    console.log('[trust-live-smoke] Wrote .trust-live-stamp (gitignored) for optional commercial gate.');
  } catch (e) {
    console.warn('[trust-live-smoke] Could not write .trust-live-stamp:', e instanceof Error ? e.message : e);
  }
  console.log('[trust-live-smoke] All checks passed (honest scope: reachability + trust-shaped responses, not full QA).');
}

main();
