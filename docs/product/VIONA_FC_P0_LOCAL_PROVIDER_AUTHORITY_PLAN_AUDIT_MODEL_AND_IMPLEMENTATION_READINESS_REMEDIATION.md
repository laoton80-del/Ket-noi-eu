# VIONA — FC-P0 Local Provider Eligibility Authority  
## Audit Model and Implementation Readiness Remediation

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION`  
**Mode:** `DOCS_ONLY_NO_IMPLEMENTATION_NO_SCHEMA_CHANGE_NO_DEPLOY`  
**Canonical master baseline:** `origin/master` @ `435ddcd0f59b6e9295755398a54482788d7948ed` (PR #416 squash)  
**Reviewed PR #416 head:** `e83bc6727ad59a3d2d18396ea635ee81a5574eb4`  
**Branch:** `docs/viona-fc-p0-local-provider-authority-plan-audit-readiness-remediation`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_FINAL_PLAN_REMEDIATION_PR_REVIEW`

```text
VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_AUDIT_READINESS_REMEDIATION
AUDIT_MODEL_COMPLETE
NO_CHANGE_PATCH_LOCKED
READ_COMMITTED_BOUNDED_RACE_LOCKED
FORTY_THREE_CASE_TEST_MATRIX_IN_REPO
A1_PACK_CARD_EXECUTABLE
FC_P0_STILL_BLOCKED
PACK_A1_NOT_AUTHORIZED
NO_IMPLEMENTATION
```

---

## 0. Context

PR #416 merged on master @ `435ddcd0f59b6e9295755398a54482788d7948ed`. Strict review returned:

`BLOCKED_LOCAL_PROVIDER_AUDIT_MODEL_BOUNDARY_UNRESOLVED`

with co-blockers: config-update semantics, create consistency, ACTIVE invariant (post-activation name), test plan, immediate A1 pack card; residual `suspensionReason` on eligibility vs audit-only reasons.

This addendum **locks** those boundaries. Preserved architecture (unchanged intent):

- `MINIMAL_SCHEMA_EXTENSION_REQUIRED`
- `LocalProviderEligibility` 1:1 `Business`
- `LOCAL_PROVIDER_AUTHORITY_OWNER_ROLE_ADMIN_VIA_SUPERADMIN_MIDDLEWARE` (`Role.ADMIN` only)
- Statuses `DRAFT | ACTIVE | SUSPENDED | RETIRED`; `RETIRED` terminal
- Exact five future ops routes; authenticated `GET /api/local/providers`
- Server-side create enforcement; **A1 → A2 → B**; structure-only migration; no automatic activation
- FC-P0 remains blocked; Pack A1 unauthorized by this pack

**Document authority:** This remediation **supersedes** any conflicting wording in:

- `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_BOUNDARY_AND_IMPLEMENTATION_PLAN.md`
- `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_LIFECYCLE_WRITE_AUDIT_CONSISTENCY_REMEDIATION.md`
- Kernel / Handoff rows for Local provider authority planning

---

## 1. Lock — Eligibility model (no reason fields)

### Enum `LocalProviderEligibilityStatus`

`DRAFT` | `ACTIVE` | `SUSPENDED` | `RETIRED`

### Model `LocalProviderEligibility` (exact proposed Prisma)

```prisma
model LocalProviderEligibility {
  id        String @id @default(uuid())
  businessId String @unique

  status                 LocalProviderEligibilityStatus @default(DRAFT)
  publicB2cVisible       Boolean                       @default(false)
  supportedServiceTypes  LocalServiceType[]

  activatedAt DateTime?
  suspendedAt DateTime?
  retiredAt   DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  auditEvents LocalProviderEligibilityAuditEvent[]

  @@index([status, publicB2cVisible])
}
```

`Business` gains: `localProviderEligibility LocalProviderEligibility?`

| Field | Lock |
|---|---|
| `id` | `String` `@id` `@default(uuid())` — repository UUID convention |
| `businessId` | `String` `@unique`; FK → `Business.id`; type matches `Business.id` |
| Relation | 1:1 optional from Business; `onDelete: Cascade` (eligibility removed with Business) |
| `status` | `LocalProviderEligibilityStatus` `@default(DRAFT)` |
| `publicB2cVisible` | `Boolean` `@default(false)` |
| `supportedServiceTypes` | `LocalServiceType[]` — empty array default at create (no types until configured) |
| `activatedAt` / `suspendedAt` / `retiredAt` | `DateTime?` — lifecycle timestamps only |
| `createdAt` / `updatedAt` | standard |

