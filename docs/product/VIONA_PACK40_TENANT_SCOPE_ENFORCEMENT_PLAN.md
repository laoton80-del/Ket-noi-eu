# Pack40 — Multi-Tenant VionaRequest Access Enforcement Plan

Status: **PLANNING ONLY (provenance-hardened refinement)** — docs-only. No product code,
schema/migration, database action, deployment, staging call, or secret change is authorized.

**Pack40A status:** **CLOSED / GREEN** — closure sync PR #355 @ `fa67491`. **Pack40B:** **CLOSED / GREEN** — implementation PR #356 @ `a165ca9` + transactional correction PR #357 @ `45c8f29`; Pack40BD deployed staging **v25** (PR #358 @ `44ff2f7`); Pack40BS adversarial note QA **GREEN** on v25 (PR #359 @ `8c038de`); closure sync PR #360 @ `107be5f`. **Pack40C:** **CLOSED / GREEN** — implementation PR #363 @ `9eb7714`; deployed staging **v26** (Pack40CD PR #364 @ `92244f4`); adversarial status QA **GREEN** (Pack40CS PR #365 @ `97d6ccc`; closure sync PR #366 @ `e9ee2d7`); **10** status POSTs; **2** `submitted→triage` transitions; **0** replay duplicates; **0** denied side effects. **Pack40D initial controlled merchant execution:** **CLOSED / GREEN** — evidence PR #375 **MERGED** @ `ab5f607` (`2026-07-15T21:42:07Z`); closure sync PR #376 **MERGED** @ `5667824` (`2026-07-15T21:49:45Z`); deployed/tested staging **v27**; Pack40DS matrix **5** execution POSTs / **1** successful merchant exec (`triage→inProgress→completed`) / **1** Twilio test-SMS / **1** completed attempt / **2** transitions+events+indirect audits / **1** attempt-scoped escrow hold settled; consumer+legacy+nonexistent+duplicate denials **0** side effects; transport certain; no SID lookup; no cleanup. Narrow scope only: `internalAuthenticatedController` + bounded `twilio_test_sms`. **Signed-webhook execution: DISABLED. Approved internal dispatch: UNWIRED. Consumer/legacy indirect execution: UNSUPPORTED.** **Pack40DR recovery/reconciliation:** readiness audit PR #377 **MERGED** @ `e505359`; Pack40DR1 schema PR #378 **MERGED** @ `0e05f15`; staging migrate-apply evidence PR #379 **MERGED** @ `f184120` — migration `20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference` **APPLIED** to staging; `leaseGeneration` NOT NULL default 0; `providerExternalReference` nullable VarChar(191); existing references **0**; nonzero generations **0**; markers `PACK40DR1_RECOVERY_SCHEMA_APPLIED_TO_STAGING` + `PACK40DR2_DORMANT_RECOVERY_SERVICES_IMPLEMENTED` + `PACK40DR2_RECOVERY_RUNTIME_NOT_WIRED` + `PACK40DR3A_LIVE_GENERATION_FENCING_WIRED` + `PACK40DR3A_PROVIDER_REFERENCE_RUNTIME_POPULATION_WIRED`; dormant recovery services remain unwired; live closed Pack40D path now generation-fenced with exact provider-reference persistence (**not** recovery CLOSED/GREEN); **no** DB/staging/provider/escrow/deploy/secret/production action in DR3A branch work. Lineage: readiness #367; refinement #368; D1 #369+#370; D2 #371; D3A #372; D3B #373; DD #374; DS #375; closure #376; DR audit #377; DR1 schema #378; DR1 migrate-apply #379; DR2 #380; DR3A implementation (this branch). **Pack40S:** UNIMPLEMENTED / NOT AUTHORIZED.
`docs/product/VIONA_PACK40P_REQUEST_PROVENANCE_MODEL_PLAN.md` for server-owned `scopeKind` +
`merchantProfileId` schema/remediation plan, **P1 deployment lock**, and **P1→P3→P2→P2D** rollout order.
Inventory complete (PR #342); consumer provenance requires Pack40P1–P5 (+ P2D) before
`APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT`.

**Planning lineage:**

| Version | PR / commit | Notes |
|---|---|---|
| v1 | PR #340 **MERGED** @ `95031be` | Initial planning packet |
| v2 | branch `fa1a80d` (not merged) | Dual-role + Pack40A–D slicing; **unsafe registry-absence consumer inference** |
| **v3 (this document)** | corrective refinement branch | Three-state classification; Pack40A **blocked** pending provenance |

Operator context: closes the Pack34-deferred `expectedTenantId` wiring gap before Pack36B Merchant
Admin UI — **only after** tenant provenance is established.

Verified planning baseline: `origin/master` @ `1af07e7e2009b44a21bef660d9b63f8778e0080a` (includes
Pack40P initial plan via PR #343).

---

## 1. Executive summary

Pack34 added optional `expectedTenantId` to `buildAuthorizedVionaRequestWhere()`. Production never
passes it. User-participation scope alone does not prevent merchant-profile owners from accessing
rows stamped with another merchant's registered `tenantId`.

**v2 refinement (accepted):** dual-role safety + Pack40A–D merge-gated slices.

**v3 correction (this revision):** v2's rule — *"if `tenantId` is not in the registered
`MerchantProfile.tenantId` set, treat as consumer-classified"* — is **explicitly rejected**. Free-text
`VionaRequest.tenantId` predates enforced merchant linkage; registry absence is not consumer proof.

**Required model:** three semantic states — **consumer-classified**, **merchant-classified**,
**unresolved-tenant** (fail closed). **Pack40A implementation is not authorized** until canonical
consumer row representation is established via source evidence or a separately authorized read-only
provenance inventory.

---

## 2. Source-level tenant provenance audit

Read-only inspection of merged `origin/master` production paths. **No database queries performed.**

### 2.1 Prisma model

```prisma
model VionaRequest {
  tenantId String   // required, non-null
}
```

- **`tenantId` nullable?** **No.**
- **Explicit canonical consumer marker in schema?** **No.**

### 2.2 Production VionaRequest creation paths (complete)

| # | Path | File | Who assigns `tenantId`? | Value source |
|---|---|---|---|---|
| 1 | Pack19 JWT create | `vionaRequestCreateService.ts` | **Client** via `CreateVionaRequestInput.tenantId` | Request body → `validateRequiredText()` (non-empty trimmed, max 100) → stored verbatim |
| 2 | Pack35 webhook create | `vionaRequestCreateFromWebhookService.ts` | **Server** | `input.tenantId` from resolved webhook channel / `MerchantProfile` (controller passes channel tenant after signature + gate) |

**No other production `vionaRequest.create` call sites exist.**

### 2.3 Pack19 create path detail

- Controller: `VionaRequestController.postCreateVionaRequest()` reads `body.tenantId` (required string).
- DTO: `CreateVionaRequestInput.tenantId: string` — required.
- Validation: `validateRequiredText` — **rejects null, empty, whitespace-only**.
- **Does not use:** null, empty string, fixed consumer sentinel, or `authUserId` as tenant.
- **Does use:** arbitrary client-supplied non-empty free text (staging tests commonly use values like
  `pilot-tenant-a`).

### 2.4 Pack35 webhook create path detail

- Always receives non-empty trimmed `tenantId` from trusted channel resolution (`vionaWebhookChannelResolutionService.ts` → `MerchantProfile.tenantId`).
- **Server-owned merchant provenance** for webhook-created rows.

### 2.5 Test / script fixtures (non-production but evidence of patterns)

| Location | `tenantId` values | MerchantProfile-backed? |
|---|---|---|
| `test-viona-read-only-persistence-api.ts` | `pilot-tenant-a`, `pilot-tenant-b` | **Not in same test setup** |
| `test-e2e-real-flow.ts` | `pack31-e2e-tenant` | Ad hoc |
| Pack34–39 suites | `tenant-pack37-a`, etc. | Sometimes paired with profile in same test |
| `provision-staging-webhook-test-channel.ts` | `pack36a-qa-tenant` | **Yes** — explicit profile create |

### 2.6 Audit answers

| Question | Answer (source-only) |
|---|---|
| Can `tenantId` be null at create? | **No** (validator + schema) |
| Can `tenantId` be omitted? | **No** on Pack19 create (required body field) |
| Server-assigned on consumer create? | **No** — client supplies |
| Client can supply `tenantId`? | **Yes** (Pack19) |
| Pack19 uses null / empty / sentinel / userId? | **None verified** — arbitrary non-empty string |
| Webhook always uses resolved merchant tenant? | **Yes** |
| Fixtures use non-profile tenant values? | **Yes** |
| Historical arbitrary tenant values possible? | **Yes** — by design (free-text column) |
| Identify consumer rows from source alone? | **No** |
| Stored data could have non-null tenant without profile? | **Plausible from source** (cannot assert live DB contents) |

### 2.7 Canonical consumer representation — **UNKNOWN from source**

**Not verified in repository:**

- `tenantId === null` (schema forbids)
- Empty string (create validator forbids)
- Fixed server-owned consumer sentinel constant
- Immutable provenance field separate from `tenantId`

**Conclusion:** Pack40A **Definition of Ready** item #1 is **not satisfied**. A separately authorized
read-only provenance inventory must precede Pack40A implementation authorization.

---

## 3. Explicitly rejected rules

### 3.1 v2 unsafe registry-absence rule (REJECTED)

```text
If VionaRequest.tenantId is not found in the current
MerchantProfile.tenantId set, classify the request as consumer.
```

**Recorded reasons:**

1. `MerchantProfile` may post-date the request.
2. Profile may be inactive, removed, or not yet onboarded.
3. Legacy merchant rows may lack a profile row.
4. Malformed / mistyped tenant strings are not consumer tenants.
5. Absence from a mutable registry is not reliable provenance.
6. Requires unbounded or expensive global tenant-set lookup.
7. Silently downgrades tenant-bearing rows to owner-only authorization.

### 3.2 Blanket merchant filter (REJECTED — from v1)

```text
If an authenticated user has any MerchantProfile,
always apply an exact tenantId filter to all generic VionaRequest routes.
```

Hides valid consumer rows for dual-role accounts.

---

## 4. Three-state row classification

Row classification is **independent** of actor context. Actor `VionaRequestPrincipalContext`
(describes the caller) **plus** row provenance **together** determine access.

### 4.1 Consumer-classified

A row may be classified **consumer** only through a **positively identified**, source-verified
representation. Examples **only if verified** (none verified today):

| Candidate | Verified? |
|---|---|
| `tenantId === null` | **No** — schema non-null |
| Exact server-owned sentinel constant | **No** — none in repo |
| Immutable server provenance marker (separate field) | **No** — no such field |
| Pack19 `metadataJson.createdVia` + canonical tenant rule | **Partial** — `createdVia` exists; **no canonical tenant rule** |

**Until verified:** no implementation may infer consumer classification from tenant value shape alone.

### 4.2 Merchant-classified

A row is **merchant-classified** when **all** hold:

1. Existing user authorization passes (requester / owner / participant).
2. Actor has trusted server-resolved `MerchantProfile` for `authUserId`.
3. **Exact equality:** `request.tenantId === MerchantProfile.tenantId` (trimmed string match).
4. No client-supplied tenant value participates in the gate.

Webhook-created rows with server-resolved merchant tenant satisfy (3) when accessed by owning merchant.

### 4.3 Unresolved-tenant

A row is **unresolved** when:

- It has a non-empty `tenantId` that is **not** positively consumer-classified; **and**
- It does **not** exactly match the actor's trusted `MerchantProfile.tenantId`; **or**
- Provenance cannot be positively classified.

**Policy:** fail closed → `request_not_found` / HTTP 404. **Never** fall back to consumer / user-only
authorization for unresolved rows. **Never** disclose row, tenant, or profile existence.

Includes: unknown free-text tenants, other merchants' registered tenants, legacy merchant tenants
without profile, malformed values, Pack19 client-supplied staging strings (until consumer rule exists).

---

## 5. Principal context (actor — dual-role safe)

```typescript
/** Server-resolved only — never from client input. Planning name. */
type VionaRequestPrincipalContext = Readonly<{
  authUserId: string;
  merchant:
    | null
    | Readonly<{
        merchantProfileId: string;
        tenantId: string;
        isActive: boolean;
      }>;
}>;
```

- **`merchant: null`** — no profile; Pack40 merchant gates do not apply (pre-existing user scope for
  non-merchant actors — out of Pack40 merchant-isolation scope).
- **`merchant` present** — dual-role capable; **does not** merchantize every row; row classifier runs
  per row.

**Removed from v2:** `registeredMerchantTenantIds` global set — it existed only to support the
rejected registry-absence consumer inference.

---

## 6. Tenant identity vs merchant activation (separate gates)

### 6.1 Tenant identity gate (security boundary)

- Mandatory for **merchant-classified** rows.
- Exact `request.tenantId === principal.merchant.tenantId`.
- **Never bypassed** for inactive merchants.
- Unresolved rows never pass via this gate.

### 6.2 Merchant active-status gate (operational boundary)

- **Route-specific** — not a universal read blocker.
- **Pack40A read (recommended default):** inactive merchant **may read** own merchant-classified
  historical rows (tenant identity match sufficient). Supports audit/recovery without granting
  mutation capability.
- **Pack40B note / Pack40C status:** require `principal.merchant.isActive === true` for
  merchant-classified rows (operational mutations blocked when inactive).
- **Inactive merchant + consumer-classified row:** allowed under user scope when consumer marker verified.
- **Inactive merchant + unresolved row:** fail closed (same as active).

Stricter read policy (deny all inactive merchant reads) is **not recommended** — would block
historical review with no security gain on read-only paths.

---

## 7. Bounded query design (Pack40A — when provenance known)

### 7.1 Forbidden query patterns

- Fetch all `MerchantProfile.tenantId` values for global `NOT IN` / registry-absence classification.
- Per-row `findMerchantProfileByTenantId()` (N+1).
- Client-supplied tenant in where-clause.
- Treat unknown tenant values as consumer by default.

### 7.2 Allowed bounded shape (after canonical consumer value `C` is verified)

**Dual-role list/detail** for `principal.merchant = M`:

```text
WHERE <existing user-participation OR clause>
  AND (
    tenantId = M.tenantId                    -- merchant-classified (own merchant)
    OR tenantId = C                          -- consumer-classified (canonical constant only)
  )
```

- **Two equality predicates** — index-friendly on `VionaRequest.tenantId` (existing index).
- **Single** `findMerchantProfileByOwnerUserId(authUserId)` per HTTP request (actor context).
- **Zero** per-row profile lookups.
- **Zero** global merchant-tenant scans.

**Detail path:** fetch with `id` + user scope; run pure `classifyVionaRequestTenantRow(tenantId, principal, C)`; deny if unresolved.

**Until `C` is verified:** merchant-profile actors see **only** `tenantId = M.tenantId` rows in list;
all other owned rows are **unresolved** → excluded (fail closed). Product implication: legacy Pack19
personal rows with arbitrary client tenants are **hidden** from merchant-profile list views until
provenance inventory defines `C` or create path is amended (separate future pack).

### 7.3 Pure policy helpers (planning names)

| Helper | Role |
|---|---|
| `resolveVionaRequestPrincipalContext(authUserId)` | Load actor merchant facts (1 query) |
| `classifyVionaRequestTenantRow(tenantId, principal, canonicalConsumerTenant?)` | Returns `consumer` \| `merchant` \| `unresolved` |
| `buildAuthorizedVionaRequestWhereForPrincipal(principal, canonicalConsumerTenant?)` | Bounded list where |

Existing `buildAuthorizedVionaRequestWhere(authUserId, expectedTenantId?)` remains byte-identical
when called with one arg.

---

## 8. Implementation slicing (Pack40A–D + Pack40S)

Unchanged structure. **No phrase implies another slice. No automatic continuation.**

| Slice | Scope | Authorized? |
|---|---|---|
| **Pack40A** | Principal context + read list/detail + three-state policy | **CLOSED / GREEN** — implementation merged; staging deploy v24; adversarial QA green |
| **Pack40B** | Note enforcement | **CLOSED / GREEN** — PR #356+#357 merged; Pack40BD deployed v25; Pack40BS adversarial QA green (PR #359 @ `8c038de`); exactly **2** successful notes; replay idempotent (**0** duplicates); non-owner/legacy/spoof denied; existence-leak-safe **404** normalization |
| **Pack40C** | Status enforcement | **CLOSED / GREEN** — PR #363+#364+#365; deploy v26; adversarial QA green; owner-only `submitted→triage`; 10 POSTs / 2 transitions / 0 duplicates |
| **Pack40D** | Indirect paths after per-path review | **Initial controlled merchant execution CLOSED/GREEN** (staging **v28**); signed-webhook DISABLED; internal dispatch UNWIRED; consumer/legacy UNSUPPORTED; Pack40DR recovery **deployed**; Pack40DRS0 safety QA **PASS**; Pack40DRF = **WAIT_FOR_NATURAL_STRANDED_ATTEMPT**; Pack40DRS1 original + **re-inventory** = **BLOCKED_NO_SAFE_RECOVERABLE_ATTEMPT_FIXTURE** (still **0** non-terminal attempts); functional non-terminal recovery **untested**; recovery **not** CLOSED/GREEN; Pack40S unauthorized |
| **Pack40S** | Staging adversarial QA | **UNIMPLEMENTED / NOT AUTHORIZED** |
| **Discovery** | Read-only tenant provenance inventory | **Not authorized** — phrase below |

---

## 9. Authorization phrases

| Phrase | Authorizes | Does **not** authorize |
|---|---|---|
| `APPROVE_PACK40A_READ_ONLY_TENANT_PROVENANCE_INVENTORY` | Bounded read-only DB inventory of tenant value patterns | Row changes, normalization, enforcement, deploy, Pack40A impl |
| `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` | Pack40A code + local tests | B, C, D, inventory, staging, deploy |
| `APPROVE_PACK40B_TENANT_NOTE_ENFORCEMENT` | Pack40B only | C, D, staging |
| `APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT` | Pack40C only | D, staging |
| `APPROVE_PACK40D_INDIRECT_PATH_READINESS_AUDIT` | Pack40D read-only readiness audit (docs only) | implementation, DB, staging, deploy |
| `APPROVE_PACK40D_EXECUTION_FOUNDATION_REFINEMENT` | Pack40D architecture refinement (docs only) | implementation, schema, DB, staging, deploy |
| `APPROVE_PACK40D1_EXECUTION_ATTEMPT_SCHEMA` | Pack40D1 schema + repository only | D2+, provider, staging, deploy |
| `APPROVE_PACK40D1_STAGING_EXECUTION_ATTEMPT_MIGRATION_APPLY` | Pack40D1 staging migrate deploy only | app deploy, API, provider, D2/D3, Pack40S |
| `APPROVE_PACK40D2_EXECUTION_PRINCIPAL_INDIRECT_WRITER` | Pack40D2 local principal + indirect writer + tests | runtime wiring, provider, D3, schema/migration, DB/staging, Pack40S |
| `APPROVE_PACK40D3A_PROVIDER_GATEWAY_FOUNDATION` | Pack40D3A dormant provider gateway + fake-adapter tests | runtime wiring, live Twilio/escrow, D3B, request finalization, schema/migration, DB/staging, Pack40S |
| `APPROVE_PACK40D3B_CONTROLLED_RUNTIME_WIRING_AND_BYPASS_CLOSURE` | Pack40D3B coordinator wiring + bypass closure + local tests | staging deploy, live Twilio/escrow execution, signed-webhook exec enablement, recovery, Pack40S |
| `APPROVE_PACK40DD_STAGING_INDIRECT_EXECUTION_DEPLOY` | Pack40DD staging app deploy + docs evidence | authenticated execution QA, Twilio/escrow/DB/migration, secrets, production, Pack40S |
| `APPROVE_PACK40DS_STAGING_CONTROLLED_INDIRECT_EXECUTION_QA` | Pack40DS bounded authenticated staging matrix + exactly one live Twilio test-SMS + docs evidence | additional Twilio sends, request create, webhook, cleanup, recovery, signed-webhook/internal-dispatch enablement, deploy/migrate/secrets/production, Pack40S |
| `APPROVE_PACK40DR_RECOVERY_RECONCILIATION_READINESS_AUDIT` | Pack40DR docs-only recovery/reconciliation readiness audit | schema/migration, recovery impl, runtime wiring, scheduler, Twilio/escrow/DB/staging, deploy, Pack40S |
| `APPROVE_PACK40DR1_RECOVERY_SCHEMA_PACKET` | Pack40DR1 additive `leaseGeneration` + exact opaque `providerExternalReference` schema/migration + local tests | migration apply, recovery runtime, HTTP wiring, scheduler, live recon, escrow ops, staging deploy, Pack40S |
| `APPROVE_PACK40DR1_STAGING_RECOVERY_SCHEMA_MIGRATION_APPLY` | Pack40DR1 staging `prisma migrate deploy` + docs evidence | recovery runtime, endpoint/scheduler, Twilio/escrow, app deploy, Pack40DR2, Pack40S |
| `APPROVE_PACK40DR2_DORMANT_RECOVERY_SERVICES` | Pack40DR2 dormant recovery principal, generation-fenced lease, exact-provider reconciliation, escrow reconciliation, recovered finalization + fake-adapter tests + docs | recovery endpoint/scheduler/worker, runtime wiring, live Twilio/escrow, DB/staging, schema/migration, deploy, Pack40DR3A, Pack40S |
| `APPROVE_PACK40DR3A_LIVE_FENCING_PROVIDER_REFERENCE_HARDENING` | Pack40DR3A live `leaseGeneration` propagation + exact `providerExternalReference` persistence on closed Pack40D path + fake tests + docs | recovery endpoint/scheduler/worker, Pack40DR2 runtime import, live provider/escrow/DB/staging, schema/migration, deploy, Pack40DR3B, Pack40S |
| `APPROVE_PACK40DR3B_OPERATOR_INTERNAL_RECOVERY_ENDPOINT` | Pack40DR3B authenticated internal operator recovery route + DR2 coordinator wiring + read-only lookup/escrow adapters + fake tests + docs | scheduler/worker/scan, live Twilio/escrow/DB/staging, schema/migration, deploy, Pack40DRD, Pack40S |
| `APPROVE_PACK40DRD_STAGING_RECOVERY_DEPLOY` | Deploy merged Pack40DR3B recovery code to `viona-api-staging-eu` + deployment evidence only | recovery invocation, live QA, provider/escrow/DB/migration, scheduler, production, Pack40DRS, Pack40S |
| `APPROVE_PACK40DRS0_STAGING_RECOVERY_ENDPOINT_SAFETY_QA` | Staging recovery endpoint safety matrix (denials + completed terminal no-op) + evidence | non-terminal recovery, lease acquire, provider lookup/send, escrow mutation, cleanup, deploy, Pack40S |
| `APPROVE_PACK40DRS1_STRANDED_ATTEMPT_FIXTURE_READINESS_AUDIT` | Read-only staging inventory for safe non-terminal recovery fixture + docs | fixture creation, recovery POST, provider/escrow mutation, Pack40DRS2, Pack40S |
| `APPROVE_PACK40DRF_STRANDED_FIXTURE_CONSTRUCTION_DESIGN_AUDIT` | Design-only analysis of safe stranded fixture construction methods | fixture creation, source/schema change, recovery/provider/escrow action, Pack40DRF1, Pack40S |
| `APPROVE_PACK40DRS1_REINVENTORY_NATURAL_STRANDED_ATTEMPT` | Read-only re-inventory for natural non-terminal recovery fixture + docs | recovery POST, fixture creation, provider/escrow mutation, Pack40DRS2, Pack40S |
| `APPROVE_PACK40D_TENANT_INDIRECT_PATH_REVIEW_AND_IMPLEMENTATION` | Legacy combined phrase — prefer D1→D2→D3 sequence | staging |
| `APPROVE_PACK40_STAGING_TENANT_QA_PROVISIONING` | Staging data | impl, remediation |
| `APPROVE_PACK40_STAGING_TENANT_ADVERSARIAL_QA` | Staging QA | remediation, deploy |

**Retired:** `APPROVE_PACK40_TENANT_SCOPE_ENFORCEMENT_IMPLEMENTATION`

**Current state:** **All implementation phrases ungranted.** Discovery phrase **ungranted**.

---

## 10. Per-increment file allowlists

### Pack40A (blocked until §12 ready)

| Category | Files |
|---|---|
| **New** | `src/services/viona/vionaRequestPrincipalContext.ts` |
| **Modified (≤4)** | `vionaRequestAccessScope.ts` (pure classifiers + bounded where helper); `vionaRequestReadDto.ts`; `vionaRequestReadService.ts`; `VionaRequestController.ts` (**list + detail only**) |
| **New tests** | `scripts/test-viona-pack40a-tenant-read-enforcement.ts` |
| **Forbidden** | Note/status/execution/create/webhook/dispatch/orchestrator/escrow/Prisma |

### Pack40B / C / D

Unchanged from v2 refinement (note-only, status-only, indirect review respectively). Reuse Pack40A
principal + three-state classifiers; do not reintroduce registry-absence inference.

---

## 11. Test plan additions (provenance-focused)

| # | Test | Slice |
|---|---|---|
| P1 | Unknown non-null tenant **not** classified consumer | A |
| P2 | Missing MerchantProfile does **not** downgrade tenant-bearing row to consumer for merchant actor | A |
| P3 | Inactive/removed profile registration does **not** convert row to consumer | A |
| P4 | Malformed tenant value → unresolved → fail closed | A |
| P5 | Consumer classification uses **only** verified canonical representation | A |
| P6 | Dual-role list: canonical consumer + matching merchant rows only | A |
| P7 | Dual-role list excludes unresolved and other-merchant rows | A |
| P8 | Detail on unresolved → same external result as not found | A |
| P9 | No global MerchantProfile tenant-set scan (structural / query assertion) | A |
| P10 | No per-row MerchantProfile query (structural) | A |
| P11 | Client body/query/header tenant cannot alter classification | A |
| P12 | Inactive merchant read policy matches §6.2 explicit default | A |

Plus dual-role tests D1–D10 and original adversarial matrix from v2 (mapped to slices).

---

## 12. Pack40A definition of ready

| # | Criterion | Status |
|---|---|---|
| 1 | Canonical consumer row representation | **MET** — `scopeKind=consumer` + `merchantProfileId=null` (Pack40P2/P5) |
| 2 | Merchant row representation | **MET** — exact profile tenant equality |
| 3 | Unresolved-tenant fail-closed behavior | **MET** — specified |
| 4 | Dual-role list semantics | **MET** — consumer + merchant branches coexist |
| 5 | Inactive-merchant read semantics | **MET** — §6.2 default |
| 6 | Bounded query design | **MET** — §7.2 |
| 7 | No client tenant expansion | **MET** |
| 8 | No schema migration requirement | **MET** |

**Pack40A implementation:** **CLOSED / GREEN** — `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` (PR #352); Pack40AD staging deploy (PR #353); Pack40AS adversarial QA (PR #354). Pack40B/C/D/S remain separately authorized.

### Discovery gate design (not executed here)

`APPROVE_PACK40A_READ_ONLY_TENANT_PROVENANCE_INVENTORY` may authorize:

- Bounded `SELECT DISTINCT tenantId, sourceUniverse, createdVia FROM ... LIMIT N` style inventory
- Count of rows where `tenantId` matches / does not match any `MerchantProfile.tenantId`
- **No PII export**, no row mutation, no normalization, no enforcement

Result feeds plan amendment defining `C` or documents that DDL/create-path change is required
(separate pack).

---

## 13. Staging QA (Pack40S)

Unchanged adversarial design (two synthetic merchants, JWT cross-tenant denial, dual-role consumer row
**once **`C` verified**). Separate authorization. No remediation on failure.

---

## 14. Protected areas, rollback, deferred

Protected: orchestrator, escrow, real-provider adapters, AIRouter, intent router, tool registry,
webhook signature/rate-limit/dispatch, Prisma (for Pack40A–C), Fly/secrets, marketing, Tourism/SOS.

Deferred: Pack36B UI; Pack19 create tenant validation; nullable `tenantId` DDL (only if inventory
requires); denial audit type; automatic implementation.

---

## Appendix — refinement verification

| Check | Result |
|---|---|
| PR #340 | **MERGED** @ `95031be` |
| v2 unsafe registry rule | **Rejected in v3** |
| Consumer provenance from source | **Unknown** |
| Three-state model | **Defined** |
| Pack40A ready | **CLOSED / GREEN** |
| Overlapping implementation | **None** |
