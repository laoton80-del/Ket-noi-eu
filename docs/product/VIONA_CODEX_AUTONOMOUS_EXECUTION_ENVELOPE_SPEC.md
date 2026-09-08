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

Every VIONA Controlled Autonomous Execution Envelope must include the applicable
fields below. Mode-specific fields are included or omitted exactly as specified
in this section. No missing field may be inferred as mutation permission.

```text
PROJECT:
  name:

CANONICAL_ROOT:
  path:

EXPECTED_BASE:
  branch:
  head:
  refs_manifest_sha256:
  parent:
  tree_state:
  unstaged_tracked_paths:
  unstaged_tracked_diff_sha256:
  tracked_worktree_manifest_sha256:
  staged_paths:
  staged_diff_sha256:
  index_semantic_manifest_sha256:
  untracked_paths:
  untracked_manifest_sha256:
  ignored_untracked_paths:
  ignored_untracked_manifest_sha256:

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

POST_VALIDATOR_STATE_RECHECK:
  required:
  comparison_source:
  capture:
  post_mutation_unstaged_tracked_paths:
  post_mutation_unstaged_tracked_diff_sha256:
  post_mutation_tracked_worktree_manifest_sha256:
  post_mutation_staged_paths:
  post_mutation_staged_diff_sha256:
  post_mutation_index_semantic_manifest_sha256:
  post_mutation_untracked_paths:
  post_mutation_untracked_manifest_sha256:
  post_mutation_ignored_untracked_paths:
  post_mutation_ignored_untracked_manifest_sha256:
  unauthorized_delta:

SELF_REMEDIATION_POLICY:
  allowed:
  forbidden:
  retry_limit:

STAGE_AUTHORITY:
  allowed:
  paths:
  post_stage_paths:

COMMIT_AUTHORITY:
  allowed:
  paths:
  count:
  subject:
  hooks_path:
  merge_commit_allowed: false

PUSH_AUTHORITY:
  allowed:
  remote:
  push_url:
  repository_identity:
    provider: github
    host: github.com
    node_id:
    provenance:
  api_verifier_context_id:
  expected_destination:
    kind:
    oid:
  execution_environment_names: []
  hooks_path:
  execution_config_sha256:
  execution_environment_sha256:
  branch:
  refspec:
    source:
      kind:
      oid:
      selector:
    destination:
  expected_local_ref_transitions:
    - ref:
      old:
        kind:
        value:
      new:
        kind: direct
        value_from: PUSH_SOURCE_OID

REMOTE_COMMIT_AUTHORITY:
  allowed:
  profile: github_graphql_existing_branch_replace_v1
  repository_identity:
    node_id:
    numeric_id:
    provenance:
  branch_node_id:
  branch_ref:
  expected_head_oid:
  base_tree_oid:
  paths: []
  replacement_count: 2
  content_source: sealed_validated_staged_blobs
  tree_source: independently_derived_base_tree_plus_replacements
  max_commits: 1
  max_attempts: 1
  message_headline:
  api_verifier_context_id:
  api_publisher_context_id:
  mutation_document_sha256:
  operation_id:
  durable_attempt_authority_id:
  expected_pr_binding_id:
  associated_pr_scope_id:
  metadata_race_acceptance_id:

DURABLE_ATTEMPT_AUTHORITY:
  allowed:
  id:
  operation_id:
  authorization_reference:
  marker_path:
  evidence_ledger_path:
  local_file_operations:
    marker: [create_new_exclusive, write_initial_record, flush_to_disk, read_same_handle, read_existing_for_reconciliation, retain]
    ledger: [append_nonsecret_records, flush_to_disk, read]
  storage_contract: verified_local_fixed_NTFS_real_paths
  record_version: 1
  record_encoding: UTF8_no_BOM_ordered_compact_JSON_no_newline
  record_field_order: [record_version, encoding, operation_id, authorization, marker_path, consumed, repository_node_id, repository_numeric_id, pr_node_id, pr_number, head_ref_node_id, head_ref, expected_head_oid, authorized_tree, request_id, request_payload_sha256, clientMutationId, context_id, helper_sha256]
  reservation: FileMode.CreateNew
  sharing: FileShare.None
  persistence: FileStream.Flush(true)
  recovery: existing_or_uncertain_means_read_only_reconciliation

EXPECTED_PR_BINDING:
  required:
  id:
  number:
  node_id:
  owning_repository_node_id:
  head_repository_node_id:
  base_repository_node_id:
  head_ref_node_id:
  head_ref:
  expected_head_oid:
  base_ref:
  expected_base_oid:
  state: OPEN
  merged: false
  draft: false
  auto_merge: disabled

ASSOCIATED_PR_SCOPE:
  required:
  id:
  policy: SINGLE_DECLARED_OPEN_PR_ONLY
  expected_pr_binding_id:
  head_ref_source: EXPECTED_PR_BINDING.head_ref_node_id
  connection: Ref.associatedPullRequests
  states: [OPEN]
  optional_filters: none
  completeness: all_pages_until_hasNextPage_false
  mandatory_observations: [pre_dispatch, post_publication, final_closure]
  mismatch_or_incomplete: block_without_repair

PR_METADATA_RACE_ACCEPTANCE:
  accepted:
  id:
  authorization_reference:
  operation_id:
  expected_pr_binding_id:
  associated_pr_scope_id:
  publication_scope_source: REMOTE_COMMIT_AUTHORITY
  accepted_interval_risks: [metadata_between_observations, membership_between_observations, unobserved_transient_changes]
  mandatory_observations: [pre_dispatch, post_publication, final_closure]
  atomic_pr_metadata_precondition: NOT_PROVIDED
  technically_eliminated: false
  known_pre_dispatch_mismatch: block
  observable_post_publication_mismatch: incident_stop_closure_no_rollback_or_retry
  additional_authority: none

LOCAL_SYNC_AUTHORITY:
  allowed:
  root:
  branch_ref:
  expected_old_oid:
  new_oid_source: verified_server_commit
  object_import_url:
  git_execution_context_reference:
  hooks_path:
  max_ref_updates: 1

API_EXECUTION_CONTEXTS:
  - id:
    executable_path:
    executable_sha256:
    executable_provenance:
    runtime_version:
    runtime_identities: []
    helper_sha256:
    endpoint: https://api.github.com/graphql
    request_documents: []
    environment_names: []
    environment_sha256:
    configuration_policy:
    configuration_sha256:
    credential_source_reference:
    credential_accessor:
    expected_actor:
    tls_policy:
    redirect_policy:
    retry_policy:

API_REQUEST_RECORDS:
  - request_id:
    context_id:
    operation_name:
    operation_type:
    query_document_sha256:
    authorized_variable_binding_sources:
    request_payload_sha256:
    phase:
    purpose:

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

`EXPECTED_BASE.refs_manifest_sha256` binds HEAD, root refs, FETCH_HEAD,
MERGE_HEAD, and every visible `refs/` namespace: branches, remote-tracking refs,
tags, notes, stash, replacement refs, and tool-owned refs. No namespace grants
write permission. The read-only procedure uses commands available in Git 2.43
and does not require a Git upgrade or configuration mutation:

```bash
git --no-optional-locks --no-replace-objects config --get extensions.refStorage
git --no-optional-locks --no-replace-objects for-each-ref --sort=refname --format='%(refname)%00%(objectname)%00%(symref)%00'
git --no-optional-locks --no-replace-objects symbolic-ref --no-recurse -q HEAD
git rev-parse --path-format=absolute --git-common-dir
git rev-parse --absolute-git-dir
```

The storage query must return either exit 1 with empty output (the default
files backend), or exit 0 with exactly `files`; reject other values, errors,
or stderr. Every other required read must succeed without stderr. Newer
`git refs` commands, root-ref enumeration options, and ref-format query options
are not prerequisites. See the [Git 2.43 ref enumeration documentation](https://git-scm.com/docs/git-for-each-ref/2.43.0)
and [repository layout](https://git-scm.com/docs/gitrepository-layout/2.43.0).

Construct the logical map independently from the files backend. Read the
common directory's optional `packed-refs` as regular raw data; reject links,
reparse points, locks, malformed records, duplicate names, or unsupported
headers. Parse full object-ID SP exact `refs/` name records. An optional
`^<full-OID>` line belongs only to the immediately preceding record as peeled
metadata, never as another ref. After loose overlay, verify only effective packed peeled IDs by dereferencing
the literal full unpeeled OID with `git --no-replace-objects rev-parse <OID>^{}`;
the manifest binds the unpeeled OID. Validate names with `git check-ref-format`.

Overlay supported loose refs, which take precedence over matching packed
records. Read regular files only; never follow symlinks/reparse points. Accept
only a full direct OID or `ref: <immediate-target>` with the supported line
terminator; validate names/targets and reject unsupported bytes, locks,
duplicates, cycles, dangling targets, or missing objects. Resolve storage with
`git rev-parse --git-path <exact-ref-name>`: shared refs use the common Git
directory; per-worktree refs use the active Git directory. Inventory those
locations according to Git's repository layout, without substituting another
worktree's private refs. No worktree creation is authorized by this procedure.

Cross-check the constructed `refs/` name set exactly against ordinary
`for-each-ref`, parsing its NUL fields and single record-ending LF as raw bytes.
Require matching resolved full OIDs and direct/symbolic kinds; verify each
immediate symbolic target with `git symbolic-ref --no-recurse -q <exact-ref>`.
A loose ref silently omitted by Git enumeration, including a dangling
symbolic ref, therefore fails closed. Direct IDs are unpeeled, including for
annotated tags; symbolic resolutions must agree with the constructed map.

Read HEAD and uppercase root candidates from the active Git directory
(names matching `[A-Z][A-Z0-9_]*`), excluding only non-ref message files
`COMMIT_EDITMSG`, `MERGE_MSG`, `SQUASH_MSG`, `TAG_EDITMSG`,
`NOTES_EDITMSG`, and `EDIT_DESCRIPTION`. These exact exclusions apply only
to root editor artifacts, never to names beneath `refs/`; do not use suffix
wildcards. Git 2.43 creates these files while editing [tag messages](https://github.com/git/git/blob/v2.43.0/builtin/tag.c),
[note messages](https://github.com/git/git/blob/v2.43.0/builtin/notes.c), and
[branch descriptions](https://github.com/git/git/blob/v2.43.0/builtin/branch.c).
Apply the same direct/symbolic
syntax and resolution checks. For `FETCH_HEAD` and `MERGE_HEAD`, bind presence
and SHA-256 of exact raw bytes as `pseudoref` records because they may contain
multiple records; absence differs from an empty existing file. Reject unknown
unsupported root contents/types instead of silently omitting them.

HEAD must be directly attached to `refs/heads/<EXPECTED_BASE.branch>`, whose
direct OID equals `EXPECTED_BASE.head` through the pre-commit phase. Detached
or unborn HEAD is unsupported. Later acceptance uses only the independently
verified phase map and new commit from §11, never an observed OID adopted as
expected state. Include HEAD once in the map.

Sort by raw ref-name bytes and concatenate `name NUL kind NUL value NUL`.
Kind is ASCII `direct`, `symbolic`, or `pseudoref`; value is the full lowercase
object ID, raw immediate target, or lowercase raw-file SHA-256 respectively.
The manifest is lowercase SHA-256 of that byte stream. Retain the records.
Symbolic targets, not derived OIDs, are serialized; verify resolution
separately. Packing unchanged refs does not change logical identity.
Reflog/cache metadata is not part of this logical ref manifest.

Require two matching complete snapshots at every acceptance and quiesce
concurrent ref writers. Implementation, validators, and staging must preserve
the baseline map; candidate capture cannot adopt ref drift. Any separately
authorized ref operation needs exact names, actions, old values (including
absence), expected new values, and a verified next phase baseline. Ordinary
commit/push transitions follow §11. Use `--no-replace-objects` for object,
content, HEAD, tree, and parent proofs. Unsupported or incomplete verification
fails closed without automatic repair.

`EXPECTED_BASE.unstaged_tracked_paths` is the exact baseline path set for
unstaged tracked changes. Use `unstaged_tracked_paths: []` when no unstaged
tracked paths are present; otherwise list every expected repository path
exactly. The observed output of `git diff --no-renames --name-only -z` must match
that declared set exactly.

`EXPECTED_BASE.unstaged_tracked_diff_sha256` pins raw diff metadata, not
working-file contents. It is the lowercase SHA-256 of the exact raw stdout
bytes from this command, without text decoding or newline normalization:

```bash
git -c core.abbrev=40 diff --raw --no-renames -z
```

Raw worktree diff postimage object IDs are all zeros for unstaged changes.
Therefore a same-path byte rewrite can leave this digest unchanged.
`EXPECTED_BASE.tracked_worktree_manifest_sha256` additionally binds actual raw
working content for every path from `git ls-files --cached -z`, sorted and
deduplicated by raw path bytes. Include Git-clean paths: normalization, filters,
and index flags can hide byte changes from `git diff`. The verified HEAD,
staged identity, and semantic index manifest determine this tracked inventory. Use the canonical
path/type/content record defined below for untracked files, with one extra
type: a deleted tracked path has type `missing` and the SHA-256 of the empty
byte string. An existing empty regular file still has type `file`; it cannot
equal a deletion. Symlinks bind their raw target bytes without dereferencing.
The raw diff digest binds modes/status/index IDs, while the manifest binds
working bytes, including binary files. Verify both identities and the exact
path set at preflight and after validators. Reject unsupported types,
incomplete enumeration, unreadable content, and unmerged index entries.

`EXPECTED_BASE.staged_paths` is the exact baseline index-path declaration. Use
`staged_paths: []` when no paths are staged at baseline; otherwise list every
expected staged repository path exactly. The observed output of
`git diff --cached --no-renames --name-only -z` must match that declared set
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

`EXPECTED_BASE.index_semantic_manifest_sha256` binds every index entry even
when the cached diff is empty. Read from the canonical root using:

```bash
git --no-optional-locks -c core.fsmonitor=false ls-files --stage --debug --abbrev=40 -z
```

Before accepting any semantic-index snapshot, also run:

```bash
git --no-optional-locks -c core.fsmonitor=false ls-files --resolve-undo --abbrev=40 -z
```

Require exit success and exactly zero raw stdout bytes. Nonempty resolve-undo
records are unsupported by this ordinary contract and fail closed before
mutation or validator execution, and at every later semantic-index acceptance
(including staging, commit, and final evidence). Never clear or normalize these
records automatically. No extra schema digest is needed because only empty
resolve-undo state is supported.

Parse each mode/full-object-ID/stage header through its TAB, preserve the raw
pathname through NUL, then parse the supported five-line debug metadata and its
hexadecimal flags. Do not split pathnames on whitespace or newlines. Reject
malformed or changed debug output, duplicate paths, and nonzero index stages.
`--debug` is not a stable machine format: an unsupported format fails closed
until its parser is explicitly reviewed. Do not hash physical index bytes or
raw debug output, because stat/cache refreshes are not content authority.

Sort records by raw path bytes ascending and serialize exactly:

```text
<path> NUL <stage-decimal> NUL <mode-six-octal> NUL <full-lowercase-oid> NUL <assume-bit> NUL <skip-bit> NUL <intent-to-add-bit> NUL
```

Each bit is ASCII `0` or `1`. Decode assume-unchanged from `0x8000`,
skip-worktree from `0x40000000`, and intent-to-add from `0x20000000`.
The lowercase SHA-256 of the concatenated records is the semantic manifest;
an empty index uses the empty-byte-string digest. An index with unchanged
tracked files still has a nonempty manifest. Ignore stat metadata and only
these recognized bookkeeping/cache flag bits: EXTENDED `0x4000`, UPTODATE
`0x40000`, HASHED `0x100000`, and FSMONITOR_VALID `0x200000`. Reject all other
flag bits rather than silently masking unknown semantics. Fsmonitor is disabled
for this inventory; the independent full raw-worktree manifest still detects
content changes regardless of cached hints.

Verify this manifest at preflight, before and after every validator group,
before and after staging, immediately before commit, and after commit. Stage
transitions must preserve all entries outside their exact authority. Ordinary
staging may clear intent-to-add only while staging validated content at an
authorized path; any other semantic flag transition requires exact path-and-flag
authority. Recording a changed manifest does not authorize that change.

`EXPECTED_BASE.untracked_paths` is the exact set of nonignored untracked
repository paths. `EXPECTED_BASE.ignored_untracked_paths` is the exact set of
ignored untracked repository paths. Use `[]` when the relevant set is empty.
The observed NUL-delimited outputs from these canonical commands must match the
corresponding declared path sets exactly:

```bash
git ls-files --others --exclude-standard -z
git ls-files --others --ignored --exclude-standard -z
```

Path equality alone is insufficient. Each declared untracked set also requires
a deterministic content-identity manifest. For every exact path in the set,
sort by raw repository path bytes ascending and append one record consisting of:

```text
<path-bytes> NUL <type-ascii> NUL <sha256-hex> NUL
```

For a regular file, `sha256-hex` is the lowercase SHA-256 of its exact raw file
bytes. For a symlink, it is the lowercase SHA-256 of the raw link-target bytes
without dereferencing the target. The type token is exactly `file` or
`symlink`; any other filesystem type is a fail-closed blocker. Hash the complete
concatenated record byte stream to produce `untracked_manifest_sha256` or
`ignored_untracked_manifest_sha256`. An empty set uses the SHA-256 of the empty
byte string:
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Manifest construction is identity verification only. It does not authorize
semantic inspection, disclosure, execution, modification, staging, or commit of
ignored or nonignored untracked files. Secrets and ignored artifacts remain
default-deny unless separately and explicitly authorized by exact path and
action.

`POST_VALIDATOR_STATE_RECHECK` is required for every lane that runs validators.
`required` must be true and `unauthorized_delta` must be `fail_closed`.
`comparison_source` selects exactly one source of expected values:

- `expected_base` (default): all values remain those in `EXPECTED_BASE`;
  `capture` and all `post_mutation_*` fields are omitted.
- `declared_post_mutation`: the operator supplies every `post_mutation_*`
  path set and digest listed below; `capture` is omitted. Verify this state
  before the first validator, then seal it as that group's input.
- `sealed_pre_validator_candidate`: only when explicitly selected by the
  operator, `capture` is `after_authorized_implementation_before_first_validator`
  and `post_mutation_*` fields are omitted. Record computed candidate values
  in evidence after authorized implementation and before validators. This
  avoids inventing output hashes before an implementation exists.

The complete post-mutation identity consists of:

- `post_mutation_unstaged_tracked_paths`;
- `post_mutation_unstaged_tracked_diff_sha256`;
- `post_mutation_tracked_worktree_manifest_sha256`;
- `post_mutation_staged_paths`;
- `post_mutation_staged_diff_sha256`;
- `post_mutation_index_semantic_manifest_sha256`;
- `post_mutation_untracked_paths`;
- `post_mutation_untracked_manifest_sha256`;
- `post_mutation_ignored_untracked_paths`;
- `post_mutation_ignored_untracked_manifest_sha256`.

All modes also pin the verified canonical root, branch, HEAD, and complete
baseline refs manifest. Ref identity is not a post_mutation_* override; validators
have no branch or commit authority. Before sealing a post-mutation state,
compare its per-path records with the captured, verified baseline. Each changed
path and action must be independently authorized; staged changes require stage
authority. Unchanged unrelated paths retain their baseline identities and do
not need mutation authority merely to appear in a complete inventory.
Expected-state declarations and candidate capture grant no additional rights.
Reject conflicting mode fields or missing required identities.

After every validator group, recompute root, branch,
HEAD, complete refs manifest, exact unstaged paths, unstaged raw diff digest, tracked content manifest,
staged paths/content digest, semantic index manifest, both untracked path sets,
and both untracked manifests. Every value must equal the sealed input, including in stage-only or
no-commit lanes. Never accept validator output as a replacement expected state.
Validator-created files, same-path byte changes, index changes, ref creation,
deletion or movement, symbolic-target changes, and HEAD changes
fail closed.

If an in-scope remediation is authorized, preserve failure evidence and restore
the last sealed input only when that restoration is already authorized;
otherwise stop. Then apply the authorized remediation, re-establish expected input,
and rerun affected validators. Re-establish input using the same selected
comparison source: only explicitly selected candidate mode may capture new
computed identities; other modes must still match their declared identities or
stop for an updated operator declaration. Do not reseal unexplained validator changes.
Before any later stage, commit, or push, revalidate the last verified state; separately
authorized transitions follow §11 and must be recorded in final evidence.
Final success requires the state derived from the last validated input plus
only those verified authorized transitions, with no unexplained changes.

Required post-validator truths:

```text
POST_VALIDATOR_TRACKED_RECHECK=YES
POST_VALIDATOR_TRACKED_DIFF_SHA256_RECHECK=YES
POST_VALIDATOR_TRACKED_MANIFEST_RECHECK=YES
POST_VALIDATOR_STAGED_RECHECK=YES
POST_VALIDATOR_STAGED_DIFF_SHA256_RECHECK=YES
POST_VALIDATOR_INDEX_SEMANTIC_MANIFEST_RECHECK=YES
INDEX_RESOLVE_UNDO_EMPTY=YES
POST_VALIDATOR_HEAD_RECHECK=YES
POST_VALIDATOR_REFS_MANIFEST_RECHECK=YES
POST_VALIDATOR_UNTRACKED_RECHECK=YES
POST_VALIDATOR_IGNORED_RECHECK=YES
POST_VALIDATOR_MANIFEST_RECHECK=YES
UNAUTHORIZED_VALIDATOR_STATE_DELTA_FAILS_CLOSED=YES
```

---

## 4. Autonomy Levels

| Level | Name | Local authority | Remote authority |
| --- | --- | --- | --- |
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
git diff --no-renames --name-only -z
git -c core.abbrev=40 diff --raw --no-renames -z
git diff --cached --no-renames --name-only -z
git ls-files --others --exclude-standard -z
git ls-files --others --ignored --exclude-standard -z
```

