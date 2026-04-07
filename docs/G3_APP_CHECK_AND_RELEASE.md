# G3 — App Check readiness, live trust smoke, commercial release gate

This step keeps trust wording honest and adds practical verification gates.
M1 now includes a **real native App Check path** via `@react-native-firebase/app-check` (dev client / store builds),
while preserving clear rollout safety for environments that are not yet verified.

## 1. Client App Check (what is wired vs not)

| Platform | Status in repo |
|----------|----------------|
| **Web (Expo web)** | `initializeAppCheck` runs **only** when `EXPO_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` is set (reCAPTCHA Enterprise site key from Firebase Console → App Check). Then `getToken` feeds `X-Firebase-AppCheck` on `walletOps`, `aiProxy`, and `b2bStaffQueueSnapshot` requests via `src/utils/trustBackendHeaders.ts`. |
| **iOS / Android (native dev client / store build)** | Uses RN Firebase App Check bridge in `src/config/nativeAppCheckBridge.native.ts` via `appCheckClient.ts`. Tokens can be attached when native init succeeds, Firebase native files are present, and providers are configured in Console. **Expo Go** still cannot attach native App Check. |

Debug (web): register a debug token in Console; set `EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` or `EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG=1` per [Firebase debug provider](https://firebase.google.com/docs/app-check/web/debug-provider) guidance.

Readiness helper: `describeAppCheckClientPosture()` in `appCheckClient.ts` (programmatic) — use in internal diagnostics; do not show raw tokens in UI.

## 2. Live trust smoke (real HTTP)

From repo root, with a **real** Firebase ID token (same project as Functions):

```bash
set TRUST_SMOKE_BACKEND_BASE=https://europe-west1-PROJECT_ID.cloudfunctions.net
set TRUST_SMOKE_ID_TOKEN=<firebase_id_token>
# optional if App Check enforced:
set TRUST_SMOKE_APP_CHECK=<app_check_token>
node scripts/trust-live-smoke.mjs
```

Or `npm run trust:live` after exporting vars.

- **SKIP (exit 0):** missing `TRUST_SMOKE_BACKEND_BASE` or `TRUST_SMOKE_ID_TOKEN` — intentional for local `preflight` that does not have secrets.
- **Strict CI:** set `TRUST_SMOKE_STRICT=1` to **fail** when env is missing instead of skipping.

The script checks **status codes and JSON bodies**, not source files. It accepts `b2bStaffQueueSnapshot` **403** `b2b_tenant_claim_missing` as a valid “trust working” outcome.

## 3. Release gate commands

| Command | Purpose |
|---------|---------|
| `npm run preflight` | App typecheck + navigation smoke. |
| `npm run preflight:with-functions` | Above + Functions bundle git parity. |
| `npm run trust:preflight` | Static G2/G3 wiring anchors. |
| `npm run preflight:release` | `preflight:with-functions` + `trust:preflight` (no live token required). |
| `npm run trust:live` | Optional live smoke — **requires tokens in env**. |

Commercial candidate builds should at least pass `preflight:release`; staging should run `trust:live` before enabling `FIREBASE_APP_CHECK_ENFORCE=1`.

## 4. Honest limits

- No full CI matrix, no Detox, no load testing.
- Native App Check is wired in repo, but enforcing App Check still **must** wait for end-to-end token verification on real native builds (dev client/store) in the target Firebase project.
- `trust:live` does not mint tokens; operators must supply real ID/App Check tokens via env for enforced-backend proof.
- `trust:live` does not prove payment webhooks, B2B voice, or Firestore rules.

## 5. G5 follow-on

See **`docs/G5_PLATFORM_TRUST.md`** for the **native vs web enforcement** matrix, Functions cold-start warning when `FIREBASE_APP_CHECK_ENFORCE=1`, **`npm run preflight:commercial`**, and `.trust-live-stamp` after successful `trust:live`.
