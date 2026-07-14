# Pack40P3 — Staging Provenance Migration Apply Evidence

Status: **EXECUTION COMPLETE — STAGING SCHEMA READY**

Operator phrase: `APPROVE_PACK40P3_STAGING_PROVENANCE_MIGRATION_APPLY`

Deployment-lock transition:

```text
STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED
```

---

## 1. Verified master SHA

`958b7645bc87b2c5b690598751f4eb199d645d32`

## 2. PR #345 state and merge commit

**MERGED** @ `2026-07-14T20:30:13Z`, merge commit `958b7645bc87b2c5b690598751f4eb199d645d32`

## 3. Branch and evidence commit

- Branch: `chore/pack40p3-staging-provenance-migration-apply`
- Commit: recorded at PR open time

## 4. Redacted staging identity

| Label | Value |
|---|---|
| Fly app | `viona-api-staging-eu` |
| Health URL | `https://viona-api-staging-eu.fly.dev/health` |
| Database host | `db.euqbfanilcssjiwwtcby.supabase.co` |
| Supabase project ref | `euqbfanilcssjiwwtcby` |

Staging identity verified via Supabase ref match in local `DATABASE_URL` (value not recorded).

## 5. Migration file checksum

SHA256: `D1AEFAF9E5FB1401C4021219949D39AD3ECF20F18139C67993C6628604D738E5`

File: `prisma/migrations/20260714120000_pack40p1_add_viona_request_provenance/migration.sql`

## 6. Pre-apply migration status

`npx prisma migrate status`:

- 16 migrations found in repository
- **Exactly one pending:** `20260714120000_pack40p1_add_viona_request_provenance`
- No failed or unfinished ledger entries for Pack40P1

## 7. Complete pending migration list (pre-apply)

1. `20260714120000_pack40p1_add_viona_request_provenance` — only pending migration

## 8. Pre-apply aggregate request count

- Total `VionaRequest` rows: **10**
- Provenance columns absent
- Provenance enum absent

## 9. Migration apply command and result

Command:

```text
npx prisma migrate deploy
```

Result: **SUCCESS** — applied `20260714120000_pack40p1_add_viona_request_provenance` only.

## 10. Post-apply ledger state

- Pack40P1 migration: **applied** (`finished_at` set)
- Unfinished migrations: **0**
- `npx prisma migrate status`: **Database schema is up to date!**

## 11. Enum verification

`VionaRequestScopeKind` exists with exactly:

- `consumer`
- `merchant`
- `legacyUnresolved`

## 12. Column verification

| Column | Present | Nullable | Default |
|---|---|---|---|
| `scopeKind` | Yes | No | `'legacyUnresolved'::"VionaRequestScopeKind"` |
| `merchantProfileId` | Yes | Yes | null |
| `tenantId` | Yes (unchanged) | No | unchanged |

## 13. Index verification

- `VionaRequest_scopeKind_idx` — present
- `VionaRequest_merchantProfileId_idx` — present

## 14. FK verification

- Constraint: `VionaRequest_merchantProfileId_fkey`
- References: `MerchantProfile.id`
- Delete rule: **RESTRICT**

## 15. Existing-row scope distribution

| scopeKind | Count |
|---|---|
| `legacyUnresolved` | 10 |
| `consumer` | 0 |
| `merchant` | 0 |

## 16. Pre/post row-count equality

| Metric | Pre | Post |
|---|---|---|
| Total VionaRequest rows | 10 | 10 |

## 17. Zero rows became consumer

Confirmed — `consumer` count = **0**

## 18. Zero rows became merchant

Confirmed — `merchant` count = **0**

## 19. All existing rows legacyUnresolved only

Confirmed — all **10** rows have `scopeKind = legacyUnresolved`

## 20. Pre/post application health

| Check | Pre | Post |
|---|---|---|
| `GET /health` | HTTP **200** | HTTP **200** |

## 21. Application image/release unchanged

| Metric | Pre | Post |
|---|---|---|
| Fly release | **v22** | **v22** |

No deploy or rolling restart initiated by this task.

## 22. No deployment occurred

No `fly deploy`, source change, or application rollout.

## 23. No backfill occurred

No `UPDATE`, manual SQL, or data normalization. Migration default only.

## 24. No product code changed

Evidence/docs branch only — no schema, migration, or application files modified.

## 25. Deployment-lock transition

From:

```text
SCHEMA_COMMITTED_MIGRATION_NOT_APPLIED
DEPLOYMENT_BLOCKED_FOR_ENVIRONMENTS_WITHOUT_MIGRATION
```

To (staging only):

```text
STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED
```

## 26. Production remains blocked

Production migration apply not authorized. Staging apply does not imply production readiness.

## 27. Final classification

`READY_FOR_PACK40P3_MIGRATION_EVIDENCE_PR_REVIEW`

---

Aggregate evidence: `docs/design/evidence/pack40p3-staging-provenance-migration/summary.json`
