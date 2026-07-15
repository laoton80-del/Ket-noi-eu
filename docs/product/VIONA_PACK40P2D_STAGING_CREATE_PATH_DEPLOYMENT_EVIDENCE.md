# Pack40P2D — Staging Create-Path Provenance Deployment Evidence

Status: **EXECUTION COMPLETE — STAGING CODE DEPLOYED**

Operator phrase: `APPROVE_PACK40P2D_STAGING_CREATE_PATH_PROVENANCE_DEPLOY`

Deployed-state markers:

```text
STAGING_SCHEMA_AND_CREATE_PATH_CODE_DEPLOYED
PROVENANCE_DATA_VERIFICATION_STILL_REQUIRED
```

---

## 1. Verified master SHA

`37d5bb3bd31cd637b486840877045f9ba796231a` — `feat(viona): wire Pack40P request provenance creation (#347)`

## 2. PR #347 state and merge commit

**MERGED** @ `2026-07-14T20:58:32Z`, merge commit `37d5bb3bd31cd637b486840877045f9ba796231a`

## 3. Branch and evidence commit

- Branch: `docs/pack40p2d-staging-create-path-provenance-deploy`
- Commit: recorded at PR open time

## 4. Staging app

`viona-api-staging-eu` (hostname: `viona-api-staging-eu.fly.dev`)

## 5. P3 schema-readiness prerequisite

PR #346 **MERGED** @ `4ec4e42`. Pack40P1 migration applied on staging DB per
`docs/product/VIONA_PACK40P3_STAGING_PROVENANCE_MIGRATION_EVIDENCE.md`.

Prior state: `STAGING_SCHEMA_READY_APPLICATION_DEPLOY_STILL_SEPARATELY_AUTHORIZED`

## 6. Pre-deploy local gate results (from verified `origin/master` @ `37d5bb3`)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** (0 errors) |
| ESLint (Pack40P2 touched production + test files) | **PASS** (0 errors; 1 pre-existing unused-var warning in Pack35 test) |
| `test-viona-pack40p2-create-path-provenance.ts` | **14/14 PASS** |
| Full local `test-viona-pack*.ts` regression (Pack36A live QA excluded) | **25/25 PASS** |

No external provider, staging network, or database call occurred during local gates.

## 7. Confirmation that no new migration exists

Repository migrations after P3-verified Pack40P1 apply remain **16 total**. Latest migration:
`20260714120000_pack40p1_add_viona_request_provenance`. No migration added after PR #346 evidence.
Pack40P2 contains **no** schema or migration file changes.

## 8. Pre-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |
| Pre-deploy release | **v22** |
| Pre-deploy image | `deployment-01KXGC1AZ87H5B6D0DN2F6KH1K` |
| Machine state | 1 started (v22), 1 stopped (v22) |

Pre-deploy deployed source: Pack39-era merged master (pre-Pack40P2); confirmed Pack40P2 **not** yet on staging.

## 9. Previous release/image

| Field | Value |
|---|---|
| Release version | **v22** |
| Image | `viona-api-staging-eu:deployment-01KXGC1AZ87H5B6D0DN2F6KH1K` |

## 10. Exact deploy command

```text
fly deploy --app viona-api-staging-eu --remote-only
```

Deploy source: verified merged `origin/master` @ `37d5bb3bd31cd637b486840877045f9ba796231a`

## 11. Deployment result

| Field | Value |
|---|---|
| Result | **SUCCESS** |
| Deploy start (UTC) | `2026-07-14T21:02:40Z` |
| All machines healthy (UTC) | `2026-07-14T21:05:59Z` (started machine `2861545b90d938`) |
| Rolling duration | ~3m 19s |

Fly rolling strategy updated 2 machines; smoke checks passed on active machine.

## 12. New release/image

| Field | Value |
|---|---|
| Release version | **v23** |
| Image | `viona-api-staging-eu:deployment-01KXH70SC5G1KKJYWG5KYB5SDX` |

## 13. Post-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |
| Machine state | 1 started (v23), 1 stopped (v23) |

## 14. Bounded log result

Post-deploy verification reviewed deploy transcript and health/status probes. No indicators of:

- missing-column error
- unknown-enum error
- Prisma schema mismatch at runtime
- application startup failure
- repeated crash loop

`fly logs --no-tail` CLI stream did not complete within bounded timeout on Windows; health HTTP 200 and Fly machine smoke checks provide primary post-deploy signal. No secret values or environment contents were exposed.

## 15. Rolling-deployment window

| Field | Value |
|---|---|
| Start | `2026-07-14T21:02:40Z` |
| Healthy | `2026-07-14T21:05:59Z` |
| Previous release | v22 / `deployment-01KXGC1AZ87H5B6D0DN2F6KH1K` |
| New release | v23 / `deployment-01KXH70SC5G1KKJYWG5KYB5SDX` |
| Overlap | Yes — rolling update; one machine updated before second reached stopped/good state |
| Request-creation traffic in logs | Not inspected (P2D prohibits request QA and row inspection) |

P5 must account for this deployment window during later provenance verification.

## 16. Confirmation that no request QA occurred

No Pack19 request was created. No Pack35 webhook was invoked. No provenance rows were inspected.

## 17. Confirmation that no database was accessed

No Prisma command, SQL query, or staging database connection was made in this task.

## 18. Confirmation that no migration ran

Deploy build ran `npx prisma generate` only (client generation). No `prisma migrate deploy` or `migrate status` was executed.

## 19. Confirmation that no secret changed

No Fly secret import, set, rotate, or delete was performed.

## 20. Confirmation that production was untouched

Target app was exactly `viona-api-staging-eu`. No production Fly app was selected or modified.

## 21. Confirmation that no backfill occurred

No existing-row update, reclassification, or merchant backfill was performed.

## 22. Confirmation that Pack40A remains blocked

No access-policy, read-enforcement, note, or status-path changes were made.

## 23. Final deployed-state markers

```text
STAGING_SCHEMA_AND_CREATE_PATH_CODE_DEPLOYED
PROVENANCE_DATA_VERIFICATION_STILL_REQUIRED
```

Expected runtime behavior after this deploy:

- Pack19 create path assigns `scopeKind = consumer`, `merchantProfileId = null`
- Pack35 webhook create assigns `scopeKind = merchant` and trusted `merchantProfileId`
- Prisma default `legacyUnresolved` remains for any path omitting explicit provenance

## 24. Final classification

**READY_FOR_PACK40P2D_DEPLOYMENT_EVIDENCE_PR_REVIEW**
