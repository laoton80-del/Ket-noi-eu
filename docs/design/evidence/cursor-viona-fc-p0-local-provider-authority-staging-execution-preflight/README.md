# Evidence — FC-P0 Local Provider Authority Staging Execution Preflight (E1)

## 1. Authorization phrase

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_EXECUTION_PREFLIGHT`

## 2. Canonical master

`50c2c7616184c3b8f0a85bf224bc30a4daf526d6`

## 3. Branch and HEAD

- Branch: `docs/viona-fc-p0-local-provider-authority-staging-execution-preflight-result`
- HEAD: recorded at commit time on this docs-only branch

## 4. Exact changed paths

| Path | Purpose |
|---|---|
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_EXECUTION_PREFLIGHT_RESULT.md` | E1 preflight result |
| `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-staging-execution-preflight/README.md` | This evidence README |
| `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` | Kernel sync |
| `Handoff_VIONA11726.txt` | Handoff sync |

## 5. Read-only proof

No `src/`, `prisma/` schema, migration SQL, `package.json`, scripts, tests, deploy config, or env file changes.

## 6. Commands / actions performed

Fly read-only status/releases/image/config; `prisma migrate status`; bounded unauth GETs; local checksum/blob compare; docs authoring.

## 7. Commands not performed

`migrate deploy`, `db push`, `migrate resolve`, Fly deploy/restart/scale/secrets mutation, provider ops, Local create, authenticated mutations, production access.

## 8. Target app and region

`viona-api-staging-eu` / `fra` — live Fly status + `VIONA_DEPLOYMENT_STAGE=staging`.

## 9. Deployed API release / source

- Release **v28**
- Image `deployment-01KXN3M9E6NWTFAE5YMW60T9FH`
- Source SHA (correlated to Pack40DRD evidence): `a84f46d373019c50e2fd81d801487373289b7c43`

## 10. Pack A1 path / checksum

- Path: `prisma/migrations/20260722120000_add_local_provider_eligibility_authority/migration.sql`
- **Canonical Git/LF SHA256:** `3B028C852F594AC9B538FED90C2CEE1D494EC33091F260906020F1819FF23D69` (3471 bytes)
- **Non-canonical WT CRLF (PR #425 original):** `082EB713CAD94FDEF9D5FCA6E13EAE217BC76D712B913C72836513235B466ACC` (3552 bytes)
- Byte-identical Git blob to PR #419 squash

## 11. Migration SQL inventory

Structure-only: 3 enums, 2 tables, indexes, Restrict FKs; **no** data writes.

## 12. Staging migration status

Observed via `prisma migrate status`: Pack A1 **pending/unapplied**; no failed/partial reported.

## 13. Production exclusion

Staging Fly app + staging Supabase project ref `euqbfanilcssjiwwtcby` / alias `viona-staging-eu`.

## 14. Backup / restore readiness

**PR #425 original:** claimed `BACKUP_RESTORE_READINESS_CONFIRMED` from Pack15C + Pack40 lineage (June 18 timestamp not re-read).

**Post-remediation (current):** claim **withdrawn**. Fresh `supabase backups list` blocked (no management token) at `2026-07-22T22:59:28Z`. Active: `BLOCKED_E1_EXPLICIT_FC_P0_RISK_ACCEPTANCE_REQUIRED`. See remediation packet + risk-acceptance proposal (**NOT GRANTED**).

## 15. Rollback artifact

Prior Fly release **v27** / `deployment-01KXKSKRTN49GJW82A1ZAA8PXQ`.

## 16. Route / auth inventory

See result packet §11 (source + live health/providers).

## 17. Bounded live GETs

- `GET /health` → 200 ok
- `GET /api/local/providers` (no auth) → 401 missing Authorization

## 18. Role.ADMIN availability

`APPROVED_STAGING_ROLE_ADMIN_AVAILABLE` (Pack40DRS0 prior evidence; no live auth / no JWT in docs).

## 19. Business fixture availability

`BLOCKED_NO_SAFE_STAGING_BUSINESS_FIXTURE` (E6 later-stage).

## 20. Client source / version

`BLOCKED_E1_STAGING_CLIENT_SOURCE_SHA_UNRESOLVED` (E8 later-stage).

## 21. Preflight readiness matrix

See result packet §15.

## 22–23. Unresolved inputs / stop conditions

See result packet §§14–16. E5 live auth, E6 fixture, E8 client SHA remain unresolved for later gates.

## 24. E2 readiness decision

**Current:** `BLOCKED_E1_EXPLICIT_FC_P0_RISK_ACCEPTANCE_REQUIRED` — **does not authorize E2**.  
(PR #425 original secondary `READY_FOR_E2…` is superseded by backup/restore remediation.)

## 25–29. Confirmations

No migrate apply; no deploy; no provider mutation; no live Local request; no payment/charge.

## 30. `REQUEST_ONLY_NO_CHARGE`

Confirmed.

## 31. Pack40S

**NOT AUTHORIZED**

## 32. Apple / EAS / Phase D2

Deferred; Phase C closed green.

## 33. Exactly one next operator action

Strict-review the E1 backup/restore remediation PR (not E2). Do **not** authorize E2 or grant risk acceptance automatically.

## 34. Validation commands

| Command | Exit |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm run ci:expo-readiness` | **0** (PASS) |
| `npm run ci:release-discipline` | **0** |
