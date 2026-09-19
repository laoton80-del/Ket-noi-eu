# VIONA REC2: Two-Stage Merge Control Design (V1)

**Revision status:** V1 REVISED — gaps closed per
`VIONA.REC2.MERGE_CONTROL.LANE_A.DESIGN_REVISION.V1`
(prior review: `DESIGN_REVISION_REQUIRED`, 7 gaps identified).
This revision upgrades the document from *directionally correct* to
*implementation-deterministic*. Lane B1 must not need to invent token
consumption semantics, replay protection, concurrency handling, failure
behavior, audit fields, wrapper verification rules, or test cases — all are
fixed below.

## 1. Overview and Purpose
This document defines the canonical architecture for VIONA's two-stage merge-control mechanism. It resolves the semantic gap where GitHub mechanically conflated "technical engineering readiness" with "explicit Governor merge authority."

The target state requires **both** stages to be mechanically satisfied in GitHub Branch Protection before a PR can be merged, ensuring Zero-Loss economics and strict Governance control.

## 2. Stage 1: Viona Merge Readiness Gate
**Canonical Context:** `Viona Merge Readiness Gate`
**Semantic Meaning:** *This PR is technically and procedurally ready for a Governor merge authorization decision.*

**Validation Requirements:**
* Exact PR number and exact Head SHA.
* Expected base branch (e.g., `master`).
* Valid, exact-head human approval (no stale reviews, no head drift).
* All Preflight / CI checks passed.
* Review conversation resolution.
* Deterministic `reviewed_scope_digest` generated and validated.
* Branch protection state and mergeability (no conflicts).

*Constraint:* Stage 1 MUST NOT contain any authorization tokens, `authority=MERGE` flags, or grant permission to execute the merge. Stage 1 replaces the legacy `Viona Merge Authorization Gate` context to clarify its semantic boundary.

**Stage 1 identity (retained for Stage 2 binding):** every Stage 1 success emits, and Stage 2 must later bind to, an immutable tuple:
```
stage1_check_name      = "Viona Merge Readiness Gate"
stage1_check_run_id    = <GitHub check-run id>
stage1_head_sha        = <exact head SHA Stage 1 evaluated>
stage1_completed_at    = <ISO-8601 timestamp>
stage1_conclusion      = success | failure
```

## 3. Stage 2: Viona Explicit Merge Authorization
**Canonical Context:** `Viona Explicit Merge Authorization`
**Semantic Meaning:** *The Governor explicitly authorizes one merge of one exact PR revision under one exact merge mode.*

### 3.1 Authorization identity
Each Stage 2 authorization MUST carry a unique, immutable `authorization_id`
(a cryptographically strong nonce — e.g., a UUIDv4 or a 256-bit random hex
string generated at issuance time). The `authorization_id` is the primary key
of the authorization and of its consumption record (§6). It MUST NEVER be
derived only from the PR number, and MUST NEVER be guessable, reused, or
recomputed deterministically from public inputs alone.

