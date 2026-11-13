# VIONA Codex Autonomous Execution Envelope — Local Exact Create V2 Specification

`SPECIFICATION_ID=VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_LOCAL_EXACT_CREATE_V2_SPEC`  
`ENVELOPE_CONTRACT.schema="VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"`  
`profile_id="VIONA_BME_PACK_A_SOURCE_CREATE_V1"`  
`STATUS=TECHNICAL_PROPOSAL_NOT_ADOPTED`  
`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED`  
`EXECUTION_AUTHORITY=NONE`

## 1. Scope and default deny

This document is the self-contained, versioned successor contract for one bounded local exact-create profile. It specifies data, validation, ordering, security, release, outcome, and compatibility semantics only. It does not authenticate an Operator message, enable a parser or executor, grant filesystem authority, install a policy pin, authorize Pack A, or widen any legacy envelope.

Legacy envelope semantics remain unchanged. A legacy `CREATE_ALLOWLIST` or `MODIFY_ALLOWLIST` never acquires typed local-create power. The typed contract is considered only after exact dispatch on both the V2 schema marker and the profile ID above. Missing, unknown, or mixed versions, a V1 envelope carrying `LOCAL_CREATE_AUTHORITY`, nonempty legacy create/modify paths under this profile, an unknown key, a duplicate key, or an unresolved imported type blocks before effect.

## 2. Effective-definition and precedence law

The normative source modules are incorporated below in exact order M00 through M15. The effective contract is evaluated by these deterministic rules:

1. M00 is the base proposal. M01 through M06 apply in order and replace only the exact types, fields, variants, predicates, tables, or use sites they explicitly supersede or redefine.
2. M07 through M15 are applied in order A through I. The revision rules are exact: Five-type V1_1 replaces Five-type V1; VERIFIED hierarchy V1_2 replaces VERIFIED hierarchy V1_1 and V1; NOT_PERFORMED binding V1_1 replaces NOT_PERFORMED binding V1; H supplements A through G; I supplements A through H.
3. A later explicit replacement is the sole effective definition at that use site. The replaced text remains below only as provenance and has no simultaneous normative force. Unchanged constraints flow forward.
4. The normative payload of a module is every exact type definition, schema marker, key set, literal, projection, digest law, equality, algorithm, ordering rule, compatibility table, validation predicate, and rejection rule that it states. Status labels, authority disclaimers, provenance narration, environment measurements, bounded-check counts, review verdicts, and next-action lines are evidence context and are not schema fields or authority.
5. If an implementation cannot determine a unique effective definition under rules 1 through 4, or encounters an undeclared conflict, it must block. It may not select a permissive interpretation.
6. Examples are non-authorizing. No sample `allowed` value, reference, hash, path, plan, report, or outcome is an Operator authorization or runtime fact.

## 3. Fixed Pack A non-authorizing profile bindings

The exact effect order is D1, D2, D3, D4, F1, F2, F3, F4. It contains four `CREATE_NEW` directory effects followed by four `CREATE_NEW` file effects, no ninth effect, no retry, and no automatic cleanup or repair.

| Effect | Exact path | Parent binding | Raw bytes | SHA-256 |
| --- | --- | --- | ---: | --- |
| D1 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1` | existing evidence parent | — | — |
| D2 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload` | D1 readback | — | — |
| D3 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload\tests` | D2 readback | — | — |
| D4 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload\vectors` | D2 readback | — | — |
| F1 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload\BME_PACK_A_SCHEMA_CATALOG_V1.json` | D2 readback | 92752 | `af19a873d7b1fafa82a85c79d685dd5d22281d6d5fd717b5dc51396e7f0ce6b6` |
| F2 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload\BME_PACK_A_MERGE_PROVENANCE_V1.json` | D2 readback | 14980 | `5cd5d387299f861c68ef5cf750b2f248609c85b2a678d31a25fe643e87a6c9e6` |
| F3 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload\tests\Test-VionaBmePackAStaticV1.ps1` | D3 readback | 14286 | `6507acf8215b2a400479b75bbc365801ce074a5f741ba9dc75e37882fc890255` |
| F4 | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1\payload\vectors\BME_PACK_A_TEST_VECTORS_V1.json` | D4 readback | 7958 | `22369ef1dd397a18785e53cda05de861f2fec95bf4fd9babfaf005a335f061f1` |

The table is specification data in a non-authorizing example. Runtime values such as retained object identities, volume identity, token identity, security descriptors, effective-Authz evidence, source parity, target absence, and trusted Operator-message verification remain future fail-closed observations.

## 4. Final A-to-I closure carried by the effective contract

The effective final unexpected-child enumeration parents are exactly `[D1,D2,D3,D4]`, at exactly one immediate-child level per parent. The pre-existing evidence parent is excluded. Expected children are D1→{D2}, D2→{D3,D4,F1,F2}, D3→{F3}, and D4→{F4}. Wrong identity or content at an expected path is a mismatch at that expected path, not an unexpected child; unexpected directories and reparse entries are not traversed.

`UnverifiedHierarchyReadback V1.observations` accepts the four path-bearing direct readback variants and `PathAssociatedUnavailableObservation V1` exactly as defined by G and I. Bare pathless `UNAVAILABLE` is rejected. H binds `PresentUnverifiedObjectReadback V1.failure_classification` to `TEXT(256)` without creating a global `TEXT` alias.

For an UnverifiedHierarchyReadback U, `U.errors` is exact decoded-JSON array equality with the ordered projection of `o.readback.error` for every path-associated unavailable observation `o` in serialized observation order. The projection is neither sorted nor deduplicated; multiplicity is retained. JSON equality never replaces trusted observation provenance.

A positive unexpected observation must be an actual immediate child returned inside the exact final D1–D4 scope. G remains separate: `PRE_EFFECT_UNEXPECTED_CHILD_SCOPE_V1=EMPTY_SET`; the final scope is never borrowed into pre-effect classification.

## 5. Normative source inventory

- M00 — V1, conversation item `msg_0b5598e1488f3eff016ac12c718c8087d2b085dff37363019e`, embedded UTF-8 bytes 10439, SHA-256 `887f57f0867dd45531425e0bf5c8640910e0ae0173af2a0d89f64f17cb0b0348` — Initial versioned local exact-create successor proposal
- M01 — V1.1, conversation item `msg_0b5598e1488f3eff016ac1303d1f4087d289327e03aa55dfb2`, embedded UTF-8 bytes 20635, SHA-256 `d2a068ba20f96f0215edd69faa5c871e5337ddd2dbf0afd63bbbb79d16f1cc35` — LC-01 through LC-05 contract closure
- M02 — V1.2, conversation item `msg_0b5598e1488f3eff016ac1331c5c3087d2b8196fdf036a4614`, embedded UTF-8 bytes 22772, SHA-256 `dc99bd8909dbf68ffe2dc0889ed097031dec4b27f7bbd3b04ab68671f70de6a0` — Security, report, hierarchy, and outcome type closure
- M03 — V1.3, conversation item `msg_0b5598e1488f3eff016ac135155c0087d2a2a603f0f057bf2a`, embedded UTF-8 bytes 9597, SHA-256 `ed7574da7450b14deedab9d6d619a860d2b24464f2b1e3f257d92a2822aaf204` — Release and hierarchy micro-closure
- M04 — V1.4, conversation item `msg_0b5598e1488f3eff016ac1382788d887d298e901eb8c61e527`, embedded UTF-8 bytes 11447, SHA-256 `c74df84e1ac75bf3d20c71b41165c7e6379a24b4e08e5d0fc38d0e994081b98d` — Mismatch and outcome compatibility closure
- M05 — V1.5, conversation item `msg_0b5598e1488f3eff016ac13a58654c87d28f2a5048e9f7320e`, embedded UTF-8 bytes 5171, SHA-256 `5325eff8e14123015fe486644a97ba1695e19463bc8104435c820d10f4875e04` — Final retained-handle release closure
- M06 — V1.6, conversation item `msg_0b5598e1488f3eff016ac13b74039887d2a82dde3e411010ba`, embedded UTF-8 bytes 4329, SHA-256 `27a883f8dfb10da55587b298cf3a90c0546efe8ad91967476a54b1175ca714f6` — Release delegation and handle-record correspondence closure
- M07 — transfer A, `VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md`, raw bytes 14048, SHA-256 `ddf201bfef00afadeaf5c53b7c44de26a035dd1ef70411326ed8c3c92d837d51`
- M08 — transfer B, `VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1.md`, raw bytes 10488, SHA-256 `4b2a1d778da68cb3942b9eb1a06c86a6ff93c6e8083bea0e8cfec50934edc07b`
- M09 — transfer C, `VIONA_LOCAL_EXACT_CREATE_SERIALIZATION_BATCH_CLOSURE_V1.md`, raw bytes 29638, SHA-256 `ae7331e1d7387be48f6678612615d996372993a309c98e9c7d75f76b6ddc90c8`
- M10 — transfer D, `VIONA_LOCAL_EXACT_CREATE_SER_B05_COHERENCE_AND_LIMIT_DELTA_V1.md`, raw bytes 26700, SHA-256 `66bf8a9474343822d106b4506d61b9fa44d4d73a2354ff8fa01126e9124bb558`
- M11 — transfer E, `VIONA_LOCAL_EXACT_CREATE_VERIFIED_HIERARCHY_SERIALIZATION_DELTA_V1_2.md`, raw bytes 38285, SHA-256 `ff5d8e5ba282e07df3e684be38e89b34ada4854cbba2b3a67e9822817fa44b9c`
- M12 — transfer F, `VIONA_LOCAL_EXACT_CREATE_MISMATCH_STATUS_SERIALIZATION_DELTA_V1.md`, raw bytes 22314, SHA-256 `53b142afe7e9577a95745887bccd2a9277861218f15eddd52fdf1aff0f67c6d3`
- M13 — transfer G, `VIONA_LOCAL_EXACT_CREATE_NOT_PERFORMED_OBSERVATION_BINDING_DELTA_V1_1.md`, raw bytes 16124, SHA-256 `3f29ebcc97f215900772659646dac0fa6092b4409d8af9578ea7f53f52d91217`
- M14 — transfer H, `VIONA_LOCAL_EXACT_CREATE_PRESENT_UNVERIFIED_FAILURE_CLASSIFICATION_TYPE_DELTA_V1.md`, raw bytes 10704, SHA-256 `3d6cd044434d35bd773703d9a498380e70b40a7c5c064d4577cbe29be05bc007`
- M15 — transfer I, `VIONA_LOCAL_EXACT_CREATE_FINAL_SCOPE_AND_UNVERIFIED_BINDING_DELTA_V1.md`, raw bytes 19737, SHA-256 `84ddc6b0478466f8ffec6d85b067908c442c7c994f8b8b6a56b054ff6559c8ad`

## 6. Incorporated normative modules

### M00 — V1: Initial versioned local exact-create successor proposal

<!-- BEGIN M00; embedded_utf8_length=10439; embedded_sha256=887f57f0867dd45531425e0bf5c8640910e0ae0173af2a0d89f64f17cb0b0348 -->
`CURRENT_SPEC_GAP_CONFIRMED=YES.` The current [Envelope Spec](</C:/KNG/ket-noi-eu/docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_SPEC.md:38>) has a path-only `CREATE_ALLOWLIST`; it has no general typed local-create extension. Its `CreateNew` rule is specific to publication authority markers. The [Controlled Protocol](</C:/KNG/ket-noi-eu/docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md:87>) requires a finite mutation budget but does not supply the missing directory/file create semantics. A **versioned, opt-in successor** is required. The following is a technical proposal, not an adopted contract or authority.

### Proposed closed successor

Introduce `ENVELOPE_CONTRACT.schema="VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"` and `ENVELOPE_CONTRACT.profile="VIONA_BME_PACK_A_SOURCE_CREATE_V1"`. Only that exact marker/profile pair permits interpretation of a new `LOCAL_CREATE_AUTHORITY` block. The enabled block has exactly `{schema,allowed,operator_authorization_reference,plan}`; `allowed` must be `true` under a later explicit, independently verified Operator envelope. Its disabled form is exactly `{allowed:false}`. A caller-supplied reference or matching hash is not approval.

`LocalCreatePlan V1` has exactly:

```text
schema="VIONA_CODEX_LOCAL_CREATE_PLAN_V1"
keys={schema,ordered_effects,max_total_effects,max_directory_creates,
      max_file_creates,unexpected_effect_behavior,retry_limit,
      partial_prefix_disposition,preconditions}

max_total_effects="8"
max_directory_creates="4"
max_file_creates="4"
unexpected_effect_behavior="BLOCK"
retry_limit="0"
partial_prefix_disposition="PRESERVE_AND_REPORT"
```

Counts and sequences are canonical decimal strings without leading zeroes. Unknown, duplicate, missing, or null fields fail closed. `ordered_effects` is an exact eight-element tagged union, with unique IDs, paths, and contiguous sequences `"1"`–`"8"`; count limits apply to OS create *attempts*, not just successful creations. Success requires eight verified completed effects.

| Closed type | Exact required keys and literals |
|---|---|
| `DirectoryCreateEffect V1` | `{schema,effect_id,sequence,exact_path,object_kind,operation,fail_if_exists,parent_binding,require_no_reparse,post_create_object_readback,expected_created_owner_sid,expected_created_sd_sha256}`; `object_kind="DIRECTORY"`, `operation="CREATE_NEW"`, both booleans `true`, readback `"VOLUME_FILE_ID_OWNER_SD_REPARSE"`. |
| `FileCreateEffect V1` | Directory-effect keys plus `{raw_byte_length,raw_sha256,prewrite_source_parity,post_close_content_object_readback}`; `object_kind="FILE"`, `operation="CREATE_NEW"`, parity and readback required. A directory cannot carry file-content keys; a file cannot omit them. |
| `ExistingBoundObject V1` | `{schema,kind,exact_path,volume_identity,file_id,owner_sid,security_descriptor_sha256,filesystem_type,non_reparse_chain}`; `kind="EXISTING_BOUND_OBJECT"`, filesystem `"NTFS"`, non-reparse `true`. Exact identity/security values are supplied and freshly proven in a future authority lane. |
| `PriorEffectReadback V1` | `{schema,kind,parent_effect_id,exact_path,require_completed_prior_effect,require_exact_readback_match,retain_validated_parent_handle}`; `kind="PRIOR_EFFECT_READBACK"` and all three requirements `true`. The reference must name an earlier, completed, readback-verified directory effect. |

The closed `preconditions` type requires: retained validated-parent-handle-relative creation; no reparse in the existing path chain or created objects; machine evaluation of required access for the **actual effecting token** immediately before each effect; target absence immediately before each attempt; raw source length/hash parity before each file create and immediately before writing; and exact-prefix plus final hierarchy readback. These are mandatory profile semantics, not `PURPOSE` prose. A later envelope must bind the existing evidence-parent volume/file ID, owner, descriptor and effecting-token identity; no values are fabricated here.

`CREATE_NEW` means an atomic fail-if-present create on the retained parent object—directory versus nondirectory options as appropriate, with no path-based fallback. An existence precheck alone is insufficient. The profile grants no overwrite, update, rename, delete, alternate stream, or ninth effect. Every later parent must be the same validated object represented by its prior effect’s readback; a changed identity blocks. File completion requires close followed by exact object, length, hash, owner, and security readback. A post-effect hierarchy check permits only children implied by the completed plan prefix; final success requires the exact eight-object hierarchy.

On any failure at effect N, **stop before N+1**. No retry, cleanup, repair, or automatic deletion is permitted. Preserve completed effects 1…N−1 and any partial object from N. A typed, non-authorizing outcome must distinguish the verified completed-prefix IDs, failed effect ID, whether its create was attempted, its object readback, unexpected-effect status, and retry count `"0"`. Missing or ambiguous readback blocks; reconciliation requires separate successor authority. No new persistent outcome file is granted by this proposal.

For this new profile, legacy `CREATE_ALLOWLIST.paths` and `MODIFY_ALLOWLIST.paths` must both be empty: the typed plan is the *sole* local-create grant. `MODE.max_remediation_cycles` and `SELF_REMEDIATION_POLICY.retry_limit` must be zero; validators, stage, commit, push, PR, merge, deploy, worktree, and remote mutation remain disabled. The exact plan bytes and a digest outside the plan must be bound by the later Operator authorization. This does not make a plan or digest self-authorizing.

### Pack A `NON_AUTHORIZING_EXAMPLE`

Let `D1` be `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1`. These abbreviations must be expanded to exact paths in any future envelope.

| Seq. | ID | Kind and exact path | Parent binding | Raw file identity |
|---:|---|---|---|---|
| 1 | D1 | Directory: `D1` | `EXISTING_BOUND_OBJECT`: `C:\KNG\viona-codex-api-evidence` | — |
| 2 | D2 | Directory: `D1\payload` | `PRIOR_EFFECT_READBACK(D1)` | — |
| 3 | D3 | Directory: `D1\payload\tests` | `PRIOR_EFFECT_READBACK(D2)` | — |
| 4 | D4 | Directory: `D1\payload\vectors` | `PRIOR_EFFECT_READBACK(D2)` | — |
| 5 | F1 | File: `D1\payload\BME_PACK_A_SCHEMA_CATALOG_V1.json` | `PRIOR_EFFECT_READBACK(D2)` | `92752`; `af19a873d7b1fafa82a85c79d685dd5d22281d6d5fd717b5dc51396e7f0ce6b6` |
| 6 | F2 | File: `D1\payload\BME_PACK_A_MERGE_PROVENANCE_V1.json` | `PRIOR_EFFECT_READBACK(D2)` | `14980`; `5cd5d387299f861c68ef5cf750b2f248609c85b2a678d31a25fe643e87a6c9e6` |
| 7 | F3 | File: `D1\payload\tests\Test-VionaBmePackAStaticV1.ps1` | `PRIOR_EFFECT_READBACK(D3)` | `14286`; `6507acf8215b2a400479b75bbc365801ce074a5f741ba9dc75e37882fc890255` |
| 8 | F4 | File: `D1\payload\vectors\BME_PACK_A_TEST_VECTORS_V1.json` | `PRIOR_EFFECT_READBACK(D4)` | `7958`; `22369ef1dd397a18785e53cda05de861f2fec95bf4fd9babfaf005a335f061f1` |

The example is deliberately **invalid for execution**: future parent-object, token/Authz, and created-object security bindings are unfilled; no `allowed:true` envelope or Operator authorization exists. F3 remains inert source bytes—no validator execution. `FILE_HASHES` and ZIP are not effects in this plan.

### Compatibility and parent closure

Old envelopes retain their exact present meaning. Marker absent, unknown, or mixed-version means **no local-create authority**; no historical `CREATE_ALLOWLIST` gains `CreateNew` power. The three existing GitHub publication profiles remain unchanged—this is not a fourth publication profile.

The four governance files reviewed list `EXPECTED_BASE.parent` but do not give it a normative derivation. In the proposed V2 profile only, define it as the **first `parent` commit OID in the verified `EXPECTED_BASE.head` commit object**, not the selected publication base, merge base, or remote master. Fresh Git readback: HEAD `60f0de217c16688862964adb1d7bc4e641132201`; first parent `2b5e5ffd788aac126cc7be6aced35678c3139057`; HEAD tree `fbe87bd54f3c33e65efafae15c2f00308c569f83`. Equality of that parent with the selected publication base is incidental. This V2 profile rejects a root commit, which has no first parent; supporting one would require a later explicit tagged schema variant, not a null or guessed OID.

### Proposed negative tests—not run

| Case | Required result |
|---|---|
| Legacy allowlist path without typed effect; unknown/mixed marker | Reject |
| Wrong object kind; file missing length/hash; content hash mismatch | Reject/block |
| `fail_if_exists=false`; pre-existing target; non-atomic create fallback | Reject/block |
| Ninth effect; duplicate ID/path/sequence; gap or changed D1→F4 order | Reject |
| Overwrite, update, delete, rename, retry greater than zero, `AUTO_DELETE` | Reject |
| Parent effect incomplete; wrong prior file ID/volume or lost retained-object proof | Block |
| Reparse parent or ancestor; unexpected child/effect | Block |
| Missing/stale/wrong-token effective Authz; wrong parent owner/descriptor | Block |
| Ambiguous `EXPECTED_BASE.parent`, wrong first parent, or root commit | Block |

Synthetic state vectors can exercise runtime-precondition rejection without creating filesystem objects. No such tests were executed here.

A docs-only amendment is required before this proposal can govern anything. The proposed future write set is exactly: **CREATE** `docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_LOCAL_EXACT_CREATE_V2_SPEC.md` for the pinned V1-import and closed successor; **MODIFY** `docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md` only to recognize the separate local-effect profile and its default-deny dispatch. The current Envelope Spec, `AGENTS.md`, and Operating Protocol need no change under this design. Even after documentation review, source-write authority would require a separate exact execution envelope and fresh filesystem/Authz proofs.

```text
LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_READY_FOR_INDEPENDENT_REVIEW=YES
PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
NEXT_ACTION=INDEPENDENT_REVIEW_OF_LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC
FILESYSTEM_MUTATION_OCCURRED=NO
REPOSITORY_MUTATION_OCCURRED=NO
REMOTE_MUTATION_OCCURRED=NO
F3_EXECUTION_OCCURRED=NO
```
<!-- END M00 -->

### M01 — V1.1: LC-01 through LC-05 contract closure

<!-- BEGIN M01; embedded_utf8_length=20635; embedded_sha256=d2a068ba20f96f0215edd69faa5c871e5337ddd2dbf0afd63bbbb79d16f1cc35 -->
**SPEC-ONLY verdict:** LC-01 through LC-05 are closed as a V1.1 proposal for independent rereview. This does **not** authenticate an operator approval, authorize a write, or make an executor ready. In particular, LC-01 defines a required trusted-message verification contract; no caller-supplied reference or hash satisfies it.

| Finding | Status |
|---|---|
| LC-01 — authorization and plan binding | CLOSED_AT_SPEC_LEVEL; trusted operator-message verifier remains a future proof gate |
| LC-02 — finite file-content mutation | CLOSED_AT_SPEC_LEVEL |
| LC-03 — effective Authz and preservation | CLOSED_AT_SPEC_LEVEL; actual-token and object proofs remain future gates |
| LC-04 — closed partial-prefix outcome | CLOSED_AT_SPEC_LEVEL |
| LC-05 — V2 integration and parser dispatch | CLOSED_AT_SPEC_LEVEL |

## B. Closed V1.1 contract

The definitions below are a **technical proposal**, not an adopted envelope or authority. All objects reject unknown keys, duplicate keys, null, and mixed-version aliases. `H64` is lowercase 64-character hex; `U0` is a canonical unsigned decimal **JSON string**. JSON is strict RFC 8785 JCS UTF-8, NFC strings, no BOM and no terminal newline.

### LC-01: authorization binds the exact plan

The current [Envelope Spec](/C:/KNG/ket-noi-eu/docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_SPEC.md) requires a fresh explicit operator envelope, but does not define a general machine-verifiable, whole-envelope-byte approval digest. V1.1 therefore cannot treat an existing `authorization_reference` string as that proof.

```text
LocalCreatePlan V1.1
  schema = "VIONA_CODEX_LOCAL_CREATE_PLAN_V1_1"
  exact keys =
    {schema, profile_id, ordered_effects, max_total_effects,
     max_directory_creates, max_file_creates, max_content_write_calls,
     unexpected_effect_behavior, retry_limit, partial_prefix_disposition,
     security_contract, preconditions}

plan_sha256 =
  lowercase_hex(SHA256(
    ASCII("VIONA-CODEX-LOCAL-CREATE-PLAN-V1_1") || 0x00 ||
    JCS_UTF8(exact LocalCreatePlan V1.1)))
```

`plan_sha256` is **outside** the plan. The enabled `LOCAL_CREATE_AUTHORITY` contains both `plan` and `plan_sha256`; the verifier recomputes equality from the embedded bytes. For Pack A, the plan fixes eight effects in the accepted order, maxima `"8"`, `"4"`, `"4"`, `"4"` content-write calls, `unexpected_effect_behavior="BLOCK"`, `retry_limit="0"`, and `partial_prefix_disposition="PRESERVE_AND_REPORT"`.

```text
OperatorAuthorizationReference V1
  schema = "VIONA_CODEX_OPERATOR_AUTHORIZATION_REFERENCE_V1"
  exact keys =
    {schema, source_kind, conversation_id, message_id,
     operator_principal_id, raw_message_sha256,
     approved_subject_sha256, approved_plan_sha256}
  source_kind = "TRUSTED_OPERATOR_MESSAGE"
```

The IDs are opaque locators, **not** evidence by themselves. A separately reviewed trusted-host verifier must retrieve the exact message from the operator channel, authenticate its human-operator principal and role, bind it to this lane, hash its unnormalized UTF-8 body, and require the body to be the exact one-line approval grammar:

```text
AUTHORIZE_VIONA_CODEX_LOCAL_CREATE_V1_1|SUBJECT_SHA256=<H64>|PLAN_SHA256=<H64>
```

No whitespace, newline, alternate phrase, or additional field is accepted. The retrieved message—not the caller’s copy—must supply both digests. If trustworthy retrieval or operator-role proof is unavailable, execution blocks.

To avoid a self-reference, define `AuthorizationSubject V1` as the **entire canonical V2 envelope with only** `LOCAL_CREATE_AUTHORITY.operator_authorization_reference` removed. Its digest is:

```text
subject_sha256 =
  lowercase_hex(SHA256(
    ASCII("VIONA-CODEX-LOCAL-CREATE-SUBJECT-V1") || 0x00 ||
    JCS_UTF8(AuthorizationSubject V1)))
```

The reference’s `approved_subject_sha256` and `approved_plan_sha256` must equal the independently retrieved approval and the recomputed values. Thus the approved subject binds every other envelope field, including the embedded plan, baseline, deny/disabled authorities, and exact file identities. A complete-envelope digest may be recorded *outside* the envelope for readback, but does not replace this approval check. Changing one plan byte after approval invalidates both bindings. The helper cannot mint a trusted operator message.

### LC-02: one finite write transition per file

`DirectoryCreateEffect V1.1` and `FileCreateEffect V1.1` remain separate tagged variants. Both require `object_kind`, `operation="CREATE_NEW"`, `fail_if_exists=true`, fixed `effect_id/sequence/exact_path`, `parent_binding`, reviewed initial-create security descriptor, required parent access mask, and exact object readback. Only the file variant has `raw_byte_length:U0`, `raw_sha256:H64`, and this closed budget:

```text
FileContentMutationBudget V1
  schema = "VIONA_CODEX_FILE_CONTENT_MUTATION_BUDGET_V1"
  exact keys =
    {schema, initial_length, write_offset, write_range_length,
     max_os_content_write_calls, append_allowed, seek_allowed,
     backpatch_allowed, truncate_allowed, rewrite_allowed,
     flush_attempt_limit, normal_close_required,
     post_close_content_object_security_readback_required}
  values =
    initial_length:"0", write_offset:"0",
    write_range_length:effect.raw_byte_length,
    max_os_content_write_calls:"1",
    append_allowed:false, seek_allowed:false,
    backpatch_allowed:false, truncate_allowed:false,
    rewrite_allowed:false, flush_attempt_limit:"1",
    normal_close_required:true,
    post_close_content_object_security_readback_required:true
```

The creator verifies the newly created object is empty and its initial security matches **before** content mutation. Exactly one OS-level content-write invocation at offset zero may attempt the complete `[0, raw_byte_length)` range. The call budget is consumed immediately before invocation. A failed or short write is terminal: no second write to complete it. Successful full write must be followed by one flush attempt, normal close, and fresh post-close byte-length, SHA-256, file-ID, owner/descriptor, and preservation readback. Flush or close failure is terminal. No later content mutation is permitted. A future implementation must prove that its chosen API actually respects this OS-call model; a high-level method that silently issues multiple writes does not.

### LC-03: security evidence and object binding

Reuse, without weakening their meanings, the already specified BME `FsObjectIdentity`, `TokenIdentity`, `EffectiveAuthzEvidence`, `PresentDirectoryReadback`, and `PresentFileReadback` shapes. `FsObjectIdentity` supplies the exact path, volume GUID path and serial, file ID, owner SID, SD/DACL digests, NTFS type, and non-reparse assertion. Consequently, `volume_identity` is the checked `(volume_guid_path, volume_serial_hex, filesystem_type)` projection of that object—not an undefined new string. The existing `EffectiveAuthzEvidence` is reusable **for each actual output parent** with the actual effecting token and that effect’s required mask.

The old `PreservationReadback` names one candidate root and one manifest, and the old negative-Authz bundle is tied to that candidate `Scope.output_preservation`. Neither is silently reused for eight Pack A objects. V1.1 instead defines:

```text
LocalCreateSecurityContract V1
  schema = "VIONA_CODEX_LOCAL_CREATE_SECURITY_CONTRACT_V1"
  exact keys =
    {schema, existing_parent_identity, non_reparse_chain,
     effecting_token, excluded_principal_sids,
     reviewed_positive_authz_method_id,
     reviewed_negative_authz_method_id,
     directory_forbidden_mask_hex, file_forbidden_mask_hex,
     security_at_initial_create, post_create_acl_repair,
     post_close_preservation_required}
```

The excluded SID array is sorted, unique, nonempty, and separately reviewed before an exact plan can be approved. The dangerous-right masks are exact machine-checked Windows access masks: directory `000d0156` (including delete, delete-child, add-child, write attributes/EA, WRITE_DAC and WRITE_OWNER); file `000d0116` (including delete, write/append data, write attributes/EA, WRITE_DAC and WRITE_OWNER). Numeric-rights provenance and effective-access method require independent Windows/SDK review before use. These checks do not purport to defeat SYSTEM, privileged-owner changes, offline rollback, or later separately authorized ACL mutation.

`non_reparse_chain` is a closed, ordered array of `FsObjectIdentity` from the volume root through the existing evidence parent. Every adjacent parent–child relationship, volume identity, path, file ID and `is_reparse_point=false` must validate. For a prior-effect parent, the next effect consumes that effect’s verified `PresentDirectoryReadback` **and its retained handle**; it cannot take an arbitrary path or a caller-supplied readback.

Each effect’s `creation_security` binds exact reviewed self-relative descriptor bytes and SHA-256, expected owner/DACL/SD identities, `apply_at_initial_create=true`, and `repair_after_create=false`. If lawful initial creation cannot produce that security state, stop and preserve the prefix. Descriptor-hash equality alone is never positive or negative effective Authz proof.

The required gates are:

| Object | Before use / after creation | After relevant handles close |
|---|---|---|
| Existing evidence parent | Exact retained object/chain; actual-token positive create rights; excluded-principal effective denial, including rename via its own parent | Same identity/security and excluded-principal denial |
| D1, D2 | Initial-create SD and exact directory readback; positive create rights before serving as parents; negative effective preservation | Identity, SD, no-reparse and negative rights rechecked |
| D3, D4 | Same checks before becoming F3/F4 parents | Same post-close preservation checks |
| F1–F4 | Initial-create SD; actual-token file-write rights and empty-object check before the single write | Exact bytes/hash/file ID/security plus excluded-principal effective denial |
| Every parent–child edge | Retained handles without `FILE_SHARE_DELETE`; exact parent identity immediately before create | Final chain and hierarchy readback |

The reviewed negative-principal-check semantics may be used for parent checks only where their actual-token proof fits; file-object preservation needs the V1.1 object-bound negative check with the same raw-proof/hash and mask rules. A correct SD with failed effective denial is a block. A correct post-hoc SD after insecure initial creation is also a block.

### LC-04: non-authorizing outcome

```text
LocalCreateOutcome V1
  schema = "VIONA_CODEX_LOCAL_CREATE_OUTCOME_V1"
  exact common keys =
    {schema, result_kind, plan_sha256, approved_subject_sha256,
     completed_effect_ids, completed_effect_reports,
     unexpected_effect_status, retry_count,
     final_hierarchy_readback, terminal_classification}
  SUCCESS additionally: no failed_effect_id or failed_effect_report
  FAILURE additionally: {failure_phase, failed_effect_id,
                         failed_effect_report}
  PRE_EFFECT_BLOCK additionally: {failure_phase}; no failed effect
```

`completed_effect_ids` is **exactly** the contiguous verified prefix of the plan, in order; its reports have the same IDs. `failed_effect_id`, when present, is exactly the next plan effect. `retry_count="0"` in every variant. `unexpected_effect_status` is the finite enum `NONE_OBSERVED | OBSERVED | UNVERIFIED`; only `NONE_OBSERVED` can accompany success.

A closed effect report binds `effect_id`, `object_kind`, finite `last_completed_substep`, `create_attempt_count:"0"|"1"`, `target_created:"YES"|"NO"|"UNVERIFIED"`, and a tagged `readback` of `VERIFIED` (the existing directory/file readback type), `PRESENT_UNVERIFIED` (the existing partial-object type), or `UNAVAILABLE` with reason. File reports additionally require `content_write_call_count:"0"|"1"`, `write_result:NOT_ATTEMPTED|FULL|SHORT|FAILED|UNKNOWN`, returned byte count **only if known**, `flush_attempted`, `flush_completed`, and `normal_close_completed`. A failure does not advance `last_completed_substep` past the last proven transition.

`final_hierarchy_readback` is a closed `VERIFIED | UNVERIFIED` union: the verified form records exact observed path/object identities and unexpected-child count; the unverified form records the failure reason and raw observations available. It cannot claim an absent object from lack of a report. Success requires all eight verified effects, full file readbacks, final security/preservation and hierarchy closure. An outcome is evidence only: it neither reserves nor reopens authority. This proposal creates **no persistent outcome file**.

### LC-05: V2 import and dispatch

The V1 document and historical envelopes remain unchanged. This is a versioned successor, not a reinterpretation of `CREATE_ALLOWLIST`. V2 has two **top-level siblings** of the existing envelope fields:

```text
ENVELOPE_CONTRACT:
  schema = "VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"
  exact keys = {schema, profile_id, legacy_spec_sha256}
  profile_id = "VIONA_BME_PACK_A_SOURCE_CREATE_V1"
  legacy_spec_sha256 =
    "31501dcd1588df804c337a1382ee4b4d3a937f7c696ef4a0b14f7df2c6f29e5c"

LOCAL_CREATE_AUTHORITY enabled:
  schema = "VIONA_CODEX_LOCAL_CREATE_AUTHORITY_V1_1"
  exact keys =
    {schema, allowed, profile_id, plan, plan_sha256,
     operator_authorization_reference}
  allowed = true; profile_id matches ENVELOPE_CONTRACT

LOCAL_CREATE_AUTHORITY disabled:
  exact keys = {schema, allowed}
  same schema marker; allowed = false
```

For this local profile, the V2 top-level key set is the applicable V1 §3 set plus exactly those two siblings: `PROJECT`, `CANONICAL_ROOT`, `EXPECTED_BASE`, `MODE`, `PURPOSE`, `CREATE_ALLOWLIST`, `MODIFY_ALLOWLIST`, `DENYLIST`, `VALIDATORS`, `SELF_REMEDIATION_POLICY`, `STAGE_AUTHORITY`, `COMMIT_AUTHORITY`, `PUSH_AUTHORITY`, `REMOTE_REF_CREATE_AUTHORITY`, `REMOTE_COMMIT_AUTHORITY`, `DURABLE_ATTEMPT_AUTHORITY`, `DURABLE_PHASE_AUTHORITIES`, `PHASE_A_CONTINUATION_BINDING`, `EXPECTED_PR_BINDING`, `ASSOCIATED_PR_SCOPE`, `PR_METADATA_RACE_ACCEPTANCE`, `LOCAL_SYNC_AUTHORITY`, `API_EXECUTION_CONTEXTS`, `API_REQUEST_RECORDS`, `PR_AUTHORITY`, `MERGE_AUTHORITY`, `DEPLOY_AUTHORITY`, `WORKTREE_AUTHORITY`, `REMOTE_MUTATION_AUTHORITY`, `STOP_CONDITIONS`, `ROLLBACK`, `OUTPUT_EVIDENCE`, `FINAL_CLASSIFICATION`, `ENVELOPE_CONTRACT`, and `LOCAL_CREATE_AUTHORITY`. `POST_VALIDATOR_STATE_RECHECK` is forbidden because this profile executes no validator. All inapplicable authority blocks use their exact disabled forms; API contexts/requests and validator lists are empty. Stage, commit, Git, provider, network and remote authorities are disabled. Any unknown top-level key blocks.

