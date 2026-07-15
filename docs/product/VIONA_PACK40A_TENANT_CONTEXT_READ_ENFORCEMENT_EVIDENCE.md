# Pack40A — Tenant Principal Context and Read Enforcement Evidence

Status: **LOCAL IMPLEMENTATION COMPLETE — PR REVIEW ONLY**

Operator phrase: `APPROVE_PACK40A_TENANT_CONTEXT_AND_READ_ENFORCEMENT`

---

## 1. Verified master SHA

`13efae8d6849c94584e8c78efe91c2a82c210d14`

## 2. PR #351 state and merge commit

**MERGED** @ `2026-07-15T08:34:26Z`, merge commit `13efae8d6849c94584e8c78efe91c2a82c210d14`

Pack40P definition-of-ready: **`PACK40P_PROVENANCE_DEFINITION_OF_READY_MET`**

## 3. Branch and implementation commit

- Branch: `feat/pack40a-tenant-context-read-enforcement`
- Commit: recorded at PR open time

## 4. Exact direct read surfaces covered

| Surface | Route / entry | Enforcement |
|---|---|---|
| List | `GET /api/viona/requests` → `getVionaRequests` → `listVionaRequests` | `directReadPolicy: 'pack40a_provenance'` |
| Detail | `GET /api/viona/requests/:id` → `getVionaRequestDetail` → `getVionaRequestById` | `directReadPolicy: 'pack40a_provenance'` |

**Not changed (no `directReadPolicy`):** note actions, status actions, create paths, webhook ingestion, execution gate/plan/orchestrator, indirect `getVionaRequestById` callers.

## 5. Principal-context design

`VionaRequestReadPrincipalContext` in `src/services/viona/vionaRequestReadPrincipalContext.ts`:

- `authUserId` — from verified JWT/auth middleware only
- `merchantProfile` — `{ id, tenantId, isActive } | null`, server-resolved
- `merchantProfileResolution` — `'none' | 'single' | 'ambiguous'`

One bounded `findMerchantProfileByOwnerUserId` lookup per HTTP read request (`MerchantProfile.ownerUserId` is `@unique`).

## 6. MerchantProfile resolution behavior

- Single profile by unique owner → `single`, merchant branch enabled
- No profile → `none`, consumer branch only
- Multiple profiles (test injection only) → `ambiguous`, merchant branch omitted, consumer branch retained
- `isActive` captured but **not** required by read predicate

## 7. Consumer predicate

```text
existingUserScope
AND scopeKind = consumer
AND merchantProfileId IS NULL
```

Dual-role users may read authorized consumer rows via this branch. Client `tenantId`, registry presence/absence, and actor MerchantProfile do not alter consumer classification.

## 8. Merchant predicate

```text
existingUserScope
AND scopeKind = merchant
AND merchantProfileId = actorMerchantProfile.id
AND tenantId = actorMerchantProfile.tenantId
```

Exact MerchantProfile ID equality mandatory. Tenant snapshot mismatch fails closed. Null `merchantProfileId` on merchant rows fails closed.

## 9. Legacy unresolved exclusion

```text
scopeKind = legacyUnresolved → never matches Pack40A read predicate
```

- List: row omitted
- Detail: `request_not_found` (HTTP 404), no existence leak

## 10. Inactive merchant behavior

Inactive MerchantProfile may read historically merchant-classified rows when profile ID and tenant snapshot match. `isActive` is not part of the read where clause.

## 11. Dual-role test result

Test 38 positively constructs an actor with both consumer identity and trusted MerchantProfile owned by the same auth user. Verified:

- Authorized consumer row readable via consumer branch
- Authorized merchant row readable only via exact MerchantProfile equality
- Branches coexist without one swallowing the other

## 12. Query boundedness

`buildAuthorizedVionaRequestReadWhere()` in `src/services/viona/vionaRequestReadAccessScope.ts`:

```text
AND: [
  existingUserScope,
  OR: [
    { scopeKind: consumer, merchantProfileId: null },
    { scopeKind: merchant, merchantProfileId: actor.id, tenantId: actor.tenantId }  // when single
  ]
]
```

No global MerchantProfile scan, no `NOT IN`, no per-row profile lookup, no fetch-all-then-filter.

## 13. No client tenant expansion

`expectedTenantId` and client body/query tenant values do not enter the Pack40A read where builder. Mutation-path `buildAuthorizedVionaRequestWhere(authUserId)` remains byte-identical when called with one argument.

## 14. List behavior

Inaccessible rows (legacy unresolved, malformed consumer, wrong merchant profile, failed user scope) are omitted from list results without warning labels.

## 15. Detail not-found behavior

All provenance failures collapse to existing `request_not_found` — no distinguishable wrong-tenant, merchant-mismatch, or unresolved-provenance responses.

## 16. Test results

| Suite | Result |
|---|---|
| `scripts/test-viona-pack40a-tenant-context-read-enforcement.ts` | **39/39 PASS** |
| `scripts/test-viona-pack40p2-create-path-provenance.ts` | **14/14 PASS** |
| `scripts/test-viona-pack40p4-merchant-backfill-write.ts` | **31/31 PASS** |
| `scripts/test-viona-pack40p5-staging-provenance.ts` | **30/30 PASS** |
| `scripts/test-viona-pack30d3-frontend-audit-trail-timeline.ts` | **11/11 PASS** |
| Full local `scripts/test-viona-pack*.ts` regression (excl. live-staging QA) | **PASS** |

## 17. Typecheck and lint

- `npx tsc --noEmit` — **PASS**
- ESLint on touched TypeScript files — **PASS** (0 errors, 0 warnings)

## 18. Full regression

All local `scripts/test-viona-pack*.ts` suites pass except excluded live-staging-only scripts (`pack36a-staging-webhook-qa`, `pack30d-7-staging-deployment`).

## 19. Exact changed files

| File | Change |
|---|---|
| `src/services/viona/vionaRequestReadPrincipalContext.ts` | **new** — principal resolver |
| `src/services/viona/vionaRequestReadAccessScope.ts` | **new** — read-specific provenance where builder |
| `src/services/viona/vionaRequestReadDto.ts` | `directReadPolicy` opt-in flag |
| `src/services/viona/vionaRequestReadService.ts` | Pack40A read path when flag set |
| `src/controllers/VionaRequestController.ts` | list + detail pass flag |
| `scripts/test-viona-pack40a-tenant-context-read-enforcement.ts` | **new** — 39 tests |
| `docs/product/VIONA_PACK40A_TENANT_CONTEXT_READ_ENFORCEMENT_EVIDENCE.md` | this document |
| `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md` | Pack40A status update |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | canonical state |
| `Handoff_VIONA11726.txt` | canonical state |

## 20. Confirmation no schema or migration changed

Prisma schema and migration files were **not** modified.

## 21. Confirmation no database or staging action occurred

No database access, staging API calls, row mutation, or provider calls in this task.

## 22. Confirmation no note/status/indirect enforcement occurred

Note service, status service, execution paths, create/webhook paths unchanged. Pack40B/C/D not implemented.

## 23. Confirmation no deployment occurred

No Fly deploy, no secret changes, no production action.

## 24. Pack40B/C/D/S remain separately authorized

Pack40B (note), Pack40C (status), Pack40D (indirect), Pack40S (staging adversarial QA) require separate operator phrases.

## 25. Final classification

**`READY_FOR_PACK40A_READ_ENFORCEMENT_PR_REVIEW`**

Staging deploy and adversarial QA require a separately authorized Pack40A staging pack after PR merge.
