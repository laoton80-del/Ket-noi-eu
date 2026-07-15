# VIONA Pack40B — Tenant Note Mutation Enforcement Evidence

**Operator phrases:**  
- `APPROVE_PACK40B_TENANT_NOTE_ENFORCEMENT` (initial implementation, PR #356)  
- `APPROVE_PACK40B_TRANSACTIONAL_NOTE_AUTHORIZATION_REFINEMENT` (transactional correction)

**Classification:** `READY_FOR_PACK40B_TRANSACTIONAL_REFINEMENT_PR_REVIEW`  
**Mode:** Local implementation + tests only — no deploy, staging QA, database, schema, or secret action.  
**Pack40B CLOSED/GREEN:** **NO**

---

## 1. Verified master SHA

| Item | Value |
|---|---|
| **Pre-correction master** | `a165ca96316080164b34707c44ff57bea8e09697` |
| **PR #356** | **MERGED** @ `a165ca9` (2026-07-15T10:40:03Z) |
| **Pack40A closure** | PR #355 **MERGED** @ `fa67491` — **CLOSED / GREEN** |

---

## 2. Original atomicity gap (PR #356)

Merged Pack40B resolved MerchantProfile **before** `$transaction`, built `authorizedWhere` from that snapshot, and included a **pre-transaction idempotency fast path**. A profile could change (inactive, tenant drift, ownership loss) between HTTP entry and note commit.

---

## 3. Corrective branch and commit

| Item | Value |
|---|---|
| **Branch** | `fix/pack40b-transactional-note-authorization` |
| **Corrective commit** | `0abe02c` |

---

## 4. Note mutation surfaces covered

Unchanged single surface: `POST /api/viona/requests/:id/actions/note` → `appendVionaRequestNote`.

| Layer | Path |
|---|---|
| **Principal (transaction-scoped)** | `resolveVionaRequestNotePrincipalContext` (`vionaRequestNotePrincipalContext.ts`) |
| **Access scope** | `buildAuthorizedVionaRequestNoteWhere` (`vionaRequestNoteAccessScope.ts`) |
| **Service** | `appendVionaRequestNote` / `executeAuthorizedNoteMutation` (`vionaRequestNoteActionService.ts`) |

---

## 5. Final transaction flow

```text
validate authUserId + note input (pre-tx, no auth side effects)
→ prisma.$transaction(Serializable)
  → tx.merchantProfile.findUnique({ ownerUserId: authUserId })
  → buildAuthorizedVionaRequestNoteWhere(currentPrincipal)
  → tx.vionaRequest.findFirst({ id, ...authorizedWhere })
  → fail request_not_found when absent
  → idempotency lookup (only after current auth passes)
  → authorized replay or tx.vionaRequestAuditEvent.create
→ commit
→ getVionaRequestById for response (legacy user scope, unchanged)
```

**No** pre-transaction MerchantProfile resolution. **No** pre-transaction idempotency fast path.

---

## 6. Transaction isolation

`Prisma.TransactionIsolationLevel.Serializable` on the note mutation transaction (repository precedent: `WalletService`, `vionaRequestEscrowHoldService`).

Serialization conflicts fail without silent retry; transaction rolls back with no partial note/audit.

---

## 7. Authorization semantics (unchanged)

**Consumer:** `existingUserScope AND scopeKind=consumer AND merchantProfileId=null`  
**Merchant:** `existingUserScope AND scopeKind=merchant AND merchantProfileId=current.id AND tenantId=current.tenantId AND current.isActive=true`  
**legacyUnresolved:** fail-closed → `request_not_found`

---

## 8. Idempotency ordering

Current transactional authorization **precedes** idempotency inspection. Replay denied when current auth fails (inactive merchant, tenant drift, wrong profile, legacy unresolved) even if an audit row with the same key exists.

Consumer replay remains available when current consumer authorization passes.

---

## 9. Stale-state protections

| Drift | Result |
|---|---|
| Active → inactive (in tx) | Merchant note denied; consumer independent |
| Tenant change (in tx) | Merchant note denied |
| Profile removed (in tx) | Merchant branch omitted; merchant note denied |
| Ownership change | Former owner cannot authorize merchant note |
| Idempotency key after deactivation | Denied — no new audit |

---

## 10. Rollback behavior

- Authorization failure: no audit, transaction completes with denied result
- Audit create failure: transaction throws, no committed audit
- Transaction rejection: no partial write

---

## 11. Test results

| Suite | Result |
|---|---|
| **Pack40B** (81 tests incl. 17 transactional refinement) | **81/81 PASS** |
| **Pack40A regression** | **39/39 PASS** (unchanged) |
| **Pack40P2 / P4W / P5** | **PASS** |
| **Pack30D-3 / Pack18** | **PASS** |
| Full local `test-viona-pack*.ts` (excl. live-staging QA) | **PASS** |
| `npx tsc --noEmit` | **PASS** |

---

## 12. Files changed (corrective)

| File | Change |
|---|---|
| `src/services/viona/vionaRequestNotePrincipalContext.ts` | **NEW** — tx-scoped note principal resolver |
| `src/services/viona/vionaRequestNoteActionService.ts` | **MODIFIED** — Serializable tx-only auth + idempotency |
| `src/services/viona/vionaRequestNoteAccessScope.ts` | **MODIFIED** — note principal type |
| `scripts/test-viona-pack40b-tenant-note-enforcement.ts` | **MODIFIED** — +17 race/ordering tests |
| Evidence + canonical docs (3 files) | **MODIFIED** |

**Not changed:** Pack40A read paths, schema, migrations, controllers, status/execution services.

---

## 13. Confirmations

| Check | Status |
|---|---|
| No schema/migration/DB/staging/deploy | **CONFIRMED** |
| Pack40A CLOSED/GREEN | **CONFIRMED** |
| Pack40C/D/S unimplemented | **CONFIRMED** |
| Pack40B deployment | **STILL SEPARATELY AUTHORIZED** (`APPROVE_PACK40BD_*`) |

---

## 14. Final classification

**`READY_FOR_PACK40B_TRANSACTIONAL_REFINEMENT_PR_REVIEW`**

Next: merge corrective PR, then separately authorize `APPROVE_PACK40BD_STAGING_NOTE_ENFORCEMENT_DEPLOY`.
