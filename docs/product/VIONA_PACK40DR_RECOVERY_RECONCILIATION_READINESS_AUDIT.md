# Pack40DR — Execution Recovery and Reconciliation Readiness Audit

Operator authorization: `APPROVE_PACK40DR_RECOVERY_RECONCILIATION_READINESS_AUDIT`

Mode: **read-only source audit + docs-only design packet**

**No implementation. No Prisma edit. No DB/staging/provider/escrow/deploy action.**

## Final classification

`READY_FOR_PACK40DR1_SCHEMA_PACKET`

## Schema decision

`PACK40DR_REQUIRES_RECOVERY_SCHEMA_PACKET`

Both of the following are material gaps:

1. **Lease fencing** — `leaseOwner` + `leaseExpiresAt` exist, but there is no `leaseGeneration` / recovery token to invalidate stale workers after recovery re-acquisition.
2. **Provider reference** — success persists only `providerExternalReferenceDigest` / `providerResultDigest` (one-way truncated SHA-256). Exact Twilio MessageSid cannot be reconstructed for safe exact-message reconciliation of `outcomeUncertain`.

---

## 1. Verified master SHA

`566782457ea1933b42e27f29abdd520ffec525e1`

## 2. PR #376 closure state

| Field | Value |
|---|---|
| State | **MERGED** |
| Title | `docs(viona): close initial Pack40D controlled merchant execution` |
| Merged at | `2026-07-15T21:49:45Z` |
| Merge commit | `566782457ea1933b42e27f29abdd520ffec525e1` |
| URL | https://github.com/laoton80-del/Ket-noi-eu/pull/376 |

Master ends at #376. No overlapping Pack40DR PR at audit start.

## 3. Current closed Pack40D scope

Canonical (unchanged by this audit):

```text
Pack40A: CLOSED/GREEN
Pack40B: CLOSED/GREEN
Pack40C: CLOSED/GREEN

Pack40D initial controlled merchant execution: CLOSED/GREEN
Pack40D signed-webhook execution: DISABLED
Pack40D approved internal dispatch: UNWIRED
Pack40D consumer execution: UNSUPPORTED
Pack40D legacy execution: UNSUPPORTED
Pack40D recovery/reconciliation: UNIMPLEMENTED (this audit designs only)

Pack40S: UNIMPLEMENTED / NOT AUTHORIZED
```

Closed scope is narrowly:

```text
internalAuthenticatedController
→ Pack40D2 claim
→ attempt-scoped escrow hold
→ Pack40D3A gateway + single-shot twilio_test_sms
→ escrow settle/refund
→ Pack40D2 terminal finalize
```

Pack40DR covers recovery of that pathway only.

## 4. Source inventory summary (pre-implementation baseline)

### 4.1 Attempt state machine

```text
claimed
→ providerPending
→ providerSucceeded | providerFailed | outcomeUncertain
→ completed | failed | abandoned
```

Active (partial-unique protected): `claimed`, `providerPending`, `providerSucceeded`, `providerFailed`, `outcomeUncertain`.  
Terminal: `completed`, `failed`, `abandoned` (abandoned enum exists; **no production writer** sets it today).

### 4.2 Lease fields and repository methods

Fields: `leaseOwner`, `leaseExpiresAt`, `claimedAt`. Index: `(state, leaseExpiresAt)`.

Repository (`vionaRequestExecutionAttemptRepository.ts`):

- CAS state transitions (`transitionVionaRequestExecutionAttemptState`)
- CAS lease update (`updateVionaRequestExecutionAttemptLease`)
- Prepare/outcome CAS helpers
- `findExpiredActiveVionaRequestExecutionAttemptLeases` (**query only**)

**No** expire/steal/recover application caller. **No** scheduler/worker.

### 4.3 Provider outcome persistence

| Outcome | Attempt state | Persisted identifiers |
|---|---|---|
| succeeded | `providerSucceeded` | `providerIdempotencyKey`, digests of result + optional SID hash |
| failed | `providerFailed` | failure digests (no SID) |
| uncertain | `outcomeUncertain` | uncertainty class digests; **no** result/SID digests |

Single-shot Twilio adapter (`vionaPack40D3TwilioGatewayAdapter.ts`): one transport call; no retry loop.

### 4.4 Escrow