In addition, compute and compare the exact raw-byte SHA-256 for:

```bash
git -c core.abbrev=40 diff --cached --raw --no-renames -z
```

against `EXPECTED_BASE.staged_diff_sha256`. Compute and verify the complete
refs manifest against `EXPECTED_BASE.refs_manifest_sha256` using §3. Compute the complete semantic index
manifest against `EXPECTED_BASE.index_semantic_manifest_sha256` using §3, and
compute both canonical untracked
manifests described in §3 against their declared path sets and manifest digests.
Also compute and compare the exact unstaged tracked path set, raw metadata
digest, and raw-byte tracked content manifest described in §3.

Require:

- canonical root;
- expected branch;
- exact HEAD and complete logical refs identity, including HEAD symbolic target;
- expected tree state;
- expected unstaged tracked path set, raw metadata digest, and content manifest;
- expected staged path set, with rename source and destination paths both enumerated;
- expected staged-content digest and semantic index manifest, with empty resolve-undo proof;
- exact nonignored untracked path set and content-identity manifest;
- exact ignored untracked path set and content-identity manifest;
- for an API publication lane, the full §12.1 verifier/publisher contexts,
  anchored repository/Ref/head/base and supported no-redirect client; establish
  client safety before edits when the operator requires that ordering;
- when push is enabled, its independently declared repository identity and
  destination old state, validated environment allowlist and executable/path
  identities, and the complete §11 push context before push preparation.

