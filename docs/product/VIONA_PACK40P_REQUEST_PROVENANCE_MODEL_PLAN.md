# Pack40P — Server-Owned VionaRequest Provenance Model Plan

Status: **PLANNING ONLY** — docs-only architecture and migration planning. No product code, Prisma
schema edit, migration file, database access, deployment, backfill, or Pack40A enforcement is
authorized by this document.

Operator context: unblocks Pack40 tenant-sensitive access enforcement by replacing free-text
`tenantId`-as-provenance with **server-owned scope classification** on `VionaRequest`.

Verified planning baseline: `origin/master` @ `a4619a13ce8bab5d170c3f4a730e9bbaa25298b3` (includes
Pack40A inventory evidence via PR #342).

Related documents:

- `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md` — access enforcement (Pack40A–D)
- `docs/product/VIONA_PACK40A_TENANT_PROVENANCE_INVENTORY_EVIDENCE.md` — staging inventory

---

## 1. Executive summary

Pack40A staging inventory (`APPROVE_PACK40A_READ_ONLY_TENANT_PROVENANCE_INVENTORY`) confirmed:

- 10 staging requests, **5 registry-matched** (all webhook-positive), **5 unresolved** (not consumer).
- **No canonical consumer representation** exists in source or staging.
- **`tenantId` alone cannot support fail-closed Pack40A access policy.**

**Pack40P recommendation:** add an additive Prisma enum + columns on `VionaRequest`:

| Concept | Proposed name |
|---|---|
| Scope enum | `VionaRequestScopeKind` — `consumer` \| `merchant` \| `legacyUnresolved` |
| Scope column | `scopeKind` — DB default **`legacyUnresolved`** (fail-safe) |
| Merchant link | `merchantProfileId String?` + optional `MerchantProfile` relation |

**Authorization predicate becomes `scopeKind` (+ merchant FK equality for merchant rows), not
client `tenantId`.** Existing rows migrate to `legacyUnresolved` only — **never auto-consumer,
never auto-merchant from registry match alone.**

Execution is sliced into **Pack40P1 → P3 → P2 → P2D → P4D/P4W → P5** with explicit
**deployment locks** (schema-dependent application must not deploy before migration apply on each
environment). **Pack40A remains blocked** until Pack40P definition-of-ready is met.

---

## 2. Verified source and staging findings

### 2.1 Source (merged master)

| Fact | Evidence |
|---|---|
| `VionaRequest.tenantId` required, non-null | `prisma/schema.prisma` |
| Pack19 create: client supplies `tenantId` | `vionaRequestCreateService.ts`, `VionaRequestController.ts` |
| Pack35 webhook create: server supplies merchant tenant | `vionaRequestCreateFromWebhookService.ts`, channel resolution |
| No consumer sentinel / provenance field | Source audit Pack40 v3 + Pack40A inventory |
| Only 2 production `vionaRequest.create` paths | Grep verified |
| `webhookMessageAccepted` audit type | `vionaRequestAuditEventTypes.ts`, Pack35 create service |
| `MerchantProfile` has no delete API | `vionaMerchantProfileService.ts` — create/read/update persona/tools only |
| Webhook channel uses id-only reference to profile | `VionaMerchantWebhookChannel.merchantProfileId` — no Prisma relation (Pack35 pattern) |

### 2.2 Staging inventory aggregates (PR #342)

See `docs/design/evidence/pack40a-tenant-provenance-inventory/summary.json`:

- `totalRequests`: 10
- `merchantTenantMatchedRequests`: 5 (webhook-associated, owner-aligned)
- `merchantTenantUnmatchedRequests`: 5
- `canonicalConsumerProvenanceConfirmed`: **false**

**Production boundary:** staging counts must not be extrapolated. Production requires separate
read-only inventory and migration review before any apply/backfill.

---

## 3. Problem statement

1. **`tenantId` mixes untrusted client categorization (Pack19) with trusted merchant identity
   (Pack35).**
2. **Required free-text `tenantId` cannot prove consumer provenance.**
3. **Registry absence cannot prove consumer provenance** (Pack40 v3 rejected rule).
4. **Existing unresolved rows cannot be safely reclassified from patterns, frequency, or fixtures.**
5. **Authorization must not rely on arbitrary Pack19 `tenantId` values.**
6. **Pack40A read/note/status enforcement cannot proceed until provenance is server-owned.**

---

## 4. Threat model

| Threat | Today | After Pack40P + Pack40A |
|---|---|---|
| Client sets merchant tenant via Pack19 body | Row stored with arbitrary tenant; owner scope grants access | New rows: `scopeKind=consumer`; tenantId non-authoritative for access |
| Owner accesses cross-merchant tenant row | Allowed if user-scope matches | `scopeKind=merchant` requires FK match; unresolved fail closed |
| Infer consumer from unmatched tenant | Pack40 v2 rejected | `legacyUnresolved` fail closed |
| Backfill mislabels consumer | N/A | **No consumer backfill path** |
| Merchant profile deleted | No delete API today | `onDelete: Restrict` — deletion blocked while requests reference profile |
| Rolling deploy old code without column | N/A | **P1 deployment lock:** no app deploy until migration applied per environment; old instances write `legacyUnresolved` during P2D window |

---

## 5. Options considered

| Option | Assessment |
|---|---|
| **A. Tenant sentinel only** (`tenantId = '__consumer__'`) | **Rejected as primary.** Still conflates identity with authorization; Pack40A would need known `C`; does not positively mark merchant rows; sentinel not in source today. |
| **B. Provenance enum only (no MerchantProfile FK)** | **Insufficient for merchant rows.** Cannot positively link to profile ID; tenant snapshot-only remains ambiguous. |
| **C. Enum + optional MerchantProfile relation (RECOMMENDED)** | Positive consumer (`consumer`), positive merchant (`merchant` + FK), fail-safe default (`legacyUnresolved`). Matches inventory findings. |
| **D. Replace `tenantId` entirely** | **Deferred.** High breaking change; retain `tenantId` as compatibility snapshot; cleanup is separate future pack. |

---

## 6. Recommended provenance model

### 6.1 Prisma additions (planning names — implemented in Pack40P1)

```prisma
enum VionaRequestScopeKind {
  consumer
  merchant
  legacyUnresolved
}

model VionaRequest {
  // ... existing fields unchanged ...
  scopeKind         VionaRequestScopeKind @default(legacyUnresolved)
  merchantProfileId String?
  merchantProfile   MerchantProfile?      @relation(fields: [merchantProfileId], references: [id], onDelete: Restrict)

  @@index([scopeKind])
  @@index([merchantProfileId])
}

model MerchantProfile {
  // ... existing fields ...
  vionaRequests VionaRequest[]
}
```

### 6.2 Semantics

1. **Existing rows** → `legacyUnresolved` at migration apply (only).
2. **DB default** → `legacyUnresolved` (fail-safe; omission never grants consumer access).
3. **New create paths** explicitly assign scope.
4. **Missing assignment** in any future path → default `legacyUnresolved`.
5. **`merchantProfileId` nullable** for consumer and legacy rows.
6. **Merchant rows** set FK when profile is known (Pack35).
7. **`tenantId` retained** as merchant tenant snapshot / legacy metadata — **not sufficient alone for authorization.**
8. **Client cannot set** `scopeKind` or `merchantProfileId` (DTO/controller rejection).

### 6.3 Tenant sentinel review

**Do not use a tenant sentinel as the primary provenance mechanism.** Do not require Pack40A queries
to know consumer tenant value `C`. Use **`scopeKind = consumer`** as the positive consumer predicate.
Retain client Pack19 `tenantId` temporarily as **non-authoritative stored metadata** (see §9.1).

---

## 7. Field and relation semantics

| Field | Consumer | Merchant | Legacy unresolved |
|---|---|---|---|
| `scopeKind` | `consumer` | `merchant` | `legacyUnresolved` |
| `merchantProfileId` | `null` | trusted profile UUID | `null` |
| `tenantId` | legacy metadata (Pack19 body) or future server placeholder | `MerchantProfile.tenantId` snapshot | unchanged historical value |

**Consistency invariant (merchant rows):** at create time,
`tenantId === MerchantProfile.tenantId` for linked profile. Pack40A may re-check as defense-in-depth;
mismatch → treat as unresolved / deny.

**MerchantProfile relation:**

- **`onDelete: Restrict`** — no cascade delete of requests; profile deletion must remain impossible
  or require explicit unlink workflow (future). Today **no delete API exists** — preserve that.
- **Deactivation (`isActive: false`)** does not alter `scopeKind` or FK — activation is operational
  gate only (Pack40 access policy).
- **Uniqueness:** no unique constraint on `merchantProfileId` per request (one request → one profile);
  multiple requests may reference same profile.

---

## 8. Access policy target (future Pack40A)

Replaces tenant-registry inference in Pack40 v3.

### 8.1 Consumer request

- `scopeKind = consumer`
- Existing user authorization (requester / owner / participant)
- **No** `MerchantProfile` equality required because actor also has a merchant profile (dual-role safe)

**Bounded list where (merchant actor):**

```text
userScope AND (scopeKind = consumer OR (scopeKind = merchant AND merchantProfileId = actorProfileId))
```

No global `NOT IN`, no per-row profile lookup beyond actor context.

### 8.2 Merchant request

- `scopeKind = merchant`
- User authorization passes
- Actor has trusted server-resolved `MerchantProfile`
- `request.merchantProfileId === actor.merchantProfileId`
- Optional: `request.tenantId === actor.merchant.tenantId` consistency check
- Client `tenantId` never expands access

### 8.3 Legacy unresolved request

- `scopeKind = legacyUnresolved`
- **Fail closed** on Pack40 tenant-sensitive generic routes
- External: `request_not_found` / HTTP 404
- **No** silent fallback to consumer authorization

### 8.4 Operator recovery

**No broad bypass** in Pack40A. Temporary support recovery (manual DB correction under separate
operator phrase) is **out of scope** — document as future ops runbook only. Default: unresolved stays
unreadable until positive backfill or support intervention under Pack40P4W rules.

### 8.5 Inactive merchant (unchanged from Pack40 v3)

| Route | Policy |
|---|---|
| Pack40A read | Matching inactive merchant **may read** merchant-scoped rows |
| Pack40B note | **Active** merchant required |
| Pack40C status | **Active** merchant required |
| Dispatcher / tools | Existing active gates unchanged |

---

## 9. Create-path behavior

### 9.0 Core rule — `scopeKind` reflects creation path, not actor account type

`scopeKind` is **creation-path provenance**, not a classification of the authenticated user's account.

| Rule | Requirement |
|---|---|
| Dual-role users | A user may simultaneously be a consumer/direct user **and** the owner of a `MerchantProfile`. |
| MerchantProfile possession | Owning a `MerchantProfile` **does not** cause every request that user creates to become merchant-scoped. |
| Pack19 path | Always assigns `scopeKind = consumer`, `merchantProfileId = null` — **even when** the authenticated user also owns a `MerchantProfile`. |
| Client `tenantId` | Non-authoritative compatibility metadata during transition; **can never** elevate a Pack19 row to merchant provenance. |
| Merchant provenance | Requires a creation path that **positively resolves** `MerchantProfile` server-side (Pack35 today). |
| Future merchant UI | A separately reviewed server-side merchant creation path is required; must **never** convert Pack19 consumer creation into merchant merely because the actor has a `MerchantProfile`. |

**Source verification:** only two production `vionaRequest.create` paths exist — Pack19 JWT
(`VionaRequestController` → `createVionaRequest`) and Pack35 webhook
(`createVionaRequestFromWebhookMessage`). No established merchant-scoped Pack19 business flow was found.

### 9.1 Pack19 JWT create (`createVionaRequest`)

**Verified:** Pack19 is the **only authenticated direct-user (consumer-path) create endpoint**
(staging-testable; not production-ready per existing safety labels). It is **not** a merchant-scoped
creation path.

| Field | Server assignment |
|---|---|
| `scopeKind` | **`consumer`** — assigned by server based on **route/path**, regardless of whether `ownerUserId` also owns a `MerchantProfile` |
| `merchantProfileId` | **`null`** — always for Pack19 |
| `tenantId` | **Compatibility:** continue accepting client body value **as non-authoritative metadata** stored in existing column; **must not** drive access after Pack40A; **must not** imply merchant scope even when value matches a registry tenant. Document deprecation in API contract; removal is separate pack. **Do not** silently change response shape in Pack40P2. |

**Dual-role invariant (Pack40P2 tests must prove):** merchant-profile owner calling Pack19 receives
`scopeKind = consumer`, `merchantProfileId = null`. Client-supplied `tenantId` matching a merchant
registry value does **not** create `scopeKind = merchant`.

Client body must **not** accept `scopeKind` or `merchantProfileId` keys (screen via existing
forbidden-key patterns if added).

### 9.2 Pack35 webhook create (`createVionaRequestFromWebhookMessage`)

| Field | Server assignment |
|---|---|
| `scopeKind` | **`merchant`** |
| `merchantProfileId` | Resolved channel's `MerchantProfile.id` (already available upstream) |
| `tenantId` | Trusted `MerchantProfile.tenantId` (unchanged) |

No change to signature verification, rate limiting, standing approval, dispatch, or audit event types.

### 9.3 Future paths

Every new `vionaRequest.create` call site must explicitly set `scopeKind` (+ merchant FK when
applicable). Omission → DB default `legacyUnresolved`.

---

## 10. Migration design (Pack40P1 — files only, not applied in P1)

Proposed migration: `20260714120000_pack40p_add_viona_request_scope_provenance/migration.sql`

```sql
-- Pack40P — additive scope provenance. No existing column dropped or rewritten.

CREATE TYPE "VionaRequestScopeKind" AS ENUM ('consumer', 'merchant', 'legacyUnresolved');

ALTER TABLE "VionaRequest"
  ADD COLUMN "scopeKind" "VionaRequestScopeKind" NOT NULL DEFAULT 'legacyUnresolved',
  ADD COLUMN "merchantProfileId" TEXT;

ALTER TABLE "VionaRequest"
  ADD CONSTRAINT "VionaRequest_merchantProfileId_fkey"
  FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "VionaRequest_scopeKind_idx" ON "VionaRequest"("scopeKind");
CREATE INDEX "VionaRequest_merchantProfileId_idx" ON "VionaRequest"("merchantProfileId");
```

**Safety properties:**

1. No table recreation.
2. No destructive column replacement.
3. **All existing rows become `legacyUnresolved` via DEFAULT** — no UPDATE statement in migration.
4. **No row becomes `consumer` during migration.**
5. **No row becomes `merchant` from tenantId registry match in migration.**
6. Migration apply **separated** from backfill (Pack40P4).
7. Rollback: drop FK + columns + enum (forward-fix documented in §17).
8. Indexes justified by Pack40A list filter on `scopeKind` and merchant FK equality.
9. Hand-authored SQL following Pack34 pattern; address shadow-DB replay separately (pre-existing TourismBooking issue — do not fix in Pack40P1).

---

## 11. Backfill policy (Pack40P4 — separately authorized)

### 11.1 Allowed merchant candidate (ALL required)

A row may be backfilled to `scopeKind = merchant` **only if all** hold:

1. **Positive webhook evidence:** ∃ audit event `eventType = 'webhookMessageAccepted'` for `requestId`.
2. **Exact tenant match:** `VionaRequest.tenantId = MerchantProfile.tenantId` (trimmed equality).
3. **Resolvable profile:** exactly one `MerchantProfile` row for that `tenantId` (unique constraint guarantees).
4. **Owner alignment:** `VionaRequest.ownerUserId = MerchantProfile.ownerUserId` (reliable on webhook-created rows).
5. **No ambiguity:** no duplicate profile mapping; no conflicting audit evidence.

**Registry match alone is insufficient** without webhook evidence (staging has 0 non-webhook matched rows).

### 11.2 Forbidden

- **No automatic consumer backfill.**
- **No backfill from fixture labels, frequency, or patterns.**
- **No production backfill** without separate inventory + authorization.
- Staging's 5 webhook rows **do not** prove production safety.

### 11.3 Script behavior (future)

- Idempotent: skip rows already `merchant` with same FK.
- Dry-run (Pack40P4D): aggregates + candidate counts only — no writes.
- Write (Pack40P4W): staging only; stop on ambiguity; evidence doc required.

---

## 12. Production boundary

- Staging inventory ≠ production inventory.
- No production rollout or backfill authorized by Pack40P planning.
- Production requires `APPROVE_PACK40P_PRODUCTION_PROVENANCE_INVENTORY` (future phrase, not defined here) + migration review.

---

## 13. Safe rollout ordering

### 13.1 Prisma schema deployment hazard

After Pack40P1 merges, `schema.prisma` and generated Prisma Client expectations include the new
provenance fields (`scopeKind`, `merchantProfileId`) while a target environment database may still
lack those columns.

Deploying application code built from that master state **before** applying the Pack40P1 migration
to the **same environment** may cause runtime queries to reference columns that do not yet exist.

**Required invariant (per environment):**

```text
After Pack40P1 merges, no application deployment from that master
is allowed to an environment until the Pack40P1 migration has been
successfully applied and verified on that same environment.
```

Staging and production are **independent**. A migration applied to staging does **not** authorize
deploying the same schema-dependent application to production.

**Repository deploy model:** master merge does **not** auto-deploy. Fly staging deploys require
explicit operator authorization (`fly deploy --app viona-api-staging-eu --remote-only` per Pack36A/39
precedent). The P1 deployment lock is therefore **process-enforced** via authorization phrases and
evidence docs — not CI-blocked today.

### 13.2 Pack40P1 state markers (required in P1 PR body + evidence doc)

After P1 merge, canonical state:

```text
SCHEMA_COMMITTED_MIGRATION_NOT_APPLIED
DEPLOYMENT_BLOCKED_FOR_ENVIRONMENTS_WITHOUT_MIGRATION
```

After successful P3 staging migration apply:

```text
STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED
```

This marker does **not** imply production readiness.

### 13.3 Exact safe staging sequence

| Step | Slice | Action | Deploy? | Migrate? | Backfill? |
|---|---|---|---|---|---|
| **1** | **P1** | Merge additive Prisma schema + migration file; activate deployment lock | **No** | **No apply** | No |
| **2** | **P3** | Apply merged migration to **staging only**; verify ledger, columns, enum, indexes; verify all existing rows `legacyUnresolved`; verify currently deployed **old** application remains healthy | **No** | **Yes (staging)** | No |
| **3** | **P2** | Implement Pack19/Pack35 provenance assignment; local tests; merge code | **No** | No | No |
| **4** | **P2D** | Deploy verified merged master (contains P2) to `viona-api-staging-eu`; health + bounded logs | **Yes (staging only)** | No | No |
| **5** | **P4D** | Merchant positive-evidence backfill dry run | No | No | No (read-only) |
| **6** | **P4W** | Approved staging merchant backfill write | No | No | Yes (staging) |
| **7** | **P5** | Post-rollout verification (creates, backfill, rolling window) | No | No | No |
| **8** | **Pack40A review** | Readiness review only — separate phrase | — | — | — |

**Merge-order recommendation (safest for this repository):**

1. **P1 merge** → deployment lock active.
2. **P3 execute on staging** → release staging deployment lock for schema readiness only.
3. **P2 merge** → code on master but **not deployed** until P2D phrase.
4. **P2D deploy staging** → explicit application rollout.

P2 **may be prepared** (branch/PR) before P3, but **must not merge to master until P3 staging
migration succeeds**, unless release discipline explicitly prevents accidental deploy to unmigrated
environments. Because deploy is manual and not CI-gated, **prefer P3 before P2 merge**.

Production follows the same per-environment invariant independently (future phrases; not authorized here).

### 13.4 Rolling deployment window (P2D)

While old and new application instances coexist after P2D begins:

| Actor | Behavior |
|---|---|
| **Old instance** | Does not explicitly assign `scopeKind`; DB default → `legacyUnresolved` |
| **New instance — Pack19** | Assigns `scopeKind = consumer`, `merchantProfileId = null` |
| **New instance — Pack35** | Assigns `scopeKind = merchant`, `merchantProfileId = resolved profile.id` |

**Policy:**

1. DB default remains `legacyUnresolved` (fail-safe).
2. Old-instance writes during rollout remain fail-safe unresolved.
3. **No** old-instance row is automatically classified as consumer.
4. Webhook rows created by old instances may later qualify for positive-evidence merchant backfill (P4).
5. Direct-user rows created by old instances remain unresolved unless separately authorized remediation obtains positive provenance.
6. P5 must record the bounded deployment window (timestamps, machine count if available).
7. P5 must verify requests created **after all machines run the new version** receive explicit provenance.
8. **Pack40A must not be enabled** while newly created rows continue unexpectedly defaulting to unresolved after rollout completion.

### 13.5 Authorization vs deployment (explicit non-implication)

| Phrase | Does **NOT** authorize |
|---|---|
| `APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION` | Migration apply; application deploy |
| `APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING` | **Application deployment**; migration apply; backfill |
| `APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY` | **Application deployment**; backfill; production |
| `APPROVE_PACK40P2D_STAGING_CREATE_PATH_PROVENANCE_DEPLOY` | Migration; secrets; backfill; Pack40A; production |
| `APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION` | Missing P2D deployment; Pack40A; backfill writes |

**Pre-P2D deploy is explicitly blocked:** deploying P1 schema-generated application before migration
apply on the target environment violates the deployment lock.

---

## 14. Implementation slicing (Pack40P1–P5 + P2D)

| Slice | Phrase | Scope | Deploy? |
|---|---|---|---|
| **P1** | `APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION` | Prisma enum/fields/relation/indexes + migration SQL file; schema tests; state markers; **no apply, no deploy** | **No** |
| **P3** | `APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY` | Staging `migrate deploy` only; verify all existing `legacyUnresolved`; old app health; **does not authorize app deploy** | **No** |
| **P2** | `APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING` | Pack19 consumer + Pack35 merchant assignment; DTO screening; dual-role tests; local tests; **does not authorize deploy, migrate apply, or backfill** | **No** |
| **P2D** | `APPROVE_PACK40P2D_STAGING_CREATE_PATH_PROVENANCE_DEPLOY` | Deploy verified merged master to `viona-api-staging-eu`; pre/post health; image evidence; **no migrate, secrets, backfill, Pack40A** | **Yes (staging only)** |
| **P4D** | `APPROVE_PACK40P4_MERCHANT_BACKFILL_DRY_RUN` | Read-only candidate calc + evidence | No |
| **P4W** | `APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE` | Staging idempotent merchant backfill | No |
| **P5** | `APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION` | Post-P2D + post-backfill verification; rolling window inventory; **does not perform missing P2D deploy** | No |
| **Pack40A** | `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` | **Only after P1, P3, P2, P2D, P4D/P4W (if approved), P5 ready** | — |

No Pack40P phrase implies Pack40A. No Pack40P phrase implies production.

---

## 15. Exact per-increment file allowlists

### Pack40P1 — Schema + migration files

| Category | Files |
|---|---|
| **Schema** | `prisma/schema.prisma` (additive enum, 2 columns, relation, indexes on `VionaRequest`; reverse relation on `MerchantProfile`) |
| **Migration** | `prisma/migrations/20260714120000_pack40p_add_viona_request_scope_provenance/migration.sql` (new) |
| **Tests** | `scripts/test-viona-pack40p1-provenance-schema.ts` (new — enum values, default, relation metadata scan) |
| **Docs** | `docs/product/VIONA_PACK40P1_PROVENANCE_SCHEMA_EVIDENCE.md` (new — must record `SCHEMA_COMMITTED_MIGRATION_NOT_APPLIED` + `DEPLOYMENT_BLOCKED_FOR_ENVIRONMENTS_WITHOUT_MIGRATION`) |
| **PR body** | Must include same state markers and deployment-lock invariant |
| **Forbidden** | All create services, access scope, controllers, backfill scripts, Fly, orchestrator, escrow, webhook |

### Pack40P2 — Create-path wiring

| Category | Files |
|---|---|
| **Production** | `src/services/viona/vionaRequestCreateService.ts`; `src/services/viona/vionaRequestCreateDto.ts`; `src/services/viona/vionaRequestCreateFromWebhookService.ts`; `src/controllers/VionaWebhookMerchantAgentController.ts` (pass `merchantProfileId` if not already in webhook create input chain) |
| **Tests** | `scripts/test-viona-pack40p2-create-path-provenance.ts` (new) |
| **Mechanical** | Existing Pack19/Pack35 tests if create payloads need assertion updates |
| **Forbidden** | `vionaRequestAccessScope.ts`, read/note/status services, migration apply, backfill, **Fly deploy** |

### Pack40P2D — Staging create-path deploy (execution-only)

| Category | Files / actions |
|---|---|
| **Code changes** | **None** |
| **Execution** | `fly deploy --app viona-api-staging-eu --remote-only` (verified merged master containing P2); pre-deploy local gates (typecheck, lint, Pack40P2 tests, full regression); pre/post `GET /health`; bounded logs |
| **Evidence** | `docs/product/VIONA_PACK40P2D_STAGING_CREATE_PATH_DEPLOY_EVIDENCE.md` (new — image/release ID, health, deploy window start) |
| **Docs sync** | Kernel + Handoff state updates (evidence-only follow-up commit if needed) |
| **Forbidden** | Prisma commands; secret access/change; production; backfill; schema edit; Pack40A; automatic remediation |

### Pack40P3 — Staging migration apply

| Category | Files |
|---|---|
| **Evidence only** | `docs/product/VIONA_PACK40P3_STAGING_MIGRATION_APPLY_EVIDENCE.md` (new — must record `STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED`) |
| **Forbidden** | Product code changes beyond evidence; production; backfill |

### Pack40P4D — Backfill dry run

| Category | Files |
|---|---|
| **Script** | `scripts/backfill-viona-pack40p4-merchant-provenance-dry-run.ts` (new, read-only) |
| **Evidence** | `docs/product/VIONA_PACK40P4_MERCHANT_BACKFILL_DRY_RUN_EVIDENCE.md` |
| **Forbidden** | Writes, consumer backfill, production |

### Pack40P4W — Staging backfill write

| Category | Files |
|---|---|
| **Script** | `scripts/backfill-viona-pack40p4-merchant-provenance-write.ts` (new, staging-gated, idempotent) |
| **Evidence** | `docs/product/VIONA_PACK40P4_STAGING_MERCHANT_BACKFILL_EVIDENCE.md` |
| **Forbidden** | Consumer backfill, production, access enforcement |

### Pack40P5 — Verification

| Category | Files |
|---|---|
| **Script** | `scripts/verify-viona-pack40p5-staging-provenance.ts` (new, read-only counts) |
| **Evidence** | `docs/product/VIONA_PACK40P5_STAGING_PROVENANCE_VERIFICATION_EVIDENCE.md` |
| **Forbidden** | Pack40A enforcement code |

---

## 16. Test matrix (future)

| # | Test | Slice |
|---|---|---|
| 1 | Existing row → `legacyUnresolved` after migration | P1/P3 |
| 2 | New Pack19 → `consumer` | P2/P2D/P5 |
| 3 | Client cannot set `scopeKind` | P2 |
| 4 | Client cannot set `merchantProfileId` | P2 |
| 5 | New Pack35 → `merchant` | P2/P2D/P5 |
| 6 | Pack35 FK = resolved profile | P2/P5 |
| 7 | Pack35 `tenantId` = profile tenant | P2/P5 |
| 8 | Omitted assignment → `legacyUnresolved` | P1/P2 |
| 9 | Registry absence ≠ consumer | P2/P5 |
| 10 | Registry match alone ≠ auto backfill | P4D |
| 11 | Webhook dry-run candidates only approved set | P4D |
| 12 | Backfill idempotent | P4W |
| 13 | No consumer backfill path exists | P4D/P4W |
| 14 | Ambiguous mapping stops | P4W |
| 15 | Deactivation doesn't rewrite scope | P2 |
| 16 | **Merchant-profile owner using Pack19 still receives `consumer`** | P2 |
| 17 | **Client `tenantId` cannot create `merchant` scope on Pack19** | P2 |
| 18 | Pack19/Pack35 regressions green | P2 |
| 19 | Pack31 orchestrator unchanged | all |
| 20 | Pack35–Pack39 webhook/dispatcher green | P2/P2D |
| 21 | Typecheck, lint, full regression | each |
| 22 | Migration rollback doc verified | P1 |
| 23 | **Deploying P1 app before migration explicitly blocked (process + docs)** | P1/P3 |
| 24 | **Old application healthy immediately after additive migration (P3)** | P3 |
| 25 | **Old instance writes receive default `legacyUnresolved` (P2D window)** | P2D/P5 |
| 26 | **Rolling-window rows inventoried in P5** | P5 |
| 27 | **After rollout completion, no expected create path silently defaults to unresolved** | P5 |
| 28 | **P2 phrase does not deploy app** | P2 |
| 29 | **P3 phrase does not deploy app** | P3 |
| 30 | **P2D deploy does not migrate or backfill** | P2D |
| 31 | **P5 does not perform missing rollout actions** | P5 |
| 32 | No permanent git-diff-vs-master tests | all |

---

## 17. Rollback strategy

| Stage | Rollback |
|---|---|
| P1 merged, migration not applied | Revert PR; delete migration folder; deployment lock clears with revert |
| P3 applied, P2 not merged | DB has harmless default columns; old app continues; **do not deploy P1+ client until P2D or revert** |
| P3 applied, P2 merged, P2D not executed | Old staging app continues; new code on master undeployed — safe |
| P2D deployed | Revert Fly release to prior image; columns remain; new rows from old code → `legacyUnresolved` |
| P4W backfill wrong | Idempotent script + manual correction under ops phrase; no auto consumer revert |
| Full rollback | Drop FK, columns, enum (destructive — staging only under explicit phrase) |

---

## 18. Stop-on-error rules

Stop if: migration sets any row to consumer/merchant; consumer backfill attempted; client can set scope;
Pack40A code in P1–P5; orchestrator/escrow/webhook signature changed; production targeted without
phrase; ambiguous backfill proceeds; shadow-DB replay attempted as part of P1 without separate ops plan;
**application deployed to environment before P1 migration applied on that environment**; P2D executed
without P3 success on staging.

---

## 19. Authorization phrases

| Phrase | Authorizes | Does **NOT** authorize |
|---|---|---|
| `APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION` | P1 files only | Migration apply; deploy |
| `APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY` | Staging migrate deploy + P3 evidence | **Application deploy**; backfill; production |
| `APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING` | P2 files only | **Application deploy**; migration apply; backfill |
| `APPROVE_PACK40P2D_STAGING_CREATE_PATH_PROVENANCE_DEPLOY` | Staging app deploy (`viona-api-staging-eu`) | Migration; secrets; backfill; Pack40A; production |
| `APPROVE_PACK40P4_MERCHANT_BACKFILL_DRY_RUN` | P4D read-only | Writes |
| `APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE` | P4W staging writes | Consumer backfill; production |
| `APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION` | P5 verify | Missing P2D; Pack40A; backfill writes |
| `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` | Pack40A — **only after §21 ready** | — |

---

## 20. Deferred / non-goals

- Pack40B/C/D/S execution
- Pack36B Merchant Admin UI
- Removing `tenantId` column
- Consumer tenant sentinel as primary mechanism
- Production backfill/inventory (separate future phrases)
- MerchantProfile delete API
- Automatic Pack40P implementation from this planning PR

---

## 21. Definition of ready for Pack40A

Pack40A (`APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT`) may be authorized **only when all** hold:

| # | Criterion |
|---|---|
| 1 | Pack40P1 merged — schema + migration file exist; deployment lock documented |
| 2 | Pack40P3 executed on staging — migration applied; state `STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED` |
| 3 | Pack40P2 merged — create paths assign scope by **creation path** (Pack19 → consumer even for dual-role owners) |
| 4 | Pack40P2D executed on staging — create-path code deployed; rolling window closed |
| 5 | Pack40P5 passed — post-P2D creates verified consumer/merchant; legacy unresolved preserved; no silent unresolved defaults after rollout |
| 6 | Pack40P4W executed (staging) where approved — webhook-positive merchant rows backfilled |
| 7 | Pack40 plan access policy updated to use `scopeKind` + FK (docs sync) |
| 8 | No canonical consumer ambiguity — **`scopeKind = consumer`** is the positive predicate |
| 9 | Full local regression green after P2 |

Until then: **Pack40A BLOCKED.**

---

## Appendix — Planning verification

| Check | Result |
|---|---|
| PR #342 merged | **Yes** @ `a4619a1` |
| PR #343 merged (initial Pack40P plan) | **Yes** @ `1af07e7` |
| Overlapping implementation PR | **None** |
| Safe additive model | **Yes** |
| Pack19 merchant-scoped create conflict | **None found** |
| Auto-deploy on master merge | **No** — manual Fly deploy |
| Product code in this task | **None** |
