# Pack40DRD — Staging Operator Recovery Deployment Evidence

Operator authorization: `APPROVE_PACK40DRD_STAGING_RECOVERY_DEPLOY`

Classification: `READY_FOR_PACK40DRD_DEPLOYMENT_EVIDENCE_PR_REVIEW`

## Deployed-state markers

```text
PACK40DR_OPERATOR_RECOVERY_DEPLOYED_TO_STAGING
PACK40DR_LIVE_RECOVERY_QA_STILL_REQUIRED
PACK40DR_PROVIDER_SEND_DISABLED
PACK40DR_SCHEDULER_WORKER_NOT_IMPLEMENTED
PACK40D_INITIAL_CONTROLLED_MERCHANT_EXECUTION_REMAINS_CLOSED_GREEN
```

Recovery/reconciliation is **not** CLOSED/GREEN — code deployed only; no live recovery QA performed.

## 1. Verified master SHA

`a84f46d373019c50e2fd81d801487373289b7c43`

## 2. PR #382 merge state

| Field | Value |
|---|---|
| State | **MERGED** |
| Title | `feat(viona): add controlled Pack40D recovery endpoint` |
| Merged at | `2026-07-16T09:11:24Z` |
| Merge commit | `a84f46d373019c50e2fd81d801487373289b7c43` |
| URL | https://github.com/laoton80-del/Ket-noi-eu/pull/382 |

## 3. Evidence branch and commit

- Branch: `docs/pack40drd-staging-recovery-deployment`
- Starting HEAD = verified master: `a84f46d`
- Evidence commit: recorded at PR open time

## 4. Recovery route

`POST /api/internal/viona/execution-attempts/:attemptId/recovery`

Mounted under `/api/internal` → `/viona` sub-router (`internalRoutes.ts`).

## 5. Operator authorization result

| Layer | Mechanism |
|---|---|
| Deployment stage | `vionaInternalDeploymentStageGateMiddleware` — staging/development only |
| Authentication | JWT `authMiddleware` → `req.authUserId` |
| Operator capability | `superAdminMiddleware` — server-side Prisma `User.role === Role.ADMIN` |

**Result:** PASS — ordinary merchant ownership (B2C/B2B/B2B_EU/B2B_VN) is insufficient. Recovery requires platform `Role.ADMIN`, matching established internal ops routes (tourism ops cancel, local ops, admin router). Operator identity is taken only from authenticated context; body `triggeringUserId` is voided.

## 6. Exact-attempt boundary

- Route binds `:attemptId` only; no request-ID recovery route.
- Coordinator loads one attempt via `findVionaRequestExecutionAttemptForRecovery`; no `findMany` scan.

## 7. Generation-fencing result

- Recovery lease acquisition requires exact `expectedLeaseGeneration` from DB.
- Provider/escrow/finalization services require exact generation + lease owner post-acquisition.

## 8. Provider read-only / no-send result

- `createPack40DR3TwilioExactStatusLookupAdapter` — GET-only transport; isolated from Pack40D3 send adapter.
- Coordinator has no provider send/resend path.

## 9. Escrow attempt-scoping result

- Recovery escrow adapter uses `escrow:{requestId}:{executionAttemptId}:twilio_test_sms` idempotency key.
- `outcomeUncertain` forbids escrow mutation in DR2 escrow reconciliation service.

## 10. No scheduler / worker result

- No cron, queue consumer, background worker, or startup recovery scanner in source tree for DR paths.

## 11. Local gates

| Suite | Result |
|---|---|
| Pack40DR3B | **68/68 PASS** |
| Pack40DR3A | **40/40 PASS** |
| Pack40DR2 | **87/87 PASS** |
| Pack40DR1 | **95/95 PASS** |
| Pack40D3B / D3A / D2 / D1 | **54/54 · 62/62 · 112/112 · 47/47** |
| Pack40A / B / C | **39 / 81 / 93 PASS** |
| Pack40P1 | **21/21 PASS** |
| `prisma validate` / `prisma generate` | PASS |
| `tsc --noEmit` | PASS |
| ESLint (recovery-touched files) | PASS |

No database, staging authenticated request, Twilio, or escrow mutation during gates.

## 12. Pack40DR1 migration prerequisite

From merged evidence `VIONA_PACK40DR1_STAGING_RECOVERY_SCHEMA_MIGRATION_APPLY_EVIDENCE.md`:

- Migration `20260716010000_pack40dr1_add_recovery_fencing_and_provider_reference` **already applied** to staging.
- No later migration exists in repository after Pack40DR1 for recovery fencing.
- DR2/DR3A/DR3B introduced **no** schema or migration files.

## 13. Previous release / image

| Item | Value |
|---|---|
| Fly release | **v27** |
| Image | `deployment-01KXKSKRTN49GJW82A1ZAA8PXQ` |
| Deployed code | Pack40DD controlled indirect execution (PR #374) |

## 14. Pre-deploy health

`GET https://viona-api-staging-eu.fly.dev/health` → **HTTP 200**  
Body: `{"success":true,"data":{"status":"ok"}}`

## 15. Deployment command

```text
fly deploy --app viona-api-staging-eu --remote-only
```

Executed once from verified master `a84f46d`. Exit code **0**.

## 16. Deployment result

- Build completed via Depot remote builder.
- Rolling update: 2 machines updated; smoke checks **passed**.
- DNS configuration verified.

## 17. New release / image

| Item | Value |
|---|---|
| Fly release | **v28** |
| Image | `deployment-01KXN3M9E6NWTFAE5YMW60T9FH` |
| Deployed commit | `a84f46d` (PR #382 merge) |

## 18. Post-deploy health

`GET https://viona-api-staging-eu.fly.dev/health` → **HTTP 200**  
Body: `{"success":true,"data":{"status":"ok"}}`

## 19. Machine / rolling-update result

| Machine | Version | State |
|---|---|---|
| `2861545b90d938` | 28 | started (smoke checks passed) |
| `1850372b290d78` | 28 | stopped (standby) |

No crash loop observed in deployment output.

## 20. Fly-log limitation

Fly application logs were **not** collected (known CLI auth/hang limitation). Evidence relies on deploy exit code, release transition, machine state, smoke checks, and `/health` only.

## 21–25. Action confirmations

| Action | Performed? |
|---|---|
| Recovery endpoint POST | **No** |
| Twilio/provider lookup or send | **No** |
| Escrow inspect/settle/refund | **No** |
| Database / Prisma / migration | **No** |
| Secret or production action | **No** |

## 26–30. Platform state

| Area | State |
|---|---|
| Pack40A/B/C | **CLOSED/GREEN** |
| Initial controlled Pack40D | **CLOSED/GREEN** (unchanged) |
| Signed-webhook execution | **DISABLED** |
| `approvedInternalDispatch` | **UNWIRED** |
| Consumer/legacy execution | **UNSUPPORTED** |
| Pack40S | **UNIMPLEMENTED / NOT AUTHORIZED** |

## 31. Source-boundary gate (merged master)

All 20 source-boundary conditions verified PASS on `a84f46d` (single recovery route, auth chain, exact attempt, generation fencing, read-only lookup, no scheduler, no schema change, merchant execution path unchanged).

## 32. Final classification

`READY_FOR_PACK40DRD_DEPLOYMENT_EVIDENCE_PR_REVIEW`

## Next authorization

Separately authorize **Pack40DRS** staging live recovery QA only (`APPROVE_PACK40DRS_STAGING_RECOVERY_QA`). Do not auto-continue.
