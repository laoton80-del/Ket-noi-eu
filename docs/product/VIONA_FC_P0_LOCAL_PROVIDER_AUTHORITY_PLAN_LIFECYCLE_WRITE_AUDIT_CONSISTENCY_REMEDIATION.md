# VIONA — FC-P0 Local Provider Eligibility Authority  
## Plan Lifecycle / Write / Audit / Consistency Remediation

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_LIFECYCLE_WRITE_AUDIT_CONSISTENCY_REMEDIATION`  
**Mode:** `DOCS_ONLY_NO_IMPLEMENTATION_NO_MIGRATION_NO_DEPLOY`  
**Baseline:** `origin/master` @ `dc5c625ce2afd5913737cc01111da4679fed6987` (PR #415 squash)  
**Reviewed PR #415 head:** `51b239d30166f5a07ef320a47df9f15012205945`  
**Branch:** `docs/viona-fc-p0-local-provider-authority-plan-lifecycle-remediation`  
**Primary classification:** `SUPERSEDED_IN_PART_BY_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION`

> **Supersession:** Where this document conflicts with  
> `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION.md`,  
> the audit-model / implementation-readiness remediation is authoritative (complete audit Prisma shape, actor enum, no-change PATCH, READ COMMITTED race matrix A–E, post-activation name policy, in-repo tests 1–43, Pack A1 card).

```text
VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_REMEDIATION
LIFECYCLE_WRITE_AUDIT_CONSISTENCY_LOCKED
ROLE_ADMIN_VIA_SUPERADMIN_MIDDLEWARE
A1_A2_B_SEQUENCE
FC_P0_STILL_BLOCKED
NO_IMPLEMENTATION
PACK_A_NOT_AUTHORIZED
SUPERSEDED_AUDIT_DETAILS_SEE_AUDIT_READINESS_REMEDIATION
```

---

## 0. Context

PR #415 merged the boundary plan. Strict review returned:

`BLOCKED_LOCAL_PROVIDER_STATUS_LIFECYCLE_UNRESOLVED`

(with co-gaps: write OR language, audit OR, create consistency, migration/tests).

This addendum **locks** those boundaries. Architecture from PR #415 remains:

- `MINIMAL_SCHEMA_EXTENSION_REQUIRED`
- `LocalProviderEligibility` 1:1 `Business`
- status enum `DRAFT | ACTIVE | SUSPENDED | RETIRED`
- authenticated `GET /api/local/providers`
- ops/`Role.ADMIN` authority
- `createLocalServiceRequest` server enforcement
- Pack sequence refined to **A1 → A2 → B** (below)

**FC-P0 remains blocked. Pack A1/A2/B are not authorized by this pack.**

---

## 1. Lock — Authority owner

**Exact:** `LOCAL_PROVIDER_AUTHORITY_OWNER_ROLE_ADMIN_VIA_SUPERADMIN_MIDDLEWARE`

**Source proof:** `src/middleware/superAdminMiddleware.ts` — after `authMiddleware`, loads `User.role` and allows only `Role.ADMIN`. Message text says “super-admin”; **no separate SUPERADMIN database role exists** (`prisma/schema.prisma` `enum Role` includes `ADMIN` only among admin roles).

All eligibility **mutation** routes: `authMiddleware` → `superAdminMiddleware`.

`Role.ADMIN` may: register, PATCH config, activate, suspend, retire.  
**No other role.** Merchant self-activation **forbidden**.

---

## 2. Lock — Status lifecycle

Statuses (exact): `DRAFT` | `ACTIVE` | `SUSPENDED` | `RETIRED`

**`RETIRED` is terminal.**

### Allowed transitions

| From | To | Allowed |
|---|---|---|
| DRAFT | ACTIVE | Yes |
| DRAFT | RETIRED | Yes |
| ACTIVE | SUSPENDED | Yes |
| ACTIVE | RETIRED | Yes |
| SUSPENDED | ACTIVE | Yes |
| SUSPENDED | RETIRED | Yes |

### Forbidden transitions

| From | To |
|---|---|
| ACTIVE | DRAFT |
| SUSPENDED | DRAFT |
| RETIRED | DRAFT |
| RETIRED | ACTIVE |
| RETIRED | SUSPENDED |
| DRAFT | SUSPENDED | (must activate first, or retire) |

No reset-to-DRAFT operation.

### Transition table

| Current | Target | Caller | Preconditions | Postconditions | Idempotency | Audit | Success | Invalid |
|---|---|---|---|---|---|---|---|---|
| DRAFT | ACTIVE | Role.ADMIN | Business exists; name non-empty; `publicB2cVisible==true`; `supportedServiceTypes.length>=1` | `status=ACTIVE`; set `activatedAt` | If already ACTIVE → same-state policy (§3) | `ACTIVATED` | 200 + eligibility DTO | 409 invariants or forbidden |
| DRAFT | RETIRED | Role.ADMIN | Eligibility exists | `status=RETIRED`; set `retiredAt` | Same-state if already RETIRED | `RETIRED` | 200 | 409 if forbidden |
| ACTIVE | SUSPENDED | Role.ADMIN | Eligibility ACTIVE | `status=SUSPENDED`; set `suspendedAt` | Same-state if SUSPENDED | `SUSPENDED` | 200 | 409 |
| ACTIVE | RETIRED | Role.ADMIN | Eligibility ACTIVE | `status=RETIRED`; set `retiredAt` | Same-state if RETIRED | `RETIRED` | 200 | 409 |
| SUSPENDED | ACTIVE | Role.ADMIN | Same ACTIVE invariants as DRAFT→ACTIVE | `status=ACTIVE`; clear/update timestamps | Same-state if ACTIVE | `ACTIVATED` | 200 | 409 |
| SUSPENDED | RETIRED | Role.ADMIN | Eligibility SUSPENDED | `status=RETIRED`; set `retiredAt` | Same-state if RETIRED | `RETIRED` | 200 | 409 |
| * | * (forbidden) | Role.ADMIN | — | unchanged | N/A | **no** audit (no mutation) | — | **409** `invalid_status` (Local confirm/cancel convention) |
| any | same | Role.ADMIN | — | unchanged | **§3** | **no** mutation audit | **200** current DTO | — |

---

## 3. Lock — Same-state idempotency

Repeated same-state commands (`DRAFT→DRAFT`, `ACTIVE→ACTIVE`, `SUSPENDED→SUSPENDED`, `RETIRED→RETIRED`):

- **No** duplicate logical transition.
- Return **200** with current ops eligibility representation.
- **No mutation audit event** (audit only actual changes — matches Local request audit practice of writing events on real lifecycle changes, not no-ops).

Invalid cross-state transitions: **409** with safe message (e.g. `Invalid provider eligibility status transition`) — mirrors `LocalRequestController` `invalid_status: 409`. Do not expose internal enum dump.

---

## 4. Lock — ACTIVE invariants

`status == ACTIVE` **requires all of:**

1. `publicB2cVisible === true`
2. `supportedServiceTypes.length > 0` (canonical `LocalServiceType` only)
3. Linked `Business` exists
4. `Business.name.trim().length > 0`

**Update rules:**

1. ACTIVE cannot PATCH to `publicB2cVisible=false` or empty `supportedServiceTypes` — **409**; must SUSPEND or RETIRE first.
2. DRAFT may have `publicB2cVisible=false` and empty types.
3. SUSPENDED may retain prior types/visibility config; **never** selectable.
4. RETIRED never selectable; terminal.
5. After activation, if `Business.name` becomes empty/invalid: **do not** silently mutate eligibility; exclude from B2C list and create (404); ops may repair name or suspend/retire.

No valid `ACTIVE+private` or `ACTIVE+empty-types` persisted state via PATCH/activate.

---

## 5. Lock — Exact write routes

Middleware order (all mutations): `localRouter` `authMiddleware` → route `superAdminMiddleware` → handler.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/local/ops/providers` | Register DRAFT eligibility; idempotent if row exists |
| `PATCH` | `/api/local/ops/providers/:businessId` | Config only (`supportedServiceTypes`, `publicB2cVisible`); **no** status change |
| `POST` | `/api/local/ops/providers/:businessId/activate` | Transition → ACTIVE |
| `POST` | `/api/local/ops/providers/:businessId/suspend` | Transition → SUSPENDED |
| `POST` | `/api/local/ops/providers/:businessId/retire` | Transition → RETIRED |

