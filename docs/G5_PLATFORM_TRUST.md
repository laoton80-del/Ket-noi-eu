# G5 / M1 — Platform trust & commercial release posture

This document closes **ambiguous** App Check / enforcement expectations for **Kết Nối Global** as implemented in this repo.

## M1 summary (what is truly implemented)

| Capability | Implemented in code? | Notes |
|------------|----------------------|--------|
| Web `X-Firebase-AppCheck` | **Yes** | `firebase/app-check` + `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` (`src/config/appCheckClient.ts`). |
| Native iOS/Android `X-Firebase-AppCheck` | **Yes, when built correctly** | `@react-native-firebase/app-check` + `ReactNativeFirebaseAppCheckProvider` (`src/config/nativeAppCheckBridge.native.ts`). Requires **dev client or store build**, Firebase **native** config files, and App Check providers in Console. **Not** Expo Go. |
| Server enforcement | **Yes** | `FIREBASE_APP_CHECK_ENFORCE=1` still rejects missing/invalid tokens on gated Functions (`functions/src/appCheckGate.ts`). |
| “Native is safe to enforce” operator flag | **Yes** | `FIREBASE_APP_CHECK_NATIVE_EXPECTED=1` — informational acknowledgment; switches cold-start log to **info** (`functions/src/trustRuntimeDiagnostics.ts`). Does **not** change verify logic. |
| Web-only enforcement ack | **Yes** | `FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1` — operator asserts this backend URL is **not** used by native/Expo Go clients without tokens; otherwise cold start logs **`app_check_enforce_WITHOUT_native_expected_UNSAFE_DEFAULT`** at **error**. |

**Unsafe default (harder to miss):** `FIREBASE_APP_CHECK_ENFORCE=1` **without** `FIREBASE_APP_CHECK_NATIVE_EXPECTED=1` **and** without `FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1` → **`logger.error`** on cold start. Do **not** interpret as “native App Check complete” until `NATIVE_EXPECTED=1` is set after real device proof.

**Not implemented:** automatic platform detection on the server (no spoof-proof “web-only enforce”). Operators must align deployment clients with env flags.

## 1. What the client actually sends

| Platform | `X-Firebase-AppCheck` on `walletOps` / `aiProxy` / `b2bStaffQueueSnapshot` |
|----------|-----------------------------------------------------------------------------|
| **Expo web** | **When** `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` is set and web `initializeAppCheck` succeeds. |
| **iOS / Android native bundle** | **When** `nativeAppCheckBridge.native.ts` initializes (RN Firebase). Uses **debug** provider in `__DEV__` or if `EXPO_PUBLIC_FIREBASE_APP_CHECK_USE_DEBUG_PROVIDER=1`, else **App Attest / DeviceCheck / Play Integrity**. Register debug tokens in Console as needed. |
| **Expo Go** | **No** — native Firebase App Check modules are not available. |

Firebase **ID tokens** (anonymous or otherwise) are still sent for wallet/AI/B2B HTTPS as today. Sensitive paths use `mergeTrustBackendHeaders` (`src/utils/trustBackendHeaders.ts`).

## 2. `FIREBASE_APP_CHECK_ENFORCE=1` on Cloud Functions

| Client surface | Safe? |
|----------------|--------|
| **Web** with site key + valid App Check | Can be safe if tokens verify in Console. |
| **Native dev client / store** with M1 wiring + valid providers | Can be safe after **end-to-end** token verification. |
| **Expo Go** or **native without** plist/json / failed init | **Unsafe** — expect **401** `app_check_token_required` or missing header. |

**Operational rule**

1. Keep **`FIREBASE_APP_CHECK_ENFORCE` unset** until clients send valid tokens.
2. After verifying **native** tokens against the same project, set **`FIREBASE_APP_CHECK_NATIVE_EXPECTED=1`** so cold-start logs reflect operator intent (see `trustRuntimeDiagnostics.ts`).
3. If you enforce for **web-only** traffic, do not point the same enforced base URL at native builds until native is verified (or accept 401s).

## 3. Client env (reference)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` | Web: ReCAPTCHA Enterprise site key. |
| `EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` / `EXPO_PUBLIC_FIREBASE_APP_CHECK_NATIVE_DEBUG_TOKEN` | Debug provider token (Console allowlist); shared or native-specific name. |
| `EXPO_PUBLIC_FIREBASE_APP_CHECK_USE_DEBUG_PROVIDER` | Set `1` to force debug provider on native **non-__DEV__** builds (e.g. internal QA). |
| `EXPO_PUBLIC_RELEASE_TRUST_PROFILE` | `native_pilot` \| `web_commercial` \| `mixed_pilot` (default) — label only; see `src/config/runtimeTrustProfile.ts`. |

## 4. Server env (reference)

| Variable | Purpose |
|----------|---------|
| `FIREBASE_APP_CHECK_ENFORCE=1` | Require valid App Check on gated HTTPS Functions. |
| `FIREBASE_APP_CHECK_NATIVE_EXPECTED=1` | Operators assert native clients are M1-capable and verified; adjusts cold-start **wording only**. |
| `FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1` | Operators assert enforced endpoints are only hit by **web** (or other token-capable) clients; suppresses error-level “native gap” cold-start log. |

## 5. Verification & release gates

| Command | Meaning |
|---------|---------|
| `npm run trust:native-readiness` | Repo checks: RN Firebase deps, Expo plugins, optional `google-services.json` / `GoogleService-Info.plist`. **Does not** prove a device token. |
| `TRUST_NATIVE_READINESS_STRICT=1 npm run trust:native-readiness` | Exit **1** if deps/plugins or native Firebase files missing. |
| `npm run trust:live` | Live HTTP smoke; optional `TRUST_SMOKE_EXPECT_APP_CHECK_HEADER=1` requires `TRUST_SMOKE_APP_CHECK` when testing enforced backends. |
| `npm run preflight:commercial` | Preflight + **advisory** G5 checklist (`scripts/commercial-release-gate.mjs`). |
| `npm run preflight:commercial:strict` | **Strict commercial candidate:** trust-live stamp (or documented waiver), native readiness **strict**, `functions:verify-bundle` with **HEAD sync** for `functions/lib`. |
| `COMMERCIAL_GATE_REQUIRE_NATIVE_READINESS_STRICT=1` | Runs native readiness in **strict** mode during commercial gate (legacy; strict command already enforces this). |

**Runtime diagnostic (client):** `getAppCheckTrustDiagnostics()` in `src/config/appCheckClient.ts` — probes token fetch without logging the JWT (use in __DEV__ / support tooling).

## 6. Honest commercial claim

- **Native store builds** with M1 + Console providers + verified tokens can align with **App Check–enforced** backends. Until then, describe as **pilot / ID-token trust** or run enforcement **off** for those clients.
- **Web** remains the simplest path to satisfy enforcement (site key + web app registration).
- Do **not** describe the product as “App Check–hardened on mobile” if you have not verified native tokens on a **real** dev client / store build (Expo Go does not count).
