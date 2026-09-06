# VIONA Codex Autonomous Execution Envelope Spec

**Document type:** Reusable envelope specification - docs-only, not executable runtime configuration.
**Packet ID:** `VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL_FOUR_FILE_PACKET`
**Trusted baseline parent:** `40b8c61bf7a053880007978002fe6e26fe4ad5c4`
**Branch:** `docs/viona-codex-controlled-autonomous-execution-protocol-four-file-packet`
**Status:** `candidate_docs_only_pending_canonical_adoption`
**Runtime impact:** None.
**Source impact:** None.
**Authority:** Subordinate to `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`.
**Related:** `docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md`, `docs/design/evidence/codex-viona-controlled-autonomous-execution-protocol/README.md`, `AGENTS.md`

---

## 1. Purpose

This specification defines the reusable VIONA Controlled Autonomous Execution Envelope. An envelope is a bounded operator authorization contract that lets Codex continue multi-step work without repeated prompt-by-prompt intervention while preserving default-deny governance.

The envelope is documentation only in this packet. It is not a runtime config file, feature flag, CI directive, or automatic permission source.

---

## 2. Authority Hierarchy

| Authority | Rule |
| --- | --- |
| `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` | Superior authority. If conflict exists, VIONA Operating Protocol wins. |
| Operator envelope | Grants only the explicit lane authority it names. |
| Repository evidence | Verifies baseline, diff, validation, and final state. |
| Codex inference | Never grants authority. Missing fields default to deny. |

The protocol and this envelope spec never grant themselves authority. Every autonomous run requires a fresh, explicit operator authorization envelope.

Executor substitution does not reset or expand authorization. Codex may be the primary executor and Cursor may temporarily execute an authorized lane, but substitution does not change canonical repository, branch/HEAD requirements, file allowlist, mutation budget, remote rights, stop conditions, or authorization provenance. Authorization belongs to the lane and action, not to executor branding.

---

## 3. Required Envelope Fields

Every VIONA Controlled Autonomous Execution Envelope must include these fields. No missing field may be silently inferred as permission.

```text
PROJECT:
  name:

CANONICAL_ROOT:
  path:

EXPECTED_BASE:
  branch:
  head:
  parent:
  tree_state:
  staged_paths:
  staged_diff_sha256:
  untracked_paths:

MODE:
  autonomy_level:
  stop_on_error:
  max_remediation_cycles:

PURPOSE:
  summary:
  non_authorization_statement:

CREATE_ALLOWLIST:
  paths:

MODIFY_ALLOWLIST:
  paths:

DENYLIST:
  paths:
  categories:

VALIDATORS:
  targeted:
  full:
  post_mutation:

SELF_REMEDIATION_POLICY:
  allowed:
  forbidden:
  retry_limit:

STAGE_AUTHORITY:
  allowed:
  paths:

COMMIT_AUTHORITY:
  allowed:
  paths:
  count:
  subject:

PUSH_AUTHORITY:
  allowed:
  remote:
  branch:

PR_AUTHORITY:
  create:
  edit:
  ready:
  base:

MERGE_AUTHORITY:
  allowed:
  target:

DEPLOY_AUTHORITY:
  allowed:
  environment:

WORKTREE_AUTHORITY:
  allowed:
  base:
  cleanup:

REMOTE_MUTATION_AUTHORITY:
  allowed:
  operations:

STOP_CONDITIONS:
  blockers:

ROLLBACK:
  strategy:
  forbidden_commands:

OUTPUT_EVIDENCE:
  required_fields:

FINAL_CLASSIFICATION:
  success:
  blocked:
```

`EXPECTED_BASE.staged_paths` is the exact baseline index-path declaration. Use
`staged_paths: []` when no paths are staged at baseline; otherwise list every
expected staged repository path exactly. The observed output of
`git diff --cached --no-renames --name-only` must match that declared set
exactly. Rename detection must be disabled for staged path-set comparisons so
both the source and destination paths of a staged rename are enumerated and
must be explicitly authorized.

`EXPECTED_BASE.staged_diff_sha256` pins the exact content of the baseline index
when staged changes exist. It is the lowercase SHA-256 of the exact raw stdout
bytes from this canonical command, with no text decoding or newline
normalization before hashing:

```bash
git -c core.abbrev=40 diff --cached --raw --no-renames -z
```

For this SHA-1 repository, `core.abbrev=40` forces full object IDs in the raw
index diff. The byte stream includes modes, pre/post object IDs, status, and
NUL-delimited paths; with rename detection disabled, both endpoints of a rename
are represented as separate delete/add records. A clean index therefore uses
the SHA-256 of the empty byte string:
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
The staged-content digest must be verified at preflight and reverified
immediately before any commit-only operation. Matching path names without a
matching staged-content digest is not sufficient.

`EXPECTED_BASE.untracked_paths` is an exact baseline declaration. Use
`untracked_paths: []` when no untracked repository files are expected. If
untracked files are expected, list their exact repository paths. The observed
output of `git ls-files --others --exclude-standard` must match that declared
set exactly; Codex must not infer expected untracked paths.

---

## 4. Autonomy Levels

| Level | Name | Local authority | Remote authority |
| --- | --- | --- |
| A0 | Read / audit | Read-only inspection and reporting | None |
| A1 | Docs / planning | Create or edit exact docs only | None |
| A2 | Local implementation + tests | Edit exact allowlisted local files and run validators | None |
| A2C | Local implementation + tests + one local commit | A2 plus exact stage and local commit authority | None |
| A3 | Controlled push / PR preparation | A2C plus exact push preparation when authorized | Push only if explicit |
| A4 | Controlled PR lifecycle | PR create/edit/ready when explicit | PR operations only as named |
| A5 | Controlled deployment | Deployment only to exact environment when explicit | Deploy only as named |
| A6 | Multi-agent continuous engineering | Bounded multi-agent execution with one integration owner | Only explicit remote operations |

Current VIONA default ceiling: A2 or A2C only when explicitly authorized. A3, A4, A5, and A6 are not currently authorized by default. A6 is default-deny and is not implied by A2 or A2C. A6 requires explicit authorization if used.

---

## 5. Default-Deny Flags

Unless the envelope explicitly sets a category to allowed, Codex must use:

```text
AUTO_SCOPE_EXPANSION = false
AUTO_PUSH = false
AUTO_PR = false
AUTO_MERGE = false
AUTO_DEPLOY = false
AUTO_WORKTREE = false
AUTO_DB_CHANGE = false
AUTO_SECRET_CHANGE = false
AUTO_PAYMENT_CHANGE = false
AUTO_SOS_CHANGE = false
AUTO_NEW_AI_COST_PATH = false
MULTI_AGENT = false
```

Omitted mutating authority means deny.

---

## 6. Preflight Contract

Every autonomous lane starts with:

```bash
Get-Location
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
git diff --name-only
git diff --cached --no-renames --name-only
git ls-files --others --exclude-standard
```

In addition, compute and compare the exact raw-byte SHA-256 for:

```bash
git -c core.abbrev=40 diff --cached --raw --no-renames -z
```

against `EXPECTED_BASE.staged_diff_sha256`.

Require:

- canonical root;
- expected branch;
- exact HEAD;
- expected tree state;
- expected staged path set, with rename source and destination paths both enumerated;
- expected staged-content digest;
- expected untracked-file state.

Any mismatch means stop. No automatic checkout, reset, rebase, stash, pull, fetch, branch repair, or worktree repair is allowed unless explicitly authorized.

---

## 7. Allowlist and Denylist Contract

Only exact paths may be created or modified.

Reject vague authority:

- `as needed`;
- `related files`;
- `supporting files`;
- `other files`;
- `additional files`;
- `etc.`;
- broad category phrases without exact file boundaries.

If another file becomes necessary, Codex must stop with:

`BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED`

The denylist has absolute priority over implementation convenience. A denied file or denied category cannot be modified even if tests would pass afterward.

---

## 8. Self-Remediation Policy

Codex may self-remediate only when all conditions are true:

1. the failing change is inside an explicitly authorized file;
2. the remediation does not expand behavior beyond the authorized contract;
3. no new dependency is required;
4. no denylisted file must change;
5. no governance boundary changes;
6. no architecture decision changes;
7. no external API, payment, SOS, DB, auth, tenant, deploy, or remote scope changes.