**Forbidden:** upsert-or-PATCH OR language; generic status body; merchant/public self-service.

### POST register body

```ts
{ businessId: string; supportedServiceTypes?: LocalServiceType[]; publicB2cVisible?: boolean }
```

Defaults: `status=DRAFT`, `supportedServiceTypes=[]`, `publicB2cVisible=false`.  
If row exists for `businessId`: **200** return existing (idempotent); **do not overwrite** configuration; **do not** change `updatedAt`; audit only on first create (`REGISTERED`).

Success first create: **201**.

### PATCH body

```ts
{ supportedServiceTypes?: LocalServiceType[]; publicB2cVisible?: boolean }
```

Require ≥1 field. Reject `status`, name, owner, payment, actor, timestamps, unknown keys (**400**).

**No-change PATCH** (validated body equals current config): **200** + current ops DTO; **no** Prisma update; **`updatedAt` unchanged**; **no** `CONFIG_UPDATED` audit.

**Changing PATCH:** one eligibility update; `updatedAt` changes; exactly one `CONFIG_UPDATED` with explicit prior/next columns in the same transaction.

### Transition bodies

```ts
{ reason?: string } // optional; max 280 chars; audit-only; never B2C
```

Empty body allowed.

### Ops response DTO (mutations)

```ts
{
  businessId: string;
  status: LocalProviderEligibilityStatus;
  publicB2cVisible: boolean;
  supportedServiceTypes: LocalServiceType[];
  activatedAt: string | null;
  suspendedAt: string | null;
  retiredAt: string | null;
  updatedAt: string;
}
```

