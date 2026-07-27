# VIONA — Phase T1 Emergency Master Lockdown
# Candidate A Branch-Protection Settings-Mutation and Rollback Contract

**Primary classification:** `READY_FOR_VIONA_T1_EMERGENCY_MASTER_LOCKDOWN_CANDIDATE_A_EXACT_SETTINGS_MUTATION_AND_ROLLBACK_CONTRACT_PACKET_REVIEW`

**Governance findings:**

```text
VIONA_T1_CANDIDATE_A_BRANCH_PROTECTION_EMERGENCY_LOCK_SELECTED_FOR_PACKET_PREPARATION
VIONA_T1_CANDIDATE_C_ROLLBACK_ONLY_SELECTED
VIONA_T1_CANDIDATE_B_RULESET_EXECUTION_DEFERRED
VIONA_T1_SETTINGS_MUTATION_NOT_AUTHORIZED
VIONA_T1_SETTINGS_MUTATION_NOT_EXECUTED
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

**Selection / preparation authorization (precedes this packet):**

```text
ACKNOWLEDGE_AND_SELECT_VIONA_T1_EMERGENCY_MASTER_LOCKDOWN_CANDIDATE_A_BRANCH_PROTECTION_WITH_UNSATISFIED_VIONA_EMERGENCY_MERGE_LOCK_ENFORCE_ADMINS_AND_CANDIDATE_C_ROLLBACK_ONLY_WITH_CANDIDATE_B_RULESET_DEFERRED_FOR_EXACT_SETTINGS_MUTATION_PACKET_PREPARATION
```

**Mode:** Docs-only uncommitted contract preparation — **no GitHub settings mutation** — no POST/PUT/PATCH/DELETE

**Canonical local baseline:** branch `docs/viona-pr448-second-active-freeze-breach-governance-incident` @ `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec`

**Repository:** `laoton80-del/Ket-noi-eu`

```text
NO_GITHUB_SETTINGS_MUTATION
NO_BRANCH_PROTECTION_CREATION
NO_RULESET_CREATION
NO_COMMIT
NO_PUSH
NO_PR
NO_MERGE
NO_WORKFLOW_IMPLEMENTATION
NO_SCRIPT_IMPLEMENTATION
NO_GOVERNANCE_EXCEPTION
NO_FREEZE_REMEDIATION_EXCEPTION
NO_CONTAINMENT_RELEASE
NO_FREEZE_RELEASE
NO_B1B_THROUGH_B7
REQUEST_ONLY_NO_CHARGE
```

Repository-level protection status for this lane:

```text
SELECTED FOR PREPARATION
NOT IMPLEMENTED
NOT VERIFIED
```

---

## 1. Purpose

Prepare an exact, reviewable Phase T1 settings-mutation and rollback contract for emergency protection of `master`.

This packet does **not** authorize or execute the mutation.

---

## 2. Selected T1 design

| Candidate | Role | Status |
|---|---|---|
| **A** | Primary emergency master lockdown via branch protection + unsatisfied required status | **SELECTED FOR PACKET PREPARATION** |
| **C** | Rollback / emergency recovery only | **SELECTED (rollback-only)** |
| **B** | Repository ruleset mutation | **DEFERRED** |

```text
VIONA_T1_CANDIDATE_A_BRANCH_PROTECTION_EMERGENCY_LOCK_SELECTED_FOR_PACKET_PREPARATION
VIONA_T1_CANDIDATE_C_ROLLBACK_ONLY_SELECTED
VIONA_T1_CANDIDATE_B_RULESET_EXECUTION_DEFERRED
VIONA_T1_SETTINGS_MUTATION_NOT_AUTHORIZED
VIONA_T1_SETTINGS_MUTATION_NOT_EXECUTED
```

### Candidate A — primary

| Field | Value |
|---|---|
| Target repository | `laoton80-del/Ket-noi-eu` |
| Target branch | `master` |
| Required emergency status context | `Viona Emergency Merge Lock` |

Required intended behavior (unproven until authorized mutation + T2):

- status check intentionally absent or unsatisfied;
- strict mode enabled;
- merge remains blocked;
- administrators subject to protection when supported;
- PR required;
- force push disabled;
- deletion disabled;
- no ordinary bypass actor.

Actual GitHub behavior remains **unproven** until an authorized T1 mutation and T2 verification occur.

### Candidate C — rollback only

```text
CANDIDATE_C_IS_NOT_AN_ORDINARY_BYPASS
CANDIDATE_C_REQUIRES_EXACT_OPERATOR_AUTHORIZATION
CANDIDATE_C_ACTIONS_REQUIRE_SANITIZED_EVIDENCE
CANDIDATE_C_CANNOT_RELEASE_FREEZE
CANDIDATE_C_CANNOT_AUTHORIZE_MERGE
CANDIDATE_C_CANNOT_START_B1B
```

Reserve authenticated repository administrator only for:

- authorized rollback;
- owner-lockout recovery;
- incorrect-target recovery;
- unsupported-configuration recovery.

### Candidate B — deferred

Deferred because T0 showed:

- ruleset GET readable;
- rulesets empty;
- write capability not proven;
- administrator enforcement not proven;
- bypass configuration not proven;
- ruleset evaluate/active behavior not proven.

May be reconsidered only after Candidate A containment is active or after a separately authorized ruleset capability test.

**No ruleset mutation payload is prepared in this lane.**

---

## 3. Preserved governance

```text
PR447_AND_PR448_ACTIVE_MANDATORY_FREEZE_BREACH_INCIDENTS_REMAIN_OPEN
PR448_NO_NEW_GOVERNANCE_EXCEPTION_ACCEPTED
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

