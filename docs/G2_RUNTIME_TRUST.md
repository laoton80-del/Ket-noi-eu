# G2 — Runtime trust & observability (production-minded posture)

This phase tightens **how the stack behaves** around sensitive paths (AI proxy, wallet, B2B staff queue) and **how humans verify** configuration before release. It does **not** claim full production certification or end-to-end security guarantees.

## 1. Runtime trust surfaces (Cloud Functions)

| Surface | Auth / trust gates | Notes |
|---------|-------------------|--------|
| `aiProxy` | Optional App Check (`FIREBASE_APP_CHECK_ENFORCE=1`); Firebase bearer when `AI_PROXY_REQUIRE_AUTH` ≠ `0` (default: required) | Denials log `trust_surface: ai_proxy` with `gate: app_check` or `firebase_bearer`. |
| `walletOps` | Optional App Check; Firebase bearer **always** | Same structured denial pattern; `trust_surface: wallet_ops`. Unknown `op` logs a warning with the attempted `op`. |
| `b2bStaffQueueSnapshot` | Optional App Check; Firebase bearer; **`b2bTenantId` claim** | Denials log `trust_surface: b2b_staff_queue_snapshot` with gate labels. Success logs use the same trust label. |

Cold start: `logRuntimeTrustPostureOnce()` emits **`[trust_runtime] cold_start_posture`** once per instance with booleans for App Check enforcement, AI proxy auth, and wallet receipt flags (no secrets).

Optional env **`RUNTIME_TRUST_PROFILE`** (default `pilot_default`) is logged as a string label for staging/prod tagging; behavior does not branch on it yet.

## 2. App Check & Firebase bearer (practical posture)

- **App Check is not faked** in the Expo client. Until the app sends `X-Firebase-AppCheck` on every call, keep **`FIREBASE_APP_CHECK_ENFORCE` unset** on deployments the client hits.
- When enforcement is **on**, missing/invalid tokens return **401** with `app_check_token_required` / `app_check_invalid`. Enforced missing-token paths log at **error** with structured fields (`functions/src/appCheckGate.ts`).
- **Unsafe combo:** `FIREBASE_APP_CHECK_ENFORCE=1` without native acknowledgment or web-only ack → **error** cold-start log (`trustRuntimeDiagnostics.ts`); see **`docs/G5_PLATFORM_TRUST.md`**.
- **Parity:** `aiProxy`, `walletOps`, and `b2bStaffQueue` all go through `verifyAppCheckForRequest` in `functions/src/appCheckGate.ts`.

See also **`docs/PILOT_TRUST_ENV.md`**.

## 3. B2B queue: HTTPS vs Firestore fallback (footgun reduction)

When **`EXPO_PUBLIC_B2B_STAFF_QUEUE_PREFER_HTTPS=1`** and the HTTPS snapshot fails (403 claim, network, App Check, etc.):

- **Before G2:** Firestore dev fallback ran whenever `EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK` was not `0`.
- **G2:** Firestore fallback after HTTPS failure runs **only** if **`EXPO_PUBLIC_B2B_FIRESTORE_QUEUE_FALLBACK=1`** **and** `EXPO_PUBLIC_B2B_DEV_TENANT_ID` is set.

When HTTPS is **not** preferred, legacy Firestore reads still work with dev tenant alone (local/emulator workflows unchanged).

In **development**, if HTTPS fails and fallback is not enabled, the client emits **`https_failed_no_firestore_fallback`** via `devWarn` (see `src/utils/devLog.ts`).

## 4. Client observability (dev only)

- **`walletOps`:** failed HTTP responses parse `{ error }` when present; `devWarn` logs `wallet_ops_http_error` with `status`, `error`, and `op`.
- **`aiProxy`:** chat/STT/TTS paths use the same pattern with `ai_proxy_http_error`.

Production release builds (`__DEV__` false) do not emit these logs.

## 5. Release / trust preflight (not E2E)

From repo root:

```bash
npm run trust:preflight
```

This script checks that G2 artifacts and wiring are present (file presence + string anchors). It does **not** call Firebase or prove live auth.

For bundle parity and type safety, still use:

- `npm run preflight` — app
- `npm run preflight:with-functions` — app + `functions/lib` rebuild parity  
- In **CI** (`CI=true` / `GITHUB_ACTIONS`), `verify-functions-bundle` also enforces **`functions/lib` matches `HEAD`** after build unless `FUNCTIONS_BUNDLE_CI_RELAX_HEAD_SYNC=1` (see `docs/FUNCTIONS_BUNDLE_PARITY.md`).

## 6. Honest limits (remaining gaps)

- No global rate-limit or distributed tracing platform was added.
- App Check: **G3** adds web-only client wiring and optional **`npm run trust:live`** — see **`docs/G3_APP_CHECK_AND_RELEASE.md`**. Native store builds still need a separate App Check integration before enforcement.
- Trust preflight is **static**; live smoke is **optional** and env-driven.
- Anonymous Firebase Auth for wallet/AI remains as in the pilot blueprint.
