# VIONA REST UI login bridge — staging retest evidence

**Pack:** `VIONA.AUTH.REST_UI_LOGIN_BRIDGE.STAGING_RETEST.1` (+ `STRICT_UI_PROOF.1` / `STRICT_UI_PROOF.FOLLOWUP.1`)  
**Master at test:** `6853849` (evidence); app bridge @ `f3fbc4a`  
**Staging project ref:** `euqbfanilcssjiwwtcby` (`viona-staging-eu`)  
**Date:** 2026-05-22  
**Type:** Staging / manual retest evidence — **not** commercial, payment, production, or device-matrix certification.

## Verdict

| Layer | Verdict |
|-------|---------|
| **REST API parity** (login, lists, inbox, confirm/decline, isolation) | **PASS** |
| **Strict UI proof** (`STRICT_UI_PROOF.FOLLOWUP.1`, dev JWT cleared per operator) | **PASS** (staging / manual only) |
| **Overall** | **PASS** (staging / manual only) — not commercial, payment, or production |

## Strict UI proof — operator follow-up (`STRICT_UI_PROOF.FOLLOWUP.1`)

**Operator attestation date:** 2026-05-22  
**Expo restart:** `npx expo start -c` after clearing dev JWT (operator-confirmed)  
**Strict env (operator-confirmed):**

| Requirement | Status |
|-------------|--------|
| `EXPO_PUBLIC_REST_API_BASE` set | **PASS** — host `127.0.0.1` |
| `EXPO_PUBLIC_DEV_REST_JWT` empty/removed | **PASS** (operator-confirmed for UI session; value not logged) |
| `EXPO_PUBLIC_DEV_REST_JWT` required for walkthrough | **No** |
| `.env.local` not tracked | **PASS** |
| Stored REST login JWT used | **PASS** — UI Login → PIN → `loginRestApi`; no dev JWT in strict run |

**Note:** Automated dotenv probe immediately before this doc commit reported non-zero dev JWT length on disk; operator attestation takes precedence for the strict UI session that was executed. Ensure `.env.local` remains saved without `EXPO_PUBLIC_DEV_REST_JWT` for future Metro restarts.

### Strict UI results (operator-verified)

| Check | Result |
|-------|--------|
| User A UI login (phone + PIN → app) | **PASS** |
| User A — Local My Requests visibility | **PASS** |
| User A logout / session clear | **PASS** |
| User A fresh login again | **PASS** |
| User B UI login | **PASS** |
| User B isolation (no User A private overlap) | **PASS** |
| User B logout | **PASS** |
| Merchant M UI login (REST role/session) | **PASS** |
| Merchant M Local inbox / Business M visible | **PASS** |
| Merchant confirm UI (`window.confirm` + confirm) | **PASS** |
| Merchant decline UI (`window.confirm` + decline) | **PASS** |
| Merchant M logout | **PASS** |
| Merchant N UI login | **PASS** |
| Merchant N isolation (no Business M rows/actions) | **PASS** |
| Merchant N logout | **PASS** |
| Forbidden commercial UI wording (paid booking, guaranteed booking, payout, withdraw, escrow, settlement, cash-out) | **PASS** — not observed on Local surfaces |

## Environment (no secrets)

| Variable | Observed |
|----------|----------|
| `EXPO_PUBLIC_REST_API_BASE` | Set — host `127.0.0.1` (local-dev API) |
| `VIONA_PILOT_PIN` | Set (length ≥ 6; value not recorded) |
| `EXPO_PUBLIC_DEV_REST_JWT` | **Empty/removed** for strict UI run (operator-confirmed) |
| `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK` | Optional; strict run used REST merchant login |
| Staging DB ref in `DATABASE_URL` / `DIRECT_URL` | Present (`euqbfanilcssjiwwtcby`) |
| `.env.local` tracked | No |

## Pilot accounts (labels only)

| Role | Phone (E.164) |
|------|---------------|
| User A | `+420910000001` |
| User B | `+420910000002` |
| Merchant M | `+420920000001` |
| Merchant N | `+420920000002` |
| Business M | `257f467a-8de2-41d0-b171-5ee499ba96d2` |

## Matrix results

### A. User login path

| Step | API retest | UI retest |
|------|------------|-----------|
| Login User A (phone + PIN) | **PASS** | **PASS** |
| REST login path used | **PASS** | **PASS** |
| Correct app state after login | N/A | **PASS** |
| Local user request/status | **PASS** | **PASS** |
| Request visibility | **PASS** | **PASS** |
| Logout / session clear | N/A | **PASS** |
| Fresh login again | **PASS** | **PASS** |

### B. User B isolation

| Step | API | UI |
|------|-----|-----|
| Login User B | **PASS** | **PASS** |
| No shared private request ids with User A | **PASS** | **PASS** |
| Logout | N/A | **PASS** |

### C. Merchant M

| Step | API retest | UI retest |
|------|------------|-----------|
| Login Merchant M | **PASS** | **PASS** |
| Session hydrated from REST | **PASS** | **PASS** |
| Local merchant inbox | **PASS** | **PASS** |
| Sees Business M requests | **PASS** | **PASS** |
| Confirm (fresh or existing row) | **PASS** | **PASS** |
| Decline (fresh or existing row) | **PASS** | **PASS** |
| Logout | N/A | **PASS** |

### D. Merchant N isolation

| Step | API | UI |
|------|-----|-----|
| Login Merchant N | **PASS** | **PASS** |
| Inbox loads | **PASS** | **PASS** |
| Cannot see/act on Business M rows | **PASS** | **PASS** |
| Logout | N/A | **PASS** |

### E. No dev JWT proof

| Step | Result |
|------|--------|
| Dev JWT required for login/walkthrough | **No** |
| Stored JWT priority (code @ `f3fbc4a`) | **PASS** |
| Dev JWT bridge optional | **PASS** |

## Safety verification

| Check | Result |
|-------|--------|
| Local request-only / no-charge | **PASS** — `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | **NONE** |
| Payment captured | **No** |
| `Transaction` delta | **0** (staging lane; no wallet mutations from Local UI actions) |
| Wallet row delta | **0** |
| Forbidden payout/settlement UI wording | **PASS** (operator UI check) |

## Engineering validations

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (0 errors) |
| `npm run smoke` | PASS |

## Known limitations

- Staging / manual / local-dev API only — not production HTTPS or full device EN-VI matrix.
- Not commercial, payment, escrow, payout, settlement, or production automation readiness.
- Ops audit UI not covered.
- Ensure `.env.local` stays without `EXPO_PUBLIC_DEV_REST_JWT` on disk for reproducible strict reruns.

## Related

- `docs/runbooks/VIONA_LOCAL_STAGING_PASS_HANDOFF.md`
- `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md`
