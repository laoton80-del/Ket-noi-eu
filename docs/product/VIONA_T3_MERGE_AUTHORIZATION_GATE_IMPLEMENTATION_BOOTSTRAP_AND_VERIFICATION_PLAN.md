# VIONA — Phase T3 Merge Authorization Gate
# Implementation, Bootstrap, and Verification Plan

**Primary classification:** `READY_FOR_VIONA_T3_GATE_CONTEXT_IDENTITY_AUTHORIZATION_PROVENANCE_AND_BOOTSTRAP_ORDER_CONTRACT_REVIEW`

**Findings:**

```text
VIONA_T3_ARCHITECTURE_REMEDIATION_AUTHORIZATION_PROVENANCE_CONFIRMED
VIONA_T3_GITHUB_CHECKS_API_OUTPUT_MECHANISM_SELECTED_FOR_PLANNING
VIONA_T3_EXACT_GATE_CONTEXT_IDENTITY_LOCKED_FOR_PLANNING
VIONA_T3_BRANCH_PROTECTION_REQUIRED_CHECK_CONTEXT_LOCKED_FOR_PLANNING
VIONA_T3_CHECK_APP_IDENTITY_PRE_ACTIVATION_RECONFIRMATION_REQUIRED
VIONA_T3_VERIFIED_ACTOR_ALLOWLISTED_WORKFLOW_DISPATCH_PROVENANCE_SELECTED_FOR_PLANNING
VIONA_T3_FREE_TEXT_AUTHORIZATION_REJECTED_AS_PROVENANCE
VIONA_T3_WORKFLOW_RERUN_AUTHORIZATION_PROHIBITED
REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY
GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH
BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS_DOCUMENTED
BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE_DOCUMENTED
BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED_DOCUMENTED
VIONA_T3_BOOTSTRAP_NORMATIVE_ORDER_LOCKED_FOR_PLANNING
VIONA_T3_HEAD_BOUND_EMERGENCY_LOCK_BOOTSTRAP_CANDIDATE_A_RECOMMENDED_NOT_AUTHORIZED
VIONA_T3_POST_MERGE_REQUIRED_CONTEXT_TRANSITION_PLANNED_NOT_EXECUTED
VIONA_T3_MERGE_AUTHORIZATION_GATE_IMPLEMENTATION_PLANNED_NOT_IMPLEMENTED
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

**Remediation authorization (precedes this remediation):**

```text
APPROVE_VIONA_T3_GATE_CONTEXT_IDENTITY_AUTHORIZATION_PROVENANCE_BOOTSTRAP_ORDER_AND_FAIL_CLOSED_CONTRACT_REMEDIATION_DOCS_ONLY_UNCOMMITTED
```

**Preparation authorization (precedes original packet):**

```text
APPROVE_VIONA_T2_RESULT_AND_PHASE_T3_VIONA_MERGE_AUTHORIZATION_GATE_IMPLEMENTATION_AND_BOOTSTRAP_PLAN_PACKET_PREPARATION_DOCS_ONLY_UNCOMMITTED
```

**Mode:** Docs-only uncommitted design + architecture remediation — **no implementation** — no bootstrap — no settings mutation

**Companion T2 result:** `docs/product/VIONA_T2_EMERGENCY_BRANCH_PROTECTION_EFFECTIVENESS_VERIFICATION_RESULT.md`

**Canonical local baseline:** `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec`

**Repository:** `laoton80-del/Ket-noi-eu`

```text
NO_WORKFLOW_IMPLEMENTATION
NO_SCRIPT_IMPLEMENTATION
NO_PACKAGE_MODIFICATION
NO_GITHUB_SETTINGS_MUTATION
NO_STATUS_OR_CHECK_CREATION
NO_BRANCH_PROTECTION_CHANGE
NO_PR
NO_MERGE
NO_BOOTSTRAP_EXECUTION
NO_CONTAINMENT_RELEASE
NO_FREEZE_RELEASE
NO_B1B_THROUGH_B7
REQUEST_ONLY_NO_CHARGE
```

---

## 1. Purpose

Prepare the exact Phase T3 implementation, bootstrap, testing, and rollback plan for:

**Viona Merge Authorization Gate**

Preserve the existing emergency master protection:

**Viona Emergency Merge Lock**

This remediation resolves:

```text
BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS
BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED
```

and related gaps (missing fail-closed classifications, incomplete bootstrap order, missing primary/defense-in-depth markers).

Do **not** implement or execute Phase T3 in this lane.

---

## 2. Preserved T2 / governance facts

```text
VIONA_T2_EMERGENCY_BRANCH_PROTECTION_EFFECTIVENESS_VERIFIED_WITH_MASTER_CONFIGURATION_EVIDENCE_AND_CONTROLLED_MIRROR_NEGATIVE_TESTS
EMERGENCY_MASTER_LOCKDOWN_EFFECTIVENESS_VERIFIED
MASTER_DESTRUCTIVE_TESTS_NOT_EXECUTED
VIONA_T2_EPHEMERAL_TEST_OBJECT_CLEANUP_RECORDED
PR447_AND_PR448_ACTIVE_MANDATORY_FREEZE_BREACH_INCIDENTS_REMAIN_OPEN
PR448_NO_NEW_GOVERNANCE_EXCEPTION_ACCEPTED
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

