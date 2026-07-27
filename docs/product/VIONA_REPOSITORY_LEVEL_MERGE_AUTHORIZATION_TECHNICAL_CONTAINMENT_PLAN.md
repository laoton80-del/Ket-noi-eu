# VIONA — Repository-Level Merge Authorization Technical Containment Plan

**Primary classification:** `READY_FOR_VIONA_REPOSITORY_LEVEL_MERGE_AUTHORIZATION_TECHNICAL_CONTAINMENT_PLAN_REVIEW`

**Mode:** Design-only — **uncommitted** — no GitHub settings mutation, workflow, status-check, script, package, or test implementation in this lane

**Canonical master baseline:** `636ad1e145e65547d80a863e2d249279bce8b25d`

**Related incident packet:** `docs/product/VIONA_PR447_ACTIVE_MANDATORY_MERGE_FREEZE_BREACH_GOVERNANCE_INCIDENT_INVESTIGATION_CONTAINMENT_AND_DISPOSITION.md`

**Operator selection:**

```text
ACKNOWLEDGE_AND_SELECT_VIONA_PR447_FREEZE_BREACH_INCIDENT_DISPOSITION_A_RETAIN_FACTUAL_CONTENT_KEEP_INCIDENT_OPEN_AND_DIRECTION_C_MANDATORY_TECHNICAL_CONTAINMENT_PLANNING_WITH_NO_THIRD_EXCEPTION
```

```text
PR447_TECHNICAL_CONTAINMENT_DIRECTION_C_SELECTED_FOR_PLANNING
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
NO_FURTHER_VIONA_PR_MERGE_UNTIL_GUARDRAIL_IMPLEMENTED_TESTED_AND_VERIFIED
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_THIRD_EXCEPTION_ACCEPTED
NO_GITHUB_SETTINGS_MUTATION
NO_SCRIPT_IMPLEMENTATION
NO_WORKFLOW_IMPLEMENTATION
NO_PACKAGE_MODIFICATION
NO_TEST_IMPLEMENTATION
REQUEST_ONLY_NO_CHARGE
```

---

## 1. Purpose

Define a design-only plan for mandatory repository-level technical containment so that documented merge freezes and merge-authorization phrases cannot be bypassed through unprotected GitHub merge paths.

This plan does **not** implement controls.

This plan does **not** authorize B1B, freeze release, or a third governance exception.

---

## 2. Why documentation alone is insufficient

