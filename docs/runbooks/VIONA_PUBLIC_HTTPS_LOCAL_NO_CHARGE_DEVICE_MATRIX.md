# VIONA public HTTPS Local no-charge — device matrix evidence

**Pack:** `VIONA.PUBLIC_HTTPS.LOCAL_NO_CHARGE.DEVICE_MATRIX.1` + `OPERATOR_PASS_SYNC.1`
**Master at operator PASS sync:** `b9c981e`
**Public API:** `https://viona-api-staging-eu.fly.dev`
**Date:** 2026-05-23
**Type:** Staging / responsive + EN-VI manual matrix — **not** production, commercial/payment, or native app-store certification.

## Verdict

| Layer | Result |
|-------|--------|
| **Pre-checks (env flags, no secret values)** | **PASS** |
| **Public HTTPS API smoke (paced)** | **PASS** |
| **Device matrix (4 viewports × EN/VI)** | **PASS** (operator-verified @ PASS sync) |

**Overall matrix:** **PASS** (staging / manual / public HTTPS / web responsive only).

**Does not certify:** production launch, commercial/payment readiness, native iOS/Android store sign-off (unless separately tested), merchant production onboarding, AI autonomous money actions, or SOS production reliability.

---

## Operator PASS sync (`OPERATOR_PASS_SYNC.1`) — 2026-05-23

**Operator attestation:** All eight viewport×language cells manually verified on Expo web pointed at public HTTPS staging API (`npx expo start -c`; dev JWT cleared).

| Requirement | Status |
|-------------|--------|
| `EXPO_PUBLIC_REST_API_BASE` → public HTTPS | **PASS** (operator-confirmed; probe: match) |
| `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** (operator-confirmed; probe: length 0) |
| `.env.local` not committed | **PASS** |
| Local-dev / single-session proof reused as matrix | **No** |
| Secrets printed | **No** |

### Per-cell checks (all verified cells — operator PASS)

For each of the 8 cells below, operator confirmed:

1. User A UI login via public HTTPS — **PASS**
2. User A request/status visibility — **PASS**
3. User A logout/session clear — **PASS**
4. User B isolation — **PASS**
5. Merchant M login/inbox — **PASS**
6. Merchant confirm UI — **PASS**
7. Merchant decline UI — **PASS**
8. Merchant N isolation — **PASS**
9. No clipped primary CTA — **PASS**
10. No overlapping dock/tab bar — **PASS**
11. No unreadable text — **PASS**
12. No broken card layout — **PASS**
13. No long dashboard row regression (Premium App Tiles expected) — **PASS**
14. Forbidden commercial wording — **PASS** (not observed)
15. No payment captured — **PASS**
16. `REQUEST_ONLY_NO_CHARGE` — **PASS**
17. `walletPhase` NONE — **PASS**

Forbidden terms scanned (not observed): paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out.

**Responsive/design issues:** None reported.

---

## Matrix summary

| Viewport | VI | EN |
|----------|----|----|
| 390×844 | **PASS** | **PASS** |
| 768×1024 | **PASS** | **PASS** |
| 1024×768 | **PASS** | **PASS** |
| 1366×768 | **PASS** | **PASS** |

---

## Per-viewport detail (operator-verified)

### 390×844

| Lang | User A | User B | M inbox | Confirm | Decline | N isolation | Responsive | Wording | Result |
|------|--------|--------|---------|---------|---------|-------------|------------|---------|--------|
| VI | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| EN | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

### 768×1024

| Lang | User A | User B | M inbox | Confirm | Decline | N isolation | Responsive | Wording | Result |
|------|--------|--------|---------|---------|---------|-------------|------------|---------|--------|
| VI | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| EN | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

### 1024×768

| Lang | User A | User B | M inbox | Confirm | Decline | N isolation | Responsive | Wording | Result |
|------|--------|--------|---------|---------|---------|-------------|------------|---------|--------|
| VI | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| EN | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

### 1366×768

| Lang | User A | User B | M inbox | Confirm | Decline | N isolation | Responsive | Wording | Result |
|------|--------|--------|---------|---------|---------|-------------|------------|---------|--------|
| VI | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| EN | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

---

## Pre-checks — initial pack (`DEVICE_MATRIX.1`, historical)

| Check | Initial | PASS sync |
|-------|---------|-----------|
| Matrix cells | **NOT RUN** | **PASS** (8/8) |
| `master` | `b9c981e` | `b9c981e` + this doc commit |

**API parity:** `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` → **PASS**.

---

## Responsive / design (matrix-wide @ PASS sync)

| Check | Result |
|-------|--------|
| No clipped primary CTA | **PASS** |
| No overlapping dock/tab bar | **PASS** |
| No unreadable text | **PASS** |
| No broken card layout | **PASS** |
| No long dashboard row regression | **PASS** |
| Home design standard preserved | **PASS** |
| Local route/logic preserved | **PASS** |
| Safety copy visible where relevant | **PASS** |

---

## Safety checks (matrix-wide)

| Check | API smoke | UI matrix |
|-------|-----------|-----------|
| No payment captured | **PASS** | **PASS** |
| `REQUEST_ONLY_NO_CHARGE` | **PASS** | **PASS** |
| `walletPhase` NONE | **PASS** | **PASS** |
| Forbidden commercial wording | N/A | **PASS** |

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
| `docs/runbooks/VIONA_PUBLIC_HTTPS_REST_UI_WALKTHROUGH.md` | Single-session UI PASS (precursor; matrix supersedes for viewports) |
| `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` | Deploy + smoke |

---

## Limitations (preserved)

- Not production / commercial / payment / escrow / payout / settlement
- Web/responsive matrix (Expo web + devtools viewports); not full native iOS/Android certification unless separately recorded
- Not merchant production onboarding
- Not AI autonomous money/SOS actions
- Not SOS dispatch claims
- Local **request-only / no-charge** only

---

## Next required action

1. Optional: native iOS/Android spot-check on public HTTPS (separate pack if needed).
2. Re-run paced HTTPS smoke after Fly/API deploys.
3. Keep `.env.local` with public base + empty dev JWT (not committed).