Master still requires: `Viona Emergency Merge Lock` (strict · enforce_admins · PR reviews · force/delete disabled · auto-merge false).

Not claimed:

```text
VIONA_MERGE_AUTHORIZATION_GATE_IMPLEMENTED
BOOTSTRAP_EXECUTED
REQUIRED_CONTEXT_TRANSITION_EXECUTED
EMERGENCY_CONTAINMENT_RELEASED
FREEZE_RELEASED
```

---

## 3. Phase T3 objective

The gate provides machine-enforced authorization binding for a PR merge.

It must **not** perform the merge itself.

It emits a deterministic Checks API result bound to exact repository, PR, base, full head SHA, MERGE authority, merge mode, operator (from GitHub event), dispatch timing after latest head, freeze scope, required checks/reviews/conversations, and unchanged reviewed scope.

Any new head invalidates prior success.

---

## 4. Exact output mechanism (SELECTED)

```text
VIONA_T3_GITHUB_CHECKS_API_OUTPUT_MECHANISM_SELECTED_FOR_PLANNING
```

| Field | Value |
|---|---|
| Mechanism | **GitHub Checks API — explicit check run** |
| Required permission | `checks: write` |
| Forbidden alternative | `statuses: write` |

Planned minimum permissions (exactly these):

- `contents: read`
- `pull-requests: read`
- `checks: write`

Prohibited unless later independently justified:

- `contents: write`
- `pull-requests: write`
- `statuses: write`
- `actions: write`
- `deployments: write`
- `packages: write`
- `id-token: write`

When permission scope exceeds the selected mechanism:

```text
BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE
```

```text
BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE_DOCUMENTED
```

The workflow must not approve PRs, modify PRs, merge PRs, modify branches, modify branch protection, or modify product/runtime data.

---

## 5. Deterministic context identity (LOCKED)

```text
VIONA_T3_EXACT_GATE_CONTEXT_IDENTITY_LOCKED_FOR_PLANNING
VIONA_T3_BRANCH_PROTECTION_REQUIRED_CHECK_CONTEXT_LOCKED_FOR_PLANNING
BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS_DOCUMENTED
```

| Identity element | Exact future value |
|---|---|
| Workflow file | `.github/workflows/viona-merge-authorization-gate.yml` |
| Workflow display name | `Viona Merge Authorization Gate Dispatcher` |
| Job ID | `evaluate_merge_authorization` |
| Job display name | `Evaluate Viona Merge Authorization Gate` |
| Gate script | `scripts/viona-merge-authorization-gate.mjs` |
| **Emitted check-run name** | `Viona Merge Authorization Gate` |
| **Branch-protection required check context** | `Viona Merge Authorization Gate` |
| Output mechanism | GitHub Checks API |

