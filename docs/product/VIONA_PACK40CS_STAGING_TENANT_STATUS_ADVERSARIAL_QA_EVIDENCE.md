# Pack40CS — Staging Tenant Status Adversarial QA Evidence

Status: **EXECUTION COMPLETE — STAGING MUTATION QA**

Operator phrase: `APPROVE_PACK40CS_STAGING_TENANT_STATUS_ADVERSARIAL_QA`

Pack40C staging-QA result: **`PACK40C_STAGING_STATUS_ADVERSARIAL_QA_GREEN`**

Evidence PR classification: **`READY_FOR_PACK40CS_QA_EVIDENCE_PR_REVIEW`**

Pack40C remains **not CLOSED/GREEN** until this evidence PR merges and canonical docs sync.

---

## 1. Verified master SHA

`92244f472026872ca31c88601f1ca263268d2496` — includes Pack40CD deployment evidence (PR #364)

## 2. PR #364 merge state

**MERGED**, merge commit `92244f472026872ca31c88601f1ca263268d2496`

## 3. Branch and evidence commit

- Branch: `chore/pack40cs-staging-tenant-status-adversarial-qa`
- Commit: recorded at PR open time

## 4. Staging release

| Field | Value |
|---|---|
| App | `viona-api-staging-eu` |
| Release | **v26-verified** (Pack40C direct status enforcement) |
| Pre-QA health | **HTTP 200** |

## 5. Redacted environment identities

| Identity | Label |
|---|---|
| API | `https://viona-api-staging-eu.fly.dev` |
| Database | `db.euqbfanilcssjiwwtcby.supabase.co` (staging project ref verified) |

## 6. Pack40C source-boundary confirmation

Direct surface only: `POST /api/viona/requests/:id/actions/status` → `submitted → triage`. Owner-only provenance predicate, Serializable auth-before-replay, request/event/audit atomicity confirmed on merged master before QA.

## 7. Fly log limitation

`fly logs` **not** used. Evidence from deploy smoke, health, bounded POST matrix, and read-only DB invariants only.

## 8. Fixture discovery

| Fixture | Marker | Pre-QA state |
|---|---|---|
| Consumer | `pack40p5-consumer-ee22193` | `scopeKind=consumer`, `merchantProfileId=null`, `status=submitted` |
| Merchant | `pack40p5-webhook-ee22193` | exact active merchant provenance, `status=submitted` |
| Legacy | excluded `legacyUnresolved` row | dual-role owner scope, unresolved provenance |
| Dual-role actor | positively verified | owns consumer fixture **and** active MerchantProfile **and** merchant fixture |
| Non-owner actor | approved pilot B | distinct from dual-role owner |

No requester-only fixture found; optional POST K skipped (owner-only covered locally in Pack40C 93/93 suite).

## 9. QA execution summary

| Item | Result |
|---|---|
| Status POST count | **10** (mandatory matrix A–J) |
| Transport uncertainty | **None** |
| Verify script post-QA bug | First pass failed on total audit count (included post-commit `stateTransition` hook rows); **fixed** to count `action.status` delta only |
| Resume validation | Post-QA invariants re-verified read-only after fix (fixtures now `triage`; no additional POSTs) |

### Matrix results (first live execution)

| Step | Case | Result |
|---|---|---|
| A | Consumer invalid target `inProgress` | **Denied** — no side effects |
| B | Consumer `submitted → triage` first write | **HTTP 201**, `idempotentReplay=false` |
| C | Consumer valid replay | **HTTP 200**, `idempotentReplay=true`, zero duplicates |
| D | Consumer conflicting idempotency reuse | **Denied** — zero additional side effects |
| E | Merchant `submitted → triage` first write | **HTTP 201**, `idempotentReplay=false` |
| F | Merchant valid replay | **HTTP 200**, `idempotentReplay=true`, zero duplicates |
| G | Non-owner consumer key reuse | **404** not-found-safe |
| H | Non-owner merchant key + client spoof | **404** not-found-safe |
| I | Legacy-unresolved owner | **404** not-found-safe |
| J | Nonexistent request ID | **404** not-found-safe |

Existence-leak normalization: **PASS** — denied cases equivalent.

## 10. Required success deltas

| Metric | Expected | Observed |
|---|---|---|
| Request status changes (`submitted → triage`) | **2** | **2** |
| New direct status-transition events | **2** | **2** |
| New successful `action.status` audits | **2** | **2** |
| Consumer replay duplicate events/audits | **0** | **0** |
| Merchant replay duplicate events/audits | **0** | **0** |
| Denied/conflicting/invalid-target side effects | **0** | **0** |
| Note audit delta | **0** | **0** |

Post-transaction `stateTransition` hook: **observed** as additional audit rows (best-effort, non-blocking); not counted toward direct `action.status` delta per Pack40C contract.

## 11. Post-QA preservation

| Check | Result |
|---|---|
| VionaRequest count | **Unchanged** (12 total) |
| Provenance distribution | **Unchanged** (5 legacy / 6 merchant / 1 consumer) |
| P4W digest | **Unchanged** |
| MerchantProfile count/activity | **Unchanged** |
| Legacy fixture | **Unchanged**, still `legacyUnresolved` |
| Cleanup/reversal | **None** |

## 12. Local quality gates (pre-staging)

| Gate | Result |
|---|---|
| Pack40CS static tests | **50/50 PASS** |
| `npx tsc --noEmit` | **PASS** |
| ESLint (Pack40CS scripts) | **PASS** |

## 13. Confirmations

| Item | Result |
|---|---|
| Direct DB mutation | **NO** (read-only DB; POST-only writes) |
| Deployment | **NO** |
| Migration | **NO** |
| Secret change | **NO** |
| Production | **NO** |
| Pack40A/B | **CLOSED/GREEN** (unchanged) |
| Pack40D/S | **Unimplemented** |
| Raw IDs/credentials in evidence | **NO** |

## 14. Pack40C closure recommendation

After this evidence PR merges and canonical handoff sync: **Pack40C may be marked CLOSED/GREEN** (direct status enforcement implemented, deployed v26, staging adversarial QA green).

## 15. Final classification

**`PACK40C_STAGING_STATUS_ADVERSARIAL_QA_GREEN`**

## 16. Recommended next operator action

Merge this evidence PR, then authorize canonical Pack40C closure sync (docs-only), e.g. a dedicated closure phrase or PR pattern matching Pack40B closure (#360).
