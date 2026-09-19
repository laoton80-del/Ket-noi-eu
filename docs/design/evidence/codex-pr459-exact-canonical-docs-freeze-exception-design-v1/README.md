# PR #459 content-bound one-shot freeze exception design evidence

```text
PACK_ID=VIONA.GOVERNANCE.PR459.CONTENT_BOUND_ONE_SHOT_FREEZE_EXCEPTION.RECONCILIATION_DESIGN.V1
AUTHORIZATION_PROVENANCE=APPROVE_VIONA_PR459_CONTENT_BOUND_ONE_SHOT_EXCEPTION_RECONCILIATION_DESIGN_DOCS_ONLY
FOUNDER_GOVERNANCE_DECISION=SELECT_CONTENT_BOUND_POST_GATE_REMEDIATION_CONTINUATION_MODEL
STATUS=DESIGN_ONLY_NOT_IMPLEMENTED
RECONCILED_UTC=2026-09-14T04:59:44.103Z
```

## Result

```text
PREVIOUS_CLASSIFICATION=BLOCKED_NO_SAFE_NARROW_PR459_FREEZE_EXCEPTION_ARCHITECTURE
PREVIOUS_ROOT_CAUSE=FIXED_HEAD_BINDING_BECOMES_INVALID_AFTER_GATE_REMEDIATION_ADVANCES_MASTER
CLASSIFICATION=READY_FOR_PR459_CONTENT_BOUND_ONE_SHOT_EXCEPTION_IMPLEMENTATION_AUTHORITY
NON_CIRCULAR=YES
GLOBAL_FREEZE_RELEASED=NO
GLOBAL_FREEZE_REMAINS_ACTIVE=YES
```

The reconciled design makes the immutable Founder exception identity the exact
seven-file PR #459 payload, not the old head SHA. The old head remains the
required first parent of one separately authorized, non-force merge of the
post-remediation master into the PR branch. The gate later binds dynamically to
the resulting exact head, verifies current-master ancestry and ordered parent
topology, recomputes all payload identities, and requires a fresh exact-head
approval before dispatch.

## Verified payload

All seven expected SHA-256 identities matched the Git snapshot at the live PR
head `a6aeff6c0a521d422d4cf28e07ec218d1d371a02`.

```text
PAYLOAD_FILE_COUNT=7
PAYLOAD_HASH_MISMATCHES=0
PR459_CANONICAL_PAYLOAD_DIGEST=6a7e59d1b2948f16999bff53e4f855d93f6931df53a220a5fb374044328f9944
CANONICAL_REVIEWED_SCOPE_DIGEST=5d242aeae7ad51dbf782dd7a38a2d94f314d1ce5410106dfb9c03aebc9802713
SUPPLIED_INITIAL_REVIEWED_SCOPE_DIGEST=2269d5781405b1362efa760a0acc4a54b69048819c10236c2ddf9b0fe2602a32
SUPPLIED_INITIAL_SCOPE_DIGEST_ACCEPTED=NO
```

Both accepted digests were recomputed with the canonical gate's case-sensitive
JavaScript path comparator and UTF-8/LF serialization. The supplied initial
scope digest used culture-aware, case-insensitive ordering, so it is retained
only as rejected provenance and must not be dispatched to the gate.

| Path | SHA-256 |
|---|---|
| `docs/ai-context/VIONA_CODEX_CANONICAL_ENTRYPOINT.md` | `9ab7705adc748722432ba99f2cc9d51577dee6ec1e55a9ad73286518a110f843` |
| `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` | `a90c443e775bd82ca58f2b225957af9f21ffb787314fb7ce1fde48358c789d16` |
| `docs/ai-context/archive/VIONA_OPERATING_PROTOCOL_V1.md` | `9cfe4452f974a287e74e4bff5c987e8614178b501c2b7be05aca73e51dd4f657` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/README.md` | `3d971bca8d7b26bfe4858349fdd1142ef45f8cb656215041046470f0b2aad172` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/RECONCILIATION_MATRIX.md` | `c1c18c76bb6c19724b52ec0d059760fb81879ceb80f190ac2257653809150e05` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/evidence-manifest.sha256` | `0da50a50fd9aef6b66700e72369293654212bff82644cb30e0bff2b6f38e9f9d` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/promotion-record.json` | `31c6b3d53a6acd9c7e773aeeb5214e37fe99d5267ecab84644ef6874cb8d3408` |

## Current governance and PR inputs

