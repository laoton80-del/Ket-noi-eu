# Evidence — FC-P0 E2 Staging Migration Apply (Pack A1)

## 1. Authorization

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY`

## 2. Canonical master (pre-execution)

`91b7aaf33384142ee2e7dc48c4681c6b649ec8a9`

## 3. Branch

`docs/viona-fc-p0-local-provider-authority-staging-migration-apply-result`

## 4. Changed paths (expected)

| Path | Purpose |
|---|---|
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY_RESULT.md` | Result packet |
| `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-staging-migration-apply/README.md` | This README |
| Planning packet E2 observed field (optional) | Mark E2 executed / E3 unauthorized |
| Kernel + Handoff | Sync |

## 5. Staging target (safe)

`viona-api-staging-eu` / `fra` / `staging` / `viona-staging-eu` / `euqbfanilcssjiwwtcby`  
Datasource class: `db.<staging-ref>.supabase.co` (no credentials recorded).

## 6. Migration integrity

- Path: `prisma/migrations/20260722120000_add_local_provider_eligibility_authority/migration.sql`
- Git/LF SHA256: `3B028C852F594AC9B538FED90C2CEE1D494EC33091F260906020F1819FF23D69`
- Bytes: 3471
- Blob matches PR #419
- Structure-only: 3 enums, 2 tables, indexes, 3 Restrict FKs; no data writes

## 7. Recovery point (pre-apply gate)

`2026-07-23T02:42:05Z` PHYSICAL COMPLETED (PR #427). Restore not executed. PITR not evidenced. Retention days not exposed.

## 8. Pre-apply status

`npx prisma migrate status` @ `2026-07-23T10:05:47Z` — Pack A1 **only** pending; exit 1; no failed/partial.

## 9. Apply

| Field | Value |
|---|---|
| Command | `npx prisma migrate deploy` |
| Start | `2026-07-23T10:06:06Z` |
| End | `2026-07-23T10:06:10Z` |
| Exit | `0` |
| Applied | `20260722120000_add_local_provider_eligibility_authority` |

## 10. Post-apply status

`npx prisma migrate status` @ `2026-07-23T10:06:26Z` — schema up to date; exit 0; Pack A1 finished; failed/open = 0.

## 11–12. Schema + zero rows

Enums 3/3; tables 2/2; expected indexes + 3 Restrict FKs present.  
`LocalProviderEligibility` = **0**; `LocalProviderEligibilityAuditEvent` = **0**.

## 13–20. Boundaries

No secrets in docs; no API/client deploy; no provider/Business/User mutation; no live QA; no restore; risk acceptance not granted; E3–E10 unauthorized; `REQUEST_ONLY_NO_CHARGE`; Pack40S unauthorized; Apple/EAS/Phase D2 deferred.

## 21. Next action

Strict-review this docs-only PR. Do not authorize E3.

## Validation

| Command | Exit |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm run ci:expo-readiness` | **0** (PASS) |
| `npm run ci:release-discipline` | **0** |