The emitted check run must be created against the **exact authorized PR head SHA**.

Do **not** rely on the ordinary workflow-job check as the canonical required context.

Do **not** emit alternative names or suffixes (`/ success`, `/ authorize`, environment names, matrix dimensions, branch names).

When identity differs or remains ambiguous:

```text
BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS
```

---

## 6. Check app identity and pre-activation reconfirmation

```text
VIONA_T3_CHECK_APP_IDENTITY_PRE_ACTIVATION_RECONFIRMATION_REQUIRED
```

After the gate is canonical and **before** master protection is transitioned, require a real controlled check run named `Viona Merge Authorization Gate` on an approved non-master verification head.

GET-confirm:

- exact check-run name;
- exact head SHA;
- GitHub App identity producing the check;
- app ID;
- conclusion semantics;
- no duplicate or conflicting context;
- branch protection can require that exact check.

Prefer future branch-protection required-status configuration to bind:

- `context`: `Viona Merge Authorization Gate`
- `app_id`: the GET-verified GitHub App ID

Do **not** hardcode an assumed app ID in this planning lane.

```text
BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED
```

Do not transition master protection while emitted-check/app identity is unresolved.

---

## 7. Authentic authorization provenance mechanism (SELECTED)

```text
VIONA_T3_VERIFIED_ACTOR_ALLOWLISTED_WORKFLOW_DISPATCH_PROVENANCE_SELECTED_FOR_PLANNING
VIONA_T3_FREE_TEXT_AUTHORIZATION_REJECTED_AS_PROVENANCE
VIONA_T3_WORKFLOW_RERUN_AUTHORIZATION_PROHIBITED
BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED_DOCUMENTED
```

Selected mechanism:

**VERIFIED ACTOR-ALLOWLISTED GITHUB WORKFLOW_DISPATCH RECORD**

Do **not** use a free-text authorization phrase as the provenance source.

The authentic authorization record is the GitHub-issued workflow run metadata and dispatch event for the canonical workflow on the canonical default branch.

Require:

| Field | Requirement |
|---|---|
| `event_name` | `workflow_dispatch` |
| `run_attempt` | `1` |
| `github.repository` | `laoton80-del/Ket-noi-eu` |
| `github.actor` | Exact approved operator from a repository-controlled allowlist |
| `github.triggering_actor` | Must equal `github.actor` |
| workflow ref | Canonical default-branch workflow |
| workflow commit | GET-verified canonical master workflow version |
| run ID | Captured |
| run `created_at` | Captured from GitHub |
| dispatch inputs | Structured and captured |

Do **not** permit workflow reruns to create a new gate authorization result.

```text
BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED
```

When `run_attempt != 1` or `github.triggering_actor != github.actor`, return a non-success result.

---

## 8. Structured dispatch inputs

**Removed / rejected as provenance:**

- free-text `authorization` input;
- caller-supplied `authorized_operator` (operator identity is derived only from GitHub event metadata).

Plan exact structured inputs:

| Input | Requirement |
|---|---|
| `pr_number` | Required integer |
| `head_sha` | Required full 40-character SHA |
| `base_branch` | Required exact value `master` |
| `merge_mode` | Required choice; current governance allowed value: `squash` |
| `authority` | Required choice; exact value: `MERGE` |
| `freeze_scope` | Required while freeze active; exact value: `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` |
| `reviewed_scope_digest` | Required deterministic digest or reviewed-scope reference whose authenticity is independently verified |

No arbitrary free-text phrase may itself satisfy authorization provenance.

The workflow must independently query and compare: repository, PR number, PR state, current head, base branch, actor, merge mode, freeze scope, reviewed scope, reviews, required checks, unresolved conversations, auto-merge state.

---

## 9. Authorization timing and head binding

Require proof that:

- dispatch run exists after the exact head became current;
- current PR head equals the supplied full SHA;
- emitted check targets that exact SHA;
- any new head invalidates all prior success;
- a result on an ancestor head cannot satisfy the new head.

Use GitHub-issued run `created_at` and independently queried current head facts.

