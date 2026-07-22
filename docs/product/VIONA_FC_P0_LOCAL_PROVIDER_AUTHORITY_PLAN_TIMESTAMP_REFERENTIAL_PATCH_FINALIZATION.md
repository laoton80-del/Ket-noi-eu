# VIONA — FC-P0 Local Provider Eligibility Authority  
## Timestamp / Referential / PATCH Finalization

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION`  
**Mode:** `DOCS_ONLY_NO_IMPLEMENTATION_NO_SCHEMA_CHANGE_NO_DEPLOY`  
**Canonical master baseline:** `origin/master` @ `d3bd2935b7ff8029eb5e4c96869c70f1bf1a54ac` (PR #417 squash)  
**Reviewed PR #417 head:** `c581a78a47cc033bd5fef0e741081b987d552a6f`  
**Branch:** `docs/viona-fc-p0-local-provider-authority-plan-timestamp-referential-patch-finalization`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION_PR_REVIEW`

```text
VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION
LIFECYCLE_TIMESTAMPS_LOCKED
RESTRICT_RETENTION_GRAPH
REGISTERED_PRIOR_SCALAR_LIST_LOCKED
PATCH_STATUS_MATRIX_LOCKED
RETIRED_CONFIG_IMMUTABLE
A1_PACK_CARD_EXECUTABLE
FC_P0_STILL_BLOCKED
PACK_A1_NOT_AUTHORIZED
NO_IMPLEMENTATION
```

---

## 0. Context

PR #417 merged @ `d3bd2935b7ff8029eb5e4c96869c70f1bf1a54ac`. Strict review returned:

`BLOCKED_LOCAL_PROVIDER_LIFECYCLE_TIMESTAMP_SEMANTICS_UNRESOLVED`

with co-blockers: audit Prisma prior-list shape, Cascade/Restrict contradiction, PATCH-by-status / RETIRED mutability, Pack A1 card incompleteness.

**This document is authoritative** and supersedes conflicting wording in:

- `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_BOUNDARY_AND_IMPLEMENTATION_PLAN.md`
- `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_LIFECYCLE_WRITE_AUDIT_CONSISTENCY_REMEDIATION.md`
- `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION.md`
- roadmap / Kernel / Handoff Local-provider-authority rows

Preserved architecture (unchanged):

- `LocalProviderEligibility` 1:1 `Business`
- `Role.ADMIN` via `superAdminMiddleware`
- Statuses `DRAFT | ACTIVE | SUSPENDED | RETIRED`; `RETIRED` terminal
- Exact five ops routes; dedicated append-only audit; `GET /api/local/providers`
- Create enforcement; READ COMMITTED race A–E; structure-only migration; A1→A2→B; tests 1–43
- No Tourism / UUID / payment / AI / deploy scope

**Source grounding:** GDPR erasure (`UserService`) anonymizes in place and **preserves `User.id`** (no hard-delete of User). Admin accounts cannot use that erase path. Physical Business delete is already blocked while merchant businesses exist. FC-P0 provider authority therefore uses **Restrict** retention — compatible with repository practice.

**FC-P0 remains blocked. Pack A1 remains unauthorized by this pack.**

---

## 1. Lock — Lifecycle timestamps (exact fields)

`LocalProviderEligibility` uses exactly:

```prisma
activatedAt DateTime?
suspendedAt DateTime?
retiredAt   DateTime?
```

No additional lifecycle timestamp is authorized. These are **transition snapshots**; full history is `LocalProviderEligibilityAuditEvent`.

| Transition | `activatedAt` | `suspendedAt` | `retiredAt` |
|---|---|---|---|
| REGISTER DRAFT | `null` | `null` | `null` |
| DRAFT → ACTIVE | **now** | `null` | `null` |
| ACTIVE → SUSPENDED | **unchanged** | **now** | remains `null` |
| SUSPENDED → ACTIVE | **now** (latest activation, not first-ever) | **`null`** (cleared) | remains `null` |
| DRAFT → RETIRED | remains `null` | remains `null` | **now** |
| ACTIVE → RETIRED | **unchanged** | remains `null` | **now** |
| SUSPENDED → RETIRED | remains latest activation | remains latest suspension | **now** |
| RETIRED | immutable; never cleared; no exit | immutable | immutable |

**`activatedAt`** = timestamp of the **latest successful** transition into ACTIVE.  
**`suspendedAt`** = current suspension episode only; cleared on reactivation.  
**`retiredAt`** = set once on retirement; never cleared.

---

## 2. Lock — Timestamp non-mutation rules

