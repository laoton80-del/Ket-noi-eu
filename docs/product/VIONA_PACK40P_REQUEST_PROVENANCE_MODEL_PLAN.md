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

Execution is sliced into **Pack40P1–P5** (schema → create paths → staging migrate → backfill dry-run
→ backfill write → verification). **Pack40A remains blocked** until Pack40P definition-of-ready is met.

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
| Rolling deploy old code without column | N/A | Ordering plan: migrate before deploy of create-path code |

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

### 9.1 Pack19 JWT create (`createVionaRequest`)

**Verified:** Pack19 is the **only authenticated consumer create path** (staging-testable; not
production-ready per existing safety labels).

| Field | Server assignment |
|---|---|
| `scopeKind` | **`consumer`** |
| `merchantProfileId` | **`null`** |
| `tenantId` | **Compatibility:** continue accepting client body value **as non-authoritative metadata** stored in existing column; **must not** drive access after Pack40A. Document deprecation in API contract; removal is separate pack. **Do not** silently change response shape in Pack40P2. |

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

| Step | Action | Notes |
|---|---|---|
| 1 | Merge **Pack40P1** (schema + migration file) | Migration **not applied** |
| 2 | Merge **Pack40P2** (create-path wiring) | Code writes new columns when present |
| 3 | **`prisma migrate deploy` on staging** (Pack40P3) | All existing rows `legacyUnresolved` |
| 4 | Deploy application to staging (if not co-deployed) | New creates get correct scope |
| 5 | **Pack40P5** verification | New Pack19 → consumer; new webhook → merchant; old → unresolved |
| 6 | **Pack40P4D** dry-run backfill | Read-only candidates |
| 7 | **Pack40P4W** staging backfill write | Merchant only |
| 8 | Re-verify Pack40P5 | Backfilled merchant rows readable under future Pack40A rules |
| 9 | **Pack40A** enforcement (separate phrase) | After definition-of-ready |

**Rolling deploy compatibility:**

- **Apply migration before deploying P2 code** — old app instances ignore new columns (Postgres allows); new columns have defaults.
- Old instances writing requests during rollout: new rows get `legacyUnresolved` default until old code replaced — **acceptable fail-safe**; minimize rollout window.
- **Do not deploy P2 to production before migration applied** on that environment.
- Rollback after migrate, before P2 deploy: revert deploy only; columns remain with safe defaults.

**P2 before P1 applied:** code may guard with feature-detect or remain unmerged until P3 — **prefer: P2 merges after P1 but deploy blocked until P3 migrate on each environment.**

---

## 14. Implementation slicing (Pack40P1–P5)

| Slice | Phrase | Scope |
|---|---|---|
| **P1** | `APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION` | Prisma enum/fields/relation/indexes + migration SQL file; schema tests; **no apply** |
| **P2** | `APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING` | Pack19 consumer + Pack35 merchant assignment; DTO screening; local tests; **no migrate apply, no backfill** |
| **P3** | `APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY` | Staging `migrate deploy` only; verify all existing `legacyUnresolved` |
| **P4D** | `APPROVE_PACK40P4_MERCHANT_BACKFILL_DRY_RUN` | Read-only candidate calc + evidence |
| **P4W** | `APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE` | Staging idempotent merchant backfill |
| **P5** | `APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION` | Post-migrate + post-backfill verification |
| **Pack40A** | `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` | **Only after P1–P5 ready** |

No Pack40P phrase implies Pack40A. No Pack40P phrase implies production.

---

## 15. Exact per-increment file allowlists

### Pack40P1 — Schema + migration files

| Category | Files |
|---|---|
| **Schema** | `prisma/schema.prisma` (additive enum, 2 columns, relation, indexes on `VionaRequest`; reverse relation on `MerchantProfile`) |
| **Migration** | `prisma/migrations/20260714120000_pack40p_add_viona_request_scope_provenance/migration.sql` (new) |
| **Tests** | `scripts/test-viona-pack40p1-provenance-schema.ts` (new — enum values, default, relation metadata scan) |
| **Docs** | `docs/product/VIONA_PACK40P1_PROVENANCE_SCHEMA_EVIDENCE.md` (new, optional evidence) |
| **Forbidden** | All create services, access scope, controllers, backfill scripts, Fly, orchestrator, escrow, webhook |

### Pack40P2 — Create-path wiring

