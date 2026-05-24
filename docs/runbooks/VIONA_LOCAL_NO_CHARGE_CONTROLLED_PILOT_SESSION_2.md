# VIONA Local no-charge — controlled pilot session 2 (Ops Audit UI)

**Rollup (sessions 1–5):** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_SESSIONS_1_5_ROLLUP.md`
**Packs:** `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.PILOT_SESSION_2_USE.1` · `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.EXPO_OPERATOR_WALKTHROUGH.1` · `VIONA.LOCAL.NO_CHARGE.CONTROLLED_PILOT_SESSION_2.USER_MERCHANT_OPS_USE.1` · `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.NATIVE_SECRET_TAP_SPOT_CHECK.1` · `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.NATIVE_SECRET_TAP_ATTESTATION.1`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Master at user/merchant + ops use:** `deac415` (screen shell `727cc38`)
**Session dates (UTC):** 2026-05-20 (API/static) · 2026-05-23 (Expo ops UI + user/merchant/ops API session)

---

## Session verdict

| Layer | Result |
|-------|--------|
| **Public HTTPS ops API smoke** | **PASS** |
| **Static UI implementation audit** | **PASS** @ `727cc38` |
| **Interactive Expo Ops Audit UI (web)** | **PASS** @ 2026-05-23 — see §5 |
| **User/merchant pilot flows + ops visibility (API)** | **PASS** @ 2026-05-23 — see §9 |
| **Home secret-tap / PIN modal path (native)** | **FAIL / BLOCKED** — see §11.5 (device connected; app did not reach Home) |
| **Home secret-tap / PIN (Expo web §5)** | **NOT RUN** (deep-link + ADMIN REST used) |
| **On-disk admin debug flags** | **PASS** @ native pack probe (values not logged) |
| **Pause triggered** | **No** |
| **Overall controlled pilot session 2** | **PASS** (staging / public HTTPS — user, merchant, ops read-only) |

**Money law (unchanged):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; **confirmed does not mean paid**. Whole VIONA: pre-commercial / staging-pilot. Global Active / full commercial: **not yet**.

---

## 1. Preconditions

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | `master` / `origin` ≥ `727cc38` | **PASS** | Expo walkthrough @ `21ec3ec` |
| 2 | `EXPO_PUBLIC_REST_API_BASE` → public HTTPS staging | **PASS** | Used by Metro + UI fetches |
| 3 | `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** | Automated probe: length 0 |
| 4 | Admin debug surfaces enabled | **PASS** | Probe @ §11.1 (values not logged) |
| 5 | Server `Role.ADMIN` login (no dev JWT) | **PASS** | REST PIN login; JWT not logged |
| 6 | Secrets printed in this doc | **No** | |

**Latest on-disk probe:** see §11.1 (admin debug **PASS** @ native pack).

---

## 2. Environment (privacy-safe)

| Field | Value |
|-------|--------|
| **Platform / device** | **Expo web** — Chromium headless against `http://localhost:19007` |
| **Metro** | `npx expo start -c --web --port 19007` with admin-debug env overrides (§5.1) |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Admin role** | `ADMIN` confirmed via `POST /api/auth/login` (ops roster account; credentials not logged) |
| **Screen shell** | `727cc38` |

---

## 3. Public HTTPS API corroboration

Command: `node scripts/smoke-public-staging-api.mjs` (exit **0**).

| Stage | Result |
|-------|--------|
| `opsAuditList` / `opsAuditDetail` | **PASS** |
| `opsAuditUnauthed` / forbidden B2C & merchant | **PASS** |
| `opsAuditMutationSafe` | **PASS** |
| Redaction | **PASS** |

---

## 4. Static UI audit @ `727cc38`

| Check | Result |
|-------|--------|
| Route only when `isAdminDebugSurfaceEnabled()` + `adminDemoMetricsEnabled` | **PASS** |
| Entry only `AdminDashboardScreen` | **PASS** |
| Client `localOpsAuditApi.ts` GET-only | **PASS** |
| No mutation action buttons in ops UI tree | **PASS** |

---

## 5. Interactive Expo walkthrough (`EXPO_OPERATOR_WALKTHROUGH.1`) — 2026-05-23

### 5.1 Method (honest)

| Item | Detail |
|------|--------|
| **Run** | `npx expo start -c --web --port 19007` |
| **Admin debug** | Shell session overrides: `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1`, `EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS=true`, `EXPO_PUBLIC_FEATURE_OMNI_DEMO=true`, `EXPO_PUBLIC_ADMIN_PIN` ≥ 12 chars (session-only test label; not committed) |
| **Auth** | Ops `ADMIN` via staging `POST /api/auth/login`; JWT + auth snapshot seeded into web `localStorage` (phone redacted in storage seed) |
| **Navigation** | Deep links `/AdminDashboard`, `/local`, `/LocalOpsAudit` (secret logo-tap ×5 + PIN modal **not** exercised in this automation) |
| **Verification** | Chromium automation observed rendered copy + network `GET` ops endpoints |