Never include suspension/retire reasons on eligibility model or ops response DTO beyond what the audit-readiness remediation allows (reasons live on audit events only).

---

## 6. Lock — Audit mechanism (exact one)

**Cannot reuse `LocalServiceRequestAuditEvent`:** it requires `requestId` FK to `LocalServiceRequest`.

**Authoritative complete model:** see audit-readiness remediation §§2–5.

Summary (must match that doc — no alternatives):

- Model: `LocalProviderEligibilityAuditEvent`
- Event enum: `LocalProviderEligibilityAuditEventType` = `REGISTERED | CONFIG_UPDATED | ACTIVATED | SUSPENDED | RETIRED`
- Actor enum: `LocalProviderEligibilityAuditActorType` = `ROLE_ADMIN` only; plus required `actorUserId`
- Explicit prior/next status, visibility, and `supportedServiceTypes` columns — **no** `metadataJson`
- `eligibilityId` FK with `onDelete: Restrict`
- Append-only create-only at application boundary
- Pack A2 owns event writes; Pack A1 owns schema only

Service helper (Pack A2): `createLocalProviderEligibilityAuditEvent`.

---

## 7. Lock — Suspend / retire reasons

**Policy:** optional `reason` on suspend/retire bodies only.

- Max length **280** characters after trim.
- Stored **only** on audit `reason` field — **not** on `LocalProviderEligibility` model (no `suspensionReason` / `retirementReason` columns).
- Never in B2C DTO.
- Reject unsafe payment/secret substrings where applicable.

---

## 8. Lock — Create consistency

**Exact strategy:** Eligibility verification runs **inside** the existing `prisma.$transaction` in `createLocalServiceRequest` (today: create row + `createLocalRequestAuditEvent`).

Inside transaction:

1. Re-read `Business` + `LocalProviderEligibility` (via `tx`).
2. Verify selectable + service-type rules (ACTIVE, public, types, name).
3. Create `LocalServiceRequest`.
4. Create request `REQUEST_CREATED` audit.
5. Commit together.

**Isolation:** PostgreSQL / Prisma **default** (Read Committed). No custom `SET TRANSACTION` / row locks / SERIALIZABLE / unsupported locking SQL.

**Bounded guarantee (exact):**

- Stale client list never authorizes create.
- Suspension committed before create’s authoritative eligibility read → create fails (404).
- Create that authoritatively read ACTIVE before concurrent suspension commits → create **may** complete.
- After suspension commits, later reads reject.
- Request + request audit atomic.
- Does **not** claim “no create may commit after suspension commits” in the stronger sense.

Race matrix A–E: see audit-readiness remediation §10.

Pre-transaction checks may exist for fast-fail but are **not** authority.

---

## 9. Lock — Create failure mapping

| Case | HTTP | Safe error |
|---|---|---|
| Unknown Business | 404 | existing `Business not found` |
| No eligibility / DRAFT / SUSPENDED / RETIRED / ACTIVE+not public / empty types | 404 | `Provider not available` |
| Unsupported `serviceType` | 400 | validation (no internal status leak) |
| Self-request | 400 | existing |
| Invalid transition on ops routes | 409 | status transition |
| Unauthorized ops | 401 / 403 | existing superAdmin |

No create-specific 403/409 for eligibility miss (use 404).

---

## 10. Lock — Read route architecture

```
GET /api/local/providers
→ authMiddleware (router)
→ validateLocalProviderListQuery
→ LocalRequestController.getLocalProviders
→ listSelectableLocalProviders (service)
```

**Locked controller symbol for Pack A2:** `LocalRequestController.getLocalProviders`.

| Aspect | Lock |
|---|---|
| Auth | JWT B2C (`authMiddleware`) |
| Default limit | 50 |
| Max limit | 100 |
| skip | ≥ 0 |
| Optional `serviceType` | canonical enum or 400 |
| Order | `Business.name asc`, `Business.id asc` |
| Filter | ACTIVE ∧ publicB2cVisible ∧ types.length≥1 ∧ name non-empty |
| Malformed row | exclude from list (skip); do not 500 entire page |

### Envelope (repository-consistent)

`jsonOk` wraps `{ success: true, data }`. Data shape matches ops list style:

