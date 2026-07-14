# Pack40 — Multi-Tenant VionaRequest Access Enforcement Plan

Status: **PLANNING ONLY** — docs-only architecture packet. No product code, schema/migration,
database action, deployment, staging call, or secret change is authorized by this document.

Operator context: closes the remaining tenant-isolation gap in existing **authenticated**
`VionaRequest` read, note, and status-action paths before Pack36B Merchant Admin UI or any broader
merchant-management surface is introduced.

Verified planning baseline: `origin/master` @ `587dcd195e5bf5fd66415576e2a6cbd621cc2eed` (includes
Pack39 staging evidence via PR #339 merge).

---

## 1. Executive summary

Pack34 added an **optional** `expectedTenantId` second parameter to
`buildAuthorizedVionaRequestWhere()` (`vionaRequestAccessScope.ts`). When omitted, the returned
Prisma where-clause is byte-identical to pre-Pack34 behavior. Pack34 deliberately **did not wire**
this parameter into any production call site.

A read-only source audit of merged `origin/master` confirms the handoff claim is **still accurate**:
`expectedTenantId` is **never passed** in production. All three direct call sites — read (list +
detail), note append, and status transition — scope access by authenticated user identity only
(`requesterUserId` / `ownerUserId` / participant `userRef`). They do **not** constrain
`VionaRequest.tenantId`.

This leaves a real cross-tenant isolation gap for merchant owners:

- `VionaRequest.tenantId` is a required string on every row (including Pack19 create and Pack35
  webhook create).
- Pack19 create accepts `tenantId` from the **client request body** (unauthenticated shape aside,
  the value is not validated against `MerchantProfile`).
- An authenticated user who is `ownerUserId` on requests under **multiple** `tenantId` values can
  read, note, and status-act on all of them — including rows whose `tenantId` does not match their
  own `MerchantProfile.tenantId`.
- Cross-**user** denial already works (`request_not_found`); cross-**tenant** denial for a
  merchant-context owner does **not**.

Pack40 proposes the **smallest safe increment**: resolve a trusted server-side merchant access
context once per authenticated HTTP entry, thread it through the existing request access services,
and pass the merchant's `MerchantProfile.tenantId` into `buildAuthorizedVionaRequestWhere()` as
`expectedTenantId`. Consumer paths (no `MerchantProfile` for the authenticated user) remain
byte-identical. Webhook routing, dispatch, approval/consent, escrow, status-machine, and audit
semantics are untouched.

**No Prisma schema change is required.** Existing fields (`VionaRequest.tenantId`,
`MerchantProfile.tenantId`, `MerchantProfile.ownerUserId`, `MerchantProfile.isActive`) are
structurally sufficient.

---

## 2. Verified current-state source audit

Audit performed read-only against merged `origin/master` @ `587dcd195e5bf5fd66415576e2a6cbd621cc2eed`.

### 2.1 Tenant-scope helper files (existing)

| File | Role |
|---|---|
| `src/services/viona/vionaRequestAccessScope.ts` | `buildAuthorizedVionaRequestWhere(authUserId, expectedTenantId?)` — optional tenant clause when 2nd arg is non-empty trimmed string |
| `src/lib/viona/merchant/vionaMerchantTenantScope.ts` | Pure `assertVionaRequestTenantMatchesMerchant()` — used by webhook channel resolution, **not** by request read/note/status paths |
| `src/services/viona/vionaMerchantProfileService.ts` | `findMerchantProfileByOwnerUserId()`, `findMerchantProfileByTenantId()`, CRUD |

### 2.2 `buildAuthorizedVionaRequestWhere()` — every call site

| # | File | Line context | `expectedTenantId` passed? |
|---|---|---|---|
| 1 | `src/services/viona/vionaRequestReadService.ts` | `buildListWhere()` → list query | **No** (1 arg) |
| 2 | `src/services/viona/vionaRequestReadService.ts` | `getVionaRequestById()` detail query | **No** (1 arg) |
| 3 | `src/services/viona/vionaRequestNoteActionService.ts` | `appendVionaRequestNote()` scope lookup | **No** (1 arg) |
| 4 | `src/services/viona/vionaRequestStatusActionService.ts` | `transitionVionaRequestStatus()` scope lookup | **No** (1 arg) |

**Test-only usage:** `scripts/test-viona-pack34-b2b-merchant-gateway.ts` exercises the 2nd parameter
(regression that omitting it preserves pre-Pack34 where-shape).

**No other production imports** of `buildAuthorizedVionaRequestWhere()` exist.

### 2.3 VionaRequest read, note, and status-action entry points

| Entry | Route / caller | Service | Tenant scope today |
|---|---|---|---|
| List | `GET /api/viona/requests` → `getVionaRequests()` | `listVionaRequests()` | User scope only |
| Detail | `GET /api/viona/requests/:id` → `getVionaRequestDetail()` | `getVionaRequestById()` | User scope only |
| Note | `POST /api/viona/requests/:id/actions/note` → `postVionaRequestNoteAction()` | `appendVionaRequestNote()` | User scope only |
| Status | `POST /api/viona/requests/:id/actions/status` → `postVionaRequestStatusAction()` | `transitionVionaRequestStatus()` | User scope only + owner-only actor check |
| Execution preview | `POST .../actions/execution-preview` | `previewVionaRequestExecutionGate()` → **`getVionaRequestById()`** | User scope only (inherits read gap) |
| Execution plan preview | `POST .../actions/execution-plan-preview` | `previewVionaExecutionPlanRoute()` → **`getVionaRequestById()`** | User scope only (inherits read gap) |
| Create idempotent replay | `POST /api/viona/requests` (internal) | `createVionaRequest()` → **`getVionaRequestById()`** | User scope only (inherits read gap) |

Frontend client wrappers (`vionaRequestApi.ts`, `vionaRequestControlledWriteApi.ts`) call the HTTP
API; they do not perform server-side scoping.

**Webhook path (out of scope for modification):** `POST /api/viona/webhooks/merchant-agent` uses
`createVionaRequestFromWebhookMessage()` and `dispatchVionaAutonomousRequest()` — does **not** call
`buildAuthorizedVionaRequestWhere()`.

### 2.4 Trusted tenant ID sources (server-side)

| Source | Mechanism | Trust level |
|---|---|---|
| `MerchantProfile.tenantId` for `ownerUserId === authUserId` | `findMerchantProfileByOwnerUserId(authUserId)` | **Trusted** — DB row keyed by authenticated user |
| `VionaMerchantWebhookChannel.tenantId` | Channel resolution after signature verify | **Trusted** — webhook-only; Pack40 does not modify |
| `VionaRequest.tenantId` on an row being accessed | DB column | **Trusted as stored data**, but **must not** be supplied by client as the access gate input |
| Request body `tenantId` on Pack19 create | Client-supplied | **Untrusted** — accepted at create time; not re-used as access gate |
| Query string / header / LLM output | None wired today | **Untrusted** — must never become access gate input |

### 2.5 Paths operating without trusted tenant identifier today

**All authenticated request access paths** listed in §2.3 operate without resolving
`MerchantProfile` or passing `expectedTenantId`. They rely solely on user-participation scope.

This is acceptable for **consumer** users (no `MerchantProfile`) but insufficient for **merchant**
users who will soon manage requests through admin UI surfaces.

### 2.6 Cross-tenant tests today

| Suite | Coverage |
|---|---|
| `scripts/test-viona-read-only-persistence-api.ts` | Cross-**user** detail denial (`request_not_found`) |
| `scripts/test-viona-pack34-b2b-merchant-gateway.ts` | Pure `assertVionaRequestTenantMatchesMerchant()` + where-clause shape |
| `scripts/test-viona-pack35-b2b-webhook-routing.ts` | Webhook channel cross-tenant gate |
| **None** | Cross-tenant denial on read / note / status-action HTTP-equivalent service paths |

### 2.7 Audit answers (planning questions)

1. **`expectedTenantId` wired anywhere in production?** **No.**
2. **Which call sites omit it?** All four production call sites (§2.2).
3. **Do callers possess a trusted tenant ID?** Controllers have `authUserId` only; services never
   load `MerchantProfile`.
4. **Tenant ID origins in play:** see §2.4.
5. **Trustworthy vs never-trusted:** see §2.4.
6. **Free-text client tenant ID on access paths?** **No** — but Pack19 create accepts body
   `tenantId` (create-path concern, not read-path gate input).
7. **Owner-user authorization alone sufficient?** **No** for merchant-context isolation — same
   owner can hold rows under multiple `tenantId` strings.
8. **Consumer requests without MerchantProfile?** **Must remain supported** — consumer context
   omits tenant filter.
9. **Global mandatory tenant filter break non-B2B flows?** **Yes** — universal mandatory filter
   would incorrectly narrow consumer users who legitimately own rows under arbitrary staging
   `tenantId` values. Enforcement must be **conditional by access context**.
10. **Conditional vs universal?** **Conditional** — merchant profile present ⇒ tenant filter;
    absent ⇒ existing user scope only.

---

## 3. Exact gap statement

**Gap:** Authenticated merchant owners can read, append notes to, and perform Pack25 status actions
on `VionaRequest` rows whose `tenantId` does not match their `MerchantProfile.tenantId`, whenever
they appear as requester, owner, or participant — because `buildAuthorizedVionaRequestWhere()` is
invoked with one argument only.

**Not in gap (explicitly unchanged by Pack40):**

- Webhook signature verification, rate limiting, channel resolution, dispatch, classification,
  reply formatting.
- Pack19 create accepting client `tenantId` (separate future hardening if desired).
- Admin/global ops access (future pack).
- Participant invitation semantics across tenants.

---

## 4. Threat model

| Threat | Current state | After Pack40 (merchant context) |
|---|---|---|
| Merchant A owner reads Merchant B's request (different owner) | Blocked (user scope) | Blocked (user scope) |
| Merchant A owner reads own-owned request stamped with Merchant B's `tenantId` | **Allowed** (gap) | **Blocked** (tenant filter) |
| Merchant A owner notes/status-acts on cross-tenant-owned row | **Allowed** (gap) | **Blocked** |
| Attacker probes request IDs across tenants | Returns `request_not_found` for wrong user | Same — tenant mismatch also returns `request_not_found` (non-leaking) |
| Attacker supplies `tenantId` in query/body to widen access | No effect today (ignored) | Still ignored; gate uses server-resolved profile only |
| Inactive merchant accesses tenant rows | Allowed today (user scope) | **Blocked** (`request_not_found`) |
| Consumer user without profile | Works today | Unchanged (consumer context) |
| Webhook-created merchant request accessed by wrong merchant via JWT API | Blocked if different user | Still blocked; if same merchant owner, tenant filter aligns |

---

## 5. Trusted versus untrusted tenant sources

### Trusted (may drive access gate)

- `MerchantProfile.tenantId` loaded server-side where `MerchantProfile.ownerUserId === authUserId`.
- Optional future: admin-impersonation context ( **not** in Pack40 scope).

### Never trusted (must not drive access gate)

- HTTP request body fields.
- Query string parameters (including hypothetical `?tenantId=`).
- Headers (`X-Tenant-Id`, etc.).
- LLM classification output.
- `VionaRequest.tenantId` read from a row **before** access is authorized (would leak existence).
- Client-side session/localStorage tenant selection.

---

## 6. Consumer compatibility rules

| Case | Access context | Behavior |
|---|---|---|
| Ordinary consumer — no `MerchantProfile` | `{ kind: 'consumer' }` | **Unchanged** — user-participation scope only; no `tenantId` where clause |
| Merchant owner — active profile, request `tenantId` matches | `{ kind: 'merchant', tenantId, isActive: true }` | Allowed when user scope also matches |
| Merchant owner — active profile, request `tenantId` differs | merchant context | **`request_not_found`** (non-leaking) |
| Authenticated owner, user ID matches, tenant does not | merchant context | **`request_not_found`** |
| Request has `tenantId` but no `MerchantProfile` for actor | consumer context | **Unchanged** — user scope only (typical Pack19 staging user) |
| Inactive merchant profile | `{ kind: 'merchant', isActive: false }` | **`request_not_found`** on all Pack40-gated paths (fail closed; do not expose inactive state) |
| Missing trusted merchant context on merchant-required path | N/A at HTTP layer — resolved per request | If profile lookup returns null → consumer context (not an error) |
| Webhook-created merchant request | Webhook path unchanged | JWT access by merchant owner uses merchant context + user scope |
| Legacy row before `MerchantProfile` existed | Consumer actor or merchant actor | Merchant actor with profile: tenant filter applies. Consumer actor: unchanged. Rows always have a `tenantId` string (column required); "non-tenant" means **no merchant profile association**, not null column. |

---

## 7. Recommended enforcement architecture

### A. Enforcement boundary — **layered combination (recommended)**

| Layer | Responsibility |
|---|---|
| **HTTP controller** (`VionaRequestController.ts`) | Authenticate user (existing). Call **one** `resolveVionaRequestAccessContext(authUserId)` per request. Pass result into service inputs. Never read tenant ID from client input. |
| **Access-context helper** (new, pure + small I/O) | Load `MerchantProfile` by owner. Return tagged `VionaRequestAccessContext`. |
| **Service layer** (read / note / status / execution preview services) | Require `accessContext` on inputs. Evaluate inactive merchant **before** query. Map context → `expectedTenantId` for where-builder. Unified denial mapping. |
| **Where-builder** (`vionaRequestAccessScope.ts`) | Keep existing function; optionally add thin wrapper `buildAuthorizedVionaRequestWhereFromContext(authUserId, ctx)` to avoid ambiguous optional-string omission at call sites. |

**Why not controller-only:** Internal service callers (`createVionaRequest` idempotent replay,
execution previews) also call `getVionaRequestById()` — controller-only enforcement would leave bypass
paths.

**Why not repository-only:** Repository layer cannot know merchant vs consumer mode without context;
context resolution belongs in services with explicit inputs.

### B. Tenant-context representation — **tagged context object (recommended)**

```typescript
/** Server-resolved only — never constructed from client input. */
export type VionaRequestAccessContext =
  | Readonly<{ kind: 'consumer' }>
  | Readonly<{
      kind: 'merchant';
      tenantId: string;
      merchantProfileId: string;
      isActive: boolean;
    }>;
```

Avoid bare `expectedTenantId?: string` at service boundaries — omission silently disables merchant
gate. The where-builder may still accept the string internally.

**Mapping to where-clause:**

- `consumer` → `buildAuthorizedVionaRequestWhere(authUserId)` (1 arg — byte-identical)
- `merchant` + `isActive: true` → `buildAuthorizedVionaRequestWhere(authUserId, tenantId)`
- `merchant` + `isActive: false` → fail closed **before** DB read (`request_not_found`)

### C. Consumer compatibility — see §6.

### D. Error behavior — stable, non-leaking

| Condition | Service reason | HTTP status | HTTP message (existing pattern) |
|---|---|---|---|
| Unauthorized (no JWT) | N/A | 401 | `Unauthorized` |
| Invalid input | `invalid_input` | 400 | Existing per-route message |
| User not in scope **or** tenant mismatch **or** inactive merchant **or** row missing | `request_not_found` | 404 | `Request not found` |
| Owner required but user is participant only (status action) | `request_not_found` | 404 | `Request not found` (existing Pack25 behavior) |
| Invalid transition / note content | existing reasons | existing | unchanged |

**Non-disclosure rule:** Tenant mismatch MUST NOT return a distinct error code or message that
reveals another tenant's request exists. Use the same `request_not_found` surface as cross-user
denial.

### E. Transaction behavior — **no change**

- Tenant check is a **where-clause predicate** on existing `findFirst` / `findMany` — no extra round
  trip inside `transitionVionaRequestStatus()`'s `$transaction`.
- No network calls inside the transaction.
- `vionaRequestExecutionOrchestrator.ts` — **not modified** (protected).
- Escrow hold/settle — **not modified** (protected).
- Status-action transaction shape (updateMany + audit create) — unchanged; tenant already enforced
  on the preceding `findFirst`.

### F. Audit behavior — **no new audit type (recommended default)**

Cross-tenant denial does **not** require a new audit event for the smallest safe increment:

- Denial occurs before mutation.
- Logging raw request IDs in a denial audit risks operational leakage.
- Existing HTTP 404 surface is sufficient for Pack40.

If operational security monitoring later requires denial telemetry, that is a **separate,
explicitly-authorized** increment with its own audit type allowlist and redaction tests.

---

## 8. Request-flow diagrams (text)

### 8.1 Consumer user (no MerchantProfile)

```text
Client JWT → VionaRequestController
  → resolveVionaRequestAccessContext(authUserId)
      → findMerchantProfileByOwnerUserId → null
      → { kind: 'consumer' }
  → listVionaRequests / getVionaRequestById / appendNote / transitionStatus
      → buildAuthorizedVionaRequestWhere(authUserId)   // no tenantId key
      → Prisma query
  → 200/404/... (unchanged from today)
```

### 8.2 Merchant owner (active MerchantProfile)

```text
Client JWT → VionaRequestController
  → resolveVionaRequestAccessContext(authUserId)
      → findMerchantProfileByOwnerUserId → profile
      → { kind: 'merchant', tenantId: profile.tenantId, isActive: profile.isActive }
  → if isActive === false → immediate { ok: false, reason: 'request_not_found' }
  → service call with accessContext
      → buildAuthorizedVionaRequestWhere(authUserId, profile.tenantId)
      → Prisma query adds AND tenantId = profile.tenantId
  → match → proceed (note/status/read)
  → no match → { ok: false, reason: 'request_not_found' } → HTTP 404
```

### 8.3 Cross-tenant adversarial attempt (Merchant B → Merchant A request)

```text
Merchant B owner JWT
  → accessContext { kind: 'merchant', tenantId: 'tenant-b', isActive: true }
  → getVionaRequestById(requestId belonging to tenant-a, owner may even be B on a mis-stamped row)
      → where: user-scope OR ... AND tenantId = 'tenant-b'
      → row with tenant-a → not returned
  → request_not_found (404) — no body field reveals tenant-a existence
```

---

## 9. Smallest-safe implementation recommendation

1. **No schema change. No migration.**
2. **New** `src/services/viona/vionaRequestAccessContext.ts`:
   - `VionaRequestAccessContext` type.
   - `resolveVionaRequestAccessContext(authUserId)` — single DB read (`findMerchantProfileByOwnerUserId`).
   - `expectedTenantIdForWhere(context)` — pure mapper (returns `undefined` for consumer / inactive).
   - `assertMerchantAccessContextAllowsRequestAccess(context)` — pure; returns `request_not_found` for inactive merchant.
3. **Modify** read / note / status services + DTOs to accept `accessContext: VionaRequestAccessContext`.
4. **Modify** `VionaRequestController.ts` — resolve context once per handler; pass through.
5. **Modify** execution preview services + controller handlers — same context (inherit read policy).
6. **Modify** `createVionaRequest()` idempotent-replay detail fetch — resolve context from same
   `authUserId` (internal parity).
7. **Optional thin wrapper** in `vionaRequestAccessScope.ts` — keeps second arg internal.
8. **New test suite** `scripts/test-viona-pack40-tenant-scope-enforcement.ts` — adversarial matrix
   (§12).
9. **Do not modify** webhook, dispatch, orchestrator, escrow, AIRouter, tool registry, Prisma schema.

**Public API contract:** No new request fields. Response shapes unchanged. HTTP status codes
unchanged.

---

## 10. Future implementation file allowlist

### 10.1 Required production modifications

| File | Why |
|---|---|
| `src/services/viona/vionaRequestAccessContext.ts` | **NEW** — tagged context type + resolver + inactive gate |
| `src/services/viona/vionaRequestAccessScope.ts` | Optional `...FromContext()` wrapper; keep existing export byte-identical |
| `src/services/viona/vionaRequestReadDto.ts` | Add `accessContext` to list/detail inputs |
| `src/services/viona/vionaRequestReadService.ts` | Wire context → where-builder (2 call sites) |
| `src/services/viona/vionaRequestNoteActionDto.ts` | Add `accessContext` to note input |
| `src/services/viona/vionaRequestNoteActionService.ts` | Wire context on scope lookup + pass through on nested `getVionaRequestById` |
| `src/services/viona/vionaRequestStatusActionDto.ts` | Add `accessContext` to status input |
| `src/services/viona/vionaRequestStatusActionService.ts` | Wire context on scope lookup + nested detail fetch |
| `src/controllers/VionaRequestController.ts` | Resolve context in all authenticated request handlers (list, detail, note, status, both execution previews) |
| `src/services/viona/vionaRequestExecutionGateDto.ts` | Add `accessContext` |
| `src/services/viona/vionaRequestExecutionGateService.ts` | Pass context into `getVionaRequestById` |
| `src/services/viona/vionaExecutionPlanRouteService.ts` | Pass context into `getVionaRequestById` (preview path only — no orchestrator change) |
| `src/services/viona/vionaRequestCreateService.ts` | Idempotent-replay detail fetch — resolve + pass context (internal parity) |

### 10.2 Required test modifications

| File | Why |
|---|---|
| `scripts/test-viona-pack40-tenant-scope-enforcement.ts` | **NEW** — primary adversarial suite |
| `scripts/test-viona-read-only-persistence-api.ts` | Assert consumer-context regression still passes (mechanical: pass `{ kind: 'consumer' }` or use helper default) |

### 10.3 New test files

- `scripts/test-viona-pack40-tenant-scope-enforcement.ts` (listed above)

### 10.4 Optional — separate operator authorization

| File | Why |
|---|---|
| `src/services/vionaRequestApi.ts` | Only if frontend client types must mirror new server inputs — **not required** (HTTP API unchanged; server resolves context) |
| `src/services/vionaRequestControlledWriteApi.ts` | Same — likely **no change** |
| Denial audit instrumentation | Separate pack — §7.F |

### 10.5 Explicitly forbidden files

- `src/services/viona/vionaRequestExecutionOrchestrator.ts`
- `src/services/viona/vionaRequestEscrowHoldService.ts`
- `src/services/viona/vionaExecutionPlanRouteService.ts` — **except** preview-path context pass-through listed above; **no** change to real-provider POC route, Twilio adapter wiring, or orchestrator invoke path
- `src/lib/viona/realProviderAdapter/**`
- `src/services/ai/AIRouterService.ts`
- `src/lib/viona/dispatcher/vionaIntentRouter.ts`
- `src/lib/viona/dispatcher/vionaToolRegistry.ts`
- `src/controllers/VionaWebhookMerchantAgentController.ts`
- Webhook signature / rate-limit modules
- `src/services/viona/vionaAutonomousDispatchService.ts`
- `src/lib/viona/merchant/vionaMerchantReadOnlyQueryReplyFormatter.ts`
- `prisma/schema.prisma` and `prisma/migrations/**`
- Fly / secret scripts
- Marketing modules
- Tourism/Business booking models
- SOS modules

---

## 11. Explicitly protected areas

Same list as §10.5. Implementation must not touch protected files unless a future audit proves a
direct unavoidable dependency — none identified in this planning audit.

---

## 12. Test matrix (future implementation)

| # | Test | Assertion |
|---|---|---|
| 1 | Same owner, same tenant | Read / note / status allowed |
| 2 | Same owner, different tenant (merchant context) | Denied → `request_not_found` |
| 3 | Different owner, same tenant | Denied → `request_not_found` (user scope) |
| 4 | Different owner, different tenant | Denied → `request_not_found` |
| 5 | Merchant context required path with inactive profile | Denied → `request_not_found` |
| 6 | Inactive merchant | Denied on read/note/status |
| 7 | Consumer context, no profile, ordinary request | Existing behavior preserved |
| 8 | Legacy staging tenant string, consumer actor | Still visible under user scope |
| 9 | Read path — cross-tenant request ID probe | No data returned; 404-equivalent reason |
| 10 | Note path — cross-tenant write | No audit row created |
| 11 | Status path — cross-tenant mutation | No status change |
| 12 | Tenant mismatch response shape | Same reason/message as missing request (no existence leak) |
| 13 | Existing owner-only / cross-user tests | Remain green |
| 14 | Pack31 orchestrator + escrow regressions | Green — protected files untouched |
| 15 | Pack35–Pack39 webhook/dispatcher regressions | Green — webhook path untouched |
| 16 | Typecheck + lint | 0 errors |
| 17 | Full local `scripts/test-viona-pack*.ts` regression | All pass (Pack36A live QA excluded) |
| 18 | Contract scan: `buildAuthorizedVionaRequestWhere` 1-arg call sites | Zero remaining in gated services after implementation |

Tests use **behavioral assertions** (service-level with test DB) and **structural scans** — not
permanent git diff vs `origin/master`.

---

## 13. Staging adversarial QA design (do not execute in planning)

Separate phase after implementation merge. Requires its own authorization phrases (§15).

### 13.1 Synthetic tenants

| Actor | Tenant ID | Notes |
|---|---|---|
| Merchant A | `pack40-qa-tenant-a` | Active `MerchantProfile` + owner User A |
| Merchant B | `pack40-qa-tenant-b` | Active `MerchantProfile` + owner User B |

Provision via idempotent script (similar to `provision-staging-webhook-test-channel.ts`) — **not**
part of implementation phrase.

### 13.2 Adversarial checks (JWT-authenticated API)

1. Seed one `VionaRequest` owned by User A with `tenantId=pack40-qa-tenant-a` (staging-safe create path).
2. User A can `GET /api/viona/requests/:id` — **200**.
3. User B `GET` same id — **404** `Request not found`.
4. User B `POST .../actions/note` — **404**, no new audit row.
5. User B `POST .../actions/status` — **404**, no status change.
6. Failure bodies do not reveal title/summary/tenant of User A's row.
7. Consumer test user (no profile) with own staging request — behavior unchanged.
8. No webhook dispatch, real provider, payment, escrow, SMS, or write-capable merchant tool invoked.

### 13.3 Authorization phrases (staging)

- `APPROVE_PACK40_STAGING_TENANT_QA_PROVISIONING`
- `APPROVE_PACK40_STAGING_TENANT_ADVERSARIAL_QA`

Staging QA phrase does **not** authorize remediation on failure.

---

## 14. Stop-on-error rules (implementation phase)

Stop and report blocked-safe if:

- Any protected file (§10.5) appears in the diff.
- Prisma schema or migration is introduced without proven structural insufficiency.
- Client-supplied `tenantId` is used as access gate input.
- Tenant mismatch returns a distinct error code/message from `request_not_found`.
- Webhook or dispatch files change.
- Consumer-context regression fails.
- Cross-tenant adversarial test fails.
- Full local regression fails.

No automatic remediation within the implementation task.

---

## 15. Rollback strategy

- Implementation is additive context plumbing + where-clause wiring — no migration.
- Rollback = revert merge commit; behavior returns to user-scope-only access.
- Staging rollback = redeploy prior Fly image (standard project rollback).
- No data backfill required.

---

## 16. Authorization phrases

| Phase | Phrase |
|---|---|
| Implementation (code + local tests only) | `APPROVE_PACK40_TENANT_SCOPE_ENFORCEMENT_IMPLEMENTATION` |
| Staging tenant provisioning | `APPROVE_PACK40_STAGING_TENANT_QA_PROVISIONING` |
| Staging adversarial QA | `APPROVE_PACK40_STAGING_TENANT_ADVERSARIAL_QA` |

The implementation phrase does **not** authorize provisioning, deployment, migration, staging QA, or
production action.

---

## 17. Deferred / non-goals

- Pack36B Merchant Admin UI implementation.
- Pack19 create-path validation tying body `tenantId` to `MerchantProfile`.
- Admin/global cross-tenant ops console.
- New audit type for denial events.
- `AIRouterService.ts` test circuit breaker (Pack39 Layer 3).
- Pack37 Option B real schedule/inventory data layer.
- TourismBooking shadow-DB migration fix.
- Multi-profile-per-owner (schema today: `ownerUserId @unique` on `MerchantProfile`).
- Automatic Pack40 implementation from this planning PR.

---

## 18. Definition of done

**Planning (this packet):**

- [x] Source audit verified against merged master.
- [x] Gap, threat model, architecture, allowlist, tests, staging QA design documented.
- [x] Kernel + handoff updated (planning row only).
- [x] Docs-only PR opened — **not merged**.

**Implementation (future, separately authorized):**

- [ ] All §10.1 files wired; §10.5 files untouched.
- [ ] §12 test matrix green + full local regression.
- [ ] Consumer paths byte-identical behavior verified.
- [ ] Cross-tenant adversarial tests pass.
- [ ] Typecheck/lint clean.
- [ ] Optional staging QA (`§13`) executed under its own phrases.

---

## Appendix — Planning task verification record

| Check | Result |
|---|---|
| PR #339 merged | **Yes** @ `587dcd195e5bf5fd66415576e2a6cbd621cc2eed` |
| Duplicate Pack40 doc | **None** |
| Overlapping open implementation PR | **None** |
| Historical 3-call-site claim | **Confirmed accurate** (4 call sites counting list+detail separately; all omit 2nd arg) |
| No-schema design feasible | **Yes** |
| Product code required for planning | **No** |
