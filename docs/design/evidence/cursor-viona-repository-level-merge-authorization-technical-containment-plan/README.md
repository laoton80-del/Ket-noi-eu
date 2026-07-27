# Evidence — Repository-Level Merge Authorization Technical Containment Plan

**Plan:** `docs/product/VIONA_REPOSITORY_LEVEL_MERGE_AUTHORIZATION_TECHNICAL_CONTAINMENT_PLAN.md`

**Primary classification:** `READY_FOR_VIONA_REPOSITORY_LEVEL_MERGE_AUTHORIZATION_TECHNICAL_CONTAINMENT_PLAN_REVIEW`

**Mode:** Design-only — uncommitted — no GitHub settings / workflow / check / script / package / test implementation

**Canonical tip:** `636ad1e145e65547d80a863e2d249279bce8b25d`

**Related incident:** Disposition A selected; Direction C selected for planning; third exception not accepted

---

## Selection provenance

```text
ACKNOWLEDGE_AND_SELECT_VIONA_PR447_FREEZE_BREACH_INCIDENT_DISPOSITION_A_RETAIN_FACTUAL_CONTENT_KEEP_INCIDENT_OPEN_AND_DIRECTION_C_MANDATORY_TECHNICAL_CONTAINMENT_PLANNING_WITH_NO_THIRD_EXCEPTION
```

```text
PR447_TECHNICAL_CONTAINMENT_DIRECTION_C_SELECTED_FOR_PLANNING
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

---

## Architecture (plan-only)

| Layer | Content | Status |
|---|---|---|
| 1 | Master ruleset / branch protection | Design-only |
| 2 | Required status: Viona Merge Authorization Gate | Design-only |
| 3 | `scripts/viona-guarded-pr-merge.mjs` + `viona:merge:guarded` | Design-only |
| 4 | Separate post-merge verification | Design-only |

Authorization transport recommendation: **Candidate 1** (operator-triggered GitHub workflow) over comment-based Candidate 2.

---

## Fail-closed blockers (planned)

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

## Freeze release

Phrase `RELEASE_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_AFTER_IMPLEMENTATION_AND_POST_MERGE_VERIFICATION` remains **PROPOSED / NOT GRANTED / NOT EFFECTIVE**.

Remediation exception phrase must not be issued before an implementation PR and full fixed head exist. PR #447 is not that PR.

---

## Boundaries

- No GitHub settings mutation this lane
- No script/workflow/package/test implementation this lane
- B1B frozen and unauthorized
- Case B blockers preserved
- Packet remains uncommitted