For this profile, `CREATE_ALLOWLIST.paths=[]` and `MODIFY_ALLOWLIST.paths=[]` are mandatory. They confer **no** local effect; only a verified enabled typed plan can do so. `EXPECTED_BASE.parent` is the verified first parent of `EXPECTED_BASE.head`, not “selected publication base” by definition. A root commit without a first parent is incompatible with this profile and blocks.

Parser dispatch checks the exact `ENVELOPE_CONTRACT.schema` **before** interpreting any authority block. Absent marker uses only V1 semantics and has no typed external local-create power; unknown marker blocks; V1 input containing `LOCAL_CREATE_AUTHORITY` blocks; V2 with mixed V1/V2 fields or nonempty legacy create/modify paths blocks. A legacy parser ignoring the new sibling still sees empty legacy path lists and cannot gain Pack A create authority. Execution additionally requires the trusted operator-message check above; a V2 document by itself authorizes nothing.

## C. Pack A non-authorizing example

This is a **profile plan illustration**, not a serializable enabled envelope: future object IDs, token, reviewed SD bytes, excluded-principal set, baseline manifests, and operator message are deliberately not fabricated. Until those exact values are bound and approved, no `plan_sha256` or authorization subject exists.

| Seq | ID | Kind | Exact target | Parent variant |
|---:|---|---|---|---|
| 1 | D1 | DIRECTORY | `C:\KNG\viona-codex-api-evidence\bme-candidate-preparation-pack-a-v1` | `EXISTING_BOUND_OBJECT`: exact evidence-parent identity |
| 2 | D2 | DIRECTORY | `D1\payload` | `PRIOR_EFFECT_READBACK(D1)` |
| 3 | D3 | DIRECTORY | `D2\tests` | `PRIOR_EFFECT_READBACK(D2)` |
| 4 | D4 | DIRECTORY | `D2\vectors` | `PRIOR_EFFECT_READBACK(D2)` |
| 5 | F1 | FILE | `D2\BME_PACK_A_SCHEMA_CATALOG_V1.json` | `PRIOR_EFFECT_READBACK(D2)` |
| 6 | F2 | FILE | `D2\BME_PACK_A_MERGE_PROVENANCE_V1.json` | `PRIOR_EFFECT_READBACK(D2)` |
| 7 | F3 | FILE | `D3\Test-VionaBmePackAStaticV1.ps1` | `PRIOR_EFFECT_READBACK(D3)` |
| 8 | F4 | FILE | `D4\BME_PACK_A_TEST_VECTORS_V1.json` | `PRIOR_EFFECT_READBACK(D4)` |

All eight have `CREATE_NEW`, `fail_if_exists=true`, initial-create security, retained-handle and exact post-create readback requirements. File byte bindings remain unchanged:

| File | Raw bytes | SHA-256 |
|---|---:|---|
| F1 | 92752 | `af19a873d7b1fafa82a85c79d685dd5d22281d6d5fd717b5dc51396e7f0ce6b6` |
| F2 | 14980 | `5cd5d387299f861c68ef5cf750b2f248609c85b2a678d31a25fe643e87a6c9e6` |
| F3 | 14286 | `6507acf8215b2a400479b75bbc365801ce074a5f741ba9dc75e37882fc890255` |
| F4 | 7958 | `22369ef1dd397a18785e53cda05de861f2fec95bf4fd9babfaf005a335f061f1` |

F3 is source bytes only; its execution remains forbidden. A demonstration envelope would use the **disabled** `LOCAL_CREATE_AUTHORITY` variant. No `allowed:true` example is supplied.

## D–E. Compatibility and rejection tests

V1 behavior is unchanged. No historical `CREATE_ALLOWLIST` acquires typed `CREATE_NEW` power. The V2 marker, exact local profile, closed plan, recomputed digests, and independently retrieved operator approval are cumulative gates; failure of any one blocks before effect.

| Finding | Required negative cases |
|---|---|
| LC-01 | Reference absent or caller text only; retrieved message/operator mismatch; wrong subject or plan digest; wrong domain; plan or other envelope field changed after approval |
| LC-02 | Second OS write; append; seek/backpatch; extra bytes; short write followed by completion attempt; rewrite after flush/close; truncate/SetLength; post-close byte/hash mismatch |
| LC-03 | Actual-token positive rights absent; excluded principal retains delete/rename/overwrite rights on object or relevant parent; matching SD hash but failed effective denial; SD repaired after create; parent/chain/file-ID/security drift; reparse substitution |
| LC-04 | Noncontiguous completed IDs; failure skips a prior effect; object appears while outcome claims proven unattempted/absent; contradictory completed substep or write count; nonzero retry; success with unknown hierarchy |
| LC-05 | V1 with `LOCAL_CREATE_AUTHORITY`; V2 with nonempty legacy create/modify list; unknown or mixed markers; unresolved primitive; wrong parent variant/readback; ninth/reordered effect |

These are **proposed static cases**, not executed tests.

## F. Proposed docs-only amendment set

A later, separately authorized docs-only lane would:

1. **Create** [VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_LOCAL_EXACT_CREATE_V2_SPEC.md](/C:/KNG/ket-noi-eu/docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_LOCAL_EXACT_CREATE_V2_SPEC.md) containing the closed V1.1 types, parser matrix and negative tests.
2. **Modify** [VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md](/C:/KNG/ket-noi-eu/docs/ai-context/VIONA_CODEX_CONTROLLED_AUTONOMOUS_EXECUTION_PROTOCOL.md) only to route the new marker/profile to that separately reviewed successor and preserve V1 default-deny behavior.

The existing [Envelope Spec](/C:/KNG/ket-noi-eu/docs/product/VIONA_CODEX_AUTONOMOUS_EXECUTION_ENVELOPE_SPEC.md), `AGENTS.md`, and Operating Protocol are **not** proposed edits. This is an amendment preview, not amendment authority.

Fresh read-only local check: canonical root `C:\KNG\ket-noi-eu`; branch `feat/viona-runtime-canon-adoption-wave1-public-copy-v1`; HEAD `60f0de217c16688862964adb1d7bc4e641132201`; tree `fbe87bd54f3c33e65efafae15c2f00308c569f83`; status 12 modified tracked, 5 untracked, 0 staged. No files, Git state, or remote state were changed. No F3 or validator was run.

`LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_V1_1_READY_FOR_INDEPENDENT_REREVIEW=YES`  
`DOCS_ONLY_AMENDMENT_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_IMPLEMENTATION_AUTHORIZED=NO`  
`NEXT_ACTION=INDEPENDENT_REREVIEW_OF_LOCAL_EXACT_CREATE_SUCCESSOR_V1_1`
<!-- END M01 -->

### M02 — V1.2: Security, report, hierarchy, and outcome type closure

<!-- BEGIN M02; embedded_utf8_length=22772; embedded_sha256=dc99bd8909dbf68ffe2dc0889ed097031dec4b27f7bbd3b04ab68671f70de6a0 -->
**V1.2 specification closure is ready for final independent rereview.** This closes LC-02, LC-03 and LC-04 at the type-contract level only. LC-01 and LC-05 remain as stated in V1.1. The D1→F4 order, `CREATE_NEW` behavior, parent-binding variants, and F1–F4 identities are unchanged.

`LC02_FINAL_STATUS=CLOSED_SPEC_ONLY`  
`LC03_FINAL_STATUS=CLOSED_SPEC_ONLY`  
`LC04_FINAL_STATUS=CLOSED_SPEC_ONLY`

The definitions below are proposed contract text, not implemented or adopted authority. Every object has exactly its listed keys; unknown keys, duplicate keys, null, and mixed markers are rejected. `U0/U1`, `H8/H16/H32/H64`, `SID`, `PATH`, `UTC`, and strict Base64url have the meanings already fixed by the BME schema catalog. Counts are canonical decimal **JSON strings** and compared numerically.

## A. Failure handle release

After any failed effect, the executor must stop effect progression and attempt one OS close of **every still-retained handle**, in reverse acquisition order. This includes the failed file handle and retained parent/directory/readback handles. It may continue closing other handles after one close fails, but may not retry a close, create, write, or other effect. The effecting I/O contract is synchronous: no overlapped write may remain pending when failure release starts, and no handle may have delete-on-close behavior.

Only handle/resource release calls are permitted in this phase. No new content write, flush, delete, rename, truncate, security change, or ACL repair is permitted. OS close may settle data from an *earlier* write; the report must not misrepresent that as proof that no earlier bytes persisted.

```text
HandleReleaseRecord V1
  schema="VIONA_CODEX_HANDLE_RELEASE_RECORD_V1"
  keys={schema,handle_ordinal:U1,handle_role,object_path:PATH,
        close_attempt_count,close_result,raw_call_evidence}
  handle_role=EXISTING_PARENT|CREATED_DIRECTORY|CREATED_FILE|READBACK
  close_attempt_count="1"
  close_result=SUCCESS|ERROR|UNVERIFIED
  raw_call_evidence=RawOsEvidence V1
  ERROR/UNVERIFIED additionally requires os_error:OsErrorEvidence V1

FailureHandleRelease V1 — closed union
  schema="VIONA_CODEX_FAILURE_HANDLE_RELEASE_V1"

  NO_HANDLES_ACQUIRED:
    keys={schema,state,retained_handle_count,
          normal_workflow_close_advanced,additional_content_write_calls,
          forbidden_mutation_call_count}
    values={state:NO_HANDLES_ACQUIRED,retained_handle_count:"0",
            normal_workflow_close_advanced:false,
            additional_content_write_calls:"0",
            forbidden_mutation_call_count:"0"}

  RELEASE_ATTEMPTED:
    keys={schema,state,retained_handle_count,close_records,
          all_released,normal_workflow_close_advanced,
          additional_content_write_calls,forbidden_mutation_call_count}
    close_records contains exactly one HandleReleaseRecord per retained handle
    in reverse acquisition order; retained_handle_count matches its length;
    normal_workflow_close_advanced=false;
    additional_content_write_calls="0";
    forbidden_mutation_call_count="0";
    all_released=true iff every close_result=SUCCESS
```

`RawOsEvidence V1` has marker `VIONA_CODEX_RAW_OS_EVIDENCE_V1` and keys `{schema,raw_base64url,raw_byte_length:U1,raw_sha256:H64}`; decoded bytes must match length/hash. `OsErrorEvidence V1` has marker `VIONA_CODEX_OS_ERROR_EVIDENCE_V1` and keys `{schema,api,code_kind,code_hex:H8,observed_at_utc:UTC,raw:RawOsEvidence}`; `api` is a reviewed finite API name, and `code_kind=WIN32|NTSTATUS`.

Failure release **never** changes `normal_close_completed` in a file report. That flag may already be true if normal close finished before a later readback/final-closure failure; otherwise failure release cannot make it true. An unsuccessful or unverified release remains terminal and is reported as ambiguous resource state, not retried.

## B. Exact security and readback types

The V2 successor document must **normatively reproduce** the following exact BME V1 definitions, with their original markers and semantics, rather than depend at runtime on F1 being created. The proposed F1 raw identity is 92,752 bytes, SHA-256 `af19a873d7b1fafa82a85c79d685dd5d22281d6d5fd717b5dc51396e7f0ce6b6`; independent review must check the reproduction against those exact bytes.

| Reproduced type and marker | Exact keys and constraints |
|---|---|
| `FsObjectIdentity` — `VIONA_BME_FS_OBJECT_IDENTITY_V1` | `{schema,exact_path:PATH,volume_guid_path:PATH,volume_serial_hex:H16,file_id_hex:H32,owner_sid:SID,security_descriptor_sha256:H64,dacl_sha256:H64,filesystem_type:"NTFS",is_reparse_point:false}`. Its domain digest, when used, stays outside the object: `D("VIONA-BME-FS-OBJECT-V1", object)`. |
| `TokenIdentity` — `VIONA_BME_TOKEN_IDENTITY_V1` | `{schema,user_sid:SID,enabled_group_sids:SID[],restricted_sids:SID[],integrity_sid:SID,token_authentication_id_hex:H16}`. Each group array is sorted/unique, length 0–128. |
| `EffectiveAuthzEvidence` — `VIONA_BME_OUTPUT_PARENT_EFFECTIVE_AUTHZ_V1` | `{schema,parent:FsObjectIdentity,effecting_token:TokenIdentity,reviewed_method_id:TEXT(128),required_parent_access_mask_hex:H8,granted_parent_access_mask_hex:H8,access_granted:true,observed_at_utc:UTC,raw_proof_base64url,raw_proof_byte_length:U1,raw_proof_sha256:H64}`. Raw proof matches its length/hash; required mask is a subset of the machine-measured granted mask for that exact parent and actual token. This type is used for **each effect’s actual output parent**. |
| `AbsentObjectReadback` — `VIONA_BME_ABSENT_OBJECT_READBACK_V1` | `{schema,exact_path:PATH,exists:false,read_at_utc:UTC}`. |
| `PresentDirectoryReadback` — `VIONA_BME_PRESENT_DIRECTORY_READBACK_V1` | `{schema,object:FsObjectIdentity,exists:true,read_at_utc:UTC}`; byte/content-hash fields forbidden. |
| `PresentFileReadback` — `VIONA_BME_PRESENT_FILE_READBACK_V1` | `{schema,object:FsObjectIdentity,exists:true,byte_length:U0,sha256:H64,read_at_utc:UTC}`. |
| `PresentUnverifiedObjectReadback` — `VIONA_BME_PRESENT_UNVERIFIED_OBJECT_READBACK_V1` | `{schema,exact_path:PATH,exists:true,object_kind:DIRECTORY\|FILE,failure_classification:TEXT,read_at_utc:UTC}`; no byte/content hash and never success proof. |

`OutputParentNegativeAuthzEvidence` and `PreservationReadback` are **not** imported: their candidate-scope and two-object meanings do not match Pack A’s parent plus eight objects.

The new, closed local-profile types are:

```text
CreationSecurity V1
  schema="VIONA_CODEX_LOCAL_CREATE_CREATION_SECURITY_V1"
  keys={schema,self_relative_sd_base64url,sd_byte_length:U1,
        sd_sha256:H64,owner_sid:SID,dacl_sha256:H64,
        dacl_protected:true,expected_created_owner_sid:SID,
        expected_created_sd_sha256:H64,
        expected_created_dacl_sha256:H64,
        apply_at_initial_create:true,post_create_repair_allowed:false}
  Strict decoded descriptor bytes match sd_byte_length/sd_sha256;
  parsed owner/DACL match the declared identities. Expected-created
  identities are compared to actual FsObjectIdentity immediately after create.

InitialSecurityEvidence V1
  schema="VIONA_CODEX_LOCAL_CREATE_INITIAL_SECURITY_EVIDENCE_V1"
  keys={schema,effect_id,create_call_sd_sha256:H64,
        creation_security:CreationSecurity,
        created_object:FsObjectIdentity,
        post_create_acl_repair_call_count,raw_call_proof:RawOsEvidence}
  create_call_sd_sha256=creation_security.sd_sha256;
  post_create_acl_repair_call_count="0";
  actual owner/SD/DACL equal CreationSecurity expected-created values.

PositiveObjectAuthzEvidence V1
  schema="VIONA_CODEX_LOCAL_CREATE_POSITIVE_OBJECT_AUTHZ_V1"
  keys={schema,object:FsObjectIdentity,effecting_token:TokenIdentity,
        reviewed_method_id:TEXT(128),required_access_mask_hex:H8,
        granted_access_mask_hex:H8,access_granted:true,
        observed_at_utc:UTC,raw_proof:RawOsEvidence}
  Required mask subset of machine-measured granted mask for that
  exact newly created file and actual effecting token.
```

`EffectiveAuthzEvidence` covers the existing evidence parent and each created directory when it becomes a parent. `PositiveObjectAuthzEvidence` covers newly created file write/readback rights; it is separate because the imported type is explicitly parent-bound.

```text
NegativeObjectPrincipalCheck V1
  schema="VIONA_CODEX_LOCAL_CREATE_NEGATIVE_OBJECT_PRINCIPAL_V1"
  keys={schema,object:FsObjectIdentity,tested_token:TokenIdentity,
        principal_sid:SID,requested_forbidden_mask_hex:H8,
        observed_granted_mask_hex:H8,
        forbidden_mask_intersection_zero:true,
        raw_proof:RawOsEvidence}
  principal_sid matches the tested token being evaluated;
  (requested_forbidden_mask & observed_granted_mask)=0.

NegativeObjectAuthzEvidence V1
  schema="VIONA_CODEX_LOCAL_CREATE_NEGATIVE_OBJECT_AUTHZ_V1"
  keys={schema,object:FsObjectIdentity,reviewed_method_id:TEXT(128),
        excluded_principal_checks:NegativeObjectPrincipalCheck[1..64],
        observed_at_utc:UTC}
  Checks are sorted/unique by reviewed excluded principal SID;
  their SID set equals the exact plan-bound excluded set;
  each check.object equals this object and uses its kind-specific
  reviewed forbidden mask.

ExpectedNonReparseChain V1
  schema="VIONA_CODEX_EXPECTED_NON_REPARSE_CHAIN_V1"
  keys={schema,ordered_objects:FsObjectIdentity[],final_parent_path:PATH}
  The array runs from the volume root through the existing evidence
  parent, has no repeated object/path, and every object says NTFS and
  is_reparse_point=false. Adjacent path/object relationships are checked.

ObservedNonReparseChain V1
  schema="VIONA_CODEX_OBSERVED_NON_REPARSE_CHAIN_V1"
  keys={schema,expected_chain_sha256:H64,
        ordered_objects:FsObjectIdentity[],
        observed_at_utc:UTC,raw_proof:RawOsEvidence}
  Objects equal the exact expected chain. A prior-effect parent
  extends the runtime chain using that effect’s verified directory
  readback; no pre-existing file ID is invented for a future directory.

RetainedHandleObjectReadback V1
  schema="VIONA_CODEX_RETAINED_HANDLE_OBJECT_READBACK_V1"
  keys={schema,handle_ordinal:U1,handle_role,
        object:FsObjectIdentity,share_mode_hex:H8,
        opened_at_utc:UTC,read_at_utc:UTC,still_open:true,
        raw_proof:RawOsEvidence}
  Directory authority-bearing handles require share_mode_hex="00000003"
  (FILE_SHARE_READ|FILE_SHARE_WRITE, no FILE_SHARE_DELETE).
  The retained handle’s object ID must equal the parent/readback used.
```

A post-close preservation entry has marker `VIONA_CODEX_LOCAL_CREATE_PRESERVED_OBJECT_V1`, keys `{schema,object:FsObjectIdentity,negative_authz:NegativeObjectAuthzEvidence}`. `LocalCreatePreservationReadback V1` has marker `VIONA_CODEX_LOCAL_CREATE_PRESERVATION_READBACK_V1` and keys `{schema,excluded_principal_sids:SID[],objects:PreservedObjectEntry[],reviewed_method_id:TEXT(128),read_after_handles_closed_at_utc:UTC,raw_proof:RawOsEvidence}`. For success, `objects` binds the evidence parent and D1–F4—nine exact identities—with every negative check passing. This is a measured readback, not a promise of immunity to later privileged mutation.

Every report uses this exact readback union:

```text
LocalObjectReadback V1 — tagged closed union
  ABSENT:             {kind:"ABSENT",evidence:AbsentObjectReadback}
  PRESENT_DIRECTORY:  {kind:"PRESENT_DIRECTORY",
                       evidence:PresentDirectoryReadback}
  PRESENT_FILE:       {kind:"PRESENT_FILE",
                       evidence:PresentFileReadback}
  PRESENT_UNVERIFIED: {kind:"PRESENT_UNVERIFIED",
                       evidence:PresentUnverifiedObjectReadback}
  UNAVAILABLE:        {kind:"UNAVAILABLE",error:OsErrorEvidence}
```

`UNAVAILABLE` is never interpreted as absent. Every nested object’s path and kind must match the effect being reported.

Security gates are an exact ordered array of `PARENT_POSITIVE`, `PARENT_NEGATIVE`, `INITIAL_SECURITY`, `OBJECT_POSITIVE`, `OBJECT_NEGATIVE`. A gate entry is a closed `NOT_RUN` (`{schema,gate,state}`), `PASS` (`{schema,gate,state,evidence}`), or `FAIL/UNVERIFIED` (`{schema,gate,state,reason,raw_proof}`) variant. A `PASS` evidence value is, respectively: imported `EffectiveAuthzEvidence`; new `NegativeObjectAuthzEvidence` on the parent; `InitialSecurityEvidence`; imported `EffectiveAuthzEvidence` on a created directory or new `PositiveObjectAuthzEvidence` on a file; and new `NegativeObjectAuthzEvidence` on the created object. Failure reason is the finite enum `ACCESS_DENIED | FORBIDDEN_RIGHT_GRANTED | OBJECT_ID_MISMATCH | SECURITY_MISMATCH | REPARSE_OR_CHAIN_MISMATCH | PROOF_UNAVAILABLE`. Gates after the first failed/unverified gate are `NOT_RUN`; no failed gate can be promoted by later SD repair.

## C. Closed effect reports and compatibility

```text
LocalCreateDirectoryEffectReport V1
  schema="VIONA_CODEX_LOCAL_CREATE_DIRECTORY_EFFECT_REPORT_V1"
  exact keys={schema,effect_id,sequence,report_status,
              create_attempt_count,create_attempted,create_result,
              target_created,last_completed_substep,
              security_gates,readback,failure_handle_release}

LocalCreateFileEffectReport V1
  schema="VIONA_CODEX_LOCAL_CREATE_FILE_EFFECT_REPORT_V1"
  exact keys={all directory-report keys,
              content_write_call_count,write_result,
              returned_byte_count,flush_attempted,flush_completed,
              normal_close_completed}
```

`report_status=COMPLETE|FAILED`; `create_attempt_count` and `content_write_call_count` are `"0"|"1"`; `create_attempted` is true iff the create count is `"1"`; `create_result=NOT_CALLED|SUCCESS|ERROR|AMBIGUOUS`; `target_created=YES|NO|UNVERIFIED`. `returned_byte_count` is a `U0` string or the literal `"UNAVAILABLE"`. `write_result=NOT_ATTEMPTED|FULL|SHORT|FAILED|UNKNOWN`.

Finite completed-substep order:

| Directory | File |
|---|---|
| `NONE` | `NONE` |
| `PARENT_AUTHZ_VERIFIED` | `PARENT_AUTHZ_VERIFIED` |
| `CREATE_COMPLETED` | `CREATE_EMPTY_COMPLETED` |
| `INITIAL_SECURITY_VERIFIED` | `INITIAL_SECURITY_VERIFIED` |
| `OBJECT_POSITIVE_AUTHZ_VERIFIED` | `OBJECT_POSITIVE_AUTHZ_VERIFIED` |
| `OBJECT_NEGATIVE_AUTHZ_VERIFIED` | `OBJECT_NEGATIVE_AUTHZ_VERIFIED` |
| `POST_CREATE_READBACK_VERIFIED` | `WRITE_FULL_COMPLETED` |
| — | `FLUSH_COMPLETED` |
| — | `NORMAL_CLOSE_COMPLETED` |
| — | `POST_CLOSE_READBACK_VERIFIED` |
| — | `FINAL_CLOSURE_VERIFIED` — **F4 only** |

A step advances only when its corresponding call, security evidence, or readback actually completes. The two parent gates must pass before `PARENT_AUTHZ_VERIFIED`; `CREATE_COMPLETED`/`CREATE_EMPTY_COMPLETED` require successful create, target `YES`, and an empty new file for the file variant. All five security gates must pass before the object-negative step. A failure release never advances a step.

Machine-checkable constraints include:

| Predicate | Required rule |
|---|---|
| No create call | Count `"0"` ⇒ `create_attempted=false`, `create_result=NOT_CALLED`, `target_created=NO`, no content write. A newly observed object is not claimed as this effect’s creation. |
| Successful create | `create_result=SUCCESS` ⇒ count `"1"`, `target_created=YES`, and completed step at least `CREATE_COMPLETED`/`CREATE_EMPTY_COMPLETED`. |
| Ambiguous/error create | A merely present path cannot establish `target_created=YES`; use `UNVERIFIED` unless a successful retained creation handle proves identity. `NO` after an attempted call requires an `ABSENT` readback. |
| Complete directory | Count `"1"`, target `YES`, all gates PASS, `PRESENT_DIRECTORY` exact-object readback, final directory step reached, `failure_handle_release=NOT_APPLICABLE`. |
| No file write | Call count `"0"` ⇒ `NOT_ATTEMPTED`, returned `"0"`, no flush, and no normal close claimed from failure release. |
| Full file write | `FULL` iff call count `"1"` and returned bytes equal that effect’s exact `raw_byte_length`; only then may flush be attempted. |
| Short/failed/unknown write | `SHORT` has known returned bytes `< raw_byte_length`; `FAILED` may have a known bounded count or `"UNAVAILABLE"`; `UNKNOWN` requires `"UNAVAILABLE"`. None may advance to `WRITE_FULL_COMPLETED` or start a second write/flush. |
| Flush and close | `flush_completed` ⇒ `flush_attempted` and `FULL`; `normal_close_completed` ⇒ flush completed. Failure-release close does not satisfy normal close. |
| Verified file completion | F1–F3 require `POST_CLOSE_READBACK_VERIFIED`; F4 requires `FINAL_CLOSURE_VERIFIED`. Exact `PRESENT_FILE` bytes/hash/object/security and all gates must pass. |
| Failed report | Requires `FailureHandleRelease` in `NO_HANDLES_ACQUIRED` or `RELEASE_ATTEMPTED` form; `NOT_APPLICABLE` forbidden. A failed release yields ambiguous terminal state. |

For a `COMPLETE` report, the failure-release field is exactly `{schema:"VIONA_CODEX_FAILURE_HANDLE_RELEASE_V1",state:"NOT_APPLICABLE"}`; this third union form is forbidden in a `FAILED` report.

## D. Closed final-hierarchy readbacks

```text
VerifiedHierarchyReadback V1
  schema="VIONA_CODEX_VERIFIED_HIERARCHY_READBACK_V1"
  exact keys={schema,status,plan_sha256:H64,
              completed_effect_ids,effect_object_readbacks,
              observed_plan_targets,unexpected_child_count:U0,
              unexpected_children:PATH[],
              final_non_reparse_chain:ObservedNonReparseChain,
              post_close_preservation:LocalCreatePreservationReadback,
              enumerated_at_utc:UTC,raw_enumeration_proof:RawOsEvidence}
  status="VERIFIED"

UnverifiedHierarchyReadback V1
  schema="VIONA_CODEX_UNVERIFIED_HIERARCHY_READBACK_V1"
  exact keys={schema,status,plan_sha256:H64,
              completed_effect_ids,reason,observations,
              errors,observed_at_utc:UTC}
  status="UNVERIFIED"
  reason=ENUMERATION_FAILED|OBJECT_ID_UNAVAILABLE|
         SECURITY_UNREADABLE|REPARSE_UNRESOLVED|
         PATH_RACE|ACCESS_DENIED|HANDLE_RELEASE_UNVERIFIED|OS_ERROR
  observations=LocalObjectReadback[]; errors=OsErrorEvidence[1..]
```

In `VERIFIED`, `effect_object_readbacks` contains exactly one matching verified directory/file identity for each contiguous completed ID. `observed_plan_targets` also records any observed but incomplete failed target; it cannot turn that target into a completed effect. `unexpected_children` is sorted/unique and its length equals `unexpected_child_count`. Success requires `"0"` and the exact eight-path hierarchy. `UNVERIFIED` retains observations and at least one machine error record; a missing observation never proves absence.

## E. Exact outcome union

All variants use marker `VIONA_CODEX_LOCAL_CREATE_OUTCOME_V1`. Common exact keys are `{schema,result_kind,plan_sha256:H64,subject_sha256:H64,authorization_verified,completed_effect_ids,completed_effect_reports,unexpected_effect_status,retry_count,final_hierarchy_readback,terminal_classification}`. `subject_sha256` is the recomputed authorization-subject digest; the field alone does **not** claim operator approval. `retry_count` is always `"0"`.

| Variant | Additional exact keys | Required constraints |
|---|---|---|
| `SUCCESS` | None | `authorization_verified=true`; exactly D1,D2,D3,D4,F1,F2,F3,F4 and eight compatible `COMPLETE` reports; F4 has `FINAL_CLOSURE_VERIFIED`; `unexpected_effect_status=NONE_OBSERVED`; `VerifiedHierarchyReadback` with zero unexpected children, exact bytes/identities, and all nine required post-close preservation entries; `terminal_classification=SUCCESS_VERIFIED`. Failed-effect keys forbidden. |
| `FAILURE` | `{failure_phase,failure_reason,failed_effect_id,failed_effect_report}` | `authorization_verified=true`; completed IDs/reports are an exact contiguous prefix of length 0–7; `failed_effect_id` is exactly the next planned effect; its report is `FAILED` and includes failure-release evidence. `terminal_classification=FAILED_PARTIAL_PREFIX|FAILED_AMBIGUOUS`. |
| `PRE_EFFECT_BLOCK` | `{failure_phase,failure_reason,pre_effect_handle_release}` | Zero create attempts, empty completed IDs/reports, no failed-effect ID/report. `failure_phase=AUTHORIZATION|PLAN|BASELINE|PARENT|SECURITY|SOURCE|TARGET|RESOURCE`; reason is exactly one of `UNTRUSTED_AUTHORIZATION|DIGEST_MISMATCH|BASELINE_DRIFT|PARENT_IDENTITY_DRIFT|REPARSE_OR_CHAIN_MISMATCH|POSITIVE_AUTHZ_DENIED|NEGATIVE_PRESERVATION_FAILED|SOURCE_IDENTITY_MISMATCH|TARGET_PRESENT|UNEXPECTED_CHILD|RESOURCE_OPEN_FAILED|REQUIRED_PROOF_UNAVAILABLE`. `terminal_classification=BLOCKED_PRE_EFFECT`. |

`FAILURE.failure_phase` is the finite enum `CREATE|SECURITY|CONTENT_WRITE|FLUSH|NORMAL_CLOSE|POST_CLOSE_READBACK|FINAL_CLOSURE|RESOURCE_RELEASE`; its reason is `OS_CREATE_ERROR|CREATE_AMBIGUOUS|SECURITY_MISMATCH|AUTHZ_DENIED|WRITE_SHORT|WRITE_ERROR|FLUSH_ERROR|CLOSE_ERROR|READBACK_MISMATCH|FINAL_HIERARCHY_MISMATCH|RESOURCE_RELEASE_UNVERIFIED|UNEXPECTED_EFFECT`, compatible with its phase and failed report.

**Final-closure edge case:** F4 is not a completed effect until final handle closure, hierarchy enumeration and preservation readback pass. If its bytes were written and normally closed but global closure fails, D1–F3 form the seven-effect completed prefix; `failed_effect_id=F4`, F4’s failed report can truthfully show `POST_CLOSE_READBACK_VERIFIED` as its last completed substep, and `failure_phase=FINAL_CLOSURE`. No ninth effect or fabricated retry is introduced. A malformed plan that cannot be parsed and identified cannot generate a typed outcome; it receives a raw parse diagnostic only.

No outcome variant is authority, and this proposal authorizes **no persistent outcome file**.

### Representative rejected combinations

- Directory `COMPLETE` with `create_attempt_count="0"` or `PRESENT_UNVERIFIED`.
- File `FULL` with returned count below its bound raw length, or a second write after `SHORT`.
- File `flush_completed=true` with `write_result=FAILED`; normal close inferred solely from failure release.
- `target_created=YES` after an ambiguous create with only a path-presence readback.
- Failed effect with `failure_handle_release=NOT_APPLICABLE`, a retained handle omitted from release records, or a delete-on-close handle.
- `SUCCESS` with seven reports, an unverified hierarchy, one failed preservation check, or an unexpected child.
- `FAILURE` naming F4 while its completed-prefix list already includes F4.
- `PRE_EFFECT_BLOCK` with any create attempt, failed-effect ID, or fabricated absence from an unavailable readback.

No schema file, outcome, authority, directory or candidate was created; no Git/GitHub mutation or F3 execution occurred.

`LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_V1_2_READY_FOR_FINAL_INDEPENDENT_REREVIEW=YES`  
`DOCS_ONLY_AMENDMENT_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_IMPLEMENTATION_AUTHORIZED=NO`
<!-- END M02 -->

### M03 — V1.3: Release and hierarchy micro-closure

<!-- BEGIN M03; embedded_utf8_length=9597; embedded_sha256=ed7574da7450b14deedab9d6d619a860d2b24464f2b1e3f257d92a2822aaf204 -->
**V1.3 closes V12-01 through V12-04 at specification level.** LC-01, LC-05, all other V1.2 semantics, the D1→F4 order, and F1–F4 identities are unchanged. No authority or implementation is granted.

`V12_01_STATUS=CLOSED`  
`V12_02_STATUS=CLOSED`  
`V12_03_STATUS=CLOSED`  
`V12_04_STATUS=CLOSED`

## Exact type corrections

All unions below reject unknown, missing, duplicate, or null fields. Their discriminators and key sets are exhaustive.

```text
FailureHandleRelease V1
schema="VIONA_CODEX_FAILURE_HANDLE_RELEASE_V1"

NOT_APPLICABLE:
  keys={schema,state}
  state="NOT_APPLICABLE"
  permitted only in report_status=COMPLETE

NO_RETAINED_HANDLES:
  keys={schema,state,retained_handle_count,
        normal_workflow_close_advanced,additional_content_write_calls,
        forbidden_mutation_call_count}
  state="NO_RETAINED_HANDLES"
  retained_handle_count="0"
  normal_workflow_close_advanced=false
  additional_content_write_calls="0"
  forbidden_mutation_call_count="0"
  permitted only in report_status=FAILED

RELEASE_ATTEMPTED:
  keys={schema,state,retained_handle_count,close_records,all_released,
        normal_workflow_close_advanced,additional_content_write_calls,
        forbidden_mutation_call_count}
  state="RELEASE_ATTEMPTED"
  retained_handle_count=length(close_records), value >= 1
  close_records: one HandleReleaseRecord per retained handle,
                 in reverse acquisition order
  all_released=true iff every record is SUCCESS
  normal_workflow_close_advanced=false
  additional_content_write_calls="0"
  forbidden_mutation_call_count="0"
  permitted only in report_status=FAILED
```

`NO_RETAINED_HANDLES` means none were held **when failure release began**; it makes no claim that no handle was acquired earlier. The retired spelling `NO_HANDLES_ACQUIRED` is invalid. Failure release never advances `last_completed_substep` or changes `normal_close_completed`.

`PRE_EFFECT_BLOCK.pre_effect_handle_release` retains its V1.2 purpose but uses a **separate** `PreEffectResourceRelease V1` type, marker `VIONA_CODEX_PRE_EFFECT_RESOURCE_RELEASE_V1`. It has exactly the `NO_RETAINED_HANDLES` and `RELEASE_ATTEMPTED` key sets and constraints above, with that marker; it has no `NOT_APPLICABLE` variant. This keeps `FailureHandleRelease` restricted to effect reports without losing pre-effect resource accounting.

```text
HandleReleaseRecord V1
schema="VIONA_CODEX_HANDLE_RELEASE_RECORD_V1"

SUCCESS:
  keys={schema,handle_ordinal,handle_role,object_path,
        close_attempt_count,close_result,raw_call_evidence}
  close_result="SUCCESS"
  close_attempt_count="1"
  os_error forbidden

ERROR:
  keys={schema,handle_ordinal,handle_role,object_path,
        close_attempt_count,close_result,raw_call_evidence,os_error}
  close_result="ERROR"
  close_attempt_count="1"
  os_error: OsErrorEvidence V1 from the failed OS close call

UNVERIFIED:
  same exact keys as ERROR
  close_result="UNVERIFIED"
  close_attempt_count="1"
  os_error: OsErrorEvidence V1 from the failed OS observation
            that prevents verification—not an invented CloseHandle error
```

The shared fields retain their V1.2 types: `handle_ordinal:U1`, the closed handle-role enum, `object_path:PATH`, and `raw_call_evidence:RawOsEvidence V1`. `ERROR` and `UNVERIFIED` cannot be serialized without real `os_error` evidence. If a crash prevents any such record, the system has ambiguous state for read-only reconciliation; it must not fabricate a typed close result.

