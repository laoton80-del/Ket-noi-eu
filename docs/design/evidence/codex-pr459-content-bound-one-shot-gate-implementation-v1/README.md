# PR #459 content-bound one-shot gate implementation evidence

```text
PACK_ID=VIONA.GOVERNANCE.PR459.CONTENT_BOUND_ONE_SHOT_FREEZE_EXCEPTION.GATE_IMPLEMENTATION.FALSE_GREEN_REMEDIATION.V1
AUTHORIZATION_PROVENANCE=APPROVE_VIONA_PR459_GATE_LOCAL_FALSE_GREEN_REMEDIATION_V1
ORIGINAL_IMPLEMENTATION_PACK=VIONA.GOVERNANCE.PR459.CONTENT_BOUND_ONE_SHOT_FREEZE_EXCEPTION.GATE_IMPLEMENTATION.V1
FOUNDER_GOVERNANCE_DECISION=SELECT_CONTENT_BOUND_POST_GATE_REMEDIATION_CONTINUATION_MODEL
STATUS=LOCAL_FALSE_GREEN_REMEDIATION_OFFLINE_VERIFIED_NOT_STAGED
NOT_MERGE_AUTHORIZATION=YES
GLOBAL_FREEZE_RELEASED=NO
REMOTE_EFFECTS=NONE
RUNTIME_EFFECTS=NONE
```

## Baseline

| Field | Verified value |
|---|---|
| Canonical root | `C:\KNG\ket-noi-eu` |
| Base ref | `origin/master` |
| Base SHA / local HEAD | `e9d90923955958ec92d352d59791ae42578f5cc8` |
| Base tree | `c8a30b926010cc5ae4fa53df49837385ccc490ec` |
| Local branch | `fix/viona-pr459-content-bound-one-shot-freeze-exception-gate` |
| Staged paths | `0` |
| Commits created | `0` |

The original implementation pack began with only the two Founder-approved
untracked design packet files. They remained unchanged during that original
implementation pass. This false-green remediation intentionally updates both
design records, so the table below is historical evidence for the original
implementation pass rather than a claim about current bytes:

| Design artifact | Pre SHA-256 | Post SHA-256 |
|---|---|---|
| `docs/product/VIONA_PR459_EXACT_CANONICAL_DOCS_FREEZE_EXCEPTION_DESIGN.md` | `0a69a8a7e83ffdfabf7e27fb9727346a76f678340c2018afbe9d7ed4a23dabd1` | `0a69a8a7e83ffdfabf7e27fb9727346a76f678340c2018afbe9d7ed4a23dabd1` |
| `docs/design/evidence/codex-pr459-exact-canonical-docs-freeze-exception-design-v1/README.md` | `8b42bf9ef286dd2bb610bc006bb0978c63b769a2335cc40ee20c542cefe72ce3` | `8b42bf9ef286dd2bb610bc006bb0978c63b769a2335cc40ee20c542cefe72ce3` |

## Mutation boundary

The complete local implementation still has exactly three tracked implementation
files modified from base:

1. `.github/workflows/viona-merge-authorization-gate.yml`
2. `scripts/viona-merge-authorization-gate.mjs`
3. `scripts/test-viona-merge-authorization-gate.mjs`

During this remediation, the gate script, gate tests, this README, and both
design/evidence documents were corrected. The workflow's already-authorized
one-line token delta was preserved without further remediation change. The
guarded-merge implementation, package metadata, AGENTS instructions, product
and runtime source, branch protection, permissions, and PR #459 were not
modified.

Current remediation outputs, hashed after the final source/test edits:

| Path | Current SHA-256 |
|---|---|
| `.github/workflows/viona-merge-authorization-gate.yml` | `a8f48beef9161146b12c9ddb55b81327de64ee81d362d1276f286a6ed10bb02c` |
| `scripts/viona-merge-authorization-gate.mjs` | `1bae4c1b1d2a8afc87efc2b02fbeb7ca016967707e212bdcb9c9516fe73a8105` |
| `scripts/test-viona-merge-authorization-gate.mjs` | `0fcb178e62bfbeb5d7438816bb513836b661dcb554ed6431c3b3d6e7ea81bed1` |
| `docs/product/VIONA_PR459_EXACT_CANONICAL_DOCS_FREEZE_EXCEPTION_DESIGN.md` | `def33564f377697563c5aa65aa1a17f2af61fd9b05df659bb70a10dce059c0f9` |
| `docs/design/evidence/codex-pr459-exact-canonical-docs-freeze-exception-design-v1/README.md` | `977fe925b9e4b72c21ea06dc4b32f2cd68cf2b4019617af6a6119fb3e4b13f05` |