Allowed under an A2 envelope:

- TypeScript typing correction in an allowlisted file;
- import correction in an allowlisted file;
- test expectation correction when the test itself is allowlisted and the product contract remains unchanged;
- small implementation defect directly caused by the authorized change.

Not allowed without stop:

- new file;
- new dependency;
- new route;
- new API;
- schema change;
- auth change;
- payment change;
- SOS ownership change;
- new AI provider or cost path;
- architecture redesign.

---

## 9. Controlled Test Loop

Use this loop:

```text
IMPLEMENT
-> RUN TARGETED TEST
-> IF FAIL:
     classify cause
-> IF safely remediable inside envelope:
     remediate
     rerun
-> ELSE:
     STOP
-> RUN FULL REQUIRED VALIDATORS
-> CAPTURE FINAL GIT STATE
```

Default anti-loop rule:

`max_remediation_cycles = 3`

Codex must not retry indefinitely. If the same failure class remains after the retry limit, stop with:

`BLOCKED_VIONA_CODEX_REMEDIATION_RETRY_LIMIT_REACHED`

---

## 10. Evidence Contract

Every autonomous lane must return:

- baseline;
- authorization provenance;
- files created;
- files modified;
- files denied and not touched;
- tests run;
- test outcomes;
- remediation performed;
- scope expansions requested;
- Git state;
- runtime effect;
- remote effect;
- rollback state;
- final classification.

Codex must not claim success without evidence.

---

## 11. Local Commit Contract

Stage authority and commit authority are independent. If stage authority is
false, do not stage. If stage authority is true, Codex may stage only the exact
paths in `STAGE_AUTHORITY.paths`, including when commit authority is false. A
stage-only lane with stage authority true and commit authority false is valid.

When stage authority is true:

- use exact paths only;
- run `git diff --cached --no-renames --name-only` and require every staged path, including both endpoints of a rename, to be authorized;
- run `git diff --cached --check`.

Never use these staging commands unless the operator explicitly authorizes them:

```bash
git add .
git add -A
git add --all
```

If commit authority is false, do not commit; it does not independently forbid
staging authorized by stage authority. If commit authority is true, it does not
imply stage authority.

When commit authority is true:

- `COMMIT_AUTHORITY.paths` must list every repository path authorized for the commit exactly, including both source and destination paths of any rename;
- immediately before committing, `git diff --cached --no-renames --name-only` must equal `COMMIT_AUTHORITY.paths` exactly, with no additional staged path;
- if stage authority is false, perform no staging and require the pre-existing cached path set to match both `EXPECTED_BASE.staged_paths` and `COMMIT_AUTHORITY.paths` exactly;
- if stage authority is false, also recompute the raw staged-content digest immediately before commit and require exact equality with `EXPECTED_BASE.staged_diff_sha256`;
- if stage authority is true, require the post-stage cached path set to match `COMMIT_AUTHORITY.paths` exactly before committing;
- create exactly the number of commits authorized;
- use the exact subject if provided;
- do not amend, rebase, squash, or rewrite history unless explicitly granted.

A commit must not package an unnamed, unrelated, or baseline-drifted staged
change. Commit authority without an exact `COMMIT_AUTHORITY.paths` set is
insufficient, and a commit-only lane with pre-existing staged content is
forbidden unless both its exact path set and its staged-content digest match the
operator-declared baseline immediately before commit.

---

## 12. Remote Mutation Contract

Remote actions are independent permissions.

Separate authority is required for:

- push;
- PR create;
- PR edit;
- PR ready;
- merge;
- workflow dispatch;
- deploy;
- branch protection mutation;
- remote issue, release, or environment write.

Local commit does not imply push. Push does not imply PR. PR does not imply merge. Merge does not imply deploy.

---

## 13. Worktree Policy

Default:

```text
AUTO_WORKTREE = false
```

Canonical root remains:

```text
C:\KNG\ket-noi-eu
```

Codex must not create sibling worktrees, temporary worktrees, or cloud clones used as authoritative replacements unless explicitly authorized.

Later envelopes may authorize worktrees only with:

- exact base;
- exact purpose;
- exact cleanup contract;
- exact integration owner.

