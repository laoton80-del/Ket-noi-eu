# Pack40 — Multi-Tenant VionaRequest Access Enforcement Plan

Status: **PLANNING ONLY (refined)** — docs-only architecture packet. No product code, schema/migration,
database action, deployment, staging call, or secret change is authorized by this document.

**Planning history:** initial packet merged via PR #340 @ `95031be8f5cf53e68f46548ca382ad9656cbe8b7`.
This revision resolves **dual-role account compatibility** and replaces the single broad implementation
increment with **separately authorized Pack40A–D slices**.

Operator context: closes the remaining tenant-isolation gap in existing **authenticated**
`VionaRequest` read, note, and status-action paths before Pack36B Merchant Admin UI or any broader
merchant-management surface is introduced.

Verified planning baseline: `origin/master` @ `95031be8f5cf53e68f46548ca382ad9656cbe8b7`.

---

## 1. Executive summary

Pack34 added an **optional** `expectedTenantId` second parameter to
`buildAuthorizedVionaRequestWhere()` (`vionaRequestAccessScope.ts`). When omitted, the returned
Prisma where-clause is byte-identical to pre-Pack34 behavior. Pack34 deliberately **did not wire**
this parameter into any production call site.

**Source audit (accepted):** `expectedTenantId` is **never passed** in production. All four direct
call sites — read list, read detail, note append, status transition — scope access by authenticated
user identity only. Cross-**user** denial works; cross-**tenant** merchant denial does **not** when
the actor is owner/requester/participant on a row stamped with another merchant's registered
`tenantId`.

**Initial planning gap (corrected in this revision):** the first plan draft recommended applying
`buildAuthorizedVionaRequestWhere(authUserId, merchantTenantId)` whenever the authenticated user
has a `MerchantProfile`. That rule is **unsafe** — it would hide valid personal consumer requests
for dual-role accounts.

**Revised approach:**

1. Resolve a **server-owned principal context** once per authenticated HTTP entry (`authUserId` +
   optional trusted `MerchantProfile` facts). Never branch on client-supplied tenant values.
2. Apply **row-classification tenant policy** — not a blanket merchant filter on every route:
   - **Consumer-classified requests** (logical non-tenant / personal): existing user authorization
     only.
   - **Merchant-classified requests** (registered merchant `tenantId` on the row): user
     authorization **plus** trusted merchant tenant equality; active merchant required only where
     route policy says so.
3. Implement in **merge-gated increments Pack40A → B → C**, with **Pack40D** (indirect paths) and
   **Pack40S** (staging QA) separately authorized.

**No Prisma schema change is required** for Pack40A–C. Existing fields are structurally sufficient
when consumer-classified rows are identified without SQL `NULL` (see §6.1).

---

## 2. Verified current-state source audit

Audit performed read-only against merged `origin/master` @ `95031be8f5cf53e68f46548ca382ad9656cbe8b7`.

### 2.1 Tenant-scope helper files (existing)

| File | Role |
|---|---|
| `src/services/viona/vionaRequestAccessScope.ts` | `buildAuthorizedVionaRequestWhere(authUserId, expectedTenantId?)` |
| `src/lib/viona/merchant/vionaMerchantTenantScope.ts` | Pure `assertVionaRequestTenantMatchesMerchant()` — webhook channel resolution only |
| `src/services/viona/vionaMerchantProfileService.ts` | `findMerchantProfileByOwnerUserId()`, etc. |

### 2.2 `buildAuthorizedVionaRequestWhere()` — every production call site

| # | File | Usage | `expectedTenantId` passed? |
|---|---|---|---|
| 1 | `vionaRequestReadService.ts` | List | **No** |
| 2 | `vionaRequestReadService.ts` | Detail | **No** |
| 3 | `vionaRequestNoteActionService.ts` | Note scope lookup | **No** |
| 4 | `vionaRequestStatusActionService.ts` | Status scope lookup | **No** |

### 2.3 Entry points and indirect `getVionaRequestById()` callers

| Entry | Service | Pack40 slice |
|---|---|---|
| `GET /api/viona/requests` | `listVionaRequests()` | **Pack40A** |
| `GET /api/viona/requests/:id` | `getVionaRequestById()` | **Pack40A** |
| `POST .../actions/note` | `appendVionaRequestNote()` | **Pack40B** (after A) |
| `POST .../actions/status` | `transitionVionaRequestStatus()` | **Pack40C** (after A) |
| `POST .../actions/execution-preview` | `previewVionaRequestExecutionGate()` → `getVionaRequestById()` | **Pack40D** (separate review) |
| `POST .../actions/execution-plan-preview` | `previewVionaExecutionPlanRoute()` → `getVionaRequestById()` | **Pack40D** |
| `POST /api/viona/requests` idempotent replay | `createVionaRequest()` → `getVionaRequestById()` | **Pack40D** |

