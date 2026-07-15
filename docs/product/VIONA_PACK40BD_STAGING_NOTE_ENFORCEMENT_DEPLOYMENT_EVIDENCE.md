# Pack40BD — Staging Note Enforcement Deployment Evidence

Status: **EXECUTION COMPLETE — STAGING DEPLOYMENT ONLY**

Operator phrase: `APPROVE_PACK40BD_STAGING_NOTE_ENFORCEMENT_DEPLOY`

Deployed-state markers:

```text
PACK40B_TRANSACTIONAL_NOTE_ENFORCEMENT_DEPLOYED_TO_STAGING
PACK40B_STAGING_ADVERSARIAL_QA_STILL_REQUIRED
```

---

## 1. Verified master SHA

`45c8f2945e4237bd5c20a76d36e0e566ffa5667d` — includes Pack40B initial (#356) + transactional correction (#357)

## 2. PR #356 merge state and merge commit

**MERGED**, merge commit `a165ca96316080164b34707c44ff57bea8e09697`

## 3. PR #357 merge state and merge commit

**MERGED** @ `2026-07-15T12:03:21Z`, merge commit `45c8f2945e4237bd5c20a76d36e0e566ffa5667d`

## 4. Branch and evidence commit

- Branch: `docs/pack40bd-staging-note-enforcement-deployment`
- Commit: recorded at PR open time

## 5. Corrected Pack40B source-boundary verification

| Check | Result |
|---|---|
| Single surface: `POST /api/viona/requests/:id/actions/note` | **PASS** |
| Auth from trusted middleware only | **PASS** |
| Client cannot supply scopeKind/merchantProfileId/expectedTenantId/policy | **PASS** |
| MerchantProfile lookup inside transaction | **PASS** — `resolveVionaRequestNotePrincipalContext(tx, ...)` |
| Transaction client used for profile lookup | **PASS** |
| Serializable isolation | **PASS** — `TransactionIsolationLevel.Serializable` |
| Complete DB predicate in findFirst | **PASS** |
| Authorization before idempotency | **PASS** — no pre-transaction fast path |
| Consumer branch independent of inactive profile | **PASS** |
| Merchant branch requires active exact profile + tenant | **PASS** |
| `legacyUnresolved` fail-closed | **PASS** |
| Denied note → no successful-note audit | **PASS** |
| Pack40A direct reads unchanged | **PASS** |
| Status/execution/create/webhook unchanged | **PASS** |
| No pre-transaction `resolveVionaRequestReadPrincipalContext` | **PASS** |

## 6. Transaction-scoped principal

`src/services/viona/vionaRequestNotePrincipalContext.ts` — one bounded `findUnique({ ownerUserId })` per note request inside `$transaction`.

## 7. Serializable isolation

Applied on note mutation transaction in `vionaRequestNoteActionService.ts`.

## 8. Authorization-before-idempotency

Pre-transaction idempotency fast path removed. Idempotency inspected only after current transactional authorization passes.

## 9. Direct note surface deployed

`POST /api/viona/requests/:id/actions/note` → `appendVionaRequestNote`

## 10. Pack40A unchanged on staging

Pack40A read enforcement remains from release v24; this deploy adds Pack40B note mutation only.

## 11. Local quality-gate results

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| ESLint (Pack40B production + test) | **PASS** |
| Pack40B suite | **81/81 PASS** |
| Pack40A suite | **39/39 PASS** |
| Pack40P2 / P4W / P5 | **PASS** |
| Pack30D-3 / Pack18 | **PASS** |
| Full local `test-viona-pack*.ts` (live-staging QA excluded) | **PASS** |

No database, authenticated staging request, or provider call during gates.

## 12–13. Migration prerequisite / no new migration

Pack40B introduces **no** schema or migration. Repository contains **16** migration directories; latest remains `20260714120000_pack40p1_add_viona_request_provenance`. **No** Prisma command executed.

## 14. Staging app

`viona-api-staging-eu` (`https://viona-api-staging-eu.fly.dev`)

## 15. Previous release/image

| Field | Value |
|---|---|
| Release version | **v24** |
| Image | `deployment-01KXJH9CGSNBQ5H0JDWG89MMBM` |
| Contents | Pack40A read enforcement (Pack40AD); **no** Pack40B |

## 16. Pre-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |
| Machine state | 1 started (v24), 1 stopped (v24) |

## 17. Deploy command

```text
fly deploy --app viona-api-staging-eu --remote-only
```

## 18. Deployment result

| Field | Value |
|---|---|
| Exit code | **0** |
| Deploy start (UTC) | `2026-07-15T12:08:46Z` (approx.) |
| Deploy end (UTC) | `2026-07-15T12:10:12Z` |
| Strategy | Rolling update (2 machines) |
| Smoke checks | **PASS** — machine 2861545b90d938 reached good state |
| Build context warning | 7.1 GB (`.gradle-user-home`); build succeeded |
| Listen-address warning | Same non-blocking warning as Pack40AD |

## 19. New release/image

| Field | Value |
|---|---|
| Release version | **v25** |
| Image | `deployment-01KXJTWQZCWPCTRK3B0SPKYJAT` |
| Source | Verified merged master @ `45c8f29` (Pack40B transactional) |

## 20. Post-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |
| Machine state | 1 started (v25), 1 stopped (v25) |

## 21. Rolling window

| Field | Value |
|---|---|
| Previous release | v24 |
| New release | v25 |
| Overlap | Rolling update; v24 machines replaced sequentially |
| All healthy | **Yes** — by `2026-07-15T12:10:12Z` |

## 22. Fly-log limitation

`fly logs` not used as deployment gate (known 401/hang risk). Evidence based on deploy output, release transition, smoke checks, machine state, and health only.

## 23–28. Confirmations

| Check | Status |
|---|---|
| No authenticated QA | **CONFIRMED** |
| No note POST | **CONFIRMED** |
| No DB access | **CONFIRMED** |
| No migration ran | **CONFIRMED** |
| No secret changed | **CONFIRMED** |
| Production untouched | **CONFIRMED** |
| Pack40C/D/S unimplemented | **CONFIRMED** |

## 29. Deployed-state markers

```text
PACK40B_TRANSACTIONAL_NOTE_ENFORCEMENT_DEPLOYED_TO_STAGING
PACK40B_STAGING_ADVERSARIAL_QA_STILL_REQUIRED
```

Pack40B is **not** CLOSED/GREEN. Live note authorization not yet verified.

## 30. Final classification

**`READY_FOR_PACK40BD_DEPLOYMENT_EVIDENCE_PR_REVIEW`**

Next: separately authorize `APPROVE_PACK40BS_STAGING_TENANT_NOTE_ADVERSARIAL_QA`.
