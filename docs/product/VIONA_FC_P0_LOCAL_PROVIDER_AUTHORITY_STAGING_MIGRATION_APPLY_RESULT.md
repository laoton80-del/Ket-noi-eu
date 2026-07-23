# VIONA FC-P0 — Staging Migration Apply Result (E2)

**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY_RESULT_PR_REVIEW`

**Secondary decision:** `READY_FOR_E3_STAGING_API_DEPLOY_AUTHORIZATION_DECISION`

**Authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY`

**Mode:** Controlled staging-only database migration execution / stop-on-error / docs-evidence PR

**Canonical master (pre-execution):** `91b7aaf33384142ee2e7dc48c4681c6b649ec8a9`

**Branch:** `docs/viona-fc-p0-local-provider-authority-staging-migration-apply-result`

```text
E2_STAGING_MIGRATION_APPLY_EXECUTED
PACK_A1_STAGING_MIGRATION_APPLIED_AND_HISTORY_CLEAN
PACK_A1_STRUCTURE_APPLIED_WITH_ZERO_PROVIDER_AND_AUDIT_ROWS
READY_FOR_E3_STAGING_API_DEPLOY_AUTHORIZATION_DECISION
E3_STAGING_API_DEPLOY_NOT_AUTHORIZED
E4_THROUGH_E10_NOT_AUTHORIZED
NO_API_OR_CLIENT_DEPLOY
NO_PROVIDER_MUTATION
NO_BUSINESS_USER_MUTATION
NO_LIVE_QA_OR_LOCAL_REQUEST
NO_BACKUP_RESTORE
RISK_ACCEPTANCE_NOT_GRANTED_NOT_INVOKED
REQUEST_ONLY_NO_CHARGE
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
```

---

## 1. Purpose

Apply exactly the already-authored Pack A1 structure-only migration to the VIONA staging database after E1 post-merge verification established E2 readiness for an authorization decision.

This does **not** authorize or execute E3–E10.

---

## 2. Authorization / baseline