### 5.2 Walkthrough results

| Check | Result |
|-------|--------|
| Admin debug enabled (route registered) | **PASS** |
| Admin login (`Role.ADMIN`, no dev JWT) | **PASS** |
| Route / access — Grand Admin Dashboard | **PASS** |
| Local Ops Audit row on Admin Dashboard | **PASS** |
| Consumer visibility — no ops audit on `/local` tab | **PASS** |
| Screen load — `LocalOpsAudit` | **PASS** |
| List — `GET /api/local/ops/requests` | **PASS** |
| Detail — `GET /api/local/ops/requests/:id` | **PASS** |
| Pagination / load-more | **PASS** (load-more control visible; extra list `GET` observed) |
| Safety chips (4) | **PASS** |
| Limitation banner (4 themes) | **PASS** |
| Mutation controls absent | **PASS** |
| Redaction (visible UI) | **PASS** — no JWT, `DATABASE_URL`, or raw phone in rendered body |

**Sample detail request id (non-secret):** `291bd24a-846e-4898-8198-144365038c48`

### 5.3 Not observed / limitations

| Item | Status |
|------|--------|
| Loading / empty / error UI states | Not forced in this pass |
| Native iOS / Android | **Not run** |
| Secret-tap + `EXPO_PUBLIC_ADMIN_PIN` modal path | **Not run** (deep-link used) |
| Audit-events drawer | Out of scope for screen shell v1 |

---

## 6. Issues / pause

| Item | Detail |
|------|--------|
| **Issues found** | None blocking §5–§9 |
| **Pause decision** | **No** |

---

## 7. Follow-up

1. **Required for native PASS:** operator completes §11 attestation on iOS or Android (`npx expo start -c`).
2. Optional: secret-tap + PIN re-check on Expo web (not substituted for native).
3. **Not in scope:** payment/wallet, production admin, audit-events drawer UI.

---

## 9. User / merchant + ops visibility (`USER_MERCHANT_OPS_USE.1`) — 2026-05-23

### 9.1 Environment

| Field | Value |
|-------|--------|
| **Platform** | Public HTTPS API — paced smoke (`node scripts/smoke-public-staging-api.mjs`) |
| **API base** | `https://viona-api-staging-eu.fly.dev` |
| **Dev JWT** | Empty (probe: length 0) |
| **Ops UI** | Corroborated via §5 Expo web PASS + API ops stages below (no parallel Expo user/merchant UI in this pack) |

### 9.2 Flow results

| Step | Requirement | Result |
|------|-------------|--------|
| 1 | Health check | **PASS** — HTTP 200 |
| 2 | User A login | **PASS** |
| 3 | User B login | **PASS** |
| 4 | Merchant M login | **PASS** |
| 5 | Merchant N login | **PASS** |
| 6 | User A creates Local request | **PASS** — HTTP 201 (`local:create`) |
| 7 | User B isolation | **PASS** |
| 8 | Merchant M inbox | **PASS** |
| 9 | Merchant N isolation | **PASS** |
| 10 | Merchant M confirm | **PASS** — HTTP 200 |
| 11 | Merchant M decline | **PASS** — HTTP 200 |
| 12 | No-charge safety | **PASS** — see §9.3 |
| 13–15 | Ops ADMIN list/detail on session activity | **PASS** — `ops:listRequests`, `ops:detailRequest` |
| 16 | Ops redaction | **PASS** — `assertOpsResponseRedacted` |
| 17 | Ops read-only safety | **PASS** — `opsAuditMutationSafe`; safety block on list |
| 18 | No ops mutation controls (UI) | **PASS** — §5 + static audit |
| 19 | Forbidden commercial wording | **Not re-scanned** in this API pack (session 1 UI + §5 ops UI: not observed) |

### 9.3 Money law (smoke snapshot)

| Field | Value |
|-------|--------|
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| `paymentCaptured` | `false` |
| Confirmed ≠ paid | Enforced in ops list `safety` + UI copy (§5) |

### 9.4 Ops audit stages (same smoke run)

| Stage | Result |
|-------|--------|
| `opsAuditUnauthed` | **PASS** |
| `opsAuditList` | **PASS** |
| `opsAuditDetail` | **PASS** |
| `opsAuditForbiddenB2c` | **PASS** |
| `opsAuditForbiddenMerchant` | **PASS** |
| `opsAuditMutationSafe` | **PASS** |

**Request ids (this run, non-secret):**