**Forbidden on this model:** `suspensionReason`, `retirementReason`, `displayName`, owner/contact/tax/payment/ranking/reviews/marketplace metadata, audit actor ids (`activatedByUserId`, `lastStatusChangedByUserId`).

**Reasons:** optional suspend/retire `reason` exists **only** on `LocalProviderEligibilityAuditEvent.reason` for `SUSPENDED` / `RETIRED` events. Never B2C DTO. Never mutable provider state on eligibility.

**Indexes:**

1. Unique `businessId` (`@unique`)
2. `@@index([status, publicB2cVisible])`
3. **No GIN** on `supportedServiceTypes` for FC-P0 (bounded activated set; Prisma `has` filter sufficient)
4. Stable `Business.name` + `Business.id` ordering via join — **no** duplicated name column

**Default ineligibility:** zero eligibility rows after migration ⇒ all existing Businesses remain ineligible until ops register + activate.

---

## 2. Lock — Audit event enum (dedicated)

### Enum `LocalProviderEligibilityAuditEventType`

Exactly five values — **not** strings, **not** Local request audit types, **no** `NO_CHANGE`:

| Value | Meaning |
|---|---|
| `REGISTERED` | First eligibility row create |
| `CONFIG_UPDATED` | Real PATCH config change |
| `ACTIVATED` | Transition to ACTIVE |
| `SUSPENDED` | Transition to SUSPENDED |
| `RETIRED` | Transition to RETIRED |

Same-state status commands and no-change PATCH emit **no** audit row.

---

## 3. Lock — Audit actor authority (one choice)

**Chosen:** dedicated actor enum (does **not** reuse `LocalServiceRequestAuditActorType` or Prisma `Role` as the audit column type).

### Enum `LocalProviderEligibilityAuditActorType`

FC-P0 sole value:

`ROLE_ADMIN`

| Rule | Lock |
|---|---|
| `actorUserId` | Required `String`; identifies the acting `User.id` (`Role.ADMIN`) |
| `actorType` | Snapshot of authority class = `ROLE_ADMIN` |
| Gate | Service may create events only after `authMiddleware` → `superAdminMiddleware` authorized `Role.ADMIN` |
| Not a substitute | `actorType` does not replace `actorUserId` |

No OR language. Pack A1 does not choose actor representation.

---

## 4. Lock — Complete audit Prisma model

### Model `LocalProviderEligibilityAuditEvent`

```prisma
model LocalProviderEligibilityAuditEvent {
  id String @id @default(uuid())

  eligibilityId String
  businessId    String

  eventType LocalProviderEligibilityAuditEventType
  actorType LocalProviderEligibilityAuditActorType
  actorUserId String

  priorStatus LocalProviderEligibilityStatus?
  nextStatus  LocalProviderEligibilityStatus

  priorPublicB2cVisible Boolean?
  nextPublicB2cVisible  Boolean

  priorSupportedServiceTypes LocalServiceType[]
  nextSupportedServiceTypes  LocalServiceType[]

  reason String?

  createdAt DateTime @default(now())

  eligibility LocalProviderEligibility @relation(
    fields: [eligibilityId],
    references: [id],
    onDelete: Restrict
  )

  @@index([eligibilityId, createdAt])
  @@index([businessId, createdAt])
  @@index([actorUserId, createdAt])
  @@index([eventType, createdAt])
}
```

| Field | Semantics |
|---|---|
| `eligibilityId` | FK → `LocalProviderEligibility`; **`onDelete: Restrict`** — preserves audit history; no cascade delete of audit rows |
| `businessId` | Target Business id (denormalized query key; **no** FK duplication of private Business fields) |
| `actorUserId` | Acting Role.ADMIN user |
| `actorType` | Always `ROLE_ADMIN` in FC-P0 |
| `eventType` | Dedicated enum above |
| `prior*` | Nullable **only** for `REGISTERED` (no prior eligibility state) |
| `next*` | Complete resulting authoritative configuration after the mutation |
| Visibility / types | **Explicit columns** — **not** `metadataJson` |
| `reason` | Optional; max **280** chars after trim; audit-only; suspend/retire bodies only |
| `metadataJson` | **Not present** for locked FC-P0 events |

