# VIONA Codex Executor Instructions

This file is a Codex project-instruction layer for the VIONA repository.
It does not authorize implementation, staging, commits, pushes, pull requests,
merges, deployments, runtime changes, source changes, data writes, or remote
mutation by itself.

## Authority

These instructions are subordinate to:

1. `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`
2. `docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md`
3. any explicit operator authorization envelope for the active task

If these instructions conflict with `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`,
the VIONA Operating Protocol wins.

If these instructions conflict with an explicit operator envelope, follow the
stricter rule unless the envelope clearly grants the exact authority.

Full authority order for active work:

1. explicit current operator authorization
2. `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`
3. applicable canonical VIONA governance and product contracts
4. `docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md`
5. active execution envelope
6. `AGENTS.md` convenience instructions

`AGENTS.md` may never self-authorize work.
`AGENTS.md` may define how authorized work is performed. It may not define
that mutation is authorized. When authorities conflict, the higher authority
in this list wins. Missing mutation authority means DENY.

## Executor Substitution

Codex is the primary executor. Cursor may temporarily execute an authorized
lane when the operator explicitly substitutes it. Executor substitution does
not reset or expand authorization. It does not change canonical repository,
branch/HEAD requirements, file allowlist, mutation budget, remote rights,
stop conditions, or authorization provenance. Authorization belongs to the
lane and action, not to executor branding.

## Canonical Root

Treat `C:\KNG\ket-noi-eu` as the canonical repository root.
No sibling root, replacement clone, or worktree may silently replace it.

## Default Mode

Default to audit-first and default-deny.

No missing or ambiguous field may be inferred as permission. In particular,
the default state is:

- no scope expansion;
- no source edit;
- no runtime edit;
- no package or lockfile edit;
- no database, payment, tenant, auth, SOS, or protected-surface mutation;
- no staging;
- no commit;
- no push;
- no pull request;
- no merge;
- no deploy;
- no worktree;
- `AUTO_WORKTREE = false` unless explicitly authorized;
- no remote mutation.
- no branch protection mutation;
- no force push;
- no history rewrite;
- no `git reset --hard` without separate explicit authority.

## Preflight

Before any authorized mutation, verify at minimum:

```bash
Get-Location
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
```

If repository root, branch, HEAD, staged state, tracked diff, or untracked
state does not match the active authorization envelope, stop and report a
canonical `BLOCKED_VIONA_CODEX_*` classification. Do not repair the baseline
unless that repair is separately authorized.

## Scope Discipline

Modify only exact allowlisted files. Reject vague mutation authority such as
cleanup, supporting files, related files, other files, additional files, or as
needed. If another file becomes necessary, stop with:

`BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED`

Never use `git add .`, `git add -A`, or `git add --all` unless explicitly
authorized by the operator.

## Stop Contract

Use the canonical `BLOCKED_VIONA_CODEX_*` blocker namespace. Fail closed for:

- `BLOCKED_VIONA_CODEX_BASELINE_DRIFT`
- `BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED`
- `BLOCKED_VIONA_CODEX_DENYLIST_CONFLICT`
- `BLOCKED_VIONA_CODEX_VALIDATION_FAILURE_OUTSIDE_SCOPE`
- `BLOCKED_VIONA_CODEX_NEW_DEPENDENCY_REQUIRED`
- `BLOCKED_VIONA_CODEX_ARCHITECTURE_DECISION_REQUIRED`
- `BLOCKED_VIONA_CODEX_REMOTE_AUTHORITY_REQUIRED`
- `BLOCKED_VIONA_CODEX_HIGH_RISK_BOUNDARY_REACHED`
- `BLOCKED_VIONA_CODEX_REMEDIATION_RETRY_LIMIT_REACHED`

## Autonomous Execution

Every autonomous execution lane requires an explicit operator envelope.
The current VIONA default ceiling remains A2 or A2C only when explicitly
authorized. A3, A4, A5, and A6 authority is not active by default.

Local implementation authority does not imply staging, commit, push, pull
request, merge, deploy, worktree, database, payment, SOS, or remote mutation
authority.