- Confirm target: `04dbf11b-798a-49b8-a7ad-8a071fa2e21c`
- Decline target: `01d4fded-287d-48eb-b828-58cd9e5f3a8d`
- Ops detail opened: `01d4fded-287d-48eb-b828-58cd9e5f3a8d` (declined row)

### 9.5 Issues / pause

| Item | Detail |
|------|--------|
| **Issues found** | None blocking |
| **Pause decision** | **No** |

---

## 11. Native secret-tap spot-check (`NATIVE_SECRET_TAP_SPOT_CHECK.1`) — 2026-05-23

### 11.1 Preconditions (automated probe — no secret values)

| Check | Result |
|-------|--------|
| `EXPO_PUBLIC_REST_API_BASE` → staging HTTPS | **PASS** |
| `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** |
| `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1` | **PASS** |
| `EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS` | **PASS** |
| `EXPO_PUBLIC_FEATURE_OMNI_DEMO` | **PASS** |
| `EXPO_PUBLIC_ADMIN_PIN` length ≥ 12 | **PASS** (length only) |
| Ops roster phone configured | **PASS** (set; not logged) |
| `.env.local` committed | **No** |

### 11.2 Native interactive walkthrough (initial spot-check)

| Field | Result |
|-------|--------|
| **Device / platform** | **NOT RUN** @ first pass — no `adb` device connected |
| **Public HTTPS smoke (corroboration)** | **PASS** |

### 11.3 Operator attestation template (native — for physical device / working dev client)

Complete on a device where `npx expo start -c` loads Home without native-module errors.

| Check | PASS/FAIL | Notes |
|-------|-----------|-------|
| Home loads | | |
| Local tab — no Ops Audit | | |
| Secret-tap ×5 → PIN modal | | |
| PIN → Grand Admin Dashboard | | |
| Local Ops Audit row visible | | |
| Ops Audit screen list/detail | | |
| Safety chips (4) | | |
| Limitation banner (4 themes) | | |
| No mutation controls | | |
| Consumer nav cannot reach Ops Audit | | |
| Redaction (no phone/PIN/JWT on screen) | | |

### 11.4 Issues / pause (spot-check pack)

| Item | Detail |
|------|--------|
| **Issues found** | First pass: no device connected |
| **Pause decision** | **No** |

### 11.5 Native attestation attempt (`NATIVE_SECRET_TAP_ATTESTATION.1`) — 2026-05-23

| Field | Result |
|-------|--------|
| **Device connected** | **PASS** — `emulator-5554` (`Small_Phone` AVD) |
| **Admin debug flags (probe)** | **PASS** — see §11.1 |
| **Metro** | `npx expo start -c` — Android bundle completed |
| **Dev client on device** | `com.ahojbuono.ketnoieu` (Expo Development Build) — connects to `http://10.0.2.2:8081` |
| **Fresh `com.ketnoiglobal.app` install** | **FAIL** — `npx expo run:android` blocked by Mapbox Maven deps (`com.mapbox.maps:android-ndk27:11.18.2` not resolved) |
| **Home loads** | **FAIL** — redbox: `Cannot find native module 'ExpoLocalization'` after bundle load |
| **Secret-tap ×5 + PIN modal** | **FAIL** — Home not reached; PIN modal not observed |
| **Grand Admin Dashboard / Local Ops Audit** | **NOT RUN** |
| **Consumer Local tab check** | **NOT RUN** |
| **Public HTTPS smoke** | **PASS** — all `opsAudit*` stages |

| Check | Result |
|-------|--------|
| secret-tap/PIN path | **FAIL** |
| admin login/session | **NOT RUN** (UI) |
| route/access | **FAIL** |
| list / detail | **NOT RUN** |
| safety chips / limitation banner | **NOT RUN** |
| mutation controls absent | **NOT RUN** (UI) |
| consumer visibility | **NOT RUN** |
| redaction | **NOT RUN** (UI) |

**Issues found:** Native dev-client/runtime mismatch on emulator — not an Ops Audit UI logic defect. **Recommended unblock:** install current dev build on device (`eas build --profile development` or fix Mapbox Maven + `expo run:android`), or use physical device with matching dev client.

**Pause decision:** **No** — does not invalidate session 2 API / Expo web / user-merchant ops evidence.

**Do not claim native secret-tap PASS until §11.3 is completed on a working dev client.**

### 11.6 Android dev-client build unblock (`VIONA.NATIVE.ANDROID.DEV_CLIENT_MAPBOX_BUILD_FIX.1`) — 2026-05-23

