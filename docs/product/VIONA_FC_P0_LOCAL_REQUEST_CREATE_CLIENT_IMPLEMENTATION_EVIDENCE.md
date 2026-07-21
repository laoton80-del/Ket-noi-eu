# VIONA — FC-P0 Local Request Create Client  
## Implementation Evidence

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT`  
**Boundary SoT:** `docs/product/VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_IMPLEMENTATION_BOUNDARY_ADDENDUM.md` (PR #411 verified on master)  
**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_PR_REVIEW`

```text
VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_IMPLEMENTATION
IMPLEMENTATION_ONLY_NO_DEPLOY
REQUEST_ONLY_NO_CHARGE_PRESERVED
NO_BACKEND_SCHEMA_PAYMENT_AI_CHANGE
NO_STAGING_LIVE_REQUEST
NO_DEPLOY
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN_PRESERVED
```

---

## 1. Canonical baseline

| Field | Value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| Baseline | `origin/master` @ `1c631dc0ad85864c77c3c53f7b03793f411b72b2` (PR #411 boundary addendum) |
| Branch | `feat/viona-fc-p0-local-request-create-client` |

---

## 2. Exact changed paths (runtime + docs)

### Runtime / client

- `src/domain/local/localServiceRequestClientContract.ts` — create DTO/types, service types, source, forbidden keys
- `src/services/localUserRequestApi.ts` — `createUserLocalServiceRequest`
- `src/screens/b2c/localUserRequestCreateFlow.ts` — pure create state/DTO helpers
- `src/components/local/LocalUserRequestCreateComposer.tsx` — in-screen composer
- `src/screens/b2c/LocalUserRequestStatusScreen.tsx` — host composer; refresh/expand on success
- `src/i18n/locales/en.json` / `vi.json` — create copy
- `scripts/test-local-user-request-create-client.ts` — focused tests
- `scripts/test-local-service-request-client-contract.ts` — service type / source wire parity

### Docs

- `docs/product/VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_IMPLEMENTATION_EVIDENCE.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

---

## 3. Entry surface

Reach path unchanged:

`TabLocal` → `LocalScreen` → `local-tile-my-requests` → `LocalUserRequestStatus` → **`LocalUserRequestStatusScreen`**

Create CTA + composer hosted **inside** `LocalUserRequestStatusScreen` / `LocalUserRequestCreateComposer`.  
**No** new `Stack.Screen`. Rejected paths (Leona / VIP / merchant / VionaRequest) unused.

---

## 4. Business / provider context

- Primary: user enters `businessId` (UUID) on the form (boundary: catalog discovery out of scope).
- Secondary: chips from **businesses already present** in the user’s Local request list (`knownBusinesses`) — selection of existing list context, not a new discovery product.

Submit disabled until `businessId`, `serviceType`, and `title` are valid.

---

## 5. API adapter

`createUserLocalServiceRequest` in `localUserRequestApi.ts`:

- `POST /api/local/requests` via `restApiFetchJson`
- Session JWT only (`getRestApiJwt`); no `EXPO_PUBLIC_DEV_REST_JWT`
- No Authorization header without JWT
- No automatic POST retry
- List / timeline / cancel adapters unchanged

---

## 6. DTO

Required body:

- `businessId`, `serviceType`, `title`, `source: "LOCAL_SCREEN"` (fixed, not user-editable)

Optional (boundary-allowed): `description` when non-empty.

Forbidden keys mirrored from `DANGEROUS_LOCAL_REQUEST_CREATE_BODY_KEYS` / `LOCAL_CREATE_FORBIDDEN_BODY_KEYS`.  
Identity remains `req.authUserId` server-side.

---

## 7. Auth

Client: `getRestApiJwt` → `restApiFetchJson`.  
Unauthenticated create → `AUTH_REQUIRED_OR_EXPIRED` → navigate existing `Login`.  
No new auth mechanism.

---

## 8. UI state machine

Implemented: `IDLE`, `VALIDATION_ERROR`, `SUBMITTING`, `CREATED_SUCCESS`, `AUTH_REQUIRED_OR_EXPIRED`, `RATE_LIMITED`, `SERVER_VALIDATION_ERROR`, `NETWORK_RESULT_UNKNOWN`, `SERVER_ERROR`.

---

## 9. Duplicate-submit

- `inFlightRef` + `SUBMITTING` disables submit
- Double-tap suppressed
- No API retry
- Rate limit presented as abuse limit, not idempotency
- No idempotency key / schema / migration
- `NETWORK_RESULT_UNKNOWN` → list refresh before unlocking manual resubmit

---

## 10. Post-create refresh / expand

On HTTP **201**:

1. Preserve created response / id  
2. Mark `CREATED_SUCCESS`  
3. Refresh via `fetchUserLocalServiceRequests`  
4. Stay on `LocalUserRequestStatusScreen`  
5. `setExpandedId(createdId)` + timeline load  

Refresh failure after create → keep success + separate refresh warning; no second POST.

---

## 11. Error mapping

201 → success; 400/404 → server validation; 401 → auth; 429 → rate limited; 5xx → server error; unreachable/0 → network unknown.  
No create 403/409 mappings.

---

## 12. Focused tests

```text
npx tsx scripts/test-local-user-request-create-client.ts  → OK
npx tsx scripts/test-local-service-request-client-contract.ts → OK
npx tsx scripts/test-local-user-request-status-ui-display.ts → OK
```

Coverage includes DTO/source, forbidden keys, validation, state machine, HTTP mapping, expand helper, auth/apiClient scans, no-Prisma on create graph, list/timeline/cancel signature preservation.

---

## 13. Regression gates

| Gate | Result |
|---|---|
| `npm run ci:expo-readiness` | **PASS** |
| `npm run ci:release-discipline` | **PASS** (recorded at commit) |
| `tsc --noEmit` | **PASS** |
| Pre-existing Functions TypeScript debt | **Recorded — not fixed** |

Modern Home Phase A/B/C, SOS shell, Profile/Language — preserved (no shell edits).

---

## 14. Confirmations

- No Prisma client regression on Local create mobile graph  
- No backend route/controller/service/middleware/rate-limit changes  
- No schema / migration / payment / wallet / VIO / AI / Pack40 changes  
- No staging/production deploy; no live Local request created  
- Pilot remains `REQUEST_ONLY_NO_CHARGE`  
- Phase C closed green preserved  
- Pack40S unauthorized  
- Apple / EAS / Phase D2 deferred  

---

## 15. Next operator action

Strict read-only PR review of this implementation.  
Do **not** authorize staging deploy or live Local create QA automatically.

## 16. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_REQUEST_CREATE_CLIENT_PR_REVIEW`
