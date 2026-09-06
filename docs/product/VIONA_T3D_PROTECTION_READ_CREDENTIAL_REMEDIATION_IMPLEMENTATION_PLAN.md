# VIONA T3D — Protection-read credential remediation

**Classification:** T3D implementation (this PR). App/secrets/protection transition are **not** performed here.

**Freeze:** `MANDATORY_MERGE_AUTHORIZATION_GUARDRAIL_FREEZE_ACTIVE` remains active.  
**Exception:** `FREEZE_EXCEPTION_FOR_MERGE_GUARDRAIL_REMEDIATION_ONLY`

**Fixed base / M1:** `74eaa9228ca42b4cf9d8cedf46f6631c5c30e24b`

---

## 1. Root cause

The Viona Merge Authorization Gate evaluates master branch protection with:

`GET /repos/laoton80-del/Ket-noi-eu/branches/master/protection`

That endpoint requires GitHub **Repository Administration: read**.

The workflow `GITHUB_TOKEN` is limited to:

- `contents: read`
- `pull-requests: read`
- `checks: write`

`administration` is not a `GITHUB_TOKEN` permission. The previous single-token REST client therefore could not read protection. HTTP 401/403 was swallowed and reported as:

`BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED`

That hid a credential failure as a missing-ruleset failure. T3C-B probe check `101471993320` on PR #453 concluded with that blocker.

## 2. Credential split

| Token | Env | Allowed operations |
|---|---|---|
| Checks / existing REST + GraphQL | `GITHUB_TOKEN` | Existing PR/read, contents/read, Actions run metadata/read, GraphQL review threads, Checks create/complete |
| Protection-read | `VIONA_GATE_PROTECTION_READ_TOKEN` | **Only** `GET /repos/laoton80-del/Ket-noi-eu/branches/master/protection` |

No fallback from the protection-read token to `GITHUB_TOKEN`.  
The checks REST route refuses the canonical protection GET.

## 3. Intended production credential

Dedicated **GitHub App** installation token.

- Repository permission: **Administration: read only**
- **Administration write: not granted**
- Repository-scoped installation: `laoton80-del/Ket-noi-eu`
- Minted at runtime with `actions/create-github-app-token@v2`
- Requested token permission: `permission-administration: read`

This PR does **not** create the GitHub App.  
This PR does **not** create repository secrets.  
This PR does **not** store installation tokens.

## 4. Secret and env names

| Kind | Name |
|---|---|
| Repository secret (App ID) | `VIONA_GATE_PROTECTION_READ_APP_ID` |
| Repository secret (App private key) | `VIONA_GATE_PROTECTION_READ_APP_PRIVATE_KEY` |
| Runtime env (minted installation token) | `VIONA_GATE_PROTECTION_READ_TOKEN` |

If App secrets are absent, minting is skipped and `VIONA_GATE_PROTECTION_READ_TOKEN` is empty. The job still reaches the gate script.

## 5. New blockers

| Condition | Blocker |
|---|---|
| Protection token absent/blank | `BLOCKED_MERGE_PROTECTION_READ_CREDENTIAL_MISSING` |
| Protection GET 401 or 403 | `BLOCKED_MERGE_PROTECTION_READ_UNAUTHORIZED` |
| HTTP 200 malformed/incomplete, or neither `enforce_admins.enabled === true` nor `required_status_checks != null` | `BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED` |

401/403 must not be translated into `BLOCKED_MERGE_REPOSITORY_RULESET_NOT_ENFORCED`.  
Authentication success must not imply enforcement.

The gate check is created after minimum provenance, then completed `failure` for these blockers.

## 6. Isolation invariants

The protection-read token must never be used for:

- Checks API
- commit statuses
- merge API
- protection write (`PUT`/`PATCH`/`DELETE`)
- workflow dispatch
- secrets
- deployments
- arbitrary REST

The gate remains incapable of merging (`mergeCalls` stays 0).  
Workflow `GITHUB_TOKEN` permissions are unchanged.  
`statuses: write` is not added.

## 7. PR #453 and post-M2 probe

#453 already has one `workflow_dispatch` and one gate check on head `faadffbcc077c600ea443f604b9054947fb62295`. It **cannot** be reused for a second dispatch or rerun.

After this remediation squash-merges to **M2**, a **new** docs-only probe PR based on M2 is required before Lock → Gate protection transition.

## 8. T3D M2 bootstrap sequence (not this PR)

1. Maty2016 APPROVES this exact T3D head.
2. Hygiene / existing required checks as applicable.
3. Separately authorized one-time `Viona Emergency Merge Lock` commit-status SUCCESS on this exact head.
4. One squash merge to master → M2.
5. Operator creates the GitHub App and repository secrets **outside git** (later envelope).
6. New probe PR from M2; Maty approval; one gate dispatch; identity GET; then Lock → Gate transition if authorized.
7. Close probes without merge. Freeze remains active.

This PR does not post the lock status, merge, change protection, or dispatch the gate.

## 9. Non-scope

No product/runtime/backend/DB/payment/provider/auth/SOS/Mobile change.  
`scripts/viona-guarded-pr-merge.mjs` is unchanged.  
#451 and #452 are untouched.  
#453 is not modified.
