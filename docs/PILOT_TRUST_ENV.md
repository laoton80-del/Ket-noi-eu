# Pilot trust & staging — environment reference

Aligned with **Kết Nối Global** master blueprint: security and money correctness before external exposure.

## Admin / QA debug surfaces (client)

| Variable | When to set | Effect |
|----------|-------------|--------|
| `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG` | **Never** on external pilot builds | If not exactly `1`: no logo tap sequence, no PIN modal, `AdminDashboard` stack route omitted, prior AsyncStorage unlock cleared on Home focus. |
| `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG_RELEASE_ACK` | Internal release builds only (dangerous) | Must equal `I_UNDERSTAND_INSECURE_CLIENT_DEBUG_SURFACE` to allow debug surface on non-dev bundles. Missing ACK blocks release debug surface even when `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1`. |
| `EXPO_PUBLIC_ADMIN_PIN` | Dev builds only, with `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1` | Min **12** characters. Client-visible env var; do not treat as secret control for release security. |

**Enforced now:** default export/pilot = **admin surface disabled** (no static PIN in source).

## Client → backend URLs (wallet & payments)

| Variable | Role |
|----------|------|
| `EXPO_PUBLIC_BACKEND_API_BASE` | Base URL for `walletOps` (Firebase ID token). Required for server-authoritative Credits. |
| `EXPO_PUBLIC_PAYMENTS_API_BASE` | Payments service: `/platform-pay/intent`, `/wallet/topup/verify`. Unset → top-up UI blocks with an in-app message (dev: console warning). |

Pilot builds must set both for end-to-end top-up; missing values are not silently ignored in the wallet screen.

## Firebase App Check (Functions)

| Variable | Effect |
|----------|--------|
| `FIREBASE_APP_CHECK_ENFORCE` | If `1`, `aiProxy`, `walletOps`, and **`b2bStaffQueueSnapshot`** require header **`X-Firebase-AppCheck`** with a valid App Check token. If unset, App Check is **not** required (Firebase **ID token** remains mandatory for wallet/B2B queue as today; AI proxy bearer per `AI_PROXY_REQUIRE_AUTH`). |

**Enforced now (server):** verification via `firebase-admin/app-check` when token present; **401** `app_check_token_required` / `app_check_invalid` when `FIREBASE_APP_CHECK_ENFORCE=1`.

**Client (M1 / G5):** `src/config/appCheckClient.ts` + `src/utils/trustBackendHeaders.ts` — **web** attaches `X-Firebase-AppCheck` when `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` is set; **iOS/Android native (dev client / store)** attach when `@react-native-firebase/app-check` initializes (`nativeAppCheckBridge.native.ts`). **Expo Go** does not — do not claim native App Check there.

**G5:** When `FIREBASE_APP_CHECK_ENFORCE=1`, cold-start logs reflect operator intent (`FIREBASE_APP_CHECK_NATIVE_EXPECTED=1` or `FIREBASE_APP_CHECK_WEB_ONLY_ENFORCEMENT=1`); see **`docs/G5_PLATFORM_TRUST.md`**. Native devs may see `devWarn` from `maybeLogNativeAppCheckEnforcementRiskOnce` (`src/config/runtimeTrustProfile.ts`).

Until tokens are available on **every** platform you deploy, keep **`FIREBASE_APP_CHECK_ENFORCE` unset** on endpoints those clients hit.

## Cloud Functions bundle vs app (`functions/lib`)

The deployed Functions artifact includes **inlined** modules from `../src` (country packs, payment tier helpers, etc.). See **`docs/FUNCTIONS_BUNDLE_PARITY.md`**. Before shipping Functions changes, run **`npm run functions:verify-bundle`** at repo root so stale **`functions/lib`** is less likely to merge.

## G2 / G3 runtime trust & release gate

- **`docs/G2_RUNTIME_TRUST.md`** — server logs, B2B HTTPS→Firestore fallback, cold-start posture.
- **`docs/G3_APP_CHECK_AND_RELEASE.md`** — App Check client honesty (web vs native), **`npm run trust:live`** (optional HTTP smoke), **`npm run preflight:release`**.

- Root: `npm run trust:preflight` — static anchors (no live Firebase).
- Root: `npm run trust:live` — live HTTP checks when `TRUST_SMOKE_*` env is set (see G3 doc).

## Release smoke (client + optional Functions)

See **`docs/RELEASE_DISCIPLINE.md`**. Quick checks only:

- Root: `npm run preflight` — app TypeScript + narrow navigation registry assertions (not E2E).
- Root: `npm run preflight:with-functions` — above plus `functions/lib` git parity after rebuild.

## Receipt-authoritative top-up (staging)

See **`docs/RECEIPT_STRICTNESS.md`** (env matrix + staging order). HTTP evidence harness: **`npm run verify:receipt`** (requires `TRUST_SMOKE_*` — see `docs/WAVE1_CLOSURE_EVIDENCE.md`). For safe staging:

1. Deploy a **signature-verified** payment webhook that writes `platform_payment_receipts/{paymentEventId}` with `status: 'paid'` and metadata matching your test user.
2. Enable strict flags **only on a staging** `walletOps` deployment first.
3. Run one successful top-up; confirm **409** when receipt missing; confirm **duplicate: true** on replay.

**Pilot default:** receipt precondition **off** — backward compatible.

## Intentional residual risk (not “fixed” by env alone)

- **Anonymous Firebase Auth** remains the primary user identity for wallet + AI until you add step-up auth or App Check on **all** client builds.
- **`aiProxy` rate limit** is per Cloud Function instance, not global.
- **Growth analytics** remain local / not server-attested.
