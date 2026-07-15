# Pack40C — Tenant-Aware Direct Status Enforcement Evidence

**Operator phrase:** `APPROVE_PACK40C_TENANT_STATUS_ENFORCEMENT`  
**Classification:** `READY_FOR_PACK40C_STATUS_ENFORCEMENT_PR_REVIEW`  
**Mode:** Local implementation + tests only — **no deploy, staging QA, DB, schema, or migration**

---

## 1. Verified baseline

| Item | Value |
|---|---|
| `origin/master` SHA | `357f3e3249d904ba247a933aa6ea17da2d8f819b` |
| PR #362 | **MERGED** @ `2026-07-15T13:09:16Z` (merge commit `357f3e3`) |
| Implementation branch | `feat/pack40c-tenant-status-enforcement` |

---

## 2. Direct status surface

```text
POST /api/viona/requests/:id/actions/status
→ VionaRequestController.postVionaRequestStatusAction
→ transitionVionaRequestStatus
```

**Outside Pack40C (unchanged):** `vionaRequestExecutionOrchestrator`, Pack31 execution transitions, create/webhook initial status, test-only writers.

---

## 3. Owner-only DB predicate

Primary authorization boundary inside Serializable transaction:

```text
id = requestId
AND ownerUserId = authUserId
AND OR [
  { scopeKind: consumer, merchantProfileId: null },
  { scopeKind: merchant, merchantProfileId: activeProfile.id, tenantId: activeProfile.tenantId }  // when active single profile
]
```

`legacyUnresolved` never matches. Requester/participant broad scope is **not** used as primary lookup. `isOwnerActor()` retained as defensive invariant after retrieval.

---

## 4. Principal context

File: `src/services/viona/vionaRequestStatusPrincipalContext.ts`

- `authUserId` from verified middleware only
- One bounded `MerchantProfile.findUnique({ ownerUserId })` per request inside tx
- Resolution: `none` | `single` | `ambiguous`
- Ambiguous/inactive omits merchant branch; consumer branch remains available

---

## 5. Consumer / merchant / legacy semantics

| Branch | Predicate | Notes |
|---|---|---|
| Consumer | `ownerUserId = authUserId`, `scopeKind = consumer`, `merchantProfileId = null` | Inactive profile does not block |
| Merchant | Active single profile only: exact `merchantProfileId` + `tenantId` snapshot | Wrong profile/tenant/inactive/missing/ambiguous → fail closed |
| Legacy | `scopeKind = legacyUnresolved` | Never matches; not-found-safe denial |

---

## 6. Serializable transaction flow

```text
validate trusted input (pre-tx)
→ Serializable $transaction
→ resolve MerchantProfile (tx)
→ owner-only provenance authorized findFirst
→ idempotency lookup (after auth)
→ IF valid replay: binding + current status === triage → return 200 replay (no hook)
→ ELSE: validate submitted→triage, conditional updateMany, status event + action.status audit
→ commit
→ post-tx stateTransition hook (best-effort, first commit only)
```

Pre-transaction request lookup and idempotency fast path **removed**.

---

## 7. Replay binding

Valid replay requires matching: actor, request, action, idempotency key, target `triage`, `fromStatus submitted`, reason/note payload, and current row status `triage`. No second update/event/audit/hook.

---

## 8. Conditional update & atomicity

`updateMany` requires `status = submitted` + owner-only provenance predicate; exactly one row. Status event + `action.status` audit in same transaction; any failure rolls back all writes.

---

## 9. Post-transaction hook

`buildVionaStateTransitionAuditEventInput` → `appendVionaExecutionAuditEvent` (injectable in tests). Post-commit, best-effort, observability only; **not** invoked on replay; hook failure does not roll back committed transition.

---

## 10. Client input & error normalization

Controller whitelists: `targetStatus`, `reason`, `note`, `idempotencyKey`, `clientCorrelationId`. Client cannot supply tenant/profile/scopeKind/owner. All authorization denials → `request_not_found`.

---

## 11. Test results

| Suite | Result |
|---|---|
| Pack40C (`scripts/test-viona-pack40c-tenant-status-enforcement.ts`) | **93/93 PASS** |
| Pack40A | **39/39 PASS** (test 31 mechanically updated for Pack40C scope) |
| Pack40B | **81/81 PASS** (test 52 mechanically updated) |
| Pack30D2 state-machine hooks | **11/11 PASS** (hook-order test mechanically updated) |
| Pack30D3 timeline | **11/11 PASS** |
| Pack40P1/P2/P4W | **PASS** |
| Full local `scripts/test-viona-pack*.ts` (excl. staging-only) | **26/26 PASS** |
| `npx tsc --noEmit` | **PASS** |
| ESLint (touched production + Pack40C test) | **PASS** (0 errors) |

No real database, staging HTTP, provider action, or external write.

---

## 12. Files changed

**Production (3 new/modified):**

- `src/services/viona/vionaRequestStatusPrincipalContext.ts` (new)
- `src/services/viona/vionaRequestStatusAccessScope.ts` (new)
- `src/services/viona/vionaRequestStatusActionService.ts` (Pack40C refactor)

**Tests:**

- `scripts/test-viona-pack40c-tenant-status-enforcement.ts` (new, 93 tests)
- `scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` (mechanical hook-order update)
- `scripts/test-viona-pack40a-tenant-context-read-enforcement.ts` (mechanical preservation update)
- `scripts/test-viona-pack40b-tenant-note-enforcement.ts` (mechanical preservation update)

**Docs:**

- This evidence file
- `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md`
- `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`
- `Handoff_VIONA11726.txt`

**Unchanged:** `prisma/schema.prisma`, migrations, Pack40A read, Pack40B note, orchestrator, create/webhook paths.

---

## 13. Confirmations

- No schema or migration changed
- No DB or staging action occurred
- No deployment occurred
- Pack40A/B remain **CLOSED/GREEN**
- Pack40D/S remain **unimplemented / not authorized**
- Pack40C is **not** marked CLOSED/GREEN (implementation PR review pending; deploy/QA separately authorized)

---

## 14. Recommended next operator action

After implementation PR merge, authorize staging deploy only:

```text
APPROVE_PACK40CD_STAGING_STATUS_ENFORCEMENT_DEPLOY
```