```ts
{
  items: LocalProviderPublicDto[];
  pagination: { limit: number; skip: number; returned: number };
}
```

No `hasMore` (ops Local list uses `returned` only).

---

## 11. Lock — Safe public DTO

```ts
type LocalProviderPublicDto = {
  businessId: string;
  displayName: string; // Business.name
  supportedServiceTypes: LocalServiceType[];
};
```

**`categoryLabel` omitted in FC-P0** — `Business.category` is Tourism-oriented `BizType`; pack forbids fabricating Local category from it.

Exclude: owner, contact, tax, payment, settlement, scores, suspension/audit, VietQR, secrets.

---

## 12. Lock — Migration boundary

**Filename convention (repository format):**

`YYYYMMDDHHMMSS_add_local_provider_eligibility_authority`

Example: `20260721220000_add_local_provider_eligibility_authority`

**Contents:**

- enum `LocalProviderEligibilityStatus`
- enum `LocalProviderEligibilityAuditEventType`
- enum `LocalProviderEligibilityAuditActorType`
- tables `LocalProviderEligibility`, `LocalProviderEligibilityAuditEvent`
- unique on `businessId`
- indexes: `@@index([status, publicB2cVisible])`; audit `@@index([eligibilityId, createdAt])`, `@@index([businessId, createdAt])`, `@@index([actorUserId, createdAt])`, `@@index([eventType, createdAt])`
- **No GIN** on `supportedServiceTypes` for FC-P0 (small activated set; Prisma `has` filter sufficient)
- **Zero** INSERT/UPDATE of Business or eligibility activation
- **Zero** seed/backfill
- **No** `suspensionReason` column on eligibility

**Canonical statement:**

> **ALL EXISTING BUSINESS ROWS REMAIN INELIGIBLE AFTER MIGRATION UNTIL AN AUTHORIZED `Role.ADMIN` OPERATOR REGISTERS AND ACTIVATES THEM.**

**Rollback:** drop new structures only; requires separate authorization for production. No activated data created by migration.

---

## 13. Lock — Implementation sequence (exact one)

**A1 → A2 → B** (combined Pack A rejected for reviewability: schema/domain/create vs HTTP/ops/audit are different risk surfaces).

| Pack | Name | Includes | Excludes |
|---|---|---|---|
| **A1** | Schema and Domain Enforcement | schema + structure migration; domain helpers; selectability rules; transactional create enforcement; model/domain/create tests | read route; ops routes; client; deploy |
| **A2** | Read and Ops Control Routes | `GET /api/local/providers`; ops register/PATCH/activate/suspend/retire; eligibility audit writer; route tests | client; deploy; activation of real staging rows |
| **B** | Client Wiring | consume GET; replace `PROVIDER_SELECTION_UNAVAILABLE`; preserve UUID/Tourism bans + submit guard | schema; backend |

### Immediate next pack (unauthorized)

**Name:** FC-P0 Local Provider Eligibility Authority — Schema and Domain Enforcement  

**Phrase:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_ELIGIBILITY_AUTHORITY_SCHEMA_DOMAIN_ENFORCEMENT`

**Mode:** `IMPLEMENTATION_ONLY_NO_DEPLOY`  
**Depends on:** audit-model / implementation-readiness remediation reviewed + merged + post-merge verified.

Full Pack A1 card (schema, tests 1–29, success/blocker classifications): see audit-readiness remediation §14.

---

## 14. Expanded Pack A1/A2 test requirements

**Authoritative numbered matrix (exactly 43 cases):**  
`docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION.md` §13.

A1 owns cases **1–29**; A2 owns cases **30–43**. Do not cite external “operator LOCK 14” alone.

Pack B retains prior client behavioral tests from containment lineage.

---

## 15. Selectability rules (restated, unchanged intent)

`IS_LOCAL_PROVIDER_SELECTABLE(businessId)` = Business exists ∧ eligibility exists ∧ ACTIVE ∧ publicB2cVisible ∧ name non-empty ∧ types.length≥1  

`IS_LOCAL_PROVIDER_ALLOWED_FOR_SERVICE_TYPE` = selectable ∧ serviceType ∈ supportedServiceTypes  

Self-request ban remains create-time integrity (not list filter).

---

## 16. Confirmations

- No src/schema/migration/runtime/deploy in this pack  
- FC-P0 still blocked  
- `REQUEST_ONLY_NO_CHARGE` preserved  
- Pack40S unauthorized; Apple/EAS/Phase D2 deferred; Phase C closed green  
- AI hard-stop not started  

---

## 17. Final classification

`SUPERSEDED_IN_PART_BY_AUDIT_MODEL_AND_IMPLEMENTATION_READINESS_REMEDIATION`

Lifecycle/write route locks remain; audit completeness / PATCH / race / tests / A1 card are finalized in the audit-readiness remediation.