### Security-gate entry and preservation entry

```text
LocalCreateSecurityGateEntry V1
schema="VIONA_CODEX_LOCAL_CREATE_SECURITY_GATE_ENTRY_V1"
gate ∈ {PARENT_POSITIVE,PARENT_NEGATIVE,INITIAL_SECURITY,
        OBJECT_POSITIVE,OBJECT_NEGATIVE}

NOT_RUN:
  keys={schema,gate,state}
  state="NOT_RUN"

PASS:
  keys={schema,gate,state,evidence}
  state="PASS"

FAIL:
  keys={schema,gate,state,reason,raw_proof}
  state="FAIL"

UNVERIFIED:
  same exact keys as FAIL
  state="UNVERIFIED"
```

`reason` retains V1.2’s finite set: `ACCESS_DENIED`, `FORBIDDEN_RIGHT_GRANTED`, `OBJECT_ID_MISMATCH`, `SECURITY_MISMATCH`, `REPARSE_OR_CHAIN_MISMATCH`, `PROOF_UNAVAILABLE`; `raw_proof` is `RawOsEvidence V1`. For `PASS`, the evidence type is fixed by gate: `EffectiveAuthzEvidence` for `PARENT_POSITIVE`; `NegativeObjectAuthzEvidence V1` on the exact parent for `PARENT_NEGATIVE`; `InitialSecurityEvidence V1` for `INITIAL_SECURITY`; `EffectiveAuthzEvidence` on a created directory or `PositiveObjectAuthzEvidence V1` on a file for `OBJECT_POSITIVE`; and `NegativeObjectAuthzEvidence V1` on the created object for `OBJECT_NEGATIVE`. The five entries occur exactly once in that order. After a `FAIL` or `UNVERIFIED`, later gates are `NOT_RUN`.

```text
PreservedObjectEntry V1
  schema="VIONA_CODEX_LOCAL_CREATE_PRESERVED_OBJECT_V1"
  keys={schema,object:FsObjectIdentity,
        negative_authz:NegativeObjectAuthzEvidence V1}
  negative_authz.object == object

LocalCreatePreservationReadback V1
  schema="VIONA_CODEX_LOCAL_CREATE_PRESERVATION_READBACK_V1"
  keys={schema,excluded_principal_sids,objects,
        reviewed_method_id,read_after_handles_closed_at_utc,raw_proof}
  objects: PreservedObjectEntry V1[]
```

The existing equality, sorted/unique principal-set, after-close, and success requirement for the evidence parent plus D1–F4—nine exact objects—remain unchanged.

### Three-way hierarchy-readback union

`VerifiedHierarchyReadback V1` and `UnverifiedHierarchyReadback V1` keep their V1.2 markers, exact keys, and meanings. Add:

```text
HierarchyNotPerformed V1
  schema="VIONA_CODEX_HIERARCHY_NOT_PERFORMED_V1"
  keys={schema,status,plan_sha256,completed_effect_ids,
        stopped_phase,reason,observations,recorded_at_utc}
  status="NOT_PERFORMED"
  plan_sha256:H64
  completed_effect_ids: exact contiguous plan prefix
  stopped_phase ∈ {PRE_EFFECT,CREATE,SECURITY,CONTENT_WRITE,FLUSH,
                   NORMAL_CLOSE,POST_CLOSE_READBACK,RESOURCE_RELEASE}
  reason ∈ {PRE_EFFECT_GATE_BLOCKED,EFFECT_GATE_FAILED,
            RESOURCE_RELEASE_FAILED}
  observations: LocalObjectReadback V1[0..16],
                unique by exact path, obtained before progression stopped
  recorded_at_utc:UTC
```

`PRE_EFFECT` pairs only with `PRE_EFFECT_GATE_BLOCKED`; `RESOURCE_RELEASE` only with `RESOURCE_RELEASE_FAILED`; the remaining phases only with `EFFECT_GATE_FAILED`. `NOT_PERFORMED` means **no final hierarchy enumeration was attempted**. It requires no invented OS error. An `ABSENT` observation is allowed only when an actual `AbsentObjectReadback` was obtained before the stop; an omitted observation proves nothing.

`FINAL_CLOSURE` begins at the first final-hierarchy enumeration attempt. A failure before that attempt is classified under the prior gate or `RESOURCE_RELEASE`, not relabeled `FINAL_CLOSURE`.

## Compatibility audit

| Outcome / failure phase | Permitted final hierarchy variant |
|---|---|
| `SUCCESS` | `VERIFIED` only, with all V1.2 success constraints |
| `PRE_EFFECT_BLOCK` | `NOT_PERFORMED` only; zero create attempts |
| `FAILURE / CREATE` | `NOT_PERFORMED` |
| `FAILURE / SECURITY` | `NOT_PERFORMED` |
| `FAILURE / CONTENT_WRITE` | `NOT_PERFORMED` |
| `FAILURE / FLUSH` | `NOT_PERFORMED` |
| `FAILURE / NORMAL_CLOSE` | `NOT_PERFORMED` |
| `FAILURE / POST_CLOSE_READBACK` | `NOT_PERFORMED` |
| `FAILURE / RESOURCE_RELEASE` | `NOT_PERFORMED` |
| `FAILURE / FINAL_CLOSURE` | `VERIFIED` or `UNVERIFIED`; enumeration was attempted |

An initial failure outcome with `NOT_PERFORMED` may be followed by a **separately identified read-only reconciliation**. That later observation does not rewrite the outcome, complete an effect, or authorize retry.

The report and outcome predicates are now:

- `report_status=COMPLETE` ⇔ `failure_handle_release.state=NOT_APPLICABLE`; `FAILED` ⇔ `NO_RETAINED_HANDLES|RELEASE_ATTEMPTED`.
- A release record with `close_result=SUCCESS` forbids `os_error`; `ERROR|UNVERIFIED` requires it. Each retained handle receives exactly one close attempt.
- File write count remains `"0"|"1"`. No write implies `NOT_ATTEMPTED`, returned `"0"`, and no flush; only a full exact-length write permits flush; completed flush precedes normal close. Failure release cannot satisfy normal close.
- `SUCCESS` requires eight compatible `COMPLETE` reports and verified final hierarchy. `FAILURE` retains a contiguous prefix of at most seven and names exactly the next failed effect; F4’s final-closure rule remains unchanged. `PRE_EFFECT_BLOCK` has no failed effect and uses `HierarchyNotPerformed V1`.
- A `VERIFIED` hierarchy with a failed final security/preservation condition remains a `FAILURE`, never `SUCCESS`.

Representative invalid states: `COMPLETE+RELEASE_ATTEMPTED`; `FAILED+NOT_APPLICABLE`; `SUCCESS` close record carrying `os_error`; `UNVERIFIED` close record lacking it; `PRE_EFFECT_BLOCK+UNVERIFIED` hierarchy; `FINAL_CLOSURE+NOT_PERFORMED`; `CONTENT_WRITE+VERIFIED` hierarchy; a short write followed by flush; and a failure-release close that advances `NORMAL_CLOSE_COMPLETED`.

I ran **39 bounded in-memory predicate cases, 0 failures**, covering release/report-status pairs, the phase-to-hierarchy matrix, write/flush/close contradictions, and outcome-kind combinations. This is not full schema, OS, Authz, or runtime validation. No filesystem, Git, or GitHub mutation occurred; F3 was not executed.

`LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_V1_3_READY_FOR_FINAL_GREEN_REVIEW=YES`  
`DOCS_ONLY_AMENDMENT_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_IMPLEMENTATION_AUTHORIZED=NO`
<!-- END M03 -->

### M04 — V1.4: Mismatch and outcome compatibility closure

<!-- BEGIN M04; embedded_utf8_length=11447; embedded_sha256=c74df84e1ac75bf3d20c71b41165c7e6379a24b4e08e5d0fc38d0e994081b98d -->
**V1.4 closes V13-01 and V13-02 as a specification proposal.** V1.3 definitions and previously GREEN decisions remain in force except for the bounded readback-union and outcome-compatibility additions below. No Pack A effect is authorized.

`V13_01_STATUS=CLOSED_SPEC_ONLY`  
`V13_02_STATUS=CLOSED_SPEC_ONLY`

## V13-01 — measured mismatch is not uncertainty

`final_hierarchy_readback` is now an exact four-way union, dispatched by both marker and `status`:

| Variant | Meaning |
|---|---|
| `VERIFIED` | Final enumeration and every required closure predicate passed. |
| `MISMATCH` | Required observations succeeded; at least one predicate was measured false. |
| `UNVERIFIED` | A required OS/read observation could not be established. |
| `NOT_PERFORMED` | An earlier gate stopped progression before final enumeration. |

The V1.3 definitions of `VERIFIED`, `UNVERIFIED`, and `NOT_PERFORMED` otherwise remain unchanged. `VERIFIED` cannot contain an unexpected child or failed preservation predicate.

```text
HierarchyMismatchReadback V1
  schema="VIONA_CODEX_HIERARCHY_MISMATCH_READBACK_V1"
  exact keys={
    schema,status,plan_sha256,completed_effect_ids,
    observed_parent_chain,observed_plan_targets,
    unexpected_child_count,unexpected_children,
    preservation_checks,mismatch_witnesses,
    enumerated_at_utc,raw_enumeration_proof
  }
  status="MISMATCH"
  plan_sha256:H64
  completed_effect_ids: exact contiguous completed prefix
  observed_plan_targets: exactly D1,D2,D3,D4,F1,F2,F3,F4, in plan order
  unexpected_child_count:U0 =
    length(unexpected_children)
  mismatch_witnesses: HierarchyMismatchWitness V1[1..]
  raw_enumeration_proof: RawOsEvidence V1
```

`observed_parent_chain` is an ordered array of closed `HierarchyObservedObject V1` entries from the volume root through the evidence parent and relevant created parents. `observed_plan_targets` uses the same type with an exact `effect_id`. Its variants are:

```text
HierarchyObservedObject V1
  schema="VIONA_CODEX_HIERARCHY_OBSERVED_OBJECT_V1"

  PRESENT_NORMAL:
    keys={schema,kind,exact_path,effect_id,readback}
    readback=PresentDirectoryReadback|PresentFileReadback

  ABSENT:
    keys={schema,kind,exact_path,effect_id,readback}
    readback=AbsentObjectReadback from an actual observation

  REPARSE:
    keys={schema,kind,exact_path,effect_id,readback}
    readback=ObservedReparseObjectEvidence V1
```

For ancestor-chain entries only, `effect_id` is the fixed literal `ANCESTOR`; for plan targets it is the matching D1–F4 ID. Each readback path must equal `exact_path`. `PRESENT_UNVERIFIED` and `UNAVAILABLE` are forbidden in `MISMATCH`; either makes the hierarchy `UNVERIFIED`. Missing evidence never becomes an `ABSENT` entry.

```text
ObservedReparseObjectEvidence V1
  schema="VIONA_CODEX_OBSERVED_REPARSE_OBJECT_V1"
  keys={schema,exact_path:PATH,object_kind,volume_guid_path:PATH,
        volume_serial_hex:H16,file_id_hex:H32,reparse_tag_hex:H8,
        raw_proof:RawOsEvidence V1}
  object_kind=DIRECTORY|FILE

UnexpectedChildEvidence V1
  schema="VIONA_CODEX_UNEXPECTED_CHILD_EVIDENCE_V1"
  keys={schema,exact_path:PATH,object_kind,
        volume_serial_hex:H16,file_id_hex:H32,
        raw_proof:RawOsEvidence V1}
  object_kind=DIRECTORY|FILE|OTHER
```

The success-only `FsObjectIdentity` is **not** misused to assert `is_reparse_point=false` for a measured reparse point.

Preservation evaluation is a separate closed result union; it does not put a false `forbidden_mask_intersection_zero:true` into the success-only `NegativeObjectAuthzEvidence`:

```text
PreservationCheck V1
  schema="VIONA_CODEX_LOCAL_CREATE_PRESERVATION_CHECK_V1"

  PASS:
    keys={schema,status,object,evidence}
    status="PASS"
    object:FsObjectIdentity
    evidence:NegativeObjectAuthzEvidence V1
    evidence.object==object

  MISMATCH:
    keys={schema,status,object,witness}
    status="MISMATCH"
    witness:ForbiddenRightWitness V1
    witness.object==object

  UNVERIFIED:
    keys={schema,status,object,error}
    status="UNVERIFIED"
    error:actual OsErrorEvidence V1; no invented OS code

ForbiddenRightWitness V1
  schema="VIONA_CODEX_FORBIDDEN_RIGHT_WITNESS_V1"
  keys={schema,object:FsObjectIdentity,tested_token:TokenIdentity,
        principal_sid:SID,requested_forbidden_mask_hex:H8,
        observed_granted_mask_hex:H8,forbidden_intersection_hex:H8,
        observed_at_utc:UTC,raw_proof:RawOsEvidence V1}
  forbidden_intersection =
    requested_forbidden_mask & observed_granted_mask
  forbidden_intersection != 0
  principal_sid belongs to the exact reviewed excluded set
```

`HierarchyMismatchReadback.preservation_checks` contains a `PASS` or `MISMATCH` check for each object on which preservation is required and measurable. Any required `UNVERIFIED` check changes the *hierarchy* variant to `UNVERIFIED`, even if another predicate was already measured false.

`HierarchyMismatchWitness V1` has marker `VIONA_CODEX_HIERARCHY_MISMATCH_WITNESS_V1` and the following exact reason-discriminated key sets. Each witness must match a successfully obtained observation in the same readback:

| Reason | Exact keys besides `{schema,reason}` |
|---|---|
| `OBJECT_ID_MISMATCH` | `{effect_id,expected_object:FsObjectIdentity,observed_object:FsObjectIdentity}`; volume/file IDs differ. |
| `CONTENT_MISMATCH` | `{effect_id,expected_byte_length:U0,expected_sha256:H64,observed_file:PresentFileReadback}`; length or SHA differs. |
| `SECURITY_MISMATCH` | `{effect_id,expected_owner_sid:SID,expected_sd_sha256:H64,expected_dacl_sha256:H64,observed_object:FsObjectIdentity}`; at least one security identity differs. |
| `REPARSE_DETECTED` | `{effect_id,observed_reparse:ObservedReparseObjectEvidence}`. |
| `UNEXPECTED_CHILD` | `{unexpected_child:UnexpectedChildEvidence}`; its path appears exactly once in `unexpected_children`. |
| `PRESERVATION_FORBIDDEN_RIGHT_GRANTED` | `{preservation_check:PreservationCheck V1}`; its variant must be `MISMATCH`. |
| `TARGET_ABSENT` | `{effect_id,observed_absence:AbsentObjectReadback}`; an actual absence observation is required. |

The first six reasons are the requested minimum; `TARGET_ABSENT` closes the measured-missing-target case. `mismatch_witnesses` is nonempty, sorted by plan effect/path then reason, and contains no duplicate predicate witness. All required final observations must be available; otherwise the readback is `UNVERIFIED`, not `MISMATCH`. No `OsErrorEvidence` is fabricated for a measured false predicate.

## V13-02 — exact outcome compatibility

### A. `PRE_EFFECT_BLOCK`

Only these `(failure_phase, failure_reason, authorization_verified)` tuples are valid. Its hierarchy variant remains `NOT_PERFORMED`, with no create attempt or failed-effect ID.

| Phase | Exact allowed reason set | `authorization_verified` |
|---|---|---|
| `AUTHORIZATION` | `UNTRUSTED_AUTHORIZATION` | `false` |
| `PLAN` | `DIGEST_MISMATCH` | `false` |
| `BASELINE` | `BASELINE_DRIFT` | `true` |
| `PARENT` | `PARENT_IDENTITY_DRIFT`, `REPARSE_OR_CHAIN_MISMATCH` | `true` |
| `SECURITY` | `POSITIVE_AUTHZ_DENIED`, `NEGATIVE_PRESERVATION_FAILED`, `REQUIRED_PROOF_UNAVAILABLE` | `true` |
| `SOURCE` | `SOURCE_IDENTITY_MISMATCH` | `true` |
| `TARGET` | `TARGET_PRESENT`, `UNEXPECTED_CHILD` | `true` |
| `RESOURCE` | `RESOURCE_OPEN_FAILED`, `REQUIRED_PROOF_UNAVAILABLE` | `true` |

A plan that cannot be parsed and identified still receives only a raw diagnostic, as in V1.3; this table does not manufacture a typed outcome for it.

### B. `FAILURE`

The following table is exhaustive. `D` means `DIRECTORY`; `F` means `FILE`. All rows also require the V1.3 contiguous prefix, the next `failed_effect_id`, a compatible `FAILED` effect report, mandatory failure release, and `retry_count="0"`. Any unlisted combination is rejected rather than coerced into a different reason.

| `failure_phase` | Exact `failure_reason` | Kind | Exact allowed `last_completed_substep` | Hierarchy |
|---|---|---|---|---|
| `CREATE` | `OS_CREATE_ERROR`, `CREATE_AMBIGUOUS` | D or F | `PARENT_AUTHZ_VERIFIED` | `NOT_PERFORMED` |
| `SECURITY` | `SECURITY_MISMATCH` | D | `CREATE_COMPLETED` | `NOT_PERFORMED` |
| `SECURITY` | `SECURITY_MISMATCH` | F | `CREATE_EMPTY_COMPLETED` | `NOT_PERFORMED` |
| `SECURITY` | `AUTHZ_DENIED` | D or F | `NONE`, `INITIAL_SECURITY_VERIFIED`, or `OBJECT_POSITIVE_AUTHZ_VERIFIED` | `NOT_PERFORMED` |
| `SECURITY` | `READBACK_MISMATCH`, `READBACK_UNVERIFIED` | D | `OBJECT_NEGATIVE_AUTHZ_VERIFIED` | `NOT_PERFORMED` |
| `CONTENT_WRITE` | `WRITE_SHORT`, `WRITE_ERROR` | F | `OBJECT_NEGATIVE_AUTHZ_VERIFIED` | `NOT_PERFORMED` |
| `FLUSH` | `FLUSH_ERROR` | F | `WRITE_FULL_COMPLETED` | `NOT_PERFORMED` |
| `NORMAL_CLOSE` | `CLOSE_ERROR` | F | `FLUSH_COMPLETED` | `NOT_PERFORMED` |
| `POST_CLOSE_READBACK` | `READBACK_MISMATCH`, `READBACK_UNVERIFIED` | F | `NORMAL_CLOSE_COMPLETED` | `NOT_PERFORMED` |
| `FINAL_CLOSURE` | `FINAL_HIERARCHY_MISMATCH` | F4 only | `POST_CLOSE_READBACK_VERIFIED` | `MISMATCH` with a non-`UNEXPECTED_CHILD` false-predicate witness |
| `FINAL_CLOSURE` | `UNEXPECTED_EFFECT` | F4 only | `POST_CLOSE_READBACK_VERIFIED` | `MISMATCH` with an `UNEXPECTED_CHILD` witness |
| `FINAL_CLOSURE` | `FINAL_HIERARCHY_UNVERIFIED` | F4 only | `POST_CLOSE_READBACK_VERIFIED` | `UNVERIFIED` with actual OS/read uncertainty evidence |
| `RESOURCE_RELEASE` | `RESOURCE_RELEASE_UNVERIFIED` | F4 only | `POST_CLOSE_READBACK_VERIFIED` | `NOT_PERFORMED` |

`READBACK_UNVERIFIED` and `FINAL_HIERARCHY_UNVERIFIED` are the bounded reason literals needed to distinguish unavailable proof from a measured mismatch; no other V1.3 reason is reinterpreted. Per-effect directory readback remains part of the `SECURITY` gate, while `POST_CLOSE_READBACK` is file-only.

Final closure uses this deterministic precedence:

1. Any required observation unavailable → `UNVERIFIED` / `FINAL_HIERARCHY_UNVERIFIED`.
2. Otherwise, an unexpected child → `MISMATCH` / `UNEXPECTED_EFFECT`.
3. Otherwise, any other false closure predicate → `MISMATCH` / `FINAL_HIERARCHY_MISMATCH`.
4. Otherwise all predicates pass → `VERIFIED`, so `FAILURE / FINAL_CLOSURE` is **forbidden**.

Thus there is no non-contradictory `FINAL_CLOSURE` failure with `VERIFIED`; V1.4 forbids that pairing. `SUCCESS` requires `VERIFIED`; `PRE_EFFECT_BLOCK` requires `NOT_PERFORMED`; every `FAILURE` before `FINAL_CLOSURE` requires `NOT_PERFORMED`.

### C. Bounded in-memory audit

| Cross-product | Tested | Accepted | Rejected |
|---|---:|---:|---:|
| Every PRE_EFFECT phase × reason × authorization boolean | 192 | 13 | 179 |
| Every FAILURE phase × reason × four hierarchy variants | 448 | 16 | 432 |
| Preservation status × zero/nonzero/unknown forbidden-right intersection | 9 | 3 | 6 |
| FAILURE phase × reason × hierarchy × object kind × completed substep | 11,648 | 24 | 11,624 |

Three additional representative scenarios—unexpected child, measured forbidden right, and OS/read uncertainty—selected `MISMATCH`, `MISMATCH`, and `UNVERIFIED` respectively; **0 failed checks**. These are bounded symbolic/in-memory checks of the stated predicates, **not** full schema, Windows, Authz, or runtime proof. F3 was not executed.

`LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_V1_4_READY_FOR_FINAL_GREEN_REVIEW=YES`  
`DOCS_ONLY_AMENDMENT_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_IMPLEMENTATION_AUTHORIZED=NO`

No filesystem, Git, or GitHub mutation occurred.
<!-- END M04 -->

### M05 — V1.5: Final retained-handle release closure

<!-- BEGIN M05; embedded_utf8_length=5171; embedded_sha256=5325eff8e14123015fe486644a97ba1695e19463bc8104435c820d10f4875e04 -->
`V14_01_STATUS=CLOSED_SPEC_ONLY`

V1.5 adds one global final-release record. It does not change `HandleReleaseRecord V1`, the V1.4 hierarchy union, or the earlier per-effect failure-release rules.

## FinalRetainedHandleRelease V1

```text
schema="VIONA_CODEX_FINAL_RETAINED_HANDLE_RELEASE_V1"

exact keys={
  schema,state,retained_handle_count,retained_handles_at_entry,
  close_records,all_released,additional_content_write_calls,
  forbidden_mutation_call_count,release_completed_at_utc
}

state=COMPLETE|FAILED
retained_handle_count:U0
retained_handles_at_entry:RetainedHandleObjectReadback V1[]
close_records:HandleReleaseRecord V1[]
all_released:boolean
additional_content_write_calls="0"
forbidden_mutation_call_count="0"
release_completed_at_utc:UTC
```

`retained_handle_count` equals the length of **both** arrays. Handle ordinals in `retained_handles_at_entry` are unique and increasing by acquisition order. `close_records` contains exactly the same ordinals in **strictly reverse** order, one record and one close attempt per handle. It uses the existing `HandleReleaseRecord V1` success/error/unverified variants and their raw evidence—no second close API or evidence shape.

`all_released=true` iff every close record is `SUCCESS`; `state=COMPLETE` iff `all_released=true`. Thus one `ERROR` or `UNVERIFIED` record requires `state=FAILED` and `all_released=false`. The record is evidence, not permission to reclose a handle.

## Placement and transitions

`final_handle_release` is a **top-level outcome field**, not a copy in each effect report. Let `K` be the unchanged V1.4 common outcome key set:

```text
K={schema,result_kind,plan_sha256,subject_sha256,
   authorization_verified,completed_effect_ids,
   completed_effect_reports,unexpected_effect_status,
   retry_count,final_hierarchy_readback,terminal_classification}
```

The exact V1.5 outcome key sets are:

| Outcome variant | Exact key set |
|---|---|
| `SUCCESS` | `K ∪ {final_handle_release}` |
| `FAILURE`, phase before final release | `K ∪ {failure_phase,failure_reason,failed_effect_id,failed_effect_report}`; `final_handle_release` forbidden |
| `FAILURE / FINAL_CLOSURE` or `FAILURE / RESOURCE_RELEASE` | `K ∪ {failure_phase,failure_reason,failed_effect_id,failed_effect_report,final_handle_release}` |
| `PRE_EFFECT_BLOCK` | `K ∪ {failure_phase,failure_reason,pre_effect_handle_release}`; `final_handle_release` forbidden |

After F4 reaches `POST_CLOSE_READBACK_VERIFIED`, final release exclusively takes all remaining retained handles. **Only** `COMPLETE` with `all_released=true` permits final hierarchy enumeration. `VERIFIED` hierarchy plus passing preservation then advances F4 to `FINAL_CLOSURE_VERIFIED`.

If any final close is `ERROR` or `UNVERIFIED`, the executor still attempts each *other* retained handle once. It makes no second attempt on any ordinal, issues no new content write or filesystem repair, and stops before final enumeration. The outcome is exactly `FAILURE / RESOURCE_RELEASE / RESOURCE_RELEASE_UNVERIFIED`, `failed_effect_id=F4`, F4’s last completed substep `POST_CLOSE_READBACK_VERIFIED`, `final_handle_release.state=FAILED`, and hierarchy `NOT_PERFORMED`.

For either final-phase failure, F4’s required per-effect `failure_handle_release` is `NO_RETAINED_HANDLES` with count `"0"`: final release has already taken exclusive ownership of **every remaining first-close attempt**. This asserts no handle is eligible to be passed to `FailureHandleRelease`; it does **not** assert that an OS handle whose final close returned `ERROR` is certainly closed. That unresolved state is recorded by the global `FinalRetainedHandleRelease` and remains terminal/ambiguous. No ordinal in its `close_records` may appear in `FailureHandleRelease.close_records`.

| Outcome | Final release | Hierarchy | Valid? |
|---|---|---|---|
| `SUCCESS` | `COMPLETE`, all released | `VERIFIED` | Yes, subject to all V1.4 success predicates |
| `FAILURE / FINAL_CLOSURE` | `COMPLETE`, all released | `MISMATCH` or `UNVERIFIED` | Yes |
| `FAILURE / RESOURCE_RELEASE` | `FAILED`, not all released | `NOT_PERFORMED` | Yes |
| Any other pairing of these states | — | — | Reject |

Earlier effect failures never enter final release; they retain V1.3 `FailureHandleRelease` behavior.

## Bounded checks

I ran 17 in-memory cases, **0 failures**. They rejected: `COMPLETE` with an error record; `FAILED` with all-success records; duplicate or omitted ordinals; a second close attempt; non-reverse close order; hierarchy enumeration before complete release; `RESOURCE_RELEASE` with `VERIFIED`; `FINAL_CLOSURE` with failed release; `SUCCESS` with failed release; and an ordinal appearing in both final and failure-release sets. The checks also accepted the three valid compatibility rows above. This is bounded symbolic validation, not OS or full-schema proof.

No filesystem, Git, or GitHub mutation occurred. F3 was not executed.

`LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_V1_5_READY_FOR_FINAL_GREEN_REVIEW=YES`  
`DOCS_ONLY_AMENDMENT_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_IMPLEMENTATION_AUTHORIZED=NO`
<!-- END M05 -->

### M06 — V1.6: Release delegation and handle-record correspondence closure

<!-- BEGIN M06; embedded_utf8_length=4329; embedded_sha256=27a883f8dfb10da55587b298cf3a90c0546efe8ad91967476a54b1175ca714f6 -->
`V15_01_STATUS=CLOSED_SPEC_ONLY`  
`V15_02_STATUS=CLOSED_SPEC_ONLY`

V1.6 preserves `NO_RETAINED_HANDLES` exactly: **no retained OS handles exist when per-effect failure release begins**. It is not used to describe a failed global close.

## Corrected FailureHandleRelease V1 union

The marker remains `VIONA_CODEX_FAILURE_HANDLE_RELEASE_V1`. Its four exact variants are:

| State | Exact key set | Permitted use |
|---|---|---|
| `NOT_APPLICABLE` | `{schema,state}` | `COMPLETE` effect reports only |
| `NO_RETAINED_HANDLES` | V1.3 key set and literal constraints, unchanged | `FAILED` reports only when genuinely no retained handles exist at per-effect failure-release entry |
| `RELEASE_ATTEMPTED` | V1.3 key set and literal constraints, unchanged | `FAILED` reports for per-effect close attempts |
| `DELEGATED_TO_FINAL_RELEASE` | `{schema,state,final_handle_release_sha256}` | `FAILED` F4 reports only for `FINAL_CLOSURE` or `RESOURCE_RELEASE` |

For the new variant, `state="DELEGATED_TO_FINAL_RELEASE"` and `final_handle_release_sha256:H64` must equal:

```text
SHA256(JCS_UTF8(exact FinalRetainedHandleRelease V1))
```

The lowercase hex digest is outside `FinalRetainedHandleRelease`; that object contains no self-hash. The per-effect release path makes **zero** close calls in this variant. The outcome’s top-level `final_handle_release` is the exact object whose digest is referenced. A supplied digest without that matching object is invalid.

F4’s final-phase `FAILED` report must use `DELEGATED_TO_FINAL_RELEASE`, whether the global release is `COMPLETE` followed by a hierarchy failure or is itself `FAILED`. If a global close returns `ERROR` or `UNVERIFIED`, V1.6 makes **no** `NO_RETAINED_HANDLES` claim about that OS handle. Earlier failed effects retain their V1.3 release variants. A successful F4 report uses `NOT_APPLICABLE`.

## Final entry ↔ close-record correspondence

`FinalRetainedHandleRelease V1` keeps its V1.5 marker and key set. At entry, `retained_handles_at_entry` must equal the executor’s complete ordered ledger of **still-open, authority-bearing retained handles**. Each `RetainedHandleObjectReadback V1` entry has a unique, monotonically increasing acquisition ordinal.

For each entry `E`, exactly one existing `HandleReleaseRecord V1` record `C` is required:

```text
C.handle_ordinal == E.handle_ordinal
C.handle_role    == E.handle_role
C.object_path    == E.object.exact_path
C.close_attempt_count == "1"
```

`close_records` must equal that entry list in strict reverse order. Its length and the entry-list length both equal `retained_handle_count`. Foreign, duplicate, omitted, reordered, role-substituted, or path-substituted records block classification. Completeness must be checked against the trusted executor’s live retained-handle ledger, not merely by comparing two caller-provided arrays.

For this Pack A profile, `retained_handle_count` must be **at least `"1"`**: the validated evidence-parent handle remains retained through F4’s post-close readback. Zero is not a valid Pack A final-release instance. An `ERROR` or `UNVERIFIED` close record requires `all_released=false` and `state=FAILED`; all-success records require `all_released=true` and `state=COMPLETE`.

An ordinal appearing in global `close_records` is terminal for close-attempt budgeting. It must never appear in per-effect `FailureHandleRelease.close_records`, regardless of whether the OS close succeeded. The existing outcome placement and compatibility remain: `SUCCESS → COMPLETE → VERIFIED`; `FAILURE / FINAL_CLOSURE → COMPLETE → MISMATCH|UNVERIFIED`; `FAILURE / RESOURCE_RELEASE → FAILED → NOT_PERFORMED`.

I ran **15 bounded in-memory cases, 0 failures**. They rejected the requested wrong digest, role/path substitution, foreign/omitted/duplicate ordinal, second close, incorrect order, false `NO_RETAINED_HANDLES` delegation, and success with delegated failed release. This is symbolic contract checking; no real final-release bytes or SHA-256 were produced.

No filesystem, Git, or GitHub mutation occurred. F3 was not executed.

`LOCAL_CREATE_ENVELOPE_SUCCESSOR_SPEC_V1_6_READY_FOR_FINAL_GREEN_REVIEW=YES`  
`DOCS_ONLY_AMENDMENT_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_SOURCE_WRITE_AUTHORITY_READY_FOR_OPERATOR_REVIEW=NO`  
`PACK_A_IMPLEMENTATION_AUTHORIZED=NO`
<!-- END M06 -->

### M07 — transfer A: VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md

<!-- BEGIN M07; raw_utf8_length=14048; raw_sha256=ddf201bfef00afadeaf5c53b7c44de26a035dd1ef70411326ed8c3c92d837d51 -->
## 2. Bản bổ sung serialization để review

```text
PROPOSAL_ID=
VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1

STATUS=TECHNICAL_PROPOSAL_PENDING_INDEPENDENT_REVIEW
WRITE_AUTHORITY=NONE
```

### A. Hai kiểu effect — khai báo đầy đủ, không kế thừa ngầm

Tất cả field bên dưới đều bắt buộc. Không có field tùy chọn, field bổ sung hoặc `null`.

```text
DirectoryCreateEffect V1.1

schema =
  "VIONA_CODEX_DIRECTORY_CREATE_EFFECT_V1_1"

exact fields = {
  schema:
    literal("VIONA_CODEX_DIRECTORY_CREATE_EFFECT_V1_1"),

  effect_id:
    enum("D1", "D2", "D3", "D4"),

  sequence:
    U1,

  exact_path:
    PATH,

  object_kind:
    literal("DIRECTORY"),

  operation:
    literal("CREATE_NEW"),

  fail_if_exists:
    literal(true),

  parent_binding:
    ExistingBoundObject V1 | PriorEffectReadback V1,

  creation_security:
    CreationSecurity V1,

  required_parent_access_mask_hex:
    H8,

  require_no_reparse:
    literal(true),

  post_create_object_readback:
    literal("VOLUME_FILE_ID_OWNER_SD_REPARSE")
}
```

```text
FileCreateEffect V1.1

schema =
  "VIONA_CODEX_FILE_CREATE_EFFECT_V1_1"

exact fields = {
  schema:
    literal("VIONA_CODEX_FILE_CREATE_EFFECT_V1_1"),

  effect_id:
    enum("F1", "F2", "F3", "F4"),

  sequence:
    U1,

  exact_path:
    PATH,

  object_kind:
    literal("FILE"),

  operation:
    literal("CREATE_NEW"),

  fail_if_exists:
    literal(true),

  parent_binding:
    PriorEffectReadback V1,

  creation_security:
    CreationSecurity V1,

  required_parent_access_mask_hex:
    H8,

  require_no_reparse:
    literal(true),

  post_create_object_readback:
    literal("VOLUME_FILE_ID_OWNER_SD_REPARSE"),

  raw_byte_length:
    U0,

  raw_sha256:
    H64,

  prewrite_source_parity:
    literal(true),

  content_mutation_budget:
    FileContentMutationBudget V1,

  post_close_content_object_readback:
    literal(true)
}
```

**Các ràng buộc đi kèm không đổi nghĩa thực thi:**

`creation_security` dùng nguyên `CreationSecurity V1` của V1.2: descriptor được áp dụng ngay tại create, không sửa ACL sau đó. `content_mutation_budget` dùng nguyên `FileContentMutationBudget V1`: một content-write invocation, offset 0, không append/seek/backpatch/truncate/rewrite, short write dừng.

`required_parent_access_mask_hex` phải khớp mask được yêu cầu trong positive-Authz evidence cho **đúng parent và actual effecting token**. Bản bổ sung này không chọn mask hoặc tạo proof.

`prewrite_source_parity=true` yêu cầu kiểm cả raw length và SHA-256 trước file create và trước content write. Hai field readback là **yêu cầu phải thực hiện**, không phải bằng chứng readback đã PASS.

Các field owner/SD từng được đặt ở cấp effect được thay thế tường minh:

| Field cũ ở cấp effect | Vị trí duy nhất trong bản đề xuất |
|---|---|
| `expected_created_owner_sid` | `creation_security.expected_created_owner_sid` |
| `expected_created_sd_sha256` | `creation_security.expected_created_sd_sha256` |
| Expected DACL identity | `creation_security.expected_created_dacl_sha256` |

**Không chấp nhận đồng thời field phẳng cũ và field lồng mới.** Điều này loại bỏ khả năng hai giá trị expected-security khác nhau cùng xuất hiện.

### B. Hai kiểu parent binding

Tôi đề xuất dùng `FsObjectIdentity V1` trực tiếp cho parent tồn tại sẵn. Kiểu này đã có exact path, volume, file ID, owner, SD/DACL, NTFS và non-reparse trong nguồn baseline; không cần tạo thêm một kiểu `volume_identity` chưa rõ cấu trúc. fileciteturn58file0L7-L13

