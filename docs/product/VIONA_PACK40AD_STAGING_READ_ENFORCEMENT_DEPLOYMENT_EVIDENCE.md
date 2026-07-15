# Pack40AD — Staging Read Enforcement Deployment Evidence

Status: **EXECUTION COMPLETE — STAGING DEPLOYMENT ONLY**

Operator phrase: `APPROVE_PACK40AD_STAGING_READ_ENFORCEMENT_DEPLOY`

Deployed-state markers:

```text
PACK40A_READ_ENFORCEMENT_DEPLOYED_TO_STAGING
PACK40A_ADVERSARIAL_QA_STILL_REQUIRED
```

---

## 1. Verified master SHA

`ef6172e22fd33c6b4947e8f98d45d7d4773b8c1f` — `feat(viona): enforce Pack40A provenance-aware reads (#352)`

## 2. PR #352 merge state and merge commit

**MERGED** @ `2026-07-15T09:13:46Z`, merge commit `ef6172e22fd33c6b4947e8f98d45d7d4773b8c1f`

## 3. Branch and evidence commit

- Branch: `docs/pack40ad-staging-read-enforcement-deployment`
- Commit: recorded at PR open time

## 4. Source-boundary review

| Check | Result |
|---|---|
| `directReadPolicy: 'pack40a_provenance'` is server-side literal | **PASS** — set only in `VionaRequestController.ts` list + detail handlers |
| Not sourced from body/query/URL/header/public DTO | **PASS** — controller never reads client input for this field |
| Note/status/create/webhook/execution callers opt in | **PASS** — they call `getVionaRequestById` without `directReadPolicy` |
| Consumer predicate | **PASS** — `existingUserScope AND scopeKind=consumer AND merchantProfileId=null` |
| Merchant predicate | **PASS** — `existingUserScope AND scopeKind=merchant AND merchantProfileId=actor.id AND tenantId=actor.tenantId` |
| `legacyUnresolved` excluded | **PASS** |
| No registry-absence fallback, `NOT IN`, global scan, per-row lookup | **PASS** |

**Client-controlled read policy:** **not possible** on merged master.

## 5. Direct read surfaces deployed

| Surface | Path |
|---|---|
| List | `GET /api/viona/requests` |
| Detail | `GET /api/viona/requests/:id` |

## 6. Mutation paths confirmed unchanged

Note actions, status actions, Pack19 create, Pack35 webhook, execution gate/plan/orchestrator paths do **not** pass `directReadPolicy`.

## 7. Local gate results (from verified `origin/master` @ `ef6172e`)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| ESLint (Pack40A production + test files) | **PASS** |
| `test-viona-pack40a-tenant-context-read-enforcement.ts` | **39/39 PASS** |
| `test-viona-pack40p2-create-path-provenance.ts` | **14/14 PASS** |
| `test-viona-pack40p4-merchant-backfill-write.ts` | **31/31 PASS** |
| `test-viona-pack40p5-staging-provenance.ts` | **30/30 PASS** |
| `test-viona-pack30d3-frontend-audit-trail-timeline.ts` | **11/11 PASS** |
| Full local `test-viona-pack*.ts` regression (live-staging QA excluded) | **PASS** |

No database connection, authenticated staging request, or provider call during local gates.

## 8. Migration-state prerequisite

Pack40P1 migration `20260714120000_pack40p1_add_viona_request_provenance` recorded as applied on staging per Pack40P3 evidence. Pack40A introduces **no** schema or migration change.

## 9. Confirmation no new migration exists

Repository contains **16** migration directories. Latest remains `20260714120000_pack40p1_add_viona_request_provenance`. **No** migration added after Pack40P3-verified apply.

## 10. Staging app

`viona-api-staging-eu` (`https://viona-api-staging-eu.fly.dev`)

## 11. Previous release/image

| Field | Value |
|---|---|
| Release version | **v23** |
| Image | `viona-api-staging-eu:deployment-01KXH70SC5G1KKJYWG5KYB5SDX` |
| Pack40A on staging | **No** — pre-Pack40A create-path era only |

## 12. Pre-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |
| Machine state | 1 started (v23), 1 stopped (v23) |

## 13. Deploy command

```text
fly deploy --app viona-api-staging-eu --remote-only
```

## 14. Deployment result

| Field | Value |
|---|---|
| Exit code | **0** |
| Deploy start (UTC) | `2026-07-15T09:21:21Z` |
| Deploy end (UTC) | `2026-07-15T09:22:26Z` |
| Strategy | Rolling update (2 machines) |
| Smoke checks | **PASS** — both machines reached good state |
| Build context warning | 7.1 GB context (`.gradle-user-home`); build still succeeded |

## 15. New release/image

| Field | Value |
|---|---|
| Release version | **v24** |
| Image | `viona-api-staging-eu:deployment-01KXJH9CGSNBQ5H0JDWG89MMBM` |
| Source | Verified merged master @ `ef6172e` (Pack40A read enforcement) |

## 16. Post-deploy health

| Check | Result |
|---|---|
| `GET /health` | **HTTP 200** |

## 17. Machine state

| Machine | Version | State |
|---|---|---|
| `2861545b90d938` | **24** | started |
| `1850372b290d78` | **24** | stopped |

## 18. Rolling deployment window

| Item | Value |
|---|---|
| Start | `2026-07-15T09:21:21Z` |
| Machines healthy | `2026-07-15T09:22:14Z` (per Fly smoke output) |
| Previous release | **v23** |
| New release | **v24** |
| Overlap | Rolling — machines updated sequentially; brief v23/v24 transition |
| Smoke warnings | Large build context size warning only; no startup failure observed |

## 19. Fly-log limitation

`fly logs` was **not** used as a gate (prior sessions recorded Windows `401 Unauthorized` / hang behavior). Deployment evidence relies on successful deploy command, release transition, Fly smoke checks, machine state, and pre/post `/health` HTTP 200. Runtime logs were **not** claimed clean.

## 20. Confirmation no authenticated QA occurred

No authenticated list/detail reads, cross-user reads, unresolved-row reads, request creation, webhook calls, or note/status actions were performed.

## 21. Confirmation no database was accessed

No Prisma command, SQL query, or staging database connection occurred.

## 22. Confirmation no migration ran

No `prisma migrate status`, `prisma migrate deploy`, or `prisma db push` was executed.

## 23. Confirmation no secret changed

No Fly secret import, rotation, or deletion occurred.

## 24. Confirmation production was untouched

Target app was exactly `viona-api-staging-eu`. No production deployment.

## 25. Confirmation Pack40B/C/D/S remain unimplemented

Note enforcement, status enforcement, indirect enforcement, and Pack40S adversarial QA were **not** performed or implemented.

## 26. Deployed-state markers

```text
PACK40A_READ_ENFORCEMENT_DEPLOYED_TO_STAGING
PACK40A_ADVERSARIAL_QA_STILL_REQUIRED
```

Pack40A is **not** CLOSED/GREEN. Adversarial staging QA (Pack40AS) remains separately authorized.

## 27. Final classification

**`READY_FOR_PACK40AD_DEPLOYMENT_EVIDENCE_PR_REVIEW`**
