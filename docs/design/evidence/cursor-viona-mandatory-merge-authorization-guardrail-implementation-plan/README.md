# Evidence — Mandatory Merge-Authorization Guardrail Implementation Plan

**Plan:** `docs/product/VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_IMPLEMENTATION_PLAN.md`

**Primary classification:** `READY_FOR_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_IMPLEMENTATION_PLAN_REVIEW`

**Mode:** Design-only — no script/workflow/CI/package implementation in this lane

**Canonical tip:** `adc77d2b042af89fddda54793d28b21c7bcf237c`

---

## Related governance

```text
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
NO_FURTHER_VIONA_PR_MERGE_UNTIL_GUARDRAIL_IMPLEMENTED_TESTED_AND_VERIFIED
B1B_GOVERNANCE_FREEZE_ACTIVE
PR445_AND_PR446_CONSECUTIVE_PREMERGE_AUTHORIZATION_PROVENANCE_GAPS_ACCEPTED_AS_PERMANENT_NON_RETROACTIVE_EXCEPTIONS
NO_RETROACTIVE_AUTHORIZATION_CLAIMED
```

---

## Implementation candidate (plan-only)

| Artifact | Status |
|---|---|
| `scripts/viona-guarded-pr-merge.mjs` | Plan-only — **not implemented** |
| `package.json` → `viona:merge:guarded` | Plan-only — **not added** |
| Args | `--pr` `--head` `--mode` `--authorization` |
| Local evidence dir | `.viona-merge-evidence/` (ignored by default; `.gitignore` not modified this lane) |

---

## Functional contract (summary)

Authorization must include all four fields:

1. exact PR number;
2. full 40-character fixed reviewed head SHA;
3. explicit MERGE authority;
4. exact merge mode: `SQUASH` | `MERGE_COMMIT` | `REBASE`

Recommended form:

```text
APPROVE_VIONA_PR_<PR_NUMBER>_MERGE_AT_FIXED_HEAD_<FULL_SHA>_USING_<MERGE_MODE>
```

---

## Freeze bootstrap / release

| Item | Status |
|---|---|
| Ordinary VIONA merges | PROHIBITED while freeze active |
| Guardrail impl/verification PRs | MAY be prepared/committed/opened/reviewed; not merged automatically |
| Remediation merge exception phrase | PROPOSED ONLY / NOT GRANTED |
| Freeze-release phrase | PROPOSED ONLY / NOT GRANTED |

Remediation merge exception must include `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` plus exact PR, full head, MERGE, and mode.

Freeze-release phrase remains:

`RELEASE_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_AFTER_IMPLEMENTATION_AND_POST_MERGE_VERIFICATION`

---

## Boundaries

| Item | Status |
|---|---|
| Script/workflow/CI/package changes this lane | **0** |
| B1B | GOVERNANCE-FROZEN / NOT AUTHORIZED |
| Infrastructure mutation this lane | **0** |

No credentials, tokens, or raw account/project IDs stored in this evidence folder.
