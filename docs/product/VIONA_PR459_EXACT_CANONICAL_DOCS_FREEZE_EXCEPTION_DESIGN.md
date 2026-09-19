# VIONA PR #459 Content-Bound One-Shot Freeze Exception Design

```text
PACK_ID=VIONA.GOVERNANCE.PR459.CONTENT_BOUND_ONE_SHOT_FREEZE_EXCEPTION.RECONCILIATION_DESIGN.V1
AUTHORIZATION_PROVENANCE=APPROVE_VIONA_PR459_CONTENT_BOUND_ONE_SHOT_EXCEPTION_RECONCILIATION_DESIGN_DOCS_ONLY
FOUNDER_GOVERNANCE_DECISION=SELECT_CONTENT_BOUND_POST_GATE_REMEDIATION_CONTINUATION_MODEL
STATUS=DESIGN_ONLY_NOT_IMPLEMENTED
GLOBAL_FREEZE_RELEASE_AUTHORIZED=NO
GATE_IMPLEMENTATION_AUTHORIZED=NO
PR459_BRANCH_SYNC_AUTHORIZED=NO
REVIEW_SUBMISSION_AUTHORIZED=NO
GATE_DISPATCH_AUTHORIZED=NO
MERGE_AUTHORIZED=NO
DEPLOY_AUTHORIZED=NO
```

## 1. Reconciliation decision

The earlier fixed-head design correctly stopped because canonicalizing a new
gate exception advances master, while strict protection then requires PR #459
to synchronize and acquire a new head. This revision accepts that blocker and
replaces the old durable head binding with a content-bound continuation model.

```text
PREVIOUS_CLASSIFICATION=BLOCKED_NO_SAFE_NARROW_PR459_FREEZE_EXCEPTION_ARCHITECTURE
PREVIOUS_ROOT_CAUSE=FIXED_HEAD_BINDING_BECOMES_INVALID_AFTER_GATE_REMEDIATION_ADVANCES_MASTER
NEW_CLASSIFICATION=READY_FOR_PR459_CONTENT_BOUND_ONE_SHOT_EXCEPTION_IMPLEMENTATION_AUTHORITY
NON_CIRCULAR=YES
```

The Founder-authorized immutable object is the exact seven-file canonical
payload and its PR/purpose/branch/base/mode identity. The post-synchronization
head is unknown until a separately authorized merge of current master into the
PR branch. At a future gate dispatch, that new head must be bound exactly and
must have its own eligible non-author approval.

This document designs that mechanism. It grants none of the future actions.

## 2. Verified current state

| Field | Value |
|---|---|
| Canonical repository | `laoton80-del/Ket-noi-eu` |
| Current `origin/master` | `e9d90923955958ec92d352d59791ae42578f5cc8` |
| PR | `459` |
| PR state | `OPEN` |
| PR head branch | `docs/viona-operating-protocol-v2-canonical-promotion` |
| Pre-remediation reference head | `a6aeff6c0a521d422d4cf28e07ec218d1d371a02` |
| PR base | `master` |
| Merge mode | `squash` |
| Purpose | `OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION` |
| Changed-file count | `7` |
| Canonical gate reviewed-scope digest | `5d242aeae7ad51dbf782dd7a38a2d94f314d1ce5410106dfb9c03aebc9802713` |
| Supplied initial scope digest | `2269d5781405b1362efa760a0acc4a54b69048819c10236c2ddf9b0fe2602a32` (rejected: noncanonical sort order) |
| Exact-head approved review | absent at audit time |
| Global freeze | active |
| Existing remediation exception | `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` |
| Required gate context | `Viona Merge Authorization Gate` |
| Required-status-check strictness | `strict=true` |
| Force pushes | disabled |

Current freeze evidence remains explicit in `AGENTS.md`, section 9.1 of the
Codex Controlled Autonomous Execution Protocol, section 17.1 of the autonomous
execution envelope specification, and current T3/T3D plans and evidence. No
effective freeze-release packet was found.