1. Same-state status commands → no lifecycle timestamp change.  
2. No-change PATCH → no lifecycle timestamp change.  
3. Changed config PATCH → does **not** modify `activatedAt` / `suspendedAt` / `retiredAt`.  
4. Forbidden transitions → no field / timestamp change.  
5. Provider-list reads → no timestamp mutation.  
6. Local create reads → no timestamp mutation.  
7. Invalid/empty `Business.name` → no automatic status or timestamp mutation.  
8. Auth failures → no timestamp mutation.  
9. Failed invariant validation → no timestamp mutation.  
10. Transaction rollback restores all lifecycle timestamps.

`updatedAt` is **not** a lifecycle timestamp substitute.

---

## 3. Lock — RETIRED configuration immutability

For `status == RETIRED`:

- No transition out (**409**).  
- **Every** PATCH (including identical/no-change payload) → **409**.  
- No Prisma update; `updatedAt` unchanged; lifecycle timestamps unchanged; **no** audit event.

Retirement corrections require a separately authorized future pack. Do not allow RETIRED configuration editing in FC-P0.

---

## 4. Lock — PATCH status matrix

`PATCH /api/local/ops/providers/:businessId` — only `supportedServiceTypes` and/or `publicB2cVisible` (≥1 field). Reject `status`, lifecycle timestamps, authority/audit fields, unknown keys → **400**. PATCH never changes status or lifecycle timestamps.

| Current status | Allowed config change | No-change | Invariant failure |
|---|---|---|---|
| **DRAFT** | types and/or visibility; empty types OK; private OK | **200** / no update / no audit / `updatedAt` unchanged | N/A (DRAFT has no ACTIVE invariants) |
| **ACTIVE** | types only if result non-empty; `publicB2cVisible` must remain `true`; must keep all ACTIVE invariants | **200** / no update / no audit | private or empty types → **409** |
| **SUSPENDED** | types and/or visibility; empty/private OK | **200** / no update / no audit | N/A for PATCH; later activate revalidates ACTIVE invariants |
| **RETIRED** | **Forbidden** — every PATCH → **409** | **409** (not 200) | — |

Changed allowed PATCH (DRAFT/ACTIVE/SUSPENDED): one eligibility update; `updatedAt` changes; exactly one `CONFIG_UPDATED` in same transaction; **no** lifecycle timestamp mutation.

---

## 5. Lock — Referential retention graph (Restrict)

Replace Cascade-through-eligibility wording.

```prisma
// Eligibility → Business
business Business @relation(fields: [businessId], references: [id], onDelete: Restrict)

// Audit → Eligibility
eligibility LocalProviderEligibility @relation(
  fields: [eligibilityId], references: [id], onDelete: Restrict
)

// Audit → actor User
actorUser User @relation(
  fields: [actorUserId], references: [id], onDelete: Restrict
)

// businessId on audit = immutable String snapshot; NO Business FK
```

| Edge | Action |
|---|---|
| `LocalProviderEligibility.businessId` → `Business` | `onDelete: Restrict` |
| `LocalProviderEligibilityAuditEvent.eligibilityId` → eligibility | `onDelete: Restrict` |
| `LocalProviderEligibilityAuditEvent.actorUserId` → `User` | `onDelete: Restrict` |
| Audit `businessId` | Scalar snapshot only — no second Business relation |

**Consequences:**

1. Business with eligibility **cannot** be physically deleted.  
2. Eligibility with audit events **cannot** be physically deleted.  
3. `Role.ADMIN` User referenced by audit events **cannot** be physically deleted.  
4. Providers leave service via **SUSPENDED** or terminal **RETIRED**, not physical delete.  
5. Account/business deactivation/anonymization remains separate and must preserve referential integrity (`User.id` retained — matches GDPR erase pattern).  
6. **No cascade** removes eligibility or audit history.  
7. Pack A1/A2 expose **no** physical-delete provider-authority operation.

---

## 6. Lock — Business / eligibility / User delete behavior

| Request | Behavior |
|---|---|
| Business physical delete while eligibility exists | **Rejected** (Restrict). Operator must **retire** authority first. Retirement does **not** delete Business or eligibility. Physical Business delete remains **out of FC-P0**. |
| Eligibility physical delete | **No route**; services must not expose delete; Restrict blocks removal once audits exist; **RETIRED** is the terminal action. |
| Actor User physical delete | **Rejected** while audit events reference the User. Disabling/anonymization may proceed only if `User.id` is preserved. |

Do **not** claim cascade deletion of eligibility or audit rows.

---

## 7. Lock — REGISTERED prior-state + audit nullability

Prisma has no valid optional scalar-list (`LocalServiceType[]?`). Locked representation:

```prisma
model LocalProviderEligibilityAuditEvent {
  id String @id @default(uuid())

  eligibilityId String
  businessId    String

  eventType   LocalProviderEligibilityAuditEventType
  actorType   LocalProviderEligibilityAuditActorType
  actorUserId String

  priorStatus LocalProviderEligibilityStatus?
  nextStatus  LocalProviderEligibilityStatus

  priorPublicB2cVisible Boolean?
  nextPublicB2cVisible  Boolean

  priorSupportedServiceTypes LocalServiceType[] @default([])
  nextSupportedServiceTypes  LocalServiceType[] @default([])

  reason String?

  createdAt DateTime @default(now())

  eligibility LocalProviderEligibility @relation(
    fields: [eligibilityId], references: [id], onDelete: Restrict
  )
  actorUser User @relation(
    fields: [actorUserId], references: [id], onDelete: Restrict
  )

  @@index([eligibilityId, createdAt])
  @@index([businessId, createdAt])
  @@index([actorUserId, createdAt])
  @@index([eventType, createdAt])
}
```

**No** `updatedAt` on audit. **No** `metadataJson`. **No** optional scalar-list. **No** extra `hasPriorState` field.

### REGISTERED (canonical no-prior)

| Field | Value |
|---|---|
| `priorStatus` | `null` |
| `priorPublicB2cVisible` | `null` |
| `priorSupportedServiceTypes` | `[]` |
| Discriminator | `eventType == REGISTERED` **AND** `priorStatus == null` **AND** `priorPublicB2cVisible == null` |
| Meaning of `[]` | **No prior list state** — not “previous config was empty” |
| `nextStatus` | `DRAFT` |
| `nextPublicB2cVisible` | `false` |
| `nextSupportedServiceTypes` | registered/default configuration |

### Non-REGISTERED events (service validation)

- `priorStatus` non-null  
- `priorPublicB2cVisible` non-null  
- `priorSupportedServiceTypes` = full previous list (may legitimately be empty)  
- `next*` = full resulting authoritative configuration  

### Field table

| Field | Nullability / default | Notes |
|---|---|---|
| `id` | required UUID | |
| `eligibilityId` | required; Restrict → eligibility | |
| `businessId` | required immutable snapshot | no Business FK |
| `actorUserId` | required; Restrict → User | |
| `actorType` | required; FC-P0 = `ROLE_ADMIN` | |
| `eventType` | required | |
| `priorStatus` | nullable; **null only for REGISTERED** | |
| `nextStatus` | required | |
| `priorPublicB2cVisible` | nullable; **null only for REGISTERED** | |
| `nextPublicB2cVisible` | required | |
| `priorSupportedServiceTypes` | required list `@default([])` | REGISTERED uses `[]` = no prior |
| `nextSupportedServiceTypes` | required list `@default([])` | full next list |
| `reason` | nullable; service max **280**; only SUSPENDED/RETIRED bodies | never B2C |
| `createdAt` | `@default(now())` | |

---

## 8. Lock — Audit event snapshot rules (no lifecycle columns on audit)

| Event | Prior / next | Eligibility timestamp side-effect |
|---|---|---|
| `REGISTERED` | §7 no-prior → DRAFT defaults | all lifecycle stamps `null` |
| `CONFIG_UPDATED` | priorStatus = nextStatus = current status; full visibility/types | **none** |
| `ACTIVATED` | prior DRAFT or SUSPENDED → ACTIVE; full config | §1 activation rules |
| `SUSPENDED` | prior ACTIVE → SUSPENDED; full config; optional reason | §1 suspend rules |
| `RETIRED` | prior DRAFT/ACTIVE/SUSPENDED → RETIRED; full config; optional reason | §1 retire rules |

Do **not** add prior/next lifecycle timestamp columns to the audit model in FC-P0. Event `createdAt` + eligibility state remain the locked boundary.

---

## 9. Lock — Append-only + indexes

Indexes: `@@index([eligibilityId, createdAt])`, `@@index([businessId, createdAt])`, `@@index([actorUserId, createdAt])`, `@@index([eventType, createdAt])`.

Append-only: create only; no `update`/`updateMany`/`delete`/`deleteMany`; no audit mutation route; mutation + event in one `$transaction`; same-state / no-change PATCH / RETIRED PATCH rejection → **no** mutation audit. A2 tests + source gate verify no production authority module calls audit update/delete.

---

## 10. Lock — Eligibility model (amended relation)

```prisma
model LocalProviderEligibility {
  id         String @id @default(uuid())
  businessId String @unique

  status                LocalProviderEligibilityStatus @default(DRAFT)
  publicB2cVisible      Boolean                       @default(false)
  supportedServiceTypes LocalServiceType[]

  activatedAt DateTime?
  suspendedAt DateTime?
  retiredAt   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business    Business @relation(fields: [businessId], references: [id], onDelete: Restrict)
  auditEvents LocalProviderEligibilityAuditEvent[]

  @@index([status, publicB2cVisible])
}
```