**No** private Business fields, tokens, payment data, raw request bodies, or unbounded metadata.

---

## 5. Lock — Append-only policy (application/service)

| Rule | Lock |
|---|---|
| Create only | Audit events may only be **created** |
| No update service | No audit update helper |
| No delete service | No audit delete helper |
| No routes | No public / merchant / B2C / ops route updates or deletes audit events |
| Corrections | Later domain event only — never edit history |
| Prisma ban | A1/A2 production code must **not** call `update` / `updateMany` / `delete` / `deleteMany` on `LocalProviderEligibilityAuditEvent` |
| Transaction | Audit create in the **same** `$transaction` as the domain mutation |
| Same-state / no-change | No audit event |
| DB triggers / immutable privileges | **Not** claimed (repository does not provide them) |
| Test gate | Pack A2 tests + optional static grep/source gate assert absence of mutation call sites |

---

## 6. Lock — No-change PATCH semantics

`PATCH /api/local/ops/providers/:businessId` accepts only `supportedServiceTypes` and/or `publicB2cVisible` (≥1 field required). Reject `status`, authority/audit fields, unknown keys → **400**.

| Situation | HTTP | Prisma update | `updatedAt` | Audit |
|---|---|---|---|---|
| Validated request equals current config | **200** + current ops DTO | **None** | **Unchanged** | **None** |
| At least one value changes | **200** + updated ops DTO | Exactly one eligibility update | Changes (`@updatedAt`) | Exactly one `CONFIG_UPDATED` in same transaction; prior/next columns = full before/after |

ACTIVE invariant violations on PATCH (`publicB2cVisible=false` or empty types while ACTIVE) → **409** (must suspend/retire first). Repeated equivalent PATCH = safe idempotent no-op.

---

## 7. Lock — Same-state status commands

`DRAFT→DRAFT`, `ACTIVE→ACTIVE`, `SUSPENDED→SUSPENDED`, `RETIRED→RETIRED`:

- HTTP **200** + current ops DTO  
- No Prisma update; **`updatedAt` unchanged**  
- No mutation audit  

Invalid cross-state / forbidden resets / exits from `RETIRED` → **409**. `RETIRED` remains terminal.

---

## 8. Lock — Post-activation invalid Business name

When linked `Business.name` becomes empty/invalid after activation:

| Behavior | Lock |
|---|---|
| Eligibility `status` | **Not** silently changed |
| Auto SUSPEND | **No** |
| Auto audit | **No** |
| `GET /api/local/providers` | **Excludes** the malformed provider (not selectable) |
| `createLocalServiceRequest` | Generic provider unavailable → locked **404** |
| Ops recovery | Repair Business name **or** explicit suspend/retire |
| History | Eligibility row remains intact |
| Selectability | `status == ACTIVE` alone is **insufficient** — name validity is part of selectability |
| B2C read | Must **not** mutate eligibility |

---

## 9. Lock — READ COMMITTED create consistency

Use existing `prisma.$transaction` with repository-default PostgreSQL **READ COMMITTED**.

Inside create transaction:

1. Read `Business`  
2. Read `LocalProviderEligibility`  
3. Validate eligibility + service compatibility (+ non-empty name)  
4. Create `LocalServiceRequest`  
5. Create existing Local request audit (`REQUEST_CREATED`)  
6. Commit together  

**Exact bounded guarantee:**

- Stale client provider-list data **never** authorizes creation  
- If suspension **committed before** the create tx’s authoritative eligibility read → create **fails** (404 unavailable)  
- If create **authoritatively read ACTIVE** before a concurrent suspension commits → that create **may complete**  
- After suspension commits, later authoritative reads **reject**  
- Request + request-audit remain atomic  
- FC-P0 does **not** claim instantaneous global suspension cut-off  
- FC-P0 does **not** use row locks, `SERIALIZABLE`, or unsupported raw SQL  

**Do not claim:** “No request may commit after a suspension transaction commits.”

---

## 10. Lock — Race matrix (intentional FC-P0 boundary)

| Case | Scenario | Expected |
|---|---|---|
| **A** | Create reads ACTIVE; suspension has not committed | Create **may** complete |
| **B** | Suspension commits before create eligibility read | Create **rejects** unavailable |
| **C** | Create inserts before suspension commits | Create **may** commit; suspension applies to subsequent reads |
| **D** | Overlap after create read, before create commit | Bounded race **accepted**; no stronger cut-off |
| **E** | Create begins and reads after suspension commit | Create **rejects** |

