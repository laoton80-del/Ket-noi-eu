# VIONA public HTTPS REST UI walkthrough — evidence

**Pack:** `VIONA.STAGING.PUBLIC_HTTPS_REST_UI_WALKTHROUGH.1`  
**Master at doc write:** `a4763c8`  
**Public API:** `https://viona-api-staging-eu.fly.dev`  
**Date:** 2026-05-23  
**Type:** Staging / manual UI evidence — **not** production, commercial/payment, device matrix, or SOS certification.

## Verdict

| Layer | Result |
|-------|--------|
| **Pre-checks (repo + env flags, no secret values)** | **BLOCKED** — see below |
| **Public HTTPS API smoke (paced script)** | **PASS** — exit 0 (API parity; not UI proof) |
| **REST UI walkthrough on public HTTPS** | **NOT VERIFIED** — preconditions fail on disk; agent cannot run Expo UI |

**Overall UI walkthrough:** **BLOCKED** until operator completes env + manual UI matrix below.

**Does not certify:** production launch, commercial/payment readiness, full EN-VI device matrix, merchant production onboarding, AI autonomous money actions, or SOS production reliability.

---

## Pre-checks (2026-05-23)

| Check | Result |
|-------|--------|
| `master` / `origin` | `a4763c8` |
| `.env.local` tracked | **No** (`.gitignore`) |
| `EXPO_PUBLIC_REST_API_BASE` → public HTTPS staging | **FAIL** — automated probe: not `https://viona-api-staging-eu.fly.dev` (host not logged) |
| `EXPO_PUBLIC_DEV_REST_JWT` empty/removed | **FAIL** — automated probe: non-zero length on disk (value not logged) |
| `VIONA_PILOT_PIN` present (length only) | **PASS** (≥ 6 chars) |
| Secrets printed in this pack | **No** |

**Required operator env (do not commit `.env.local`):**

```text
EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev
EXPO_PUBLIC_DEV_REST_JWT=   # empty or remove key
```

Then: `npx expo start -c`

Prior **local-dev** strict UI proof (`docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md` @ `127.0.0.1`) does **not** substitute for public HTTPS UI proof.

---

## API parity (automated — not UI)

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
| Transaction / Wallet delta | **0** (not queried; no-charge path) |

---

## UI walkthrough matrix (operator — not verified in this pack)

Mark **PASS** only after manual UI on public HTTPS base with dev JWT cleared.

### A. User A

| Step | Status |
|------|--------|
| Login via UI phone + PIN | **NOT VERIFIED** |
| REST login uses public HTTPS API | **NOT VERIFIED** |
| Local My Requests / status visible | **NOT VERIFIED** |
| Logout / session clear | **NOT VERIFIED** |
| Fresh login again | **NOT VERIFIED** |

### B. User B

| Step | Status |
|------|--------|
| Login via UI phone + PIN | **NOT VERIFIED** |
| No User A private overlap | **NOT VERIFIED** |
| Logout | **NOT VERIFIED** |

### C. Merchant M

| Step | Status |
|------|--------|
| Login + merchant REST session | **NOT VERIFIED** |
| Local merchant inbox / Business M | **NOT VERIFIED** |
| Confirm one request (UI) | **NOT VERIFIED** |
| Decline one request (UI) | **NOT VERIFIED** |
| Logout | **NOT VERIFIED** |

### D. Merchant N

| Step | Status |
|------|--------|
| Login | **NOT VERIFIED** |
| Inbox: no Business M rows/actions | **NOT VERIFIED** |
| Ownership isolation | **NOT VERIFIED** |
| Logout | **NOT VERIFIED** |

### Safety proof (UI)

| Check | Status |
|-------|--------|
| No payment captured | **NOT VERIFIED** (API smoke: no charge) |
| `REQUEST_ONLY_NO_CHARGE` | **PASS** (API smoke only) |
| `walletPhase` NONE | **PASS** (API smoke only) |
| Forbidden commercial wording not on Local surfaces | **NOT VERIFIED** |

Forbidden terms to scan: paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out.

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

1. Operator: set public HTTPS `EXPO_PUBLIC_REST_API_BASE`; clear `EXPO_PUBLIC_DEV_REST_JWT`; save `.env.local` (not committed).
2. `npx expo start -c`
3. Execute UI matrix above; update this doc with **PASS** per verified row (or open `PUBLIC_HTTPS_REST_UI_WALKTHROUGH.FOLLOWUP.1`).
4. Do not start full device matrix until public HTTPS UI proof is **PASS**.