**FACT (from PR #447 investigation):**

- master branch protection ABSENT;
- repository rulesets EMPTY;
- repository auto-merge DISABLED;
- valid freeze-remediation exception ABSENT;
- PR #447 merged during active documented freeze.

**INFERENCE:**

The documented freeze did not provide effective repository-level technical enforcement against the merge path used for PR #447.

A repository-local wrapper alone can still be bypassed via GitHub UI, direct `gh pr merge`, API, or administrator action. Layered enforcement is mandatory.

---

## 3. Four mandatory enforcement layers

### LAYER 1 — Master ruleset / branch protection

Plan requirements:

- require pull request before merge;
- prohibit direct pushes to master;
- prohibit force pushes;
- prohibit branch deletion;
- require selected status checks;
- apply enforcement to administrators where supported;
- no ordinary bypass actor;
- preserve auto-merge disabled unless later explicitly governed.

Any GitHub capability assumptions must be reconfirmed during a future separately authorized implementation lane.

**Not mutated in this lane.**

### LAYER 2 — Required merge-authorization status

Planned status context: **Viona Merge Authorization Gate**

The gate must bind authorization to:

- exact PR number;
- full 40-character current reviewed head;
- explicit MERGE authority;
- exact merge mode;
- authorized operator identity;
- authorization event after the latest head was created.

Any new PR head must invalidate the previous authorization result.

**Not implemented in this lane.**

### LAYER 3 — Repository-owned guarded merge wrapper

| Artifact | Status |
|---|---|
| `scripts/viona-guarded-pr-merge.mjs` | Plan-only — not implemented |
| `package.json` → `viona:merge:guarded` | Plan-only — not added |
| Inputs | `--pr` `--head` `--mode` `--authorization` |

Defense-in-depth only. **Not sufficient** without repository-level enforcement (Layers 1–2).

### LAYER 4 — Post-merge verification

Require separate operator authorization and canonical verification after every merge.

---

## 4. Authorization transport decision

### CANDIDATE 1 — Operator-triggered GitHub workflow (RECOMMENDED)

Operator triggers a dedicated authorization workflow with:

- PR number;
- full head;
- merge mode;
- exact authorization phrase.

The workflow validates the authorized operator and publishes a status only for the exact head.

### CANDIDATE 2 — Operator-authored PR comment

A required check validates a specially formatted comment from an allowlisted operator account.

Documented risks:

- editable comments;
- event reprocessing;
- actor authorization management;
- comment deletion or replacement;
- status invalidation on new heads.

**Recommendation:** Candidate 1 unless later capability review proves it unsupported or unsafe.

Neither candidate is implemented here.

---

## 5. Required authorization format

Every future merge authorization must include:

- exact PR number;
- full 40-character fixed reviewed head SHA;
- explicit word `MERGE`;
- exact merge mode;
- remediation scope when freeze is active.

Normalized ordinary form:

```text
APPROVE_VIONA_PR_<PR_NUMBER>_MERGE_AT_FIXED_HEAD_<FULL_SHA>_USING_<MODE>
```

Freeze-remediation form must additionally contain:

```text
FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY
```

Reject:

- abbreviated SHA;
- generic merge wording;
- review approval;
- commit/open-PR approval;
- repository ownership;
- green checks;
- actor metadata alone;
- retrospective approval.

---

## 6. Fail-closed contract

Required blockers (stop before merge):

```text
BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
BLOCKED_MERGE_REQUIRED_CHECK_FAILED
BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED
BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED
```

---

## 7. Bootstrap contract

- ordinary merges remain frozen;
- incident and containment documents may be prepared/opened/reviewed;
- technical implementation may later be prepared/opened/reviewed;
- no such PR may merge through ordinary authority;
- the implementation PR requires one exact one-time freeze-remediation authorization after its PR number, fixed reviewed head, scope and tests exist;
- PR #447 is **not** the implementation PR;
- no remediation exception may be issued before the implementation PR and full fixed head exist.

This plan does **not** propose or issue an actual remediation merge phrase.

---

## 8. Freeze release conditions

Freeze may be released only after **all** of:

1. repository-level protection or ruleset is active;
2. required authorization status is active;
3. guarded wrapper is canonical;
4. positive and negative tests pass;
5. real dry-run evidence proves fail-closed behavior;
6. remediation merge is post-merge verified;
7. Kernel/Handoff are canonical;
8. operator explicitly releases the freeze.

Proposed release phrase:

```text
RELEASE_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_AFTER_IMPLEMENTATION_AND_POST_MERGE_VERIFICATION
```

| Field | Status |
|---|---|
| Phrase status | **PROPOSED** |
| Granted | **NOT GRANTED** |
| Effective | **NOT EFFECTIVE** |

---

## 9. Case B and B1B boundaries

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

| Item | Status |
|---|---|
| B1B | GOVERNANCE-FROZEN · NOT STARTED · NOT GRANTED · NOT EFFECTIVE · NOT AUTHORIZED |
| B2–B7 | NOT AUTHORIZED |
| E8–E10 | NOT AUTHORIZED |
| `REQUEST_ONLY_NO_CHARGE` | PRESERVED |

---

## 10. Next action

This plan remains uncommitted and design-only.

Separately authorize strict read-only review of the disposition + containment plan packet.

Do not implement GitHub settings, workflows, checks, scripts, or tests from this document.
Do not release the freeze.
Do not start B1B.