## Implemented immutable policy

The workflow now offers exactly the existing remediation exception and this
second typed exception:

```text
FREEZE_EXCEPTION_FOR_PR459_OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION_ONLY
```

The gate compiles the PR-specific identity into internal constants:

```text
PR_NUMBER=459
HEAD_BRANCH=docs/viona-operating-protocol-v2-canonical-promotion
BASE_BRANCH=master
MERGE_MODE=squash
PURPOSE=OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION
PINNED_PAYLOAD_FILE_COUNT=7
PR459_CANONICAL_PAYLOAD_DIGEST=6a7e59d1b2948f16999bff53e4f855d93f6931df53a220a5fb374044328f9944
CANONICAL_REVIEWED_SCOPE_DIGEST=5d242aeae7ad51dbf782dd7a38a2d94f314d1ce5410106dfb9c03aebc9802713
PRE_REMEDIATION_REFERENCE_HEAD=a6aeff6c0a521d422d4cf28e07ec218d1d371a02
DURABLE_EXCEPTION_BINDS_RUNTIME_TO_OLD_HEAD=NO
RUNTIME_CURRENT_HEAD_BINDING_REQUIRED=YES
```

The pre-remediation head is used only as the required first parent of the one
permitted transition merge. The live gate head remains dynamic and must equal
the workflow input, both live PR snapshots, the exact approved-review head, and
the content-bearing commit checked by the gate.

### Pinned payload

| Status | Path | SHA-256 over raw Git snapshot bytes |
|---|---|---|
| `added` | `docs/ai-context/VIONA_CODEX_CANONICAL_ENTRYPOINT.md` | `9ab7705adc748722432ba99f2cc9d51577dee6ec1e55a9ad73286518a110f843` |
| `modified` | `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` | `a90c443e775bd82ca58f2b225957af9f21ffb787314fb7ce1fde48358c789d16` |
| `added` | `docs/ai-context/archive/VIONA_OPERATING_PROTOCOL_V1.md` | `9cfe4452f974a287e74e4bff5c987e8614178b501c2b7be05aca73e51dd4f657` |
| `added` | `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/README.md` | `3d971bca8d7b26bfe4858349fdd1142ef45f8cb656215041046470f0b2aad172` |
| `added` | `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/RECONCILIATION_MATRIX.md` | `c1c18c76bb6c19724b52ec0d059760fb81879ceb80f190ac2257653809150e05` |
| `added` | `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/evidence-manifest.sha256` | `0da50a50fd9aef6b66700e72369293654212bff82644cb30e0bff2b6f38e9f9d` |
| `added` | `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/promotion-record.json` | `31c6b3d53a6acd9c7e773aeeb5214e37fe99d5267ecab84644ef6874cb8d3408` |

An independent local read of these seven Git blobs at the pre-remediation
reference head matched every pinned SHA-256. Runtime acceptance does not trust
that local verification: it re-reads and hashes every file from the exact live
head through GitHub read APIs.

## Gate behavior after false-green remediation

The read-only adversarial review found five confirmed false-green paths in the
first local implementation. This local remediation accepts those findings and
changes the PR459 path as follows:

- each exact-head, pre-dispatch, non-author approval candidate is checked through
  the repository collaborator-permission API; only `push`, `maintain`, or
  `admin` is eligible, while missing, malformed, unknown, unauthorized, or
  unreadable permission proof is fail-closed;
- the master-protection response must prove strict required checks,
  `enforce_admins.enabled=true`, the exact gate context/app, required reviews,
  stale-review dismissal, `require_code_owner_reviews=false`, conversation
  resolution, `restrictions=null`, and explicit force-push and deletion
  disablement;
