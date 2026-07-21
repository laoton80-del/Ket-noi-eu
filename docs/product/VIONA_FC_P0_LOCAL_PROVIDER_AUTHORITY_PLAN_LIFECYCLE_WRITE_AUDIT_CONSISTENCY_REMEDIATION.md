# VIONA — FC-P0 Local Provider Eligibility Authority  
## Plan Lifecycle / Write / Audit / Consistency Remediation

**Operator authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_LIFECYCLE_WRITE_AUDIT_CONSISTENCY_REMEDIATION`  
**Mode:** `DOCS_ONLY_NO_IMPLEMENTATION_NO_MIGRATION_NO_DEPLOY`  
**Baseline:** `origin/master` @ `dc5c625ce2afd5913737cc01111da4679fed6987` (PR #415 squash)  
**Reviewed PR #415 head:** `51b239d30166f5a07ef320a47df9f15012205945`  
**Branch:** `docs/viona-fc-p0-local-provider-authority-plan-lifecycle-remediation`  
**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_REMEDIATION_PR_REVIEW`

```text
VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_REMEDIATION
LIFECYCLE_WRITE_AUDIT_CONSISTENCY_LOCKED
ROLE_ADMIN_VIA_SUPERADMIN_MIDDLEWARE
A1_A2_B_SEQUENCE
FC_P0_STILL_BLOCKED
NO_IMPLEMENTATION
PACK_A_NOT_AUTHORIZED
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
| DRAFT | ACTIVE | Role.ADMIN | Business exists; name non-empty; `publicB2cVisible==true`; `supportedServiceTypes.length>=1` | `status=ACTIVE`; set `activatedAt`, `activatedByUserId`, `lastStatusChangedByUserId` | If already ACTIVE → same-state policy (§3) | `LOCAL_PROVIDER_ELIGIBILITY_ACTIVATED` | 200 + eligibility DTO | 400 invariants; 409 forbidden transition |
| DRAFT | RETIRED | Role.ADMIN | Eligibility exists | `status=RETIRED`; set `retiredAt`, `lastStatusChangedByUserId` | Same-state if already RETIRED | `LOCAL_PROVIDER_ELIGIBILITY_RETIRED` | 200 | 409 if forbidden |
| ACTIVE | SUSPENDED | Role.ADMIN | Eligibility ACTIVE | `status=SUSPENDED`; set `suspendedAt`, `lastStatusChangedByUserId` | Same-state if SUSPENDED | `LOCAL_PROVIDER_ELIGIBILITY_SUSPENDED` | 200 | 409 |
| ACTIVE | RETIRED | Role.ADMIN | Eligibility ACTIVE | `status=RETIRED`; set `retiredAt`, … | Same-state if RETIRED | `LOCAL_PROVIDER_ELIGIBILITY_RETIRED` | 200 | 409 |
| SUSPENDED | ACTIVE | Role.ADMIN | Same ACTIVE invariants as DRAFT→ACTIVE | `status=ACTIVE`; clear/update timestamps; set actors | Same-state if ACTIVE | `LOCAL_PROVIDER_ELIGIBILITY_ACTIVATED` | 200 | 400 / 409 |
| SUSPENDED | RETIRED | Role.ADMIN | Eligibility SUSPENDED | `status=RETIRED`; set `retiredAt` | Same-state if RETIRED | `LOCAL_PROVIDER_ELIGIBILITY_RETIRED` | 200 | 409 |
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

1. ACTIVE cannot PATCH to `publicB2cVisible=false` or empty `supportedServiceTypes` — **400**; must SUSPEND or RETIRE first.
2. DRAFT may have `publicB2cVisible=false` and empty types.
3. SUSPENDED may retain prior types/visibility config; **never** selectable.
4. RETIRED never selectable; terminal.

No valid `ACTIVE+private` or `ACTIVE+empty-types` persisted state.

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
If row exists for `businessId`: **200** return existing (idempotent); audit only on first create (`REGISTERED`).

Success first create: **201**.

### PATCH body

```ts
{ supportedServiceTypes?: LocalServiceType[]; publicB2cVisible?: boolean }
```

Require ≥1 field. Reject `status`, name, owner, payment, actor, timestamps, unknown keys (**400**).

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

Never include `suspensionReason` on model response (reason lives in audit only).

---

## 6. Lock — Audit mechanism (exact one)

**Cannot reuse `LocalServiceRequestAuditEvent`:** it requires `requestId` FK to `LocalServiceRequest` (`prisma/schema.prisma`, `createLocalRequestAuditEvent`). Overloading it would corrupt request-audit semantics.

**Locked mechanism:** new append-only model **`LocalProviderEligibilityAuditEvent`**, parallel design to Local request audit (`docs/architecture/VIONA_LOCAL_REQUEST_AUDIT_LOG_DESIGN_1.md` pattern):

| Field | Notes |
|---|---|
| `id` | uuid |
| `eligibilityId` | FK → `LocalProviderEligibility` Cascade |
| `businessId` | denormalized for query |
| `eventType` | enum below |
| `actorType` | `OPS` (reuse `LocalServiceRequestAuditActorType.OPS` or eligibility-local OPS-only enum — **Pack A1 locks reuse of `OPS`**) |
| `actorUserId` | Role.ADMIN user id |
| `fromStatus` / `toStatus` | eligibility status |
| `reason` | optional bounded suspend/retire |
| `safeMessage` | non-payment wording |
| `metadataJson` | prior/next `publicB2cVisible`, prior/next `supportedServiceTypes`; strip unsafe keys per `UNSAFE_LOCAL_REQUEST_AUDIT_METADATA_KEYS` |
| `createdAt` | now |

### Event types (exact)

- `LOCAL_PROVIDER_ELIGIBILITY_REGISTERED`
- `LOCAL_PROVIDER_ELIGIBILITY_CONFIG_UPDATED`
- `LOCAL_PROVIDER_ELIGIBILITY_ACTIVATED`
- `LOCAL_PROVIDER_ELIGIBILITY_SUSPENDED`
- `LOCAL_PROVIDER_ELIGIBILITY_RETIRED`

**No** `NO_CHANGE` event (idempotent same-state → no audit).

Service helper (Pack A2): `createLocalProviderEligibilityAuditEvent` mirroring `createLocalRequestAuditEvent` safety checks.

---

## 7. Lock — Suspend / retire reasons

**Policy:** optional `reason` on suspend/retire bodies only.

- Max length **280** characters after trim.
- Stored **only** on audit `reason` field — **not** on `LocalProviderEligibility` model.
- Never in B2C DTO.
- Reject if contains unsafe substrings analogous to request audit payment bans where applicable; no secrets/PII keys in metadata.

---

## 8. Lock — Create consistency

**Exact strategy:** Eligibility verification runs **inside** the existing `prisma.$transaction` in `createLocalServiceRequest` (today: create row + `createLocalRequestAuditEvent`).

Inside transaction:

1. Re-read `Business` + `LocalProviderEligibility` (via `tx`).
2. Verify selectable + service-type rules (ACTIVE, public, types, name).
3. Create `LocalServiceRequest`.
4. Create request `REQUEST_CREATED` audit.
5. Commit together.

**Isolation:** PostgreSQL / Prisma **default** (Read Committed). No custom `SET TRANSACTION` / unsupported locking SQL.

**Concurrency:** Client list is advisory. If suspension commits first, later create tx fails with `provider_not_available` → **404**. No create from stale client state alone.

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
→ getLocalProviders (controller symbol in LocalRequestController or dedicated file under controllers/local — Pack A2 implements as LocalRequestController.getLocalProviders to match existing Local surface)
→ listSelectableLocalProviders (service)
```

**Locked controller symbol for Pack A2:** `LocalRequestController.getLocalProviders` (no “or dedicated” alternative).

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
- enum event types for eligibility audit (or Prisma enum)
- tables `LocalProviderEligibility`, `LocalProviderEligibilityAuditEvent`
- unique on `businessId`
- indexes: `@@index([status, publicB2cVisible])`; `@@index([businessId])` on audit; `@@index([eligibilityId, createdAt])`
- **No GIN** on `supportedServiceTypes` for FC-P0 (small activated set; Prisma `has` filter sufficient)
- **Zero** INSERT/UPDATE of Business or eligibility activation
- **Zero** seed/backfill

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
**Depends on:** this remediation reviewed + merged + post-merge verified.

---

## 14. Expanded Pack A1/A2 test requirements

Include all cases listed in operator pack LOCK 14 (transitions 1–10, config 11–14, auth 15–17, audit 18–24, consistency/create 25–33, migration 34–38, read 39–43).

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

`READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_PLAN_REMEDIATION_PR_REVIEW`