| Category | Files |
|---|---|
| **Production** | `src/services/viona/vionaRequestCreateService.ts`; `src/services/viona/vionaRequestCreateDto.ts`; `src/services/viona/vionaRequestCreateFromWebhookService.ts`; `src/controllers/VionaWebhookMerchantAgentController.ts` (pass `merchantProfileId` if not already in webhook create input chain) |
| **Tests** | `scripts/test-viona-pack40p2-create-path-provenance.ts` (new) |
| **Mechanical** | Existing Pack19/Pack35 tests if create payloads need assertion updates |
| **Forbidden** | `vionaRequestAccessScope.ts`, read/note/status services, migration apply, backfill |

### Pack40P3 — Staging migration apply

| Category | Files |
|---|---|
| **Evidence only** | `docs/product/VIONA_PACK40P3_STAGING_MIGRATION_APPLY_EVIDENCE.md` (new) |
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
| 2 | New Pack19 → `consumer` | P2 |
| 3 | Client cannot set `scopeKind` | P2 |
| 4 | Client cannot set `merchantProfileId` | P2 |
| 5 | New Pack35 → `merchant` | P2 |
| 6 | Pack35 FK = resolved profile | P2 |
| 7 | Pack35 `tenantId` = profile tenant | P2 |
| 8 | Omitted assignment → `legacyUnresolved` | P1/P2 |
| 9 | Registry absence ≠ consumer | P2/P5 |
| 10 | Registry match alone ≠ auto backfill | P4D |
| 11 | Webhook dry-run candidates only approved set | P4D |
| 12 | Backfill idempotent | P4W |
| 13 | No consumer backfill path exists | P4D/P4W |
| 14 | Ambiguous mapping stops | P4W |
| 15 | Deactivation doesn't rewrite scope | P2 |
| 16 | Pack19/Pack35 regressions green | P2 |
| 17 | Pack31 orchestrator unchanged | all |
| 18 | Pack35–Pack39 webhook/dispatcher green | P2 |
| 19 | Typecheck, lint, full regression | each |
| 20 | Migration rollback doc verified | P1 |
| 21 | No permanent git-diff-vs-master tests | all |

---

## 17. Rollback strategy

| Stage | Rollback |
|---|---|
| P1 merged, migration not applied | Revert PR; delete migration folder |
| P3 applied, P2 not deployed | DB has harmless default columns; old app continues |
| P3 + P2 deployed | Revert app; columns remain; new rows get `legacyUnresolved` until redeploy |
| P4W backfill wrong | Idempotent script + manual correction under ops phrase; no auto consumer revert |
| Full rollback | Drop FK, columns, enum (destructive — staging only under explicit phrase) |

---

## 18. Stop-on-error rules

Stop if: migration sets any row to consumer/merchant; consumer backfill attempted; client can set scope;
Pack40A code in P1–P5; orchestrator/escrow/webhook signature changed; production targeted without
phrase; ambiguous backfill proceeds; shadow-DB replay attempted as part of P1 without separate ops plan.

---

## 19. Authorization phrases

| Phrase | Authorizes |
|---|---|
| `APPROVE_PACK40P1_PROVENANCE_SCHEMA_IMPLEMENTATION` | P1 files only |
| `APPROVE_PACK40P2_CREATE_PATH_PROVENANCE_WIRING` | P2 files only |
| `APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY` | Staging migrate deploy |
| `APPROVE_PACK40P4_MERCHANT_BACKFILL_DRY_RUN` | P4D read-only |
| `APPROVE_PACK40P4_STAGING_MERCHANT_BACKFILL_WRITE` | P4W staging writes |
| `APPROVE_PACK40P5_STAGING_PROVENANCE_VERIFICATION` | P5 verify |
| `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT` | Pack40A — **only after §21 ready** |

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
| 1 | Pack40P1 merged — schema + migration file exist |
| 2 | Pack40P2 merged — create paths assign scope |
| 3 | Pack40P3 executed on staging — migration applied |
| 4 | Pack40P5 passed — new creates verified consumer/merchant; legacy unresolved |
| 5 | Pack40P4W executed (staging) — webhook-positive merchant rows backfilled where candidates exist |
| 6 | Pack40 plan access policy updated to use `scopeKind` + FK (docs sync) |
| 7 | No canonical consumer ambiguity — **`scopeKind = consumer`** is the positive predicate |
| 8 | Full local regression green after P2 |

Until then: **Pack40A BLOCKED.**

---

## Appendix — Planning verification

| Check | Result |
|---|---|
| PR #342 merged | **Yes** @ `a4619a1` |
| Overlapping implementation PR | **None** |
| Safe additive model | **Yes** |
| Product code in this task | **None** |