Inventorying ignored files is evidence only and never grants mutation, staging,
execution, or semantic-use authority. Any mismatch means stop. No automatic
checkout, reset, rebase, stash, pull, fetch, branch repair, or worktree repair
is allowed unless explicitly authorized.

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
IMPLEMENT INSIDE THE AUTHORIZED ENVELOPE
-> VERIFY AUTHORIZED DELTAS AND SEAL THE PRE-VALIDATOR INPUT STATE
-> RUN TARGETED TEST
-> RECHECK ALL SEALED STATE IDENTITIES
-> IF FAIL:
     classify cause
-> IF safely remediable inside envelope:
     preserve evidence; restore sealed input only when authorized
     remediate; re-establish input using the same selected comparison source
     rerun and recheck all sealed state identities
-> ELSE:
     STOP
-> RUN FULL REQUIRED VALIDATORS
-> RECHECK COMPLETE REFS MANIFEST AND HEAD SYMBOLIC TARGET
-> RECHECK ROOT, BRANCH, HEAD, UNSTAGED PATHS/METADATA/CONTENT MANIFEST
-> RECHECK STAGED PATHS, STAGED-CONTENT DIGEST, AND SEMANTIC INDEX MANIFEST
-> RECHECK NONIGNORED AND IGNORED PATH SETS AND CONTENT MANIFESTS
-> COMPARE EVERY VALUE WITH THE SAME SEALED INPUT STATE
-> REVALIDATE BEFORE ANY INDEPENDENTLY AUTHORIZED STAGE/COMMIT TRANSITION
-> IF INDEPENDENTLY AUTHORIZED API PROFILE: REVALIDATE §12.1 CONTEXT AND CANDIDATE
-> ONE API DISPATCH; VERIFY REMOTE PARENT/TREE/REF; SYNC ONLY IF SEPARATELY AUTHORIZED
-> CAPTURE FINAL GIT STATE AND TRANSITION EVIDENCE
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
- comparison source and sealed pre-validator state identities;
- every post-validator identity comparison;
- complete pre/post ref records, manifest digests, and exact authorized ref transitions;
- verified stage transitions, staged paths/content digest, semantic index manifests, and empty resolve-undo proof;
- PRE_COMMIT_HEAD, AUTHORIZED_TREE, committed tree and parent proof when committed;
- remediation performed;
- scope expansions requested;
- Git state;
- runtime effect;
- remote effect and, for push, §11 identity/provenance, expected destination,
  environment-policy/executable proof and all pre/post comparisons;
- API publication, when authorized: §12.1 request/context/attempt records,
  full tree/blob and parent/Ref evidence, and separate local-sync outcome;
- rollback state;
- final classification.

Codex must not claim success without evidence.

---

## 11. Local Commit Contract

Stage authority and local commit authority are independent. The explicit
§12.1 API stage-before-validator option changes only the permitted ordering:
seal authorized working bytes first, verify the exact stage transition, then
validate and recheck that staged candidate before publication. It never grants
staging or excuses a filter, path, mode, flag or ref mismatch.

Stage authority and commit authority are independent. If stage authority is
false, do not stage. If stage authority is true, Codex may stage only the exact
paths in `STAGE_AUTHORITY.paths`, including when commit authority is false. A
stage-only lane with stage authority true and commit authority false is valid.

When stage authority is true:

- use exact paths only and revalidate the last verified state before staging;
- require the complete refs manifest unchanged before and after staging, including for stage-only lanes;
- `STAGE_AUTHORITY.post_stage_paths` declares the complete expected index diff
  path set, including unchanged baseline entries; only paths independently
  listed in `STAGE_AUTHORITY.paths` may have their index entries changed;
- run `git diff --cached --no-renames --name-only -z` and require equality with
  `STAGE_AUTHORITY.post_stage_paths`, including both endpoints of every rename;
- compare complete semantic index records before and after staging; preserve
  baseline records outside the stage-authorized paths;
- ordinary staging may clear intent-to-add only when staging validated content
  at a stage-authorized path; other flag transitions require explicit
  path-and-flag authority and must match that exact declared transition;
- verify changed staged entries against the validated working content;
  unchanged baseline entries retain their verified index identities;
  reject unvalidated filter or other transformations, and any worktree change;
- record the verified post-stage `index_semantic_manifest_sha256`; require it
  unchanged before commit, after commit, and at final reporting;
- record the verified post-stage `staged_diff_sha256` and require it unchanged
  immediately before commit, or at final reporting when no commit occurs;
  after commit retain it as pre-commit evidence and verify the resulting index
  against the committed tree, with expected worktree state unchanged;
- run `git diff --cached --check`.

A stage-only lane follows all these checks even though it will not commit.
Stage authority limits index mutations; pre-existing unchanged staged entries
are evidence, not implicit authority to commit them.

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