Do **not** trust caller-supplied timestamps.

```text
BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD
BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
```

---

## 10. Authorization-provenance failure contract

```text
BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
```

when any of these are true:

- event is not `workflow_dispatch`;
- actor is not allowlisted;
- triggering actor differs;
- workflow run is a rerun;
- canonical workflow identity cannot be confirmed;
- workflow version is not canonical;
- structured inputs are missing;
- exact current head cannot be bound;
- authorization record exists only in documentation / prompt / PR body / free-text input / assistant response.

```text
BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED
```

when the architecture itself does not define an authentic auditable source.

---

## 11. Exact primary / defense-in-depth markers

```text
REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY
GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH
```

- Master branch protection requiring the exact gate check is the **primary** enforcement control.
- The guarded wrapper is an **additional** operator-side control.
- Wrapper success cannot replace a missing required check.
- Wrapper cannot manufacture gate success.
- Wrapper cannot change protection.
- Direct GitHub merge endpoints must still be blocked by repository-level protection when the required check is missing.

---

## 12. Gate pass conditions

The gate may succeed only when **all** pass:

1. repository exact;
2. PR exists and is OPEN;
3. base branch exact (`master`);
4. current head equals the full authorized head;
5. authorization (dispatch) occurred after the latest head;
6. operator (`github.actor`) is allowlisted and equals `triggering_actor`;
7. `run_attempt` = 1;
8. `authority` = `MERGE`;
9. exact merge mode matches (`squash`);
10. required checks are green;
11. review requirements are satisfied;
12. unresolved conversations are absent;
13. reviewed scope has not changed;
14. no PR-specific governance blocker;
15. while freeze is active, `freeze_scope` = `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY`;
16. auto-merge inactive;
17. no success result for a different or stale head;
18. check-run name and app identity match the locked contract (when configured).

---

## 13. Complete fail-closed list

```text
BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_BASE_BRANCH_MISMATCH
BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
BLOCKED_MERGE_REQUIRED_CHECK_FAILED
BLOCKED_MERGE_REVIEW_REQUIREMENT_NOT_SATISFIED
BLOCKED_MERGE_UNRESOLVED_CONVERSATION
BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED
BLOCKED_MERGE_FREEZE_REMEDIATION_SCOPE_MISSING
BLOCKED_MERGE_AUTHORIZATION_PREDATES_CURRENT_HEAD
BLOCKED_MERGE_AUTO_MERGE_ACTIVE
BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED
BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING
BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED
BLOCKED_MERGE_WORKFLOW_RERUN_NOT_PERMITTED
BLOCKED_VIONA_T3_GATE_CONTEXT_IDENTITY_AMBIGUOUS
BLOCKED_VIONA_T3_GATE_CHECK_APP_IDENTITY_UNRESOLVED
BLOCKED_VIONA_T3_GATE_PERMISSION_SCOPE_EXCESSIVE
BLOCKED_VIONA_T3_AUTHORIZATION_PROVENANCE_MECHANISM_UNRESOLVED
```

Every blocker must:

- emit a non-success check conclusion;
- emit sanitized evidence;
- stop before merge;
- never alter the PR;
- never alter protection.

The gate must **never** merge a PR.

`BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING` and
`BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED` are T3D fail-closed
classifications for the dedicated protection-read credential. They must
not be collapsed into `BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED`.
That latter code remains reserved for an authenticated protection GET
whose payload is missing, malformed, or does not prove
`enforce_admins.enabled === true` or `required_status_checks != null`.
See `docs/product/VIONA_T3D_PROTECTION_READ_CREDENTIAL_REMEDIATION_IMPLEMENTATION_PLAN.md`.

---

## 14. Check-run lifecycle

1. Create an **in-progress** check run named exactly `Viona Merge Authorization Gate` on the exact current PR head.
2. Evaluate provenance and all governance conditions.
3. Complete the **same** check run with:
   - `success` — only when every gate condition passes;
   - `failure` — for deterministic policy blockers;
   - `neutral` — only for explicitly documented non-policy technical cancellation, if branch protection treats neutral as non-success.