| Field | Result |
|-------|--------|
| **Mapbox Maven resolution** | **PASS** — `expo-build-properties` `extraMavenRepos` + `@rnmapbox/maps` `RNMapboxMapsVersion: 11.18.2` in `app.config.js`; `npx expo prebuild -p android` applies `@rnmapbox/maps-v2-maven` block |
| **Kotlin/KSP alignment** | **PASS** — `kotlinVersion` **2.1.20** (was **2.1.0** → expo-updates fell back to incompatible KSP **1.9.24-1.0.20**, `NoSuchMethodError` on `kspDebugKotlin`) |
| **Gradle assembleDebug** | **PASS** — `app:assembleDebug` with project-local `GRADLE_USER_HOME` (corrupted `%USERPROFILE%\.gradle` caused `GradleWorkerMain` worker failures) |
| **`com.ketnoiglobal.app` install** | **PASS** — `app-debug.apk` on `emulator-5554`; `versionName=1.0.0` |
| **App launch (cold)** | **PASS** — `MainActivity` start; process observed (no secret-tap walkthrough) |
| **Secret-tap ×5 + PIN / Ops Audit UI** | **NOT RUN** — attestation checklist §11.3 still required |

**Operator notes (no secrets):** After clone, run `npx expo prebuild -p android` before `expo run:android`. If Gradle workers fail with `GradleWorkerMain` ClassNotFoundException, use a fresh `GRADLE_USER_HOME` or clear corrupted user Gradle caches.

**Do not claim native secret-tap PASS until §11.3 is completed on a working dev client.**

### 11.7 Native secret-tap attestation retry (`NATIVE_SECRET_TAP_ATTESTATION.RETRY.1`) — 2026-05-23

| Field | Result |
|-------|--------|
| **Device / platform** | Android emulator `emulator-5554` (`Small_Phone` AVD, 720×1280) |
| **Device connected** | **PASS** (initial); **FAIL** at end of session (`adb` reported device offline after hung `uiautomator` calls) |
| **App package installed** | **PASS** — `com.ketnoiglobal.app` |
| **Metro / native launch** | **PASS** — `npx expo start -c --android`; `Android Bundled` (5141 modules); logcat `Running "main"` after `cmd package compile -m speed` (first cold start had long Sentry/DEX verification) |
| **Admin debug flags** | **PASS** — Metro session overrides only (not committed): `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG=1`, `EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS=true`, `EXPO_PUBLIC_FEATURE_OMNI_DEMO=true`, `EXPO_PUBLIC_ADMIN_PIN` length ≥ 12 (session-only label; value not logged) |
| **REST base / dev JWT** | **PASS** — staging HTTPS base; `EXPO_PUBLIC_DEV_REST_JWT` empty |
| **Admin login (`Role.ADMIN`, API)** | **PASS** — `POST /api/auth/login` for ops roster account (credentials not logged) |
| **Public HTTPS smoke** | **PASS** — `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` exit 0; `ops:listAfterReads` HTTP 200 |

| Check | Result | Notes |
|-------|--------|-------|
| Home loads | **PARTIAL** | JS runtime reached (`Running "main"`); full Home UI not confirmed (uiautomator dump timed out) |
| Local tab — no Ops Audit | **NOT RUN** | UI automation blocked |
| Secret-tap ×5 → PIN modal | **FAIL** | Could not confirm PIN modal in UI (uiautomator `ETIMEDOUT` / empty hierarchy earlier) |
| PIN → Grand Admin Dashboard | **NOT RUN** | |
| Local Ops Audit row | **NOT RUN** | |
| List / detail (HTTPS) | **NOT RUN** (UI) | API corroboration **PASS** via smoke script only |
| Safety chips (4) | **NOT RUN** | |
| Limitation banner (4 themes) | **NOT RUN** | |
| Mutation controls absent | **NOT RUN** | |
| Consumer nav cannot reach Ops Audit | **NOT RUN** | |
| Redaction (visible UI) | **NOT RUN** | |

**Issues found:** Android dev client build from §11.6 loads Metro JS, but **operator UI walkthrough could not be completed** on this emulator pass: `uiautomator` hangs/timeouts, `adb` went offline, AsyncStorage seed via `run-as`/`sqlite3` flaky after `force-stop`. **Not** an Ops Audit API defect — staging ops list/detail **PASS** on HTTPS.

**Pause decision:** **No** — does not invalidate §5 Expo web, §9 user/merchant ops, or §11.6 build unblock.

**Do not claim native secret-tap PASS until §11.3 checklist is completed on a stable device with confirmed Home + PIN modal + Ops Audit screen UI.**

---

## 12. Validation (docs commits)

| Check | All session 2 packs |
|-------|---------------------|
| `git diff --check` | PASS @ commit |
| `npx tsc --noEmit` | PASS @ commit |
| `npm run lint` | PASS @ commit |
| `npm run smoke` | PASS @ commit |
| `smoke-public-staging-api.mjs` | PASS exit 0 @ §9 / §11 |