## 3. Freeze invariants

```text
GLOBAL_FREEZE_STATE=ACTIVE
GLOBAL_FREEZE_RELEASED=NO
GLOBAL_FREEZE_REMAINS_ACTIVE=YES
CURRENT_REMEDIATION_EXCEPTION=FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY
CURRENT_REMEDIATION_EXCEPTION_BEHAVIOR_CHANGED=NO
```

The new PR-specific profile coexists with the existing remediation profile. It
does not create a docs category, general non-runtime category, or reusable
ordinary-PR exception.

## 4. Content-bound exception identity

The proposed token is:

```text
FREEZE_EXCEPTION_FOR_PR459_OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION_ONLY
```

The token selects an immutable compiled policy profile. It is not authority by
itself and is never accepted as caller free text outside the typed workflow
choice.

### 4.1 Durable Founder exception identity

```text
REPOSITORY=laoton80-del/Ket-noi-eu
PR_NUMBER=459
PURPOSE=OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION
HEAD_BRANCH=docs/viona-operating-protocol-v2-canonical-promotion
BASE_BRANCH=master
MERGE_MODE=squash
EXACT_CHANGED_FILE_COUNT=7
EXACT_CHANGED_PATH_SET=PINNED
EXACT_CHANGED_FILE_RECORD_SET=PINNED
EXACT_FINAL_PAYLOAD_HASHES=PINNED
PR459_CANONICAL_PAYLOAD_DIGEST=6a7e59d1b2948f16999bff53e4f855d93f6931df53a220a5fb374044328f9944
CANONICAL_REVIEWED_SCOPE_DIGEST=5d242aeae7ad51dbf782dd7a38a2d94f314d1ce5410106dfb9c03aebc9802713
SUPPLIED_INITIAL_REVIEWED_SCOPE_DIGEST=2269d5781405b1362efa760a0acc4a54b69048819c10236c2ddf9b0fe2602a32
SUPPLIED_INITIAL_SCOPE_DIGEST_ACCEPTED=NO
```

The durable identity does **not** require the runtime PR head to equal the old
head. The old value is retained only as the transition origin:

```text
PRE_REMEDIATION_REFERENCE_HEAD=a6aeff6c0a521d422d4cf28e07ec218d1d371a02
DURABLE_EXCEPTION_BINDS_RUNTIME_TO_OLD_HEAD=NO
POST_SYNC_HEAD=UNKNOWN_UNTIL_AUTHORIZED_MASTER_SYNC
RUNTIME_CURRENT_HEAD_BINDING=REQUIRED_AT_DISPATCH
```

### 4.2 Exact payload identities

All hashes are SHA-256 over the Git snapshot bytes at the live PR head.

