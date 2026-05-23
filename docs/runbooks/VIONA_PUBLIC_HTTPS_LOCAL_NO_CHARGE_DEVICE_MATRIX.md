# VIONA public HTTPS Local no-charge — device matrix evidence

**Pack:** `VIONA.PUBLIC_HTTPS.LOCAL_NO_CHARGE.DEVICE_MATRIX.1`
**Master at doc write:** `7d1439e`
**Public API:** `https://viona-api-staging-eu.fly.dev`
**Date:** 2026-05-23
**Type:** Staging / responsive + EN-VI manual matrix — **not** production, commercial/payment, or native app-store certification.

## Verdict

| Layer | Result |
|-------|--------|
| **Pre-checks (env flags, no secret values)** | **PASS** |
| **Public HTTPS API smoke (paced)** | **PASS** — exit 0 |
| **Prior public HTTPS REST UI walkthrough** | **PASS** — single operator session (`OPERATOR_PASS_SYNC.1`); **not** per-viewport matrix |
| **Device matrix (4 viewports × EN/VI)** | **NOT RUN** — requires operator manual pass per cell below |

**Overall matrix:** **BLOCKED** until operator marks viewport/language rows **PASS** with evidence.

**Does not certify:** production launch, commercial/payment readiness, merchant production onboarding, AI autonomous money actions, SOS production reliability, or native iOS/Android store sign-off.

---

## Pre-checks (automated @ doc write)

| Check | Result |
|-------|--------|
| `master` / `origin` | `7d1439e` |
| `.env.local` tracked | **No** |
| `EXPO_PUBLIC_REST_API_BASE` → public HTTPS | **PASS** (probe match; value not logged) |
| `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** (probe length 0) |
| Secrets printed | **No** |
| Local-dev UI/matrix evidence reused | **No** — public HTTPS only |

**Expo:** Operator should use `npx expo start -c` after env changes (not re-run by this pack).

**API parity:** `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` → **PASS** (`REQUEST_ONLY_NO_CHARGE`, `walletPhase` `NONE`, `paymentCaptured: false`).

---

## Matrix summary

| Viewport | VI | EN |
|----------|----|----|
| 390×844 | **NOT RUN** | **NOT RUN** |
| 768×1024 | **NOT RUN** | **NOT RUN** |
| 1024×768 | **NOT RUN** | **NOT RUN** |
| 1366×768 | **NOT RUN** | **NOT RUN** |

**Legend:** **PASS** / **FAIL** / **NOT RUN** — operator fills after manual test on public HTTPS base.

---

## Per-viewport checklist (operator)

For each cell: set app language, resize browser/devtools (or device), confirm `EXPO_PUBLIC_REST_API_BASE` still points at Fly staging, run flows A–D, record **PASS** only if verified.

### 390×844

| Lang | User A | User B isolation | Merchant M inbox | Confirm | Decline | Merchant N isolation | Responsive | Forbidden wording | Result |
|------|--------|------------------|------------------|---------|---------|----------------------|------------|-------------------|--------|
| VI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |
| EN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |

### 768×1024

| Lang | User A | User B isolation | Merchant M inbox | Confirm | Decline | Merchant N isolation | Responsive | Forbidden wording | Result |
|------|--------|------------------|------------------|---------|---------|----------------------|------------|-------------------|--------|
| VI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |
| EN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |

### 1024×768

| Lang | User A | User B isolation | Merchant M inbox | Confirm | Decline | Merchant N isolation | Responsive | Forbidden wording | Result |
|------|--------|------------------|------------------|---------|---------|----------------------|------------|-------------------|--------|
| VI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |
| EN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |

### 1366×768

| Lang | User A | User B isolation | Merchant M inbox | Confirm | Decline | Merchant N isolation | Responsive | Forbidden wording | Result |
|------|--------|------------------|------------------|---------|---------|----------------------|------------|-------------------|--------|
| VI | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |
| EN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | NOT RUN | **NOT RUN** |

---

## Flow definitions (public HTTPS)

### A. User A

- UI login (phone + PIN) via public HTTPS API
- Local My Requests / status visible
- Logout; session clear; fresh login

### B. User B

- UI login; no User A private request overlap; logout

### C. Merchant M

- UI login; merchant inbox; Business M rows; confirm UI; decline UI; logout

### D. Merchant N

- UI login; no Business M rows/actions; isolation; logout

---

## Responsive / design checks (each viewport)

| Check | Result |
|-------|--------|
| No clipped primary CTA | **NOT RUN** |
| No overlapping dock/tab bar | **NOT RUN** |
| No unreadable text | **NOT RUN** |
| No broken card layout | **NOT RUN** |
| No long dashboard row regression (Premium App Tiles expected) | **NOT RUN** |
| Home design standard preserved | **NOT RUN** |
| Local route/logic preserved | **NOT RUN** |
| Safety copy visible where relevant | **NOT RUN** |

---

## Safety checks (matrix-wide)

| Check | API smoke | UI matrix |
|-------|-----------|-----------|
| No payment captured | **PASS** | **NOT RUN** (per cell) |
| `REQUEST_ONLY_NO_CHARGE` | **PASS** | **NOT RUN** (per cell) |
| `walletPhase` NONE | **PASS** | **NOT RUN** (per cell) |
| Forbidden commercial wording absent | N/A | **NOT RUN** |

Forbidden terms: paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out.

---

## Pilot accounts (labels only)

| Role | Phone (E.164) |
|------|---------------|
| User A | `+420910000001` |
| User B | `+420910000002` |
| Merchant M | `+420920000001` |
| Merchant N | `+420920000002` |
| Business M | `257f467a-8de2-41d0-b171-5ee499ba96d2` |

---

## References

| Doc | Scope |
|-----|--------|
| `docs/runbooks/VIONA_PUBLIC_HTTPS_REST_UI_WALKTHROUGH.md` | Single-session public HTTPS UI PASS (not viewport matrix) |
| `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Deploy + smoke |
| `docs/qa/VIONA_LOCAL_MANUAL_DEVICE_STAGING_WALKTHROUGH_1.md` | Local-dev checklist template (do not reuse as HTTPS evidence) |

---

## Limitations (preserved)

- Not production / commercial / payment / escrow / payout / settlement
- Web/responsive matrix only unless operator notes native device model
- Not merchant production onboarding
- Not AI autonomous money/SOS actions
- Not SOS dispatch claims
- Local **request-only / no-charge** only

---

## Next required action

1. Operator: execute each viewport × language cell on `https://viona-api-staging-eu.fly.dev` with dev JWT cleared.
2. Mark rows **PASS** / **FAIL** with date and initials; optional screenshot refs (no secrets).
3. Open `DEVICE_MATRIX.OPERATOR_PASS_SYNC.1` or update this doc when all required cells **PASS**.
4. Re-run paced HTTPS smoke after API deploys.
