# Pack40CD — Staging Status Enforcement Deployment Evidence

Status: **EXECUTION COMPLETE — STAGING DEPLOYMENT ONLY**

Operator phrase: `APPROVE_PACK40CD_STAGING_STATUS_ENFORCEMENT_DEPLOY`

Deployed-state markers:

```text
PACK40C_DIRECT_STATUS_ENFORCEMENT_DEPLOYED_TO_STAGING
PACK40C_STAGING_ADVERSARIAL_QA_STILL_REQUIRED
```

---

## 1. Verified master SHA

`9eb77144b9084733b385f3dea5e7d8a76515ae3d` — includes Pack40C implementation (PR #363)

## 2. PR #363 merge state and merge commit

**MERGED** @ `2026-07-15T13:40:12Z`, merge commit `9eb77144b9084733b385f3dea5e7d8a76515ae3d`

## 3. Branch and evidence commit

- Branch: `docs/pack40cd-staging-status-enforcement-deployment`
- Commit: recorded at PR open time

## 4. Pack40C source-boundary verification

| Check | Result |
|---|---|
| Single direct surface: `POST /api/viona/requests/:id/actions/status` | **PASS** |
| Direct allowlist: `submitted → triage` only | **PASS** |
| Owner-only DB predicate (`ownerUserId` + provenance OR) | **PASS** — `buildAuthorizedVionaRequestStatusWhere` |
| Consumer branch: `scopeKind=consumer`, `merchantProfileId=null` | **PASS** |
| Merchant branch: active single profile, exact `merchantProfileId` + `tenantId` | **PASS** |
| `legacyUnresolved` fail-closed | **PASS** |
| MerchantProfile lookup inside transaction | **PASS** — `resolveVionaRequestStatusPrincipalContext(tx, ...)` |
| Serializable isolation | **PASS** — `TransactionIsolationLevel.Serializable` |
| No pre-transaction authorization lookup | **PASS** |
| No pre-transaction idempotency fast path | **PASS** |
| Authorization before replay | **PASS** |
| Valid replay before new-mutation validation | **PASS** |
| Conditional update includes `status=submitted` | **PASS** — `updateMany` |
| Request + status event + audit atomic in tx | **PASS** |
| Post-tx hook: first commit only, not replay, best-effort | **PASS** |
| `vionaRequestExecutionOrchestrator` unchanged | **PASS** — no import of status action service |
| Pack40A read / Pack40B note unchanged | **PASS** |
| No client tenant/profile/scopeKind in authorization | **PASS** |
| No schema or migration in Pack40C | **PASS** |

## 5. Direct status surface deployed

`POST /api/viona/requests/:id/actions/status` → `transitionVionaRequestStatus`

Indirect execution orchestrator, create/webhook initial status, and note paths remain outside Pack40C.

## 6. Local quality-gate results

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| ESLint (Pack40C production + test) | **PASS** |
| Pack40C suite | **93/93 PASS** |
| Pack40A suite | **39/39 PASS** |
| Pack40B suite | **81/81 PASS** |
| Pack40P2 / P4W / P5 | **PASS** |
| Pack30D2 / Pack30D3 | **PASS** |
| Pack18 controlled-write | **PASS** |
| Full local `test-viona-pack*.ts` (live-staging QA excluded) | **26/26 PASS** |

No database connection, authenticated staging request, status POST, or provider call during gates.

## 7. Migration prerequisite

Pack40C introduces **no** schema or migration. Repository contains **16** migration directories; latest remains `20260714120000_pack40p1_add_viona_request_provenance`. **No** Prisma command executed.

## 8. Staging app

`viona-api-staging-eu` (`https://viona-api-staging-eu.fly.dev`)

## 9. Previous release/image

| Field | Value |
|---|---|
| Release version | **v25** |
| Image | `deployment-01KXJTWQZCWPCTRK3B0SPKYJAT` |
| Contents | Pack40B transactional note enforcement (Pack40BD); **no** Pack40C |

## 10. Pre-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |
| Machine state | 1 started (v25), 1 stopped (v25) |

## 11. Deploy command

```text
fly deploy --app viona-api-staging-eu --remote-only
```

Deploy source: verified merged master @ `9eb7714` (not feature branch).

## 12. Deployment result

| Field | Value |
|---|---|
| Exit code | **0** |
| Deploy start (UTC, approx.) | `2026-07-15T13:45:10Z` |
| Machines healthy (UTC, approx.) | `2026-07-15T13:46:14Z` |
| Strategy | Rolling update (2 machines) |
| Smoke checks | **PASS** — machine 2861545b90d938 reached good state |
| Build context warning | 7.1 GB (`.gradle-user-home`); build succeeded |
| Listen-address warning | Same non-blocking warning as Pack40AD/40BD |

## 13. New release/image

| Field | Value |
|---|---|
| Release version | **v26** |
| Image | `deployment-01KXK0CRXQ4KXVK719EQ5EZ532` |
| Source | Verified merged master @ `9eb7714` (Pack40C) |

## 14. Post-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** — `{"success":true,"data":{"status":"ok"}}` |
| Machine state | 1 started (v26), 1 stopped (v26) |

## 15. Rolling window

| Field | Value |
|---|---|
| Overlap | **Yes** — rolling strategy; v25 and v26 briefly coexisted during machine update |
| Warnings | Build context size; listen-address advisory (non-blocking, same as prior deploys) |

## 16. Fly log limitation

`fly logs` **not** collected. Per operator instruction, existing environment may produce Fly CLI log 401 responses or Windows hangs. Evidence relies on successful deploy, release transition, smoke checks, machine state, and pre/post `/health` only.

## 17. Confirmations

| Item | Result |
|---|---|
| Authenticated Pack40C QA | **NOT performed** |
| Status-action POST | **NOT performed** |
| Database accessed | **NO** |
| Migration executed | **NO** |
| Secret changed | **NO** |
| Production touched | **NO** |
| Pack40A/B | **CLOSED/GREEN** (unchanged on staging; v24 read + v25 note remain; v26 adds status) |
| Pack40D/S | **Unimplemented / not authorized** |
| Pack40C CLOSED/GREEN | **NO** — adversarial QA still required |

## 18. Final classification

**`READY_FOR_PACK40CD_DEPLOYMENT_EVIDENCE_PR_REVIEW`**

## 19. Recommended next operator action

```text
APPROVE_PACK40CS_STAGING_TENANT_STATUS_ADVERSARIAL_QA
```