| Path | SHA-256 |
|---|---|
| `docs/ai-context/VIONA_CODEX_CANONICAL_ENTRYPOINT.md` | `9ab7705adc748722432ba99f2cc9d51577dee6ec1e55a9ad73286518a110f843` |
| `docs/ai-context/VIONA_OPERATING_PROTOCOL.md` | `a90c443e775bd82ca58f2b225957af9f21ffb787314fb7ce1fde48358c789d16` |
| `docs/ai-context/archive/VIONA_OPERATING_PROTOCOL_V1.md` | `9cfe4452f974a287e74e4bff5c987e8614178b501c2b7be05aca73e51dd4f657` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/README.md` | `3d971bca8d7b26bfe4858349fdd1142ef45f8cb656215041046470f0b2aad172` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/RECONCILIATION_MATRIX.md` | `c1c18c76bb6c19724b52ec0d059760fb81879ceb80f190ac2257653809150e05` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/evidence-manifest.sha256` | `0da50a50fd9aef6b66700e72369293654212bff82644cb30e0bff2b6f38e9f9d` |
| `docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/promotion-record.json` | `31c6b3d53a6acd9c7e773aeeb5214e37fe99d5267ecab84644ef6874cb8d3408` |

### 4.3 Canonical payload digest

For each exact target file, construct:

```text
<path><TAB><sha256>
```

Sort records by path with the canonical gate's case-sensitive JavaScript string
comparator, join them with LF and no trailing LF, encode as UTF-8, then compute
SHA-256 lowercase hexadecimal. Culture-aware or case-insensitive sorting is not
equivalent and must fail verification.

```text
PR459_CANONICAL_PAYLOAD_DIGEST=6a7e59d1b2948f16999bff53e4f855d93f6931df53a220a5fb374044328f9944
```

This digest is separate from the reviewed-scope digest. The payload digest
binds bytes; the scope digest binds statuses, paths, and previous filenames.
Both are mandatory.

### 4.4 Exact scope records

```text
added<TAB>docs/ai-context/VIONA_CODEX_CANONICAL_ENTRYPOINT.md<TAB><EMPTY>
modified<TAB>docs/ai-context/VIONA_OPERATING_PROTOCOL.md<TAB><EMPTY>
added<TAB>docs/ai-context/archive/VIONA_OPERATING_PROTOCOL_V1.md<TAB><EMPTY>
added<TAB>docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/README.md<TAB><EMPTY>
added<TAB>docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/RECONCILIATION_MATRIX.md<TAB><EMPTY>
added<TAB>docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/evidence-manifest.sha256<TAB><EMPTY>
added<TAB>docs/design/evidence/codex-viona-operating-protocol-v2-reconcile-and-promote-v1/promotion-record.json<TAB><EMPTY>
```

`<TAB>` denotes one U+0009 separator. `<EMPTY>` denotes the zero-byte
`previous_filename` value and is omitted after the second separator when the
digest input is serialized.

Using the canonical gate's exported `computeReviewedScopeDigest` function, the
records above produce:

```text
CANONICAL_REVIEWED_SCOPE_DIGEST=5d242aeae7ad51dbf782dd7a38a2d94f314d1ce5410106dfb9c03aebc9802713
```

The pack-supplied value
`2269d5781405b1362efa760a0acc4a54b69048819c10236c2ddf9b0fe2602a32`
was produced with culture-aware, case-insensitive ordering and does not match
the canonical gate. It is retained only as rejected provenance and cannot be a
dispatch value. The future live digest must be recomputed from the live records
and equal both the caller-supplied dispatch value and the pinned canonical value
above. A missing, extra, renamed, differently classified, or differently sorted
record fails closed.

## 5. Two distinct head concepts

### 5.1 Founder exception identity

The durable identity consists of the PR number, repository, purpose, head
branch, base name, merge mode, exact path and record sets, seven payload hashes,
and canonical payload digest. It authorizes no unknown bytes.

### 5.2 Runtime gate head identity

At dispatch, the gate must bind to the current live PR #459 head. That head:

- is supplied as the existing full `head_sha` input;
- equals the live PR head in Snapshot A and Snapshot B;
- is the exact commit reviewed by an eligible non-author reviewer;
- contains current master through the single permitted synchronization;
- has the exact transition topology in section 6;
- produces the exact path set, record set, scope digest, seven content hashes,
  and payload digest;
- remains unchanged through successful gate completion and merge preflight.

No approval on the pre-remediation head can satisfy the post-sync review gate.

## 6. Only permitted head transition

The only permitted transition is one ordinary merge of an independently pinned
post-remediation master commit into the unchanged PR branch.

### 6.1 Pre-sync requirements

Separate future synchronization authority must pin all of:

- repository and PR #459;
- branch `docs/viona-operating-protocol-v2-canonical-promotion`;
- expected old branch head
  `a6aeff6c0a521d422d4cf28e07ec218d1d371a02`;
- exact post-remediation master SHA established by implementation postchecks;
- merge-only synchronization, with no rebase, amend, reset, or force push;
- exact seven-file payload hashes and canonical payload digest;
- stop on any conflict or unexpected path.

If master advances after that authority is issued, synchronization stops for a
new decision. The authority must not silently adopt a newer master.

### 6.2 Preferred synchronization mechanism

```text
PREFERRED_SYNC_MECHANISM=ORDINARY_NON_FORCE_MERGE_OF_PINNED_CURRENT_MASTER_INTO_PR459_BRANCH
FORCE_PUSH_REQUIRED=NO
```

The merge must start from the exact pre-remediation reference head. Any conflict
that touches one of the seven target paths stops without automatic resolution.
After the merge, recompute the complete PR file list and all payload identities
before any push. A separately authorized ordinary push may advance only the
declared PR branch from the exact old head to the verified merge commit.

### 6.3 Transition topology proof

The post-sync head must be exactly one merge commit with exactly two ordered
parents:

```text
parent[0]=a6aeff6c0a521d422d4cf28e07ec218d1d371a02
parent[1]=PINNED_POST_REMEDIATION_MASTER_SHA
```

At gate time, `parent[1]` must equal current master. The head tree may differ
from current master only by the seven exact PR payload records. This proves the
new head arose from the one permitted continuation rather than arbitrary extra
commits.

A later ordinary merge would have a different first parent and fail. Producing
an alternate transition from the old head after the first push would require a
non-fast-forward update, while force pushes remain disabled and unauthorized.

## 7. Current-master ancestry proof

The future gate must compare exact commit SHAs through a read-only GitHub
ancestry/compare query and require all of:

```text
CURRENT_MASTER_IS_ANCESTOR_OF_PR459_HEAD=YES
COMPARE_BASE_SHA=CURRENT_MASTER_SHA
COMPARE_HEAD_SHA=RUNTIME_CURRENT_HEAD_SHA
COMPARE_STATUS=ahead
MERGE_BASE_SHA=CURRENT_MASTER_SHA
POST_SYNC_HEAD_SECOND_PARENT=CURRENT_MASTER_SHA
```

`identical` is not sufficient because the seven-file PR payload must remain.
`behind`, `diverged`, missing history, partial API results, or a changed master
fails closed. Repeat the ancestry and parent checks in Snapshot B.

This satisfies strict branch freshness without weakening protection.

## 8. Payload verification at runtime

The gate must not trust filenames or Git blob IDs as the final content proof.
For each exact file at the runtime head:

1. read the complete paginated PR file records;
2. require the exact seven records in section 4.4;
3. read the file bytes at the exact runtime head through the contents or blob
   API using the existing read-only credential boundary;
4. require an ordinary file response, exact path, complete base64 payload, and
   consistency with the corresponding PR file record;
5. decode without text or line-ending normalization;
6. compute SHA-256 over the raw Git snapshot bytes;
7. compare every hash with section 4.2;
8. compute the canonical payload digest and compare with section 4.3;
9. compute the reviewed-scope digest and compare with both the caller-supplied
   digest and section 4.4;
10. repeat file-record, content-hash, and digest verification in Snapshot B.

Symlinks, submodules, truncation, unsupported encodings, unreadable content,
pagination uncertainty, or any byte mismatch fail closed.

## 9. Exact-head review remains strict

After synchronization, all reviews attached only to the old head are
insufficient. The gate must first build a complete, deterministic timeline for
each reviewer from reviews attached to the exact current head. It reduces each
timeline to that reviewer's latest decision state before selecting any
approval. Before dispatch, require at least one eligible reviewer whose latest
effective exact-head decision:

- is not the PR author;
- submits `APPROVED`;
- approves the exact post-sync head;
- is eligible under current repository protection;
- is not dismissed;
- submits before the workflow dispatch creation time under current gate
  semantics.

`APPROVED` followed by `CHANGES_REQUESTED` from the same reviewer is not an
approval. `CHANGES_REQUESTED` followed by `APPROVED` may qualify when every
other gate holds. A dismissed approval never qualifies. `COMMENTED` and
`PENDING` are non-decision records under the GitHub review-state model and do
not supersede the latest decision. Malformed chronology, unknown review state,
missing identity, duplicate stable review identity, or an invalid timestamp is
a technical failure. When submission timestamps match, the positive numeric
GitHub review ID provides deterministic ordering; a missing or duplicate ID
fails closed.

`author_association` is supplemental metadata only. The gate must independently
read the candidate's repository permission and accept only `push`, `maintain`,
or `admin`. `none`, `read`, and `triage` are ineligible. Missing, null, unknown,
malformed, unauthorized, or otherwise unreadable permission data is a technical
failure. If several exact-head approvals exist, at least one non-author must be
independently proven eligible. Snapshot B and the final authorization snapshot
must independently rebuild the latest-effective-state timelines and repeat both
the review read and the repository-permission proof. No approval selection may
be cached across snapshots.

```text
EXACT_HEAD_REVIEW_REQUIREMENT_PRESERVED=YES
OLD_HEAD_APPROVAL_REUSABLE_AFTER_SYNC=NO
FRESH_POST_SYNC_EXACT_HEAD_APPROVAL_REQUIRED=YES
ELIGIBLE_NON_AUTHOR_REVIEWER_STILL_REQUIRED=YES
```

This architecture resolves the head/freeze circularity only. It does not solve
or bypass the independent reviewer dependency.

## 10. Non-circular governed sequence

1. Separately authorize and create an implementation PR adding the
   content-bound PR459 profile.
2. Classify that implementation PR as `MERGE_GUARDRAIL_REMEDIATION`.
3. Review it at its exact head and use only the existing
   `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` path under separate
   dispatch and merge authority.
4. Merge and post-verify the implementation on master.
5. Issue separate PR459 synchronization authority pinned to the resulting
   master SHA and the old PR head.
6. Merge that exact master commit into the PR459 branch once, without force
   push or payload changes.
7. Verify ordered parent topology, current-master ancestry, exact scope, all
   seven hashes, scope digest, and payload digest.
8. Push only the verified merge commit under separate push authority.
9. Obtain a fresh eligible non-author approval on the new exact head.
10. Under separate authority, dispatch the canonical gate with the PR459 token,
    new exact head, and live reviewed-scope digest.
11. Recheck every gate and PR fact. Only a green result under separate merge
    authority permits one squash merge.

The implementation is canonical before the PR head is synchronized. The
exception therefore does not need to know the future commit SHA in advance,
and synchronization does not require another gate implementation commit.

## 11. Minimum future gate implementation

No implementation is authorized here. A future allowlist should be limited to:

1. `.github/workflows/viona-merge-authorization-gate.yml`
2. `scripts/viona-merge-authorization-gate.mjs`
3. `scripts/test-viona-merge-authorization-gate.mjs`
4. exact implementation evidence/docs explicitly named by that future pack.

### 11.1 Workflow delta

Keep `freeze_scope` required and add exactly one typed choice:

```text
FREEZE_EXCEPTION_FOR_PR459_OPERATING_PROTOCOL_V2_CANONICAL_PROMOTION_ONLY
```

The existing remediation-only choice remains unchanged. Do not add wildcard
categories such as `DOCS_ONLY`, `CANONICAL_DOCS`, `SAFE_DOCS`,
`NON_RUNTIME_PR`, or `GENERAL_EXCEPTION`.

### 11.2 Script delta

Use two explicit profiles and a rejecting default:

- the existing remediation-only profile with unchanged semantics;
- the PR459 content-bound profile defined here.

The PR459 profile must use internal constants for purpose, repository, PR,
branch, base, merge mode, path records, content hashes, and payload digest.
None may come from caller free text.

The shared canonical-version proof must validate both the workflow file and
`scripts/viona-merge-authorization-gate.mjs` at the workflow run head against
current master before any check creation. This prevents an unmerged modified
script from minting the required check while preserving canonical workflow
verification.

### 11.3 Required PR459 predicates

Before creating a check run, require all existing gates plus:

1. exact PR459 token;
2. repository `laoton80-del/Ket-noi-eu`;
3. PR number `459`;
4. exact head branch;
5. base `master`;
6. mode `squash`;
7. PR open, unmerged, non-draft, and auto-merge disabled;
8. runtime head equal to the live head and dispatch input;
9. exact two-parent transition topology from section 6.3;
10. current master equal to the authorized second parent and proven ancestor;
11. exact seven file records and initial scope digest;
12. exact seven file hashes and canonical payload digest;
13. eligible non-author whose latest effective exact-current-head decision is
    approval before dispatch;
14. zero unresolved conversations;
15. active repository protection and exact required gate context/app;
16. all non-gate required checks green on the runtime head;
17. no duplicate same-head gate result and run attempt exactly one.

Re-evaluate the mutable facts, including master identity, ancestry, parent
topology, PR files, and payload bytes, in Snapshot B before success. A final
authorization snapshot must then re-read PR identity and auto-merge state,
exact-head review timelines and reviewer permission, the complete review-thread
inventory, master identity/topology, the complete canonical protection object,
all non-gate required checks, exact scope and payload, and finally the gate-check
inventory. The last remote read must prove exactly one same-head canonical gate
check with the ID and app identity created by this attempt.

## 12. Non-reusability proof

| Attempt | Required result |
|---|---|
| PR #460 or any other PR with the same payload | fail: PR mismatch |
| Same PR number on another repository | fail: repository mismatch |
| Different head branch | fail: branch mismatch |
| Wrong base | fail: base mismatch |
| Mode other than squash | fail: mode mismatch |
| Old head after master advances | fail: ancestry and transition mismatch |
| Post-sync head with one changed byte | fail: file and payload digest mismatch |
| Extra, missing, renamed, or reclassified path | fail: scope mismatch |
| Extra commit before or after the single merge | fail: ordered-parent topology mismatch |
| Second ordinary master sync | fail: first-parent mismatch |
| Non-fast-forward reconstruction of transition | prohibited by protection and authority |
| No exact-current-head approval | fail: review mismatch |
| Approval only for old head | fail: review mismatch |
| Unresolved conversation | fail |
| Auto-merge active | fail |
| PR closed or merged | fail |
| PR459 token used on guardrail-remediation PR | fail: PR/branch/payload mismatch |

After PR #459 closes or merges, its required `OPEN` state is false and the
token is operationally dead. It cannot authorize another PR.

## 13. Preserved gate security

The future design preserves or strengthens:

- repository-level required-check enforcement;
- master branch protection, strict freshness, administrator enforcement, and
  disabled force push and deletion;
- the exact `Viona Merge Authorization Gate` context and app identity;
- canonical workflow and gate-script verification;
- actor allowlist and triggering-actor equality;
- run attempt `1` and duplicate-result rejection;
- protection-read credential separation and path restriction;
- exact runtime-head binding in Snapshots A and B;
- exact-head approval and timing;
- complete pagination, scope digest, and conversation resolution;
- auto-merge prohibition;
- squash-only and master-only behavior;
- no caller free-text authorization;
- no direct merge or protection-bypass fallback.

For the PR459 profile, complete protection proof means `strict=true`,
`enforce_admins.enabled=true`, required pull-request reviews with stale-review
dismissal, `require_code_owner_reviews=false`, and at least one approval,
required conversation resolution, `restrictions=null`, and explicitly disabled
force pushes and deletions. The gate check and check-run identities must be
positive integer API identities and match the app bound in protection. Missing,
malformed, or noncanonical fields fail closed. Review-thread pagination likewise
fails on partial GraphQL errors, malformed nodes or page info,
missing/empty/whitespace/repeated cursors, or a page ceiling reached while
another page remains.

## 14. Future test matrix

| ID | Fixture | Expected result |
|---|---|---|
| PASS-01 | PR459 exact payload + one exact sync head + current master parent/ancestor + exact-head approval | candidate pass |
| HEAD-01 | old `a6aeff6c...` head after master advances | `FAIL_NOT_CURRENT_WITH_MASTER` |
| HEAD-02 | post-sync head with wrong first parent | fail transition |
| HEAD-03 | post-sync head with wrong second parent | fail transition |
| HEAD-04 | head has one parent or more than two | fail transition |
| HEAD-05 | second ordinary synchronization | fail first-parent binding |
| PAYLOAD-01 | one canonical byte changed | `FAIL_PAYLOAD_DIGEST_MISMATCH` |
| PAYLOAD-02 | same path/hash records in different input order | deterministic same digest |
| PAYLOAD-03 | text normalized before hashing | fail raw-byte hash |
| SCOPE-01 | extra file | `FAIL_SCOPE_MISMATCH` |
| SCOPE-02 | missing file | `FAIL_SCOPE_MISMATCH` |
| SCOPE-03 | rename or status change | `FAIL_SCOPE_MISMATCH` |
| SCOPE-04 | supplied reviewed digest differs from computed | fail |
| SCOPE-05 | culture-aware supplied digest `2269d578...` | fail noncanonical ordering |
| PR-01 | PR460 with identical payload | `FAIL_PR_NUMBER_MISMATCH` |
| PR-02 | different repository | fail repository |
| PR-03 | different branch with same payload | `FAIL_BRANCH_MISMATCH` |
| PR-04 | wrong base | `FAIL_BASE_MISMATCH` |
| PR-05 | merge mode other than squash | `FAIL_MERGE_MODE` |
| REVIEW-01 | no exact-current-head approval | `FAIL_REVIEW` |
| REVIEW-02 | approval only for old head | `FAIL_REVIEW` |
| REVIEW-03 | PR author approval | `FAIL_REVIEW` |
| REVIEW-04 | approval after dispatch | `FAIL_REVIEW` |
| REVIEW-05 | dismissed approval | `FAIL_REVIEW` |
| REVIEW-06 | same reviewer: approval then later changes requested | `FAIL_REVIEW` |
| REVIEW-07 | same reviewer: changes requested then later approval | candidate pass when otherwise eligible |
| REVIEW-08 | approval followed by a comment-only review | prior decision remains effective |
| REVIEW-09 | duplicate timestamp with stable increasing review IDs | deterministic latest decision |
| REVIEW-10 | malformed chronology, missing ID, or duplicate ID | technical failure |
| REVIEW-11 | approval valid initially, then changes requested before Snapshot B | fail |
| REVIEW-12 | approval valid at Snapshot B, then changes requested before final snapshot | fail |
| THREAD-01 | unresolved review thread | fail |
| STATE-01 | auto-merge active | fail |
| STATE-02 | PR closed or merged | fail |
| STATE-03 | workflow rerun | fail |
| STATE-04 | duplicate same-head gate check | fail |
| MASTER-01 | current master not ancestor | fail |
| MASTER-02 | master moves between snapshots | fail |
| MASTER-03 | compare response partial or ambiguous | fail |
| CANON-01 | workflow at run head differs from master | fail |
| CANON-02 | gate script at run head differs from master | fail |
| FREEZE-01 | existing remediation token on existing remediation fixture | unchanged behavior |
| FREEZE-02 | PR459 token on remediation PR | fail |
| FREEZE-03 | unknown or general docs token | fail |
| FREEZE-04 | global freeze after PR459 candidate evaluation | remains active |
| PROTECT-01 | required context/app absent or changed | fail |
| PROTECT-02 | protection read missing or unauthorized | fail |

The implementation-remediation matrix additionally requires: read/triage/none
reviewers fail; push/maintain/admin non-author reviewers pass candidate
selection; each snapshot independently reduces the complete exact-head review
inventory to the latest decision per reviewer; an approval superseded by
changes requested or dismissal fails; later approval may restore eligibility;
comment-only records do not supersede decisions; reviewer-permission API
uncertainty fails; malformed or ambiguous review chronology fails; every
incomplete or cyclic review-thread pagination shape fails;
non-boolean `isResolved` fails; incomplete protection, administrator bypass, or
force-push/deletion enablement, branch restrictions, code-owner review-policy
drift, or malformed gate identity fails; and every mutable-state transition from
a green earlier snapshot to a red final snapshot fails. That transition matrix
includes review dismissal, permission downgrade, new unresolved thread,
protection drift, required-check failure, auto-merge activation, head/base/master
drift, payload/scope drift, and a late duplicate gate context. An authoritative
failure is completed exactly once and cannot be overwritten by later success.

## 15. Implementation PR eligibility

A future PR limited to the workflow, gate script, tests, and exact guardrail
evidence is `MERGE_GUARDRAIL_REMEDIATION`. It may use the existing
`FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY` only after its own PR
number, exact reviewed head, scope, conversations, checks, dispatch authority,
and merge authority are all independently green. This packet neither creates
nor authorizes that PR.

## 16. Current packet mutation boundary

Only these existing local uncommitted files are modified by this reconciliation:

- `docs/product/VIONA_PR459_EXACT_CANONICAL_DOCS_FREEZE_EXCEPTION_DESIGN.md`
- `docs/design/evidence/codex-pr459-exact-canonical-docs-freeze-exception-design-v1/README.md`

No workflow, script, test, product source, runtime, configuration, database,
permission, PR, review, check, protection, merge, deployment, commit, or remote
state is changed.

## 17. Static acceptance decision

```text
CLASSIFICATION=READY_FOR_PR459_CONTENT_BOUND_ONE_SHOT_EXCEPTION_IMPLEMENTATION_AUTHORITY
RESULT=PASS