---

## 4. T0 factual input (FACT)

| Topic | Value |
|---|---|
| Authenticated actor | `laoton80-del` |
| Repository permission | ADMIN CONFIRMED |
| Visibility | PUBLIC |
| Default branch | `master` |
| Archived / disabled | false / false |
| Master | CURRENTLY UNPROTECTED |
| Branch-protection configuration | ABSENT |
| Protection read | HTTP 404 — Branch not protected |
| Rulesets | EMPTY |
| Rules applying to master | NONE |
| Auto-merge | DISABLED |
| Allowed merge methods | MERGE · SQUASH · REBASE |
| Actions | ENABLED · allowed_actions ALL |
| Default workflow token | READ · may approve PR = NO |
| Existing workflow | `.github/workflows/release-discipline.yml` |
| Viona Merge Authorization Gate | NOT IMPLEMENTED |
| Viona Emergency Merge Lock | NOT IMPLEMENTED |
| Administrator enforcement capability | NOT PROVEN READ-ONLY |
| Ruleset bypass configuration | NOT PROVEN READ-ONLY |
| Ruleset write capability | NOT PROVEN WITHOUT AUTHORIZED MUTATION |
| Rollback-design preconditions | CONFIRMED |

Do not convert unproven capabilities into facts.

---

## 5. Draft branch-protection payload (NOT EXECUTED)

Review-only draft for:

```text
PUT /repos/laoton80-del/Ket-noi-eu/branches/master/protection
```

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Viona Emergency Merge Lock"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

```text
DRAFT
SUBJECT TO PRE-MUTATION API-SCHEMA RECONFIRMATION
NOT EXECUTED
```

### Field-level intent

| Field | Intent |
|---|---|
| `required_status_checks.strict` | New commits invalidate prior status results |
| `contexts` | Intentionally unsatisfied emergency lock |
| `enforce_admins` | Attempt to apply protection to repository administrators |
| `required_pull_request_reviews` | Prevent direct ordinary branch updates; require PR lifecycle |
| `dismiss_stale_reviews` | New commits invalidate approvals |
| `required_approving_review_count` | Defense-in-depth only; **not** the primary emergency lock |
| `required_conversation_resolution` | Additional merge barrier |
| `allow_force_pushes` | false |
| `allow_deletions` | false |
| `restrictions` | null — team/user restriction identifiers not needed for this emergency contract |

Do not silently add or remove fields at execution time without new authorization.

---

## 6. Pre-mutation reconfirmation contract

Before any future PUT, require a **separate execution authorization** and repeat all read-only queries.

Immediately before mutation confirm:

- repository owner/name exact (`laoton80-del/Ket-noi-eu`);
- default branch still `master`;
- master SHA captured;
- master still unprotected;
- protection endpoint still returns 404;
- rulesets still empty or changed state reconciled;
- auto-merge still disabled;
- authenticated actor still admin;
- intended payload schema accepted by current GitHub API documentation or validated through non-mutating schema evidence;
- six uncommitted local docs from the emergency-containment packet remain untouched;
- no PR or merge occurs.

When any factual input changed:

```text
BLOCKED_VIONA_T1_PRE_MUTATION_STATE_DRIFT
```