| Input | Verified value |
|---|---|
| Remote master | `e9d90923955958ec92d352d59791ae42578f5cc8` |
| PR state | `OPEN` |
| PR number | `459` |
| PR head branch | `docs/viona-operating-protocol-v2-canonical-promotion` |
| Pre-remediation reference head | `a6aeff6c0a521d422d4cf28e07ec218d1d371a02` |
| Base | `master` |
| Changed files | `7` exact canonical/evidence paths |
| Exact-head approved review | absent |
| Global freeze | active |
| Existing exception | `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` |
| Master required check | `Viona Merge Authorization Gate` |
| Master strict status checks | enabled |
| Master force pushes | disabled |

Governance was read from current `origin/master`, including `AGENTS.md`, the
Operating Protocol, the Codex Controlled Autonomous Execution Protocol, the
autonomous execution envelope, the gate workflow/script, and current freeze and
T3/T3D plans/evidence. PR facts were read live without mutation.

## Circularity resolution

```text
DURABLE_EXCEPTION_BINDS_TO_OLD_HEAD=NO
PRE_REMEDIATION_REFERENCE_HEAD=a6aeff6c0a521d422d4cf28e07ec218d1d371a02
POST_SYNC_HEAD=UNKNOWN_UNTIL_SEPARATELY_AUTHORIZED_SYNC
RUNTIME_CURRENT_HEAD_BINDING=REQUIRED_AT_DISPATCH
CURRENT_MASTER_ANCESTRY_REQUIRED=YES
OLD_HEAD_APPROVAL_REUSABLE_AFTER_SYNC=NO
FRESH_POST_SYNC_EXACT_HEAD_APPROVAL_REQUIRED=YES
```

The post-sync head must be one merge commit with exactly two ordered parents:
the old PR head first and the separately pinned post-remediation master second.
The second parent must still equal current master at gate time. This allows the
gate implementation to become canonical first, then permits one non-force sync
without predicting its new commit SHA.

## Artifact identities

| State | Path | SHA-256 | Lines |
|---|---|---|---:|
| Original reconciliation output | `docs/product/VIONA_PR459_EXACT_CANONICAL_DOCS_FREEZE_EXCEPTION_DESIGN.md` | `0a69a8a7e83ffdfabf7e27fb9727346a76f678340c2018afbe9d7ed4a23dabd1` | 569 |
| Current latest-effective-review-state-remediated local design | `docs/product/VIONA_PR459_EXACT_CANONICAL_DOCS_FREEZE_EXCEPTION_DESIGN.md` | `b4de769e484f7d177cd704ea15fb3dcb1b395b3530224e2274c50d723b04cd31` | 637 |

The design includes exact identity and digest algorithms, transition topology,
runtime ancestry and byte-verification predicates, reviewer requirements,
non-reusability proof, future implementation allowlist, preservation rules, and
a complete positive/negative test matrix.

## Mutation boundary

During the original reconciliation design pack, only the two previously created
local uncommitted packet files were modified:

1. `docs/product/VIONA_PR459_EXACT_CANONICAL_DOCS_FREEZE_EXCEPTION_DESIGN.md`
2. `docs/design/evidence/codex-pr459-exact-canonical-docs-freeze-exception-design-v1/README.md`

No additional file was created. No workflow, gate script, test, product source,
runtime, configuration, database, permission, branch-protection, PR, review,
check, merge, or deployment state was changed. No staging, commit, push, or PR
creation occurred.

## Local implementation-review reconciliation

The later local adversarial review found five implementation-level false-green
paths that the original design summary did not state precisely enough. The
design now makes these controls explicit:

- exact-head approval is insufficient until the non-author reviewer's
  repository permission is independently proven as `push`, `maintain`, or
  `admin`;
- canonical protection proof includes strict checks, administrator enforcement,
  required reviews with code-owner review disabled, conversation resolution,
  `restrictions=null`, and explicit force-push/deletion disablement;
- review-thread pagination and every `isResolved` value use strict schemas and
  fail on incomplete, cyclic, or malformed results;
- a final authorization snapshot re-reads every mutable authorization fact;
- the final remote read rejects any late duplicate and proves the sole gate
  check belongs to the current positive-integer check ID and app.

The PR #460 P1 review added one further exact-head rule. A gate must not select
an older approval after the same reviewer later requests changes on that head.
Each initial, Snapshot B, and final review read therefore reduces the complete
exact-head timeline to the latest decision per reviewer before checking
repository permission. Later `CHANGES_REQUESTED` or dismissal invalidates an
approval; a later `APPROVED` may restore eligibility. `COMMENTED` and `PENDING`
are non-decision states and do not replace the latest decision. Invalid review
identity or chronology fails closed, and stable positive review IDs break equal
timestamp ties deterministically.

This addendum records the reconciled design contract. It is local documentation,
not live GitHub proof, dispatch authority, merge authority, or a claim that an
eligible reviewer currently exists.
