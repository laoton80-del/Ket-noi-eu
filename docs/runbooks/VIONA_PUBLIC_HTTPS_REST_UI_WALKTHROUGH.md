# VIONA public HTTPS REST UI walkthrough — evidence

**Pack:** `VIONA.STAGING.PUBLIC_HTTPS_REST_UI_WALKTHROUGH.1` + `OPERATOR_PASS_SYNC.1`
**Master at operator PASS sync:** `d8c8b26`
**Public API:** `https://viona-api-staging-eu.fly.dev`  
**Date:** 2026-05-23  
**Type:** Staging / manual UI evidence — **not** production, commercial/payment, device matrix, or SOS certification.

## Verdict

| Layer | Result |
|-------|--------|
| **Pre-checks (repo + env flags, no secret values)** | **PASS** @ operator PASS sync |
| **Public HTTPS API smoke (paced script)** | **PASS** — exit 0 (`1daf006` / `a4763c8`) |
| **REST UI walkthrough on public HTTPS** | **PASS** (operator-verified @ PASS sync) |

**Overall:** **PASS** (staging / manual / public HTTPS only) — not production, commercial/payment, or full device matrix.

**Does not certify:** production launch, commercial/payment readiness, full EN-VI device matrix, merchant production onboarding, AI autonomous money actions, or SOS production reliability.

---

## Operator PASS sync (`OPERATOR_PASS_SYNC.1`) — 2026-05-23

**Operator attestation:** Manual UI checklist completed on Expo pointed at public HTTPS staging API.

| Requirement | Status |
|-------------|--------|
| `EXPO_PUBLIC_REST_API_BASE` → `https://viona-api-staging-eu.fly.dev` | **PASS** (operator-confirmed; automated probe: match) |
| `EXPO_PUBLIC_DEV_REST_JWT` empty | **PASS** (operator-confirmed; automated probe: length 0) |
| `.env.local` not committed | **PASS** |
| Expo restart | **PASS** — `npx expo start -c` (operator-confirmed) |
| REST login via UI PIN (not dev JWT) | **PASS** (operator-confirmed) |
| Secrets printed | **No** |

### Operator-verified UI results

| # | Check | Result |
|---|--------|--------|
| 1 | User A UI login via public HTTPS API | **PASS** |
| 2 | User A logout / session clear | **PASS** |
| 3 | User A fresh login again | **PASS** |
| 4 | User B isolation (no User A private overlap) | **PASS** |
| 5 | Merchant M login + inbox / Business M visible | **PASS** |
| 6 | Merchant confirm UI | **PASS** |
| 7 | Merchant decline UI | **PASS** |
| 8 | Merchant N isolation (no Business M rows/actions) | **PASS** |
| 9 | Forbidden commercial wording check | **PASS** — not observed on Local surfaces |
| 10 | No payment captured | **PASS** |
| 11 | Local `REQUEST_ONLY_NO_CHARGE` | **PASS** |
| 12 | `walletPhase` NONE | **PASS** |

Forbidden terms scanned (not observed): paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out.

---

## Pre-checks — initial pack (`WALKTHROUGH.1`, historical)

| Check | Result (initial) | Result (PASS sync) |
|-------|------------------|---------------------|
| `master` / `origin` | `a4763c8` | `d8c8b26` |
| Public HTTPS base on disk | **FAIL** | **PASS** |
| Dev JWT empty on disk | **FAIL** | **PASS** |

Prior **local-dev** strict UI proof (`docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md` @ `127.0.0.1`) does **not** substitute for this public HTTPS UI proof.

---

## API parity (automated)

Command: `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev`

| Check | Result |
|-------|--------|
| health | **PASS** |
| REST login User A / B / Merchant M / N | **PASS** |
| Dev JWT in smoke | **Not used** (PIN login) |
| Local create / confirm / decline | **PASS** |
| Merchant M inbox | **PASS** |
| Merchant N isolation | **PASS** |
| User B isolation | **PASS** |
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| `paymentCaptured` | `false` |

---

## UI walkthrough matrix (operator-verified @ PASS sync)

### A. User A

| Step | Status |
|------|--------|
| Login via UI phone + PIN | **PASS** |
| REST login uses public HTTPS API | **PASS** |
| Local My Requests / status visible | **PASS** |
| Logout / session clear | **PASS** |
| Fresh login again | **PASS** |

### B. User B

| Step | Status |
|------|--------|
| Login via UI phone + PIN | **PASS** |
| No User A private overlap | **PASS** |
| Logout | **PASS** |

### C. Merchant M

| Step | Status |
|------|--------|
| Login + merchant REST session | **PASS** |
| Local merchant inbox / Business M | **PASS** |
| Confirm one request (UI) | **PASS** |
| Decline one request (UI) | **PASS** |
| Logout | **PASS** |

### D. Merchant N

| Step | Status |
|------|--------|
| Login | **PASS** |
| Inbox: no Business M rows/actions | **PASS** |
| Ownership isolation | **PASS** |
| Logout | **PASS** |

### Safety proof (UI)

| Check | Status |
|-------|--------|
| No payment captured | **PASS** |
| `REQUEST_ONLY_NO_CHARGE` | **PASS** |
| `walletPhase` NONE | **PASS** |
| Forbidden commercial wording | **PASS** |

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

## Limitations (preserved)

- Not production / commercial / payment / escrow / payout / settlement
- Not full device matrix (web/iOS/Android EN-VI)
- Not merchant production onboarding
- Not AI autonomous money/SOS actions
- Not SOS dispatch or emergency-response claims
- Local **request-only / no-charge** only

---

## Next required action

1. Optional: EN-VI / multi-device matrix on public HTTPS (separate pack; out of scope here).
2. Re-run paced HTTPS smoke after Fly deploys if API changes.
3. Keep `.env.local` saved with public base and empty dev JWT for future Metro restarts (not committed).