Stronger suspension guarantees require a **separate future consistency pack**.

---

## 11. Lock — Create enforcement (preserved, restated)

Inside `createLocalServiceRequest` transaction: Business exists; eligibility exists; `status == ACTIVE`; `publicB2cVisible == true`; `supportedServiceTypes` contains requested type; Business display name non-empty.

| Case | HTTP |
|---|---|
| Unknown Business | 404 |
| No eligibility / DRAFT / SUSPENDED / RETIRED / ACTIVE private / empty types / invalid name | 404 generic unavailable |
| Unsupported `serviceType` | 400 |
| No create-specific 403/409 | — |
| No internal status/reason leakage | — |

---

## 12. Lock — A1 / A2 audit ownership

| Pack | Owns | Does not own |
|---|---|---|
| **A1** | Eligibility + audit **schema**; enums; structure-only migration; selectability / service-compatibility helpers; create enforcement; tests 1–29 | Ops mutation routes; producing eligibility audit rows via externally reachable ops; read route; client; deploy |
| **A2** | Role.ADMIN ops routes; mutation services; `REGISTERED` / `CONFIG_UPDATED` / `ACTIVATED` / `SUSPENDED` / `RETIRED` event **creation**; append-only tests; `GET /api/local/providers`; route/controller/service tests | Client wiring; staging activation of real providers |

A1 may ship audit **types/model** required by A2; A1 exposes **no** provider activation API.

---

## 13. Lock — Exact 43-case test matrix

### Pack A1 — schema, domain, create (cases 1–29)

| # | Pack | Category / intended proof | Behavior | Expected |
|---|---|---|---|---|
| 1 | A1 | migration structure | New enums/models/indexes/constraints only | Structures present; no data mutation |
| 2 | A1 | migration data | Zero eligibility inserts / activations | Count = 0 |
| 3 | A1 | default ineligible | Pre-existing Business without row | Not selectable |
| 4 | A1 | constraint | Duplicate `businessId` | Uniqueness enforced |
| 5 | A1 | indexes/defaults | Selection index + DRAFT/private/empty defaults | Present |
| 6 | A1 | audit schema | Model + enums + actor + indexes | Match this doc |
| 7 | A1 | register defaults (domain) | New eligibility shape | DRAFT, private, `[]` types |
| 8 | A1 | selectability | No row | Not selectable |
| 9 | A1 | selectability | DRAFT | Not selectable |
| 10 | A1 | selectability | Valid ACTIVE+public+types+name | Selectable |
| 11 | A1 | selectability | ACTIVE private | Not selectable |
| 12 | A1 | selectability | ACTIVE empty types | Not selectable |
| 13 | A1 | selectability | SUSPENDED | Not selectable |
| 14 | A1 | selectability | RETIRED | Not selectable |
| 15 | A1 | ACTIVE invariant | Empty/invalid Business name | Exclude; eligibility **unchanged** |
| 16 | A1 | service helper | Supported type | Allowed |
| 17 | A1 | service helper | Unsupported type | Rejected |
| 18 | A1 | create | Unknown Business | Safe 404 |
| 19 | A1 | create | Business, no eligibility | Safe 404 |
| 20 | A1 | create | DRAFT | Generic 404 |
| 21 | A1 | create | SUSPENDED | Generic 404 |
| 22 | A1 | create | RETIRED | Generic 404 |
| 23 | A1 | create | ACTIVE private | Generic 404 |
| 24 | A1 | create | ACTIVE + invalid name | Generic 404 |
| 25 | A1 | create | Unsupported service type | 400 |
| 26 | A1 | create txn | Valid ACTIVE | Request + request audit atomic |
| 27 | A1 | create txn | Forced failure | Both rolled back |
| 28 | A1 | consistency | Read after committed suspension | Reject |
| 29 | A1 | consistency | Read ACTIVE before concurrent suspension commit | May complete (RC bound) |

Intended A1 test locations: `tests/` / server Local create + domain/migration suites (exact filenames chosen in A1 within Local server test tree).

### Pack A2 — ops, audit, B2C read (cases 30–43)