```text
ExistingBoundObject V1

schema =
  "VIONA_CODEX_EXISTING_BOUND_OBJECT_V1"

exact fields = {
  schema:
    literal("VIONA_CODEX_EXISTING_BOUND_OBJECT_V1"),

  kind:
    literal("EXISTING_BOUND_OBJECT"),

  object:
    FsObjectIdentity V1,

  non_reparse_chain:
    ExpectedNonReparseChain V1
}
```

Ràng buộc:

```text
object ==
  LocalCreatePlan.security_contract.existing_parent_identity

non_reparse_chain ==
  LocalCreatePlan.security_contract.non_reparse_chain

non_reparse_chain.final_parent_path == object.exact_path

last(non_reparse_chain.ordered_objects) == object
```

Đây là **thay đổi biểu diễn được đề xuất công khai**: các field cũ `exact_path`, `file_id`, `owner_sid`, `security_descriptor_sha256`, `filesystem_type` và các thành phần volume được đặt trong `object`, theo đúng tên của `FsObjectIdentity`. `non_reparse_chain` không còn là một boolean thay cho danh sách object.

```text
PriorEffectReadback V1

schema =
  "VIONA_CODEX_PRIOR_EFFECT_READBACK_V1"

exact fields = {
  schema:
    literal("VIONA_CODEX_PRIOR_EFFECT_READBACK_V1"),

  kind:
    literal("PRIOR_EFFECT_READBACK"),

  parent_effect_id:
    enum("D1", "D2", "D3", "D4"),

  exact_path:
    PATH,

  require_completed_prior_effect:
    literal(true),

  require_exact_readback_match:
    literal(true),

  retain_validated_parent_handle:
    literal(true)
}
```

Ràng buộc:

```text
parent_effect_id names an earlier DIRECTORY effect.

exact_path == that parent effect's exact_path.

Before the dependent effect:
  the parent effect is COMPLETE;
  its directory readback and security gates are verified;
  the retained handle resolves to that same verified object.

Caller-supplied path/readback alone cannot satisfy this requirement.
```

Không thêm native handle value vào JSON. Handle thực tế và ledger vẫn được kiểm theo cơ chế runtime đã đặc tả.

Mapping cho profile Pack A giữ nguyên:

| Effect | Sequence | Parent |
|---|---:|---|
| D1 | `"1"` | Existing evidence parent |
| D2 | `"2"` | D1 |
| D3 | `"3"` | D2 |
| D4 | `"4"` | D2 |
| F1 | `"5"` | D2 |
| F2 | `"6"` | D2 |
| F3 | `"7"` | D3 |
| F4 | `"8"` | D4 |

`effect_id`, `sequence`, `exact_path` và parent phải đồng thời khớp bảng path đã chọn. Không chỉ kiểm rằng sequence tăng dần.

### B.1. SER-01 — explicit security-contract field rebind

This section is a proposed correction to SER-01, pending independent
rereview. It does not claim that the rebind already existed in V1.6.
This V1_1 transfer revision replaces the V1 serialization-delta transfer
artifact; do not apply both transfer revisions as separate deltas.

Predecessor transfer identity:
- file: `VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1.md`
- raw UTF-8 length: `8156`
- raw SHA-256: `3ebd3007e353b5ed6fae3139104d184fd8fbbb19b2e07ea5a6e416b76d1304c4`

#### One exact merged field type

```text
LocalCreateSecurityContract V1
  schema = "VIONA_CODEX_LOCAL_CREATE_SECURITY_CONTRACT_V1"

  exact keys = {
    schema,
    existing_parent_identity,
    non_reparse_chain,
    effecting_token,
    excluded_principal_sids,
    reviewed_positive_authz_method_id,
    reviewed_negative_authz_method_id,
    directory_forbidden_mask_hex,
    file_forbidden_mask_hex,
    security_at_initial_create,
    post_create_acl_repair,
    post_close_preservation_required
  }

  REBIND exactly one field:
    non_reparse_chain: ExpectedNonReparseChain V1

  KEEP:
    The other eleven keys, their types, values, and constraints
    retain their existing reviewed meanings.
    existing_parent_identity remains FsObjectIdentity V1.
    The LocalCreateSecurityContract schema literal is unchanged.

ExpectedNonReparseChain V1
  schema = "VIONA_CODEX_EXPECTED_NON_REPARSE_CHAIN_V1"

  exact fields = {
    schema:
      literal("VIONA_CODEX_EXPECTED_NON_REPARSE_CHAIN_V1"),

    ordered_objects:
      ordered array of FsObjectIdentity V1,

    final_parent_path:
      PATH
  }
```

The bare array formerly described at
`LocalCreateSecurityContract.non_reparse_chain` is explicitly superseded
by this structured object. The array is now represented only at
`LocalCreateSecurityContract.non_reparse_chain.ordered_objects`.

This is a normative merge rule for the proposed successor specification,
not a runtime data migration. The verifier must reject a bare array at
either `LocalCreateSecurityContract.non_reparse_chain` or
`ExistingBoundObject.non_reparse_chain`. It must not wrap, coerce, or
accept that array as an alias. No boolean form is accepted either.

#### The two use sites and their equality

```text
Let S be LocalCreatePlan V1.1.security_contract.
Let B be the ExistingBoundObject V1 parent binding for D1.

S.non_reparse_chain: ExpectedNonReparseChain V1
B.non_reparse_chain: ExpectedNonReparseChain V1

Require:
  B.object == S.existing_parent_identity

  B.non_reparse_chain == S.non_reparse_chain

  S.non_reparse_chain.final_parent_path
    == S.existing_parent_identity.exact_path

  B.non_reparse_chain.final_parent_path
    == B.object.exact_path

  last(S.non_reparse_chain.ordered_objects)
    == S.existing_parent_identity

  last(B.non_reparse_chain.ordered_objects)
    == B.object
```

The chain equality compares the entire structured object: exact marker,
ordered object sequence and final-parent path. Comparing only the two
arrays, only their path strings, or only their final element is
insufficient. Array order remains significant; no sorting or
normalization may repair a mismatched chain.

Each chain remains nonempty, starts at the volume root, and ends at the
existing evidence parent. It retains the previously required
ordered-object, exact path/object/volume identity, no-repeat and
adjacent parent-child relationship checks. Every entry must satisfy the
unchanged `FsObjectIdentity V1` requirements, including NTFS and
`is_reparse_point=false`. The final object equality includes the full
identity/security object, not merely its path.

These are input validation and future observation requirements, not
claims that this transfer artifact proves a live filesystem chain.
Actual object, reparse, security and effective-access evidence remains
required under the existing execution gates.

#### Deterministic merge and use-site map

| Location | Required merged disposition |
|---|---|
| `LocalCreatePlan V1.1.security_contract` | KEEP `LocalCreateSecurityContract V1`. |
| `LocalCreateSecurityContract V1.non_reparse_chain` | REBIND from the V1.1 bare array description to `ExpectedNonReparseChain V1`. |
| `ExistingBoundObject V1.non_reparse_chain` | KEEP `ExpectedNonReparseChain V1`; its equality to the security-contract field now compares like types. |
| Ordered-chain iteration of the former security-contract array | Use `security_contract.non_reparse_chain.ordered_objects`; do not iterate the wrapper as an array. |
| Final-parent-path validation | Use the declared wrapper `final_parent_path` and compare it with the exact existing-parent path at both use sites. |
| Last-parent-object validation | Compare the last `ordered_objects` entry with the full corresponding existing-parent identity at both use sites. |
| Other effects, parent bindings, preconditions and imported types | KEEP; no other field retype, alias, permission, or runtime capability is introduced. |

`ExpectedNonReparseChain V1` is the existing V1.2 structured type, restated
here for the correction; its marker and three-key shape are not changed.
This section does not redefine any existing chain-evidence digest law.

The future `LocalCreatePlan` and authorization subject must be built
and hashed from the final reviewed structured representation; do not
reuse a digest derived from the superseded bare-array shape. No real
plan or authorization-subject digest is produced by this correction.

The adopted R1 policy identity, all F1-F4 bytes and identities, and the
D1-F4 path/order/parent mapping remain unchanged. All non-SER-01
definitions in this transfer remain unchanged.

Correction status: `SER01_CORRECTION_PREPARED_FOR_INDEPENDENT_REREVIEW`.
No documentation postimage, patch application, policy pin, execution
envelope, or Pack A write is authorized by this artifact.

### C. `LocalCreatePlan.preconditions` — một kiểu đóng duy nhất

Bản này chuyển các yêu cầu đã mô tả trong V1–V1.6 thành field cụ thể; **không coi boolean trong plan là kết quả đo quyền hoặc đọc filesystem**.

```text
LocalCreatePreconditions V1

schema =
  "VIONA_CODEX_LOCAL_CREATE_PRECONDITIONS_V1"

exact fields = {
  schema:
    literal("VIONA_CODEX_LOCAL_CREATE_PRECONDITIONS_V1"),

  create_relative_to_retained_parent:
    literal(true),

  path_fallback_allowed:
    literal(false),

  existing_and_created_chains_non_reparse:
    literal(true),

  same_effecting_token_before_each_effect:
    literal(true),

  parent_identity_security_before_each_effect:
    literal(true),

  positive_effective_authz_before_each_effect:
    literal(true),

  negative_preservation_before_each_effect:
    literal(true),

  target_absent_before_each_create:
    literal(true),

  source_length_sha256_before_create:
    literal(true),

  source_length_sha256_before_write:
    literal(true),

  exact_completed_prefix_readback:
    literal(true),

  final_release_before_enumeration:
    literal(true),

  post_close_preservation_required:
    literal(true),

  exact_final_hierarchy_readback:
    literal(true),

  synchronous_io_required:
    literal(true),

  delete_on_close_allowed:
    literal(false)
}
```

Ánh xạ sử dụng:

```text
LocalCreatePlan V1.1.preconditions:
  LocalCreatePreconditions V1

LocalCreatePlan V1.1.ordered_effects:
  exact eight-element array of
  DirectoryCreateEffect V1.1 | FileCreateEffect V1.1
```

Các điều kiện `source_length_sha256_*` áp dụng cho **file effect**; không yêu cầu content hash của directory. Các điều kiện parent/token áp dụng trước **mỗi effect**. Final release, preservation và hierarchy tiếp tục dùng sequence và evidence V1.6 — không tạo một sequence mới.

`target_absent_before_each_create` không thay thế `CREATE_NEW`: **precheck và atomic fail-if-present create đều bắt buộc**, theo contract hiện có.
<!-- END M07 -->

### M08 — transfer B: VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1.md

<!-- BEGIN M08; raw_utf8_length=10488; raw_sha256=4b2a1d778da68cb3942b9eb1a06c86a6ff93c6e8083bea0e8cfec50934edc07b -->
# VIONA local exact-create: expected-chain digest definition

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1
STATUS=TECHNICAL_PROPOSAL_PENDING_INDEPENDENT_REVIEW
SCOPE=EXPECTED_CHAIN_SHA256_DEFINITION_ONLY
WRITE_AUTHORITY=NONE

## 1. Provenance, scope and merge disposition

This is a NEW proposed definition for the reported unbound field
`ObservedNonReparseChain V1.expected_chain_sha256`. It is not evidence
that this rule existed in V1-V1.6 or was previously reviewed.

Apply this addendum after the already reviewed transfer:

- File: `VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md`
- Raw byte length: `14048`
- Raw SHA-256: `ddf201bfef00afadeaf5c53b7c44de26a035dd1ef70411326ed8c3c92d837d51`

Do not replace or edit that transfer, reapply SER-01, or reconstruct its
definitions from this addendum. Its statement that SER-01 does not redefine
a chain-evidence digest law does not supply the missing law. This addendum
supplies exactly that missing local-successor definition for review.

The rule is scoped to the proposed successor dispatch:
`ENVELOPE_CONTRACT.schema="VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"`
and `profile_id="VIONA_BME_PACK_A_SOURCE_CREATE_V1"`.
It grants no permission to process an enabled execution instance.
It does not reinterpret historical envelopes or unrelated digest fields.

## 2. Exact input: the complete expected wrapper

Let S be `LocalCreatePlan V1.1.security_contract`.
Let B be the `ExistingBoundObject V1` binding of D1.
Let E be S.non_reparse_chain, obtained from the exact plan being verified.

E is the existing structured type:

```text
ExpectedNonReparseChain V1
schema="VIONA_CODEX_EXPECTED_NON_REPARSE_CHAIN_V1"
exact keys={schema,ordered_objects,final_parent_path}

ordered_objects:
  the nonempty ordered array of full FsObjectIdentity V1 objects
  required by the reviewed chain contract

final_parent_path:
  PATH
```

Retain the complete existing validation of E, including:
the exact marker and keys; nonempty volume-root-to-existing-parent order;
no repeated object/path; adjacent parent-child and volume relationships;
full final-parent identity; NTFS; and non-reparse requirements.
SER-01's B.non_reparse_chain == S.non_reparse_chain equality remains a
whole-object equality. Do not compare unlike array/wrapper representations.

Each ordered object is included with ALL its existing fields:

```text
FsObjectIdentity V1
schema="VIONA_BME_FS_OBJECT_IDENTITY_V1"
exact keys={
  schema,exact_path,volume_guid_path,volume_serial_hex,file_id_hex,
  owner_sid,security_descriptor_sha256,dacl_sha256,
  filesystem_type,is_reparse_point
}
```

No field of an ordered object is omitted. In particular, existing SD and
DACL digest strings are included as strings inside their objects; they
are not decoded into binary digests or replaced by hashes of raw SD bytes.
The existing field types and validation semantics are unchanged.

The projection is the identity projection:

```text
EXPECTED_CHAIN_PROJECTION(E) = E
```

It is NOT `E.ordered_objects`, `E.final_parent_path`, a list of paths,
a concatenation of per-object hashes, or an ObservedNonReparseChain object.

## 3. Exact canonical bytes, domain and hash law

First validate E against its unchanged type and chain requirements.
Reject unknown, duplicate, missing or null fields before hashing.
Do not discard unknown keys or repair a malformed object to make it hashable.

The profile's existing NFC requirement is validation only: reject an input
that fails it rather than normalize strings or paths. Preserve array order.
Canonicalize object properties recursively under RFC 8785; encode the result
as UTF-8 with no BOM and no terminal newline. JSON escape spelling is
canonicalized by JCS, not copied from a Markdown rendering.

```text
DOMAIN_BYTES =
  ASCII("VIONA-CODEX-EXPECTED-NON-REPARSE-CHAIN-V1")

SEPARATOR_BYTES =
  the single byte 0x00

EXPECTED_CHAIN_CANONICAL_BYTES(E) =
  JCS_UTF8(EXPECTED_CHAIN_PROJECTION(E))

EXPECTED_CHAIN_DIGEST32(E) =
  SHA256_BYTES(
    DOMAIN_BYTES ||
    SEPARATOR_BYTES ||
    EXPECTED_CHAIN_CANONICAL_BYTES(E)
  )

EXPECTED_CHAIN_SHA256(E) =
  LOWERCASE_HEX(EXPECTED_CHAIN_DIGEST32(E))
```

`||` means byte concatenation. SHA256_BYTES returns exactly 32 raw bytes.
LOWERCASE_HEX returns exactly 64 lowercase hexadecimal characters (H64).

Do not hash a hexadecimal rendering of a prior digest, double-hash this
value, use UTF-16, include a code fence, hash pretty-printed JSON bytes,
or append LF/CRLF. The separator is not the characters backslash and zero.

No digest field is added to E. The digest stays outside its input.

RFC 8785 supplies only the canonicalization rules used here. The domain
literal, whole-wrapper projection and field binding are new VIONA
technical choices in this proposal, not requirements attributed to the RFC.

## 4. Consumer equality and available-before-use

For every `ObservedNonReparseChain V1` object O referring to this plan's
expected chain in the local profile, require:

```text
O.expected_chain_sha256 == EXPECTED_CHAIN_SHA256(E)

where:
  E = S.non_reparse_chain
  B.non_reparse_chain == E
```

Compute from the plan-bound EXPECTED wrapper, not from O.ordered_objects,
an independently caller-selected substitute, or any observation payload.

The digest input excludes the entire observed record, including:
`expected_chain_sha256`, `observed_at_utc`, `raw_proof`, and the observed
ordered objects. These fields are excluded because they are not members
of E, not because the verifier strips keys from E.

An expected-digest match does not prove a live chain is correct. All existing
observed-object equality, freshness, raw-proof, reparse, handle, security and
effective-Authz checks remain independently required. A hash match cannot
override an unavailable or mismatching observation.

The expected wrapper remains the plan-bound chain ending at the existing
evidence parent. Later directory parents are checked by the already reviewed
PriorEffectReadback/runtime-chain rules. Do not append future-created objects
to E, mutate the plan, or silently hash a different expected wrapper after
execution has begun. This addendum does not change those runtime-chain rules.

All consumers of the field within this profile use this one formula,
including a consumer reached through a hierarchy-readback field.
No call site may choose its own projection, domain or fallback algorithm.

## 5. Exact integration map

| Location | Disposition |
|---|---|
| ExpectedNonReparseChain V1 marker/key set | KEEP the existing three-key structured object. |
| LocalCreateSecurityContract V1.non_reparse_chain | KEEP the SER-01 rebind to ExpectedNonReparseChain V1. |
| ExistingBoundObject V1.non_reparse_chain | KEEP the same type and full equality with the security-contract field. |
| ObservedNonReparseChain V1.expected_chain_sha256 | DEFINE as H64 EXPECTED_CHAIN_SHA256(E), using sections 2-4. |
| Every consumer of ObservedNonReparseChain V1.expected_chain_sha256 in this profile | REBIND validation to the single rule above; no shape or marker change. |
| PriorEffectReadback and runtime chain extension | KEEP existing rules; no silent extension of the digest input E. |
| LocalCreatePlan/authorization-subject digest rules | KEEP; no new digest field or self-reference is introduced. |
| Adopted R1 policy, F1-F4 and two repository documents | NO byte mutation or new postimage is performed by this proposal. |

The data dependency is:

```text
exact expected FsObjectIdentity values and final-parent path
  -> validated ExpectedNonReparseChain E
  -> canonical E bytes
  -> expected-chain digest
  -> ObservedNonReparseChain.expected_chain_sha256 comparison
```

No backward dependency on the observed record is introduced.
No actual parent identity, plan, authorization subject or runtime observation
is created by this addendum. It reports no live expected-chain digest.

If an exact conflicting rule is subsequently found in an authoritative
source, surface the conflict for review; do not accept two formulas or
reinterpret an older digest as satisfying this proposal.

## 6. Bounded checks performed while preparing this transfer

Twenty-one in-memory checks passed with zero failed expectations.
They used synthetic object-shaped data only, not a real plan, live parent,
OS proof, authority instance or F1-F4 runtime fixture.

Coverage included:
- canonical output of a restricted serializer matched a second rendering
  for the actual fixture subset;
- object-property insertion order did not change canonical bytes;
- array order was preserved and a reversed fixture chain failed terminal
  parent equality;
- whole-wrapper hashing differed from array-only and plain canonical hashing;
- wrong domain, backslash-zero instead of NUL, terminal newline and UTF-16
  gave nonmatching hashes in the fixtures;
- nested file-ID/security-digest and final-parent-path changes were covered
  by the full projection;
- bare arrays, booleans, wrong/missing markers or keys, duplicate keys and
  insertion of a self-hash member were rejected by bounded checks;
- lowercase H64 output was distinguished from uppercase text.

These checks covered ASCII keys, NFC strings, booleans, dictionaries and
arrays. They are NOT full JCS conformance tests, full BME schema validation,
cryptographic security proof, independent review, or Windows/path/Authz proof.
The fixture computations are not published as live chain bindings.

## 7. Review disposition and no-authority boundary

CORRECTION_STATUS=PROPOSED_FOR_TARGETED_INDEPENDENT_REVIEW
SER01_TARGETED_REVIEW=GREEN_CARRIED_FORWARD
DOCS_ONLY_AMENDMENT_BYTES_READY_FOR_INDEPENDENT_REVIEW=NO
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
R1_ISSUANCE_GATE=BLOCKED

Review this rule's input, canonical bytes, domain, output representation and
all use sites. A GREEN verdict for this addendum permits resuming the
two-document IN-MEMORY preview only; it does not permit writing either file,
running F3, issuing authority, creating a candidate or changing policy.

This file is a review-transfer artifact created in the ChatGPT sandbox.
No Windows workspace, repository, policy pin or Pack A path is written.
Its file SHA-256 identifies this transfer text only; it is not an
expected-chain, policy, plan or authorization-subject digest.

