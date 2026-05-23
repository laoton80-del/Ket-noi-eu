# VIONA Local no-charge — controlled pilot session 2 (Ops Audit UI)

**Packs:** `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.PILOT_SESSION_2_USE.1` · `VIONA.LOCAL.NO_CHARGE.OPS_AUDIT_UI.EXPO_OPERATOR_WALKTHROUGH.1`
**Playbook:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_CONTROLLED_PILOT_OPS_PLAYBOOK.md`
**Ops Audit UI plan:** `docs/runbooks/VIONA_LOCAL_NO_CHARGE_OPS_AUDIT_UI_PLAN.md`
**Master at Expo walkthrough:** `21ec3ec` (docs + screen shell `727cc38`)
**Session dates (UTC):** 2026-05-20 (API/static) · 2026-05-23 (interactive Expo web)

---

## Session verdict

| Layer | Result |
|-------|--------|
| **Public HTTPS ops API smoke** | **PASS** |
| **Static UI implementation audit** | **PASS** @ `727cc38` |
| **Interactive Expo Ops Audit UI (web)** | **PASS** @ 2026-05-23 — see §5 |
| **Home secret-tap / PIN modal path** | **NOT RUN** in automation (deep-link + ADMIN REST login used instead) |
| **On-disk `.env.local` admin debug flags** | **FAIL** at probe — Expo session used **shell env overrides** (§5.1) |
| **Pause triggered** | **No** |
| **Overall session 2 (Ops Audit UI)** | **PASS** (staging / Expo web / read-only ops audit) |

**Money law (unchanged):** `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; **confirmed does not mean paid**. Whole VIONA: pre-commercial / staging-pilot. Global Active / full commercial: **not yet**.

---

## 1. Preconditions

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | `master` / `origin` ≥ `727cc38` | **PASS** | Expo walkthrough @ `21ec3ec` |
| 2 | `EXPO_PUBLIC_REST_API_BASE` → public HTTPS staging | **PASS** | Used by Metro + UI fetches |
| 3 | `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** | Automated probe: length 0 |
| 4 | Admin debug surfaces enabled | **PASS** (session) / **FAIL** (on-disk) | Shell overrides for Expo; add flags to `.env.local` for operator convenience |
| 5 | Server `Role.ADMIN` login (no dev JWT) | **PASS** | REST PIN login; JWT not logged |
| 6 | Secrets printed in this doc | **No** | |

**On-disk probe (no secret values):** `EXPO_PUBLIC_ENABLE_ADMIN_DEBUG` not `1`; `EXPO_PUBLIC_FEATURE_ADMIN_DEMO_METRICS` / `EXPO_PUBLIC_FEATURE_OMNI_DEMO` not truthy; `EXPO_PUBLIC_ADMIN_PIN` length 0.

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
| **Issues found** | On-disk `.env.local` missing persistent admin-debug flags — use shell overrides or update local env before operator manual reruns |
| **Pause decision** | **No** |

---

## 7. Follow-up

1. Optional: operator attestation of **secret-tap + PIN** path on phone (same checklist as §5.2).
2. Persist admin-debug flags in local env (not committed) for routine `npx expo start -c`.
3. Broader pilot session 2 user/merchant flows per ops playbook when scheduled.
4. **Not in scope:** payment/wallet, production admin, audit-events drawer UI.

---

## 8. Validation (docs commits)

| Check | `PILOT_SESSION_2_USE.1` | `EXPO_OPERATOR_WALKTHROUGH.1` |
|-------|-------------------------|-------------------------------|
| `git diff --check` | PASS | PASS |
| `npx tsc --noEmit` | PASS | PASS |
| `npm run lint` | PASS | PASS |
| `npm run smoke` | PASS | PASS |
