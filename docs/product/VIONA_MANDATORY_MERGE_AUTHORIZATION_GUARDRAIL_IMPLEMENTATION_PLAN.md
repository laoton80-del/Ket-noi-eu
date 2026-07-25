# VIONA — Mandatory Merge-Authorization Guardrail Implementation Plan

**Primary classification:** `READY_FOR_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_IMPLEMENTATION_PLAN_REVIEW`

**Mode:** Design-only implementation plan — **uncommitted** — no script, workflow, CI, or package implementation in this lane

**Canonical master baseline:** `adc77d2b042af89fddda54793d28b21c7bcf237c`

**Related decision packet:** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E8_CASE_B_PR446_REPEAT_MERGE_AUTHORIZATION_CONTROL_FAILURE_NON_RETROACTIVE_EXCEPTION_AND_GUARDRAIL_DECISION.md`

```text
NO_SCRIPT_IMPLEMENTATION
NO_WORKFLOW_IMPLEMENTATION
NO_CI_MODIFICATION
NO_PACKAGE_MODIFICATION
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
NO_FURTHER_VIONA_PR_MERGE_UNTIL_GUARDRAIL_IMPLEMENTED_TESTED_AND_VERIFIED
B1B_GOVERNANCE_FREEZE_ACTIVE
REQUEST_ONLY_NO_CHARGE
```

---

## 1. Purpose

Define a design-only plan for a repository-owned guarded-merge mechanism that enforces exact operator merge authorization before any future VIONA PR merge.

This plan does **not** implement the guardrail.

This plan does **not** authorize B1B, deployment, or unrelated merges.

---

## 2. Guardrail functional contract

Every future VIONA merge authorization must contain all four fields:

1. exact PR number;
2. full 40-character fixed reviewed head SHA;
3. explicit MERGE authority;
4. exact merge mode: `SQUASH`, `MERGE_COMMIT`, or `REBASE`.

Recommended normalized authorization form:

```text
APPROVE_VIONA_PR_<PR_NUMBER>_MERGE_AT_FIXED_HEAD_<FULL_SHA>_USING_<MERGE_MODE>
```

The actual implementation may use a longer product-specific prefix but must preserve all four fields.

### Reject

- abbreviated SHA;
- missing PR number;
- generic “merge it” wording;
- review authorization;
- commit/open-PR authorization;
- GitHub actor identity;
- repository ownership;
- successful checks;
- PR approval;
- retrospective approval.

---

## 3. Guarded merge ordering

Exact required ordering:

1. canonical workspace verification;
2. operator authorization provenance verification;
3. PR state and exact head retrieval;
4. equality check: authorized full head = current PR head;
5. exact changed-path and scope reconfirmation;
6. required checks reconfirmation;
7. merge-mode equality verification;
8. final no-mutation-before-merge status check;
9. guarded merge execution;
10. immediate minimal merge-identity capture;
11. separate post-merge verification authorization.

Any mismatch must stop before merge.

Required blocker:

```text
BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
```

Additional blockers:

```text
BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
BLOCKED_MERGE_REQUIRED_CHECK_FAILED
```

---

## 4. Implementation candidate (plan-only)

Recommended future artifacts (not created as executable code in this lane):

| Artifact | Purpose |
|---|---|
| `scripts/viona-guarded-pr-merge.mjs` | Repository-owned guarded-merge wrapper |
| `package.json` → `viona:merge:guarded` | Operator-facing command |

Wrapper arguments:

- `--pr`
- `--head`
- `--mode`
- `--authorization`

Wrapper must:

- validate full SHA format;
- parse the exact PR number;
- parse merge mode;
- compare authorization fields to command arguments;
- retrieve the current PR head read-only;
- fail before merge on any mismatch;
- prohibit direct fallback to unguarded merge;
- invoke the appropriate `gh pr merge` mode only after every check passes;
- emit a sanitized local merge-attempt evidence record.

Do **not** add the script or package command in this preparation lane.

---

## 5. Merge-attempt evidence contract (design-only)

Sanitized evidence record fields:

- UTC timestamp;
- PR number;
- fixed full head SHA;
- merge mode;
- authorization phrase hash;
- authorization phrase structural validation result;
- current PR head;
- head equality result;
- required-check status;
- scope verification result;
- merge command selected;
- exit code;
- resulting merge/squash SHA when successful.

Do **not** store credentials, raw tokens, private account identifiers, or unrelated transcript content.

Recommended local pre-merge evidence location:

```text
.viona-merge-evidence/
```

The directory should be ignored and not committed by default. A later post-merge docs packet may archive only sanitized facts.

Do **not** modify `.gitignore` in this preparation lane.

---

## 6. Freeze bootstrap / remediation exception

Ordinary VIONA PR merges:

```text
PROHIBITED WHILE FREEZE IS ACTIVE
```

Guardrail implementation and verification PRs:

```text
MAY BE PREPARED
MAY BE COMMITTED
MAY BE OPENED
MAY BE REVIEWED
```

They may **not** be merged automatically.

A future one-time remediation merge requires a separately granted phrase that must include:

- exact remediation PR number;
- full fixed reviewed head;
- explicit MERGE;
- exact merge mode;
- explicit wording: `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY`

The future grant must not authorize:

- B1B;
- infrastructure deployment;
- unrelated PRs;
- additional merge exceptions.

The freeze remains active after the remediation merge until post-merge verification proves the guardrail is canonical and operational.

Do **not** propose or issue the actual remediation merge authorization now.

Remediation merge exception status:

```text
PROPOSED
NOT GRANTED
NOT EFFECTIVE
```

---

## 7. Freeze release conditions

Require all of the following before freeze release:

1. guardrail implementation merged through the one-time remediation exception;
2. reviewed head and merged tree preserved;
3. automated tests pass;
4. negative tests prove missing/mismatched authorization stops before merge;
5. post-merge verification confirms canonical script and command;
6. Kernel/Handoff records the guardrail as verified;
7. operator explicitly releases the freeze.

Proposed future release phrase:

```text
RELEASE_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_AFTER_IMPLEMENTATION_AND_POST_MERGE_VERIFICATION
```

| Field | Status |
|---|---|
| Phrase status | **PROPOSED** |
| Granted | **NOT GRANTED** |
| Effective | **NOT EFFECTIVE** |

Do **not** release the freeze automatically after implementation.

---

## 8. Test plan (for future implementation)

### PASS

- exact PR, full head, MERGE authority and correct mode.

### FAIL BEFORE MERGE

- no authorization phrase;
- wrong PR number;
- abbreviated SHA;
- wrong SHA;
- stale reviewed head;
- wrong merge mode;
- authorization containing REVIEW but not MERGE;
- authorization issued for another PR;
- failed required checks;
- changed file scope after review;
- closed PR;
- already merged PR;
- missing GitHub CLI;
- unauthenticated GitHub CLI;
- dirty tracked workspace when policy requires clean state.

Require no real merge during automated unit tests.

Use mocked or dry-run command execution for test coverage.

---

## 9. Implementation candidate (plan-only)

| Future artifact | Purpose |
|---|---|
| `scripts/viona-guarded-pr-merge.mjs` | Repository-owned guarded-merge wrapper |
| `package.json` → `viona:merge:guarded` | Operator-facing command |

Wrapper arguments:

- `--pr`
- `--head`
- `--mode`
- `--authorization`

Wrapper must:

- validate full SHA format;
- parse the exact PR number;
- parse merge mode;
- compare authorization fields to command arguments;
- retrieve the current PR head read-only;
- fail before merge on any mismatch;
- prohibit direct fallback to unguarded merge;
- invoke the appropriate `gh pr merge` mode only after every check passes;
- emit a sanitized local merge-attempt evidence record under `.viona-merge-evidence/` (ignored by default; do not modify `.gitignore` in this lane).

Do **not** add the script or package command in this preparation lane.

---

## 10. Freeze release conditions

Require all of the following before freeze release:

1. guardrail implementation merged through the one-time remediation exception;
2. reviewed head and merged tree preserved;
3. automated tests pass;
4. negative tests prove missing/mismatched authorization stops before merge;
5. post-merge verification confirms canonical script and command;
6. Kernel/Handoff records the guardrail as verified;
7. operator explicitly releases the freeze.

Proposed future release phrase:

```text
RELEASE_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_AFTER_IMPLEMENTATION_AND_POST_MERGE_VERIFICATION
```

| Field | Status |
|---|---|
| Phrase status | **PROPOSED** |
| Granted | **NOT GRANTED** |
| Effective | **NOT EFFECTIVE** |

Do **not** release the freeze automatically after implementation.

---

## 11. Test plan (for future implementation)

### PASS

- exact PR, full head, MERGE authority and correct mode.

### FAIL BEFORE MERGE

- no authorization phrase;
- wrong PR number;
- abbreviated SHA;
- wrong SHA;
- stale reviewed head;
- wrong merge mode;
- authorization containing REVIEW but not MERGE;
- authorization issued for another PR;
- failed required checks;
- changed file scope after review;
- closed PR;
- already merged PR;
- missing GitHub CLI;
- unauthenticated GitHub CLI;
- dirty tracked workspace when policy requires clean state.

Require no real merge during automated unit tests.

Use mocked or dry-run command execution for test coverage.

---

## 12. Final classification (acceptance + plan)

```text
READY_FOR_VIONA_PR446_SECOND_NON_RETROACTIVE_GOVERNANCE_EXCEPTION_ACCEPTANCE_MANDATORY_MERGE_GUARDRAIL_FREEZE_AND_IMPLEMENTATION_PLAN_PACKET_REVIEW
PR446_NON_RETROACTIVE_GOVERNANCE_EXCEPTION_OPTION_A_PLUS_ACCEPTED
PR446_FACTUAL_RESULT_ACCEPTED_ON_MASTER_WITH_SECOND_NON_RETROACTIVE_MERGE_AUTHORIZATION_GOVERNANCE_EXCEPTION
PR446_PREMERGE_AUTHORIZATION_PROVENANCE_REMAINS_HISTORICALLY_UNRESOLVED
PR445_AND_PR446_CONSECUTIVE_PREMERGE_AUTHORIZATION_PROVENANCE_GAPS_ACCEPTED_AS_PERMANENT_NON_RETROACTIVE_EXCEPTIONS
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
NO_FURTHER_VIONA_PR_MERGE_UNTIL_GUARDRAIL_IMPLEMENTED_TESTED_AND_VERIFIED
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

### Next operator action

Separately authorize commit and opening a docs-only PR for the accepted second exception, active freeze, Kernel/Handoff sync and guardrail implementation plan.

Do **not** commit, open a PR, merge any PR, implement the guardrail, or start B1B from this preparation lane.