Webhook path unchanged — does not use `buildAuthorizedVionaRequestWhere()`.

### 2.4 Trusted vs untrusted tenant sources

**Trusted:** `MerchantProfile.tenantId` via `findMerchantProfileByOwnerUserId(authUserId)`; webhook
channel tenant (unchanged).

**Never trusted:** request body, query string, headers, route params, LLM output, client session
tenant picker, or `VionaRequest.tenantId` supplied before access is authorized.

---

## 3. Exact gap statement

Authenticated users can read, note, and status-act on `VionaRequest` rows whose `tenantId` equals a
**registered merchant tenant** belonging to another merchant, whenever user-participation scope
matches — because no query-layer tenant policy runs today.

**Not in gap:** webhook/dispatch paths; admin/global ops (future pack).

---

## 4. Architectural review A — dual-role accounts

### 4.1 Explicitly rejected unsafe rule

The following rule **must not** be implemented:

```text
If an authenticated user has any MerchantProfile,
always apply an exact tenantId filter to all generic VionaRequest routes.
```

That would block or hide valid consumer/personal requests for merchant-account holders.

### 4.2 Schema reality vs logical invariant

| Layer | Fact |
|---|---|
| **Prisma today** | `VionaRequest.tenantId` is required `String` (non-null). Pack19 create requires non-empty trimmed text. |
| **Logical invariant (target)** | Consumer/personal requests may be modeled as `tenantId = null` in policy prose. |
| **Pack40 implementation equivalent (no DDL)** | **Consumer-classified row:** `tenantId` is **not** equal to any `MerchantProfile.tenantId` currently registered in the database. **Merchant-classified row:** `tenantId` equals some registered `MerchantProfile.tenantId`. |

This preserves dual-role behavior without a nullable-column migration. A future nullable `tenantId`
column would align storage with the logical invariant but is **not** required for Pack40A–C.

### 4.3 Durable tenant-access invariant

For every Pack40-gated path, after existing user authorization (`requester` / `owner` / `participant`):

1. **Consumer-classified request** (logical `tenantId = null`, or schema equivalent above):
   - Preserve existing owner/requester/participant authorization.
   - Do **not** require `MerchantProfile` tenant equality merely because the account also has a
     `MerchantProfile`.

2. **Merchant-classified request** (non-null `tenantId` registered to a `MerchantProfile`):
   - Preserve existing owner/requester/participant authorization.
   - Additionally require a **trusted server-resolved** `MerchantProfile` for the actor.
   - Require exact equality: `MerchantProfile.tenantId === VionaRequest.tenantId`.
   - Require `MerchantProfile.isActive === true` **only** when accessing the actor's **own**
     merchant-tenant rows (read/note/status merchant operations). Inactive merchants retain access
     to consumer-classified personal rows under user scope.

3. **Cross-merchant row** (`tenantId` registered to merchant B, actor is merchant A or dual-role
   owner): **deny** → `request_not_found` (non-leaking), even when user-scope would otherwise
   match.

4. **MerchantProfile existence alone** must **not** convert all of the user's requests into
   merchant-only requests.

5. **Client-supplied tenant values** must never determine trusted scope.

6. **Cross-tenant mismatch** and **inaccessible request** remain externally indistinguishable
   (`request_not_found` / HTTP 404).

### 4.4 Principal context representation (replaces insufficient tagged union)

The initial `{ kind: 'consumer' } | { kind: 'merchant' }` union is **insufficient** for dual-role
accounts on the same generic API surface — it forces a single mode per request.

**Recommended server-owned type (planning name only — not implemented here):**

```typescript
type VionaRequestPrincipalContext = Readonly<{
  authUserId: string;
  merchant:
    | null
    | Readonly<{
        merchantProfileId: string;
        tenantId: string;
        isActive: boolean;
      }>;
  /** Loaded once per HTTP request; server-resolved only. */
  registeredMerchantTenantIds: readonly string[];
}>;
```

- `merchant: null` → actor has no profile; policy reduces to today's user scope only.
- `merchant` present → dual-role capable; **row classification** decides whether merchant equality
  applies on each row.
- `registeredMerchantTenantIds` → read-only set of all `MerchantProfile.tenantId` values (used for
  consumer vs merchant row classification in list/detail policy). Loaded server-side; never from
  client.

