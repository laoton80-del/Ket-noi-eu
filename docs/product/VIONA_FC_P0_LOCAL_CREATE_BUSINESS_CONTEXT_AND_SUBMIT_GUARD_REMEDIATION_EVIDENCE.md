# VIONA — FC-P0 Local Create  
## Business Context and Submit Guard Remediation Evidence

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_CREATE_BUSINESS_CONTEXT_AND_SUBMIT_GUARD_REMEDIATION`  
**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_CREATE_BUSINESS_CONTEXT_AND_SUBMIT_GUARD_REMEDIATION_PR_REVIEW`

```text
VIONA_FC_P0_LOCAL_CREATE_BUSINESS_CONTEXT_AND_SUBMIT_GUARD_REMEDIATION
SOURCE_BACKED_TOURISM_DISCOVER
RAW_UUID_CONSUMER_UX_REMOVED
SUBMIT_GUARD_BEFORE_JWT_AWAIT
EXECUTED_BEHAVIORAL_TESTS
IMPLEMENTATION_ONLY_NO_DEPLOY
REQUEST_ONLY_NO_CHARGE_PRESERVED
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
```

---

## 1. Canonical baseline

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| `origin/master` | `028187cbe6d9bd78890ca1d56f7001bf73b772f4` |
| PR #412 merge | `028187c` (squash); reviewed head `61789b1ef67cc9bb5817e21ae536cb1b4ef79b8c` |
| Branch | `feat/viona-fc-p0-local-create-business-context-submit-guard-remediation` |

---

## 2. Gate A — source inventory (decision)

| Candidate | Verdict |
|---|---|
| `GET /api/tourism/discover` → Postgres `Business.id` + `name` | **ACCEPTED** — active, public (`skipAuth`), zero-history, stable id + display name, no new backend |
| Request-history chips | Supplement only — not sole first-time source |
| Classifieds / fixer fixtures / radar mocks / B2B2C directory | **REJECTED** — mock or non-`Business.id` |
| LocalScreen nav params | **Absent** (`LocalUserRequestStatus: undefined`) |

**Architecture locked:** in-screen selector on `LocalUserRequestStatusScreen` / composer, loading options via `loadLocalCreateBusinessOptionsFromTourismDiscover`.

---

## 3. Exact changed paths

- `src/services/local/localCreateBusinessOptionModel.ts` (new)
- `src/services/local/localCreateBusinessSource.ts` (new)
- `src/components/local/LocalUserRequestCreateComposer.tsx`
- `src/screens/b2c/localUserRequestCreateFlow.ts`
- `src/i18n/locales/en.json` / `vi.json`
- `scripts/test-local-user-request-create-client.ts`
- `docs/product/VIONA_FC_P0_LOCAL_CREATE_BUSINESS_CONTEXT_AND_SUBMIT_GUARD_REMEDIATION_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

---

## 4. First-time zero-history usability

- Composer opens → loads tourism discover options (no prior requests required).
- User sees human-readable `displayName` chips (+ category label).
- Selects provider → internal `businessId` stored; UI shows “Requesting: {name}”.
- No UUID field / paste instructions.

---

## 5. Raw UUID removal

- Removed `local-create-business-id` TextInput.
- Removed EN/VI `businessIdLabel` / `businessIdPlaceholder` (“Paste business UUID”).
- Errors/success do not show database ids.

---

## 6. Business selection model

```ts
{ businessId, displayName, categoryLabel }
```

Stale/unavailable selection → validation prevents POST; localized `providerUnavailable`.

---

## 7. Submit-guard ordering

`runLocalCreateSubmit`:

1. If `inFlight.current` → return without POST.  
2. Validate.  
3. **`inFlight.current = true` synchronously before any await.**  
4. Await JWT → POST → classify.  
5. `finally` clears lock.

Executed test: two concurrent submits → **1 JWT + 1 POST**; lock observed before JWT await.

---

## 8. Auth header

- Session JWT via `getRestApiJwt` / `restApiFetchJson`.  
- No `EXPO_PUBLIC_DEV_REST_JWT`.  
- Bearer only when JWT present.  
- Missing JWT → `AUTH_REQUIRED_OR_EXPIRED` → existing `Login` (no auto-resubmit).

---

## 9. Contract / state / post-create preservation

- Still `POST /api/local/requests` with `source: LOCAL_SCREEN`.  
- Nine UI states + status mappings unchanged.  
- 201 → refresh list → stay on status screen → expand by id; refresh fail keeps success.

---

## 10. Executed behavioral tests

```text
npx tsx scripts/test-local-user-request-create-client.ts → OK
```

Covers zero-history mapping, selection, stale block, source/forbidden keys, double-submit guard, auth header rule, HTTP mappings, network unknown (no auto-retry), Prisma-free graph, EN/VI alignment.

Also: client-contract + status-ui tests → OK.

---

## 11. Regression gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | **PASS** |
| `ci:expo-readiness` | **PASS** |
| `ci:release-discipline` | **PASS** |
| create-client behavioral | **PASS** (`npx tsx scripts/test-local-user-request-create-client.ts`) |
| client-contract / status-ui | **PASS** |
| list / timeline / cancel | **PASS** |
| Functions TSC debt | Recorded — not fixed |

---

## 12. Confirmations

- No backend/schema/payment/wallet/AI/Pack40 changes  
- No deploy / no live Local request  
- `REQUEST_ONLY_NO_CHARGE` preserved  
- Phase C closed green; Pack40S unauthorized; Apple/EAS/Phase D2 deferred  

**Remaining risk:** If tourism discover returns empty (no Business rows), composer shows `providersEmpty` — ops/seed issue, not UUID UX.

---

## 13. Next operator action

Strict read-only review of this remediation PR.  
Do not authorize staging deploy or live Local create QA automatically.

## 14. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_CREATE_BUSINESS_CONTEXT_AND_SUBMIT_GUARD_REMEDIATION_PR_REVIEW`
