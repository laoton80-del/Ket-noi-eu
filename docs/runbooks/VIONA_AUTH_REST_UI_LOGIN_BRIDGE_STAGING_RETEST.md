# VIONA REST UI login bridge — staging retest evidence

**Pack:** `VIONA.AUTH.REST_UI_LOGIN_BRIDGE.STAGING_RETEST.1`  
**Master at test:** `f3fbc4a` — `feat(auth): bridge UI login to REST session`  
**Staging project ref:** `euqbfanilcssjiwwtcby` (`viona-staging-eu`)  
**Date:** 2026-05-22  
**Type:** Staging / manual retest evidence — **not** commercial, payment, production, or device-matrix certification.

## Verdict

| Layer | Verdict |
|-------|---------|
| **REST API parity** (login, lists, inbox, confirm/decline, isolation) | **PASS** |
| **Expo UI walkthrough** (Login → PIN → screens) | **NOT RUN** in this pack (operator required) |
| **Overall** | **PASS_WITH_LIMITATIONS** until operator completes UI matrix below |

## Environment (no secrets)

| Variable | Observed |
|----------|----------|
| `EXPO_PUBLIC_REST_API_BASE` | Set — host `127.0.0.1` (local-dev API) |
| `VIONA_PILOT_PIN` | Set (length ≥ 6; value not recorded) |
| `EXPO_PUBLIC_DEV_REST_JWT` | **Still set** in operator `.env.local` — not required for API login proof; **clear for strict UI proof of stored JWT path** |
| `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK` | `true` (optional when REST merchant login used) |
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
| Login User A (phone + PIN) | **PASS** — `POST /api/auth/login`, role `B2C` | **NOT RUN** |
| REST login path used | **PASS** (API; UI uses same `loginRestApi` when API base set) | **NOT RUN** |
| Correct app state after login | N/A | **NOT RUN** |
| Local user request/status | **PASS** — `GET /api/local/requests` | **NOT RUN** |
| Request visibility | **PASS** — list returned | **NOT RUN** |
| Logout / session clear | N/A | **NOT RUN** |
| Fresh login again | **PASS** — repeat login succeeded | **NOT RUN** |

### B. User B isolation

| Step | Result |
|------|--------|
| Login User B | **PASS** (API) |
| No shared private request ids with User A | **PASS** — overlap count 0 |
| Logout | **NOT RUN** (UI) |

### C. Merchant M

| Step | API retest | UI retest |
|------|------------|-----------|
| Login Merchant M | **PASS** — role `B2B_EU` | **NOT RUN** |
| Session hydrated from REST | **PASS** (API user payload) | **NOT RUN** |
| Local merchant inbox | **PASS** — `GET /api/local/merchant/requests` | **NOT RUN** |
| Sees Business M requests | **PASS** | **NOT RUN** |
| Fresh request R8 | **PASS** — created `GENERIC_REQUEST` / `API_DIRECT` | **NOT RUN** |
| Confirm | **PASS** — `POST …/confirm` → status `CONFIRMED` | **NOT RUN** |
| Decline R9 | **PASS** — `POST …/reject` | **NOT RUN** |
| Logout | N/A | **NOT RUN** |

### D. Merchant N isolation

| Step | Result |
|------|--------|
| Login Merchant N | **PASS** (API) |
| Inbox loads | **PASS** |
| Cannot see/act on Business M rows | **PASS** — no inbox rows with `businessId` Business M |
| Logout | **NOT RUN** (UI) |

### E. No dev JWT proof

| Step | Result |
|------|--------|
| Dev JWT required for API login | **No** — all four logins succeeded via phone + PIN only |
| Stored JWT priority (code) | **PASS** — `getRestApiJwt()` reads AsyncStorage before `EXPO_PUBLIC_DEV_REST_JWT` @ `f3fbc4a` |
| Dev JWT bridge optional | **PASS** — unlock flag dev-only; merchant inbox also opens for REST merchant role in `__DEV__` when API base set |
| Operator env still has dev JWT set | **Yes** — clear for UI-only strict proof |

## Safety verification

| Check | Result |
|-------|--------|
| Local request-only / no-charge | **PASS** — `walletMode` `REQUEST_ONLY_NO_CHARGE` on fresh R8 |
| `walletPhase` | **NONE** |
| Payment captured | **No** |
| `Transaction` count snapshot | **0** (delta this run: **0**) |
| `Wallet` row count snapshot | **0** (delta this run: **0**) |
| Forbidden payout/settlement UI wording | **NOT RUN** (UI); prior Local evidence still applies |

## Engineering validations (post-retest)

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS (0 errors; pre-existing warnings) |
| `npm run smoke` | PASS |

## Operator UI checklist (required to close UI gap)

1. `npx expo start -c` after clearing `EXPO_PUBLIC_DEV_REST_JWT` (optional: turn off walkthrough unlock).
2. **User A:** Login → 6+ PIN → Tabs → Local → My requests → logout → login again.
3. **User B:** Login → confirm list ≠ User A private rows → logout.
4. **Merchant M:** Login → B2B → Local inbox → Confirm one row (browser confirm) → Decline one row → logout.
5. **Merchant N:** Login → inbox must not show Business M requests → logout.

## Known limitations

- UI matrix not executed by automation in this pack.
- Operator `.env.local` still exports `EXPO_PUBLIC_DEV_REST_JWT` (optional fallback; not needed for API proof).
- Confirm/decline UI proof relies on operator or prior `2137ce1` evidence until UI checklist is run.
- Not production HTTPS / full EN-VI device matrix.

## Related

- `docs/runbooks/VIONA_LOCAL_STAGING_PASS_HANDOFF.md`
- `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md`