| Field | Value |
|---|---|
| Phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY` |
| Prior E1 classification | `VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_E1_OPERATOR_MEDIATED_BACKUP_METADATA_CAPTURE_RESULT_VERIFIED_ON_MASTER_WITH_E2_READY_FOR_AUTHORIZATION_DECISION_BUT_UNAUTHORIZED` |
| Canonical master | `91b7aaf33384142ee2e7dc48c4681c6b649ec8a9` (PR #427 squash tip) |
| Workspace | `C:\KNG\ket-noi-eu` / `master` clean / = `origin/master` at apply time |

---

## 3. Staging target

| Field | Value |
|---|---|
| Fly app | `viona-api-staging-eu` |
| Region | `fra` |
| Stage | `staging` (`VIONA_DEPLOYMENT_STAGE=staging`) |
| Supabase project | `viona-staging-eu` |
| Project ref | `euqbfanilcssjiwwtcby` |
| Datasource host class | `db.<staging-ref>.supabase.co` (credentials redacted) |

**Production exclusion (independent signals):**

1. Fly app name + `VIONA_DEPLOYMENT_STAGE=staging`
2. Staging project ref present in pooler username and direct host

No database URL, password, token, or private host was recorded in evidence.

---

## 4. Migration integrity

| Field | Value |
|---|---|
| Path | `prisma/migrations/20260722120000_add_local_provider_eligibility_authority/migration.sql` |
| Canonical Git/LF SHA256 | `3B028C852F594AC9B538FED90C2CEE1D494EC33091F260906020F1819FF23D69` |
| Bytes | **3471** |
| Git blob | `cb79e7a7181cf886740c97b596be172080859361` (matches PR #419) |
| SQL inventory | `CREATE TYPE` ×3; `CREATE TABLE` ×2; `CREATE UNIQUE INDEX` ×1; `CREATE INDEX` ×5; FK `ON DELETE RESTRICT` ×3 |
| Data writes | **None** (no INSERT/UPDATE/DELETE/TRUNCATE/seed/backfill/DROP) |

Working-tree CRLF checksum was **not** used as integrity proof.

---

## 5. Recovery-point gate (pre-apply)

| Field | Value |
|---|---|
| Evidence | PR #427 operator-mediated capture (verified on master) |
| Latest recovery point | `2026-07-23T02:42:05Z` PHYSICAL COMPLETED |
| Restore | Visible historically; **not** clicked / **not** executed in E2 |
| PITR | NOT EVIDENCED |
| Exact retention days | NOT EXPOSED |
| Schema coverage basis | Recovery point postdates Pack40DR1; Pack A1 was still unapplied pre-apply |

Risk acceptance remained **PROPOSED / NOT GRANTED / NOT INVOKED / NOT EFFECTIVE**.

---

## 6. Pre-apply migration status

**Command:** `npx prisma migrate status`  
**Observation UTC:** `2026-07-23T10:05:47Z` → `2026-07-23T10:05:50Z`  
**Exit:** `1` (pending present — expected)

| Field | Result |
|---|---|
| Migrations found | 19 |
| Pending | **`20260722120000_add_local_provider_eligibility_authority` only** |
| Failed / partial | **None** |
| Unexpected pending set | **No** |

---

## 7. Apply execution

**Sanitized command:** `npx prisma migrate deploy`  
**Start UTC:** `2026-07-23T10:06:06Z`  
**End UTC:** `2026-07-23T10:06:10Z`  
**Exit code:** `0`  
**Applied migration:** `20260722120000_add_local_provider_eligibility_authority`  
**Retries:** none  
**Concurrent deploy:** none

---

## 8. Post-apply migration status

**Command:** `npx prisma migrate status`  
**Observation UTC:** `2026-07-23T10:06:26Z`  
**Exit:** `0`

| Field | Result |
|---|---|
| Database schema | **up to date** |
| Pack A1 pending | **No** |
| Failed / partial | **None** (`_prisma_migrations` open/rolled-back count = 0) |
| Pack A1 ledger | finished=`true`, rolled_back=`false` |

**Result:** `PACK_A1_STAGING_MIGRATION_APPLIED_AND_HISTORY_CLEAN`

---

## 9. Schema-object verification (SELECT-only)

Observed on staging:

| Object class | Observed |
|---|---|
| Enums | `LocalProviderEligibilityStatus`, `LocalProviderEligibilityAuditEventType`, `LocalProviderEligibilityAuditActorType` |
| Tables | `LocalProviderEligibility`, `LocalProviderEligibilityAuditEvent` |
| Indexes | PK ×2; unique `businessId`; status/visibility idx; 4 audit createdAt indexes |
| FKs | Business Restrict; eligibility Restrict; actor User Restrict (all `ON DELETE RESTRICT` / `ON UPDATE CASCADE`) |

**Result:** schema objects present as authored.

---

## 10. Zero-row / no-backfill verification

| Check | Result |
|---|---|
| `LocalProviderEligibility` COUNT | **0** |
| `LocalProviderEligibilityAuditEvent` COUNT | **0** |
| Provider eligibility rows created | **No** |
| Audit events created | **No** |
| Seed/backfill | **None** |

**Result:** `PACK_A1_STRUCTURE_APPLIED_WITH_ZERO_PROVIDER_AND_AUDIT_ROWS`

---

## 11. Commands not performed

- `prisma db push` / `migrate resolve` / migration SQL edit
- Fly deploy / restart / scale / secrets mutation
- Provider register/config/activate/suspend/retire
- Business/User mutation
- Local request create / live QA
- Backup restore
- Risk-acceptance grant
- E3–E10 execution

---

## 12. E3 readiness decision

Migration-critical E2 success allows only an **authorization decision** for E3:

**Secondary:** `READY_FOR_E3_STAGING_API_DEPLOY_AUTHORIZATION_DECISION`

**E3 authorized:** **No**  
Future E3 still requires:

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY`

Later-stage unresolved (unchanged):

| Gate | Status |
|---|---|
| E5 live Role.ADMIN auth | Unresolved |
| E6 Business fixture | `BLOCKED_NO_SAFE_STAGING_BUSINESS_FIXTURE` |
| E8 staging client SHA | `BLOCKED_E1_STAGING_CLIENT_SOURCE_SHA_UNRESOLVED` |

---

## 13. Governance

| Item | Status |
|---|---|
| `REQUEST_ONLY_NO_CHARGE` | Confirmed |
| Risk acceptance | NOT GRANTED / NOT INVOKED |
| Pack40S | NOT AUTHORIZED |
| Apple / EAS / Phase D2 | Deferred |
| Phase C | closed green |
| Production-ready claim | None |
| Physical-native QA claim | None |

---

## 14. Exactly one next operator action

**Strict-review this docs-only E2 result PR.**

Do **not** authorize E3 automatically.