### 4.5 Query policy — not blanket `expectedTenantId`

**Do not** always pass `buildAuthorizedVionaRequestWhere(authUserId, merchantTenantId)` for
merchant-profile owners.

**Recommended additive policy helper** (new, narrow — Pack40A):

`buildAuthorizedVionaRequestWhereForPrincipal(principal)` returns a `Prisma.VionaRequestWhereInput`
that composes:

1. Existing user-participation `OR` clause (unchanged semantics from
   `buildAuthorizedVionaRequestWhere(authUserId)`).
2. **Plus** tenant policy when `principal.merchant != null`:

```text
AND NOT (
  tenantId IN registeredMerchantTenantIds
  AND tenantId != principal.merchant.tenantId
)
```

**Interpretation:**

| Row class | `tenantId` vs registry | Dual-role actor with merchant M | Result |
|---|---|---|---|
| Consumer-classified | Not in `registeredMerchantTenantIds` | any | Allowed under user scope |
| Own merchant | Equals `M.tenantId` | active M | Allowed |
| Own merchant | Equals `M.tenantId` | inactive M | **Denied** (merchant row requires active) |
| Cross-merchant | In registry, ≠ `M.tenantId` | any | **Denied** (non-leaking) |
| No profile actor | any | `merchant: null` | User scope only (unchanged) |

**Detail path:** same classification evaluated on the fetched row (or equivalent single-row where).

**Post-fetch helper (pure):** `evaluateVionaRequestTenantAccessForPrincipal(principal, requestTenantId)`
implements the row-level decision for note/status scope lookups in Pack40B/C.

Keep existing `buildAuthorizedVionaRequestWhere()` export byte-identical for callers not yet migrated.

### 4.6 Dual-role compatibility matrix

| Case | Expected |
|---|---|
| User, no `MerchantProfile`, own consumer-classified request | Allowed (unchanged) |
| User, active `MerchantProfile`, own consumer-classified request | Allowed — **must not** require tenant equality |
| Same user, own merchant-classified request (`tenantId === profile.tenantId`) | Allowed |
| Same user, merchant-classified request for another merchant's registered `tenantId` | Denied |
| Inactive merchant, consumer-classified personal request | Allowed under user scope |
| Inactive merchant, own merchant-classified request | Denied |
| List for dual-role user | May include **both** consumer-classified and matching merchant rows |
| Client `?tenantId=` probe | Ignored for access gate |

---

## 5. Threat model

| Threat | Today | After Pack40A–C |
|---|---|---|
| Merchant A reads Merchant B's registered-tenant row (different owner) | Blocked by user scope | Blocked |
| Merchant A reads own-owned row stamped with Merchant B's registered `tenantId` | **Allowed** | **Blocked** |
| Dual-role user loses personal consumer-classified rows | N/A | **Must remain visible** |
| Cross-tenant probe | `request_not_found` | Same surface |

---

## 6. Recommended enforcement architecture

### A. Enforcement boundary — layered combination

| Layer | Responsibility |
|---|---|
| **Controller** | Authenticate; `resolveVionaRequestPrincipalContext(authUserId)` once; pass to services; never read client tenant |
| **Principal + policy helpers** (new) | Resolve profile; load registered tenant IDs; build where-clause / row evaluator |
| **Service layer** | Apply principal-aware policy per slice (read / note / status) |
| **Existing where-builder** | Preserved; extended additively |

### B–F. Error, transaction, audit

- **Errors:** tenant denial → `request_not_found` / HTTP 404 (same as cross-user).
- **Transactions:** tenant check remains in pre-transaction lookups; no widening of status `$transaction`.
- **Audit:** no new audit type in Pack40A–C default scope.

---

## 7. Request-flow diagrams (dual-role)

### 7.1 Dual-role merchant owner — list

```text
JWT → resolveVionaRequestPrincipalContext
  → { authUserId, merchant: { tenantId: M, isActive: true }, registeredMerchantTenantIds: [...] }
→ listVionaRequests({ principal })
  → WHERE userScope
     AND NOT (tenantId IN registered AND tenantId != M)
  → returns: personal consumer-classified rows + merchant-M rows
  → excludes: rows stamped with other merchants' registered tenantIds
```

### 7.2 Cross-merchant adversarial read

```text
Merchant B owner → principal.merchant.tenantId = B
→ GET request row with tenantId = A (registered to merchant A), B is owner (mis-stamped)
→ row is merchant-classified (in registry) and tenantId != B
→ request_not_found (404)
```

---

## 8. Implementation slicing (Pack40A–D + Pack40S)