| # | Pack | Category | Behavior | Expected |
|---|---|---|---|---|
| 30 | A2 | auth | superAdminMiddleware | ADMIN ok; non-admin rejected |
| 31 | A2 | register | First POST | DRAFT defaults + one `REGISTERED` |
| 32 | A2 | register | Repeat POST | 200; no overwrite; no `updatedAt` change; no audit |
| 33 | A2 | PATCH | Real change | 200; `updatedAt` changes; one `CONFIG_UPDATED` with prior/next columns |
| 34 | A2 | PATCH | No-change | 200; no update; `updatedAt` preserved; no audit |
| 35 | A2 | PATCH | ACTIVE → private | **409** |
| 36 | A2 | PATCH | ACTIVE → empty types | **409** |
| 37 | A2 | transition | DRAFT → ACTIVE | Succeeds iff invariants; `ACTIVATED` |
| 38 | A2 | transition | DRAFT → RETIRED | `RETIRED` event |
| 39 | A2 | transition | ACTIVE → SUSPENDED | `SUSPENDED` event |
| 40 | A2 | transition | ACTIVE → RETIRED | `RETIRED` event |
| 41 | A2 | transition | SUSPENDED → ACTIVE / RETIRED | Invariants + exact events |
| 42 | A2 | lifecycle | Same-state + forbidden + RETIRED exits | 200/no update/no audit; else **409** |
| 43 | A2 | audit + read | Append-only + privacy; GET providers | JWT; selectable filter; optional `serviceType`; name+id order; limit/skip; safe DTO (may be multiple test functions; **one** matrix case) |

---

## 14. Lock — Immediate Pack A1 card (unauthorized)

**Name:** FC-P0 Local Provider Eligibility Authority — Schema and Domain Enforcement  

**Phrase:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT`  

**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY`  
**Depends on:** this remediation reviewed + merged + post-merge verified on master.  
**This docs pack does not authorize A1.**

### Locked for A1 execution

- Baseline: post-merge master after this remediation  
- Exact `LocalProviderEligibility` + audit model + enums (§1–4)  
- Relations/indexes; migration name `YYYYMMDDHHMMSS_add_local_provider_eligibility_authority`; structure-only; **zero** eligibility rows; **no** activation  
- Helpers: `IS_LOCAL_PROVIDER_SELECTABLE`, `IS_LOCAL_PROVIDER_ALLOWED_FOR_SERVICE_TYPE`  
- Create transaction enforcement + READ COMMITTED bounded race (§9–11)  
- Exact 404/400 mappings (§11)  
- Tests **1–29** (§13)  
- Allowed: `prisma/schema.prisma`; one migration folder; Local domain/create services + focused server tests; evidence; Kernel/Handoff  
- Forbidden: GET providers; ops routes; client; deploy; migrate apply; staging data; live Local create QA  

### Success classification

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_SCHEMA_DOMAIN_ENFORCEMENT_PR_REVIEW`

### Blocker classifications (required)

- `BLOCKED_LOCAL_PROVIDER_SCHEMA_IMPLEMENTATION_CONTRADICTION`
- `BLOCKED_LOCAL_PROVIDER_AUDIT_SCHEMA_IMPLEMENTATION_CONTRADICTION`
- `BLOCKED_LOCAL_PROVIDER_MIGRATION_DATA_MUTATION`
- `BLOCKED_LOCAL_PROVIDER_CREATE_ENFORCEMENT_UNSAFE`
- `BLOCKED_LOCAL_PROVIDER_CREATE_TRANSACTION_BOUNDARY_UNSAFE`
- `BLOCKED_LOCAL_PROVIDER_A1_TEST_EVIDENCE_INSUFFICIENT`
- `BLOCKED_LOCAL_PROVIDER_A1_SCOPE_VIOLATION`
- `BLOCKED_ADDITIONAL_CI_FAILURE`

---

## 15. Confirmations

- No `src` / prisma schema / migration / runtime / deploy in this pack  
- PR #416 merged; this pack closes audit/readiness review blockers (docs)  
- FC-P0 still blocked; Pack A1 unauthorized  
- `REQUEST_ONLY_NO_CHARGE` preserved  
- Pack40S unauthorized; Apple/EAS/Phase D2 deferred; Phase C closed green  

---

## 16. Final classification

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_FINAL_PLAN_REMEDIATION_PR_REVIEW`