No `suspensionReason` / `retirementReason` / displayName / payment / ranking / Tourism / audit actor ids on eligibility. No GIN on types. Zero eligibility rows after structure-only migration.

---

## 11. Lock — 43-case matrix alignment (no renumber)

Preserve A1 = **1–29**, A2 = **30–43**. Explicit assertion amendments:

| Case | Added / clarified assertions |
|---|---|
| **6** | Lifecycle timestamp columns/defaults; audit scalar-list + REGISTERED null prior scalars + `[]` types; Restrict graph; actor User relation; audit indexes |
| **7** | DRAFT defaults include all three lifecycle timestamps `null` |
| **15** | Invalid name excludes provider; **no** status or lifecycle timestamp mutation |
| **29** | READ COMMITTED bounded race unchanged |
| **31** | REGISTERED uses canonical no-prior; next = DRAFT config; registration timestamps remain `null` |
| **33** | Changed PATCH by DRAFT/ACTIVE/SUSPENDED; one update + one `CONFIG_UPDATED`; **no** lifecycle timestamp mutation |
| **34** | No-change PATCH for DRAFT/ACTIVE/SUSPENDED → 200 / no update / `updatedAt` unchanged / no lifecycle stamp change / no audit |
| **37–41** | Exact `activatedAt` / `suspendedAt` / `retiredAt` transition semantics per §1 |
| **42** | Same-state; forbidden resets; RETIRED terminal; **every RETIRED PATCH → 409**; no update/audit/timestamp mutation |
| **43** | Append-only source gate; Restrict retention; actor retention; public DTO/privacy/read |

Do not leave “implementation determines timestamp behavior.”

---

## 12. Lock — Immediate Pack A1 card (unauthorized)

**Name:** FC-P0 Local Provider Eligibility Authority — Schema and Domain Enforcement  

**Phrase:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT`  

**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY`  
**Depends on:** this finalization reviewed + merged + post-merge verified.  
**This docs pack does not authorize A1.**

### A1 must implement exactly (no choices)

- Baseline: post-merge master after this finalization  
- Eligibility + audit models + enums per this doc  
- Lifecycle timestamp columns + §1–2 semantics documented for domain helpers / tests  
- Restrict graph: eligibility→Business, audit→eligibility, audit→User  
- Immutable audit `businessId` snapshot (no Business FK)  
- REGISTERED prior representation (§7)  
- Audit nullability + indexes + no eligibility/audit delete services  
- Create enforcement + READ COMMITTED race + 404/400 mappings  
- Tests **1–29** with §11 amendments  
- Allowed: `prisma/schema.prisma`; one structure-only migration `YYYYMMDDHHMMSS_add_local_provider_eligibility_authority`; Local domain/create services + focused server tests; evidence; Kernel/Handoff  
- Forbidden: GET providers; ops routes; event writers for ops mutations; provider activation; client; deploy; migrate apply; staging data; live create QA  

### A1 must not decide

- first vs latest `activatedAt`  
- whether `suspendedAt` clears  
- whether `retiredAt` clears  
- Cascade vs Restrict  
- optional scalar-list syntax  
- RETIRED PATCH behavior  

### Success

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_SCHEMA_DOMAIN_ENFORCEMENT_PR_REVIEW`

### Blockers

- `BLOCKED_LOCAL_PROVIDER_SCHEMA_IMPLEMENTATION_CONTRADICTION`
- `BLOCKED_LOCAL_PROVIDER_AUDIT_SCHEMA_IMPLEMENTATION_CONTRADICTION`
- `BLOCKED_LOCAL_PROVIDER_MIGRATION_DATA_MUTATION`
- `BLOCKED_LOCAL_PROVIDER_CREATE_ENFORCEMENT_UNSAFE`
- `BLOCKED_LOCAL_PROVIDER_CREATE_TRANSACTION_BOUNDARY_UNSAFE`
- `BLOCKED_LOCAL_PROVIDER_A1_TEST_EVIDENCE_INSUFFICIENT`
- `BLOCKED_LOCAL_PROVIDER_A1_SCOPE_VIOLATION`
- `BLOCKED_ADDITIONAL_CI_FAILURE`

---

## 13. Confirmations

- No `src` / prisma / migration / runtime / deploy in this pack  
- PR #417 merged; this pack resolves timestamp / referential / prior-list / PATCH blockers (docs)  
- FC-P0 still blocked; Pack A1 unauthorized  
- `REQUEST_ONLY_NO_CHARGE` preserved  
- Pack40S unauthorized; Apple/EAS/Phase D2 deferred; Phase C closed green  

---

## 14. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_TIMESTAMP_REFERENTIAL_PATCH_FINALIZATION_PR_REVIEW`
