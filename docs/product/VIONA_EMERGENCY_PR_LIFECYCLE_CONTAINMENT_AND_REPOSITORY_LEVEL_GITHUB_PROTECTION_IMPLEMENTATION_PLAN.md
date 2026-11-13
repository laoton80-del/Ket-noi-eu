# VIONA — Emergency PR Lifecycle Containment and Repository-Level GitHub Protection Implementation Plan

**Primary classification:** `READY_FOR_VIONA_EMERGENCY_PR_LIFECYCLE_CONTAINMENT_AND_REPOSITORY_LEVEL_GITHUB_PROTECTION_IMPLEMENTATION_PLAN_REVIEW`

**Mode:** Design-only — **uncommitted** — no GitHub settings mutation, workflow, script, package, or test implementation

**Canonical master baseline:** `c6a19e203a3aa6897cffad8dc9d908f9bca9e9ec`

**Related incident packet:** `docs/product/VIONA_PR448_SECOND_ACTIVE_MANDATORY_MERGE_FREEZE_BREACH_GOVERNANCE_INCIDENT_INVESTIGATION_EMERGENCY_CONTAINMENT_AND_DISPOSITION.md`

**Operator selection:**

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
NO_GITHUB_SETTINGS_MUTATION
NO_SCRIPT_IMPLEMENTATION
NO_WORKFLOW_IMPLEMENTATION
NO_NEW_GOVERNANCE_EXCEPTION
REQUEST_ONLY_NO_CHARGE
```

---

## 1. Purpose

Define a staged, design-only plan to:

1. keep emergency VIONA PR lifecycle containment active;
2. prepare repository-level GitHub protection with a rollback contract;
3. later add the Viona Merge Authorization Gate and guarded wrapper as defense in depth;
4. avoid another uncontrolled PR lifecycle before technical enforcement exists.

This plan does **not** implement settings or code.

---

## 2. Why plan-only controls failed

**FACT:** master protection ABSENT; rulesets EMPTY; auto-merge DISABLED; PR #447 and #448 merged during documented freeze without freeze-remediation grants.

**Evidence-supported conclusion:** documentary freeze and plan-only controls did not provide effective repository-level technical prevention for those merge paths.

A local wrapper alone cannot replace repository-level enforcement.

---

## 3. Implementation phase model (T0–T6)

### PHASE T0 — Read-only capability confirmation

Confirm (no mutation):

- repository ownership and permission level in sanitized form;
- branch protection endpoint behavior;
- repository ruleset capability;
- administrator enforcement capability;
- bypass-actor configuration capability;
- required status-check capability;
- rollback API path;
- current auto-merge configuration.

### PHASE T1 — Out-of-band emergency master lockdown

Requires a **later exact GitHub-settings-mutation authorization**.

Objectives:

- require pull requests for master;
- block direct pushes;
- block force pushes;
- block branch deletion;
- eliminate ordinary bypass actors where supported;
- apply enforcement to administrators where supported;
- preserve auto-merge disabled;
- create an emergency fail-closed merge lock.

**Not performed in this lane.**

### PHASE T2 — Verify lockdown

Before any new controlled implementation PR:

- prove direct push blocked;
- prove force push blocked;
- prove deletion blocked;
- prove ordinary merge cannot complete;
- confirm authorized rollback path;
- capture sanitized settings evidence.

**Not performed in this lane.**

### PHASE T3 — One controlled containment implementation PR

Only after T1 and T2 pass, a later operator authorization may permit exactly one non-ordinary containment implementation PR (gate workflow, guarded wrapper, tests, required docs).

Opening requires separate exact authorization. Merge remains prohibited until fixed-head review and a later exact freeze-remediation merge authorization exist.

### PHASE T4 — Required authorization gate activation

After implementation is canonical, update repository protection to require **Viona Merge Authorization Gate**. Any new PR head invalidates a prior authorization result.

### PHASE T5 — Post-implementation verification

Positive and negative tests plus real fail-closed evidence.

### PHASE T6 — Explicit release decision

Emergency PR lifecycle containment and mandatory merge freeze remain active until the operator explicitly releases them.

---

## 4. Emergency fail-closed lock candidates (not implemented)

| Candidate | Idea |
|---|---|
| A | Ruleset/protection requiring a deliberately unsatisfied emergency status context (e.g. `Viona Emergency Merge Lock`) |
| B | Ruleset with no ordinary bypass actor and conditions preventing merge until a controlled status gate exists |
| C | Temporary restriction to a narrowly identified emergency administrator path; every action separately authorized and recorded |

Documented risks:

- accidental repository lockout;
- administrator bypass remaining available;
- unsupported ruleset features;
- required-check name mismatch;
- inability to recover settings;
- protection changes not applying to administrators;
- ruleset evaluation versus active mode;
- settings drift.

Recommend the safest capability-supported option **only after T0** confirms repository behavior. Do not assume a GitHub feature is available until T0 proves it.

---

## 5. Rollback contract (required before any future settings mutation)

Before mutation, require:

- sanitized capture of current settings;
- exact intended delta;
- exact expected enforcement;
- rollback conditions;
- rollback command or API operation prepared but not executed;
- authorized operator identity;
- UTC timestamp;
- post-change verification;
- no credential or raw private ID in evidence.

Rollback permitted only to recover from:

- owner lockout;
- blocking of required emergency recovery;
- unsupported configuration;
- confirmed incorrect target branch;
- repository availability incident caused by the protection change.

Rollback must **not** become an ordinary merge bypass.

---

## 6. Viona Merge Authorization Gate (planned)

Status context: **Viona Merge Authorization Gate**

Must bind authorization to:

- exact PR number;
- full 40-character current head SHA;
- explicit MERGE authority;
- exact merge mode;
- authorized operator identity;
- authorization issued after the latest head;
- freeze-remediation scope while freeze is active.

Any new head invalidates the result.

**Preferred transport:** operator-triggered GitHub workflow.

**Alternative:** structured operator-authored PR comment (editable-comment / reprocessing / allowlist / deletion / head-invalidation risks).

Keep the workflow candidate recommended unless T0 proves it unsupported or unsafe.

---

## 7. Guarded merge wrapper (planned; defense-in-depth only)

| Artifact | Status |
|---|---|
| `scripts/viona-guarded-pr-merge.mjs` | Plan-only |
| `viona:merge:guarded` | Plan-only |
| Args | `--pr` `--head` `--mode` `--authorization` |

Cannot replace repository-level enforcement.

---

## 8. Fail-closed blockers

```text
BLOCKED_MERGE_AUTHORIZATION_PROVENANCE_UNRESOLVED
BLOCKED_MERGE_AUTHORIZED_HEAD_MISMATCH
BLOCKED_MERGE_MODE_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_PR_NUMBER_AUTHORIZATION_MISMATCH
BLOCKED_MERGE_SCOPE_CHANGED_AFTER_REVIEW
BLOCKED_MERGE_REQUIRED_CHECK_FAILED
BLOCKED_MERGE_OPERATOR_NOT_AUTHORIZED
BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED
BLOCKED_EMERGENCY_MASTER_LOCKDOWN_NOT_VERIFIED
BLOCKED_EMERGENCY_ROLLBACK_CONTRACT_INCOMPLETE
```

Every blocker must stop execution before merge.

---

## 9. Freeze and containment release conditions

Require **all** before either control can be released:

1. emergency master lockdown active and verified;
2. direct push, force push and deletion protections verified;
3. ordinary merge technically blocked;
4. Viona Merge Authorization Gate canonical and required;
5. guarded wrapper canonical;
6. positive tests pass;
7. negative tests prove fail-closed behavior;
8. remediation merge post-merge verified;
9. Kernel/Handoff canonical;
10. PR #447 and PR #448 incident dispositions reviewed;
11. operator explicitly releases both controls.

Existing freeze-release phrase:

```text
RELEASE_VIONA_MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_AFTER_IMPLEMENTATION_AND_POST_MERGE_VERIFICATION
```

| Field | Status |
|---|---|
| Phrase status | **PROPOSED** |
| Granted | **NOT GRANTED** |
| Effective | **NOT EFFECTIVE** |

A separate emergency PR lifecycle containment release decision is also required. No operative release phrase is issued in this lane.

---

## 10. Case B and B1B

```text
BLOCKED_NO_VERIFIED_VIONA_STAGING_CLIENT_DEPLOYMENT_TARGET
BLOCKED_E8_STAGING_CLIENT_PROJECT_BINDING_UNRESOLVED
BLOCKED_E8_CLIENT_DEPLOYMENT_ROLLBACK_CONTRACT_INCOMPLETE
BLOCKED_E8_STAGING_CLIENT_API_BASE_NOT_SAFE
```

B1B: GOVERNANCE-FROZEN · NOT STARTED · NOT GRANTED · NOT EFFECTIVE · NOT AUTHORIZED.

---

## 11. Next action

This plan remains uncommitted and design-only.

Separately authorize strict read-only review of the emergency containment + GitHub-protection plan packet.

Do not implement settings, workflows, scripts, or tests from this document.
Do not open ordinary PRs.
Do not merge.
Do not release containment or freeze.
Do not start B1B.