---

## 14. Multi-Agent Policy

Default:

```text
MULTI_AGENT = false
```

A future envelope may authorize separate agents for implementation, tests, and review. It must require:

- isolated responsibilities;
- no conflicting writers;
- one canonical integration owner;
- exact mutation ownership;
- bounded concurrency;
- deterministic final integration checks.

Never allow two autonomous agents to write the same files concurrently.

---

## 15. Cost and Token Control

Economical defaults:

- one primary agent;
- fast mode off unless requested;
- no broad repo re-audit when a focused read suffices;
- no repeated full-CI loops before targeted tests pass;
- bounded remediation retries;
- stop when blocked.

Priority order:

1. correctness;
2. governance preservation;
3. minimum necessary compute.

---

## 16. Mobile / Remote Operator Model

The operator may be on mobile while the PC/local executor continues within the active envelope.

Codex pauses for operator input only when:

- scope expansion is required;
- new authority is required;
- a high-risk boundary is reached;
- explicit approval is required;
- baseline or validation evidence contradicts the envelope.

Routine steps already covered by the envelope should not require extra prompt-by-prompt operator interaction.

---

## 17. High-Risk Hard Stops

Unless explicitly authorized, hard-stop on:

- production deploy;
- DB migration or schema change;
- secrets;
- branch protection;
- payment;
- booking provider mutation;
- SOS semantics or ownership;
- identity or auth architecture;
- new external paid AI runtime;
- destructive Git command;
- force push;
- history rewrite.

---

## 17.1 Current VIONA Governance State

The envelope must not release or override active VIONA governance state. Current preserved markers:

- `EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE`
- `NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED`
- `ALL_VIONA_PR_MERGES_PROHIBITED`
- `MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE`
- `B1B_GOVERNANCE_FREEZE_ACTIVE`
- `NO_RETROACTIVE_AUTHORIZATION_CLAIMED`

Local autonomous execution authority does not imply remote lifecycle authority. A2 and A2C authority do not authorize push, PR creation, PR edits, merge, deploy, or freeze release.

No envelope may claim that the freeze is released unless a separate founder/operator-approved governance release packet exists.

---

## 18. No Function Removal

Preserve:

`NO_FUNCTION_REMOVAL`

If a capability is not ready, label it honestly:

- Lite;
- Demo;
- Pilot;
- Beta;
- Coming Soon;
- Gated;
- Frozen.

Do not silently delete functionality during autonomous cleanup.

---

## 19. Rollback Contract

Every implementation envelope must define rollback before mutation.

Rollback must be narrow and proportional:

- prefer reverting only files changed by the lane;
- preserve user and unrelated local work;
- preserve unrelated branches;
- preserve remote state unless remote rollback is explicitly authorized.

Codex must not invent broad destructive rollback commands. `git reset --hard` is forbidden unless separately and explicitly authorized.

---

## 20. Stop Classifications

Canonical blockers:

| Classification | Meaning |
| --- | --- |
| `BLOCKED_VIONA_CODEX_BASELINE_DRIFT` | Root, branch, HEAD, staged state, or tree state does not match the envelope. |
| `BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED` | The required work needs files or behavior outside the allowlist. |
| `BLOCKED_VIONA_CODEX_DENYLIST_CONFLICT` | The required work touches a denied file or category. |
| `BLOCKED_VIONA_CODEX_VALIDATION_FAILURE_OUTSIDE_SCOPE` | A failure cannot be fixed inside the envelope. |
| `BLOCKED_VIONA_CODEX_NEW_DEPENDENCY_REQUIRED` | A dependency is required but not authorized. |
| `BLOCKED_VIONA_CODEX_ARCHITECTURE_DECISION_REQUIRED` | A product or architecture decision is needed. |
| `BLOCKED_VIONA_CODEX_REMOTE_AUTHORITY_REQUIRED` | Push, PR, merge, deploy, workflow, or remote write is needed but not authorized. |
| `BLOCKED_VIONA_CODEX_HIGH_RISK_BOUNDARY_REACHED` | Payment, SOS, tenant, auth, secrets, DB, production, or paid AI risk is reached. |
| `BLOCKED_VIONA_CODEX_REMEDIATION_RETRY_LIMIT_REACHED` | Retry cap is exhausted for the same failure class. |