### 3.2 Binding (complete)
A Stage 2 authorization is bound strictly and exclusively to:
* Repository Identity
* PR Number & exact Head SHA
* Base Branch & Merge Mode
* `reviewed_scope_digest` (must equal Stage 1's digest)
* **Stage 1 identity**: `stage1_check_name`, `stage1_check_run_id`,
  `stage1_head_sha`, `stage1_completed_at`, `stage1_conclusion` (§2)
* Governor authorizing actor identity
* `authorized_at` (issuance timestamp)
* `expires_at` (issuance timestamp + TTL, default 15 minutes)
* `authorization_id` (§3.1)

Stage 2 MUST fail (non-success, `NO MERGE AUTHORITY`) if any of the following
hold at evaluation time:
* Stage 1 is missing for the exact head SHA.
* Stage 1's `stage1_conclusion` is not `success`.
* Stage 1 is bound to a different head SHA than the one Stage 2 targets.
* Stage 1 has been superseded by a head change (a newer commit exists on the
  PR after `stage1_completed_at`).

## 4. Stage 2 Authorization Lifecycle

### 4.1 States
Every Stage 2 authorization occupies exactly one of the following states at
any instant:

```
ISSUED       — authorization record created; not yet validated as usable.
ACTIVE       — validation succeeded; authorization may be claimed for merge.
CONSUMING    — an atomic claim has been taken; merge attempt is in flight.
CONSUMED     — merge confirmed complete; authorization permanently spent.
EXPIRED      — TTL elapsed before consumption; permanently unusable.
REVOKED      — Governor explicitly revoked; permanently unusable.
INVALIDATED  — an invalidation trigger (§5) fired; permanently unusable.
```

### 4.2 Valid transitions
```
ISSUED
  ↓ validation succeeds (identity + binding + Stage 1 checks pass)
ACTIVE
  ↓ atomic merge-consumption claim succeeds (§4.4)
CONSUMING
  ↓ merge confirmed by GitHub (read-back proves merge_commit_sha exists)
CONSUMED                                              [TERMINAL]

ISSUED
  ↓ validation fails (any binding/Stage-1/freeze check fails)
INVALIDATED                                            [TERMINAL]

ACTIVE
  ↓ TTL elapsed (now > expires_at)
EXPIRED                                                [TERMINAL]

ACTIVE
  ↓ Governor issues explicit revocation
REVOKED                                                [TERMINAL]

ACTIVE
  ↓ any invalidation trigger fires (§5)
INVALIDATED                                            [TERMINAL]

CONSUMING
  ↓ GitHub merge call fails with a definitive rejection
   (SAFE_RETRYABLE_FAILURE, §4.5)
ACTIVE  (only if no partial merge side-effect occurred — see §4.5)

CONSUMING
  ↓ GitHub merge call fails with a definitive, non-recoverable rejection
   (NON_RETRYABLE_FAILURE, §4.5)
INVALIDATED                                            [TERMINAL]

CONSUMING
  ↓ result cannot be determined
   (MERGE_RESULT_UNKNOWN, §4.5)
CONSUMING  (held; no further claim permitted until reconciliation, §4.6)
```

`CONSUMED`, `EXPIRED`, `REVOKED`, and `INVALIDATED` are terminal: no
authorization MAY transition out of these states, and no `authorization_id`
that has reached any terminal state may ever be reused, replayed, reissued
under the same identity, or treated as valid by any evaluator.

### 4.3 Atomic consumption principle
The design mandates the following exact ordering, and forbids any other:

```
VERIFY
  → CLAIM AUTHORIZATION   (atomic transition ACTIVE → CONSUMING)
  → MERGE                 (exactly one GitHub merge API call)
  → RECORD MERGE RESULT   (atomic transition CONSUMING → CONSUMED,
                            writing merge_commit_sha)
```

The design explicitly forbids:

```
VERIFY → MERGE → MARK CONSUMED LATER
```

because deferring the consumption claim until after the merge call permits a
replay race: two concurrent evaluators could both pass VERIFY and both issue
a MERGE call before either records consumption.

### 4.4 Single-claim guarantee
The `ACTIVE → CONSUMING` transition MUST be an atomic compare-and-set style
claim keyed on `authorization_id`: exactly one caller may successfully move a
given `authorization_id` from `ACTIVE` to `CONSUMING`. Only the caller that
wins this atomic claim may proceed to the GitHub merge call. All other
concurrent callers attempting the same claim MUST fail closed immediately
with `NO MERGE AUTHORITY` and MUST NOT retry the same `authorization_id`.

The authoritative storage mechanism for this atomic claim (e.g., the GitHub
Check Run itself used as a single-writer resource via conditional update,
or an external append-only ledger with a compare-and-set primitive) is a
Lane-B implementation decision, but the semantics in this section are fixed
and non-negotiable:
* Lookup of an `authorization_id`'s current state MUST be deterministic.
* Duplicate consumption attempts MUST fail closed.
* Every state transition MUST be recorded and auditable (§6, §9).

### 4.5 Merge failure during consumption
If an authorization reaches `CONSUMING` and the GitHub merge call does not
cleanly succeed, the design distinguishes exactly three outcomes:

```
SAFE_RETRYABLE_FAILURE
  — GitHub definitively rejected the merge BEFORE any merge commit could
    have been created (e.g., HTTP 405 "not mergeable", HTTP 409 head SHA
    mismatch reported by the merge endpoint itself, HTTP 422 validation
    error). No merge_commit_sha exists. The authorization MAY transition
    back to ACTIVE only if all binding conditions (§3.2) are re-verified
    as still valid and expires_at has not elapsed; otherwise it must move
    to INVALIDATED or EXPIRED per the normal rules.

NON_RETRYABLE_FAILURE
  — GitHub definitively rejected the merge for a reason that cannot change
    without new human action (e.g., branch protection now requires an
    additional check that does not exist, review was dismissed mid-flight).
    The authorization transitions to INVALIDATED. A brand-new authorization
    (new authorization_id) must be issued after the underlying condition is
    fixed; the old id is permanently dead.

MERGE_RESULT_UNKNOWN
  — The merge API call's result could not be determined (e.g., network
    timeout after the request was sent, connection reset, ambiguous HTTP
    5xx). The authorization remains in CONSUMING and MUST NOT be reissued,
    retried, or treated as failed. See §4.6.
```

No failure branch may silently grant or restore authority without passing
back through full validation.

### 4.6 Merge-result-unknown reconciliation
When an authorization is held in `CONSUMING` due to `MERGE_RESULT_UNKNOWN`,
the design requires:

1. No further merge attempt may be made using this or any other
   `authorization_id` for the same PR/head until reconciliation completes.
2. A read-only reconciliation check MUST be performed against GitHub's
   actual PR state (`GET /pulls/{pr}`, `GET /pulls/{pr}/commits`, and the
   repository's commit graph on the base branch) to determine, with
   certainty, whether the merge actually completed.
3. If reconciliation proves the merge completed: transition
   `CONSUMING → CONSUMED`, recording the discovered `merge_commit_sha`.
4. If reconciliation proves the merge did NOT complete and no side effect
   occurred: transition `CONSUMING → INVALIDATED` (a fresh authorization
   must be issued for any subsequent attempt — the original id is not
   reused, to avoid any ambiguity about which attempt eventually "won").
5. If reconciliation cannot reach certainty: the authorization remains in
   `CONSUMING` indefinitely and is surfaced for manual Governor review. It
   MUST NOT be auto-resolved.

Blind reissue or reuse of authority while a `CONSUMING`/unknown state is
outstanding is forbidden under all circumstances.

## 5. Complete Invalidation Triggers

A Stage 2 authorization in `ISSUED` or `ACTIVE` state is immediately and
irreversibly moved to `INVALIDATED` (or the more specific terminal state
noted) upon any of the following:

```
PR closed without merge                → INVALIDATED
PR head changes                        → INVALIDATED
base branch changes                    → INVALIDATED
review dismissed                       → INVALIDATED
required approval becomes stale        → INVALIDATED
review requirement changes             → INVALIDATED
reviewed_scope_digest changes          → INVALIDATED
merge mode changes                     → INVALIDATED
Stage 1 invalidated / replaced         → INVALIDATED
required-check policy changes materially → INVALIDATED
authorization expires (TTL elapsed)    → EXPIRED
Governor revokes authorization         → REVOKED
merge succeeds                         → CONSUMED
```

`PR closed without merge` is explicitly and permanently listed as an
invalidation trigger: closing a PR without merging invalidates any
outstanding Stage 2 authorization for it, with no exception.

## 6. Consumption Ledger

Every Stage 2 authorization has exactly one canonical consumption record,
keyed by `authorization_id`, containing at minimum:

```
authorization_id
repository
pr_number
head_sha
reviewed_scope_digest
merge_mode

authorized_by
authorized_at

consumption_started_at
consumed_at

merge_commit_sha
consumed_by

final_state
```

Required semantics (fixed now; storage mechanism is a Lane-B decision):
* Lookup of a record by `authorization_id` MUST be deterministic — the same
  id always resolves to the same record and the same current state.
* An attempt to consume an `authorization_id` that is not in `ACTIVE` state
  MUST fail closed (return `NO MERGE AUTHORITY`), including for
  already-`CONSUMED`, `EXPIRED`, `REVOKED`, or `INVALIDATED` records.
* Every state transition (§4.2) MUST append an entry to this record (or an
  equivalent tamper-evident append-only log referencing it) sufficient to
  reconstruct the full lifecycle history (§9).

## 7. Concurrency Model

The design explicitly addresses the following scenarios. Default behavior
in every case, absent an explicit exception below, is **FAIL CLOSED**.

```
Two operators invoke merge concurrently for the same authorization_id
  → exactly one wins the atomic ACTIVE→CONSUMING claim (§4.4); the other
    fails closed immediately with NO MERGE AUTHORITY, no retry.

Same authorization submitted twice (duplicate request, e.g. double-click)
  → the second submission observes the authorization already CONSUMING or
    CONSUMED and fails closed; it never re-triggers a merge call.

Different authorizations exist for the same PR/head/scope/mode target
  → forbidden by construction; see §8, MAX_ACTIVE_AUTHORIZATIONS_PER_EXACT_TARGET = 1.

Head changes while one merge is executing
  → the in-flight CONSUMING authorization is unaffected mid-flight (it was
    claimed against a specific head SHA at claim time), but no NEW
    authorization may be issued or validated against the old head once the
    change is observed; the old head's authorization, if not yet CONSUMED,
    is INVALIDATED per §5 as soon as the change is detected.

Authorization expires during execution (already CONSUMING when TTL elapses)
  → expiry does not retroactively invalidate a claim already in CONSUMING;
    however, if CONSUMING stalls past a bounded execution timeout without
    reaching CONSUMED, it is treated as MERGE_RESULT_UNKNOWN (§4.6), never
    silently re-activated.

Review becomes invalid during execution
  → if detected before the atomic claim (ACTIVE→CONSUMING), the claim must
    re-verify review validity as part of §4.4's verification and fail
    closed; if detected after the claim is already CONSUMING, it does not
    abort an in-flight merge call already sent to GitHub (which would
    itself be an unsafe unknown-result scenario) — resolution follows §4.6
    if the outcome is ambiguous.

Branch protection changes after verification
  → the wrapper's final pre-merge recheck (§10) MUST re-read current branch
    protection immediately before claiming; if it has changed materially
    since Stage 1/Stage 2 evaluation, the wrapper aborts (fails closed)
    before claiming, per the Failure/Recovery Matrix (§9).

GitHub state changes between verify and merge
  → covered by the mandatory immediate-pre-merge recheck in §10; any
    detected drift aborts before the atomic claim is taken.

Network timeout after GitHub accepts the merge request
  → treated as MERGE_RESULT_UNKNOWN (§4.5, §4.6); reconciliation against
    GitHub's actual state is mandatory before any further action.
```

## 8. Single Active Authorization

For one exact tuple:

```
repository
PR
head SHA
base
reviewed_scope_digest
merge mode
```

the rule is:

```
MAX_ACTIVE_AUTHORIZATIONS_PER_EXACT_TARGET = 1
```

At most one authorization may be in `ISSUED` or `ACTIVE` state for a given
exact tuple at any time. Issuing a new authorization for the same exact
tuple while a prior one is still `ISSUED`/`ACTIVE` MUST either:
* explicitly revoke/replace the earlier authorization (transitioning it to
  `REVOKED` as an atomic part of issuing the new one, with the revocation
  recorded per §6), or
* fail outright, refusing to issue the new authorization.

Ambiguous parallel authority (two simultaneously `ACTIVE` authorizations for
the same exact tuple) is forbidden by construction and must never occur.

## 9. Global Merge Freeze & Exception Model

`GLOBAL_MERGE_FREEZE` is elevated from a procedural flag to a mechanically
enforced control inside the Stage 2 evaluator itself (not documentation,
not chat discipline, not operator memory).

**Default behavior:** while `GLOBAL_MERGE_FREEZE = ACTIVE`, Stage 2 MUST
remain non-success (`NO MERGE AUTHORITY`) for every authorization request,
unconditionally, regardless of any other input being otherwise valid —
unless a valid explicit freeze exception exists for that exact request.

**Freeze exception binding:** an exception is never global or reusable. It
must be bound to the exact same tuple as the authorization it enables:
```
repository
PR
head SHA
authorization_id
reviewed_scope_digest
merge mode
authorized (exception-granting) actor
time window (start/expiry)
```
A generic or globally reusable freeze bypass is forbidden. An exception
that does not name an exact PR, exact head SHA, and exact `authorization_id`
is invalid and MUST be rejected by the Stage 2 evaluator.

**Result:** because GitHub Branch Protection requires the Stage 2 context,
an active freeze without a matching exact exception mechanically blocks all
merges at the platform level — not merely by convention.

## 10. Failure / Recovery Matrix

Every row below resolves, absent a proven valid active Stage 2 artifact, to
**NO MERGE AUTHORITY**.

| Condition | Required result |
|---|---|
| Stage 1 missing | Stage 2 denied — NO MERGE AUTHORITY |
| Stage 1 failure | Stage 2 denied — NO MERGE AUTHORITY |
| Stage 2 missing | Merge blocked (GitHub required-check gate) |
| Stage 2 failure | Merge blocked — NO MERGE AUTHORITY |
| Wrong PR | Reject — NO MERGE AUTHORITY |
| Wrong head SHA | Reject — NO MERGE AUTHORITY |
| Wrong base | Reject — NO MERGE AUTHORITY |
| Wrong digest | Reject — NO MERGE AUTHORITY |
| Wrong merge mode | Reject — NO MERGE AUTHORITY |
| Expired authorization | Reject — NO MERGE AUTHORITY (state=EXPIRED) |
| Revoked authorization | Reject — NO MERGE AUTHORITY (state=REVOKED) |
| Consumed authorization (replay) | Reject — NO MERGE AUTHORITY (state=CONSUMED) |
| Review dismissed | Invalidate — NO MERGE AUTHORITY (state=INVALIDATED) |
| Approval stale | Invalidate — NO MERGE AUTHORITY (state=INVALIDATED) |
| Head changed | Invalidate — NO MERGE AUTHORITY (state=INVALIDATED) |
| Branch protection changed | Re-evaluate / fail closed — wrapper aborts (§7) |
| Workflow failure | No authority — NO MERGE AUTHORITY |
| Check producer failure | No authority — NO MERGE AUTHORITY |
| Merge result unknown | Reconciliation required (§4.6) — no new authority issued |
| GitHub API timeout | Do not assume merge failed — treat as MERGE_RESULT_UNKNOWN (§4.5) |
| Freeze active, no exception | Stage 2 denied — NO MERGE AUTHORITY (§9) |
| Concurrent duplicate claim | Second claim fails closed — NO MERGE AUTHORITY (§7) |
| PR closed without merge | Invalidate — NO MERGE AUTHORITY (§5) |

## 11. Audit Trail (complete)

The retained, append-only (or equivalently tamper-evident) authorization
record MUST contain at minimum:

```
authorization_id

repository
pr_number
base_branch
head_sha
reviewed_scope_digest
merge_mode

stage1_check_run_id
stage1_completed_at

authorized_by
authorized_at
expires_at

revoked_at
revoked_by
revocation_reason

consumption_started_at
consumed_at
consumed_by

merge_commit_sha
merge_api_result

final_authorization_state
```

This record must never be edited in place after being written; corrections,
if ever needed, are recorded as new append-only entries referencing the
original `authorization_id`, never as destructive overwrites. This makes
the trail sufficient to answer, for any past merge: who authorized it, for
what PR and exact SHA, with what reviewed-scope digest and merge mode, when
authorized, when consumed, and what merge commit resulted.

## 12. Execution Model & Guarded Wrapper

**The Canonical Execution Path:**
`scripts/viona-guarded-pr-merge.mjs` is designated as the sole intended
consumer of the Stage 2 authorization token.

Immediately prior to invoking the GitHub Merge API, and as part of the
atomic claim sequence (§4.3), the wrapper MUST revalidate every one of the
following, in full, against live GitHub state:

```
PR still open
exact PR number
exact head SHA
base branch

Stage 1 check identity + success (stage1_check_run_id, conclusion=success)
Stage 2 check identity + success

authorization_id resolves to a record
authorization state = ACTIVE
authorization not expired (now < expires_at)
authorization not revoked
authorization not already consumed

review still valid
approval still exact-head

reviewed scope digest unchanged (recomputed and compared)

requested merge mode == authorized merge mode

GLOBAL_MERGE_FREEZE state
valid explicit freeze exception bound to this exact authorization_id (§9)

current branch protection (re-read, not cached)
required checks still satisfied

no unresolved required conversations
```

Only if every item above passes does the wrapper proceed to:

```
atomic authorization claim (ACTIVE → CONSUMING, §4.4)
  → exactly one merge request
  → record merge result (CONSUMING → CONSUMED, §4.3)
```

If any item fails, the wrapper aborts before claiming and reports the exact
failing condition; it never partially claims and never issues a merge call
on a failed recheck.

## 13. Direct Merge Bypass & Defense-in-Depth
Relying on two required contexts conceptually closes the semantic gap. However, to prevent users with Admin/Owner privileges from bypassing the `viona-guarded-pr-merge.mjs` wrapper via the GitHub UI:
* **Primary Defense:** GitHub Branch Protection mandates both Stage 1 and Stage 2 contexts. Without Stage 2, the UI merge button remains disabled.
* **Secondary Defense:** Future iterations should evaluate GitHub Rulesets locking target branches to specific trusted GitHub Apps or automated actor restrictions, entirely removing direct human merge privileges.

## 14. Implementation Acceptance Test Matrix

Acceptance testing SHOULD use dry-run mode, mocked/local evaluator fixtures,
or a disposable non-production PR/test surface wherever possible. No real
production/master merge is required merely to exercise authorization
mechanics; only the final end-to-end proof (T01, T16) strictly requires
observing actual branch-protection behavior, which can itself be done via a
disposable test branch/PR rather than a production merge.

| ID | Case | Setup | Expected result |
|---|---|---|---|
| T01 | Stage 1 only | Stage 1 = success, Stage 2 = missing | Merge mechanically blocked by branch protection |
| T02 | Correct authorization | exact PR, exact head, exact digest, exact mode, valid approval, Stage 1 success, valid Governor authorization | Stage 2 = success |
| T03 | Wrong PR | authorization issued for a different PR number | REJECT |
| T04 | Wrong SHA | authorization issued for a different head SHA | REJECT |
| T05 | Wrong digest | reviewed_scope_digest does not match live PR files | REJECT |
| T06 | Wrong merge mode | requested mode != authorized mode | REJECT |
| T07 | Expired authorization | now > expires_at | REJECT |
| T08 | Revoked authorization | Governor revoked before use | REJECT |
| T09 | Replay consumed authorization | authorization already in CONSUMED state | REJECT |
| T10 | Head changes after Stage 2 | PR head SHA advances after Stage 2 success | Stage 2 authority INVALIDATED; merge blocked |
| T11 | Review invalidated | approving review dismissed after authorization issued | authorization INVALIDATED; merge blocked |
| T12 | Concurrent consumption | two consumers attempt the same authorization_id simultaneously | exactly one claims (CONSUMING); the other fails closed |
| T13 | Merge API timeout after request | GitHub accepts request but response is lost | do not retry blindly; reconcile actual PR/commit-graph state first (§4.6) |
| T14 | Branch protection drift | required contexts change between verification and claim | wrapper aborts before claiming |
| T15 | Freeze active without exception | GLOBAL_MERGE_FREEZE=ACTIVE, no exception present | Stage 2 cannot become success |
| T16 | Freeze active with valid exact exception | exception bound to exact PR/head/authorization_id | Stage 2 may become success only for that exact bound target |

## 15. Migration Plan (atomic ordering)

To ensure master is never left less protected than its current baseline,
implementation MUST follow this exact sequence. At no point may required
protection drop below the current baseline (today: 1 required approving
review + `Viona Merge Authorization Gate` as the sole required context).

```
 1. Implement Stage 2 dormant (new workflow + new script; not yet referenced
    by branch protection).

 2. Verify the Stage 2 evaluator in non-required mode (dry-run / fixtures),
    exercising the full Implementation Acceptance Test Matrix (§14).

 3. Verify the guarded wrapper (§12) correctly understands and revalidates
    Stage 2 state, including all recheck items.

 4. Add the "Viona Explicit Merge Authorization" context to branch
    protection's required_status_checks WITHOUT removing the existing
    required context ("Viona Merge Authorization Gate" / future
    "Viona Merge Readiness Gate").

 5. Read back branch protection immediately after step 4 and confirm both
    contexts are now listed as required.

 6. Prove, by direct observation: current Stage 1 green + Stage 2 missing
    = merge remains blocked. (This is the core regression-prevention
    property; do not proceed without this proof.)

 7. Exercise Stage 2 end-to-end on a controlled test target (T02 and, where
    feasible, additional matrix cases) to confirm a correct exact
    authorization produces a genuine Stage 2 success and that merge then
    becomes possible only for that exact bound target.

 8. Only after step 7's proof, migrate the old Stage 1 workflow/script
    naming and semantics (rename "Viona Merge Authorization Gate" to
    "Viona Merge Readiness Gate"; strip any authority=MERGE-shaped inputs)
    — performed so that the renamed context is added to required checks
    BEFORE the old name is removed from required checks, never the reverse.

 9. Read back branch protection again after step 8 and confirm required
    contexts reflect exactly: readiness gate (new name) + explicit merge
    authorization, with no gap where a required context name matches zero
    possible check runs.

10. Remove obsolete compatibility behavior (old context name, any
    transitional dual-naming logic) only after both contexts and the full
    migration behavior have been verified per steps 6 and 9.
```

A rename mismatch at any point fails **closed** (blocks merges because a
required context name has no successful run) rather than open (exposing
master) — but the ordering above avoids relying on that fail-closed safety
net as the primary protection; it is verified defense-in-depth only.

## 16. PR #461 Historical Governance Exception
This control design stems from the forensic audit of PR #461. The permanent historical record for PR #461 is defined as follows:

* **CONTENT_INTEGRITY:** GREEN (Byte-identical reviewed/merged content, proper base lineage, 29-file scope match).
* **TECHNICAL_PRE_MERGE_EVIDENCE:** GREEN (Exact-head human approval, green preflight, green legacy merge gate).
* **GOVERNANCE_SEQUENCE:** EXCEPTION_REQUIRES_RECONCILIATION.
* **Facts:** PR #461 was merged successfully by an authorized human account while `GLOBAL_MERGE_FREEZE` remained ACTIVE and explicit VIONA merge authority had not been issued. The legacy branch protection mechanically allowed this because it conflated technical readiness with authority.
* **Resolution:** No retrospective authorization is created. No revert is required, as the content integrity is strictly sound. The governance enforcement gap is permanently closed, going forward, by this V1 Two-Stage architecture. This design does not retroactively validate, authorize, or reclassify PR #461's merge; PR #461 remains `CONTENT_GREEN / GOVERNANCE_SEQUENCE_EXCEPTION` for all historical purposes.