- review-thread pagination validates every page, cursor, and node, rejects
  partial GraphQL errors and page-limit exhaustion, and accepts only a boolean
  `isResolved` value;
- Snapshot B repeats exact-head review and repository-permission proof;
- a final authorization snapshot re-reads PR/auto-merge state, reviews and
  reviewer permission, complete threads, current master and topology,
  protection, non-gate checks, exact scope, and raw payload bytes;
- the final remote read enumerates all check runs with `filter=all`, validates
  the API `total_count`, and requires exactly one same-head canonical gate check
  whose ID, app, and in-progress state belong to this attempt.

The immutable seven-path/hash payload, dynamic live-head binding, ordered
two-parent transition, current-master ancestry, canonical digests, and the two
exact freeze tokens remain unchanged. The existing
`FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` fixture retains its
previous successful behavior and performs no PR459 payload reads.

## Evidence truth and review boundary

```text
PREVIOUS_ADVERSARIAL_REVIEW_CLASSIFICATION=BLOCKED_VIONA_CODEX_VALIDATION_FAILURE_OUTSIDE_SCOPE
PREVIOUS_FALSE_GREEN_PATHS_CONFIRMED=5
LOCAL_REMEDIATION_LOGIC_STATUS=OFFLINE_LOGIC_VERIFIED
SECURITY_REVIEW_RESULT=OFFLINE_ADVERSARIAL_REMEDIATION_TESTS_PASS
FALSE_GREEN_PATHS_FOUND=0_IN_CURRENT_OFFLINE_ADVERSARIAL_MATRIX
ELIGIBLE_NON_AUTHOR_APPROVAL_PROVEN=LOGIC_ONLY_LIVE_REVIEWER_ELIGIBILITY_NOT_PROVEN
COMPLETE_CONVERSATION_PAGINATION_PROVEN=OFFLINE_LOGIC_AND_FIXTURES_ONLY
PROTECTION_AND_DUPLICATE_CONTEXT_PRESERVATION_PROVEN=OFFLINE_LOGIC_AND_FIXTURES_ONLY
LIVE_PROTECTION_STATE=NOT_PROVEN_IN_THIS_PACK
LIVE_PR459_MERGE_READINESS=NOT_EVALUATED_NOT_CLAIMED
GENERIC_FREEZE_EXCEPTION_CREATED=NO
CURRENT_REMEDIATION_EXCEPTION_REGRESSION=NO_OFFLINE_FIXTURE_REGRESSION
GLOBAL_FREEZE_PRESERVED=YES
```

The payload digest still uses ordinal Unicode code-point path order, UTF-8,
`path<TAB>sha256` records, LF joins, and lowercase SHA-256. No content or line
ending normalization occurs. The new adversarial fixtures cover permission
classes and API uncertainty, complete protection shape, malformed and cyclic
thread pagination, strict thread-node types, late duplicate checks, and every
specified green-to-red mutable-state transition.

## Offline validation

| Validation | Result |
|---|---|
| Gate syntax (`node --check`) | PASS |
| Gate-test syntax (`node --check`) | PASS |
| Pre-remediation gate suite retained | 121 PASS, 0 FAIL |
| New false-green remediation scenarios | 79 PASS, 0 FAIL |
| Complete gate suite | 200 PASS, 0 FAIL |
| Guarded-merge regression suite | 26 PASS, 0 FAIL |
| Full merge-governance suite | 226 PASS, 0 FAIL |
| Unexpected network calls from offline fixtures | 0 |

Final whitespace and workflow-static validation are recorded by the active
remediation pack after the evidence text itself is final.

## Side effects and proof limits

```text
STAGED_FILES=0
COMMITS_CREATED=0
PUSHES=0
PRS_CREATED=0
REVIEWS_SUBMITTED=0
WORKFLOW_DISPATCHES=0
CHECK_RUNS_CREATED=0
MERGES=0
DEPLOYS=0
PR459_MUTATIONS=0
```

Validation used local source inspection and deterministic mocks/fixtures only.
It did not prove a live eligible reviewer, query live branch protection during
the tests, dispatch the workflow, create a check, alter PR #459, or prove a
future post-sync head. Publication of this gate change, later synchronization,
fresh exact-head approval, live gate dispatch, and merge each require separate
authority and live revalidation.
