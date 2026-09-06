# Evidence — Emergency PR Lifecycle Containment and Repository-Level GitHub Protection Plan

**Plan:** `docs/product/VIONA_EMERGENCY_PR_LIFECYCLE_CONTAINMENT_AND_REPOSITORY_LEVEL_GITHUB_PROTECTION_IMPLEMENTATION_PLAN.md`

**Primary classification:** `READY_FOR_VIONA_EMERGENCY_PR_LIFECYCLE_CONTAINMENT_AND_REPOSITORY_LEVEL_GITHUB_PROTECTION_IMPLEMENTATION_PLAN_REVIEW`

**Mode:** Design-only — uncommitted — no settings / workflow / script / package / test implementation

**Canonical tip:** `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec`

---

## Selection provenance

```text
ACKNOWLEDGE_AND_SELECT_VIONA_PR448_INCIDENT_DISPOSITION_A_RETAIN_FACTUAL_CONTENT_KEEP_PR447_AND_PR448_FREEZE_BREACH_INCIDENTS_OPEN_AND_DIRECTION_C_ACTIVATE_EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_WITH_REPOSITORY_LEVEL_GITHUB_PROTECTION_PLANNING_AND_NO_NEW_GOVERNANCE_EXCEPTION
```

```text
EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE
NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED
ALL_VIONA_PR_MERGES_PROHIBITED
REPOSITORY_LEVEL_GITHUB_PROTECTION_SELECTED_FOR_PLANNING_NOT_IMPLEMENTED
MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE
B1B_GOVERNANCE_FREEZE_ACTIVE
```

---

## Phase model (plan-only)

| Phase | Purpose | Status |
|---|---|---|
| T0 | Read-only capability confirmation | Design-only |
| T1 | Out-of-band emergency master lockdown | Requires later settings auth — not done |
| T2 | Verify lockdown | Not done |
| T3 | One controlled containment implementation PR | Later auth required |
| T4 | Require Viona Merge Authorization Gate | Later |
| T5 | Post-implementation verification | Later |
| T6 | Explicit release decision | Later |

Emergency-lock candidates A/B/C compared; safest option chosen only after T0. Rollback contract required before any settings mutation.

---

## Fail-closed blockers (planned)

Includes merge-authorization blockers plus:

```text
BLOCKED_EMERGENCY_MASTER_LOCKDOWN_NOT_VERIFIED
BLOCKED_EMERGENCY_ROLLBACK_CONTRACT_INCOMPLETE
```

---

## Boundaries

- No GitHub settings mutation this lane
- No script/workflow/package/test implementation this lane
- Freeze-release phrase remains PROPOSED / NOT GRANTED
- Packet remains uncommitted
