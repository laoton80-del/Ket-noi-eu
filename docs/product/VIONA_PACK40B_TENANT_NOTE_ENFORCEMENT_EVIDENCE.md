# VIONA Pack40B — Tenant Note Mutation Enforcement Evidence

**Operator phrase:** `APPROVE_PACK40B_TENANT_NOTE_ENFORCEMENT`  
**Classification:** `READY_FOR_PACK40B_NOTE_ENFORCEMENT_PR_REVIEW`  
**Mode:** Local implementation + tests only — no deploy, staging QA, database, schema, or secret action.

---

## 1. Verified master SHA

| Item | Value |
|---|---|
| **origin/master** | `fa67491f653b9a3fee345ba7c70c401820f13135` |
| **Pack40A closure** | PR #355 **MERGED** @ `fa67491` (2026-07-15T10:02:31Z) |
| **Pack40A status** | **CLOSED / GREEN** |

---

## 2. Branch and implementation

| Item | Value |
|---|---|
| **Branch** | `feat/pack40b-tenant-note-enforcement` |
| **Implementation commit** | `3c16322` |

---

## 3. Note mutation surfaces covered

| Layer | Path |
|---|---|
| **Route** | `POST /api/viona/requests/:id/actions/note` (`src/routes/vionaRoutes.ts`) |
| **Controller** | `postVionaRequestNoteAction` (`src/controllers/VionaRequestController.ts`) |
| **Service** | `appendVionaRequestNote` (`src/services/viona/vionaRequestNoteActionService.ts`) |
| **DTO** | `AppendVionaRequestNoteInput` (`src/services/viona/vionaRequestNoteActionDto.ts`) — unchanged contract |
| **Access scope** | `buildAuthorizedVionaRequestNoteWhere` (`src/services/viona/vionaRequestNoteAccessScope.ts`) |
| **Principal** | Reuses `resolveVionaRequestReadPrincipalContext` (`src/services/viona/vionaRequestReadPrincipalContext.ts`) |

**Single direct note mutation entry point.** No status, execution, webhook, or indirect note paths modified.

---

## 4. Existing user-scope preservation

`buildAuthorizedVionaRequestWhere(authUserId)` remains the mandatory base predicate (requester, owner, participant). Pack40B narrows with provenance `AND` — never broadens.

---

## 5. Principal-context design

Reuses Pack40A `VionaRequestReadPrincipalContext` and `resolveVionaRequestReadPrincipalContext`:

- `authUserId` from verified auth only
- One bounded `findMerchantProfileByOwnerUserId` per note request
- Ambiguous multi-profile → merchant branch omitted; consumer branch independent
- No client-supplied profile, tenant, or scope kind

---

## 6–8. Mutation predicates

**Consumer branch:**
```text
existingUserScope AND scopeKind=consumer AND merchantProfileId=null
```

**Merchant branch (mutation only):**
```text
existingUserScope AND scopeKind=merchant
  AND merchantProfileId=actorProfile.id
  AND tenantId=actorProfile.tenantId
  AND actorProfile.isActive=true
```

**Active merchant requirement:** Merchant branch omitted when `isActive=false`. Inactive merchants denied with `request_not_found` (no `merchant_inactive` leak).

---

## 9. Dual-role behavior

- Consumer note on consumer-provenance row: **permitted** even when merchant profile inactive
- Merchant note on merchant-provenance row: **permitted** only when profile active and exact ID/tenant match
- Branches never overlap

---

## 10–11. Legacy and malformed provenance

- `legacyUnresolved`: fail-closed — no note, no audit, `request_not_found`
- Malformed consumer (`merchantProfileId` non-null), malformed merchant (`merchantProfileId` null), wrong profile, tenant mismatch: all fail-closed with same external result
- No remediation, registry inference, or consumer fallback

---

## 12. Client-input protection

Controller whitelists only `note`/`noteText`, `idempotencyKey`, `clientCorrelationId`. No `scopeKind`, `merchantProfileId`, `expectedTenantId`, `directReadPolicy`, or `noteAccessPolicy` accepted.

---

## 13. Atomicity design

1. Resolve principal once before transaction
2. Build `authorizedWhere = buildAuthorizedVionaRequestNoteWhere(principal)`
3. Inside `$transaction`: `findFirst({ id, ...authorizedWhere })` → fail closed if absent → `vionaRequestAuditEvent.create`
4. Idempotent replay: pre-transaction audit lookup + authorized row check; in-transaction duplicate guard

---

## 14–15. Idempotency and audit preservation

- Authorized first request: creates `action.note` audit event (unchanged event type/payload shape)
- Authorized replay: returns existing audit with `idempotentReplay: true`
- Denied attempts: no audit event, no request mutation
- Idempotency key cannot bypass provenance enforcement

---

## 16. Error normalization

All denial cases return `request_not_found` / HTTP 404. No provenance-specific public codes.

---

## 17. Query boundedness

- Exactly one MerchantProfile resolution per note request
- No per-row profile lookup, no global scan, no `NOT IN`, no client tenant in where-clause
- Full predicate applied in DB `findFirst` — no fetch-then-filter

---

## 18. Test results

| Suite | Result |
|---|---|
| **Pack40B** (`scripts/test-viona-pack40b-tenant-note-enforcement.ts`) | **64/64 PASS** |
| **Pack40A regression** | **39/39 PASS** (tests 30/35 updated for Pack40B coexistence) |
| **Pack40P2** | **14/14 PASS** |
| **Pack40P4W** | **31/31 PASS** |
| **Pack40P5 verify** | **30/30 PASS** |
| **Pack30D-3** (note timeline / Pack25 regression) | **11/11 PASS** |
| **Pack18 controlled write** | **PASS** |

---

## 19–20. Typecheck and lint

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| ESLint on touched TypeScript | **No new errors** |

---

## 21. Files changed

| File | Change |
|---|---|
| `src/services/viona/vionaRequestNoteAccessScope.ts` | **NEW** — provenance-aware note where builder |
| `src/services/viona/vionaRequestNoteActionService.ts` | **MODIFIED** — principal resolve + transactional authorize-then-write |
| `scripts/test-viona-pack40b-tenant-note-enforcement.ts` | **NEW** — 64 tests |
| `scripts/test-viona-pack40a-tenant-context-read-enforcement.ts` | **MODIFIED** — mechanical tests 30/35 for Pack40B coexistence |
| `docs/product/VIONA_PACK40B_TENANT_NOTE_ENFORCEMENT_EVIDENCE.md` | **NEW** |
| `docs/product/VIONA_PACK40_TENANT_SCOPE_ENFORCEMENT_PLAN.md` | **MODIFIED** — Pack40B state |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | **MODIFIED** — Pack40B row |
| `Handoff_VIONA11726.txt` | **MODIFIED** — Pack40B section |

**Not changed:** `prisma/schema.prisma`, migrations, Pack40A read paths, status/execution services, controllers (auth plumbing sufficient).

---

## 22–27. Confirmations

| Check | Status |
|---|---|
| No schema/migration change | **CONFIRMED** |
| No database/staging action | **CONFIRMED** |
| No deployment | **CONFIRMED** |
| Pack40A remains CLOSED/GREEN | **CONFIRMED** |
| Pack40C/D/S unimplemented | **CONFIRMED** |

---

## 28. Final classification

**`READY_FOR_PACK40B_NOTE_ENFORCEMENT_PR_REVIEW`**

Next operator action after merge: separately authorize `APPROVE_PACK40BD_STAGING_NOTE_ENFORCEMENT_DEPLOY`.
