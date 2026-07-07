# VIONA Request Engine — Pack19 R1 Staging API Redeploy Execution Result

**Document type:** Execution-only staging API redeploy result (records a redeploy performed in this pack; no code/data changes).
**Packet ID:** `CURSOR_PACK19_R1_STAGING_API_REDEPLOY_EXECUTION`
**Source master deployed:** `origin/master @ 9deb6a523387cf5a34b298c8e619fe9c76889255` (short `9deb6a5`).
**Approval phrase recorded on master:** `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE`.
**Related:**
- `docs/product/VIONA_REQUEST_PACK19_R1_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET.md`
- `docs/product/VIONA_REQUEST_PACK19_R1_VIONA_REQUEST_CREATE_SUBMIT_PATH_IMPLEMENTATION.md`
- `docs/product/VIONA_REQUEST_PACK19_SAFE_SUBMITTED_ROW_PRECONDITION_REMEDIATION_EXECUTION_PACK.md`
- `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_STAGING_REDEPLOY_EXECUTION_EVIDENCE.md`
- `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`

---

## 1. Result classification

**`STAGING_REDEPLOY_COMPLETED_ROUTE_AVAILABLE`**

Staging API `viona-api-staging-eu` was redeployed from verified master `9deb6a5`. The merged
endpoint `POST /api/viona/requests` is now mounted and returns an auth-related rejection
(`401`) rather than a generic `404` route-not-found.

---

## 2. Execution summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Execution-only staging redeploy | **YES** |
| Source master deployed | **`9deb6a523387cf5a34b298c8e619fe9c76889255`** (`9deb6a5`) |
| Working-tree HEAD at deploy | **`9deb6a5`** (docs branch based on `origin/master`, no runtime changes) |
| Target app | **`viona-api-staging-eu`** (`viona-api-staging-eu.fly.dev`, region `fra`) |
| Production target selected | **NO** |
| Approval phrase recorded on master | **YES** — `APPROVE_PACK19_R1_STAGING_API_REDEPLOY_FOR_CREATE_SUBMIT_ROUTE` |
| Deploy command category | **Fly remote-only rolling deploy** (no secrets recorded) |
| Deploy outcome | **SUCCESS** — rolling, 2/2 machines healthy, DNS verified |
| Route availability result | **AVAILABLE** — `POST /api/viona/requests` → `401` (not `404`) |
| Request row created/seeded | **NO** |
| Authenticated mutation | **NO** |
| Status POST called | **NO** |
| Pack19 QA rerun | **NO** |
| DB / Prisma / Supabase / SQL migration/apply | **NO** |
| `.env*` changed | **NO** |
| Secrets / tokens / headers / cookies / PINs / DB URLs / full env printed | **NO** |
| Pack29 opened | **NO** |
| Execution wiring added | **NO** |
| Production touched | **NO** |

---

## 3. Preflight (read-only)

| Check | Result |
| --- | --- |
| `git rev-parse origin/master` == `9deb6a5` | **YES** |
| Fly CLI available | **YES** (`fly.exe v0.4.60`) |
| Fly auth present | **YES** (account owner; identity not reproduced here) |
| Target `viona-api-staging-eu` resolves to staging host | **YES** — `viona-api-staging-eu.fly.dev` |
| Production app selected | **NO** |
| `node scripts/viona-forbidden-claims-check.mjs` | **PASS** (0 BLOCKER, 0 REVIEW) |
| `npx tsc --noEmit` | **PASS** |

---

## 4. Deploy (this pack — no secrets recorded)

| Field | Value |
| --- | --- |
| Mechanism | `fly deploy --app viona-api-staging-eu --remote-only` |
| Source commit | **`9deb6a5`** |
| Build | Remote (Depot) build of `Dockerfile.api` |
| Deployed image tag | `deployment-01KWZE6B33B806T8Q0NQVBM401` |
| Rolling strategy | 2/2 machines updated (region `fra`) |
| Health/smoke checks (Fly) | **PASS** |
| DNS verification | **PASS** |
| Outcome | **SUCCESS** |

---

## 5. Post-deploy route availability (non-mutating, unauthenticated)

No auth tokens, JWTs, PINs, Authorization headers, or secret values were sent or recorded.

| Step | Request | Pass criterion | Observed |
| --- | --- | --- | --- |
| A1 | `GET /health` | HTTP **200** | **200** |
| A2 | `GET /api/viona/requests` (no Authorization header) | HTTP **401** (not `404`) | **401** |
| A3 | `POST /api/viona/requests` (no Authorization header) | HTTP **401**/**403** (not `404`) | **401** |

**Discriminant:** A generic `404` on A3 would indicate the Pack19 R1 create-submit route is not
mounted. The observed `401` confirms the route table now includes `POST /api/viona/requests`, and
the request was rejected at the auth boundary **before any mutation** — no row was created.

---

## 6. Explicitly not performed

| Action | Performed |
| --- | --- |
| Authenticated `POST /api/viona/requests` (create-submit) | **NO** |
| Request row create / seed | **NO** |
| Status action POST | **NO** |
| Pack19 staging QA rerun (`submitted` → `triage`) | **NO** |
| DB / Prisma / Supabase / SQL migration or apply | **NO** |
| Schema change | **NO** |
| User / account creation | **NO** |
| Source / runtime implementation change | **NO** |
| `.env*` mutation | **NO** |
| Production deploy | **NO** |
| Pack29 work | **NO** |
| Execution wiring | **NO** |

---

## 7. Next gate

**Separate execution authorization** required to run the Pack19 safe submitted-row precondition
remediation (authenticated `POST /api/viona/requests` to create one safe `submitted` staging row),
now that the route is available. That pack must honor all Pack19 R1 create-submit safety labels and
must not run status transitions. Pack29 remains **not opened**.
