# VIONA FC-P0 — Local create failure-code envelope + Pack B recovery discrimination

**Classification target:** `READY_FOR_VIONA_FC_P0_LOCAL_CREATE_FAILURE_CODE_ENVELOPE_AND_PACK_B_RECOVERY_DISCRIMINATION_PR_REVIEW`

**Authorization:** `APPROVE_VIONA_FC_P0_LOCAL_CREATE_FAILURE_CODE_ENVELOPE_AND_PACK_B_RECOVERY_DISCRIMINATION`

**Canonical baseline:** `5ef5a1d58539648311548db2c9f6017440f088f4` (Pack B PR #422 squash on master)

**Branch:** `fix/viona-fc-p0-local-create-failure-code-envelope-pack-b-recovery`

**HEAD:** `4b9dea620d34a4e280708313a48dd264b5a86c3f`

**PR:** https://github.com/laoton80-del/Ket-noi-eu/pull/423

---

## 1. Original blockers

1. `BLOCKED_LOCAL_PROVIDER_CREATE_CONTRACT_REGRESSION` — Pack B collapsed all HTTP 400/404 into `SERVER_VALIDATION_ERROR` and refreshed providers for every such UI state.
2. `BLOCKED_LOCAL_PROVIDER_PACK_B_COMPATIBILITY_ERROR_DISCRIMINATOR_UNAVAILABLE` — fail envelope was `{ success: false, error: string }` only (no stable machine `code`).

---

## 2. Old vs new failure envelope

**Old (Local create):**

```json
{ "success": false, "error": "<human string>" }
```

**New (Local create failures only):**

```json
{ "success": false, "code": "<LocalCreateFailureCode>", "error": "<safe human string>" }
```

Legacy `jsonFail(res, error, status)` without `code` remains byte-compatible: `{ success: false, error }`.

---

## 3. Public code taxonomy

| Public code | HTTP | Recovery |
|---|---|---|
| `provider_not_available` | 404 | `REFRESH_PROVIDER_AUTHORITY_ONCE` |
| `service_type_not_supported` | 400 | `REFRESH_PROVIDER_AUTHORITY_ONCE` |
| `invalid_input` | 400 | `NONE` |
| `self_request_forbidden` | 400 | `NONE` |
| `service_business_mismatch` | 400 | `NONE` |
| `service_not_found` | 404 | `NONE` |

Source: `src/domain/local/localCreateFailureCodes.ts`

---

## 4. Internal → public privacy mapping

| Domain / controller | Public code | Notes |
|---|---|---|
| `provider_not_available` | `provider_not_available` | Generic 404; no suspend/retire leak |
| `business_not_found` | `provider_not_available` | Collapsed — no existence leak |
| `service_type_not_supported` | `service_type_not_supported` | Compatibility discriminator |
| `invalid_input` + field validation | `invalid_input` | Title/source/body |
| `self_request_forbidden` | `self_request_forbidden` | |
| `service_business_mismatch` | `service_business_mismatch` | Not refreshable |
| `service_not_found` | `service_not_found` | Distinct 404; **not** provider refresh |

401 Unauthorized remains `{ success: false, error: "Unauthorized" }` **without** code.

---

## 5. Client contract

- `ApiRequestResult` failure may include optional `code?: string`.
- `parseRestApiJsonEnvelope` preserves string codes; drops non-string codes.
- Local create maps via `mapCreateApiResultToSubmitOutcome` + allowlist `isLocalCreateFailureCode`.
- Unknown / missing / malformed code → `validation_error` + recovery `NONE` (fail closed).

---

## 6. UI state vs recovery separation

Nine create UI states unchanged.

| Mapping | Function |
|---|---|
| outcome → UI | `mapSubmitOutcomeToUiState` |
| outcome → recovery | `classifyLocalCreateRecovery` |

Composer refreshes **only** when `recoveryAction === 'REFRESH_PROVIDER_AUTHORITY_ONCE'` — never from `SERVER_VALIDATION_ERROR` alone.

---

## 7. Behavioral proofs (synthetic counters)

| Case | POST | Auto GET | POST retry | Provider |
|---|---|---|---|---|
| C1 `provider_not_available` | 1 | 1 | 0 | cleared |
| C2 `service_type_not_supported` | 1 | 1 | 0 | cleared |
| C3–C9 unrelated / unknown / missing | 1 | 0 | 0 | preserved |
| C6 `service_not_found` | 1 | 0 | 0 | preserved |
| C10 bare / non-provider 404 | 1 | 0 | 0 | preserved |
| C11 refresh GET fails | 1 | 1 (no recurse) | 0 | cleared |
| C12 remount | — | still 1 | 0 | — |
| C13 explicit retry | 1 | 1 auto + 1 explicit | 0 | — |
| C15–C18 401/429/network/5xx | 1 | 0 | 0 | per prior rules |
| C19 pre-await | 1 JWT, 1 POST | — | — | — |
| C20 success | 1 | 0 | 0 | preserved |

B11/B12 remediated to require exact status+code + `REFRESH_PROVIDER_AUTHORITY_ONCE`; negative `invalid_input` and bare 404 → `NONE`.

---

## 8. Changed paths

| Path | Purpose |
|---|---|
| `src/domain/local/localCreateFailureCodes.ts` | Public taxonomy + domain→public map |
| `src/utils/apiEnvelope.ts` | Optional `code` on `jsonFail`; `jsonLocalCreateFail` |
| `src/utils/restApiJsonEnvelope.ts` | RN-free envelope parse (preserves `code`) |
| `src/services/apiClient.ts` | Optional failure `code`; uses shared parse |
| `src/controllers/LocalRequestController.ts` | Create path emits coded envelope |
| `src/screens/b2c/localUserRequestCreateFlow.ts` | Structured outcome + recovery classifier |
| `src/components/local/LocalUserRequestCreateComposer.tsx` | Recovery from `recoveryAction` only |
| `scripts/test-local-create-failure-code-envelope.ts` | Envelope E1–E6 |
| `scripts/test-local-create-pack-b-recovery-discrimination.ts` | C1–C20 |
| `scripts/test-local-provider-eligibility-client-wiring.ts` | B11/B12 remediation |
| `scripts/test-local-provider-eligibility-schema-domain.ts` | A1 HTTP map gates updated |
| `package.json` | New test scripts |
| Evidence + Kernel + Handoff | This pack |

**Not changed:** Prisma schema, migrations, Pack A2 routes/DTO, provider registration/activation, payment/wallet, deploy.

---

## 9. Validation matrix (executed)

| Command | Exit | Notes |
|---|---|---|
| `npx tsx scripts/test-local-create-failure-code-envelope.ts` | 0 | E1–E6 |
| `npx tsx scripts/test-local-create-pack-b-recovery-discrimination.ts` | 0 | C1–C20 |
| `npx tsx scripts/test-local-provider-eligibility-client-wiring.ts` | 0 | B1–B17 |
| `npx tsx scripts/test-local-user-request-create-client.ts` | 0 | |
| `npx tsx scripts/test-local-provider-eligibility-schema-domain.ts` | 0 | A1 1–29 |
| `npx tsx scripts/test-local-provider-eligibility-read-ops-control.ts` | 0 | A2 30–43; optional DB skipped |
| Local list / timeline / cancel / status / contracts / SoT | 0 | SoT create skipped: `OPTIONAL_DB_INTEGRATION_SKIPPED_EXPECTED_NO_MIGRATION_APPLY` |
| `npx tsx scripts/test-api-client-no-public-dev-jwt.ts` | 0 | |
| `npx tsx scripts/check-mobile-no-prisma-client.ts` | 0 | |
| `npm run functions:verify-bundle` | 0 | |
| Profile/Language phase-2 | 0 | |
| Modern Home Phase C | 0 | |
| `npx tsc --noEmit` | 0 | |
| `npm run ci:expo-readiness` | 0 | |
| `npm run ci:release-discipline` | 0 | |
| `npm run smoke` | 0 | |

---

## 10. Confirmations

1. No schema / migration file change  
2. No migration apply  
3. No provider registration / activation  
4. No deploy / live QA / live request  
5. No payment / charge — `REQUEST_ONLY_NO_CHARGE`  
6. FC-P0 remains blocked pending later execution gates (migrate-apply + deploy + live QA)  
7. Phase C closed green  
8. Pack40S unauthorized  
9. Apple / EAS / Phase D2 deferred  

---

## 11. Exactly one next operator action

**Strict-review this remediation PR only.** Do **not** auto-authorize migration apply, provider activation, deployment, or live QA.