Authority separation is strict: local commit does not imply push; push does not
imply PR creation or PR edits; PR authority does not imply merge; merge does
not imply deploy. Each authority requires separate explicit approval.
Compact form: local commit != push; push != PR; PR != merge; merge != deploy.

Canonical autonomy levels:

- A0 - READ / AUDIT
- A1 - DOCS / PLANNING
- A2 - LOCAL IMPLEMENTATION + TESTS
- A2C - LOCAL IMPLEMENTATION + TESTS + ONE LOCAL COMMIT
- A3 - CONTROLLED PUSH / PR PREPARATION
- A4 - CONTROLLED PR LIFECYCLE
- A5 - CONTROLLED DEPLOYMENT
- A6 - MULTI-AGENT CONTINUOUS ENGINEERING

`AGENTS.md` does not authorize any level by itself.

## Validation And Remediation

Use targeted tests before broad validation where appropriate. Preferred
sequence:

1. implement inside the authorized envelope;
2. run the targeted test;
3. classify any failure;
4. remediate only if still inside the envelope;
5. rerun the targeted test;
6. run broader or full validators after the targeted path is green.

Do not repeatedly run expensive full-CI loops before understanding a focused
failure.

Self-remediation must be bounded and only inside the current envelope. It is
allowed only when:

- the file is already in the create or modify allowlist;
- behavior remains inside the authorized contract;
- no denylisted path is required;
- no new dependency is required;
- no architecture decision changes;
- no DB, auth, payment, SOS, external paid AI, or external API boundary changes;
- no remote authority expansion occurs.

Use the envelope retry limit; if omitted, follow the controlled-autonomy
protocol default of 3 remediation cycles per failure class. Stop with
`BLOCKED_VIONA_CODEX_REMEDIATION_RETRY_LIMIT_REACHED` when the remediation
retry limit is reached. No infinite retry loop is allowed.

Priority:

1. CORRECTNESS FIRST
2. MINIMUM NECESSARY COMPUTE

## Remote / Mobile Operator

The VIONA operator may be remote or using a mobile device while Codex runs
locally; this covers a remote operator and a mobile operator without weakening
VIONA governance. Remote/mobile operation does not bypass or relax governance.
Codex may continue only routine steps already inside the active envelope.
Pause or stop and request authority for scope expansion, new authority, a
high-risk boundary, or explicit operator approval. Use canonical stops where
applicable: extra file needed means
`BLOCKED_VIONA_CODEX_SCOPE_EXPANSION_REQUIRED`; remote action required without
authority means `BLOCKED_VIONA_CODEX_REMOTE_AUTHORITY_REQUIRED`; high-risk
boundary reached means `BLOCKED_VIONA_CODEX_HIGH_RISK_BOUNDARY_REACHED`.

## Protected Surfaces

Preserve the VIONA Operating Protocol guardrails for:

- SOS / Global Lifeline;
- payments, wallet, escrow, payouts, and settlement;
- tenant isolation and identity;
- AI actions and cost controls;
- B2B Wholesale / E-shop Import;
- secrets and branch protection;
- production claims and readiness labels.

Preserve `NO_FUNCTION_REMOVAL`.

Do not fake live emergency, payment, booking, merchant, supplier, AI, or
production outcomes. Use honest states such as Lite, Demo, Pilot, Beta,
Coming Soon, Gated, Frozen, planned, or not implemented when capability is
not production-ready.

## Governance Freeze

Preserve current governance state unless a separate founder/operator-approved
governance release packet says otherwise:

- `EMERGENCY_VIONA_PR_LIFECYCLE_CONTAINMENT_ACTIVE`
- `NEW_ORDINARY_VIONA_PR_CREATION_SUSPENDED`
- `ALL_VIONA_PR_MERGES_PROHIBITED`
- `MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE`
- `B1B_GOVERNANCE_FREEZE_ACTIVE`
- `NO_RETROACTIVE_AUTHORIZATION_CLAIMED`

This file does not release, override, weaken, or supersede those states.

## Evidence

For every governed lane, report:

- baseline;
- authorization provenance;
- files created or modified;
- denylisted files not touched;
- validators run and results;
- remediation performed;
- scope expansions requested;
- Git state;
- runtime effect;
- remote effect;
- rollback state;
- final classification.

Do not claim success without evidence.