DURABLE_EXCEPTION_BINDS_TO_OLD_HEAD=NO
RUNTIME_CURRENT_HEAD_BINDING_REQUIRED=YES
POST_SYNC_HEAD_KNOWN_NOW=NO

PAYLOAD_FILE_COUNT=7
PAYLOAD_PATH_SET_PINNED=YES
PAYLOAD_CONTENT_HASHES_PINNED=YES

MASTER_SYNC_REQUIRED_AFTER_GATE_REMEDIATION_MERGE=YES
PREFERRED_SYNC_MECHANISM=ORDINARY_NON_FORCE_MERGE_OF_PINNED_CURRENT_MASTER_INTO_PR459_BRANCH
FORCE_PUSH_REQUIRED=NO
CURRENT_MASTER_ANCESTRY_REQUIRED=YES

OLD_HEAD_APPROVAL_REUSABLE_AFTER_SYNC=NO
FRESH_POST_SYNC_EXACT_HEAD_APPROVAL_REQUIRED=YES

NON_CIRCULAR=YES
EXCEPTION_REUSABLE_FOR_OTHER_PRS=NO
EXCEPTION_REUSABLE_FOR_MODIFIED_PR459_PAYLOAD=NO
CURRENT_REMEDIATION_EXCEPTION_BEHAVIOR_CHANGED=NO

EXACT_HEAD_GATE_BINDING_PRESERVED=YES
EXACT_HEAD_REVIEW_PRESERVED=YES
PAYLOAD_IMMUTABILITY_PRESERVED=YES
MASTER_PROTECTION_PRESERVED=YES
GLOBAL_FREEZE_PRESERVED=YES

FUTURE_IMPLEMENTATION_CLASSIFICATION=MERGE_GUARDRAIL_REMEDIATION
FUTURE_IMPLEMENTATION_ELIGIBLE_FOR_CURRENT_REMEDIATION_EXCEPTION=YES
ELIGIBLE_NON_AUTHOR_REVIEWER_STILL_REQUIRED=YES

IMPLEMENTATION_AUTHORIZED=NO
PR459_SYNC_AUTHORIZED=NO
REVIEW_SUBMITTED=NO
GATE_DISPATCHED=NO
MERGE_ATTEMPTED=NO
```