**No single broad Pack40 implementation increment.** Each slice requires its own operator phrase,
passes its own tests, merges, and is verified before the next slice may begin. **No automatic
continuation.**

### Pack40A — Principal context and read enforcement

**Authorization:** `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT`

**Scope:**

- Trusted server-side `VionaRequestPrincipalContext` + resolver
- Registered-merchant-tenant ID loader (read-only)
- Additive access policy helper(s) in `vionaRequestAccessScope.ts` (or sibling file)
- **List and detail read paths only**
- Dual-role preservation; cross-tenant read denial; non-disclosure

**Must not modify:** note, status-action, execution preview, create replay, dispatcher, escrow,
webhook, Prisma, Fly, staging.

**Maximum behavioral change:** read list/detail only; dual-role list composition; cross-registered-tenant
read denial.

#### Pack40A — file allowlist

| Category | Files |
|---|---|
| **New production** | `src/services/viona/vionaRequestPrincipalContext.ts` |
| **Modified production (max 4)** | `src/services/viona/vionaRequestAccessScope.ts` (additive policy helper); `src/services/viona/vionaRequestReadDto.ts`; `src/services/viona/vionaRequestReadService.ts`; `src/controllers/VionaRequestController.ts` (**list + detail handlers only**) |
| **New tests** | `scripts/test-viona-pack40a-tenant-read-enforcement.ts` |
| **Mechanical test updates** | `scripts/test-viona-read-only-persistence-api.ts` (pass principal / consumer regression) |
| **Optional (separate auth)** | `vionaMerchantProfileService.ts` — only if tenant-ID loader must live there instead of principal module |
| **Forbidden** | Note/status services, execution services, create service, orchestrator, escrow, webhook, dispatch, Prisma, Fly |

**Why ~5 production files:** principal resolver (1), policy helper (1), read DTO+service (2), controller
read handlers (1). Indivisible without leaving read paths unprotected or splitting policy from reads.

---

### Pack40B — Note enforcement

**Authorization:** `APPROVE_PACK40B_TENANT_NOTE_ENFORCEMENT`

**Requires:** Pack40A merged and verified on `master`.

**Scope:** note lookup + mutation only; reuse Pack40A principal + policy; same-tenant success;
cross-tenant denial; consumer note regression; **no status mutation**.

#### Pack40B — file allowlist

| Category | Files |
|---|---|
| **Modified production** | `vionaRequestNoteActionDto.ts`; `vionaRequestNoteActionService.ts`; `VionaRequestController.ts` (**note handler only**) |
| **New tests** | `scripts/test-viona-pack40b-tenant-note-enforcement.ts` |
| **Forbidden** | Read service policy changes (except import reuse), status, execution, orchestrator, escrow, webhook, Prisma |

---

### Pack40C — Status-action enforcement

**Authorization:** `APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT`

**Requires:** Pack40A merged and verified. Does **not** require Pack40B, but B should land first in
recommended order.

**Scope:** status scope lookup + mutation only; reuse Pack40A principal + policy; no transaction
widening; no network inside `$transaction`; no orchestrator/escrow change.

#### Pack40C — file allowlist

| Category | Files |
|---|---|
| **Modified production** | `vionaRequestStatusActionDto.ts`; `vionaRequestStatusActionService.ts`; `VionaRequestController.ts` (**status handler only**) |
| **New tests** | `scripts/test-viona-pack40c-tenant-status-enforcement.ts` |
| **Forbidden** | Orchestrator, escrow, execution plan real-provider path, webhook, Prisma |

---

### Pack40D — Indirect internal access paths

**Authorization:** `APPROVE_PACK40D_TENANT_INDIRECT_PATH_REVIEW_AND_IMPLEMENTATION`

**Requires:** Pack40A merged. **Not implied by Pack40A/B/C authorization.**

**Pre-implementation source review** (mandatory per path):

| Indirect caller | Externally reachable? | Likely context | Tenant available? | Risk if mechanical pass-through |
|---|---|---|---|---|
| `previewVionaRequestExecutionGate` | Yes (HTTP preview) | Same JWT principal as read | Yes, after Pack40A | Low — should mirror read policy |
| `previewVionaExecutionPlanRoute` (preview fn) | Yes | Same JWT principal | Yes | Low — mirror read |
| `createVionaRequest` idempotent replay detail | Yes (create endpoint) | Creator `authUserId` | Yes | Medium — verify replay idempotency unchanged |
| Note/status nested `getVionaRequestById` | Internal after B/C | Same principal as outer call | Yes | Should inherit from Pack40B/C inputs |