4. Never emit success before provenance confirmation.
5. Never transfer the result to another SHA.
6. Never reuse the result for another PR.
7. Never create success on a stale head.
8. Record sanitized run ID, PR, head, actor, mode, and decision metadata.

Do **not** emit a commit status with the same name.

---

## 15. Guarded merge wrapper

Plan: `scripts/viona-guarded-pr-merge.mjs`

Suggested command: `viona:merge:guarded`

Suggested arguments: `--pr` · `--head` · `--mode` · `--authorization-run-id` (or equivalent reference to the verified dispatch record — **not** a free-text phrase)

The wrapper must independently verify:

- exact repository;
- exact PR;
- state OPEN;
- current full head;
- base `master`;
- exact squash mode;
- successful current-head check run `Viona Merge Authorization Gate`;
- exact check app identity when configured;
- no auto-merge;
- reviewed scope unchanged;
- required freeze scope;
- no unresolved governance blocker.

```text
REPOSITORY_LEVEL_REQUIRED_CHECK_IS_PRIMARY
GUARDED_MERGE_WRAPPER_IS_DEFENSE_IN_DEPTH
```

The wrapper may perform at most one separately authorized merge invocation.

It must not emit gate success, call the gate as a substitute for authorization, modify branch protection, bypass missing reviews/checks, or use admin bypass.

---

## 16. Implementation PR boundary

Ordinary PR creation remains suspended.

A future Phase T3 implementation PR requires a **separate exact authorization** binding repository, implementation branch, allowlisted files, implementation/test scope, no product/runtime feature changes, and **no merge authority**.

Opening the implementation PR does **not** authorize merge, bootstrap, emergency-lock success, required-context transition, or freeze release.

---

## 17. Bootstrap problem

Current master protection requires `Viona Emergency Merge Lock`.

`Viona Merge Authorization Gate` cannot become canonical before its implementation PR is merged.

Therefore a narrowly scoped one-time bootstrap is required.

```text
VIONA_T3_HEAD_BOUND_EMERGENCY_LOCK_BOOTSTRAP_CANDIDATE_A_RECOMMENDED_NOT_AUTHORIZED
```

Candidate A remains:

```text
RECOMMENDED
NOT AUTHORIZED
NOT EXECUTED
```

Candidate B (temporary required-context replacement) — documented alternative.
Candidate C (administrator bypass) — **prohibited** as ordinary bypass.

---

## 18. Normative fail-closed bootstrap order (LOCKED)

```text
VIONA_T3_BOOTSTRAP_NORMATIVE_ORDER_LOCKED_FOR_PLANNING
```

Exactly this order (no unprotected gap):

1. Confirm exact future bootstrap authorization provenance.
2. Confirm exact repository.
3. Confirm exact implementation PR number.
4. Confirm exact full fixed reviewed head SHA.
5. Confirm base = `master`.
6. Confirm merge mode = `squash`.
7. Confirm explicit MERGE authority.
8. Confirm exact freeze-remediation scope: `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY`.
9. Confirm tests green.
10. Confirm required review green.
11. Confirm conversations resolved.
12. Confirm reviewed scope unchanged.
13. Confirm auto-merge absent.
14. Confirm current master protection still requires `Viona Emergency Merge Lock`.
15. Prepare and validate the exact post-merge protection-transition payload.
16. Prepare and validate the exact rollback payload restoring `Viona Emergency Merge Lock`.
17. Confirm transition and rollback API compatibility.
18. Confirm transition and rollback authority.
19. Post exactly one success result named `Viona Emergency Merge Lock` only to the fixed implementation head.
20. GET-verify the success result (exact context, head, repository, app/actor source, success, non-reusable on another SHA).
21. Reconfirm PR head and all pre-merge conditions have not changed.
22. Perform exactly one squash merge of the exact fixed head.
23. GET-verify PR merged, exact source head, exact squash result, canonical master advanced as expected, no unrelated merge.
24. Immediately apply the prepared master-protection transition from `Viona Emergency Merge Lock` to `Viona Merge Authorization Gate`.
25. GET-verify master protected; exact new required check; verified check app identity when selected; strict/enforce_admins/reviews/conversation resolution preserved; force pushes/deletion disabled; auto-merge false; no unprotected gap.
26. When transition verification is green, classify transition as applied pending Phase T4 effectiveness verification.
27. When transition fails or is incomplete after merge, declare a bootstrap incident and execute only the separately authorized rollback restoring `Viona Emergency Merge Lock`.
28. GET-verify rollback completely restored the emergency protection contract.
29. Keep containment and mandatory freeze active.
30. Stop before any ordinary PR lifecycle.

