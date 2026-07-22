# VIONA FC-P0 — Pack B Local Provider Eligibility Authority Client Wiring

**Classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_CLIENT_WIRING_PR_REVIEW`

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_CLIENT_WIRING`

**Mode:** `CLIENT_IMPLEMENTATION_ONLY_NO_DEPLOY_NO_MIGRATION_APPLY_NO_PROVIDER_ACTIVATION`

---

## 1. Canonical baseline

| Item | Value |
|---|---|
| Workspace | `C:\KNG\ket-noi-eu` |
| Baseline | `0dab3f40053f1601beabe77ced9a6da990f9b954` (PR #421 on master) |
| Branch | `feat/viona-fc-p0-local-provider-eligibility-client-wiring` |
| Implementation HEAD | `0e873a2f91826ca53261dd6260e6ca469957537a` |
| PR | https://github.com/laoton80-del/Ket-noi-eu/pull/422 |

Preserved lineage: Pack A1 (#419), Pack A2 (#420), A2 deterministic remediation (#421).

---

## 2. Changed paths

| Path | Purpose |
|---|---|
| `src/services/local/localProviderListClientTypes.ts` | Public DTO map/validate + query path builder |
| `src/services/local/localProviderListClient.ts` | Authenticated `listLocalProviders` adapter |
| `src/services/local/localCreateBusinessOptionModel.ts` | Pack B provider states + option types |
| `src/services/local/localCreateBusinessSource.ts` | GET-backed loader + stale-response gate |
| `src/screens/b2c/localUserRequestCreateFlow.ts` | Null serviceType; selection compatibility |
| `src/components/local/LocalUserRequestCreateComposer.tsx` | Service-type-first UX, stale gen, submit/recovery |
| `src/i18n/locales/en.json` / `vi.json` | Pack B copy |
| `scripts/test-local-provider-eligibility-client-wiring.ts` | B1–B17 |
| `scripts/test-local-user-request-create-client.ts` | Updated for Pack B |
| `scripts/test-local-provider-eligibility-read-ops-control.ts` | Lift Pack B freeze gate |
| `package.json` | `test:local-provider-eligibility-client-wiring` |
| Evidence / Kernel / Handoff | This pack |

**Not changed:** Prisma schema, migrations, Pack A2 ops/server authority, deploy config.

---

## 3. Ownership / flow

Canonical entry unchanged:

`TabLocal` → `LocalScreen` → `LocalUserRequestStatus` → `LocalUserRequestCreateComposer`

No new Stack screen. `knownBusinesses` retained but unused as authority.

---

## 4. Client contract

- `GET /api/local/providers?serviceType=<WIRE>&limit=100&skip=0`
- Auth: `getRestApiJwt` before GET; `restApiFetchJson`; no DEV JWT; no unauthenticated fallback
- DTO retained: `businessId`, `displayName`, `supportedServiceTypes` only
- Malformed envelope → `PROVIDER_SERVER_ERROR`; no partial unsafe data

---

## 5. Provider state machine

`PROVIDER_IDLE` → `LOADING` → `READY` | `EMPTY` | `AUTH_REQUIRED_OR_EXPIRED` | `NETWORK_ERROR` | `SERVER_ERROR`

Distinct from the nine create UI states (preserved).

---

## 6. Stale protection / selection

- Monotonic `providerGenerationRef` + `shouldApplyProviderListResult`
- Service-type change clears selection/options and reloads
- Submit requires `PROVIDER_READY` + compatible selection + valid title
- Pre-await in-flight lock preserved

---

## 7. Create integration

- `POST /api/local/requests` body unchanged authority (`LOCAL_SCREEN`, no forbidden keys)
- 404/400 → clear selection, preserve form fields, **one** bounded GET refresh, no auto POST retry
- Post-create: keep success; list refresh failure → warning only

---

## 8. Test results

| Command | Exit |
|---|---|
| `npx tsx scripts/test-local-provider-eligibility-client-wiring.ts` | 0 (B1–B17) |
| `npx tsx scripts/test-local-user-request-create-client.ts` | 0 |
| Pack A1 1–29 | 0 |
| Pack A2 30–43 (deterministic) | 0; optional DB skipped |
| Local list/timeline/cancel/status/contracts | 0 |
| `npx tsc --noEmit` | 0 |
| `ci:expo-readiness` / `ci:release-discipline` / smoke | 0 |
| JWT / no-Prisma / Functions | 0 |
| Profile/Language / Modern Home C | 0 |

Optional skip: `OPTIONAL_DB_INTEGRATION_SKIPPED_EXPECTED_NO_MIGRATION_APPLY` (A2 only).

---

## 9. Confirmations

1. No server authority / schema / migration change  
2. No migration apply  
3. No provider registration/activation  
4. No deploy / live QA / live request  
5. No payment/charge — `REQUEST_ONLY_NO_CHARGE`  
6. FC-P0 still blocked pending execution gates (migration apply + deploy + live QA)  
7. Phase C closed green; Pack40S unauthorized; Apple/EAS/Phase D2 deferred  

---

## 10. Exactly one next operator action

**Strict-review this Pack B PR only.** Do **not** auto-authorize migration apply, deploy, provider activation, or live QA.
