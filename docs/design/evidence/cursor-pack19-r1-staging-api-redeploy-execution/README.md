# Evidence — Pack19 R1 Staging API Redeploy Execution

**Packet ID:** `CURSOR_PACK19_R1_STAGING_API_REDEPLOY_EXECUTION`
**Product doc:** `docs/product/VIONA_REQUEST_PACK19_R1_STAGING_API_REDEPLOY_EXECUTION_RESULT.md`
**Source master deployed:** `origin/master @ 9deb6a523387cf5a34b298c8e619fe9c76889255` (`9deb6a5`).
**Approval phrase recorded on master:** `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE`.

---

## Result classification

**`STAGING_REDEPLOY_COMPLETED_ROUTE_AVAILABLE`**

Staging API `viona-api-staging-eu` redeployed from `9deb6a5`; `POST /api/viona/requests` is now
mounted (unauthenticated probe → `401`, not `404`). No row created, no authenticated mutation, no
status POST, no Pack19 QA, no DB/migration, no production, no Pack29, no execution wiring, no
secrets printed.

---

## What was done

1. Confirmed working-tree HEAD / `origin/master` == `9deb6a5` (exact commit to deploy).
2. Confirmed target is staging app `viona-api-staging-eu` (`viona-api-staging-eu.fly.dev`, `fra`); no production target.
3. Preflight: `viona-forbidden-claims-check.mjs` PASS, `tsc --noEmit` PASS.
4. Ran repo-approved deploy: `fly deploy --app viona-api-staging-eu --remote-only`.
5. Rolling update — 2/2 machines healthy, Fly smoke/health checks PASS, DNS verified.
6. Non-mutating route availability probes only (no auth, no body mutation intent).

---

## Deploy (no secrets)

| Field | Value |
| --- | --- |
| Mechanism | `fly deploy --app viona-api-staging-eu --remote-only` |
| Source commit | `9deb6a5` |
| Deployed image tag | `deployment-01KWZE6B33B806T8Q0NQVBM401` |
| Rolling strategy | 2/2 machines (region `fra`) |
| Outcome | SUCCESS |

---

## Route availability (unauthenticated, non-mutating)

| Step | Request | Expected | Observed |
| --- | --- | --- | --- |
| A1 | `GET /health` | `200` | `200` |
| A2 | `GET /api/viona/requests` (no auth) | `401` (not `404`) | `401` |
| A3 | `POST /api/viona/requests` (no auth) | `401`/`403` (not `404`) | `401` |

A3 `401` (not `404`) confirms the create-submit route is mounted; rejected at auth boundary before mutation.

---

## Safety attestations

| Check | Result |
| --- | --- |
| Target staging only (`viona-api-staging-eu`) | YES |
| Production touched | NO |
| Request row created / seeded | NO |
| Authenticated mutation | NO |
| Status POST called | NO |
| Pack19 QA rerun | NO |
| DB / Prisma / Supabase / SQL migration/apply | NO |
| Schema change | NO |
| Source / runtime implementation change | NO |
| `.env*` changed | NO |
| Secrets / tokens / headers / cookies / PINs / DB URLs / full env printed | NO |
| Pack29 opened | NO |
| Execution wiring added | NO |
| Changed files limited to docs/evidence | YES |