Stop **before** emergency success creation when transition or rollback payloads are not already validated and authorized.

---

## 19. Bootstrap stop conditions

```text
BLOCKED_T3_BOOTSTRAP_PR_NUMBER_MISMATCH
BLOCKED_T3_BOOTSTRAP_HEAD_MISMATCH
BLOCKED_T3_BOOTSTRAP_REVIEW_NOT_GREEN
BLOCKED_T3_BOOTSTRAP_TESTS_NOT_GREEN
BLOCKED_T3_BOOTSTRAP_MERGE_MODE_MISMATCH
BLOCKED_T3_BOOTSTRAP_FREEZE_EXCEPTION_MISSING
BLOCKED_T3_BOOTSTRAP_STATUS_CONTEXT_MISMATCH
BLOCKED_T3_BOOTSTRAP_STATUS_CREATED_ON_WRONG_SHA
BLOCKED_T3_BOOTSTRAP_MASTER_PROTECTION_DRIFT
BLOCKED_T3_BOOTSTRAP_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_T3_BOOTSTRAP_POST_MERGE_CONTEXT_TRANSITION_INCOMPLETE
```

Any blocker must stop **before** merge.

Future bootstrap authorization must contain exact repository, PR number, full reviewed head, base, merge mode, explicit MERGE, bootstrap context, one-time success-result creation authority, protection-transition authority, rollback scope, and `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY`.

Do **not** treat T3 implementation authorization, PR creation, fixed-head review, successful tests, or this plan as bootstrap or merge authority.

---

## 20. Context transition contract

```text
VIONA_T3_POST_MERGE_REQUIRED_CONTEXT_TRANSITION_PLANNED_NOT_EXECUTED
```

Transition from `Viona Emergency Merge Lock` to `Viona Merge Authorization Gate` using the exact GET-verified check identity and app binding.

Preserve all other protection settings.

Require:

- no branch-protection deletion;
- no period with zero required checks;
- exact post-transition GET verification;
- rollback restoring the full emergency contract;
- Phase T4 before any release consideration.

```text
PLANNED
NOT AUTHORIZED
NOT EXECUTED
```

---

## 21. Phase T4 verification (PLANNED — NOT EXECUTED)

Negative cases: wrong repository/PR/head/base/mode/operator; stale authorization; authorization predating head; changed head/scope; failed check; unsatisfied review; unresolved conversation; missing freeze scope; active auto-merge; stale gate result; result on wrong SHA; workflow rerun.

Positive case: exact binding; gate success on exact head; branch protection recognizes exact context; no merge without separately authorized guarded merge action.

---

## 22. Release boundary

T2 success alone cannot release controls.
T3 implementation alone cannot release controls.
T4 verification alone cannot release controls.

Release requires separate explicit operator authorization after all canonical implementation, verification, and Kernel/Handoff conditions pass.

---

## 23. Packet boundaries

This remediation modifies **exactly two** T3 paths only.

```text
VIONA_T3_MERGE_AUTHORIZATION_GATE_IMPLEMENTATION_PLANNED_NOT_IMPLEMENTED
```

---

## 24. Next action

Separately authorize a **new strict read-only review** of this remediated Phase T3 architecture packet.

Do not implement the gate, create workflow/script, create branch/PR, create emergency-lock success, bootstrap, merge, mutate master protection, commit/push, release containment/freeze, or start B1B.
