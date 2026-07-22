# VIONA FC-P0 — E2 Backup / Restore Risk Acceptance Proposal

**Status:** `PROPOSED` / `NOT GRANTED` / `NOT EFFECTIVE`

**Related remediation:** `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E1_BACKUP_RESTORE_EVIDENCE_REMEDIATION.md`

**Suggested future authorization phrase (NOT GRANTED):**

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E2_BACKUP_RESTORE_RISK_ACCEPTANCE`

This document does **not** authorize E2 migration apply.  
This document does **not** authorize restore.  
This document does **not** create or alter backups.

---

## 1. Why this proposal exists

Fresh read-only backup metadata for staging project `euqbfanilcssjiwwtcby` / `viona-staging-eu` could not be obtained during E1 backup/restore remediation (`supabase backups list` requires a Supabase management access token that was not available in the executor environment).

Historical Pack15C backup evidence (latest recorded physical backup `2026-06-18T02:04:53Z`) is **stale** relative to Pack40 schema evolution on staging and is **not** accepted as current FC-P0 recovery-point proof.

Therefore E2 remains blocked unless either:

1. Fresh current recovery-point metadata is later observed read-only; or  
2. An operator separately grants the exact risk-acceptance phrase above.

---

## 2. Explicit scope (if later granted)

| Bound | Value |
|---|---|
| Environment | **Staging only** |
| Fly app | `viona-api-staging-eu` / region `fra` |
| Database project | alias `viona-staging-eu`; ref `euqbfanilcssjiwwtcby` |
| Schema state | Current **pre-Pack-A1** staging state (Pack40DR1 applied; Pack A1 unapplied) |
| Proposed action covered | Contained risk that E2 `prisma migrate deploy` of Pack A1 proceeds without a freshly observed recovery point at grant time |
| Migration | Exact Pack A1 `20260722120000_add_local_provider_eligibility_authority` only |
| Production | **Out of scope** |
| Applicability | **One-time** for a single subsequent E2 authorization decision window |
| Expiration | Must be re-issued if staging schema/migration history changes before E2, or if more than **7 calendar days** elapse after grant without E2 execution |

---

## 3. Known absence / uncertainty

At proposal time:

- Latest **fresh** recovery-point timestamp: **UNRESOLVED**
- Backup type/status/retention/PITR window: **UNRESOLVED**
- Schema coverage of a current recovery point: **UNPROVEN**
- Historical June 18 backup: **insufficient** for current post-Pack40 pre-A1 state

Maximum plausible impact if a restore to an insufficient/old point were later required: loss or rewind of staging data and schema changes after that point (including Pack40 lineage). Production is excluded.

---

## 4. Operator accepting the risk (when granted)

Must be an explicit human operator grant of the exact phrase.  
Role expectation: staging DB / FC-P0 execution owner (historical restore authority alias: `Nong Si Buong`).

This proposal does **not** name tokens, emails, or credentials.

---

## 5. Containment and stop conditions

If later granted and E2 is separately authorized:

1. Apply **only** Pack A1 structure-only migration on staging.  
2. Stop immediately on migration failure / unexpected history.  
3. Do **not** auto-deploy API, register providers, activate, or create Local requests.  
4. Do **not** restore unless a **separate** restore authorization is granted.  
5. Prefer non-destructive migration containment over restore when safe.  
6. Re-verify `prisma migrate status` after apply (when separately authorized).

---

## 6. Grant status

| Field | Value |
|---|---|
| Proposed | Yes |
| Granted | **No** |
| Effective | **No** |
| Authorizes E2 | **No** |
| Authorizes restore | **No** |
| Authorizes backup create | **No** |