---

## 7. Exact future settings-mutation authorization (PROPOSED ONLY)

Do **not** grant or execute this phrase now.

Future authorization must contain:

- exact repository;
- exact branch;
- exact candidate;
- exact required status context;
- explicit `GITHUB_SETTINGS_MUTATION`;
- explicit PUT authority;
- explicit rollback scope.

Proposed structural form:

```text
APPROVE_VIONA_T1_GITHUB_SETTINGS_MUTATION_PUT_MASTER_BRANCH_PROTECTION_FOR_REPOSITORY_LAOTON80_DEL_KET_NOI_EU_USING_CANDIDATE_A_VIONA_EMERGENCY_MERGE_LOCK_WITH_ENFORCE_ADMINS_AND_AUTHORIZED_ROLLBACK_ONLY
```

| Field | Status |
|---|---|
| Phrase status | **PROPOSED** |
| Granted | **NOT GRANTED** |
| Effective | **NOT EFFECTIVE** |

Do not treat this proposal as authorization.

---

## 8. Fail-closed mutation order (future execution)

Exact required order:

1. canonical workspace and containment check;
2. execution-authorization provenance check;
3. current actor/admin reconfirmation;
4. exact target repository and branch reconfirmation;
5. sanitized pre-mutation settings capture;
6. exact payload review;
7. prepared rollback operation review;
8. single branch-protection PUT;
9. immediate read-only GET verification;
10. stop without any merge attempt;
11. separate T2 verification authorization.

Only **one** settings mutation may occur.

No retries with altered payload without a new operator authorization.

---

## 9. Rollback contract — Candidate C

Prepare but **do not execute**:

```text
DELETE /repos/laoton80-del/Ket-noi-eu/branches/master/protection
```

Rollback may occur only when:

- the Phase T1 PUT was executed in the same authorized incident lane;
- owner or repository recovery is blocked;
- the wrong branch or repository was targeted;
- GitHub rejected or partially applied the intended contract;
- required-check configuration causes an unrecoverable owner lockout;
- repository availability is materially impaired by the mutation.

Rollback requires its own exact authorization unless the future T1 execution phrase explicitly grants conditional rollback for the **exact same** mutation.

Rollback must **not** be used to:

- permit an ordinary merge;
- bypass the emergency lock;
- open or merge a governance packet;
- start B1B;
- release containment or freeze.

Require a sanitized rollback evidence record (no tokens, headers, private IDs).

---

## 10. Post-PUT verification contract (future)

After a future authorized PUT, T1 may classify success only when read-only GET proves:

- master `protected` = true;
- protection endpoint HTTP 200;
- required context contains exact: `Viona Emergency Merge Lock`;
- strict status checks = true;
- `enforce_admins` enabled;
- pull-request review requirement present;
- force pushes disabled;
- branch deletion disabled;
- no unexpected restriction or bypass added;
- auto-merge remains disabled;
- no merge occurred;
- no local source mutation occurred.

Successful classification:

```text
VIONA_T1_EMERGENCY_MASTER_BRANCH_PROTECTION_MUTATION_APPLIED_PENDING_T2_EFFECTIVENESS_VERIFICATION
```

Do **not** classify `EMERGENCY_LOCKDOWN_VERIFIED` until T2 proves behavior.

---

## 11. T2 effectiveness requirements (prepare only)

T2 must prove:

- direct push to master rejected;
- force push rejected;
- branch deletion rejected;
- ordinary PR merge technically blocked;
- missing `Viona Emergency Merge Lock` context is the blocking condition;
- administrator behavior confirmed;
- rollback remains available;
- no unrelated setting changed.

T2 may require a separately authorized controlled test branch or test PR.

**No test branch or PR may be created in this preparation lane.**

---

## 12. Case B and B1B

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

B1B: GOVERNANCE-FROZEN · NOT STARTED · NOT GRANTED · NOT EFFECTIVE · NOT AUTHORIZED.

---

## 13. Packet boundaries

This preparation creates **exactly two** new docs paths and does **not** modify the six previously strict-reviewed uncommitted paths, Kernel/Handoff beyond those already in that six-set, src/, scripts/, workflows/, packages, or GitHub settings.

---

## 14. Next action

Separately authorize strict read-only review of this T1 exact settings-mutation and rollback contract packet.

Do not mutate GitHub settings, commit, push, open a PR, merge, create a test branch/PR, release containment/freeze, or start B1B.
