# VIONA Codex Controlled Autonomous Execution Protocol

**Document type:** AI/agent execution protocol - docs-only governance artifact.
**Packet ID:** `VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL_FOUR_FILE_PACKET`
**Trusted baseline parent:** `40b8c61bf7a053880007978002fe6e26fe4ad5c4`
**Branch:** `docs/viona-codex-controlled-autonomous-execution-protocol-four-file-packet`
**Status:** `candidate_docs_only_pending_canonical_adoption`
**Runtime impact:** None. This document does not authorize implementation.
**Source impact:** None. This document does not authorize edits outside documentation.
**Related:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_SPEC.md`, `docs/design/evidence/codex-viona-controlled-autonomous-execution-protocol/README.md`, `AGENTS.md`

---

## 1. Purpose

This protocol defines how Codex may execute VIONA work in a controlled autonomous mode without drifting into unapproved code, runtime, data, remote, payment, tenant, AI, SOS, or release actions.

It is designed for operator-approved lanes where Codex may keep working through a bounded packet, but every material action remains governed by:

1. exact baseline verification;
2. explicit file allowlists;
3. declared mutation budgets;
4. fail-closed stop rules;
5. evidence-first reporting;
6. separate authorization for stage, commit, push, PR, merge, deploy, database, runtime, and production actions.

The protocol is subordinate to `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` and does not weaken any existing VIONA guardrail.

---

## 2. Non-authorization Statement

This packet does not authorize:

| Surface | Authorized by this packet |
| --- | --- |
| Runtime implementation | No |
| Source code edit | No |
| Database write | No |
| Prisma schema or migration | No |
| API call against live systems | No |
| Payment or wallet mutation | No |
| Tenant data mutation | No |
| SOS live behavior | No |
| AI provider call for product behavior | No |
| Package or lockfile change | No |
| Stage | No |
| Commit | No |
| Push | No |
| Pull request | No |
| Merge | No |
| Deploy | No |
| Production claim | No |

Any future lane that needs one of these actions must name it directly and provide a separate allowlist and mutation budget.

---

## 3. Core Principles

### 3.1 Evidence before action

Codex must verify the local repository state before performing any approved mutation. At minimum, it must know:

- repository top-level;
- branch;
- HEAD;
- unstaged tracked paths and their deterministic diff identity;
- staged diff;
- unstaged tracked diff;
- nonignored untracked paths and their deterministic content identities;
- ignored untracked paths and their deterministic content identities;
- relevant source/runtime/package drift.

Inventorying an ignored or nonignored untracked path is evidence only. It does not grant mutation, staging, commit, execution, disclosure, or use authority over that path.

If the actual state does not match the operator's baseline, Codex stops instead of repairing the baseline silently.

### 3.2 Explicit allowlists only

Only paths explicitly named in the active operator authorization envelope may be created or modified.

No inferred file expansion. No "obviously necessary" expansion. No "supporting files" expansion. Vague phrases such as `related files`, `supporting files`, `cleanup`, `as needed`, or `unambiguously necessary` are not enough to authorize edits.

If another path is required, Codex must STOP, return a blocker, and request scope expansion. Codex may audit, but must not expand the mutation set.

### 3.3 Declared mutation budget

Every controlled lane must be expressible as a finite budget:

| Mutation type | Required declaration |
| --- | --- |
| File edits | Explicit exact paths; file count and documentation class are budget or evidence metadata only |
| Stage | Yes or no, with exact path list when yes |
| Commit | Yes or no, with expected subject when yes |
| Push | Yes or no, with target branch when yes |
| PR | Yes or no, with target base when yes |
| Merge | Yes or no, with target PR when yes |
| Deploy | Yes or no, with environment when yes |
| Runtime/source | Yes or no, with exact path list when yes |
| Data/API | Yes or no, with exact endpoint/table and safety gate when yes |

If a lane says zero for a mutation class, Codex must not perform that mutation class.

All repository file mutation authority requires explicit exact paths. A
documentation class may describe the work type, and a file count may record a
budget or evidence, but neither can substitute for exact paths. Wildcards,
broad categories, or inferred paths such as `related files`, `supporting files`,
or `as needed` do not grant file mutation authority.

### 3.4 Fail closed

Codex must stop on:

- branch mismatch;
- HEAD mismatch;
- unexpected staged content;
- unexpected tracked diff;
- unexpected tracked content-identity drift;
- unexpected nonignored or ignored untracked path state;
- unexpected untracked content-identity drift;
- validation mutation;
- source/runtime drift in a docs-only lane;
- failed `git diff --check` where remediation is not explicitly authorized;
- missing or ambiguous approval phrase;
- remote mutation request hidden inside a local-only lane.

Stopping means report the blocker and do not self-authorize remediation.

### 3.5 No production theater

Codex must never turn a plan, mock, preview, demo, or docs packet into a production claim. VIONA surfaces remain honest about readiness:

- request-only means no charge;
- preview means not confirmed;
- pilot means gated;
- planned means not implemented;
- mock-only means no real provider side effect;
- docs-only means no runtime change.

### 3.6 Human control remains authoritative

Controlled autonomous execution does not mean Codex becomes the product owner, release owner, payment owner, SOS safety owner, compliance owner, or merge authority. Codex may execute the allowed lane, surface blockers, and produce evidence. It may not promote itself into a missing human sign-off.

### 3.7 Executor substitution

Codex is the primary executor for this protocol. Cursor may temporarily execute an authorized lane when the operator explicitly substitutes it. Executor substitution does not reset or expand authorization. It does not change canonical repository, branch/HEAD requirements, file allowlist, mutation budget, remote rights, stop conditions, or authorization provenance. Authorization belongs to the lane and action, not to executor branding.

---

## 4. Autonomy Levels

| Level | Name | Codex may do | Codex may not do |
| --- | --- | --- | --- |
| A0 | Read / audit | Read files, run non-mutating commands, report findings | Edit, stage, commit, push, PR, merge, deploy |
| A1 | Docs / planning | Create or edit exact docs only | Source/runtime/package edits; stage unless separately authorized |
| A2 | Local implementation + tests | Edit exact allowlisted local files and run authorized validators | Stage, commit, push, PR, merge, deploy unless separately authorized |
| A2C | Local implementation + tests + one local commit | A2 plus exact stage and one local commit when explicitly authorized | Push, PR, merge, deploy |
| A3 | Controlled push / PR preparation | Prepare or push only when exact remote authority is granted | PR create/edit/ready, merge, deploy unless separately authorized |
| A4 | Controlled PR lifecycle | Create, edit, or mark PR ready only when exact PR authority is granted | Merge or deploy unless separately authorized |
| A5 | Controlled deployment | Deploy exact artifact to exact environment only when authorized | Schema/data/payment/SOS expansion unless separately authorized |
| A6 | Multi-agent continuous engineering | Bounded multi-agent execution with one integration owner and exact mutation ownership | Conflicting writers, unbounded concurrency, implied remote authority |

Current VIONA default ceiling is A2 or A2C only when explicitly authorized. A3, A4, A5, and A6 are not currently active by default. A6 is default-deny and is not implied by A2 or A2C. A6 requires explicit authorization if used.

If a lane mixes levels, the operator must name every active level and every mutation budget.

---

## 5. Required Preflight Template

Before mutation in any controlled lane:

```bash
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
git diff --no-renames --name-only
git -c core.abbrev=40 diff --raw --no-renames -z
git diff --cached --no-renames --name-only
git ls-files --others --exclude-standard -z
git ls-files --others --ignored --exclude-standard -z
```

The unstaged tracked baseline is an exact path set and raw diff identity. Codex
must compare `git diff --no-renames --name-only` with the operator-declared
unstaged tracked path set and compare the SHA-256 of
`git -c core.abbrev=40 diff --raw --no-renames -z` with the declared tracked
diff digest. Path equality alone is insufficient because a validator can change
bytes at the same tracked path without changing the path set. Rename detection
must be disabled so both endpoints of a rename are visible to exact-path
validation.

The staged-path preflight disables rename detection so both source and
destination endpoints of a staged rename are visible to exact-path validation.

The untracked baseline is two disjoint exact path sets: nonignored untracked
paths and ignored untracked paths. Each set must match the corresponding
operator-declared exact path set and deterministic manifest SHA-256 in the
active execution envelope. The manifest binds the exact path bytes, filesystem
type, and raw-byte content identity of every declared untracked path. An empty
set is represented by the SHA-256 of the empty byte string. Symlink identity is
the raw link-target bytes; unsupported filesystem types are a fail-closed
blocker. Manifest construction must not disclose or use file contents beyond
computing the declared identity.

Inventorying ignored dependency/cache artifacts or ignored secret paths grants
no permission to read their semantic contents, modify them, stage them, execute
them, or treat them as supporting files. Mutation authority still comes only
from the exact active allowlist.

After all authorized validators have run and before final success
classification, Codex must recompute the exact unstaged tracked path set,
tracked diff identity, nonignored untracked path set, ignored untracked path
set, and both deterministic untracked manifest SHA-256 identities. Codex must
compare all final values with the operator-declared `EXPECTED_BASE` values
unless the active envelope declares exact post-mutation expected values for an
independently mutation-authorized changed path. Any undeclared delta fails
closed. Ignored does not mean irrelevant, and validator-produced tracked,
ignored, or untracked changes cannot be silently accepted.

Required post-validator truths:

```text
POST_VALIDATOR_TRACKED_RECHECK=YES
POST_VALIDATOR_TRACKED_DIFF_SHA256_RECHECK=YES
POST_VALIDATOR_UNTRACKED_RECHECK=YES
POST_VALIDATOR_IGNORED_RECHECK=YES
POST_VALIDATOR_MANIFEST_RECHECK=YES
UNAUTHORIZED_VALIDATOR_STATE_DELTA_FAILS_CLOSED=YES
```

For branch creation from a named baseline:

```bash
git switch -c <approved-branch-name> <approved-baseline-commit>
```

Branch creation is permitted only when the lane explicitly asks for a dedicated branch or names a branch change budget.

---

## 6. Documentation-only Lane Rules

Docs-only lanes may touch only:

- `docs/**`;
- documentation evidence under `docs/design/evidence/**`;
- markdown files explicitly named by the operator.

Docs-only lanes must not touch:

- `src/**`;
- `app/**`;
- `pages/**`;
- `components/**` outside docs;
- `scripts/**`;
- `prisma/**`;
- `package.json`;
- lockfiles;
- `.env*`;
- CI/deploy configuration;
- generated build output;
- screenshots or binary assets unless explicitly authorized.

If the requested docs need evidence from runtime tests, Codex may run non-deploy validation commands only when they do not require live data mutation. If validation produces generated files or source drift, Codex must report the mutation and stop unless cleanup is explicitly authorized.

---

## 7. Stage, Commit, Push, and PR Gates

### 7.1 Stage gate

Staging requires explicit authorization. When authorized, Codex must stage exact paths only.

Forbidden staging patterns unless the operator explicitly authorizes them:

```bash
git add .
git add -A
git add --all
```

### 7.2 Commit gate

Committing requires explicit authorization and an expected subject or commit purpose. Codex must verify staged paths before committing.

Before any commit-authorized operation, Codex must reject any in-progress Git
operation that can alter commit ancestry or commit semantics. The check must
include merge, rebase, cherry-pick, revert, bisect, and equivalent operation
markers such as `MERGE_HEAD`, `rebase-merge`, `rebase-apply`,
`CHERRY_PICK_HEAD`, `REVERT_HEAD`, and `BISECT_LOG` resolved through
`git rev-parse --git-path`. Codex then records `PRE_COMMIT_HEAD` and requires
it to equal the exact expected parent baseline for the lane before committing.
This protocol grants no merge-commit authority unless an active envelope grants
it separately and explicitly.

A commit-authorized lane must also neutralize repository hooks deterministically.
The active envelope must declare one exact absolute hooks directory outside the
repository. Before commit, Codex must verify that directory exists, is a real
directory rather than a symlink, and is empty. Codex then records the authorized
index tree as `AUTHORIZED_TREE=$(git write-tree)`, commits with `core.hooksPath` set to that exact
verified-empty directory, and requires `HEAD^{tree}` to equal the recorded
authorized tree exactly. Any hook-path mismatch, nonempty hook directory, or
post-commit tree mismatch is a fail-closed blocker; the lane must not claim the
commit as successfully authorized.

Immediately after an ordinary authorized commit, Codex must require
`parent_count = 1` and `sole_parent = PRE_COMMIT_HEAD`. A commit with multiple
parents, a missing parent, or a parent different from `PRE_COMMIT_HEAD` fails
closed unless the active envelope separately and explicitly grants merge-commit
authority. Commit tree equality with `AUTHORIZED_TREE` is still required.

Required commit-ancestry truths:

```text
IN_PROGRESS_GIT_OPERATION_CHECK=YES
PRE_COMMIT_HEAD_PINNED=YES
POST_COMMIT_PARENT_COUNT_ONE=YES
POST_COMMIT_PARENT_EQUALS_PRE_COMMIT_HEAD=YES
TREE_EQUIVALENCE_STILL_REQUIRED=YES
MERGE_COMMIT_AUTHORITY=NO
```

For docs-only packaging, the expected post-commit proof is:

```bash
git log -1 --format="%H%n%P%n%s"
git diff --name-only HEAD^ HEAD
git diff --check HEAD^ HEAD
git status --short --branch
```

### 7.3 Push gate

Push requires explicit authorization. A local branch or local commit does not imply push permission.

### 7.4 PR gate

Opening or editing a pull request requires explicit authorization. A pushed branch does not imply PR permission.

### 7.5 Merge and deploy gates

Merge and deploy each require explicit authorization. A green PR does not imply merge permission, and a merge does not imply deploy permission.

---

## 8. VIONA Safety Surfaces

### 8.1 SOS / Global Lifeline

Controlled autonomous execution must preserve:

- no fake emergency dispatch;
- no fake GPS sharing;
- no hidden recording;
- no hardcoded country emergency numbers without a verified routing matrix;
- no claim that VIONA replaces local emergency services;
- deliberate confirmation for SOS actions where implemented;
- country-by-country legal and routing review before live automation.

Docs may describe future SOS plans only as planned, pilot, gated, or not implemented unless real readiness evidence exists.

### 8.2 Payments, wallet, and escrow

Controlled autonomous execution must preserve:

- no fake payment success;
- no fake wallet debit or credit;
- no supplier payout before settlement;
- no gross-revenue payout assumption;
- no checkout, booking, refund, or settlement claim without source-of-truth backing;
- no direct AI mutation of money state.

### 8.3 Tenant and identity boundaries

Codex must not create shortcuts that bypass tenant isolation, ownership checks, or identity proof. Any admin path must remain audited and explicitly authorized.

### 8.4 AI tools and autonomous actions

An AI plan may propose an action, draft text, classify intent, or prepare a bounded execution plan only when the lane says so. It must not silently mutate:

- inventory;
- bookings;
- payments;
- payouts;
- request status;
- supplier orders;
- emergency routing;
- legal or medical commitments.

---

## 9. Autonomous Execution Decision Model

Codex may proceed without asking another question only when all of these are true:

1. the operator phrase clearly names the lane;
2. the baseline matches;
3. the mutation budget is finite;
4. every edited repository file is inside the explicit exact-path allowlist;
5. no protected VIONA surface is being activated;
6. no remote or production action is implied;
7. validation commands are safe for the lane;
8. the final state can be verified.

Codex must stop and report when any of these is false.

---

## 9.1 Current VIONA Governance State

This protocol records the current VIONA governance context as preserved, not released:

- `EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE`
- `NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED`
- `ALL_VIONA_PR_MERGES_PROHIBITED`
- `MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE`
- `B1B_GOVERNANCE_FREEZE_ACTIVE`
- `NO_RETROACTIVE_AUTHORIZATION_CLAIMED`

The Codex Controlled Autonomous Execution Protocol does not release, override, weaken, or supersede these governance states.

Local autonomous execution authority does not imply remote lifecycle authority. A2 and A2C authority do not authorize push, PR creation, PR edits, merge, deploy, or freeze release.

---

## 10. Required Final Report Fields

Every controlled autonomous lane should end with:

| Field | Required content |
| --- | --- |
| Branch | Actual branch name |
| Baseline | Starting commit and current HEAD |
| Files changed | Exact file list |
| Staged | Exact staged state |
| Commit | Commit hash or `none` |
| Push | `zero` unless authorized and completed |
| PR | `zero` unless authorized and completed |
| Runtime/source | `zero` for docs-only lanes |
| Validation | Commands run and pass/fail result |
| Blockers | Any stop condition |
| Next action | Hold state or request next explicit authorization |

The report must distinguish what happened locally from what happened remotely.

---

## 11. Stop Classifications

Use these classifications when applicable:

| Classification | Meaning |
| --- | --- |
| `BLOCKED_VIONA_CODEX_BASELINE_DRIFT` | Root, branch, HEAD, staged state, tracked state, or ignored/nonignored untracked baseline identity does not match the envelope. |
| `BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED` | The required work needs files or behavior outside the allowlist. |
| `BLOCKED_VIONA_CODEX_DENYLIST_CONFLICT` | The required work touches a denied file or category. |
| `BLOCKED_VIONA_CODEX_VALIDATION_FAILURE_OUTSIDE_SCOPE` | A failure cannot be fixed inside the envelope. |
| `BLOCKED_VIONA_CODEX_NEW_DEPENDENCY_REQUIRED` | A dependency is required but not authorized. |
| `BLOCKED_VIONA_CODEX_ARCHITECTURE_DECISION_REQUIRED` | A product or architecture decision is needed. |
| `BLOCKED_VIONA_CODEX_REMOTE_AUTHORITY_REQUIRED` | Push, PR, merge, deploy, workflow, or remote write is needed but not authorized. |
| `BLOCKED_VIONA_CODEX_HIGH_RISK_BOUNDARY_REACHED` | Payment, SOS, tenant, auth, secrets, DB, production, or paid AI risk is reached. |
| `BLOCKED_VIONA_CODEX_REMEDIATION_RETRY_LIMIT_REACHED` | Retry cap is exhausted for the same failure class. |

---

## 12. This Packet's Local Boundary

This docs-only four-file candidate packet is limited to these exact paths:

1. `docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md`
2. `docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_SPEC.md`
3. `docs/design/evidence/codex-viona-controlled-autonomous-execution-protocol/README.md`
4. `AGENTS.md`

This protocol does not self-authorize staging or committing. Staging and local packaging require explicit permission in the active operator authorization envelope.