On blocker:

```text
STOP
REPORT
NO SILENT REMEDIATION OUTSIDE AUTHORITY
```

---

## 21. Example Envelope

```text
PROJECT:
  name: VIONA

CANONICAL_ROOT:
  path: C:\KNG\ket-noi-eu

EXPECTED_BASE:
  branch: docs/example-local-implementation
  head: 0000000000000000000000000000000000000000
  parent: 0000000000000000000000000000000000000000
  tree_state: clean
  staged_paths: []
  staged_diff_sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  untracked_paths: []

MODE:
  autonomy_level: A2C
  stop_on_error: true
  max_remediation_cycles: 3

PURPOSE:
  summary: Implement one allowlisted local change and package it locally.
  non_authorization_statement: No push, PR, merge, deploy, DB, payment, SOS, or production action.

CREATE_ALLOWLIST:
  paths:
    - src/example/new-file.ts

MODIFY_ALLOWLIST:
  paths:
    - src/example/existing-file.ts
    - scripts/test-example.ts

DENYLIST:
  paths:
    - prisma/schema.prisma
    - package.json
  categories:
    - payment
    - SOS live behavior
    - remote mutation

VALIDATORS:
  targeted:
    - npx tsx scripts/test-example.ts
  full:
    - npx tsc --noEmit
    - npm run ci:expo-readiness
    - npm run ci:release-discipline
  post_mutation:
    - git diff --check
    - git status --short --branch

SELF_REMEDIATION_POLICY:
  allowed:
    - typing fixes inside allowlisted files
    - import fixes inside allowlisted files
  forbidden:
    - new dependency
    - new route
    - schema change
  retry_limit: 3

STAGE_AUTHORITY:
  allowed: true
  paths:
    - src/example/new-file.ts
    - src/example/existing-file.ts
    - scripts/test-example.ts

COMMIT_AUTHORITY:
  allowed: true
  paths:
    - src/example/new-file.ts
    - src/example/existing-file.ts
    - scripts/test-example.ts
  count: 1
  subject: "feat(example): add controlled local implementation"

PUSH_AUTHORITY:
  allowed: false
  remote:
  branch:

PR_AUTHORITY:
  create: false
  edit: false
  ready: false
  base:

MERGE_AUTHORITY:
  allowed: false
  target:

DEPLOY_AUTHORITY:
  allowed: false
  environment:

WORKTREE_AUTHORITY:
  allowed: false
  base:
  cleanup:

REMOTE_MUTATION_AUTHORITY:
  allowed: false
  operations:

STOP_CONDITIONS:
  blockers:
    - baseline drift
    - denylist conflict
    - validation failure outside scope
    - new dependency required
    - remote authority required

ROLLBACK:
  strategy: Revert only allowlisted local file edits made by the lane when explicitly authorized.
  forbidden_commands:
    - git reset --hard

OUTPUT_EVIDENCE:
  required_fields:
    - baseline
    - files changed
    - validators
    - git state
    - remote effect
    - final classification

FINAL_CLASSIFICATION:
  success: VIONA_EXAMPLE_LOCAL_IMPLEMENTATION_PACKAGED_UNPUBLISHED
  blocked: BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED
```

---

## 22. AGENTS.md Relationship

`AGENTS.md` is included as the fourth candidate file of this packet. It is a repository-level execution bootstrap / instruction layer.

It does not self-authorize mutation. It does not grant push, PR, merge, or deploy. It does not override `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` or a lane-specific operator authorization envelope.

`AGENTS.md` may define how authorized work is performed. It may not define that mutation is authorized. `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` remains superior authority.

---

## 23. Current Example Mobile State

Current state recorded as an example context only:

| Surface | State |
| --- | --- |
| Phase 0 Native Presentation Isolation | `PLANNED_NOT_IMPLEMENTED` |
| Phase 1 Native Home | implementation plan locally packaged |
| Phase 1 runtime | not implemented |
| Current local planning tip | `40b8c61bf7a053880007978002fe6e26fe4ad5c4` |

This envelope spec does not authorize Phase 0 or Phase 1 implementation.