- `COMMIT_AUTHORITY.merge_commit_allowed` must be false (the default and only supported value in this ordinary-commit contract); reject true before committing;
- `COMMIT_AUTHORITY.paths` must list every repository path authorized for the commit exactly, including both source and destination paths of any rename;
- reject any in-progress Git operation that can alter commit ancestry or semantics, including merge, rebase, cherry-pick, revert, bisect, and equivalent operation markers such as `MERGE_HEAD`, `rebase-merge`, `rebase-apply`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `sequencer`, and `BISECT_LOG` resolved through `git rev-parse --git-path`;
- record `PRE_COMMIT_HEAD` and the verified complete pre-commit ref map immediately before committing;
- require `PRE_COMMIT_HEAD` to equal the exact expected parent baseline from `EXPECTED_BASE.head`;
- immediately before committing, `git diff --cached --no-renames --name-only -z` must equal `COMMIT_AUTHORITY.paths` exactly, with no additional staged path;
- if stage authority is false, perform no staging and require the pre-existing cached path set to match both `EXPECTED_BASE.staged_paths` and `COMMIT_AUTHORITY.paths` exactly;
- if stage authority is false, also recompute the raw staged-content digest and semantic index manifest immediately before commit and require exact equality with `EXPECTED_BASE.staged_diff_sha256` and `EXPECTED_BASE.index_semantic_manifest_sha256`;
- if stage authority is true, require the post-stage cached path set to match `COMMIT_AUTHORITY.paths` exactly, its content digest to equal the verified post-stage digest, and its semantic index manifest to equal the verified post-stage manifest immediately before committing;
- `COMMIT_AUTHORITY.hooks_path` must be one exact absolute path outside the repository to a real directory that is not a symlink;
- immediately before commit, the hooks directory must exist and be empty; a missing, non-directory, symlinked, or nonempty hooks path is a blocker;
- after all staged checks, capture `AUTHORIZED_TREE=$(git write-tree)`; capturing the current tree alone is not a content-authorization check;
- before committing, enumerate `AUTHORIZED_TREE` using `git --no-replace-objects ls-tree -r --full-tree -z "$AUTHORIZED_TREE"` and compare its raw path/mode/object-ID tuples exactly with all verified stage-zero index entries whose intent-to-add bit is zero, sorted by raw path bytes; exclude intent-to-add entries only from this expected tree, retaining them in all semantic-index comparisons; reject missing, extra, or different tree entries so index tree-cache data cannot substitute for verified index contents;
- commit with hooks neutralized by setting `core.hooksPath` to exactly the verified-empty `COMMIT_AUTHORITY.hooks_path` for that commit invocation;
- immediately after commit, require `git rev-parse 'HEAD^{tree}'` to equal `AUTHORIZED_TREE` exactly; a mismatch is a blocker and the lane must not claim successful authorized packaging;
- require the new commit to have `parent_count = 1` and `sole_parent = PRE_COMMIT_HEAD` without an exception in this ordinary contract;
- after commit, require the ref-name set and all symbolic targets (including HEAD) unchanged; only the existing direct `refs/heads/<EXPECTED_BASE.branch>` value may move from `PRE_COMMIT_HEAD` to the verified new commit ID; every other direct ref must retain its exact pre-commit OID, and all pseudoref records must remain identical; verify symbolic resolutions from this map and record the resulting manifest;
- after commit, require the semantic index manifest to equal its verified pre-commit value; tree equality alone cannot detect index flag mutation;
- any merge commit or parent mismatch fails closed;
- create exactly the number of commits authorized;
- use the exact subject if provided;
- do not amend, rebase, squash, or rewrite history unless explicitly granted.

A commit must not package an unnamed, unrelated, baseline-drifted, or
hook-mutated staged change. Commit authority without an exact
`COMMIT_AUTHORITY.paths` set and exact verified-empty hooks path is insufficient,
and a commit-only lane with pre-existing staged content is forbidden unless both
its exact path set and its staged-content digest match the operator-declared
baseline immediately before commit.

The ordinary named-remote push profile is unsupported for publication under
this specification: the command below does not carry the operator-pinned old
value or immutable repository identity as enforced conditions of the write.
Its transport restrictions are retained as necessary constraints, not an
executable publication or dry-run route. PUSH_AUTHORITY.allowed: true fails
closed before preparation unless a separately reviewed, explicitly authorized
transport contract establishes both write bindings and its complete declared
API verifier context. No such Git write-binding mechanism is supplied here;
URL reads, broad credentials and post-write checks cannot substitute for it.
The separately authorized API profile in §12.1 has no ordinary Git push fallback.

When `PUSH_AUTHORITY.allowed` is false, omit every other push field. When
true, `remote`, `push_url`, `repository_identity`, `api_verifier_context_id`, `expected_destination`,
`execution_environment_names`, `hooks_path`, `execution_config_sha256`,
`execution_environment_sha256`, `branch`, `refspec`, and
`expected_local_ref_transitions` are required operator declarations made
before execution. api_verifier_context_id must resolve to the full explicit
API_EXECUTION_CONTEXTS schema in §§3 and 12.1, even for a separately authorized
Git transport contract. These declarations do not remove the unsupported
write-binding stop above. `remote` is one exact configured remote name, never an
option or URL operand. `branch` is one exact short branch name;
`refspec.destination` must equal `refs/heads/<branch>`.
`refspec.source` selects exactly one mode:

- `kind: exact_commit` with `oid: <full-commit-OID>`; omit `selector`.
- `kind: verified_lane_commit` with
  `selector: last_verified_authorized_commit`; omit `oid`. Resolve only a
  commit actually produced and fully verified under this envelope.

Pin the resolved source as `PUSH_SOURCE_OID` before push and prove it is the
authorized commit. Use exactly one literal
`<PUSH_SOURCE_OID>:<refspec.destination>` refspec. No floating HEAD, wildcard,
leading `+`, empty/deletion source, inferred refspec, extra refspec, force,
mirror, tags, prune, upstream-setting, or push-option arguments are allowed.

The ordinary push transport is one exact GitHub.com HTTPS repository URL in
`push_url`, without embedded credentials, query, or fragment. Other providers,
transports and custom remote helpers require a separate explicit transport and
identity contract. `repository_identity` requires `provider: github`,
`host: github.com`, the exact immutable repository `node_id`, and `provenance`
identifying trusted evidence that anchors that ID independently of the URL
lookup being checked. A repository name or URL is not an immutable identity.
Do not obtain the expected ID by adopting the current URL target's response.
A previously authorized PR/review node can anchor its owning repository;
verify that relationship and retain its evidence before the URL-target check.

`expected_destination` declares the exact old state of `refspec.destination`:
`kind: direct` requires its full expected commit `oid`; `kind: absent` omits
`oid` and requires authoritative evidence of absence in the identified repo.
Permission errors or failed reads are not absence. Never refresh this old state
from a differing live read. A subsequent authorized campaign phase may use only
its previously verified remote outcome as the next declared expectation.

Before any Git/config/URL/object/network call for push preparation, validate
and construct the child environment under the semantic policy below. Under
that same fixed command prefix and environment, run
`git remote get-url --push --all <remote>`; require exactly one expanded URL
equal byte-for-byte to `push_url`. Multiple push URLs fail closed even when
one matches. Through trusted read-only access to `https://api.github.com`,
query the repository identified by that exact URL and require its `node_id`
to equal the independent declaration. Verify the URL-to-repository relationship
without following a redirect and compare its exact destination state to
`expected_destination`. Recheck both immediately before invocation. A moved,
recreated, inaccessible, mismatching or uncertain endpoint fails closed.

`hooks_path` is independent of commit authority. Require that exact absolute
external directory to exist, be a real directory without symlinks/reparse
points, and be empty immediately before push. Do not create it under this
contract. Apply the following Git 2.43-compatible fixed invocation profile,
using argument arrays rather than shell interpolation:

```bash
git --no-optional-locks --no-replace-objects \
  -c core.hooksPath="<hooks_path>" -c core.fsmonitor=false \
  -c remote.<remote>.mirror=false -c push.followTags=false \
  -c push.pushOption= -c push.recurseSubmodules=no \
  -c push.autoSetupRemote=false -c push.useForceIfIncludes=false \
  -c push.negotiate=false -c push.gpgSign=false \
  -c gc.auto=0 -c maintenance.auto=false \
  -c http.followRedirects=false -c http.sslVerify=true \
  push --porcelain --no-verify --no-follow-tags --recurse-submodules=no \
  --signed=false --no-force <remote> <PUSH_SOURCE_OID>:<refspec.destination>
```