Pack40D allowlist is **provisional** until review completes. Default minimum:

- `vionaRequestExecutionGateService.ts` + DTO + controller execution-preview handler
- `vionaExecutionPlanRouteService.ts` preview path + controller execution-plan-preview handler
- `vionaRequestCreateService.ts` replay detail fetch **only if review confirms**

**Forbidden without separate justification:** orchestrator invoke path, real-provider POC route,
escrow, webhook.

---

### Pack40S — Staging adversarial QA

**Authorization (separate):**

- `APPROVE_PACK40_STAGING_TENANT_QA_PROVISIONING`
- `APPROVE_PACK40_STAGING_TENANT_ADVERSARIAL_QA`

Requires Pack40A–C (minimum A–C) merged. Does **not** authorize remediation on failure.

Design unchanged from original §13 staging section: two synthetic merchants, JWT adversarial
read/note/status checks, dual-role consumer row preserved, non-leaking 404s.

---

## 9. Authorization phrases

| Phase | Phrase | Does **not** imply |
|---|---|---|
| Pack40A | `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` | B, C, D, provisioning, deploy, QA |
| Pack40B | `APPROVE_PACK40B_TENANT_NOTE_ENFORCEMENT` | C, D, staging |
| Pack40C | `APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT` | D, staging |
| Pack40D | `APPROVE_PACK40D_TENANT_INDIRECT_PATH_REVIEW_AND_IMPLEMENTATION` | staging, deploy |
| Staging provision | `APPROVE_PACK40_STAGING_TENANT_QA_PROVISIONING` | implementation, remediation |
| Staging QA | `APPROVE_PACK40_STAGING_TENANT_ADVERSARIAL_QA` | remediation, deploy |

**Retired phrase:** `APPROVE_PACK40_TENANT_SCOPE_ENFORCEMENT_IMPLEMENTATION` (too broad — do not use).

No increment may begin automatically after another increment passes.

---

## 10. Test matrix (by slice)

### 10.1 Dual-role tests (required — primarily Pack40A)

| # | Test | Slice |
|---|---|---|
| D1 | User with no `MerchantProfile` accessing own consumer-classified request | A |
| D2 | User with active `MerchantProfile` accessing own consumer-classified request | A |
| D3 | Same user accessing matching merchant-classified request | A |
| D4 | Same user denied non-matching registered-tenant request despite user-scope match | A |
| D5 | Inactive merchant accessing own consumer-classified request | A |
| D6 | Inactive merchant denied own merchant-classified request | A |
| D7 | Merchant profile existence alone does not hide consumer-classified list rows | A |
| D8 | Consumer-classified + matching merchant rows coexist in one authorized list | A |
| D9 | Cross-tenant response indistinguishable from not-found | A–C |
| D10 | No client-supplied tenant value expands access | A |

### 10.2 Original matrix (still valid, mapped)

| # | Test | Slice |
|---|---|---|
| 1 | Same owner, same merchant tenant | A/B/C |
| 2 | Same owner, different registered merchant tenant | A/B/C |
| 3 | Different owner, same tenant | A |
| 4 | Different owner, different tenant | A |
| 7 | Consumer, no profile | A |
| 9–12 | Read/note/status non-leakage | A / B / C respectively |
| 13–17 | Regressions, typecheck, lint, full local regression | Each slice + final |

---

## 11. Explicitly protected areas

Unchanged from original plan: orchestrator, escrow, real-provider adapters, AIRouter, intent router,
tool registry, webhook controller/signature/rate-limit, autonomous dispatch, reply formatter,
Prisma schema/migrations, Fly/secret scripts, marketing, Tourism/Business booking, SOS.

---

## 12. Stop-on-error, rollback, deferred, definition of done

Stop-on-error rules apply per slice. Rollback = revert that slice's merge commit.

**Deferred:** Pack36B UI; Pack19 create `tenantId` validation; nullable `tenantId` DDL; denial audit
type; automatic implementation.

**Planning done when:** this revision merged to `master`; kernel/handoff updated.

**Implementation done when:** Pack40A–C slices merged with tests green; Pack40D and Pack40S only if
separately authorized and executed.

---

## Appendix — refinement verification record

| Check | Result |
|---|---|
| PR #340 | **MERGED** @ `95031be` — branch updated post-merge with this refinement |
| Dual-role unsafe rule in v1 plan | **Identified and corrected** |
| Single 13-file increment | **Replaced by Pack40A–D** |
| Schema change required for dual-role | **No** — consumer-classified ≡ not in registered merchant tenant set |
| Overlapping implementation PR | **None** |