Key: `escrow:{requestId}:{executionAttemptId}:twilio_test_sms`.  
Statuses: `HELD`, `SETTLED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `FAILED`.  
Hold row has **no** `executionAttemptId` column; binding is via idempotency key. Settle/refund keys are idempotent.

### 4.5 Current transactions

| Transaction | Shape |
|---|---|
| Claim (D2) | Serializable: create `claimed` + request `triage→inProgress` + event/audit |
| Prepare (D3A) | Serializable: `claimed→providerPending` + persist provider idempotency key |
| Provider call | **Outside** any DB transaction |
| Outcome (D3A) | Serializable: record succeeded/failed/uncertain vs prepared row + lease |
| Finalize (D2) | Serializable: request `inProgress→completed\|failed` + attempt terminal; **rejects** `outcomeUncertain` |
| Escrow hold/settle/refund | Separate escrow services; attempt-scoped keys; idempotent |

### 4.6 Retry paths today

- Pack40D coordinator: **no** provider retry.
- Gateway re-entry: fail-closed without adapter reinvoke.
- Internal POC re-call while active attempt exists: blocked by active-attempt / eligibility.
- Legacy Twilio retry loop: not used by Pack40D path.

### 4.7 Scheduler / worker

**None.** Recovery remains explicitly unimplemented.

---

## 5. Stranded-state inventory

See also `docs/design/VIONA_PACK40DR_RECOVERY_STATE_MATRIX.md`.

| # | Attempt | Request | Escrow (typical) | Provider certainty | Lease | Safe next | Forbidden | Operator review? |
|---|---|---|---|---|---|---|---|---|
| S1 | `claimed` lease live | `inProgress` | none or failed hold | none | unexpired | wait / complete original owner path; no new claim | second SMS; new attempt; lease steal while live | No (wait) / Yes if stuck beyond SLA |
| S2 | `claimed` lease expired, never prepared | `inProgress` | none/`FAILED` | none | expired | recovery may abandon **or** reopen prepare **only if** no provider key ever persisted | any provider send without prepare CAS; consumer/legacy rewrite | Yes before abandon |
| S3 | `providerPending`, no durable outcome | `inProgress` | `HELD` | unknown mid-call | any | reconcile provider by **exact** reference if available; else remain uncertain | blind send retry; settle/refund as known | Yes if no exact ref |
| S4 | `providerSucceeded` | `inProgress` | `HELD` or settle failed | known success | any | idempotent settle → finalize completed | rewrite as failed; second SMS | Prefer automatic after ownership CAS |
| S5 | `providerFailed` | `inProgress` | `HELD` or refund failed | known failure | any | idempotent refund/release → finalize failed | settle as success; second SMS | Prefer automatic after ownership CAS |
| S6 | `outcomeUncertain` | `inProgress` | `HELD` | unknown | any | exact provider recon only; else leave uncertain + held | settle; refund-as-known-fail; blind retry; finalize | **Required** until known |
| S7 | `providerSucceeded` | `inProgress` | `SETTLED` | known success | any | finalize completed only | refund success; new provider op | Low |
| S8 | `providerFailed` | `inProgress` | `REFUNDED` | known failure | any | finalize failed only | settle; new provider op | Low |
| S9 | active, lease expired | `inProgress` | any | depends | expired | acquire recovery ownership via CAS (+ generation) then apply S3–S8 | stale original worker finalize | If ambiguity remains |
| S10 | outcome recorded digests / no SID | `inProgress` | `HELD` | uncertain or digest-only | any | **schema+policy block** until durable redacted reference exists for Twilio lookup | destination listing; second send | Required |
| S11 | `completed` / `failed` / `abandoned` | terminal | terminal | terminal | n/a | no-op / audit only | any mutation | No |

Authoritative recovery rules preserved:

- no blind provider retry;
- no second SMS for the same attempt;
- no result transfer between attempts;
- no stale worker finalization;
- no tenant/profile authority expansion;
- no consumer/legacy recovery into merchant execution;
- no signed-webhook or internal-dispatch enablement.

Recovery operates on the **exact** attempt and durable truth only.

---

## 6. Attempt state policy (bounded design)

| State condition | Recovery policy |
|---|---|
| `claimed` + unexpired lease | Do **not** recover; original owner may proceed if still alive |
| `claimed` + expired + no `providerIdempotencyKey` | Recovery may (a) abandon with explicit approval, or (b) acquire ownership and continue prepare→provider for this attempt only — **never** create a second attempt while active |
| `providerPending` + no durable outcome | Exact provider recon if reference exists; else remain `outcomeUncertain` / pending review; **no send** |
| `providerSucceeded` + request `inProgress` | Settle (idempotent) → finalize completed |
| `providerFailed` + request `inProgress` | Refund/release (idempotent) → finalize failed |
| `outcomeUncertain` | Exact recon only; never settle/refund-as-known/finalize until known |
| `completed` / `failed` | Immutable |
| `abandoned` | Terminal; future writer only via explicit approved abandon path |

**No new `VionaRequest` statuses.** Existing attempt states are sufficient for behavior classification; schema gaps are lease generation + durable provider reference (below).

---

## 7. Lease recovery design

| Question | Decision |
|---|---|
| Who detects expired leases? | Recovery service query via `(state, leaseExpiresAt)` for active states |
| Who acquires ownership? | `SYSTEM_RECOVERY_PRINCIPAL` via CAS update of `leaseOwner` / `leaseExpiresAt` **plus generation** |
| Lease stealing? | Only when `leaseExpiresAt < now` AND expected generation matches; never while unexpired |
| CAS predicate | `id` + `state ∈ expected` + `leaseOwner` (optional) + **`leaseGeneration` expected** (proposed) |
| Recovery generation/token needed? | **Yes** — without it, expired original worker may race a recoverer |
| Stale worker prevention | Every prepare/outcome/finalize write must require expected `leaseOwner` **and** `leaseGeneration` |
| Max recovery attempts | Bound operational retries of **recovery ownership acquisition** (e.g. 3); not provider send retries |
| Lease duration/renewal | Preserve current claim lease semantics; recovery renews only after successful CAS acquire |
| Without background worker? | **Yes** — stage-1 operator-invoked internal recovery endpoint can scan/claim one attempt |

Application-memory locks: **rejected**.

Classification contribution: lease generation required → part of recovery schema packet.

---

## 8. Provider reconciliation design

### Capability today

Twilio can support **exact MessageSid fetch** when the SID is known. Pack40D persists only digests of SID / result — **not** the SID — so `outcomeUncertain` cannot be safely reconciled to known success/failure from DB alone.

### Required rules (future implement)

1. No broad message listing.
2. No destination-based inference.
3. No retry solely because outcome is unknown.
4. Exact provider reference must bind the same attempt + provider idempotency key.
5. Known delivered/accepted → may transition `outcomeUncertain|providerPending → providerSucceeded` under CAS.
6. Known rejected / never-created → may become `providerFailed` **only** when provider evidence proves no send.
7. Still-unknown → remain `outcomeUncertain`.
8. Reconciliation **must not** invoke another send.

### Proposed durable reference (schema packet — conceptual)

Store a **server-only encrypted or vaulted** MessageSid (or Twilio URI) plus existing digests for integrity checks. Public/API responses continue to expose digests only. Never commit plaintext SID in logs/evidence.

Until present: classify provider recon **blocked by schema**.

---

## 9. Escrow reconciliation design

| Case | Safe action |
|---|---|
| A. `providerSucceeded` + hold `HELD` | Idempotent settle → then finalize completed |
| B. `providerFailed` + hold `HELD` | Idempotent refund/release → then finalize failed |
| C. `outcomeUncertain` + `HELD` | **Hold remains**; no settle/refund as known |
| D. settled + request not completed | Finalize completed only |
| E. refunded + request not failed | Finalize failed only |
| F. escrow op uncertain | Operator review; do not invert provider truth |

Principles:

- provider success never rewritten as failure;
- known failure never settled as success;
- uncertain never treated as known success/failure;
- escrow keys bind request + attempt + operation (current keys sufficient);
- duplicate settle/refund remain idempotent (current design sufficient);
- terminal request finalization follows durable provider **and** escrow truth.

**Escrow schema sufficiency:** keys/status model adequate for recovery **operations**. No escrow column for attempt ID is acceptable while key binding remains mandatory and verified.

---

## 10. Crash matrix

| Crash point | Provider call? | Escrow change? | Auto recovery? | Operator? | Safe residual | Forbidden |
|---|---|---|---|---|---|---|
| 1 Before claim | No | No | N/A | No | no attempt | invent attempt |
| 2 After attempt create, before request `inProgress` | No | No | repair claim atomicity / abandon orphan attempt | Yes if orphan exists (should be impossible under current Serializable claim) | terminal or completed claim tx | provider send |
| 3 After claim commit | No (unless continue) | hold next | wait or recover expired `claimed` | If stuck | `claimed`/`inProgress` | second claim |
| 4 After escrow hold | Yes only via prepare | held | continue same attempt only | If stalled | `claimed`+`HELD` | release as failure without provider truth |
| 5 After provider key persistence | Call may occur once | held | exact recon / continue outcome write | if uncertain | `providerPending` | second send |
| 6 During provider call | in flight | held | exact recon; no blind retry | Yes if unknown | pending/uncertain | second send |
| 7 After provider success, before outcome record | already sent | held | exact recon → record succeeded | Yes if no ref | uncertain until known | deny success |
| 8 After outcome, before escrow resolve | No | resolve | settle/refund per outcome | Low | provider terminal-ish | invert outcome |
| 9 After escrow resolve, before finalize | No | terminal escrow | finalize only | Low | `inProgress` + ready | new provider/escrow |
| 10 During finalize tx | No | no further | retry finalize CAS | Low | `inProgress` until commit | status mutation via Pack40C |
| 11 After terminal commit, before HTTP | No | no | no-op | No | terminal durable | resend as “retry” |

Rule: **no recovery transaction may cross a provider network call.**

---

## 11. Recovery principal design

Concept: `SYSTEM_RECOVERY_PRINCIPAL`

| Attribute | Design |
|---|---|
| Not | public authenticated owner; arbitrary admin JSON; caller tenant/profile; signed-webhook authority |
| Trusted origin | Internal authenticated recovery route / future scheduler under service identity; credentials not caller-supplied merchant fields |
| Action categories | lease acquire; provider status query (read-only exact); outcome record CAS; escrow settle/refund idempotent; terminal finalize; explicit abandon |
| Attempt binding | exact `executionAttemptId` + expected state + lease generation |
| Tenant/profile | recompute from request + MerchantProfile snapshots; fail closed on drift |
| Audit identity | `actorRoleLabel: 'execution_recovery_service'` (conceptual) |
| Permissions | cannot start **new** provider send; cannot open new attempt while active; cannot enable other triggers |
| Consumer/legacy | denied |

Do **not** implement in this pack.

---

## 12. Scheduler / worker decision

**Recommended stage-1 model: A — operator-invoked internal recovery endpoint.**

| Model | Verdict |
|---|---|
| A Internal recovery endpoint | **Chosen first** — minimal autonomous writes; explicit auth; one-attempt-at-a-time |
| B Scheduled scanner | Later optional; higher autonomy; needs deploy + lock discipline |
| C Queue/worker | Deferred; highest ops complexity |
| D Read-only report only | Insufficient for stranded `inProgress` closure; may accompany A as dry-run mode |

Stage-1 constraints:

- no public route;
- max one attempt mutated per invocation;
- dry-run mode recommended before write mode;
- no scheduler enabled by this audit.

---

## 13. Atomic recovery operations (design)

Each is a **DB transaction without network I/O**. Provider status fetch occurs in a separate phase before outcome-record tx.

1. **Claim recoverable attempt** — CAS leaseOwner + renew lease + bump `leaseGeneration` where expired + expected gen.
2. **Record provider reconciliation** — CAS from `providerPending|outcomeUncertain` to `providerSucceeded|providerFailed` with exact attempt + gen + key binding (or remain uncertain).
3. **Settle/refund escrow** — existing idempotent settle/refund with attempt-scoped key verification.
4. **Complete succeeded** — existing D2 finalize-completed under recovery lease ownership.
5. **Fail failed** — existing D2 finalize-failed under recovery lease ownership.
6. **Abandon** — only from explicitly approved non-provider-started states (e.g. expired `claimed` without prepare); sets `abandoned` + request policy (remain `inProgress`→`failed` **or** dedicated operator policy — **must choose in Pack40DR2**; interim recommendation: finalize request `failed` with failure class `abandoned_before_provider` only when no provider key exists).

No Pack40C direct status writer. No new request statuses.

---

## 14. Event and audit design (conceptual categories)

- `execution.recovery.claimed`
- `execution.recovery.provider_reconciled_success`
- `execution.recovery.provider_reconciled_failure`
- `execution.recovery.provider_still_uncertain`
- `execution.recovery.escrow_reconciled`
- `execution.recovery.terminal_completed`
- `execution.recovery.stale_rejected`
- `execution.recovery.operator_review_required`

Do not create these in code during this audit.

---

## 15. Public / internal response policy

- No public recovery route.
- Unauthorized callers must receive existence-leak-safe denials.
- Never expose tenant/profile mismatch detail, credentials, Twilio SID, escrow IDs, lease owner, or raw attempt internals to unauthorized clients.
- Operator/internal responses may use sanitized reason codes only.

---

## 16. Schema decision detail

### Decision token

`PACK40DR_REQUIRES_RECOVERY_SCHEMA_PACKET`

### Conceptual field proposals (do not implement here)

On `VionaRequestExecutionAttempt`:

| Field | Type (conceptual) | Purpose |
|---|---|---|
| `leaseGeneration` | `Int` default 0 | Fence stale workers after recovery acquire |
| `providerExternalReferenceCiphertext` (or vault ref) | `String?` | Durable exact Twilio MessageSid/URI under server crypto |
| `providerExternalReferenceKeyId` | `String?` | Key rotation id |
| Keep | existing digests + `providerIdempotencyKey` | Integrity / idempotency |

Constraints:

- Writes that mutate lease ownership must increment `leaseGeneration`.
- Outcome/finalize CAS must match expected generation.
- Ciphertext readable only by recovery/gateway server paths; never returned on public DTOs.
- Optional: `recoveryClaimCount` / `lastRecoveryAt` for observability (not required for correctness).

Escrow table: **no change required** if attempt id remains embedded and verified in idempotency key.

---

## 17. Pack decomposition

| Pack | Proposed phrase | Scope |
|---|---|---|
| **Pack40DR1** | `APPROVE_PACK40DR1_RECOVERY_SCHEMA_PACKET` | Additive schema/migration for lease generation + durable redacted provider reference; repository CAS helpers; **no** runtime recovery wiring |
| **Pack40DR2** | `APPROVE_PACK40DR2_DORMANT_RECOVERY_SERVICES` | Dormant recovery principal + reconcile/finalize services + local tests; **no** HTTP enablement |
| **Pack40DR3** | `APPROVE_PACK40DR3_CONTROLLED_RECOVERY_RUNTIME_WIRING` | Internal recovery endpoint (operator) + wiring; still no signed-webhook/dispatch |
| **Pack40DRD** | `APPROVE_PACK40DRD_STAGING_RECOVERY_DEPLOY` | Deploy only |
| **Pack40DRS** | `APPROVE_PACK40DRS_STAGING_RECOVERY_QA` | Staging adversarial recovery QA |

Each pack requires **separate** operator authorization. No automatic continuation.

**Next authorized pack:** Pack40DR1 schema packet.

---

## 18. Implementation file forecast

| File | Pack |
|---|---|
| `prisma/schema.prisma` + migration | DR1 |
| `vionaRequestExecutionAttemptRepository.ts` (generation CAS) | DR1 |
| future `vionaRequestExecutionRecoveryPrincipal.ts` | DR2 |
| future `vionaRequestExecutionRecoveryService.ts` | DR2 |
| future Twilio exact-status recon adapter (read-only) | DR2 |
| future internal recovery controller/route | DR3 |
| scripts `test-viona-pack40dr*.ts` | DR1–DR3 |
| staging verify scripts | DRS |

No files modified in production source by this audit.

---

## 19. Required test plan (future packs)

1. expired lease detection  
2. active lease not recoverable  
3. stale worker rejected (generation mismatch)  
4. exact attempt recovery binding  
5. consumer/legacy denied  
6. wrong tenant/profile denied  
7. `providerSucceeded` finalization  
8. `providerFailed` finalization  
9. `outcomeUncertain` no blind retry  
10. exact Twilio reference reconciliation  
11. no broad provider lookup  
12. duplicate reconciliation idempotent  
13. escrow settlement idempotent  
14. escrow refund/release idempotent  
15. provider success never rewritten as failure  
16. provider failure never settled as success  
17. crash after provider outcome  
18. crash after escrow resolution  
19. duplicate recovery job  
20. terminal attempt immutable  
21. no additional trigger enabled  
22. Pack40A/B/C unchanged  
23. closed initial Pack40D forward path unchanged  
24. Pack40S unimplemented  

---

## 20. Pack40S boundary

Pack40DR does **not** absorb:

- additional triggers;
- additional providers beyond bounded `twilio_test_sms` recon for this flow;
- consumer execution;
- signed-webhook execution;
- support/admin global tools;
- broader Pack40S adversarial tenant suite.

---

## 21. No-implementation confirmation

This pack:

- created **docs only**;
- performed **no** Prisma/schema/migration edits;
- performed **no** source/test implementation of recovery;
- performed **no** DB query against staging/production;
- performed **no** Twilio/provider/escrow/deploy/secret action;
- did **not** enable signed-webhook execution, internal dispatch, consumer/legacy, or Pack40S.

---

## 22. Recommended next authorization

```text
APPROVE_PACK40DR1_RECOVERY_SCHEMA_PACKET
```

Scope: additive lease-generation + durable redacted provider-reference schema/migration + repository CAS helpers + local schema tests only.  
Does **not** authorize recovery runtime, scheduler, live Twilio recon calls, staging deploy, or Pack40S.

---

## 23. Final classification (repeat)

`READY_FOR_PACK40DR1_SCHEMA_PACKET`