The empty `push.pushOption` clears inherited values. The explicit arguments
and overrides disable extra tag/submodule pushes, mirroring, signing, automatic
upstream setup, negotiation, maintenance and hooks without editing config.
See [Git 2.43 push options](https://git-scm.com/docs/git-push/2.43.0).
Resolve URL-specific HTTP settings too: require effective redirects disabled
and TLS verification enabled for `push_url`; a more-specific setting must not
defeat the profile. Reject configured custom `remote.<remote>.vcs`,
nonstandard receive-pack commands, external transport overrides, or any
effective setting that bypasses these controls. Require direct HTTPS: reject
effective nonempty `remote.<remote>.proxy`, URL-specific `http.proxy`, and
custom `http.curloptResolve`. Use the independently trusted installed Git/OS
CA policy; arbitrary CA, TLS-backend or proxy overrides require a separate
transport contract. The configuration digest never authorizes a prohibited
mode. Credential access retains its existing authority.

The child-environment policy is semantic, before its digest is accepted:

- Inspect inherited names using host case rules and reject any presence,
  regardless of value, of `GIT_SSL_*`, `GIT_HTTP_*`, `GIT_CURL_*`,
  `GIT_PROXY_*`, `CURL_*`, `SSL_*`, `SSLKEYLOGFILE`, `OPENSSL_*`, and
  `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, or `NO_PROXY` in any casing.
  Other TLS-library bypass/trust overrides are unsupported as well.
  In particular, Git treats even empty, `0`, or `false` values of
  `GIT_SSL_NO_VERIFY` as disabling verification; `-c http.sslVerify=true`
  cannot repair this. See [Git 2.43 HTTP implementation](https://github.com/git/git/blob/v2.43.0/http.c).
- Build a new map from the exact declared `execution_environment_names`
  allowlist, never by forwarding the inherited environment or by subtracting
  a denylist. Only verified platform/home/temp/locale bindings, trusted PATH,
  and independently approved exact credential inputs may be included.
  Unknown unrelated names are omitted; a required unsupported binding stops
  execution. Names alone do not authorize unsafe values.
- Pin the verified absolute Git executable, its trusted installation's exec-path
  and HTTPS helper, existing approved credential-helper executables, and an
  exact PATH containing only declared absolute trusted directories. Retain
  these paths and content identities in the execution evidence and recheck
  them at the same boundaries as the environment digest. Prove effective
  helper selection equals those pinned paths; hashing an unused approved
  executable is insufficient. Reject untrusted
  helper/config commands; do not provision a helper or trust store.
- Do not inherit Git config overrides, `GIT_EXEC_PATH`, askpass overrides,
  `GIT_TRACE_*`, `GIT_REDIRECT_*`, loader/interpreter injection, or shell startup
  variables. Credential exceptions must name exact independently approved
  inputs; no wildcard `GCM_*`, `GH_*`, or similar exemption. They cannot
  bypass the transport/TLS denials above.
- Check the constructed map again for forbidden bindings, then seal it. Apply
  the equivalent approved environment/executable policy to the independent
  API verifier, with its own exact necessary credential inputs and evidence.
  Matching digests prove stability only after these semantic checks; they
  cannot authorize a prohibited value or turn a failed check into approval.

To compute `execution_config_sha256`, replace only the push subcommand and
its arguments in that exact prefix with
`config --null --list --show-origin --show-scope --includes`. Require success
and hash the complete raw stdout with lowercase SHA-256, preserving ordering,
origins, scopes and repeated values; retain it privately for equality checks.
This covers remote URLs/push URLs, rewrites, tracking mappings, transport and
push settings from every included scope plus the fixed overrides.
`execution_environment_sha256` binds the exact child environment supplied to
those Git calls: sort names by UTF-8 bytes and concatenate
`name NUL SHA256(UTF8(value)) NUL`, then hash that stream with SHA-256.
Retain the map privately. The semantically validated allowlisted child
map must have unique names under host case rules: on case-insensitive hosts, coalesce case variants
only when their values are identical, retaining the first UTF-8-sorted spelling;
conflicting values fail closed. Hash and pass that same resulting map.
Use the same sealed executable, prefix and environment for URL resolution,
config inspection and push. Quiesce concurrent configuration/environment
writers; require two equal captures at preflight and recheck before/after
validators and immediately before/after push. Do not adopt drift or print
credentials, raw configuration values, or secret environment values.
At preflight, before object traversal or push preparation, reject any effective
`extensions.partialClone` or enabled `remote.*.promisor`; this ordinary contract
cannot lazily fetch missing objects from another endpoint. Missing objects fail
closed without fetch or automatic provisioning.
These controls also apply to any authorized push dry-run.

`expected_local_ref_transitions` is an exact list of unique local
remote-tracking ref names, or explicit `[]` when none may change. Each entry
has `ref`, typed `old`, and typed `new`. `old.kind` is `absent` (omit `value`)
or `direct` with its exact full old OID in `value`. `new` must be
`{kind: direct, value_from: PUSH_SOURCE_OID}`. Reject symbolic tracking
destinations in this ordinary push contract; it cannot create/retarget
symbolic refs or delete refs. Match the named transitions to the declared
remote/destination's verified tracking mapping; this list grants no authority
over unrelated refs.

Before push, revalidate the complete last verified local state: canonical
root, branch, HEAD, tracked paths/raw diff/content manifest, staged paths/digest,
semantic index and empty resolve-undo data, both ignored/nonignored untracked
path sets and content manifests, and complete refs/pseudorefs. Seal that input
along with the verified push configuration, environment and empty hooks path.
Verify each declared old ref value and derive the entire expected post-map by
substituting the pinned source OID only at the declared refs. Never fill missing
authority from observation or refresh expected values after push.

After every push attempt, including failure, recompute that complete local
state and push execution context. Require equality for all non-ref state;
only the exact declared tracking-ref transitions may differ. On success the
complete map must equal the derived post-map. On failure any observed partial
transition must still be within those exact declarations; inspect the approved
remote read-only to determine the actual outcome, then stop without claiming
success, blind retries or automatic rollback. A hook/transport-created file,
same-path byte mutation, index flag change or unlisted ref change fails closed.
On successful push, independently require the same declared repository
`node_id` and the destination's direct OID equal to `PUSH_SOURCE_OID`.
Record source OID, literal refspec, effective URL, identity provenance,
expected/observed repository IDs, expected old destination and observed
before/after state, environment-policy result, executable/path identities,
configuration/environment digests, hook proof, complete local comparisons,
declarations, pre/post ref maps/digests and independently verified remote
result in final evidence.

Required push truths, only when a push was attempted:

```text
PUSH_ENDPOINT_AND_CONFIG_VERIFIED=YES
PUSH_REPOSITORY_IDENTITY_MATCH=YES
PUSH_EXPECTED_DESTINATION_MATCH=YES
PUSH_ENVIRONMENT_SEMANTIC_POLICY=PASS
PUSH_HOOKS_DISABLED=YES
POST_PUSH_COMPLETE_LOCAL_STATE_RECHECK=YES
POST_PUSH_REFS_TRANSITION_VERIFIED=YES
```

The former plain-push example is disabled because its write bindings are not
established. The supported API example is in §12.1; it is independently gated.

```text
PUSH_AUTHORITY:
  allowed: false
```

Ordinary VIONA local commit authority uses:

```text
IN_PROGRESS_GIT_OPERATION_CHECK=YES
PRE_COMMIT_HEAD_PINNED=YES
POST_COMMIT_REFS_TRANSITION_VERIFIED=YES
POST_COMMIT_PARENT_COUNT_ONE=YES
POST_COMMIT_PARENT_EQUALS_PRE_COMMIT_HEAD=YES
TREE_EQUIVALENCE_STILL_REQUIRED=YES
AUTHORIZED_TREE_MATCHES_VERIFIED_INDEX=YES
MERGE_COMMIT_AUTHORITY=NO
```

Merge-commit authority is never implied by commit authority. A true
`merge_commit_allowed` value is unsupported by this ordinary-commit contract.
A merge needs a separate explicit merge-specific contract and any required
freeze release. It must not bypass this gate using a direct merge command.

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

### 12.1 Existing-branch API publication profile

REMOTE_COMMIT_AUTHORITY and LOCAL_SYNC_AUTHORITY are independent, default-false
authorities. Enabled server publication also requires REMOTE_MUTATION_AUTHORITY
allowed: true with github.createCommitOnBranch explicitly listed; contradictory
or missing authority fails closed. A disabled block contains only allowed: false. Omit
API_EXECUTION_CONTEXTS and API_REQUEST_RECORDS when no enabled operation needs an API context.
Enabled publication must reference its single DURABLE_ATTEMPT_AUTHORITY and
EXPECTED_PR_BINDING by exact ID, with matching operation_id and authorization.
It must also reference required ASSOCIATED_PR_SCOPE and explicitly accepted
PR_METADATA_RACE_ACCEPTANCE by ID. Both reuse the same EXPECTED_PR_BINDING;
no independently editable second PR identity declaration is allowed.
A disabled DURABLE_ATTEMPT_AUTHORITY contains only allowed: false; an unused
EXPECTED_PR_BINDING or ASSOCIATED_PR_SCOPE contains only required: false. An
unaccepted PR_METADATA_RACE_ACCEPTANCE contains only accepted: false. Missing,
false or inapplicable acceptance disables this bounded API profile. No disabled block supplies
an implicit marker, PR, request, storage or publication permission.
COMMIT_AUTHORITY governs locally authored commits; PUSH_AUTHORITY governs Git
push. Neither grants server commit creation or local synchronization. An API
publication creates its one authorized commit on GitHub: it does not require
a preliminary local commit or authorize an additional commit afterward.

The only supported API publication profile here is
github_graphql_existing_branch_replace_v1. It supports exactly two existing,
regular, non-executable text files with unchanged Git mode 100644. Its exact
paths must equal the operator's MODIFY_ALLOWLIST and the complete candidate
diff against expected_head_oid; CREATE_ALLOWLIST must be empty. Wildcards,
new paths, deletions, renames, symlinks, submodules, mode changes, absent-branch
creation and history rewriting are unsupported. A third path fails closed.

Required bindings address the three findings as follows:

| Finding | Required control |
| --- | --- |
| ATOMIC_DESTINATION_PRECONDITION | Include the unchanged expected_head_oid as expectedHeadOid in the actual createCommitOnBranch input; a read-before-write check is not its substitute. |
| IDENTITY_BOUND_REMOTE_WRITE | Target branch.id using the exact independently verified global Ref node, whose owning repository matches the independently anchored node_id and numeric_id. Do not select the write destination by a mutable repository slug. |
| DECLARED_API_VERIFIER_CONTEXT | Resolve both api_verifier_context_id and api_publisher_context_id to complete, explicitly declared API_EXECUTION_CONTEXTS records before using either context. |

The repository identity and its trusted provenance must predate the lookup
being verified. Query that repository node and the declared Ref node; verify
the Ref's repository, exact name, refs/heads/ prefix and commit target. Verify
the EXPECTED_PR_BINDING number AND node_id, owning/head/base repository IDs,
exact head Ref/OID, base_ref/OID and required open/unmerged/non-draft state with
auto-merge disabled. All three repository IDs must equal the independently
anchored repository; head_ref_node_id, head_ref and expected_head_oid must match
REMOTE_COMMIT_AUTHORITY. Bind base_ref as a full refs/heads/... name. Query the
exact PR node or the independently anchored repository plus declared number,
then compare both identities; never choose a PR from branch search results.
Missing declarations or mismatches block; observations do not fill authority.
Recheck before dispatch and after publication. Only expected_head_oid may
transition to the independently verified SERVER_COMMIT afterward; all other
conditions remain required. Never reopen, retarget or repair the PR to pass.
These read-only checks do not atomically lock PR metadata; they are separate
from the server's expectedHeadOid condition. Never replace an
expected ID or head with a newly observed value. The local baseline, branch,
full refs, operation-state, index and worktree controls in §§3, 6 and 11 still
apply. An explicitly authorized isolated checkout has its own prospective
baseline; it does not repair or approve historical drift elsewhere.

The selected controls rely on GitHub's published
[createCommitOnBranch contract](https://docs.github.com/en/graphql/reference/commits#createcommitonbranch)
and [CommittableBranch/FileChanges types](https://docs.github.com/en/graphql/reference/git).
The operator must explicitly accept this bounded reliance: no formal linearizability proof
is claimed; no undocumented Ref-ID reuse or lifetime
guarantee is claimed. Successful queries do not prove mutation permission.
Do not reclassify that acceptance as a newly established server guarantee.
Actual identity mismatch, unsupported context or permission rejection still
blocks. There is no ordinary Git push fallback.

#### Single declared open PR and scoped residual-risk disposition

ASSOCIATED_PR_SCOPE supports only SINGLE_DECLARED_OPEN_PR_ONLY. Its exact Ref
comes from EXPECTED_PR_BINDING.head_ref_node_id; its expected set is exactly
that binding's PR node ID AND number. Before dispatch, after publication and
at final closure, query the verified Ref node's associatedPullRequests
connection with states: [OPEN]. Read every page until hasNextPage=false.
Never use a search index or branch-name match as this inventory. Do not filter
by baseRefName, labels, draft/auto-merge state or any other optional criterion;
a PR on another base, including draft or auto-merge-enabled PRs, must remain
visible in the returned set. No multi-PR publication mode is supported.

Retain each page's request-instance ID, bound cursor, query-document and exact
payload seals under API_REQUEST_RECORDS, returned edge cursors and pageInfo,
totalCount, observation start/end timestamps and verifier context. Retain every
returned PR's node ID/number, owning/head/base repository IDs, exact head Ref
ID/name/OID, base ref/OID, OPEN/merged/draft/auto-merge values. Verify returned
heads belong to the expected repository AND Ref; an identically named branch
in a different repository is not equivalent. Compare all PR conditions with
EXPECTED_PR_BINDING, using the independently verified SERVER_COMMIT only for
the post-publication head transition. An observed extra PR must not be discarded.

Require the complete observed set to equal the declared singleton. Zero PRs,
another PR, wrong identities, missing/unreadable fields, partial GraphQL errors,
inconsistent totals/cursors/pages, duplicates, an incomplete inventory or an
actual access/coverage gap fails closed. Do not close, retarget, alter draft or
auto-merge, or otherwise repair any PR to pass. Evidence describes the complete
accessible connection returned under the verified API context, not omniscient
visibility beyond that contract. Pages and repeated inventories are observations,
not an atomic snapshot or a lock preventing another PR from becoming associated.

PR_METADATA_RACE_ACCEPTANCE must be explicit current operator authorization
applicable to this exact operation_id, REMOTE_COMMIT_AUTHORITY candidate/file
scope, EXPECTED_PR_BINDING and ASSOCIATED_PR_SCOPE. Validate all references,
operation and authorization provenance before enabling the profile. Authority
must predate the observation: returned metadata cannot supply missing acceptance.
An enabled typed example is a template, not live approval. Each future lane
needs its own explicit applicable acceptance; none is inferred from this text.

The required disposition is:

- ATOMIC_PR_METADATA_PRECONDITION=NOT_PROVIDED
- PR_METADATA_AND_MEMBERSHIP_RACE=EXPLICITLY_ACCEPTED_WITHIN_DECLARED_SCOPE
- TECHNICALLY_ELIMINATED=NO

Within this bounded mode only, the operator accepts PR metadata changing or
another open PR becoming associated with the head Ref between required
observations, including transient changes that may not be visible in those
observations. This removes a requirement for continuous atomic truth of the
PR metadata/membership observations; it does not remove the observations.
Every known pre-dispatch PR or set mismatch still forbids sending. Repository,
Ref, fixed expected head and sealed candidate/tree bindings remain required.
No repeated reads, local lock, one executor or conversation lock makes these
checks atomic. The server expectedHeadOid condition does not lock PR metadata
or membership. The server-atomic PR metadata precondition is not implemented.

A post-publication observable mismatch is an incident: record the actual remote
outcome and drift, then stop synchronization/closure without rollback, repair,
replay or an alternative writer. A final-closure mismatch likewise blocks
further closure. Postchecks detect observable outcomes, not every transient
change. Acceptance never covers a known extra PR, incomplete inventory, wrong
content/repository/Ref, authentication failure, protection bypass, merge or
deployment; it grants no other local/remote mutation authority. No ordinary Git push fallback
is permitted. Do not retrofit this disposition into historical publications.

Review/final evidence distinguishes technical findings fixed, accepted residual
risks, undispositioned actionable findings and unresolved threads. The exact
accepted metadata/membership limitation may be dispositioned as
ACCEPTED_RESIDUAL_RISK with the applicable authorization and observations; never
as TECHNICALLY_FIXED. A restatement of that same limitation is not a new technical
fix. A different control failure or broader impact cannot inherit this acceptance.

#### API execution context and request identity

Each referenced context must provide all fields in §3. The same context ID
may be selected explicitly for verifier and publisher; neither selection may
be inferred. executable_path is the exact absolute existing runtime/client
path; executable_sha256 hashes its file bytes. executable_provenance identifies
its independently trusted installation. runtime_version and runtime_identities
record the actual runtime and all relevant loaded HTTP/runtime assemblies,
their exact paths and byte SHA-256 values. helper_sha256 binds the reviewed
client/helper source bytes and exact launch arguments. A digest of a different
executable or unreviewed helper is insufficient.

environment_names is the exact closed child-environment allowlist.
environment_sha256 uses the §11 name/NUL/value-hash/NUL encoding for that API
process, independently from the Git environment. Retain the actual private
map for equality checks. Declare any runtime startup transformations and the
separate exact environment passed to a credential-accessor child. Reject
proxy/TLS/host overrides, loader injection and debug logging; names or hashes
never authorize unsafe values. configuration_policy declares the effective
working directory, trust/configuration sources, HTTP handler settings and
invocation policy. configuration_sha256 hashes UTF-8 JSON of those validated
nonsecret records with explicitly fixed field/array ordering; retain the
records and serialization definition, not only the digest. Secrets are never
part of public configuration evidence.

credential_source_reference names only the existing approved source and its
authorization provenance, not its value. credential_accessor declares the
exact local accessor executable/version/digest, arguments, private pipe and
child-environment policy, or an explicitly approved equivalent existing
credential input. An approved private accessor must use no shell, capture
stdout/stderr privately, and never send the credential to tests, Git, files,
arguments, environment variables, logs or the transcript. No search, login,
refresh, account switch or scope increase is implied. Verify expected_actor
with the declared verifier. Release references and dispose requests; managed
memory zeroization is not claimed.

For the supported .NET HTTP profile, create HttpClientHandler before use with
AllowAutoRedirect=false, UseCookies=false, UseDefaultCredentials=false and
UseProxy=false. tls_policy requires normal platform certificate validation,
no permissive callback or trust-store changes. Validate HTTPS, exact host
api.github.com, default port 443, empty userinfo/query/fragment and /graphql
before each production request. Attach Authorization only to that validated
request, never as a reusable arbitrary-host client default. Never follow
Location manually; every 3xx blocks. redirect_policy must retain successful
dummy-token loopback tests for 301/302/303/307/308, zero requests to the
Location destination, URL-policy rejection tests and sanitized error-output
tests, all performed before real credential access. HTTP loopback fixtures
do not prove that a real HTTPS downgrade attack was exercised.

retry_policy requires no application retry middleware, pagination of a
mutation, authentication replay or fallback client. Use a fresh handler and
connection context for publication, HTTP/1.1 exact where supported, and record
actual runtime behavior. Claim one application dispatch, not proven
exactly-once network delivery. An installed client that cannot meet these
controls is unsupported; do not silently substitute it or extract credentials
through another channel.

request_documents is the stable context allowlist of exact operation names/types,
query-document SHA-256 identities and authorized variable-binding sources.
It is not a place for one payload hash shared by multiple calls. Hash each
document's exact UTF-8 query string, including whitespace. Queries contain only
reads; publication contains exactly one top-level createCommitOnBranch write.

API_REQUEST_RECORDS is append-only execution evidence in the separately
authorized external evidence ledger. For each actual request, after its variables
are legitimately bound and before sending, append one complete record with a
unique request_id, declared context_id, operation_name/type, query_document_sha256,
authorized_variable_binding_sources, request_payload_sha256, phase and purpose.
All fields in an actual record are required. Unknown contexts, operations,
query hashes or value sources fail closed. A shared verifier/publisher context
is valid; the same context still requires distinct request records and seals.
Paginated and repeated queries each get a new request_id and a record of their
actual bound variables' payload identity, even if identical bytes yield the
same digest. Never overwrite an earlier record with a later hash.

Serialize the final request body to UTF-8 bytes after binding variables, hash
those exact bytes with SHA-256, retain the byte buffer and send that sealed
buffer. Do not reconstruct JSON after sealing. Verify any private-pipe byte
transfer against the seal before dispatch. The seal covers the request body,
not the request record containing its own hash; no self-reference is required.
Sealing grants no operation, storage or credential authority.

Declare permissible variable sources before execution, not fabricated future
values or hashes. Publication values come only from fixed destination/PR
declarations and sealed staged candidate bytes. Verification may use an actual
SERVER_COMMIT only after a successful response establishes that commit and its
repository/parent/tree bindings, followed by independent verification. A future
request record is absent until that request can be constructed; its absence
does not permit premature dispatch. A later verified server OID never replaces
the fixed expected head of the consumed publication request. Each metadata
mutation also receives its own seal and has no automatic replay on ambiguity.

Never log Authorization, credential values, replacement contents or Base64.
The nonsecret request record retains identities and authorized source references,
not secret variable values.

#### Candidate, dispatch and outcome

Select and authorize sealed_pre_validator_candidate comparison mode explicitly.
Prepare only the allowed replacements and preserve all other baseline state.
Staging remains independently authorized under §11. It may occur before the
API candidate's validators only when the operator explicitly permits that
order; otherwise validate working content first, then bind the authorized
stage transition and rerun required candidate validation. No stage authority
means no staging; pre-existing staged content must already match the exact
operator-declared paths and content identity. Reject any staged path, flag,
rename endpoint or filter transformation outside that authority.

Read publication bytes from the verified staged Git blobs. Record each exact
path, old/new blob OID, unchanged mode, byte length and SHA-256. Verify staged
bytes equal the tested raw working bytes without text-mode conversion.
Derive the entire expected tree independently from base_tree_oid plus only
these replacements; verify the base tree belongs to expected_head_oid.
Require this AUTHORIZED_TREE to equal git write-tree and independently
enumerated semantic index entries. Seal all complete local state and execution
contexts before validators; afterward require those identities unchanged.
Validator-created files, path-preserving byte changes, ignored/untracked
changes, index/flag changes, hooks or any unlisted ref change fail closed.

The actual input uses branch: {id: branch_node_id}, expectedHeadOid equal to
expected_head_oid, the exact message_headline and exactly two unique
fileChanges.additions entries containing RFC 4648 Base64 of the sealed blob
bytes. Deletions are omitted; no branchName or repositoryNameWithOwner is
allowed. FileAddition performs replacement here; it grants no creation scope.
Validate the response-selection schema read-only before publication.

Immediately before dispatch, reverify the remote identities/head/base, actor,
contexts, candidate/index/tree and complete sealed local state. use the declared DURABLE_ATTEMPT_AUTHORITY; no implicit evidence-file write is
permitted. Its marker_path and evidence_ledger_path are exact absolute paths
outside the checkout, with independently granted operations for each file.
Verify real parents/files, absence of links/reparse points or repository aliases,
and the declared local fixed NTFS storage contract. The evidence ledger must
already exist under separate exact create authority; append permission does
not grant creation, replacement or truncation. Parent-directory creation also
needs separate exact authority. Fixtures never satisfy the production marker.

The durable block declares an operator-supplied operation_id and authorization
reference, record version/encoding/field order, exclusive reservation, persistence
and recovery rules. Its operation_id must match REMOTE_COMMIT_AUTHORITY. The
consumed-intent record uses the ordered field names in §3: identities come from
the anchored repository and EXPECTED_PR_BINDING; expected_head_oid comes from
the fixed publication authority; authorized_tree comes from the independently
derived tested candidate; request_id/payload digest/context_id come from that
publication's API_REQUEST_RECORDS entry; helper_sha256 is the verified client
source. consumed is true, record_version is integer 1, PR/repository numbers
are integers, OIDs and SHA-256 values are lowercase hexadecimal, and other
identity/reference fields are exact strings. Encode fixed-order compact JSON
as UTF-8 without BOM or trailing newline. The marker does not contain its own
hash; record its byte SHA-256 separately after successful read-back.

Before trying reservation, check retained evidence for this operation. A missing marker
after any reservation/dispatch evidence blocks; it never restores allowance.
Append and flush a nonsecret reservation-intent event to the authorized ledger.
Reserve the exact marker with FileMode.CreateNew and FileShare.None, using a
read/write FileStream. CreateNew is the exclusive reservation; an exists-check
followed by overwrite is forbidden. Write the complete consumed-intent bytes,
call the actual FileStream.Flush(true), then read back through the same held handle
and verify exact length/bytes, decoding and every fixed binding before dispatch.
The process must retain this exclusive handle through the one dispatch and
outcome recording, then close it without modifying or deleting the marker.
Only the process that created, persisted and verified that marker may dispatch.
No validator or evidence update may create a third checkout path.

Any existing marker, sharing violation, malformed/partial record, wrong binding,
unreadable record, write/flush/read-back failure or storage-integrity uncertainty
forbids dispatch. A partial JSON write is consumed/uncertain evidence; the whole
JSON write is not claimed indivisible. Existing markers after restart allow only
read-only reconciliation, including when valid and no server effect is found.
Never truncate, replace, delete, reuse or resume sending from a marker. A new
path or operation_id requires separate operator authority; the executor cannot
mint a successor to reset a budget. A separately authorized successor operation
preserves the prior consumed record and prior budget accounting.

This is conservative process-restart recovery under the validated local
filesystem contract. It is not immunity to privileged deletion, restored
backups, storage failure or every power-loss scenario, and it is not distributed
exactly-once delivery. Storage uncertainty fails closed. clientMutationId is
correlation only, not an idempotency guarantee.

HTTP success alone is insufficient. Reject GraphQL errors, missing/partial
data and mismatched results. Independently requery the commit and exact Ref:
require the anchored repository, exactly one parent equal to expected_head_oid,
and the full resulting tree equal to AUTHORIZED_TREE. Verify both replacement
blobs/modes and every other tree entry, authorized commit purpose, authenticated
authorship, PR/Ref target and unchanged protected base. GitHub-generated
author/committer/signature metadata is permitted; no local commit OID need be
precomputed. The complete local index, worktree and refs state must remain
unchanged during publication and verification, before separate synchronization.

On any 3xx, stale-head/permission error, GraphQL error, transport failure,
timeout or uncertainty, preserve evidence, perform only authorized read-only
reconciliation, then stop. Never resend, change the expected head, push,
upload alternate blobs/trees, escalate permission or fabricate rollback.
A commit found during reconciliation is evidence, not replay authority.
Do not claim zero remote effects for an ambiguous outcome.

#### Separately authorized local synchronization

LOCAL_SYNC_AUTHORITY must name the exact checkout root, existing direct branch,
old OID, verified server-commit source, approved object-import URL, sealed Git
execution context and exact verified-empty external hooks directory. No
authority applies to another checkout. Import only the literal verified
server OID and necessary objects when missing: no tags, ref mappings, tracking
updates, FETCH_HEAD write, submodules, lazy fetch, maintenance or commit-graph
write. Use the independently verified no-redirect/TLS Git read context and
only separately approved existing credential inputs; do not pass the API
credential to Git. Unsupported installed controls or missing objects block.

Verify imported object identity, sole parent and complete tree locally.
Require symbolic HEAD still attached to the named direct branch at the exact
old OID, index equal to AUTHORIZED_TREE/server tree, candidate raw bytes and
all other sealed state unchanged, and live PR/base still as verified. Perform
one old-value-guarded git update-ref on only that existing branch with explicit
new and old OIDs and hooks disabled. No local commit, reset, checkout overwrite,
read-tree repair, stash, merge, rebase or amend is permitted by synchronization.

Afterward, only the declared branch old-to-server transition may differ;
retain every other direct/symbolic/pseudoref identity, semantic index and raw
working bytes. Require local HEAD equal to verified remote HEAD and Git-clean
worktree. Separately authorized object-store/lock/reflog effects are Git
metadata, not new worktree files. Preserve state and report publication success
with local-sync-incomplete if synchronization fails; never republish.

Final evidence retains the resolved DURABLE_ATTEMPT_AUTHORITY, EXPECTED_PR_BINDING,
ASSOCIATED_PR_SCOPE and PR_METADATA_RACE_ACCEPTANCE, all complete pre-dispatch,
post-publication and final inventories with request/page seals and limitations,
observed drift and the separate technical-fix/residual-risk disposition counts,
exact authorized storage paths/operations, operation/authorization identity,
marker bytes/digest and reservation/Flush(true)/same-handle read-back/outcome
results. Retain every API_REQUEST_RECORDS entry and context fingerprint, exact
PR pre/post comparisons, tested tree/blobs, server parent/tree/Ref proof,
complete pre/post local records and any separately authorized sync transition.
Report reservation, application dispatch and server outcome separately; a
reserved or partial marker with zero sends still forbids a fresh attempt. Retain maps and timestamps, not hashes
alone. PR review/thread actions, human review requests, workflows, Gate, merge
and deploy still need their own exact authority. A path/status reviewed-scope
digest does not replace content tree/blob evidence.

#### Typed example, not live session evidence

The following is a partial API envelope example. Angle-bracket values are
required typed substitutions from independently verified lane evidence, not
fabricated live identities. All ordinary envelope scope/baseline/validator
fields still apply. Every typed substitution below must be supplied and verified before use;
no placeholder or context reference infers permission.

~~~text
COMMIT_AUTHORITY:
  allowed: false
PUSH_AUTHORITY:
  allowed: false
REMOTE_COMMIT_AUTHORITY:
  allowed: true
  profile: github_graphql_existing_branch_replace_v1
  repository_identity:
    node_id: <independently-anchored-repository-node-id>
    numeric_id: <independently-anchored-repository-numeric-id>
    provenance: <trusted-existing-identity-evidence-reference>
  branch_node_id: <verified-global-ref-node-id>
  branch_ref: refs/heads/<exact-existing-authorized-branch>
  expected_head_oid: <fixed-authorized-old-commit-oid>
  base_tree_oid: <that-commit-tree-oid>
  paths:
    - docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md
    - docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_SPEC.md
  replacement_count: 2
  content_source: sealed_validated_staged_blobs
  tree_source: independently_derived_base_tree_plus_replacements
  max_commits: 1
  max_attempts: 1
  message_headline: <exact-authorized-commit-subject>
  api_verifier_context_id: api_context
  api_publisher_context_id: api_context
  mutation_document_sha256: <sealed-exact-mutation-document-sha256>
  operation_id: <separately-authorized-successor-operation-id>
  durable_attempt_authority_id: publication_attempt
  expected_pr_binding_id: declared_pr
  associated_pr_scope_id: singleton_scope
  metadata_race_acceptance_id: scoped_acceptance
DURABLE_ATTEMPT_AUTHORITY:
  allowed: true
  id: publication_attempt
  operation_id: <same-separately-authorized-successor-operation-id>
  authorization_reference: <explicit-current-operator-authorization>
  marker_path: <exact-authorized-absolute-external-marker-path>
  evidence_ledger_path: <exact-authorized-absolute-external-ledger-path>
  local_file_operations:
    marker: [create_new_exclusive, write_initial_record, flush_to_disk, read_same_handle, read_existing_for_reconciliation, retain]
    ledger: [append_nonsecret_records, flush_to_disk, read]
  storage_contract: verified_local_fixed_NTFS_real_paths
  record_version: 1
  record_encoding: UTF8_no_BOM_ordered_compact_JSON_no_newline
  record_field_order: [record_version, encoding, operation_id, authorization, marker_path, consumed, repository_node_id, repository_numeric_id, pr_node_id, pr_number, head_ref_node_id, head_ref, expected_head_oid, authorized_tree, request_id, request_payload_sha256, clientMutationId, context_id, helper_sha256]
  reservation: FileMode.CreateNew
  sharing: FileShare.None
  persistence: FileStream.Flush(true)
  recovery: existing_or_uncertain_means_read_only_reconciliation
EXPECTED_PR_BINDING:
  required: true
  id: declared_pr
  number: <explicit-authorized-PR-integer>
  node_id: <explicit-authorized-PR-node-id>
  owning_repository_node_id: <same-anchored-repository-node-id>
  head_repository_node_id: <same-anchored-repository-node-id>
  base_repository_node_id: <same-anchored-repository-node-id>
  head_ref_node_id: <same-verified-global-ref-node-id>
  head_ref: refs/heads/<same-exact-existing-authorized-branch>
  expected_head_oid: <same-fixed-authorized-old-commit-oid>
  base_ref: refs/heads/<explicit-authorized-base-branch>
  expected_base_oid: <fixed-authorized-base-commit-oid>
  state: OPEN
  merged: false
  draft: false
  auto_merge: disabled
ASSOCIATED_PR_SCOPE:
  required: true
  id: singleton_scope
  policy: SINGLE_DECLARED_OPEN_PR_ONLY
  expected_pr_binding_id: declared_pr
  head_ref_source: EXPECTED_PR_BINDING.head_ref_node_id
  connection: Ref.associatedPullRequests
  states: [OPEN]
  optional_filters: none
  completeness: all_pages_until_hasNextPage_false
  mandatory_observations: [pre_dispatch, post_publication, final_closure]
  mismatch_or_incomplete: block_without_repair

PR_METADATA_RACE_ACCEPTANCE:
  accepted: true
  id: scoped_acceptance
  authorization_reference: <explicit-current-applicable-operator-race-acceptance>
  operation_id: <same-separately-authorized-successor-operation-id>
  expected_pr_binding_id: declared_pr
  associated_pr_scope_id: singleton_scope
  publication_scope_source: REMOTE_COMMIT_AUTHORITY
  accepted_interval_risks: [metadata_between_observations, membership_between_observations, unobserved_transient_changes]
  mandatory_observations: [pre_dispatch, post_publication, final_closure]
  atomic_pr_metadata_precondition: NOT_PROVIDED
  technically_eliminated: false
  known_pre_dispatch_mismatch: block
  observable_post_publication_mismatch: incident_stop_closure_no_rollback_or_retry
  additional_authority: none

LOCAL_SYNC_AUTHORITY:
  allowed: true
  root: <explicitly-authorized-absolute-checkout-root>
  branch_ref: refs/heads/<same-exact-existing-authorized-branch>
  expected_old_oid: <same-fixed-authorized-old-commit-oid>
  new_oid_source: verified_server_commit
  object_import_url: https://github.com/example/project.git
  git_execution_context_reference: <complete-approved-Git-read-and-update-context>
  hooks_path: <verified-empty-external-absolute-hooks-directory>
  max_ref_updates: 1
REMOTE_MUTATION_AUTHORITY:
  allowed: true
  operations:
    - github.createCommitOnBranch
API_EXECUTION_CONTEXTS:
  - id: api_context
    executable_path: <trusted-existing-absolute-runtime-path>
    executable_sha256: <verified-executable-byte-sha256>
    executable_provenance: <independent-installed-runtime-evidence>
    runtime_version: <actual-runtime-version>
    runtime_identities: <exact-HTTP-and-runtime-assembly-paths-and-sha256-values>
    helper_sha256: <reviewed-helper-source-byte-sha256>
    endpoint: https://api.github.com/graphql
    request_documents: <approved-names-types-query-sha256-and-variable-bindings>
    environment_names: <exact-closed-API-process-environment-name-list>
    environment_sha256: <verified-name-NUL-value-hash-NUL-sha256>
    configuration_policy: <exact-working-directory-launch-arguments-and-effective-trust-handler-records>
    configuration_sha256: <canonical-nonsecret-configuration-record-sha256>
    credential_source_reference: <approved-existing-OAuth-source-provenance>
    credential_accessor: <exact-existing-accessor-identity-arguments-private-pipe-and-child-environment>
    expected_actor: <independently-authorized-account-login>
    tls_policy: platform_validation_no_bypass
    redirect_policy: tested_handler_no_redirect_no_manual_follow
    retry_policy: one_application_dispatch_no_replay_fresh_HTTP1_1_context
API_REQUEST_RECORDS:
  - request_id: <unique-preflight-request-id-created-when-bound>
    context_id: api_context
    operation_name: <declared-preflight-query-name>
    operation_type: query
    query_document_sha256: <actual-approved-query-document-sha256>
    authorized_variable_binding_sources: <fixed-declared-repository-PR-Ref-identities>
    request_payload_sha256: <actual-preflight-byte-seal-after-binding>
    phase: preflight
    purpose: verify_declared_PR_and_destination
  - request_id: <different-publication-request-id-created-when-bound>
    context_id: api_context
    operation_name: <declared-publication-mutation-name>
    operation_type: mutation
    query_document_sha256: <actual-approved-mutation-document-sha256>
    authorized_variable_binding_sources: <fixed-destination-plus-sealed-staged-candidate>
    request_payload_sha256: <actual-publication-byte-seal-after-binding>
    phase: publication
    purpose: create_one_authorized_successor_commit
~~~

These two records illustrate distinct requests using the same context. Every
placeholder is a type/value-source illustration, not live evidence or authority.
In a real lane append each record only when its bytes exist and are sealed;
do not populate the second record or a future verification record in advance.
Later read/metadata calls append their own complete records and require their
own applicable authority. The marker references only the actual publication
request record, never a fixture or verifier record.

Trace every enabled requirement through its declaration and evidence:

| Requirement | Schema and authorized source | Permitted action and check | Failure/restart and example |
| --- | --- | --- | --- |
| Durable attempt | DURABLE_ATTEMPT_AUTHORITY, operator-granted exact external paths and operation_id | CreateNew/None, write once, Flush(true), same-handle read-back, retained handle through dispatch/outcome | Existing, partial, missing-after-evidence or uncertain state blocks; typed publication_attempt example |
| Request identity | Stable API_EXECUTION_CONTEXTS plus append-only API_REQUEST_RECORDS, declared variable sources | Bind legitimate variables, seal exact UTF-8 buffer, verify and send those bytes once | Changed bytes/unknown source blocks; distinct preflight/publication example records |
| Singleton scope | ASSOCIATED_PR_SCOPE references the one EXPECTED_PR_BINDING | Complete unfiltered OPEN connection of the exact Ref, all page/request seals, pre/post/final singleton equality | Missing/extra/incomplete/mismatched results block; singleton_scope example |
| Metadata race disposition | PR_METADATA_RACE_ACCEPTANCE references the same PR/scope and exact authorized operation | Explicit applicable operator acceptance plus mandatory observations; no atomic metadata enforcement | Missing acceptance disables; known mismatch blocks; observed post-drift is an incident; scoped_acceptance example |
| PR identity | EXPECTED_PR_BINDING referenced by publication, operator-provided IDs/state | Verify node AND number, all repository/head/base/state fields before/after | Any mismatch blocks without repair; only verified post-publication head transition |


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
| `BLOCKED_VIONA_CODEX_BASELINE_DRIFT` | Root, branch, HEAD, complete refs, staged, tracked, or ignored/nonignored untracked baseline identity does not match the envelope. |
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

This example explicitly authorizes sealing the implemented candidate before
validators. Its created file remains in the nonignored untracked manifest until
the separately authorized stage step. The candidate records the actual changed
tracked paths and content identities; it does not claim an empty post-state.
Staging occurs only after validation and must preserve the validated bytes.
Replace the illustrative baseline SHAs and manifest placeholder with verified
exact values before authorizing a real lane. A clean worktree still has a
nonempty tracked manifest and semantic index manifest when indexed files exist.
The example also requires empty resolve-undo output at every index checkpoint.
Its complete refs manifest stays at baseline through implementation, validators,
and staging. Only the verified ordinary commit moves the existing branch ref;
all other direct refs and every symbolic target remain unchanged.

```text
PROJECT:
  name: VIONA

CANONICAL_ROOT:
  path: C:\KNG\ket-noi-eu

EXPECTED_BASE:
  branch: docs/example-local-implementation
  head: 0000000000000000000000000000000000000000
  refs_manifest_sha256: <required-baseline-refs-manifest-sha256>
  parent: 0000000000000000000000000000000000000000
  tree_state: clean
  unstaged_tracked_paths: []
  unstaged_tracked_diff_sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  tracked_worktree_manifest_sha256: <required-baseline-manifest-sha256>
  staged_paths: []
  staged_diff_sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  index_semantic_manifest_sha256: <required-baseline-index-semantic-manifest-sha256>
  untracked_paths: []
  untracked_manifest_sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
  ignored_untracked_paths: []
  ignored_untracked_manifest_sha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

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

POST_VALIDATOR_STATE_RECHECK:
  required: true
  comparison_source: sealed_pre_validator_candidate
  capture: after_authorized_implementation_before_first_validator
  unauthorized_delta: fail_closed

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
  post_stage_paths:
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
  hooks_path: C:\VIONA\empty-hooks
  merge_commit_allowed: false

PUSH_AUTHORITY:
  allowed: false

REMOTE_COMMIT_AUTHORITY:
  allowed: false

DURABLE_ATTEMPT_AUTHORITY:
  allowed: false

EXPECTED_PR_BINDING:
  required: false

ASSOCIATED_PR_SCOPE:
  required: false

PR_METADATA_RACE_ACCEPTANCE:
  accepted: false

LOCAL_SYNC_AUTHORITY:
  allowed: false

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
    - sealed candidate identities and post-validator comparisons
    - staged-content and ordinary commit ancestry proof
    - git state
    - remote effect and applicable push endpoint/config/hook/state proofs
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