Canonicalization reference: RFC 8785, sections 3.1, 3.2.3 and 3.2.4
(https://www.rfc-editor.org/rfc/rfc8785.html).
<!-- END M08 -->

### M09 — transfer C: VIONA_LOCAL_EXACT_CREATE_SERIALIZATION_BATCH_CLOSURE_V1.md

<!-- BEGIN M09; raw_utf8_length=29638; raw_sha256=ae7331e1d7387be48f6678612615d996372993a309c98e9c7d75f76b6ddc90c8 -->
# VIONA local exact-create: five-field serialization closure

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_SERIALIZATION_BATCH_CLOSURE_V1
STATUS=NEW_TECHNICAL_PROPOSAL_PENDING_INDEPENDENT_REVIEW
SCOPE=FIVE_REPORTED_SERIALIZATION_GAPS_ONLY
REPOSITORY_WRITE_AUTHORITY=NONE
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Provenance, limits of this proposal, and merge order

This is a NEW proposed resolution of the five gaps reported by the Builder.
It is not a recovered V1-V1.6 source, a statement that these definitions
previously existed, an independent review verdict, or an execution authority.

Apply only after the effective local-create V1-V1.6 contract and these two
unchanged reviewed transfer inputs:

1. VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md
   Raw length: 14048
   Raw SHA-256:
   ddf201bfef00afadeaf5c53b7c44de26a035dd1ef70411326ed8c3c92d837d51
2. VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1.md
   Raw length: 10488
   Raw SHA-256:
   4b2a1d778da68cb3942b9eb1a06c86a6ff93c6e8083bea0e8cfec50934edc07b

The V1_1 transfer replaces its V1 predecessor; do not apply both. This
addendum supplements the two inputs and does not replace or edit either.

The source-supported starting points are:
- the security-contract key set and SER-01 structured-chain rebind;
- the existing eight-key OperatorAuthorizationReference and trusted-message
  requirement from the supplied V1.1 conversation specification;
- the existing OsErrorEvidence shape and genuine-OS-evidence requirement;
- the V1.4 MISMATCH hierarchy/witness/preservation shapes and uncertainty
  precedence from the supplied conversation specification.

The NEW choices here are:
- H8 lexical representation;
- exact types/literals for the retained security-contract fields;
- a bounded opaque-locator lexical type;
- an explicit finite API error-evidence vocabulary;
- exact array types, order, cardinality and witness correspondence.

New finite limits are identified explicitly: opaque locator maximum 512
UTF-8 bytes; unexpected-child maximum 64 entries. They are proposed limits,
not values attributed to a previously reviewed source.

No real method ID, trusted-host principal, parent/token identity, runtime
observation, authority instance, or plan/subject digest is invented here.
The R1 policy adopted in the source conversation, all F1-F4 bytes/hashes,
D1-F4 paths/order/parents, the two repository-document scope, one-write
budget, no retry, release ownership, and outcome precedence are unchanged.

## 1. SER-B01: exact H8 grammar

H8 is a JSON STRING, not a JSON number, signed integer or binary byte array.

After strict JSON decoding, the string must consist of exactly eight ASCII
characters. Each character must be in 0-9 or a-f. Validation is a full-string
match, not a substring match and not a newline-tolerant end-anchor match:

```text
H8:
  JSON type: string
  decoded character length: exactly 8
  permitted characters: U+0030..U+0039, U+0061..U+0066
  equivalent full-match expression: [0-9a-f]{8}
```

No `0x` prefix, uppercase hex, sign, whitespace, separator or extra character
is accepted. Leading zeroes are REQUIRED to reach eight characters when
needed. `00000000` is lexically valid H8; a consuming field may reject a zero
value based on its own unchanged semantics.

For bitwise mask comparisons, parse the string as the unsigned 32-bit
hexadecimal value in the interval 0..4294967295. Hex digits are the ordinary
most-significant-digit-first textual representation, not the in-memory
little-endian byte layout of an OS structure. An observed 32-bit status/code
is represented by its exact 32-bit bit pattern, zero-padded to eight lowercase
digits; it is not sign-extended to H16 or serialized as a negative decimal.

A JSON escape spelling is decoded by the strict JSON parser and subsequently
rendered by the existing canonical JSON rule. Do not lowercase, trim, pad or
coerce an invalid DECODED field in order to accept it.

This closes H8 at all local-successor mask and OS-error-code use sites. It
does not change H16, H32, H64, their meanings, or any adopted R1 policy field.

## 2. SER-B02: complete LocalCreateSecurityContract field typing

TEXT(128) below imports the baseline definition exactly: an NFC Unicode
string of 1..128 Unicode scalar values. A scalar excludes isolated UTF-16
surrogates. The NFC rule is validation, not permission to normalize supplied
input. Actual reviewed method-ID VALUES remain future independently reviewed
bindings. This proposal does not assign a method implementation by guessing
a plausible name.

```text
LocalCreateSecurityContract V1

schema = "VIONA_CODEX_LOCAL_CREATE_SECURITY_CONTRACT_V1"

exact fields = {
  schema:
    literal("VIONA_CODEX_LOCAL_CREATE_SECURITY_CONTRACT_V1"),

  existing_parent_identity:
    FsObjectIdentity V1,

  non_reparse_chain:
    ExpectedNonReparseChain V1,

  effecting_token:
    TokenIdentity V1,

  excluded_principal_sids:
    array of SID, length 1..64, unique,
    in ascending lexicographic order of each decoded SID string's UTF-8 bytes,

  reviewed_positive_authz_method_id:
    TEXT(128),

  reviewed_negative_authz_method_id:
    TEXT(128),

  directory_forbidden_mask_hex:
    literal("000d0156") of type H8,

  file_forbidden_mask_hex:
    literal("000d0116") of type H8,

  security_at_initial_create:
    literal(true),

  post_create_acl_repair:
    literal(false),

  post_close_preservation_required:
    literal(true)
}
```

There are exactly 12 required fields. The last three values are JSON
booleans, not strings or numeric 0/1. Both masks carry forward the supplied
V1.1 proposal literals; this text does not claim their Windows/SDK or
effective-access methodology has independently passed runtime review.

Retain the SER-01 relationships in full:
- S is LocalCreatePlan.security_contract.
- B is the ExistingBoundObject for D1.
- B.object == S.existing_parent_identity.
- B.non_reparse_chain == S.non_reparse_chain as full structured objects.
- Both final_parent_path values equal the corresponding parent's exact_path.
- The final ordered object equals the full parent identity at both use sites.
- Bare arrays or booleans at either non_reparse_chain field are rejected.
- Existing chain iteration uses .ordered_objects, never the wrapper as array.

Method and flag use-site bindings:
- Every positive parent/object proof for this plan uses
  S.reviewed_positive_authz_method_id as its reviewed_method_id.
- Negative object/preservation evidence uses
  S.reviewed_negative_authz_method_id. A nested witness without its own
  method-ID field must be verified by that selected method; do not add an
  undeclared method field to its existing shape.
- Every evidence type's actual object, token, masks, raw proof, timing and
  other existing constraints remain mandatory.
- A syntactically valid method-ID string is not a reviewed method. Before
  execution, each ID must resolve under the existing independent method
  review/trust mechanism to the exact approved measurement semantics.
  Caller-supplied names, a true boolean or matching descriptor hashes alone
  do not satisfy this gate.
- Every effect.creation_security.apply_at_initial_create equals
  S.security_at_initial_create.
- Every effect.creation_security.post_create_repair_allowed equals
  S.post_create_acl_repair.
- The existing final preservation gate remains required by
  S.post_close_preservation_required.

No extra registry, trust-store file or method-selection authority is created
by these field definitions. Unknown or unresolved actual methods block use,
not definition of the schema itself.

## 3. SER-B03: opaque locator scalars and trusted-host validation

Introduce the following LOCAL scalar alias; it changes no object key set:

```text
OpaqueHostLocator V1:
  JSON type: string
  NFC Unicode scalar string
  UTF-8 byte length of decoded value: 1..512 inclusive
  forbidden code points: U+0000..U+001F and U+007F
  no leading or trailing U+0020 SPACE
  no isolated surrogates
```

No UUID, GitHub node-ID, numeric-ID or URL grammar is imposed. These are opaque
locators in the reviewed trusted host's namespace. Internal punctuation and
Unicode scalar values satisfying the rule are preserved exactly. No trim,
case folding, URL decoding, Unicode normalization, namespace guessing or
numeric/string coercion is allowed. The proposed 512-byte limit is NEW.

```text
OperatorAuthorizationReference V1

schema = "VIONA_CODEX_OPERATOR_AUTHORIZATION_REFERENCE_V1"

exact fields = {
  schema:
    literal("VIONA_CODEX_OPERATOR_AUTHORIZATION_REFERENCE_V1"),
  source_kind:
    literal("TRUSTED_OPERATOR_MESSAGE"),
  conversation_id:
    OpaqueHostLocator V1,
  message_id:
    OpaqueHostLocator V1,
  operator_principal_id:
    OpaqueHostLocator V1,
  raw_message_sha256:
    H64,
  approved_subject_sha256:
    H64,
  approved_plan_sha256:
    H64
}
```

Trusted-host contract retained and made explicit:
1. Select the already independently trusted host/verifier configuration for
   this lane independently of the submitted reference. The reference cannot
   supply a credential, substitute a host, or appoint its own trusted actor.
2. Retrieve the actual message at the exact conversation/message locators.
   Verify its returned locators and conversation membership byte-exactly
   against the decoded reference strings.
3. Authenticate its author principal/Operator role using trusted host
   metadata and the existing independently selected lane principal. Require
   equality with operator_principal_id. A display name, claimed role in the
   body, assistant/tool relay, or caller-provided JSON is not this proof.
4. Hash the retrieved message body's unnormalized UTF-8 bytes using the
   existing raw-message hash rule. Do not hash a rendered quote or summary.
5. Require the existing exact approval grammar and compare both approval
   digests with the independently recomputed plan/subject values and the
   reference fields.
6. Missing retrieval, ambiguous namespace, inaccessible metadata, stale or
   unverifiable author/role binding, or any mismatch blocks execution.
   Lexical acceptance of a locator never implies trusted retrieval.

The existing grammar and plan/subject digest projections are unchanged.
This closes scalar serialization without claiming that the trusted host
verification adapter is implemented, installed or proven. Actual locators,
role binding and the trusted-host mechanism remain future gates. No real
approval message, adoption record, or reference instance is emitted here.

## 4. SER-B04: finite OsErrorEvidence API vocabulary

Select a finite inline NORMATIVE VOCABULARY, not an unbound future registry:

```text
REGISTRY_ID = "VIONA_CODEX_LOCAL_CREATE_OS_ERROR_API_NAMES_V1"

OsErrorApiNameV1 = exactly one of:
  "AuthzAccessCheck"
  "AuthzInitializeContextFromToken"
  "AuthzInitializeResourceManager"
  "CloseHandle"
  "DeviceIoControl"
  "FlushFileBuffers"
  "GetFileInformationByHandleEx"
  "GetFinalPathNameByHandleW"
  "GetSecurityInfo"
  "GetTokenInformation"
  "GetVolumeInformationByHandleW"
  "NtCreateFile"
  "NtQueryDirectoryFile"
  "OpenProcessToken"
  "OpenThreadToken"
  "ReadFile"
  "WriteFile"
```

The list has exactly 17 unique literals, in ascending ASCII order. The registry
ID is a specification constant, not a new field of OsErrorEvidence, a file
path, an authority field or an additional runtime record.

```text
OsErrorEvidence V1

schema = "VIONA_CODEX_OS_ERROR_EVIDENCE_V1"

exact fields = {
  schema:
    literal("VIONA_CODEX_OS_ERROR_EVIDENCE_V1"),
  api:
    OsErrorApiNameV1,
  code_kind:
    enum("WIN32", "NTSTATUS"),
  code_hex:
    H8,
  observed_at_utc:
    UTC,
  raw:
    RawOsEvidence V1
}
```

Normative API/code-kind/error-source table:

| API literal(s) | code_kind | Source of the actual error code |
|---|---|---|
| NtCreateFile; NtQueryDirectoryFile | NTSTATUS | Actual native completion/status evidence for that call under its separately reviewed synchronous invocation method. |
| GetSecurityInfo | WIN32 | Its direct nonzero DWORD error return; not a stale GetLastError value. |
| AuthzAccessCheck; AuthzInitializeContextFromToken; AuthzInitializeResourceManager; CloseHandle; DeviceIoControl; FlushFileBuffers; GetFileInformationByHandleEx; GetTokenInformation; GetVolumeInformationByHandleW; OpenProcessToken; OpenThreadToken; ReadFile; WriteFile | WIN32 | The error captured from GetLastError when that specific API reports failure under its documented return contract. |
| GetFinalPathNameByHandleW | WIN32 | GetLastError on a zero/failure return; a required buffer-length return alone is not fabricated as an OS error. |

All other API/code-kind pairings are rejected. A helper may not translate an
NTSTATUS to a WIN32 value or change the API name merely to fit this table.
Raw evidence must identify the actual call/result/code source. GetLastError
is the code-reading mechanism in specified cases, not the failed API name.

API-name membership is ONLY a representable error-evidence vocabulary:
- It grants NO right to call any function, choose its parameters, open
  credentials/tokens, write files, issue DeviceIoControl requests, or alter
  the approved executor implementation.
- It does not choose the actual executor call graph or API/ABI binding.
- The reviewed executor/measurement method must independently permit the
  actual call, parameters, token/object scope and error handling.
- An API error unsupported by this finite vocabulary must not be renamed to
  a supported name or "UNKNOWN". It cannot produce a conforming
  OsErrorEvidence under this proposal. Preserve the existing fail-closed/raw
  diagnostic or reconciliation behavior without fabricating a typed record.
  Supporting that API requires a reviewed successor vocabulary.
- An unavailable proof caused by an internal validation failure is not a
  made-up OS error. The unchanged outcome/raw-diagnostic rules apply.
- AuthzAccessCheck successfully evaluating a denied/insufficient access
  decision is distinct from failure of the API call itself. Do not relabel a
  measured access decision as a failed API/GetLastError record.
- Normal end-of-enumeration, an insufficient result buffer, pending I/O, and
  other nonterminal statuses must not be promoted into error evidence merely
  because a numeric code is nonzero. Their documented meaning and the
  reviewed method govern classification. The existing synchronous-I/O rule
  and one-attempt/no-retry mutation budget remain unchanged.

This exact vocabulary is a NEW proposal. Microsoft documentation supports
the API spelling and error-return conventions in the non-normative reference
appendix; Microsoft does not prescribe this VIONA vocabulary or authorize
these effects.

## 5. SER-B05: mismatch array definitions and correspondence

This section specializes only HierarchyMismatchReadback V1:
schema="VIONA_CODEX_HIERARCHY_MISMATCH_READBACK_V1"
status="MISMATCH"

Its existing top-level key set is unchanged. The two fields are:

```text
unexpected_children:
  JSON array of PATH strings
  length 0..64 inclusive
  strictly ascending by decoded path UTF-8 bytes
  unique by exact decoded PATH value

preservation_checks:
  JSON array of PreservationCheck V1
  length 0..9 inclusive, with exact data-dependent membership below
  only PASS or MISMATCH elements permitted in this containing variant
```

The maximum 64 unexpected paths is a NEW proposed finite evidence limit.
It neither permits 64 additional objects nor expands enumeration scope.
A nonempty unexpected list still prevents success. No array is reordered,
deduplicated or truncated by a verifier to rescue invalid serialized input.
Existing PATH validation and filesystem identity checks are retained.

### 5.1 Unexpected-child paths and witnesses

`unexpected_child_count` is the existing U0 JSON string and must equal the
numeric length of unexpected_children.

An unexpected path must be supported by actual enumeration within the
already authorized final-hierarchy observation scope. It must not be a
planned D1-F4 target, an invented descendant, or a path outside that scope.
This proposal authorizes no traversal of unexpected directories or reparse
targets and adds no read/mutation capability.

There must be EXACTLY ONE HierarchyMismatchWitness with
reason="UNEXPECTED_CHILD" for each unexpected_children entry. Conversely,
every witness of that reason must correspond to exactly one array entry.
Its UnexpectedChildEvidence.exact_path must equal that entry; its object
kind, volume/file identity and RawOsEvidence retain the existing rules.
There are no duplicate path witnesses.

Formally, the multiset of decoded paths obtained from the UNEXPECTED_CHILD
witnesses equals the unexpected_children array as a unique set, and both
lengths are equal. The existing global mismatch-witness ordering still
applies; it does not alter the required order of unexpected_children.

The path array is not changed to an array of evidence objects. Underlying
evidence stays in the existing witnesses, so no new spill file, writer or
postimage path is introduced.

### 5.2 Exact preservation subject inventory and ordering

Define the local NOT-SERIALIZED ordering labels:

```text
R = [EVIDENCE_PARENT, D1, D2, D3, D4, F1, F2, F3, F4]
```

EVIDENCE_PARENT is the plan's existing evidence-parent exact path, not all
ancestors and not an unexpected child. D1-F4 are the existing exact plan
paths. This is an ordered inventory of nine nominal subjects, not a new
field or authority object.

Use the actual evidence-backed entries of the hierarchy being classified:
- resolve EVIDENCE_PARENT from the observed parent-chain entry at that exact
  path; require one unambiguous entry;
- resolve D1-F4 from the exact eight observed_plan_targets, in plan order.

For every nominal subject:
- PRESENT_NORMAL => exactly one required PreservationCheck, on the same
  full observed FsObjectIdentity, in the order induced by R.
- ABSENT or REPARSE => no fabricated normal-object PreservationCheck.
  The matching TARGET_ABSENT or REPARSE_DETECTED witness is required instead,
  using a real observation at that path. These are measured failed closure
  predicates, never proof that preservation passed.
- missing, unavailable, partially verified or ambiguous required observation
  => this is not a valid MISMATCH hierarchy. Apply the unchanged UNVERIFIED
  precedence, or existing raw-diagnostic behavior if no truthful typed
  unavailable record can be constructed. Do not invent an OS error.

Therefore:

```text
required_check_subjects =
  R filtered by evidence-backed observation.kind == PRESENT_NORMAL

length(preservation_checks) =
  length(required_check_subjects)

for every index i:
  preservation_checks[i].object ==
    full observed FsObjectIdentity(required_check_subjects[i])
```

All PRESENT_NORMAL subjects require checks, including those with a measured
object-ID, owner, SD or content mismatch. A caller cannot omit a subject by
claiming it is unmeasurable. The observer must actually establish the
absence/reparse alternative or fail the required-observation gate.

The list can contain fewer than nine entries ONLY because the corresponding
nominal subjects were actually observed ABSENT or REPARSE. An empty list is
valid only if every nominal subject has such an evidence-backed observation;
it never means "preservation was skipped". A successful hierarchy retains
the existing nine-object preservation requirement.

If a reparse/absent ancestor prevents reliable observation of required
targets, do not follow it or manufacture their observations in order to
produce MISMATCH. The required-observation failure takes UNVERIFIED
precedence. This rule preserves the prior no-path-fallback boundary.

### 5.3 PASS, MISMATCH and exact witness correspondence

Use the existing PreservationCheck V1 exact variants and key sets; no new
variant or field is introduced here.

For PASS:
- check.object equals evidence.object as a full FsObjectIdentity;
- the NegativeObjectAuthzEvidence must cover the exact plan-bound excluded
  principal set, with the required object/mask/method/raw-proof checks;
- no PRESERVATION_FORBIDDEN_RIGHT_GRANTED witness may cite that PASS.

For MISMATCH:
- check.object equals witness.object as a full FsObjectIdentity;
- ForbiddenRightWitness must use an actually tested token for the reviewed
  excluded principal, the kind-specific plan-bound forbidden mask, its real
  observed granted mask and nonzero exact intersection, and raw proof;
- there must be EXACTLY ONE HierarchyMismatchWitness with
  reason="PRESERVATION_FORBIDDEN_RIGHT_GRANTED" containing this exact full
  PreservationCheck object;
- conversely every hierarchy witness of that reason must reference exactly
  one MISMATCH element of preservation_checks, with no copies at another
  subject or mismatched object identity.

A MISMATCH witness proves at least its stated false predicate. It does not
claim that other principals had no rights. The containing hierarchy still
needs every required observation under the unchanged V1.4 precedence.

An UNVERIFIED PreservationCheck is forbidden inside MISMATCH. An actual
required check of that status must lead to the prior hierarchy UNVERIFIED
path; do not drop it from the list to keep a MISMATCH verdict.

The list is ordered by R, not lexicographic JSON order, status, SID, or
filesystem enumeration order. Two different nominal paths are not collapsed
merely because their observed file IDs collide; existing identity/mismatch
validation must still inspect both target bindings.

### 5.4 Limits and honest overflow

Validate count, entry type, ordering, subject membership, witness
correspondence, raw proof and any applicable inherited containing-record
byte limits independently.

If more than 64 unexpected paths are required, or retaining all required
evidence exceeds an applicable limit, a complete MISMATCH record under this
proposal cannot be emitted. Do not truncate, report a false smaller count,
emit success, invent an OS error, or open an evidence spill file.
Keep the existing stop/no-retry/partial-preservation behavior and report the
serialization/evidence-limit blocker through an already permitted diagnostic
channel. No persistent diagnostic output is authorized here.

## 6. Exact merge and use-site disposition

| Location | Disposition |
|---|---|
| Local-successor H8 references | DEFINE section 1; preserve H16/H32/H64. |
| LocalCreateSecurityContract V1 | KEEP marker and 12-key shape; close field types/literals per section 2. |
| security_contract.non_reparse_chain | KEEP ExpectedNonReparseChain V1 and SER-01 whole-object equality. |
| Positive and negative method-ID comparisons | Use section 2 role-correct equality; actual method implementations remain independently reviewed future values. |
| OperatorAuthorizationReference V1 | KEEP marker/eight-key shape; type its three opaque locators per section 3; preserve trusted-host approval checks. |
| OsErrorEvidence V1.api | Replace vague "reviewed finite API name" with the exact 17-name inline vocabulary and code-kind table. |
| All OsErrorEvidence consumers, including release/error/unverified paths | Apply the same exact vocabulary; never rename an unsupported call or invent an OS code. |
| HierarchyMismatchReadback.unexpected_children | PATH array with explicit order, 0..64 limit, count and witness correspondence. |
| HierarchyMismatchReadback.preservation_checks | Existing PASS/MISMATCH array, exact evidence-derived 0..9 membership and R order. |
| Existing hierarchy precedence and success requirements | KEEP VERIFIED/MISMATCH/UNVERIFIED/NOT_PERFORMED semantics, F4 closure, and nine-subject success proof. |
| Expected-chain projection/domain | KEEP unchanged reviewed digest addendum. |
| LocalCreatePlan/authorization-subject construction | Use the final reviewed merged definitions. Do not reuse input-dependent hashes by assertion. |
| R1 policy; F1-F4 source files; docs target files | No bytes are changed or materialized by this proposal. |

None of the proposed constants or schema definitions is proof that a live
control exists. Reading the attached specification requires no registry
installation, provider call, Windows API call, key, filesystem mutation, or
actual Operator message.

## 7. Bounded checking actually performed by the proposer

Only Python-standard-library in-memory metadata and synthetic predicate
models were checked. No attached program was executed. No Windows API,
Authz method, trusted-host connector, repository, F3, native release or
filesystem-effect sequence was executed.

| Group | Cases | Unexpected results |
|---|---:|---:|
| H8 lexical cases, including every hex digit at each of eight positions | 148 | 0 |
| Opaque locator scalar cases and 512-byte boundaries | 17 | 0 |
| Security flags/method string scalar projection | 16 | 0 |
| Security exact-key membership | 13 | 0 |
| API vocabulary/code-kind metadata | 41 | 0 |
| Unexpected paths/count/order/witness projection | 11 | 0 |
| Preservation subject/order/status/object/witness projection | 13 | 0 |
| TOTAL | 259 | 0 |

Limits of the tests:
- Imported FsObjectIdentity, TokenIdentity, SID, actual proofs and PATH
  parsing were NOT fully validated; the array tests use symbolic objects.
- No full JCS conformance or merged successor-schema validator was run.
- API checks validate this proposed metadata table, not DLL availability,
  ABI, call correctness, error capture, grants, or physical I/O.
- Locator checks are lexical only; there was no real trusted-host retrieval.
- The source collector did not reconstruct F1-F4 or either docs postimage.
- These checks are not independent review and do not mark any finding GREEN.

## 8. Required independent review and no-effects boundary

Review this addendum together with its two unchanged source deltas and the
supplied V1-V1.6 definitions. In particular, assess NEW limits and the finite
API vocabulary as new technical choices, not as facts inherited from a
source. Verify all use-site mappings and any concrete regressions.

Return one of:
- GREEN_FOR_DOCS_BYTE_CONSTRUCTION, limited to these five definitions;
- REQUEST_CHANGES with exact fields and required bounded corrections;
- BLOCKED naming a specific unavailable source.

Do not silently revise this addendum while reviewing it. Do not adopt a
registry, select a live method, create a pin or authority, or construct
repository postimages in that review.

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
R1_ISSUANCE_GATE=BLOCKED
TWO_DOC_POSTIMAGES_CONSTRUCTED=NO

The only delivery artifact prepared by the proposer is this Markdown file in
the ChatGPT conversation sandbox. No Windows workspace, repository, remote,
Pack A, key, pin, state root, validator or candidate mutation is implied.

## Appendix A. External documentation used for the API metadata proposal

This appendix is external technical reference material, distinct from the
user-supplied VIONA contract. It supports function spellings and return/error
conventions only. It does not independently approve the chosen VIONA finite
vocabulary, runtime rights or invocation methods.

The local-create source defines requirements, not an implemented call graph.
Driver documentation is not by itself proof of a user-mode binding; such
binding remains subject to the existing separate method/API/ABI review.

Official Microsoft documentation consulted:

```text
AuthzAccessCheck:
https://learn.microsoft.com/en-us/windows/win32/api/authz/nf-authz-authzaccesscheck

AuthzInitializeContextFromToken:
https://learn.microsoft.com/en-us/windows/win32/api/authz/nf-authz-authzinitializecontextfromtoken

AuthzInitializeResourceManager:
https://learn.microsoft.com/en-us/windows/win32/api/authz/nf-authz-authzinitializeresourcemanager

CloseHandle:
https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle

DeviceIoControl:
https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-deviceiocontrol

FlushFileBuffers:
https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers

GetFileInformationByHandleEx:
https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-getfileinformationbyhandleex

GetFinalPathNameByHandleW:
https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlew

GetSecurityInfo:
https://learn.microsoft.com/en-us/windows/win32/api/aclapi/nf-aclapi-getsecurityinfo

GetTokenInformation:
https://learn.microsoft.com/en-us/windows/win32/api/securitybaseapi/nf-securitybaseapi-gettokeninformation

GetVolumeInformationByHandleW:
https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getvolumeinformationbyhandlew

NtCreateFile:
https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile

NtQueryDirectoryFile:
https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/nf-ntifs-ntquerydirectoryfile

OpenProcessToken:
https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocesstoken

OpenThreadToken:
https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-openthreadtoken

ReadFile:
https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-readfile

WriteFile:
https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile
```

The proposed 512-byte locator limit, 64 unexpected-path limit, schema
specializations and subject-array rules are VIONA design proposals here.
They are not claims attributed to Microsoft or to a canonicalization RFC.
<!-- END M09 -->

### M10 — transfer D: VIONA_LOCAL_EXACT_CREATE_SER_B05_COHERENCE_AND_LIMIT_DELTA_V1.md

<!-- BEGIN M10; raw_utf8_length=26700; raw_sha256=66bf8a9474343822d106b4506d61b9fa44d4d73a2354ff8fa01126e9124bb558 -->
# VIONA local exact-create: SER-B05 coherence and evidence-limit correction

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_SER_B05_COHERENCE_AND_LIMIT_DELTA_V1
STATUS=NEW_TECHNICAL_CORRECTION_PENDING_INDEPENDENT_REREVIEW
SCOPE=SER_B05_01_AND_SER_B05_02_ONLY
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Provenance and merge boundary

Apply this addendum after:
VIONA_LOCAL_EXACT_CREATE_SERIALIZATION_BATCH_CLOSURE_V1.md
raw bytes: 29638
raw SHA-256:
ae7331e1d7387be48f6678612615d996372993a309c98e9c7d75f76b6ddc90c8

That batch follows these unchanged inputs:
- VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md
  bytes: 14048
  SHA-256: ddf201bfef00afadeaf5c53b7c44de26a035dd1ef70411326ed8c3c92d837d51
- VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1.md
  bytes: 10488
  SHA-256: 4b2a1d778da68cb3942b9eb1a06c86a6ff93c6e8083bea0e8cfec50934edc07b

The supplied targeted review found no concrete defect in SER-B01--B04.
Keep their exact text, values, vocabulary and constraints. This addendum
does not rewrite those four sections or claim a new review of them.

The present correction supplies NEW normative choices for two findings:
SER-B05-01: repeated paths in parent/target observations must be coherent
before the observations can support hierarchy or preservation validation.
SER-B05-02: evidence-limit exhaustion after effects needs a truthful typed
terminal disposition, not a fabricated OS error or a shortened MISMATCH.

This is not a recovered V1--V1.6 rule, an independent GREEN verdict,
an adopted successor contract, an execution envelope, or write permission.
The raw batch and two prior transfer files remain unchanged.

## 1. SER-B05-01: exact cross-list coherence before subject selection

### 1.1 Inputs and per-list checks

Let P be HierarchyMismatchReadback.observed_parent_chain.
Let T be HierarchyMismatchReadback.observed_plan_targets.
The rule also applies to the observation inventory used to reach VERIFIED:
success cannot bypass coherence by choosing a different result serializer.

Use the unchanged HierarchyObservedObject V1 variants, imported readback
types, PATH rules, plan target order, expected-chain rule and live-proof
requirements. Every observation must first satisfy its own schema, tag,
path/type rules and required proof constraints.

Within each list, a decoded exact_path may occur only once. T must still
have exactly D1,D2,D3,D4,F1,F2,F3,F4 in that order, with their exact plan paths.
Repeated paths across P and T are allowed only under the rule below.
Do not merge two distinct nominal paths because their file IDs coincide.

The parent-chain label ANCESTOR and a target label D1--F4 may legitimately
differ at the outer effect_id field. Validate each label in its own
containing list. Do not require an ANCESTOR label to equal D1--F4.

### 1.2 One exact coherence projection

For any otherwise valid HierarchyObservedObject V1 X, define the local,
non-serialized comparison projection:

COHERENCE(X) = {
  schema:     X.schema,
  kind:       X.kind,
  exact_path: X.exact_path,
  readback:   X.readback
}

The projection excludes ONLY the outer effect_id. It includes the full
nested readback without exclusions. This is a structural equality rule,
not a new hash or a new serialized object type.

For each p in P and t in T with p.exact_path == t.exact_path, require:
  COHERENCE(p) == COHERENCE(t).

Equality is decoded JSON value equality with exact key sets:
object member presentation order is irrelevant; array order and all scalar
values remain significant. There is no path normalization, case folding,
timestamp removal, object-ID-only comparison, or partial field merge.

In particular:
- kind/discriminant must agree;
- PRESENT_NORMAL must use the same directory/file readback variant;
- every FsObjectIdentity field must agree, including volume/file identity,
  exact path, owner, SD, DACL, filesystem and reparse flag;
- file byte_length and sha256 must agree when a file readback is present;
- read_at_utc and other nested observation/proof fields must also agree;
- ABSENT cannot coexist with PRESENT_NORMAL or REPARSE for the same path.

A producer may perform the required observation once and reuse that exact
observation object at both list locations. It must not discard a real,
conflicting second observation, select the newer one, align timestamps,
or splice fields to manufacture coherence. Two separate observations with
different timestamps are not interchangeable copies under this rule.

No claim of an atomic filesystem snapshot is made. The rule rejects a
composite report that does not have one consistent observation for a path.

### 1.3 Subject derivation and preservation

Perform the complete per-list and cross-list validation BEFORE deriving
the nine-subject inventory R or accepting any preservation PASS/MISMATCH
as proof for the containing hierarchy.

Keep:
  R = [EVIDENCE_PARENT,D1,D2,D3,D4,F1,F2,F3,F4].

After coherence succeeds:
- resolve EVIDENCE_PARENT from its unique P entry;
- resolve D1--F4 from T; any repeated parent occurrence has already been
  proven to contain that exact same observation;
- retain the batch's PRESENT_NORMAL-only membership, R ordering,
  0..9 cardinality, full-object equality and witness bijections;
- retain the actual ABSENT/REPARSE alternatives and their witnesses.

A PASS on one of two conflicting identities cannot satisfy preservation
for that path in the composite hierarchy. It may remain an observation
about that one object, but it does not validate the containing report.
Preservation selection must not run as a way to hide the other identity.

A submitted contradictory MISMATCH or VERIFIED record is rejected.
For a trusted executing observer that actually encounters a conflict
during final closure, use the non-authorizing terminal rule in section 3.
Do not classify a successfully observed conflict as an invented OS error.
No retry, recapture-to-repair, filesystem change, or reconciliation call
is authorized by this correction.

## 2. SER-B05-02: keep the cap, report exhaustion explicitly

Keep the batch's complete-record rule:
HierarchyMismatchReadback.unexpected_children is a sorted unique PATH
array of length 0..64. In a complete MISMATCH, its length equals the U0
unexpected_child_count and its paths have the exact witness bijection.

A 65-element list cannot be accepted by that schema. Do not truncate it
to 64, change the count, silently raise the cap, or emit a fake OS error.
Instead, use the explicit assessment-aborted terminal representation below.

### 2.1 What an exhaustion record means

The new terminal is deliberately NOT a complete hierarchy readback.
It reports that the observer could not form the required evidence object
within its declared limit. It does not carry a shortened unexpected_children
array, a partial list labeled complete, a success-only preservation proof,
or a hash pretending to replace the omitted underlying evidence.

Preserve the exact count of all distinct unexpected paths actually
established by the permitted enumeration up to the stop:
- if that enumeration actually completed, the count is exact for that
  enumerated scope;
- if it stopped early, the count is exact for the observed prefix only,
  and it makes no claim about the unobserved remainder;
- a number not established by the observer must not be invented.

Once exhaustion is recognized, no new enumeration call is authorized just
to obtain a total. Information already returned by the permitted operation
may be accounted for without issuing another operation. This does not
grant traversal of unexpected directories/reparse targets.

Already available observations must not be edited into a smaller complete
record or destroyed as part of rollback. This proposal adds no durable
retention, spill file, extra output, or new storage guarantee. Later access
or reconciliation remains separately governed.

The count in the terminal is explicitly executor-reported diagnostic
information, not an independently verified enumeration transcript. An
independent reviewer must not infer full raw-evidence availability from it.

## 3. Exact proposed terminal types

These are NEW local-successor types for review. H64, U0, U1, UTC and
TEXT(128) retain their existing exact definitions. All listed keys are
required; all other, duplicate or null keys are rejected. No new digest
law is introduced: these objects are contained in outcome evidence and
have no self-hash or execution capability.

### 3.1 UnexpectedChildCountObservation V1

Common schema literal:
  "VIONA_CODEX_UNEXPECTED_CHILD_COUNT_OBSERVATION_V1"

COMPLETE:
  exact keys = {schema,state,count}
  state = "COMPLETE"
  count: U0
  meaning: exact distinct unexpected-path count for the permitted
           enumeration that actually completed.

PREFIX_ONLY:
  exact keys = {schema,state,count}
  state = "PREFIX_ONLY"
  count: U0
  meaning: exact distinct unexpected-path count actually established
           before the enumeration stopped; not a full-scope total.

NOT_ESTABLISHED:
  exact keys = {schema,state}
  state = "NOT_ESTABLISHED"
  count is forbidden.

A PREFIX_ONLY count is not extrapolated. Zero in that variant does not
prove that the target hierarchy had no unexpected child.

### 3.2 CrossListObservationConflict V1

schema = "VIONA_CODEX_CROSS_LIST_OBSERVATION_CONFLICT_V1"

exact keys = {
  schema, exact_path,
  parent_chain_entry, plan_target_entry
}

exact_path: PATH
parent_chain_entry: HierarchyObservedObject V1 from P
plan_target_entry: HierarchyObservedObject V1 from T

Both entries must be individually well formed, actually observed, and
members of those respective inventories. Their exact_path values equal
this exact_path; COHERENCE(parent_chain_entry) differs from
COHERENCE(plan_target_entry). Their labels remain context-validated.

One such witness suffices to establish that the composite observation is
incoherent; it does not claim there are no other conflicts. Do not repair
either entry. The existing chain/target validation remains required where
applicable; a caller cannot manufacture a new authorization from a conflict.

### 3.3 EvidenceLimitExceeded V1

schema = "VIONA_CODEX_LOCAL_CREATE_EVIDENCE_LIMIT_EXCEEDED_V1"

UNEXPECTED_CHILD_PATH_COUNT:
  exact keys = {schema,metric,limit,observed_value,measurement_extent}
  metric = "UNEXPECTED_CHILD_PATH_COUNT"
  limit = "64"
  observed_value: U0, numeric value > 64
  measurement_extent = "COMPLETE_ENUMERATION" | "OBSERVED_PREFIX"

For COMPLETE_ENUMERATION, the containing unexpected_count_observation is
COMPLETE and its count equals observed_value.
For OBSERVED_PREFIX it is PREFIX_ONLY and its count equals observed_value.
No count may be clipped to the cap. No path/evidence list is included
under this discriminator.

INHERITED_BYTE_LIMIT:
  exact keys = {
    schema,metric,bounded_schema,limit,observed_value,measurement_extent
  }
  metric = "RETAINED_RAW_BYTES" | "CANONICAL_RECORD_BYTES"
  bounded_schema: TEXT(128)
  limit: U1
  observed_value: U0, numeric value > limit
  measurement_extent = "COMPLETE_VALUE" | "MEASURED_PREFIX"

This second exact shape only describes an ACTUAL limit already applicable
to that specific evidence or containing-record schema in the reviewed
effective contract. The (bounded_schema,metric,limit) tuple must resolve
to that pre-existing rule, independently of the submitted record.
No arbitrary limit value or unrelated R1 limit is imported by analogy.
If the effective contract defines no such applicable bound, this variant
cannot invent one or be used to justify stopping on an arbitrary budget.

observed_value is the actual measured byte count, or an actual measured
prefix already above the bound. Never use a guessed completed size.
The containing unexpected-count observation separately reports what was
actually known about unexpected children; byte count is not child count.

The type defines no new byte ceiling or evidence registry. It supplies
the terminal disposition for the other inherited limits already mentioned
by the batch's section 5.4. Unknown rule, wrong units, limit mismatch or
unmeasured overflow makes this typed evidence invalid.

### 3.4 HierarchyAssessmentAborted V1

schema = "VIONA_CODEX_HIERARCHY_ASSESSMENT_ABORTED_V1"

exact keys = {
  schema,status,plan_sha256,completed_effect_ids,
  reason,evidence,unexpected_count_observation,
  observation_basis,recorded_at_utc
}

status = "ASSESSMENT_ABORTED"
plan_sha256: H64
completed_effect_ids: the exact verified contiguous plan prefix
reason = "CROSS_OBSERVATION_CONFLICT" | "EVIDENCE_LIMIT_EXHAUSTED"
unexpected_count_observation: UnexpectedChildCountObservation V1
observation_basis = "EXECUTOR_REPORTED_TERMINAL_DIAGNOSTIC"
recorded_at_utc: UTC

For CROSS_OBSERVATION_CONFLICT:
  evidence: CrossListObservationConflict V1.
For EVIDENCE_LIMIT_EXHAUSTED:
  evidence: EvidenceLimitExceeded V1.

Neither unexpected_children, preservation_checks, raw_enumeration_proof
nor os_error is a key in this variant. Their absence is explicit:
this is not a complete enumeration/preservation evidence object.

The conflict witness retains its actual two observations. A count-only
limit record preserves its complete measured count and extent but does
not assert it retained every detailed observation. This is a terminal
loss-of-evidence report, never a substitute for the full proof needed
by VERIFIED or MISMATCH.

The unexpected_effect_status of the enclosing outcome is:
- OBSERVED when a COMPLETE or PREFIX_ONLY count is greater than zero;
- NONE_OBSERVED only when count is COMPLETE and exactly zero;
- UNVERIFIED when the count is PREFIX_ONLY zero or NOT_ESTABLISHED.

No success is available under any of these count combinations.

## 4. Exact outcome integration and precedence

### 4.1 Five-way local final-hierarchy union

Explicitly extend only the local successor's final_hierarchy_readback union:

VERIFIED | MISMATCH | UNVERIFIED | NOT_PERFORMED | ASSESSMENT_ABORTED

Dispatch ASSESSMENT_ABORTED only with its exact schema marker and keys.
The first four schemas and their meanings remain unchanged.

This is an explicit NEW reporting extension. Do not pretend the inherited
four-way union could already serialize the new terminal. Do not reinterpret
UNVERIFIED to accept nonexistent OS/read errors or put an aborted record
inside a success-only preservation type.

### 4.2 Two new finite FAILURE rows

Add exactly these rows to the existing LocalCreateOutcome compatibility
table and failure_reason enum. The outcome top-level key sets do not change.

Row COHERENCE_ABORT:
  result_kind = FAILURE
  authorization_verified = true
  failure_phase = FINAL_CLOSURE
  failure_reason = FINAL_HIERARCHY_OBSERVATION_CONFLICT
  failed_effect_id = F4
  failed_effect_report = FILE, report_status FAILED
  last_completed_substep = POST_CLOSE_READBACK_VERIFIED
  completed_effect_ids = [D1,D2,D3,D4,F1,F2,F3]
  completed_effect_reports = the matching seven verified COMPLETE reports
  final_handle_release.state = COMPLETE
  final_handle_release.all_released = true
  final_hierarchy_readback.status = ASSESSMENT_ABORTED
  final_hierarchy_readback.reason = CROSS_OBSERVATION_CONFLICT
  terminal_classification = FAILED_AMBIGUOUS
  retry_count = "0"

Row LIMIT_ABORT:
  all fields above except:
  failure_reason = FINAL_HIERARCHY_EVIDENCE_LIMIT_EXHAUSTED
  final_hierarchy_readback.reason = EVIDENCE_LIMIT_EXHAUSTED
  terminal_classification = FAILED_PARTIAL_PREFIX

For both rows:
- final_hierarchy_readback.plan_sha256 equals the outcome/approved-plan
  identity; its completed_effect_ids equal the outcome prefix;
- final_handle_release is the exact global evidence object required by
  V1.6, not a newly executed release;
- F4's failure_handle_release is DELEGATED_TO_FINAL_RELEASE and references
  the hash of that exact global release object under the existing law;
- no per-effect second close, content write, delete or repair is permitted;
- F4 may have complete source bytes and a successful normal close, but it
  is NOT COMPLETE because final closure did not pass;
- the supplied proof/reference/digest does not authenticate itself.

The following pairings are forbidden:
SUCCESS + ASSESSMENT_ABORTED;
PRE_EFFECT_BLOCK + ASSESSMENT_ABORTED;
FAILURE before FINAL_CLOSURE + ASSESSMENT_ABORTED;
RESOURCE_RELEASE failure + ASSESSMENT_ABORTED;
either new failure reason paired with another hierarchy status;
any new row claiming F4 is in the completed prefix;
any new row with failed/unverified global final release;
any mismatch between abort reason/evidence type/count/terminal row.

No change is made to the one-write budget, parent positive/negative Authz,
security-at-create, source identities, or existing release ownership.

### 4.3 Deterministic final classification

Only after authorized final enumeration has begun and final retained-handle
release is COMPLETE, apply this reporting precedence to established facts:

1. A required observation has genuine unresolved OS/read uncertainty:
   retain the existing UNVERIFIED path and its actual error requirements.
   A limit or two contradictory successful observations is not itself
   an OS error.
2. Otherwise a required detail/count/byte limit is actually exceeded:
   ASSESSMENT_ABORTED / EVIDENCE_LIMIT_EXHAUSTED.
3. Otherwise a cross-list observation conflict is established:
   ASSESSMENT_ABORTED / CROSS_OBSERVATION_CONFLICT.
4. Otherwise all required observations are coherent and fit:
   apply the existing unexpected-child, other-mismatch, or VERIFIED rules.

Recognizing an abort stops normal progression. These are classification
rules over information legitimately available at the stop, not permission
to perform more calls to resolve a higher-priority branch. Do not retry,
re-enumerate, remeasure-to-repair, change a source, or continue to a ninth
create effect.

If an OS uncertainty also prevents constructing a valid legacy UNVERIFIED
record, do not invent that record. If even the compact abort record or its
mandatory enclosing outcome evidence cannot be truthfully captured or
delivered within an already applicable bound, preserve the stop/no-retry
state and report the available failure through the existing permitted
diagnostic channel; do not claim a complete typed outcome exists.
This last-resort reporting failure is NOT the primary disposition of the
65-child case: that case has the fully defined LIMIT_ABORT row above.

No persistent outcome/diagnostic file is authorized. No fallback success,
resume capability or retrospective effect authority is created.

## 5. Worked re-review conditions, not live observations

### 5.1 One repeated D2 path, two identities

The parent-chain entry for the exact D2 path reports object identity A.
The target entry for that same D2 path reports identity B, where A != B.
Both calls/observations succeeded.

Even if preservation_checks contains PASS for B:
- the proposed complete MISMATCH/VERIFIED hierarchy is invalid;
- preservation subject selection must not hide A;
- the trusted final observer reports COHERENCE_ABORT with the two entries;
- no OsErrorEvidence is fabricated;
- prefix is D1 through F3, F4 is FAILED, no retry is permitted.

The same rejection applies to equal file IDs with different SD/DACL/owner,
readback-kind, length/hash, timestamp or nested proof fields.

### 5.2 Sixty-five unexpected children, enumeration completed

A permitted final enumeration actually completed and established 65
distinct unexpected child paths. No OS/read uncertainty occurred.

Required terminal evidence values:
- HierarchyAssessmentAborted.status = ASSESSMENT_ABORTED;
- reason = EVIDENCE_LIMIT_EXHAUSTED;
- unexpected_count_observation.state = COMPLETE;
- unexpected_count_observation.count = "65";
- evidence.metric = UNEXPECTED_CHILD_PATH_COUNT;
- evidence.limit = "64";
- evidence.observed_value = "65";
- evidence.measurement_extent = COMPLETE_ENUMERATION;
- enclosing unexpected_effect_status = OBSERVED;
- enclosing failure_reason = FINAL_HIERARCHY_EVIDENCE_LIMIT_EXHAUSTED;
- enclosing prefix = [D1,D2,D3,D4,F1,F2,F3], failed effect F4;
- global final release COMPLETE, per-effect release delegated;
- no unexpected_children array, no fake count "64", no fake OS error.

This is not a MISMATCH record with an omitted 65th element. It is an explicit
terminal that does not claim full evidence retention or hierarchy proof.

If the bounded enumeration stopped after observing 65, use PREFIX_ONLY and
OBSERVED_PREFIX with count "65", not COMPLETE. There may be more children;
the record does not guess how many. No further read is granted to count them.

### 5.3 Boundary and coexistence cases

- 64 unexpected children: the count cap is not exceeded; a complete
  MISMATCH still needs all 64 genuine witnesses and all other proofs.
- 65 paths serialized into ordinary MISMATCH: reject.
- 65 observed but count reported as 64: reject.
- Overflow plus coherent PASS checks: still LIMIT_ABORT, never success.
- Overflow plus an already known cross-list conflict: LIMIT_ABORT under
  the declared precedence; do not claim the lists were coherent.
- Conflict without overflow: COHERENCE_ABORT; not ordinary MISMATCH.
- Any new terminal paired with a failed global release: reject; normal
  RESOURCE_RELEASE handling applies and final enumeration is not allowed.
- Missing raw details or absent actual measurements cannot be invented
  by the terminal record; unknown is not zero.

## 6. Exact merge/use-site map

| Source or location | Required disposition |
|---|---|
| Batch sections 1--4 (SER-B01--B04) | KEEP byte-for-byte in their source; no new review or edits claimed. |
| Batch section 5 introductory array types | KEEP complete MISMATCH PATH[0..64] and the existing PreservationCheck array types. |
| Batch section 5.1 path/witness bijection | KEEP for complete MISMATCH; the aborted variant deliberately has no such list or completeness claim. |
| Batch section 5.2 subject derivation | PREPEND sections 1.1--1.2 coherence gate; derive subjects only after it passes; otherwise section 4 applies. |
| Batch section 5.3 preservation checks | KEEP, but no PASS is accepted as hierarchy proof before cross-list coherence. |
| Batch section 5.4 complete-record overflow | REPLACE with sections 2--4 of this addendum; keep the 64 cap/no truncation/no OS-error fabrication/no spill rules. |
| Batch section 6 claim that the four-way union is unchanged | SUPERSEDE only that statement: the local union now has the explicit fifth ASSESSMENT_ABORTED variant. |
| LocalCreateOutcome.failure_reason and compatibility | ADD exactly the two FINAL_CLOSURE rows in section 4.2; preserve all other rows. |
| Outcome final_hierarchy_readback dispatch | ADD the exact new marker/status, reject mismatched variants; no top-level outcome-key addition. |
| V1.6 global release and delegated F4 release | KEEP; new rows bind existing evidence and grant no second close. |
| Expected-chain wrapper, equality and digest formula | KEEP unchanged. |
| R1 policy, F1--F4 bytes/hashes, D1--F4 scope/order | KEEP unchanged. |
| Two proposed repository-document paths | No postimage is constructed and no write is granted. |

A merged source must mark the new type and two rows as proposed successor
definitions from this correction. Do not accept both the old four-way-only
claim and this extension as simultaneous normative alternatives. The old
transfer's test counts describe its predecessor and are not tests of this
correction. Any future plan/subject bytes must use the reviewed effective
representation; no previously computed hash is reused by assertion.

## 7. Verification status and delivery boundary

The proposer executed 253 bounded in-memory checks of the new predicates:

| Group | Cases | Unexpected results |
|---|---:|---:|
| Cross-list coherence projection, labels, nested identity and order | 18 | 0 |
| Preservation membership/order after coherence, including 0..9 boundaries | 27 | 0 |
| Count caps, complete/prefix observations, invalid metadata and inherited-limit lookup | 157 | 0 |
| Reporting precedence and two new outcome compatibility rows | 51 | 0 |
| TOTAL | 253 | 0 |

The count-cap checks tested both COMPLETE and PREFIX_ONLY states at every
integer 0..67. Values 0..64 did not satisfy the exhaustion trigger; 65..67
did. Within-cap does not by itself validate an ordinary MISMATCH record:
its witness/proof requirements remain outside that trigger check.

The two decision cases were reproduced symbolically:
- same D2 path with different full observed identity, plus PASS on the
  target-side identity: complete hierarchy/preservation acceptance rejected;
- completed enumeration of 65 unexpected paths: LIMIT_ABORT selected,
  limit "64" and measured count "65" retained, no complete list or OS error
  introduced.

The inherited-byte-cap lookup tests used a TEST-ONLY symbolic schema and
limit to verify exact rule matching. Those values are not part of the
proposed VIONA contract, not a runtime measurement and not a new byte budget.

There was no full-schema validator, actual count measurement, underlying
proof verification, or independent review in these checks. Imported types
were represented by deliberately symbolic fixtures, not executable
authority instances.

The tests described here use independently written standard-library
in-memory symbolic predicates. No attachment code, F3, Windows API, Authz,
native enumeration, handle release, trusted-host approval, full JCS
conformance or full merged-schema validator was executed.

Object and proof values in the tests are synthetic symbols. Boundary-count
tests do not establish a live 65-child enumeration or any OS evidence.
Counter summaries remain executor attestations, not independent proofs.

Required next step:
TARGETED_INDEPENDENT_REREVIEW_OF_SER_B05_01_AND_SER_B05_02

The reviewer should assess the new reporting choices explicitly:
- strict cross-list comparison of the full nested readback;
- the fifth ASSESSMENT_ABORTED variant and two final-failure rows;
- exact-count versus observed-prefix distinction;
- count-only terminal evidence without a false full-transcript claim;
- inherited-byte-limit matching without inventing another budget.

Do not classify either finding CLOSED merely because this file exists.
No document postimage, protocol diff, executable envelope, live plan,
policy pin, provisioning or Pack A effect is produced.

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
R1_ISSUANCE_GATE=BLOCKED

The only output to be materialized by the proposer is this correction
transfer file in the ChatGPT sandbox. The user's Windows repository,
all prior transfer attachments and F1--F4 are untouched.
<!-- END M10 -->

### M11 — transfer E: VIONA_LOCAL_EXACT_CREATE_VERIFIED_HIERARCHY_SERIALIZATION_DELTA_V1_2.md

<!-- BEGIN M11; raw_utf8_length=38285; raw_sha256=ff5d8e5ba282e07df3e684be38e89b34ada4854cbba2b3a67e9822817fa44b9c -->
# VIONA local exact-create: VERIFIED hierarchy serialization

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_VERIFIED_HIERARCHY_SERIALIZATION_DELTA_V1_2
STATUS=FILE_REPORT_ROW_CORRECTION_PENDING_INDEPENDENT_REREVIEW
SCOPE=VERIFIED_FIELD_TYPES_ORDERING_AND_COHERENCE_EVIDENCE_MAPPING
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Provenance and limits of this proposal

The Builder reported that V1.2's VerifiedHierarchyReadback lists fields but
does not define the element types of effect_object_readbacks and
observed_plan_targets. V1.4 defines HierarchyObservedObject for MISMATCH,
while the reviewed SER-B05 correction also requires coherence before a
VERIFIED result. Neither fact supplies the missing VERIFIED mapping.

This document makes NEW, explicit serialization choices for that gap.
It is not a recovered V1.6 clause, a retrospective approval, an executable
envelope, or evidence that the whole successor has been machine validated.

Apply after the effective local-create V1--V1.6 source and these unchanged
transfer inputs, in this order:

| Input | Raw bytes | Raw SHA-256 |
|---|---:|---|
| VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md | 14048 | ddf201bfef00afadeaf5c53b7c44de26a035dd1ef70411326ed8c3c92d837d51 |
| VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1.md | 10488 | 4b2a1d778da68cb3942b9eb1a06c86a6ff93c6e8083bea0e8cfec50934edc07b |
| VIONA_LOCAL_EXACT_CREATE_SERIALIZATION_BATCH_CLOSURE_V1.md | 29638 | ae7331e1d7387be48f6678612615d996372993a309c98e9c7d75f76b6ddc90c8 |
| VIONA_LOCAL_EXACT_CREATE_SER_B05_COHERENCE_AND_LIMIT_DELTA_V1.md | 26700 | 66bf8a9474343822d106b4506d61b9fa44d4d73a2354ff8fa01126e9124bb558 |

The four raw inputs were re-read and matched in the ChatGPT container when
this proposal was prepared. That is not fresh Windows/repository evidence.
Their targeted review dispositions are carried from the source conversation;
this document does not independently reapprove them.

Keep the SER-01 structured-chain rebind, expected-chain digest law, SER-B01--B04,
SER-B05 coherence and exhaustion semantics, V1.6 release ownership, and all
five final-hierarchy result variants. The adopted R1 policy and F1--F4 bytes,
paths, permissions, counts and write authorities remain unchanged.

No two-document postimage, protocol diff, runtime observation, real chain
digest, real plan digest, or authorization-subject digest is constructed.

### 0.1 Transfer revision and targeted file-report-row correction

This V1_2 transfer REPLACES V1_1 for review. V1_1 previously replaced V1.
Apply only the latest replacement, not V1, V1_1 and V1_2 cumulatively.

Immediate predecessor, freshly read as raw bytes for this transfer:
- File: VIONA_LOCAL_EXACT_CREATE_VERIFIED_HIERARCHY_SERIALIZATION_DELTA_V1_1.md
- Raw UTF-8 bytes: 35479
- Raw SHA-256:
  cdd9c95ff3ff3ac35088717e85bca2d9751f3f0707da53c37d97e35417a24074

The latest supplied targeted review found the VH-01 witness correction
sound within scope: the new retained-R/target-T witness remains distinct
from the imported actual-parent-P/target-T witness. This is a relayed
review disposition, not a new independent or runtime approval.

The sole remaining finding concerns section 6.1.5. Its former selector
failed_effect_report.object_kind=FILE names no field in the closed
LocalCreateFileEffectReport V1. This transfer replaces that selector with
the existing exact file-report schema marker and effect_id F4. It also
qualifies the substep and delegated-release paths as nested report fields.
No object_kind field, alias, projection, new report marker, or report key
is introduced.

The existing V1.6 release-digest equality is restated at that exact nested
path; its algorithm, input and output representation are unchanged.
The VH-01 witness type, source-membership predicates, evidence union,
outcome reason/phase, prefix and reporting precedence are unchanged.

Declared changes relative to V1_1 are confined to:
1. The transfer PROPOSAL_ID and pending-review status.
2. This provenance/review-target section.
3. Section 6.1.5's field paths and explicit inherited release binding.
4. Section 10's heading and opening provenance labels, so inherited
   V1_1 test counts are not claimed as V1_2 test execution.

All other bytes are retained. Reverse those four declared replacements
to recover the exact V1_1 predecessor. The earlier V1 transfer and the
four predecessor addenda are not modified.

The 62 cases retained in section 10 are historical V1_1 claims, not new
tests of this row correction. Current targeted review is limited to the
file-report marker, F4 identity and nested field correspondence against
the supplied closed LocalCreateFileEffectReport V1 and delegated release
variant. No independent rereview verdict is issued by this transfer.

This file is a ChatGPT sandbox transfer artifact only. It is not either
repository-document postimage. No Windows/GitHub readback, attachment-code
execution, F3 execution, policy/plan/subject digest, live authority or
repository mutation is performed by this correction.

Correction status:
FILE_REPORT_ROW_CORRECTION_PREPARED_FOR_INDEPENDENT_REREVIEW

## 1. Fixed profile and notation

Let V be a proposed VerifiedHierarchyReadback in the local profile:
  ENVELOPE_CONTRACT.schema =
    "VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"
  profile_id = "VIONA_BME_PACK_A_SOURCE_CREATE_V1"

Let L be the exact plan whose independently recomputed digest the containing
outcome binds. Merely supplying a plan_sha256 does not authenticate L.

Let S = L.security_contract.
Let E = S.non_reparse_chain, the ExpectedNonReparseChain V1 wrapper.
Let C = V.final_non_reparse_chain.
Let R = V.effect_object_readbacks.
Let T = V.observed_plan_targets.

The fixed effect order is:
  I = [D1,D2,D3,D4,F1,F2,F3,F4].

D1--D4 are DIRECTORY effects; F1--F4 are FILE effects. All path values come
from those exact plan effects, not from free-form report input. The parent
map is unchanged:
  D1 -> existing evidence parent
  D2 -> D1
  D3 -> D2
  D4 -> D2
  F1 -> D2
  F2 -> D2
  F3 -> D3
  F4 -> D4.

The expression "i" below is a local 1-based index, not a new JSON field.
The letters L,S,E,C,R,T,I,P_V are local explanatory bindings, not serialized
objects or additional envelope/record keys.

All inherited primitives retain their definitions and validation:
strict JSON, duplicate-key rejection, NFC as input validation, fixed PATH,
UTC, U0, H64, and imported object/proof types. No coercion, string/path
normalization, case folding, unknown-field stripping or implicit migration
is permitted. No null placeholder is introduced.

## 2. Exact VERIFIED record: preserve the twelve-key shape

Marker is unchanged:
  schema = "VIONA_CODEX_VERIFIED_HIERARCHY_READBACK_V1"

Exact required field dictionary:

```text
{
  schema:
    literal("VIONA_CODEX_VERIFIED_HIERARCHY_READBACK_V1"),

  status:
    literal("VERIFIED"),

  plan_sha256:
    H64,

  completed_effect_ids:
    literal JSON array ["D1","D2","D3","D4","F1","F2","F3","F4"],

  effect_object_readbacks:
    EXACT_EIGHT_EFFECT_READBACKS as defined in section 3,

  observed_plan_targets:
    EXACT_EIGHT_VERIFIED_TARGETS as defined in section 4,

  unexpected_child_count:
    literal JSON string "0",

  unexpected_children:
    literal empty JSON array [],

  final_non_reparse_chain:
    ObservedNonReparseChain V1 restricted by section 5,

  post_close_preservation:
    LocalCreatePreservationReadback V1 restricted by section 7,

  enumerated_at_utc:
    UTC,

  raw_enumeration_proof:
    RawOsEvidence V1
}
```

EXACT_EIGHT_EFFECT_READBACKS and EXACT_EIGHT_VERIFIED_TARGETS are local
constraint names for arrays, not new schema markers or wrapper fields.

Every key is required; every other key is forbidden. In particular do not
add observed_parent_chain, a parent index, a second plan hash, or
final_handle_release to this record. The latter remains at the existing
top-level outcome location.

VERIFIED is the all-predicates-passed final branch, not a generic serializer
for partial progress. Earlier V1.2 prose about partial prefixes or an
incomplete failed target does not authorize such data in this success
branch after the later outcome refinements. Partial/failure observations
retain their existing non-VERIFIED variants.

The schema marker is retained within this proposed, not-yet-adopted
successor consolidation. This is not a silent migration of deployed
records or a claim that older bytes acquired new semantics.

## 3. effect_object_readbacks: direct readback array, not wrappers

R is a JSON array of exactly eight elements in I order.

For i = 1..4:
  R[i] is exactly PresentDirectoryReadback V1.

For i = 5..8:
  R[i] is exactly PresentFileReadback V1.

Imported shapes, restated to disambiguate the array elements:

```text
PresentDirectoryReadback V1
  schema = "VIONA_BME_PRESENT_DIRECTORY_READBACK_V1"
  exact keys = {schema,object,exists,read_at_utc}
  object: FsObjectIdentity V1
  exists: literal(true)
  read_at_utc: UTC

PresentFileReadback V1
  schema = "VIONA_BME_PRESENT_FILE_READBACK_V1"
  exact keys = {schema,object,exists,byte_length,sha256,read_at_utc}
  object: FsObjectIdentity V1
  exists: literal(true)
  byte_length: U0
  sha256: H64
  read_at_utc: UTC
```

R has no {effect_id,readback} element wrapper and no pair/dictionary format.
The effect identity is determined by its fixed index and validated exact
object path. Do not accept multiple alternative element shapes.

For every i:
  R[i].object.exact_path == L.ordered_effects[i].exact_path.

The readback marker/type must match that effect's object_kind. Each full
object identity and actual object-kind observation must satisfy the existing
non-reparse, NTFS, path, volume, owner/SD/DACL and proof rules.

For F1--F4:
  R[i].byte_length == L.ordered_effects[i].raw_byte_length;
  R[i].sha256 == L.ordered_effects[i].raw_sha256.

These are final-closure observations obtained after COMPLETE global final
handle release, not unmarked reuse of an earlier per-effect readback.
Stable object and security identities must also agree with the corresponding
proved creation/completion facts. Earlier observation timestamps are NOT
required to equal final observation timestamps: they describe separate
phases and retain their own proof/freshness requirements.

Do not derive call counts, creation history, successful handle release or
effective-Authz PASS from these paths or hashes.

## 4. observed_plan_targets: the existing PRESENT_NORMAL tagged shape

T is a JSON array of exactly eight HierarchyObservedObject V1 values in I
order. For this VERIFIED field only, the PRESENT_NORMAL branch is permitted:

```text
schema = "VIONA_CODEX_HIERARCHY_OBSERVED_OBJECT_V1"
exact keys = {schema,kind,exact_path,effect_id,readback}

kind = "PRESENT_NORMAL"
effect_id = I[i]
exact_path = L.ordered_effects[i].exact_path
readback =
  PresentDirectoryReadback V1 for i=1..4;
  PresentFileReadback V1 for i=5..8.
```

Require:
  T[i].readback.object.exact_path == T[i].exact_path;
  T[i].readback == R[i].

The last equality is full decoded JSON value equality, not merely file ID
or path equality. Exact key sets, schema markers, exists, all object/security
fields, file length/hash when present, read_at_utc and any inherited
readback fields remain significant. Object member presentation order is
irrelevant; array order is significant.

A valid producer can retain one actual final readback object and place that
same value in both locations. This does not supply two independent proofs.
It must not suppress a real conflicting observation, choose the newer copy,
align timestamps, or merge fields to manufacture equality.

ABSENT, REPARSE, PRESENT_UNVERIFIED and UNAVAILABLE cannot be serialized
under VERIFIED. This restriction does NOT retire those variants at their
existing failure/mismatch use sites.

## 5. final_non_reparse_chain: existing prefix, not a branched array

C uses the existing ObservedNonReparseChain V1 marker and five-key shape:

```text
schema = "VIONA_CODEX_OBSERVED_NON_REPARSE_CHAIN_V1"
exact keys = {
  schema,expected_chain_sha256,ordered_objects,observed_at_utc,raw_proof
}

expected_chain_sha256: H64
ordered_objects: nonempty ordered array of full FsObjectIdentity V1
observed_at_utc: UTC
raw_proof: RawOsEvidence V1
```

For this VERIFIED location require:
  C.ordered_objects == E.ordered_objects;
  C.expected_chain_sha256 == EXPECTED_CHAIN_SHA256(E).

The latter is EXACTLY the already reviewed whole-wrapper rule:

```text
EXPECTED_CHAIN_SHA256(E) =
  LOWERCASE_HEX(SHA256_BYTES(
    ASCII("VIONA-CODEX-EXPECTED-NON-REPARSE-CHAIN-V1")
    || BYTE(0x00)
    || JCS_UTF8(E)
  ))
```

Do not hash the observed chain, R, T, only ordered_objects, or a runtime
extension. No domain change, new self-hash or digest field is introduced.

C is the freshly observed volume-root-to-existing-evidence-parent prefix.
Its final object equals S.existing_parent_identity in full. All entries,
adjacent prefix edges and their underlying observations must meet the
existing expected-chain and live-proof rules.

D1--D4 do NOT become extra elements of this plan-bound prefix. In particular,
D3 and D4 are siblings; appending both as consecutive "ancestors" cannot
substitute for verifying the real directory graph.

The created-directory part of the final parent inventory is represented by
R[1..4], cross-bound to T[1..4]. The unchanged plan parent map and retained
prior-effect object history determine its edges. Existing live adjacency,
object/security, runtime-chain-extension and no-reparse checks remain
mandatory; naming a parent in the plan is not proof of an actual edge.

Thus the two pieces cover:
  existing prefix: C.ordered_objects;
  created parents: R[1..4] and matching T[1..4].

No one claims that their concatenation is a single linear root-to-leaf
chain. No new parent-chain field is added to V.

C.raw_proof retains the actual prefix proof. C.observed_at_utc is its own
observed time, not synthesized from target-readback times. There is no
requirement to falsify equal timestamps for these nonoverlapping paths.

## 6. Exact VERIFIED coherence inventory and witness mapping

The SER-B05 correction already requires coherence in any inventory used to
reach VERIFIED. Its MISMATCH mapping is unchanged. This section supplies
the previously missing VERIFIED-side source mapping explicitly.

Define the following NOT-SERIALIZED view from the actual R entries:

```text
P_V[i] = {
  schema: "VIONA_CODEX_HIERARCHY_OBSERVED_OBJECT_V1",
  kind: "PRESENT_NORMAL",
  exact_path: R[i].object.exact_path,
  effect_id: I[i],
  readback: R[i]
}
```

This is a lossless typed adapter over an existing readback. It introduces no
new observed value, timestamp, OS call, hash or raw-evidence claim. Do not
derive P_V from T: that would make the cross-source check tautological.

Require the existing SER-B05 COHERENCE projection equality at each matching
path of P_V and T, with individual list/label/path/type validation first:

```text
COHERENCE(X) = {
  schema: X.schema,
  kind: X.kind,
  exact_path: X.exact_path,
  readback: X.readback
}

COHERENCE(P_V[i]) == COHERENCE(T[i])
```

This is equivalent here to section 4's full R[i] == T[i].readback equality.
It covers every repeated created-parent path D1--D4 and also closes duplicate
file-observation binding at F1--F4. It excludes only outer effect_id, whose
exact positional value is separately required in this VERIFIED mapping.

P_V is the left effect-observation comparand inventory, NOT a serialized
observed_parent_chain and NOT an assertion that every member is a directory
ancestor. Its first four entries provide the created-parent comparands.
The existing-prefix C objects do not overlap a plan-target path: all eight
targets are strictly below the plan-bound existing evidence parent, under
the fixed path/parent rules.

For the evidence-parent preservation subject, use the unique final
C.ordered_objects entry directly; do not fabricate a PresentDirectoryReadback
timestamp merely to wrap that entry in P_V.

### 6.1 VH-01 correction: a distinct VERIFIED-side conflict witness

An invalid submitted VERIFIED record is rejected. A trusted observer that
actually encounters contradictory final observations must not label them
VERIFIED, select one side, or claim coherent preservation.

The predecessor transfer mapped P_V into
CrossListObservationConflict V1.parent_chain_entry. That mapping is RETIRED.
The imported type requires an entry from the actual MISMATCH parent-chain
inventory P. A comparator derived from R is not a member of P merely because
it has a path or shares a shape. A file is not a directory ancestor.

This correction makes one NEW evidence-type choice and one explicit
evidence-union extension. It does not change the meaning of the imported
CrossListObservationConflict V1 marker.

#### 6.1.1 New closed evidence type

```text
VerifiedReadbackObservationConflict V1

schema =
  "VIONA_CODEX_VERIFIED_READBACK_OBSERVATION_CONFLICT_V1"

exact required fields = {
  schema:
    literal("VIONA_CODEX_VERIFIED_READBACK_OBSERVATION_CONFLICT_V1"),

  exact_path:
    PATH,

  effect_id:
    enum("D1","D2","D3","D4","F1","F2","F3","F4"),

  retained_effect_readback:
    PresentDirectoryReadback V1 | PresentFileReadback V1,

  plan_target_entry:
    HierarchyObservedObject V1
}
```

Every listed key is required; other, duplicate or null keys are rejected.
In particular, parent_chain_entry, source_kind, an invented ancestor label,
a new digest, and an extra observation timestamp are not fields of this type.

"Verified" in this type name identifies the attempted VERIFIED evaluation
path. It does not assert that the containing hierarchy or either observation
has passed every plan/security/content predicate.

For effect_id D1--D4, retained_effect_readback is a direct
PresentDirectoryReadback V1. For F1--F4, it is a direct
PresentFileReadback V1. Their exact imported markers and fields remain those
restated in section 3. The witness does not wrap its left readback in an
ancestor entry or serialize P_V.

#### 6.1.2 Exact source membership and mismatch predicate

Let i be the unique position of effect_id in the fixed plan order I.
The actual plan, observation phase and invocation are already bound by the
containing outcome and the trusted observer's retained context.

For conflict construction, R and T denote the actual final observations
retained while evaluating the candidate for VERIFIED. They are not a claim
that a valid VerifiedHierarchyReadback object already exists. Failure of
their equality is precisely why the success record must not be emitted.

Require all of the following:

```text
w.effect_id == I[i]
w.exact_path == L.ordered_effects[i].exact_path

w.retained_effect_readback == R[i]
w.retained_effect_readback.object.exact_path == w.exact_path

w.plan_target_entry == T[i]
w.plan_target_entry.effect_id == w.effect_id
w.plan_target_entry.exact_path == w.exact_path

COHERENCE(P_V[i]) != COHERENCE(T[i])
```

P_V[i] in the last predicate is ONLY the non-serialized comparison view
defined in section 6 from the independently retained R[i]. No field of the
new witness names it as a parent-chain member.

Both source values must satisfy their applicable imported shape, marker,
path, kind and observation-proof rules. They must be actual final-phase
observations from this same plan evaluation after COMPLETE global release,
not unmarked substitution of an earlier per-effect readback or data from
another invocation.

The target entry retains its actual, context-valid D1--F4 effect_id. A valid
ABSENT or REPARSE target-side observation may be used only under the
existing general HierarchyObservedObject variant rules; it still cannot
appear in a successful VERIFIED record. No imported variant is broadened.

Witness validation checks individually well-formed observations and a real
disagreement. It does not require the success-only equality between them,
nor does it require a measured wrong file length/hash to pass the expected
plan-content comparison before the failure can be reported. These success
checks remain mandatory for VERIFIED. This distinction permits reporting
a real failure, not treating that failure as success proof.

Source membership must be validated against the trusted observer's retained
R/T inputs and their established observation/proof context. Merely receiving
two caller-selected values, identical paths, effect labels or hashes does
not establish that they were observed or came from those inventories.
If membership or required proof cannot be established, do not invent this
witness; keep the applicable unavailable-evidence/diagnostic behavior.

Equality and inequality use full decoded JSON value comparison with exact
key sets: object member presentation order is irrelevant; all scalar values
and array order remain significant. This includes read_at_utc, full object
identity/security, and file length/hash when present. Do not trim paths,
case-fold, align timestamps, pick the newer observation or combine fields.
Do not derive the left readback from the target simply to satisfy membership.

For example, an actually retained F1 PresentFileReadback and its actual F1
PRESENT_NORMAL target wrapper with a different measured hash produce this
new witness. Both remain file observations. A directory D2 identity conflict
in R versus T uses the same new type, not an invented P entry.

#### 6.1.3 Preserve the MISMATCH-side witness exactly

CrossListObservationConflict V1 retains the marker:
  "VIONA_CODEX_CROSS_LIST_OBSERVATION_CONFLICT_V1"

Its exact keys remain:
  {schema,exact_path,parent_chain_entry,plan_target_entry}.

Its parent_chain_entry must still be the actual entry from the MISMATCH
observed_parent_chain P; plan_target_entry must be the actual entry from
that evaluation's T. Their original context-valid labels, path membership,
individual observation rules and COHERENCE inequality remain required.
The ancestor-chain label remains ANCESTOR where the imported contract
requires it.

Neither P_V[D2] with effect_id=D2 nor P_V[F1] is accepted as that actual
parent-chain entry. Relabeling a file or manufactured comparator ANCESTOR
does not satisfy source membership. Do not migrate or repair an invalid
old witness by changing its marker.

Thus there are two different sources, with two different markers:
- actual parent-chain P versus T: CrossListObservationConflict V1;
- actual retained final effect readback R versus T during VERIFIED
  evaluation: VerifiedReadbackObservationConflict V1.

The caller cannot choose an evidence marker to bypass the source rule.

#### 6.1.4 Explicit terminal evidence-union binding

The following is the complete replacement of the reason-to-evidence
dispatch at the proposed local successor's
HierarchyAssessmentAborted V1.evidence field:

```text
HierarchyAssessmentAborted V1
schema = "VIONA_CODEX_HIERARCHY_ASSESSMENT_ABORTED_V1"

KEEP exact top-level keys:
  {schema,status,plan_sha256,completed_effect_ids,
   reason,evidence,unexpected_count_observation,
   observation_basis,recorded_at_utc}

For reason = "CROSS_OBSERVATION_CONFLICT":

  evidence.schema =
    "VIONA_CODEX_CROSS_LIST_OBSERVATION_CONFLICT_V1"
  =>
    validate exact CrossListObservationConflict V1,
    including actual MISMATCH P/T source membership.

  OR

  evidence.schema =
    "VIONA_CODEX_VERIFIED_READBACK_OBSERVATION_CONFLICT_V1"
  =>
    validate exact VerifiedReadbackObservationConflict V1,
    including actual VERIFIED-evaluation R/T source membership.

For reason = "EVIDENCE_LIMIT_EXHAUSTED":

  evidence:
    exact EvidenceLimitExceeded V1, unchanged.
```

The conflict evidence is exactly one object of the selected type, not an
array, a wrapper with optional fields, or a hybrid of both key sets.
Dispatch checks the exact evidence marker and its entire required key set.
Unknown/mixed markers, wrong reason/type pairing, source mismatch, and
fallback from a failed validator to the other witness type are rejected.

This explicitly extends only the CROSS_OBSERVATION_CONFLICT evidence arm
with one new closed type. It does not silently broaden the imported old
witness, change the terminal's top-level keys/marker, add a sixth hierarchy
variant, or add an outcome phase/reason. The extension is proposed for this
not-yet-adopted successor consolidation; it does not reinterpret deployed
records or the retained F1--F4 bytes.

The source-specific validation context is a verification dependency, not
an additional caller-controlled JSON field. A terminal must not depend on
a nonexistent successful VERIFIED record to prove where the observations
came from; it uses the retained attempted-evaluation inputs.

#### 6.1.5 Unchanged failure outcome and precedence

For either correctly sourced conflict witness, preserve exactly:

```text
result_kind=FAILURE
authorization_verified=true
failure_phase=FINAL_CLOSURE
failure_reason=FINAL_HIERARCHY_OBSERVATION_CONFLICT
completed_effect_ids=[D1,D2,D3,D4,F1,F2,F3]
failed_effect_id=F4
failed_effect_report.schema=VIONA_CODEX_LOCAL_CREATE_FILE_EFFECT_REPORT_V1
failed_effect_report.effect_id=F4
failed_effect_report.report_status=FAILED
failed_effect_report.last_completed_substep=POST_CLOSE_READBACK_VERIFIED
final_handle_release.state=COMPLETE
final_handle_release.all_released=true
failed_effect_report.failure_handle_release.state=DELEGATED_TO_FINAL_RELEASE
final_hierarchy_readback.status=ASSESSMENT_ABORTED
final_hierarchy_readback.reason=CROSS_OBSERVATION_CONFLICT
terminal_classification=FAILED_AMBIGUOUS
retry_count="0"
```

The paths above are relative to the containing outcome. Select the report
by its existing exact schema marker, not by an object_kind field or an
undeclared projection. Require:
  failed_effect_report.effect_id == failed_effect_id == "F4".

LocalCreateFileEffectReport V1 retains its existing closed key set:
object_kind is not a report key and remains rejected there. The qualified
last_completed_substep and failure_handle_release paths refer only to the
nested failed_effect_report, not additional outcome-level fields.

Validate the existing delegated-release variant at that nested location:

```text
failed_effect_report.failure_handle_release.schema ==
  "VIONA_CODEX_FAILURE_HANDLE_RELEASE_V1"

failed_effect_report.failure_handle_release.final_handle_release_sha256 ==
  LOWERCASE_HEX(SHA256(JCS_UTF8(final_handle_release)))
```

This is the existing V1.6 raw whole-record release digest, not a new
domain-separated hash or a self-hash field. The global final_handle_release
object is the same retained COMPLETE evidence object required above.
The report selector and qualified references do not add any report or
outcome field, make F4 COMPLETE, or change witness-source validation.

Keep the existing plan/prefix equality, exact global-release object and
delegation digest rules, and unexpected-count/extent classification.
F4 is not promoted to COMPLETE because final closure failed.

The inherited reporting precedence remains:
genuine required OS/read uncertainty first; then actual evidence-limit
exhaustion; then established observation conflict; otherwise the ordinary
coherent mismatch/success rules. In particular, 65 unexpected children
retain the existing limit-exhaustion route and count semantics, even when
a conflict is also known. This witness does not turn a conflict or limit
into an invented OS error.

No new read, enumeration, retry, recapture-to-repair, close, persistent
output, evidence spill, writer role or authority is introduced.

## 7. Nine preservation subjects after coherence, not before

Only after sections 2--6 and their proof prerequisites pass may preservation
results contribute to VERIFIED.

The exact ordered object-subject list is:

```text
O = [
  last(C.ordered_objects),
  T[1].readback.object,
  T[2].readback.object,
  T[3].readback.object,
  T[4].readback.object,
  T[5].readback.object,
  T[6].readback.object,
  T[7].readback.object,
  T[8].readback.object
]
```

This is the same nominal order:
  [EVIDENCE_PARENT,D1,D2,D3,D4,F1,F2,F3,F4].

V.post_close_preservation retains the exact existing
LocalCreatePreservationReadback V1 type and marker:
  "VIONA_CODEX_LOCAL_CREATE_PRESERVATION_READBACK_V1"
  exact keys={
    schema,excluded_principal_sids,objects,reviewed_method_id,
    read_after_handles_closed_at_utc,raw_proof
  }.

In this VERIFIED location:
- objects has exactly nine PreservedObjectEntry V1 entries in O order;
- objects[j].object equals O[j] in full;
- objects[j].negative_authz.object equals O[j] in full;
- every existing negative-proof, exact-principal-set, mask, method,
  raw-proof and effective-access requirement must pass;
- the excluded principal set and reviewed method bind to the exact
  security contract;
- the evidence is genuinely after global handle release under the
  existing observation-order/freshness contract.

This success branch does not use the MISMATCH-only conditional 0..9 subject
selection to skip an absent, reparse or unproved object. Such facts cannot
produce VERIFIED. Ancestors above EVIDENCE_PARENT and unexpected children
are not extra members of these nine preservation entries.

Timestamps in a preservation proof and an object readback need not be
identical: they are distinct observation types with their own required
provenance. The full-readback copy equality in section 4 still applies.
No new universal timestamp equality is introduced.

## 8. Noncircular final-completion sequence and failure boundary

The governing V1.6 sequence stays:
  D1--F3 verified COMPLETE;
  F4 reaches POST_CLOSE_READBACK_VERIFIED;
  global FinalRetainedHandleRelease completes successfully;
  final observations, coherence and preservation are checked;
  only then may F4 advance to FINAL_CLOSURE_VERIFIED and SUCCESS be emitted.

The eight labels in V.completed_effect_ids describe the successful
post-validation result. They are not a prerequisite requiring F4 already to
have FINAL_CLOSURE_VERIFIED before running these final checks. The verifier
checks the independently retained earlier seven-effect prefix and F4
post-close readiness, then promotes only after all final predicates pass.
Identifier arrays do not prove any step happened.

V1.6's final_handle_release stays at outcome level, with its existing
digest/delegation/ledger rules; do not embed another copy in V.

Keep all existing fail-closed routing:
- complete and coherent observations, a measured false target/security/
  preservation predicate: existing MISMATCH route, never VERIFIED;
- genuine observation unavailability: existing UNVERIFIED route with
  truthful evidence, never invented absence or OS error;
- conflict between retained copies: existing ASSESSMENT_ABORTED conflict
  route with section 6.1's explicit source binding;
- evidence-limit exhaustion: existing ASSESSMENT_ABORTED limit route;
- no final enumeration because an earlier gate stopped: NOT_PERFORMED;
- failed global final release: RESOURCE_RELEASE failure, no enumeration.

This proposal grants no retry, recapture-to-repair, second close, implicit
cleanup, new enumeration, publication or storage.

## 9. Deterministic integration map

| Location | Disposition |
|---|---|
| VerifiedHierarchyReadback marker/top-level key set | KEEP the existing marker and exactly twelve keys. |
| effect_object_readbacks | DEFINE exact eight direct imported readbacks in plan order, section 3. |
| observed_plan_targets | DEFINE exact eight existing PRESENT_NORMAL wrappers, section 4. |
| Coherence between those fields | DEFINE full-readback equality through the explicit P_V adapter; no serialized P_V field. |
| final_non_reparse_chain | RESTRICT this use site to the fresh existing-prefix ObservedNonReparseChain; preserve its five keys and expected-wrapper digest. |
| Created-parent final evidence | LOCATE in R[1..4]/T[1..4], with the unchanged parent dependency graph and required live edge proofs. |
| VERIFIED evidence-parent preservation resolver | REBIND from an unspecified parent-list location to last(C.ordered_objects), a real chain observation. |
| Other VERIFIED preservation subjects | Use T after complete coherence; exactly nine success subjects. |
| VERIFIED conflict witness consumer | DEFINE VerifiedReadbackObservationConflict V1 from actual direct R[i] and actual T[i], section 6.1. Never place P_V in the imported parent_chain_entry. |
| HierarchyAssessmentAborted.evidence for CROSS_OBSERVATION_CONFLICT | EXTEND explicitly to the original P/T witness OR the new R/T witness, dispatched by exact evidence marker and actual source membership. Top-level keys/reasons unchanged. |
| unexpected children in VERIFIED | Exactly [] with count "0"; nonzero values take existing failure routes. |
| Older partial-VERIFIED wording | Not accepted in this success-only dispatch; other hierarchy variants retain their existing meanings. |
| SER-B05 original MISMATCH P/T witness, limits, fifth hierarchy variant and two failure rows | KEEP. Only the reason-to-evidence arm receives the explicit new witness type described above. |
| V1.6 final release, F4 completion and outcome key sets | KEEP, with noncircular evaluation described in section 8. |
| R1 policy, F1--F4 and eight effect paths/budgets | KEEP; no byte or authority change. |

Any earlier type/count wording inconsistent with these proposed VERIFIED
field definitions is superseded at this one dispatch location only, if this
proposal is independently accepted. Do not accept both array encodings,
silently extend C, or retain partial-VERIFIED behavior as an alternative.

The new choices must be identified as originating in THIS proposal in the
future self-contained document. No reviewed source input is edited.

## 10. Historical V1_1 bounded checking and VH-01 review request

This section preserves the predecessor's checking report and earlier
review request as historical provenance. Its 62 cases were not rerun for
V1_2 and do not establish acceptance of the field-path correction in
section 6.1.5. The current rereview target is defined in section 0.1.

The V1 transfer reported 59 cases about the earlier VERIFIED serialization.
The V1_1 proposer separately reported 62 in-memory cases:
- 21 accepted conflict-witness/dispatch/terminal-subset cases;
- 41 rejected missing-key, wrong-source, wrong-kind, wrong-marker or
  incompatible-terminal cases;
- 0 disagreements with the explicitly specified expected results.

| Model group | Cases |
|---|---:|
| New witness at D1--F4; file identity/content/security/time differences; actual absent/reparse target alternatives | 16 |
| Missing/extra keys, wrong marker/effect/path/kind, source substitutions, no conflict, missing provenance assumptions | 23 |
| Original actual-parent witness acceptance and source-membership rejections | 4 |
| Closed evidence-marker dispatch and wrong-source/unknown-marker rejection | 5 |
| Selected inherited conflict-terminal compatibility conditions | 14 |
| Total | 62 |

Decisive cases:
- F1 retained direct file readback versus actual F1 target observation with
  a different file hash: NEW witness accepted as a conflict, not success.
- D2 actual P entry labeled ANCESTOR versus T: original witness accepted.
- P_V[D2] substituted for the actual P entry: original witness rejected.
- F1 file comparand relabeled ANCESTOR in the original type: rejected.
- Same path without exact retained R/T membership: rejected.
- Source timestamp/security changes introduced after retrieval: rejected.
- Coherent copies with no inequality: not a conflict witness.
- New witness under the old marker, or wrong evidence/source-context
  dispatch: rejected.
- Conflict terminal paired with SUCCESS, failed global release, F4 already
  in the completed prefix, nonzero retry or wrong hierarchy reason: rejected.

These are independently written test-only in-memory models of the proposed
predicates, not executions of attachment code or F3. Imported filesystem/
readback types are represented by a bounded subset of their fields and
synthetic values; actual raw proof, OS identity, Authz, timing, causal source
membership, trusted-host verification and full imported-schema conformance
are not established by these tests. Source-proof availability and invocation
membership were explicit symbolic prerequisites, not runtime measurements.
The outer terminal tests check selected correspondence fields, not the
complete outcome schema, release ledger or an authorized instance.

No schema file, policy/plan/subject digest, signature, native observation,
validator executable, repository postimage or runtime authority was created.

Required independent rereview is targeted to VH-01:
1. new marker, exact five-key witness and imported readback references;
2. actual retained R/T membership and full inequality;
3. no use of a file/effect comparator as an ancestor;
4. unchanged old CrossListObservationConflict P/T semantics;
5. explicit reason/evidence union extension with exact source dispatch;
6. unchanged containing terminal row, precedence, limits and no-retry rule.

The prior targeted review found no concrete defect in the other VERIFIED
definitions within its scope; that disposition is carried, not promoted
to full-contract/runtime approval. Review a concrete regression if the
VH-01 correction introduces one. Do not call VH-01 CLOSED merely because
this file or the bounded case count exists.

## 11. Delivery and next disposition

This is a transfer artifact created in the ChatGPT sandbox only. It is not
one of the two proposed repository-document postimages.

No access to or mutation of C:\KNG\ket-noi-eu is claimed here.
The Builder's reported protocol preimage and Git baseline remain reported
evidence, not fresh measurements by this proposal.

Requested next verdict:
  GREEN_FOR_DOCS_BYTE_CONSTRUCTION, or
  REQUEST_CHANGES with exact remaining use-site/serialization defects, or
  BLOCKED with the genuinely unavailable required source.

Only after targeted review acceptance may the Builder resume constructing
the two proposed documents IN MEMORY, still without write authorization.

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_BYTES_CONSTRUCTED_IN_MEMORY=NO
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
POLICY_PIN_MATERIALIZED=NO
R1_ISSUANCE_GATE=BLOCKED
AUTHORIZED_TREE=NO
<!-- END M11 -->

### M12 — transfer F: VIONA_LOCAL_EXACT_CREATE_MISMATCH_STATUS_SERIALIZATION_DELTA_V1.md

<!-- BEGIN M12; raw_utf8_length=22314; raw_sha256=53b142afe7e9577a95745887bccd2a9277861218f15eddd52fdf1aff0f67c6d3 -->
# VIONA local exact-create: MISMATCH inventory, witness order, and outcome-status closure

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_MISMATCH_STATUS_SERIALIZATION_DELTA_V1
STATUS=NEW_TECHNICAL_PROPOSAL_PENDING_INDEPENDENT_REVIEW
SCOPE=MISMATCH_PARENT_INVENTORY_WITNESS_ORDER_AND_UNEXPECTED_EFFECT_STATUS_ONLY
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Provenance and merge boundary

This addendum closes exactly three serialization ambiguities reported during
the bounded two-document construction audit:

1. the complete membership/order/edge semantics of
   `HierarchyMismatchReadback V1.observed_parent_chain`;
2. one total deterministic order for every `HierarchyMismatchWitness V1`
   variant;
3. the exhaustive `unexpected_effect_status` correspondence for the five
   local final-hierarchy variants and pre-effect outcomes.

This is a NEW technical proposal. It is not recovered V1--V1.6 text, a
review verdict, an adopted successor contract, a repository postimage, or
execution authority.

Apply after the effective local-create V1--V1.6 source and the latest
reviewed transfer chain:

- VIONA_LOCAL_EXACT_CREATE_FIVE_TYPE_SERIALIZATION_DELTA_V1_1.md
- VIONA_LOCAL_EXACT_CREATE_EXPECTED_CHAIN_DIGEST_DELTA_V1.md
- VIONA_LOCAL_EXACT_CREATE_SERIALIZATION_BATCH_CLOSURE_V1.md
- VIONA_LOCAL_EXACT_CREATE_SER_B05_COHERENCE_AND_LIMIT_DELTA_V1.md
- VIONA_LOCAL_EXACT_CREATE_VERIFIED_HIERARCHY_SERIALIZATION_DELTA_V1_2.md

Do not reopen or rewrite their targeted GREEN dispositions merely because
this addendum supplies missing consolidation rules.

No key is added to `HierarchyMismatchReadback V1`, `HierarchyMismatchWitness
V1`, `LocalCreateOutcome V1`, or any final-hierarchy variant. This addendum
defines exact field types/order/use-site compatibility for fields already
present.

The adopted R1 policy, F1--F4 bytes/identities, D1--F4 paths/order/parent
relationships, release ownership, one-write budget, Authz/preservation
requirements, expected-chain digest, conflict witnesses, assessment-aborted
terminal, and V1/V2 dispatch remain unchanged.

## 1. Exact MISMATCH parent inventory P

### 1.1 Field type and meaning

For `HierarchyMismatchReadback V1`, define:

```text
observed_parent_chain:
  ordered array of HierarchyObservedObject V1
```

The historical field name is retained. In this local Pack A profile its
serialization meaning is an **ordered parent-observation inventory** with
two consecutive logical regions:

```text
P = EXISTING_PREFIX || CREATED_PARENT_SUFFIX
```

It is NOT a claim that every adjacent entry in the complete P array is a
single linear ancestor edge. Only `EXISTING_PREFIX` is a linear chain.
`CREATED_PARENT_SUFFIX` is a topologically ordered inventory for the four
created directories that later serve as parents.

Files F1--F4 are never members of P.

Every P entry must be an actually obtained, individually well-formed
`HierarchyObservedObject V1` from the same trusted final hierarchy
assessment. Caller-supplied labels, paths, or objects do not acquire source
membership merely by matching this shape.

### 1.2 EXISTING_PREFIX membership and order

Let:

```text
E = LocalCreatePlan V1.1.security_contract.non_reparse_chain
```

where E is the reviewed `ExpectedNonReparseChain V1`:

```text
E.ordered_objects = [E0, E1, ..., En]
```

from the volume root through the existing evidence parent.

`EXISTING_PREFIX` has exactly `length(E.ordered_objects)` entries in that
same order.

For every zero-based position j:

```text
P[j].effect_id = "ANCESTOR"
P[j].exact_path = E.ordered_objects[j].exact_path
```

The observation variant may truthfully be `PRESENT_NORMAL`, `ABSENT`, or
`REPARSE` if that measured result is allowed by the existing MISMATCH
observation contract.

For `PRESENT_NORMAL` at an existing-prefix position, its readback object
must refer to that exact expected path and is compared to the corresponding
expected full `FsObjectIdentity` under the existing mismatch predicates.
A measured ABSENT or REPARSE result is not repaired into a normal object.

If a required existing-prefix observation cannot be established because of
genuine OS/read uncertainty, a complete MISMATCH record cannot be formed;
the inherited `UNVERIFIED` route applies instead.

The final member of EXISTING_PREFIX corresponds to the exact existing
evidence parent. No created directory is inserted into this prefix.

### 1.3 CREATED_PARENT_SUFFIX exact four entries

Immediately after EXISTING_PREFIX, append exactly four entries in this
fixed order:

```text
D1, D2, D3, D4
```

For k in that ordered list:

```text
entry.effect_id = k
entry.exact_path = plan.ordered_effects[k].exact_path
```

Each entry is an actual final observation of the corresponding created
directory and uses an allowed `HierarchyObservedObject V1` variant.

These four labels are NOT changed to `ANCESTOR`. They identify created
parent effects. This is distinct from the existing-prefix ancestor labels.

No F1--F4 file entry is permitted in P.

### 1.4 Branched parent-edge interpretation

The suffix is topologically ordered but not a linear path. Validate the
created-parent edges against the already selected Pack A graph:

```text
parent(D1) = existing evidence parent
parent(D2) = D1
parent(D3) = D2
parent(D4) = D2
```

Therefore:

- D1 follows the evidence-parent prefix in the inventory;
- D2 is a child of D1;
- D3 and D4 are siblings under D2;
- D3 is NOT the parent of D4 merely because D3 precedes D4 in P.

A verifier must use the explicit parent map and retained/readback evidence,
not array adjacency, for the created-parent suffix.

A wrong edge, wrong path, wrong label, missing D1--D4 entry, additional
created parent, duplicate path, or reordered suffix invalidates the complete
MISMATCH parent inventory.

### 1.5 Relationship to observed_plan_targets T

`HierarchyMismatchReadback V1.observed_plan_targets` remains the exact eight
D1,D2,D3,D4,F1,F2,F3,F4 observations in plan order under the reviewed
SER-B05 rule.

Thus D1--D4 appear once in P's created-parent suffix and once in T.

Before preservation-subject derivation or complete MISMATCH acceptance,
apply the already reviewed SER-B05 cross-list coherence rule to every
repeated created-parent path:

```text
P[Dk] versus T[Dk], k in {D1,D2,D3,D4}
```

using full nested-readback equality while excluding only the permitted
outer effect-label difference defined by that rule.

A conflict is not repaired by selecting one list. It follows the existing
non-authorizing conflict-terminal disposition.

F1--F4 do not appear in P. Their duplicate retained-readback-versus-target
comparison, when applicable during an attempted VERIFIED evaluation, stays
under the separately reviewed VERIFIED-side R-versus-T witness. Do not
broaden P to include files to reuse the old witness.

## 2. Total deterministic order for mismatch_witnesses

### 2.1 Scope

The inherited `HierarchyMismatchReadback V1.mismatch_witnesses` remains a
nonempty array of existing `HierarchyMismatchWitness V1` variants.

This addendum does not add a witness reason, field, or marker. It defines
one total, non-serialized sort key for the existing variants so the phrase
"sorted by plan effect/path then reason" has exactly one implementation.

Every witness must first satisfy its own reason-discriminated schema and
evidence predicates. Sorting cannot make an otherwise invalid witness valid.

### 2.2 Extract WITNESS_SUBJECT_PATH

For a well-formed witness W, define its non-serialized subject path exactly
by reason:

```text
OBJECT_ID_MISMATCH:
  W.observed_object.exact_path

CONTENT_MISMATCH:
  W.observed_file.object.exact_path

SECURITY_MISMATCH:
  W.observed_object.exact_path

REPARSE_DETECTED:
  W.observed_reparse.exact_path

TARGET_ABSENT:
  W.observed_absence.exact_path

PRESERVATION_FORBIDDEN_RIGHT_GRANTED:
  W.preservation_check.object.exact_path

UNEXPECTED_CHILD:
  W.unexpected_child.exact_path
```

For variants containing an `effect_id`, the inherited requirement that the
effect ID and evidence path refer to the same expected subject remains
mandatory. The path extraction does not replace that check.

For `OBJECT_ID_MISMATCH`, the inherited expected/observed path relation
must already be valid; the subject path is not chosen from whichever side
sorts more conveniently.

No witness with a path outside the allowed categories in section 2.3 is
accepted.

### 2.3 Subject classes and primary ordering

Construct the following non-serialized subject ordering.

#### CLASS 0 — existing-prefix paths

The exact paths of E.ordered_objects, in their existing volume-root-to-
evidence-parent order:

```text
EXISTING_PREFIX_INDEX(path) = its unique position in E.ordered_objects
```

This includes the evidence parent as the final existing-prefix member.

#### CLASS 1 — plan-target paths

The exact D1--F4 paths in fixed plan order:

```text
D1,D2,D3,D4,F1,F2,F3,F4
```

D1--D4 are classified here, not again as existing-prefix subjects, even
though they also occur in P's created-parent suffix.

#### CLASS 2 — unexpected-child paths

The exact paths in `unexpected_children`, using the already reviewed
ascending decoded-path UTF-8 byte order.

A path that is not one of the above is invalid as a complete MISMATCH
witness subject.

Define:

```text
SUBJECT_CLASS(path) = 0 | 1 | 2

SUBJECT_ORDER(path) =
  existing-prefix index                       if class 0
  plan-effect index 0..7                      if class 1
  exact decoded-path UTF-8 byte sequence      if class 2
```

The path must belong to exactly one effective class after applying the
priority above. Plan-created paths D1--D4 use class 1.

### 2.4 Fixed reason rank

Define the following non-serialized reason rank:

```text
0 OBJECT_ID_MISMATCH
1 CONTENT_MISMATCH
2 SECURITY_MISMATCH
3 REPARSE_DETECTED
4 TARGET_ABSENT
5 PRESERVATION_FORBIDDEN_RIGHT_GRANTED
6 UNEXPECTED_CHILD
```

This ordering is a serialization choice only. It does not change failure
precedence or the semantic seriousness of one reason versus another.

### 2.5 Exact sort tuple

For every witness W:

```text
WITNESS_SORT_KEY(W) = (
  SUBJECT_CLASS(WITNESS_SUBJECT_PATH(W)),
  SUBJECT_ORDER(WITNESS_SUBJECT_PATH(W)),
  REASON_RANK(W.reason)
)
```

`mismatch_witnesses` must be strictly ascending by this tuple.

For class 0 and class 1, SUBJECT_ORDER is the integer index.
For class 2, SUBJECT_ORDER is the decoded-path UTF-8 byte sequence.

No locale collation, case folding, path normalization, JSON key order,
filesystem enumeration order, evidence timestamp, SID, file ID, or witness
hash participates in this ordering.

### 2.6 Tie and duplicate rejection

Two witnesses may not have the same complete `WITNESS_SORT_KEY`.

For each subject and reason, at most one witness is permitted.

The inherited reason-specific bijections remain stronger where applicable:

- each `unexpected_children` path has exactly one `UNEXPECTED_CHILD`
  witness and vice versa;
- each preservation MISMATCH has exactly one
  `PRESERVATION_FORBIDDEN_RIGHT_GRANTED` witness and vice versa.

Exact duplicate canonical witness objects are also rejected.

If two independently obtained evidence objects would require the same
subject/reason witness, the producer must not serialize both as duplicate
predicate witnesses. If their contents conflict, the applicable
coherence/uncertainty terminal rules determine the containing result; the
sorter does not select one arbitrarily.

## 3. Exhaustive unexpected_effect_status correspondence

### 3.1 Existing enum and principle

Keep the inherited outcome enum:

```text
unexpected_effect_status =
  NONE_OBSERVED | OBSERVED | UNVERIFIED
```

The status reports what is truthfully established about unexpected effects
within the applicable assessment scope.

It never converts an unavailable remainder into absence:

```text
NONE_OBSERVED
```

is allowed only when the governing branch has complete evidence sufficient
to establish zero unexpected effects for its scope.

A positive, actually retained unexpected-object observation must not be
discarded merely because another required observation later becomes
unavailable.

### 3.2 Positive unexpected observation for UNVERIFIED

For an `UnverifiedHierarchyReadback V1` U, define a non-serialized predicate:

```text
HAS_POSITIVE_UNEXPECTED_OBSERVATION(U)
```

It is true iff U.observations contains at least one actual observation from
the attempted final-hierarchy enumeration that:

1. has an exact path outside the expected inventory:
   - outside E.ordered_objects paths; and
   - outside D1--F4 exact plan-target paths;
2. positively establishes object presence through an existing
   `PRESENT_DIRECTORY`, `PRESENT_FILE`, or `PRESENT_UNVERIFIED` local
   readback variant whose semantics include `exists=true`;
3. is retained as part of the trusted attempted-evaluation observation
   inventory, not a caller-selected arbitrary path.

`ABSENT` does not establish an unexpected object.
`UNAVAILABLE` does not establish an unexpected object.

The predicate does not claim the enumeration was complete and does not
provide an unexpected-child count.

### 3.3 VERIFIED mapping

For:

```text
result_kind=SUCCESS
final_hierarchy_readback.status=VERIFIED
```

require exactly:

```text
unexpected_effect_status=NONE_OBSERVED
```

The existing VERIFIED contract already requires the exact hierarchy and no
unexpected child.

`OBSERVED` or `UNVERIFIED` is incompatible with SUCCESS/VERIFIED.

### 3.4 MISMATCH mapping

A complete `MISMATCH` already has an exact `unexpected_child_count` matching
its complete `unexpected_children` list within the reviewed cap.

Require:

```text
unexpected_child_count > 0
  => unexpected_effect_status=OBSERVED

unexpected_child_count == 0
  => unexpected_effect_status=NONE_OBSERVED
```

`UNVERIFIED` is incompatible with a complete MISMATCH record.

A MISMATCH caused solely by another measured false predicate may therefore
truthfully use `NONE_OBSERVED` only because its final unexpected-child
enumeration is complete and count zero.

### 3.5 UNVERIFIED mapping

For:

```text
final_hierarchy_readback.status=UNVERIFIED
```

require:

```text
HAS_POSITIVE_UNEXPECTED_OBSERVATION(U) == true
  => unexpected_effect_status=OBSERVED

HAS_POSITIVE_UNEXPECTED_OBSERVATION(U) == false
  => unexpected_effect_status=UNVERIFIED
```

`NONE_OBSERVED` is forbidden for UNVERIFIED.

Thus a hierarchy may preserve that it already observed an unexpected child
while still admitting that the remainder or another required observation
could not be established.

The positive observation does not convert the hierarchy from UNVERIFIED to
MISMATCH; the inherited precedence for genuine required OS/read uncertainty
remains in force.

### 3.6 NOT_PERFORMED mapping for post-effect FAILURE

For a post-effect `FAILURE` whose:

```text
final_hierarchy_readback.status=NOT_PERFORMED
```

require:

```text
unexpected_effect_status=UNVERIFIED
```

The final hierarchy enumeration was not attempted, so this branch cannot
claim `NONE_OBSERVED`.

Under the currently reviewed finite failure rows, no pre-final-closure
NOT_PERFORMED failure reason itself carries a complete final unexpected-
child observation. If a future successor adds such a row, it must explicitly
rebind this status mapping rather than silently infer OBSERVED.

### 3.7 PRE_EFFECT_BLOCK mapping

`PRE_EFFECT_BLOCK` also uses `NOT_PERFORMED`, but its own failure reason may
already truthfully establish an unexpected child before any create attempt.

Require:

```text
failure_phase=TARGET
and failure_reason=UNEXPECTED_CHILD
and the inherited required actual observation for that reason is valid
  => unexpected_effect_status=OBSERVED
```

For every other valid PRE_EFFECT_BLOCK tuple:

```text
unexpected_effect_status=UNVERIFIED
```

`NONE_OBSERVED` is forbidden for PRE_EFFECT_BLOCK because no complete final
hierarchy enumeration was performed.

This mapping does not turn `TARGET_PRESENT` for an expected target into an
unexpected effect.

### 3.8 ASSESSMENT_ABORTED mapping

Keep the already reviewed SER-B05 mapping exactly:

```text
unexpected_count_observation.state=COMPLETE
and count > 0
  => unexpected_effect_status=OBSERVED

unexpected_count_observation.state=PREFIX_ONLY
and count > 0
  => unexpected_effect_status=OBSERVED

unexpected_count_observation.state=COMPLETE
and count == 0
  => unexpected_effect_status=NONE_OBSERVED

unexpected_count_observation.state=PREFIX_ONLY
and count == 0
  => unexpected_effect_status=UNVERIFIED

unexpected_count_observation.state=NOT_ESTABLISHED
  => unexpected_effect_status=UNVERIFIED
```

No count is invented. PREFIX_ONLY zero does not prove zero for the unseen
remainder.

### 3.9 Exhaustive outcome/hierarchy table

The effective mapping is therefore:

| Outcome/final hierarchy | unexpected_effect_status |
|---|---|
| SUCCESS / VERIFIED | NONE_OBSERVED |
| FAILURE / MISMATCH, unexpected count > 0 | OBSERVED |
| FAILURE / MISMATCH, unexpected count = 0 | NONE_OBSERVED |
| FAILURE / UNVERIFIED, positive unexpected observation retained | OBSERVED |
| FAILURE / UNVERIFIED, none positively retained | UNVERIFIED |
| FAILURE / NOT_PERFORMED | UNVERIFIED |
| PRE_EFFECT_BLOCK / NOT_PERFORMED with TARGET+UNEXPECTED_CHILD | OBSERVED |
| other PRE_EFFECT_BLOCK / NOT_PERFORMED | UNVERIFIED |
| FAILURE / ASSESSMENT_ABORTED | exact SER-B05 count-state mapping |

Any pairing not produced by this table is rejected.

This table does not alter the separate compatibility constraints governing
which hierarchy status can accompany each outcome phase/reason.

## 4. Interaction with existing precedence and evidence

### 4.1 MISMATCH coherence

The P inventory defined in section 1 supplies actual D1--D4 created-parent
entries for the already reviewed P-versus-T conflict witness.

The separately reviewed VERIFIED-side R-versus-T witness remains unchanged.
Files F1--F4 are not inserted into P.

### 4.2 Evidence-limit and conflict terminals

`ASSESSMENT_ABORTED` remains governed by its existing precedence and count
evidence.

This addendum does not raise the 64-path cap, change COMPLETE/PREFIX_ONLY,
alter the two final-closure failure rows, or add a sixth hierarchy variant.

### 4.3 Unexpected observations under uncertainty

An UNVERIFIED record may retain a positive unexpected-object observation and
therefore report `OBSERVED`; it still cannot claim a complete unexpected-
child list or total count unless another reviewed type expressly provides
one.

A missing observation is never an absence proof. Conversely, an actual
positive observation is not erased merely because another read failed.

### 4.4 No new authority

These are serialization and compatibility rules only.

They create no additional enumeration call, read call, write, retry, close,
spill file, persistent diagnostic, parser authority, or Pack A effect.

## 5. Deterministic merge/use-site map

| Location | Required disposition |
|---|---|
| HierarchyMismatchReadback.observed_parent_chain | DEFINE by section 1 as existing prefix plus D1--D4 topological parent suffix. |
| Existing-prefix labels | ANCESTOR only, in exact E order. |
| Created-parent suffix labels | D1,D2,D3,D4 exactly; never files. |
| Created-parent edges | Validate explicit D1→evidence parent, D2→D1, D3→D2, D4→D2 map; do not infer D3→D4 adjacency. |
| SER-B05 P/T coherence | Apply to actual D1--D4 P/T repetitions after each list is individually valid. |
| mismatch_witnesses ordering | REPLACE ambiguous prose with sections 2.2--2.6 total sort rule. |
| Existing witness variants | KEEP exact markers/key sets/evidence semantics. |
| unexpected_effect_status | APPLY exhaustive section 3 mapping. |
| SER-B05 ASSESSMENT_ABORTED mapping | KEEP byte-for-meaning; section 3.8 restates it without change. |
| VERIFIED hierarchy mapping | KEEP current V1_2 direct-readback/target-wrapper rules. |
| Expected-chain digest | KEEP; created parents do not enter E. |
| R1 policy, F1--F4, Pack A scope | KEEP unchanged. |

A merged successor must not retain the older ambiguous MISMATCH-chain or
witness-sort prose as a second normative alternative.

## 6. Bounded review cases proposed

The targeted independent rereview should cover at minimum:

### Parent inventory

1. Exact existing prefix + D1,D2,D3,D4 suffix: accept subject to all other
   evidence checks.
2. D4 immediately after D3 but implementation infers D3 parent: reject that
   edge interpretation; required parent remains D2.
3. Missing D3, swapped D3/D4, duplicate D2, added F1 in P: reject.
4. D2 P/T same path but different full readback: conflict terminal, not
   coherent MISMATCH/VERIFIED.
5. Existing-prefix required read unavailable: UNVERIFIED, not a partial P.

### Witness order

6. Multiple reasons on one D2 subject: order by fixed reason rank.
7. Evidence-parent preservation witness versus D1 witness: existing-prefix
   evidence-parent subject sorts first.
8. F4 content witness versus unexpected child: plan subject sorts before
   unexpected path class.
9. Two unexpected children: sort by decoded-path UTF-8 bytes.
10. Duplicate subject/reason sort key: reject.
11. Preservation witness on path outside nine nominal subjects: reject.

### unexpected_effect_status

12. MISMATCH count 0 => NONE_OBSERVED.
13. MISMATCH count 1 => OBSERVED.
14. UNVERIFIED with one positively observed unexpected path => OBSERVED.
15. UNVERIFIED with no positive unexpected observation => UNVERIFIED, never
    NONE_OBSERVED.
16. NOT_PERFORMED post-effect failure => UNVERIFIED.
17. PRE_EFFECT TARGET+UNEXPECTED_CHILD with real inherited observation =>
    OBSERVED.
18. PRE_EFFECT TARGET_PRESENT => UNVERIFIED.
19. ASSESSMENT_ABORTED COMPLETE 65 => OBSERVED.
20. ASSESSMENT_ABORTED PREFIX_ONLY 0 => UNVERIFIED.
21. SUCCESS+VERIFIED+OBSERVED => reject.

These are proposed rereview cases, not claims that they were executed.

## 7. Delivery boundary

No repository document postimage, protocol diff, runtime observation,
operator authorization, policy pin, Pack A source write, or outcome record is
created by this proposal.

The required next action is targeted independent rereview of the three new
serialization rules.

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
POLICY_PIN_MATERIALIZED=NO
R1_ISSUANCE_GATE=BLOCKED
AUTHORIZED_TREE=NO
<!-- END M12 -->

### M13 — transfer G: VIONA_LOCAL_EXACT_CREATE_NOT_PERFORMED_OBSERVATION_BINDING_DELTA_V1_1.md

<!-- BEGIN M13; raw_utf8_length=16124; raw_sha256=3f29ebcc97f215900772659646dac0fa6092b4409d8af9578ea7f53f52d91217 -->
# VIONA local exact-create: NOT_PERFORMED observation binding and pre-effect unexpected-child proof

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_NOT_PERFORMED_OBSERVATION_BINDING_DELTA_V1_1
STATUS=TECHNICAL_CORRECTION_PENDING_INDEPENDENT_REREVIEW
SCOPE=NOT_PERFORMED_LOCAL_OBJECT_WRAPPER_PATHS_AND_PRE_EFFECT_UNEXPECTED_SCOPE
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Revision, provenance, and bounded correction

This V1_1 transfer REPLACES:

VIONA_LOCAL_EXACT_CREATE_NOT_PERFORMED_OBSERVATION_BINDING_DELTA_V1.md

Predecessor raw identity:
- bytes: 16797
- SHA-256:
  44e386c92afae0b8558ebf8e327f7ca40d2bf5a9453672c74b66af5381679009

Do not apply V1 and V1_1 cumulatively.

The supplied targeted review found three defects in V1:

1. `REPARSE` was incorrectly named as a `LocalObjectReadback V1` variant.
   `REPARSE` belongs to `HierarchyObservedObject V1`; the two unions are not
   interchangeable.
2. V1 extracted paths from top-level fields of tagged
   `LocalObjectReadback V1` values. For the admitted path-bearing variants,
   the path-bearing readback is under `x.evidence`.
3. V1 referenced an unspecified inherited pre-effect `UNEXPECTED_CHILD`
   scope/path predicate. The effective reviewed source chain supplies no
   exact pre-effect child-enumeration scope for that tuple.

This revision corrects only those three points. It preserves the V1 rule
that a path-associated UNAVAILABLE error is uncertainty, never presence,
and preserves the requirement that retained proof must come from the exact
containing observation array and trusted evaluation provenance.

This revision is a NEW technical proposal. It is not recovered V1--V1.6
text, an independent GREEN verdict, an adopted successor contract, a
repository postimage, or execution authority.

Apply it after the effective local-create V1--V1.6 source and the reviewed
A--F transfer chain, with F:

VIONA_LOCAL_EXACT_CREATE_MISMATCH_STATUS_SERIALIZATION_DELTA_V1.md
raw bytes: 22314
raw SHA-256:
53b142afe7e9577a95745887bccd2a9277861218f15eddd52fdf1aff0f67c6d3

The earlier targeted GREEN dispositions are not reopened except where this
revision expressly supersedes delta F section 3.7's under-bound
PRE_EFFECT_BLOCK / TARGET / UNEXPECTED_CHILD status row.

No new filesystem read, directory enumeration, create effect, retry, close,
spill file, persistent evidence path, Git operation, or authority is granted.

## 1. Exact tagged LocalObjectReadback V1 use in HierarchyNotPerformed

### 1.1 Containing record and cardinality

Keep the inherited `HierarchyNotPerformed V1` marker, exact key set,
`status=NOT_PERFORMED`, and observations cardinality `0..16`.

Its local-profile observation element domain is:

```text
NotPerformedObservation V1 =
    PathBearingLocalObjectReadback V1
  | PathAssociatedUnavailableObservation V1
```

`PathBearingLocalObjectReadback V1` is a non-serialized subset name.
`PathAssociatedUnavailableObservation V1` is the one new closed wrapper
defined in section 1.4.

A bare pathless UNAVAILABLE `LocalObjectReadback V1` value is not accepted
directly in `HierarchyNotPerformed.observations`.

### 1.2 Exact admitted LocalObjectReadback V1 variants

The admitted direct tagged values are exactly:

```text
PRESENT_DIRECTORY
PRESENT_FILE
PRESENT_UNVERIFIED
ABSENT
```

No `REPARSE` member exists in this imported union for this use site.
Do not accept a `HierarchyObservedObject V1` REPARSE record as a
`LocalObjectReadback V1` merely because both describe filesystem state.

The imported tagged wrapper shape is used as-is:

```text
PRESENT_DIRECTORY:
  x.kind = "PRESENT_DIRECTORY"
  x.evidence = PresentDirectoryReadback V1

PRESENT_FILE:
  x.kind = "PRESENT_FILE"
  x.evidence = PresentFileReadback V1

PRESENT_UNVERIFIED:
  x.kind = "PRESENT_UNVERIFIED"
  x.evidence = PresentUnverifiedObjectReadback V1

ABSENT:
  x.kind = "ABSENT"
  x.evidence = AbsentObjectReadback V1

UNAVAILABLE:
  x.kind = "UNAVAILABLE"
  x.error = OsErrorEvidence V1
```

The exact imported marker/key rules of those values remain unchanged.
This section fixes field paths; it does not add top-level aliases such as
`x.object` or `x.exact_path`.

### 1.3 Exact path extractor

Define the non-serialized function:

```text
NOT_PERFORMED_OBSERVATION_PATH(x)
```

for the admitted direct variants:

```text
PRESENT_DIRECTORY:
  x.evidence.object.exact_path

PRESENT_FILE:
  x.evidence.object.exact_path

PRESENT_UNVERIFIED:
  x.evidence.exact_path

ABSENT:
  x.evidence.exact_path
```

No top-level fallback is permitted.

The extractor does not normalize, trim, case-fold, resolve aliases, or
rewrite paths. The returned value must already satisfy the inherited PATH
requirements of the imported evidence type.

If an implementation presents a tagged value with a different field
location, reject it under this profile. Do not copy the path into an
undeclared top-level field to make the extractor succeed.

### 1.4 PathAssociatedUnavailableObservation V1

The imported UNAVAILABLE tagged value is pathless:

```text
{
  kind: "UNAVAILABLE",
  error: OsErrorEvidence V1
}
```

Preserve an actual unavailable attempted read inside
`HierarchyNotPerformed.observations` only through:

```text
PathAssociatedUnavailableObservation V1

schema =
  "VIONA_CODEX_PATH_ASSOCIATED_UNAVAILABLE_OBSERVATION_V1"

exact keys = {
  schema,
  exact_path,
  readback
}

exact_path:
  PATH

readback:
  exact imported LocalObjectReadback V1 UNAVAILABLE tagged value
```

The nested UNAVAILABLE object remains unchanged. In particular:
- do not add a path to its imported key set;
- do not add a path to `OsErrorEvidence V1`;
- do not change or reinterpret the OS error;
- do not claim the error itself returned the associated path.

For the wrapper:

```text
NOT_PERFORMED_OBSERVATION_PATH(x) = x.exact_path
```

The association is valid only if the trusted evaluation context
independently binds this exact retained UNAVAILABLE value to an attempted
read of this exact path.

A caller-provided `(path,error)` pair does not establish that binding.
The wrapper proves neither presence nor absence.

### 1.5 Unique exact-path rule

For every `o` in `HierarchyNotPerformed.observations`, require the path
extractor to be defined exactly once.

For all indices i != j:

```text
NOT_PERFORMED_OBSERVATION_PATH(observations[i])
  !=
NOT_PERFORMED_OBSERVATION_PATH(observations[j])
```

Comparison is exact decoded PATH equality under the existing PATH rules.
No file-ID equality, timestamp, locale collation, or filesystem enumeration
order replaces this comparison.

Reject:
- a bare UNAVAILABLE direct element;
- an element with no defined extractor;
- a top-level path alias not in the imported type;
- two observations for the same exact path.

Do not repair duplicates by keeping only the later read.

### 1.6 Variant-specific truth semantics

For predicates that require positive object presence:

```text
PRESENT_DIRECTORY:
  require x.evidence.exists == true

PRESENT_FILE:
  require x.evidence.exists == true

PRESENT_UNVERIFIED:
  require x.evidence.exists == true under its existing failure-only semantics

ABSENT:
  not positive presence

PathAssociatedUnavailableObservation:
  not positive presence
```

`PRESENT_UNVERIFIED` remains failure/ambiguous evidence and never becomes
success proof merely because `exists=true`.

There is no REPARSE case in this `LocalObjectReadback V1` subset.

## 2. Pre-effect UNEXPECTED_CHILD: no invented observation scope

### 2.1 Source gap disposition

The effective source chain contains the proposed delta F mapping:

```text
PRE_EFFECT_BLOCK
failure_phase = TARGET
failure_reason = UNEXPECTED_CHILD
  => unexpected_effect_status = OBSERVED
```

but does not define an exact pre-effect child-enumeration scope/path
predicate that would distinguish:
- an expected target;
- an unrelated sibling under a shared existing parent;
- an in-scope unexpected child;
- an arbitrary caller-selected path.

The local Pack A parent graph and final-hierarchy enumeration rules do not,
by themselves, authorize or define a pre-effect child enumeration.

Therefore this revision does NOT invent a non-empty pre-effect child scope,
does NOT infer one from final-hierarchy rules, and does NOT treat retained
positive presence at an arbitrary non-plan path as an unexpected child.

### 2.2 Exact local-profile scope

Define the local successor's currently enabled pre-effect unexpected-child
assessment scope as:

```text
PRE_EFFECT_UNEXPECTED_CHILD_SCOPE_V1 = EMPTY_SET
```

This is a non-serialized compatibility constant, not an observation result.

Meaning:

```text
There is no reviewed pre-effect child-enumeration domain in this profile
from which an UNEXPECTED_CHILD reason can currently be established.
```

This does NOT mean there are no unexpected filesystem objects.
It means the current contract has no exact pre-effect evidence procedure
that may truthfully classify one as `UNEXPECTED_CHILD`.

The empty scope does not authorize a new read or enumeration in order to
make it non-empty.

### 2.3 Consequence for retained observations

A `HierarchyNotPerformed.observations` member may still retain an actual
path-bearing positive, absent, or unavailable target/precondition
observation under its own imported semantics.

However, with:

```text
PRE_EFFECT_UNEXPECTED_CHILD_SCOPE_V1 = EMPTY_SET
```

no observation satisfies:

```text
IS_PRE_EFFECT_UNEXPECTED_CHILD_PROOF(o)
```

because there is no enabled scope membership predicate.

Formally:

```text
PRE_EFFECT_UNEXPECTED_CHILD_PROOF_SET(N) = []
```

for every valid `HierarchyNotPerformed V1` value N in this profile.

This empty result is a contract restriction, not a claim that the observer
searched the filesystem and found zero children.

### 2.4 Exact finite compatibility correction

Supersede only delta F section 3.7's under-bound local-profile row.

The tuple:

```text
result_kind = PRE_EFFECT_BLOCK
failure_phase = TARGET
failure_reason = UNEXPECTED_CHILD
```

is not a valid finite outcome tuple for
`VIONA_BME_PACK_A_SOURCE_CREATE_V1` under this successor version.

Reject it rather than:
- inferring proof from phase/reason strings;
- treating a positive arbitrary path as an unexpected child;
- borrowing the final-hierarchy scope;
- treating TARGET_PRESENT as UNEXPECTED_CHILD;
- issuing another enumeration;
- fabricating a proof object.

The failure-reason token may remain defined in an imported broader grammar;
this local profile does not enable that tuple until a future separately
reviewed successor defines a non-empty pre-effect child-assessment scope,
its observation procedure, retained evidence binding, and compatibility
row.

### 2.5 unexpected_effect_status after this correction

For every remaining valid PRE_EFFECT_BLOCK tuple in this local profile:

```text
unexpected_effect_status = UNVERIFIED
```

`NONE_OBSERVED` remains forbidden because no complete final hierarchy
enumeration occurred.

The former delta F row:

```text
PRE_EFFECT_BLOCK / NOT_PERFORMED with TARGET+UNEXPECTED_CHILD
  -> OBSERVED
```

is superseded for this profile by section 2.4 and must not remain as a
simultaneously normative alternative.

This revision does not modify:
- SUCCESS / VERIFIED -> NONE_OBSERVED;
- MISMATCH count-based mapping;
- UNVERIFIED positive-observation mapping;
- post-effect NOT_PERFORMED mapping;
- ASSESSMENT_ABORTED count-state mapping.

## 3. Why positive retained presence is not enough pre-effect

A positive `PRESENT_DIRECTORY`, `PRESENT_FILE`, or
`PRESENT_UNVERIFIED` in `HierarchyNotPerformed.observations` can truthfully
say that an object was observed at the path extracted from `x.evidence`.

That alone does not establish the semantic predicate:

```text
UNEXPECTED_CHILD_FOR_THIS_PLAN_AND_ASSESSMENT_SCOPE
```

Without a reviewed non-empty scope, the same positive path could be:
- an expected D1--F4 target;
- an unrelated existing sibling under a shared evidence parent;
- a path outside the intended assessment;
- a caller-selected path not authorized for enumeration.

Therefore:
- exact JSON membership remains necessary for retained evidence claims;
- trusted observation provenance remains necessary;
- neither condition is sufficient to create an `UNEXPECTED_CHILD`
  classification while the scope is empty.

This is fail-closed serialization, not evidence deletion.

## 4. Deterministic merge/use-site map

| Location | Required disposition |
|---|---|
| `HierarchyNotPerformed V1` marker/key set | KEEP unchanged. |
| `HierarchyNotPerformed.observations` cardinality | KEEP `0..16`. |
| Direct `LocalObjectReadback V1` members | Admit exactly PRESENT_DIRECTORY, PRESENT_FILE, PRESENT_UNVERIFIED, ABSENT. |
| `REPARSE` | REMOVE from this subset; it is not a `LocalObjectReadback V1` member. |
| PRESENT_DIRECTORY path | `x.evidence.object.exact_path`. |
| PRESENT_FILE path | `x.evidence.object.exact_path`. |
| PRESENT_UNVERIFIED path | `x.evidence.exact_path`. |
| ABSENT path | `x.evidence.exact_path`. |
| Bare UNAVAILABLE | REJECT as direct observation because pathless. |
| Retained unavailable read | Use `PathAssociatedUnavailableObservation V1`; never positive presence. |
| Path uniqueness | Apply exact extractor to every admitted element. |
| Pre-effect unexpected-child scope | `EMPTY_SET` for this local successor/profile. |
| PRE_EFFECT TARGET+UNEXPECTED_CHILD tuple | REJECT as not enabled in the local finite compatibility table. |
| Other valid PRE_EFFECT_BLOCK status | `unexpected_effect_status=UNVERIFIED`. |
| Delta F other status mappings | KEEP unchanged. |
| R1 policy, D1--F4, F1--F4 bytes, release rules | KEEP unchanged. |

## 5. Targeted rereview cases

The independent rereview should cover at minimum:

### LocalObjectReadback wrapper correction

1. PRESENT_DIRECTORY:
   path is `x.evidence.object.exact_path`; top-level `x.object` is rejected.
2. PRESENT_FILE:
   path is `x.evidence.object.exact_path`; top-level `x.object` is rejected.
3. PRESENT_UNVERIFIED:
   path is `x.evidence.exact_path`; top-level `x.exact_path` is rejected.
4. ABSENT:
   path is `x.evidence.exact_path`; top-level `x.exact_path` is rejected.
5. REPARSE submitted as LocalObjectReadback:
   reject.
6. Bare UNAVAILABLE `{kind,error}`:
   reject as direct NOT_PERFORMED array element.
7. Correct PathAssociatedUnavailable wrapper:
   path extraction succeeds; positive-presence predicate remains false.
8. Wrapper path bound to an error from another attempted path:
   reject provenance binding.
9. Two admitted observations with same extracted path:
   reject.
10. PRESENT_FILE with `evidence.exists=true`:
    positive presence only under its imported evidence semantics.

### Pre-effect scope correction

11. Positive observed expected D1 target:
    cannot be UNEXPECTED_CHILD; existing expected-target handling applies.
12. Positive unrelated sibling under shared evidence parent:
    cannot be classified UNEXPECTED_CHILD merely from presence.
13. Arbitrary positive non-plan path:
    cannot be classified UNEXPECTED_CHILD.
14. Empty observations:
    cannot produce UNEXPECTED_CHILD.
15. Only associated UNAVAILABLE:
    cannot produce UNEXPECTED_CHILD.
16. PRE_EFFECT_BLOCK/TARGET/UNEXPECTED_CHILD submitted:
    reject as disabled local-profile tuple.
17. Other valid PRE_EFFECT_BLOCK:
    unexpected_effect_status must be UNVERIFIED.
18. No new enumeration/read is performed to make the empty scope non-empty.

These are proposed specification-review cases, not claims of execution.

## 6. Delivery and authority boundary

No repository-document postimage, protocol diff, filesystem mutation,
Git/GitHub mutation, F3 execution, validator run, provisioning, policy pin,
approval request, issuance, or candidate effect is produced by this
correction.

Required next action:

TARGETED_INDEPENDENT_REREVIEW_OF_LOCAL_OBJECT_WRAPPER_PATHS_AND_PRE_EFFECT_SCOPE

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_BYTES_CONSTRUCTED_IN_MEMORY=NO
DOCS_ONLY_AMENDMENT_BYTES_READY_FOR_INDEPENDENT_REVIEW=NO
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
POLICY_PIN_MATERIALIZED=NO
R1_ISSUANCE_GATE=BLOCKED
AUTHORIZED_TREE=NO
<!-- END M13 -->

### M14 — transfer H: VIONA_LOCAL_EXACT_CREATE_PRESENT_UNVERIFIED_FAILURE_CLASSIFICATION_TYPE_DELTA_V1.md

<!-- BEGIN M14; raw_utf8_length=10704; raw_sha256=3d6cd044434d35bd773703d9a498380e70b40a7c5c064d4577cbe29be05bc007 -->
# VIONA local exact-create: PresentUnverifiedObjectReadback failure-classification type closure

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_PRESENT_UNVERIFIED_FAILURE_CLASSIFICATION_TYPE_DELTA_V1
STATUS=NEW_TECHNICAL_PROPOSAL_PENDING_INDEPENDENT_REVIEW
SCOPE=PRESENT_UNVERIFIED_FAILURE_CLASSIFICATION_TYPE_ONLY
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Provenance and exact gap

The latest bounded two-document consolidation audit reported one unresolved
normative type reference:

```text
PresentUnverifiedObjectReadback V1
  schema = "VIONA_BME_PRESENT_UNVERIFIED_OBJECT_READBACK_V1"
  ...
  failure_classification: TEXT
```

The effective primitive catalog available to this lane defines `TEXT(n)` but
does not define a bare `TEXT` primitive. Therefore the accepted lexical domain
and maximum length of this field are not closed by the current source chain.

This addendum closes ONLY that field for the local successor/profile:

```text
ENVELOPE_CONTRACT.schema =
  "VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"

profile_id =
  "VIONA_BME_PACK_A_SOURCE_CREATE_V1"
```

This is a NEW technical choice for independent review. It is not recovered
V1--V1.6 text, not proof that bare `TEXT` historically meant 256 characters,
not a global repair of every bare-TEXT occurrence in BME material, and not
execution or documentation-write authority.

The immediately preceding effective transfer set remains A through G.

Do not reopen their targeted GREEN dispositions merely because this field
was previously under-typed.

## 1. Source-supported starting points

### 1.1 Primitive catalog

The imported primitive catalog defines:

```text
TEXT(n) :=
  NFC Unicode string of 1..n Unicode scalar values
```

No bare `TEXT` definition is supplied by that primitive catalog.

NFC remains an input-validation rule, not permission to normalize supplied
text before validation, comparison, or canonicalization.

### 1.2 Under-typed readback field

The imported readback shape is retained:

```text
PresentUnverifiedObjectReadback V1

schema =
  "VIONA_BME_PRESENT_UNVERIFIED_OBJECT_READBACK_V1"

exact keys = {
  schema,
  exact_path,
  exists,
  object_kind,
  failure_classification,
  read_at_utc
}

exact_path:
  PATH

exists:
  literal(true)

object_kind:
  enum("DIRECTORY","FILE")

failure_classification:
  previously bare TEXT

read_at_utc:
  UTC

forbidden = {
  byte_length,
  sha256,
  content_sha256
}
```

Its existing semantic restriction remains:

```text
partial/ambiguous failure only;
never success proof
```

### 1.3 Same-field historical precedent is not authority

An earlier BME failure-result definition used:

```text
failure_classification: TEXT(256)
```

That is evidence that 256 has prior use for the same field name, but it does
not by itself define the field in `PresentUnverifiedObjectReadback V1`.

This addendum therefore treats 256 as an explicit NEW bounded local-profile
choice requiring independent review.

## 2. Exact proposed field binding

For this local successor/profile, require:

```text
PresentUnverifiedObjectReadback V1.failure_classification:
  TEXT(256)
```

No global bare-`TEXT` alias is introduced.

Equivalently, after strict JSON decoding:

```text
JSON type:
  string

Unicode:
  valid Unicode scalar sequence

NFC:
  input MUST already be NFC;
  reject rather than normalize

decoded scalar length:
  1..256 inclusive
```

The field is opaque diagnostic classification text.

This proposal defines NO finite classification vocabulary and NO semantic
mapping from its string value to:
- failure_reason;
- terminal_classification;
- result_kind;
- hierarchy status;
- retry behavior;
- authority;
- OS error code;
- filesystem state.

Any `TEXT(256)` value is lexically acceptable at this field if all enclosing
record and provenance requirements also pass.

A syntactically accepted classification string is not evidence that the
object is absent, present-normal, reparse, secure, preserved, or successful.

## 3. Exact local-profile readback definition after binding

Within the local successor/profile, the effective imported readback is:

```text
PresentUnverifiedObjectReadback V1

schema =
  "VIONA_BME_PRESENT_UNVERIFIED_OBJECT_READBACK_V1"

exact keys = {
  schema,
  exact_path,
  exists,
  object_kind,
  failure_classification,
  read_at_utc
}

exact field types = {
  schema:
    literal("VIONA_BME_PRESENT_UNVERIFIED_OBJECT_READBACK_V1"),

  exact_path:
    PATH,

  exists:
    literal(true),

  object_kind:
    enum("DIRECTORY","FILE"),

  failure_classification:
    TEXT(256),

  read_at_utc:
    UTC
}

forbidden = {
  byte_length,
  sha256,
  content_sha256
}
```

All other imported rules for this type remain unchanged.

The schema marker is retained. This is a profile-scoped field-type
specialization for the proposed successor; it does not claim that every
historical record with this marker already had this 256-scalar rule.

## 4. Exact use-site bindings

### 4.1 LocalObjectReadback V1 PRESENT_UNVERIFIED

Where the local tagged wrapper uses:

```text
kind = "PRESENT_UNVERIFIED"
evidence = PresentUnverifiedObjectReadback V1
```

the entire `evidence` object must satisfy section 3, including:

```text
evidence.failure_classification: TEXT(256)
```

Do not:
- accept bare TEXT by analogy;
- truncate a longer string;
- normalize a non-NFC string;
- convert another scalar type to string;
- remove the field;
- substitute an enum not defined here.

### 4.2 HierarchyNotPerformed observations

Delta G remains unchanged:

```text
PRESENT_UNVERIFIED path =
  x.evidence.exact_path
```

If a PRESENT_UNVERIFIED observation is admitted into
`HierarchyNotPerformed.observations`, its nested
`x.evidence.failure_classification` must satisfy TEXT(256).

This string does not participate in the exact-path extractor and cannot
repair a missing/duplicate path.

### 4.3 Positive-presence predicates

The previously reviewed presence rule remains unchanged:

```text
PRESENT_UNVERIFIED
  may count as positive presence only to the extent its imported
  exists=true failure-only semantics permit.
```

The content of `failure_classification` does not establish positive presence.
Presence derives from the exact readback variant and its `exists=true`
semantics, not from a classification string such as "PRESENT", "FOUND", or
any caller-selected word.

### 4.4 UNVERIFIED hierarchy use

Where an `UnverifiedHierarchyReadback V1` retains a PRESENT_UNVERIFIED local
observation, this same TEXT(256) requirement applies to the nested evidence.

The reviewed rule for `HAS_POSITIVE_UNEXPECTED_OBSERVATION(U)` remains
unchanged. `failure_classification` is not an alternate scope predicate,
unexpected-child proof, or completeness signal.

### 4.5 VERIFIED and MISMATCH boundaries

VERIFIED continues to reject PRESENT_UNVERIFIED at its success-only target
locations.

MISMATCH and other failure-side consumers retain their existing variant and
evidence requirements. This field binding does not allow PRESENT_UNVERIFIED
to substitute for PRESENT_NORMAL, ABSENT, REPARSE, or a required OS-error
record.

## 5. No global bare-TEXT repair

This proposal deliberately does NOT define:

```text
TEXT := TEXT(256)
```

or any other global bare-TEXT alias.

Reason:

other historical BME/source artifacts may contain bare `TEXT` fields with
different intended constraints. A local field correction must not silently
rewrite all of them.

If another bare-TEXT field becomes normative in the self-contained local V2
spec, it must already have an authoritative binding or receive its own
reviewed correction.

This addendum closes only:

```text
PresentUnverifiedObjectReadback V1.failure_classification
```

and its direct local-profile consumers.

## 6. Deterministic merge/use-site map

| Location | Required disposition |
|---|---|
| Primitive `TEXT(n)` | KEEP existing definition. |
| Global bare `TEXT` | DO NOT DEFINE by this addendum. |
| PresentUnverifiedObjectReadback marker/key set | KEEP unchanged. |
| `failure_classification` | REBIND for this profile from unresolved bare `TEXT` to `TEXT(256)`. |
| `exact_path`, `exists`, `object_kind`, `read_at_utc` | KEEP unchanged. |
| forbidden content fields | KEEP unchanged. |
| LocalObjectReadback PRESENT_UNVERIFIED | Require exact readback with `failure_classification:TEXT(256)`. |
| Delta G NOT_PERFORMED path extraction | KEEP `x.evidence.exact_path`; classification does not affect path. |
| UNVERIFIED positive-observation rule | KEEP; classification string is not presence or scope proof. |
| PRE_EFFECT unexpected-child scope | KEEP G's `EMPTY_SET`; no change. |
| VERIFIED | KEEP PRESENT_UNVERIFIED forbidden in success-only positions. |
| Authority/retry/read/write behavior | NO CHANGE. |

## 7. Bounded independent-review cases

The targeted reviewer should check at minimum:

1. Empty failure_classification string: reject under TEXT(256).
2. One Unicode scalar, NFC: lexically acceptable subject to enclosing rules.
3. Exactly 256 Unicode scalar values, NFC: lexically acceptable subject to enclosing rules.
4. 257 Unicode scalar values: reject; do not truncate.
5. Non-NFC input whose normalized result would fit: reject; do not normalize to rescue it.
6. JSON number, boolean, null, array, or object at this field: reject.
7. PRESENT_UNVERIFIED nested under LocalObjectReadback with valid TEXT(256):
   field typing passes; this alone does not make the observation success proof.
8. Classification string "PRESENT": does not itself prove presence.
9. Classification string "UNEXPECTED_CHILD": does not establish unexpected-child scope or reason.
10. PRESENT_UNVERIFIED under VERIFIED success-only target: still reject even if classification is valid.
11. G's PathAssociatedUnavailableObservation: unaffected; its imported UNAVAILABLE readback does not gain this field.
12. Another historical bare-TEXT field outside this exact readback: NOT repaired by this addendum.

These are proposed specification-review cases, not claims of runtime or
schema-validator execution.

## 8. Delivery and authority boundary

No repository document postimage, protocol diff, filesystem mutation,
Git/GitHub mutation, F3 execution, schema validator run, policy pin,
provisioning, approval request, issuance, or candidate effect is produced by
this proposal.

Required next action:

TARGETED_INDEPENDENT_REVIEW_OF_PRESENT_UNVERIFIED_FAILURE_CLASSIFICATION_TEXT256_BINDING

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_BYTES_CONSTRUCTED_IN_MEMORY=NO
DOCS_ONLY_AMENDMENT_BYTES_READY_FOR_INDEPENDENT_REVIEW=NO
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
POLICY_PIN_MATERIALIZED=NO
R1_ISSUANCE_GATE=BLOCKED
AUTHORIZED_TREE=NO
<!-- END M14 -->

### M15 — transfer I: VIONA_LOCAL_EXACT_CREATE_FINAL_SCOPE_AND_UNVERIFIED_BINDING_DELTA_V1.md

<!-- BEGIN M15; raw_utf8_length=19737; raw_sha256=84ddc6b0478466f8ffec6d85b067908c442c7c994f8b8b6a56b054ff6559c8ad -->
# VIONA local exact-create: final unexpected-child scope and UNVERIFIED unavailable-observation binding

PROPOSAL_ID=VIONA_LOCAL_EXACT_CREATE_FINAL_SCOPE_AND_UNVERIFIED_BINDING_DELTA_V1
STATUS=NEW_TECHNICAL_PROPOSAL_PENDING_INDEPENDENT_REVIEW
SCOPE=FINAL_UNEXPECTED_CHILD_ENUMERATION_SCOPE_AND_UNVERIFIED_UNAVAILABLE_BINDING_ONLY
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO

## 0. Provenance and exact consolidation gaps

The latest bounded A→H consolidation audit reported exactly two unresolved
normative rules:

1. the final-hierarchy `unexpected_children` / `unexpected_child_count`
   contract refers to an authorized final-hierarchy observation scope without
   fixing the exact directories, enumeration depth, expected immediate
   children, or unexpected-path membership rule;
2. `UnverifiedHierarchyReadback V1` retains `observations` and `errors`, but
   imported `LocalObjectReadback V1` UNAVAILABLE is pathless, and the
   PathAssociatedUnavailableObservation V1 introduced by G was scoped only
   to `HierarchyNotPerformed V1`.

This addendum closes ONLY those two gaps for:

```text
ENVELOPE_CONTRACT.schema =
  "VIONA_CODEX_ENVELOPE_V2_LOCAL_EXACT_CREATE"

profile_id =
  "VIONA_BME_PACK_A_SOURCE_CREATE_V1"
```

This is a NEW technical proposal. It is not recovered V1--V1.6 text, an
adopted contract, a full-schema/runtime proof, repository documentation
postimages, or authority to execute any read/write/effect.

Apply after the effective A→H transfer set. Do not reopen prior targeted
GREEN dispositions except where this addendum explicitly specializes the
final unexpected-child scope and the UNVERIFIED use of the already-reviewed
G wrapper.

No new filesystem mutation, retry, traversal into unexpected directories,
persistent evidence path, or authority is introduced.

## 1. Fixed Pack A graph used by the final scope

Let L be the exact plan being evaluated.

The reviewed local profile has these exact parent relationships:

```text
D1 -> existing evidence parent
D2 -> D1
D3 -> D2
D4 -> D2
F1 -> D2
F2 -> D2
F3 -> D3
F4 -> D4
```

D1--D4 are DIRECTORY effects.
F1--F4 are FILE effects.

All scope paths below are taken from the exact plan effects after plan
validation. No caller-selected path, basename, relative path, normalized
alias, or filesystem-discovered replacement may redefine the scope.

## 2. Exact final unexpected-child enumeration scope

### 2.1 Scope parent set

Define the non-serialized final enumeration parent set:

```text
FINAL_UNEXPECTED_ENUM_PARENTS_V1 = [D1,D2,D3,D4]
```

in that exact order.

The existing evidence parent is NOT a member of this unexpected-child
enumeration parent set.

Reason for the boundary:

- D1 is the controlled candidate root created under the existing evidence
  parent;
- the evidence parent may legitimately contain unrelated pre-existing or
  concurrently managed siblings outside this candidate tree;
- such siblings do not become unexpected effects of this Pack A candidate
  merely because they are children of the same pre-existing parent.

D1 itself remains an expected plan target and is independently observed by
the existing target/parent rules. Excluding the evidence parent from this
enumeration does not waive D1 identity, security, parent-edge, or preservation
checks.

### 2.2 Enumeration depth

For each parent in `FINAL_UNEXPECTED_ENUM_PARENTS_V1`, the final unexpected
enumeration covers exactly:

```text
depth = ONE_IMMEDIATE_CHILD_LEVEL
```

Meaning:

- enumerate the parent's immediate directory entries only;
- do not recurse through an expected child as part of that parent's listing;
- expected created directories D2--D4 are separately enumerated when they
  themselves appear in the fixed parent set;
- do not traverse into an unexpected directory;
- do not traverse through a reparse entry;
- do not enumerate file contents or descendants of a file.

This is a scope definition for the already-required final hierarchy
observation. It does not grant an extra enumeration pass, retry, recursive
walk, or new API choice.

### 2.3 Exact expected immediate-child sets

Define from the plan:

```text
EXPECTED_IMMEDIATE_CHILDREN(D1) = {
  D2.exact_path
}

EXPECTED_IMMEDIATE_CHILDREN(D2) = {
  D3.exact_path,
  D4.exact_path,
  F1.exact_path,
  F2.exact_path
}

EXPECTED_IMMEDIATE_CHILDREN(D3) = {
  F3.exact_path
}

EXPECTED_IMMEDIATE_CHILDREN(D4) = {
  F4.exact_path
}
```

Set notation above describes membership only. It does not replace any
existing serialization ordering rule.

The expected-child test is exact PATH equality after each plan path has
already passed the inherited PATH validation. Do not compare only basenames,
case-folded strings, file IDs, or normalized alternatives.

A returned entry whose exact path equals an expected child path is NOT an
`UNEXPECTED_CHILD` merely because its measured type/identity/security/content
is wrong. Such a wrong expected target remains subject to the existing
target mismatch, ABSENT/REPARSE, identity, content, security, coherence, or
UNVERIFIED rules.

### 2.4 Exact unexpected-path predicate

Let `entry_path` be the exact path of an actual immediate child returned by
the permitted final enumeration of one parent P in the fixed parent set.

Define:

```text
IS_FINAL_UNEXPECTED_CHILD(P, entry_path) =
  entry_path is an actual immediate child returned for P
  AND
  entry_path NOT IN EXPECTED_IMMEDIATE_CHILDREN(P)
```

The predicate is valid only when:
- P is the exact observed directory corresponding to the plan effect named
  by the fixed parent set;
- the entry was actually returned by the trusted final-hierarchy
  enumeration for that P;
- the entry path is within P at exactly one immediate-child level under the
  inherited PATH/parent relation;
- the entry is not synthesized from a caller string or inferred merely from
  a later error.

The predicate does not require traversal into the unexpected entry.

A directory, file, or reparse entry at an unexpected immediate-child path is
an unexpected child for membership/count purposes. The observer must not
follow a reparse or unexpected directory merely to learn descendants.

### 2.5 Complete final unexpected-child set

For a complete final enumeration, define:

```text
FINAL_UNEXPECTED_CHILD_SET =
  unique union of entry_path for all
  P in [D1,D2,D3,D4]
  where IS_FINAL_UNEXPECTED_CHILD(P, entry_path)
```

Path equality is exact decoded PATH equality.

For a complete MISMATCH:

```text
unexpected_children =
  FINAL_UNEXPECTED_CHILD_SET
  serialized under the already-reviewed ascending decoded-path UTF-8 order

unexpected_child_count =
  decimal U0 string equal to length(FINAL_UNEXPECTED_CHILD_SET)
```

The existing 0..64 complete-list cap and witness bijection remain unchanged.

For VERIFIED:

```text
FINAL_UNEXPECTED_CHILD_SET = empty set
unexpected_children = []
unexpected_child_count = "0"
```

No evidence-parent sibling is included in this set.

### 2.6 Completeness and uncertainty

A complete MISMATCH or VERIFIED result requires the required final
enumeration to complete for all four fixed parents, subject to the existing
limit/precedence rules.

If a required parent cannot be truthfully enumerated because of a genuine
OS/read uncertainty, do not treat its unseen remainder as empty and do not
emit a complete MISMATCH/VERIFIED count from the other parents alone.

Keep the inherited precedence:
- genuine required OS/read uncertainty -> UNVERIFIED;
- otherwise actual evidence-limit exhaustion -> ASSESSMENT_ABORTED /
  EVIDENCE_LIMIT_EXHAUSTED;
- otherwise established observation conflict -> ASSESSMENT_ABORTED /
  CROSS_OBSERVATION_CONFLICT;
- otherwise apply ordinary MISMATCH/VERIFIED rules.

Positive unexpected children already actually returned before an unrelated
enumeration failure remain retained observations. They may make the enclosing
`unexpected_effect_status=OBSERVED` under the reviewed UNVERIFIED mapping,
without claiming the enumeration was complete.

### 2.7 Limit behavior

The reviewed 64-path limit applies to the distinct union defined in section
2.5.

If the permitted enumeration actually establishes more than 64 distinct
unexpected immediate-child paths:
- do not truncate;
- do not recurse to discover descendants;
- do not change the parent set;
- retain the existing ASSESSMENT_ABORTED evidence-limit rules.

A PREFIX_ONLY count remains only a count of the actually established prefix
under the existing SER-B05 correction. It is not a complete union.

## 3. Reuse G's path-associated unavailable wrapper in UNVERIFIED

### 3.1 Explicit second use site

The already-reviewed G type:

```text
PathAssociatedUnavailableObservation V1

schema =
  "VIONA_CODEX_PATH_ASSOCIATED_UNAVAILABLE_OBSERVATION_V1"

exact keys = {
  schema,
  exact_path,
  readback
}

exact_path:
  PATH

readback:
  exact imported LocalObjectReadback V1 UNAVAILABLE tagged value
```

is explicitly reused as a permitted element of:

```text
UnverifiedHierarchyReadback V1.observations
```

for this local successor/profile.

This is a second use site of the SAME closed wrapper. No V2 marker, optional
field, alias, or new error shape is created.

The G semantics remain unchanged:
- nested UNAVAILABLE remains `{kind:"UNAVAILABLE", error:OsErrorEvidence V1}`;
- no path is added to the nested imported value or to OsErrorEvidence V1;
- exact_path records the exact path whose trusted attempted observation
  produced that unavailable result;
- the wrapper proves neither presence nor absence.

### 3.2 Effective UNVERIFIED observation element domain

For this use site define the non-serialized alias:

```text
UnverifiedObservation V1 =
    PathBearingLocalObjectReadback V1
  | PathAssociatedUnavailableObservation V1
```

where `PathBearingLocalObjectReadback V1` uses the reviewed G direct
LocalObjectReadback subset:

```text
PRESENT_DIRECTORY
PRESENT_FILE
PRESENT_UNVERIFIED
ABSENT
```

with exact path extraction:

```text
PRESENT_DIRECTORY:
  x.evidence.object.exact_path

PRESENT_FILE:
  x.evidence.object.exact_path

PRESENT_UNVERIFIED:
  x.evidence.exact_path

ABSENT:
  x.evidence.exact_path

PathAssociatedUnavailableObservation:
  x.exact_path
```

REPARSE is not silently imported into `LocalObjectReadback V1`.

H remains in force for the PRESENT_UNVERIFIED evidence:

```text
x.evidence.failure_classification: TEXT(256)
```

A bare pathless LocalObjectReadback UNAVAILABLE is rejected as a direct
UNVERIFIED observations element.

### 3.3 Allowed path association in final UNVERIFIED assessment

Every UNVERIFIED observation path must be an actual required or discovered
path of the same final-hierarchy assessment.

For this local profile, an associated path is valid only if it is one of:

```text
A. an exact path from E.ordered_objects;
B. one of the exact D1--F4 plan-target paths;
C. one of the exact D1--D4 final enumeration parent paths;
D. an exact immediate-child path actually returned by the section-2 final
   enumeration of D1--D4.
```

This list does not authorize observing every path in categories A--D by a
new operation; it constrains serialization of observations legitimately
obtained under the existing final-hierarchy evaluation.

An arbitrary sibling of the existing evidence parent is not valid merely
because it exists. A caller-selected descendant not actually returned by
the permitted final enumeration is not valid.

For a PathAssociatedUnavailableObservation, trusted evaluation provenance
must bind:
- the exact wrapper path;
- the exact nested UNAVAILABLE value;
- the actual attempted final-hierarchy observation that failed.

JSON equality alone is not provenance.

## 4. Exact errors-array consistency binding

### 4.1 Keep the imported errors field

Keep the existing `UnverifiedHierarchyReadback V1.errors` field, its
imported element type `OsErrorEvidence V1`, its existing cardinality, and
its existing outer ordering requirement, if any.

This addendum does not change OsErrorEvidence V1 or its reviewed finite API
vocabulary.

### 4.2 One exact projection from observations

Let U be the exact UnverifiedHierarchyReadback being validated.

Define the non-serialized projection:

```text
UNAVAILABLE_ERROR_PROJECTION(U) =
  [
    o.readback.error
    for o in U.observations in their serialized array order
    if o.schema ==
      "VIONA_CODEX_PATH_ASSOCIATED_UNAVAILABLE_OBSERVATION_V1"
  ]
```

Require:

```text
U.errors == UNAVAILABLE_ERROR_PROJECTION(U)
```

as exact decoded JSON array equality.

Consequences:

- every path-associated UNAVAILABLE observation contributes exactly one
  nested OsErrorEvidence to errors;
- every errors element must be the exact nested error of one serialized
  path-associated UNAVAILABLE observation at the corresponding projection
  position;
- no bare error without a path-associated unavailable observation is
  accepted;
- no unavailable observation may omit its error from errors;
- duplicate error JSON values at two different paths remain representable:
  multiplicity and projection order are preserved;
- an error is not matched to a path merely by equal API/code; it is nested
  in the exact wrapper whose trusted provenance binds the attempted path.

Do not deduplicate, sort, merge, or select a newer error to repair an
invalid record.

### 4.3 Genuine uncertainty requirement

At least one actual required observation must be unavailable for an
UNVERIFIED result under an unavailable-evidence route.

A path-associated wrapper is only valid when its nested OsErrorEvidence is
genuine under the reviewed API/code-kind/raw-proof rules.

A semantic validation failure, contradictory successful observation,
evidence-limit condition, or caller-chosen diagnostic string is not converted
into an OsErrorEvidence merely to populate `errors`.

If required uncertainty exists but cannot be truthfully represented under
the closed wrapper/error vocabulary and existing record limits, preserve
the existing raw-diagnostic/fail-closed behavior; do not fabricate a typed
UNVERIFIED record.

## 5. Interaction with unexpected-effect status

Keep F's reviewed principle, specialized to the exact final scope in section
2:

```text
HAS_POSITIVE_UNEXPECTED_OBSERVATION(U)
```

is true only for an actual positive presence observation whose exact path:
- was actually returned as an immediate child in the section-2 final
  enumeration; and
- satisfies `IS_FINAL_UNEXPECTED_CHILD(P,path)` for its actual parent P.

Merely being outside E.ordered_objects and D1--F4 is no longer sufficient by
itself; section-2 scope membership is also required.

Therefore:

```text
UNVERIFIED + at least one retained positive scoped unexpected child
  -> unexpected_effect_status = OBSERVED

UNVERIFIED + no retained positive scoped unexpected child
  -> unexpected_effect_status = UNVERIFIED
```

`NONE_OBSERVED` remains forbidden for UNVERIFIED.

An associated UNAVAILABLE wrapper never establishes a positive unexpected
child.

G's pre-effect rule remains separate and unchanged:

```text
PRE_EFFECT_UNEXPECTED_CHILD_SCOPE_V1 = EMPTY_SET
```

The final scope defined here must NOT be borrowed back into pre-effect
classification.

## 6. Deterministic merge/use-site map

| Location | Required disposition |
|---|---|
| Final unexpected enumeration parents | DEFINE exactly D1,D2,D3,D4. |
| Existing evidence parent | EXCLUDE from unexpected-child enumeration; its unrelated siblings do not count. |
| Enumeration depth | Exactly one immediate-child level per D1--D4 parent. |
| Expected children of D1 | D2 only. |
| Expected children of D2 | D3,D4,F1,F2. |
| Expected children of D3 | F3 only. |
| Expected children of D4 | F4 only. |
| Unexpected child | Actual returned immediate child whose exact path is not in that parent's expected set. |
| Wrong object at an expected path | NOT unexpected by path; route through existing target/mismatch/uncertainty rules. |
| Complete unexpected set | Unique union across D1--D4, existing reviewed sort/count/cap rules. |
| Evidence-parent siblings | Never included solely because they share the pre-existing parent with D1. |
| Unexpected directory/reparse | Count path if in scope; do not traverse it. |
| UnverifiedHierarchyReadback.observations | Explicitly admit G's PathAssociatedUnavailableObservation plus G's path-bearing LocalObjectReadback subset. |
| UNVERIFIED bare UNAVAILABLE | REJECT. |
| UNVERIFIED errors | Exact projection of nested wrapper errors from observations. |
| H TEXT(256) | KEEP for PRESENT_UNVERIFIED evidence. |
| F positive unexpected predicate | ADD exact final-scope membership requirement from section 5. |
| G pre-effect EMPTY_SET | KEEP unchanged; final scope is not a pre-effect scope. |
| Authority/read/write/retry | NO CHANGE. |

## 7. Targeted independent-review cases

The reviewer should check at minimum:

### Final scope

1. Existing evidence parent has unrelated sibling X beside D1:
   X is NOT counted.

2. D1 has only D2:
   no unexpected child at D1.

3. D1 has D2 plus X:
   X is one unexpected child.

4. D2 has D3,D4,F1,F2 only:
   no unexpected child at D2.

5. D2 has expected F1 path but wrong file hash/type:
   path is not unexpected; existing target mismatch rules apply.

6. D3 has F3 plus unexpected directory U:
   U is counted once; U is not traversed.

7. D4 has F4 plus unexpected reparse R:
   R path is counted once; reparse is not followed.

8. Unexpected descendant exists only beneath unexpected directory U:
   it is not separately discovered by this scope because U is not traversed.

9. Same exact unexpected path cannot be counted twice.

10. Required D3 enumeration unavailable after an unexpected child was already
    observed under D2:
    hierarchy remains UNVERIFIED; positive scoped unexpected observation is
    retained and unexpected_effect_status may be OBSERVED.

11. More than 64 distinct scoped unexpected paths:
    existing ASSESSMENT_ABORTED limit route; no truncation.

### UNVERIFIED unavailable binding

12. Bare `{kind:"UNAVAILABLE",error:E}` in U.observations:
    reject.

13. PathAssociatedUnavailable(path D3,error E) with trusted failed D3 attempt:
    valid uncertainty association subject to all other rules.

14. Same wrapper with E originating from another path/attempt:
    reject provenance.

15. U.errors omits E:
    reject.

16. U.errors contains extra error not nested in any wrapper:
    reject.

17. Two wrappers on different paths contain byte/value-identical errors:
    both remain represented; projection multiplicity is two.

18. PRESENT_FILE observation path uses x.evidence.object.exact_path.

19. PRESENT_UNVERIFIED uses x.evidence.exact_path and H TEXT(256).

20. Associated unavailable error at arbitrary path outside A--D allowed-path
    categories:
    reject.

21. Positive presence at arbitrary non-plan path not actually returned by
    final scoped enumeration:
    does NOT make unexpected_effect_status OBSERVED.

22. Final scoped unexpected child must not enable G's pre-effect
    TARGET+UNEXPECTED_CHILD tuple.

These are proposed specification-review cases, not claims of runtime or
schema-validator execution.

## 8. Delivery and authority boundary

No repository-document postimage, protocol diff, filesystem mutation,
Git/GitHub mutation, F3 execution, validator run, provisioning, policy pin,
approval request, issuance, or candidate effect is produced by this proposal.

Required next action:

TARGETED_INDEPENDENT_REVIEW_OF_FINAL_SCOPE_AND_UNVERIFIED_UNAVAILABLE_BINDING

R1_POLICY_STATUS=ADOPTED_IN_SOURCE_CONVERSATION
DOCS_ONLY_AMENDMENT_BYTES_CONSTRUCTED_IN_MEMORY=NO
DOCS_ONLY_AMENDMENT_BYTES_READY_FOR_INDEPENDENT_REVIEW=NO
DOCS_ONLY_AMENDMENT_AUTHORIZED=NO
PACK_A_IMPLEMENTATION_AUTHORIZED=NO
POLICY_PIN_MATERIALIZED=NO
R1_ISSUANCE_GATE=BLOCKED
AUTHORIZED_TREE=NO
<!-- END M15 -->

## 7. Authority boundary

This specification remains non-authorizing and unimplemented. It creates no Operator authorization, parser, executor, authority instance, policy pin, filesystem effect, Git effect, provider effect, network effect, retry right, remediation right, or candidate effect. Adoption of documentation would not by itself authorize Pack A. An effect requires the separately governed exact trusted Operator-message binding and every runtime proof required by the effective contract.