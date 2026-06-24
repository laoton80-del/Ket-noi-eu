# VIONA Request Engine — Pack25 Staging API Redeploy Authorization Packet

**Document type:** Staging API redeploy authorization and route health check plan (docs-only — no deployment execution).
**Packet ID:** `CURSOR_PACK25_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 04f25f1` — `docs(pack25): record staging API deployment version audit evidence (#149)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_STAGING_API_DEPLOYMENT_VERSION_AUDIT_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK25_LIVE_QA_STAGING_API_VIONA_REQUESTS_404_EVIDENCE.md`, `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`, `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| Deployment execution performed | **NO** |
| Fly restart performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets printed/inspected | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| Live operator sign-off | **Pending** |
| All non-note write/actions remain blocked | **YES** |

**This packet is preparation and scope definition only.** It does **not** authorize deployment execution unless the operator issues a **separate explicit execution authorization** (see §10).

---

## 2. Audit context (green on master — PR #149)

| Finding | Status |
| --- | --- |
| Repo master contains Pack16 VIONA request list/detail routes | **YES** |
| Repo master contains Pack20 note action route | **YES** |
| `src/app.ts` mounts `vionaRouter` at `/api/viona` | **YES** |
| Public staging app identity | **`viona-api-staging-eu`** |
| Deployed exact commit on staging | **UNKNOWN** |
| Likely cause of `GET /api/viona/requests` → 404 | **Outdated staging deployment** (pre-Pack16 image likely) |
| Pack25 live QA | **BLOCKED** until staging serves Pack16 routes |

### 2.1 Prior live probe (no secrets — audit evidence)

| Probe | Observed result | Interpretation |
| --- | --- | --- |
| `GET /health` | **200** | Staging process reachable |
| `GET /api/viona/requests` (unauthenticated) | **404** — generic Express fallback | `/api/viona` **not mounted** on deployed build |
| `GET /api/wallet/balance` (unauthenticated) | **401** | Wallet route mounted; discriminant vs viona 404 |

---

## 3. Deployment target (plan only — not executed)

| Field | Value |
| --- | --- |
| Target Fly app (name only) | **`viona-api-staging-eu`** |
| Target region (documented) | `fra` |
| Target source commit | **`origin/master @ 04f25f1`** or **later verified master** at execution time |
| Deploy mechanism (reference only) | Existing repo deploy path documented in `fly.toml` + `Dockerfile.api` — **do not modify configs in this packet** |
| Environment | **Staging only** |

---

## 4. Purpose of future controlled redeploy

| # | Objective |
| --- | --- |
| 1 | Redeploy staging API so Pack16 **`GET /api/viona/requests`** and **`GET /api/viona/requests/:id`** routes are mounted and served |
| 2 | Unblock **Pack25 live QA** (inbox list load on `/viona-requests-live-inbox`) |
| 3 | Enable **Pack24 note input live test** only after list route and at least one scoped request row are confirmed available |

**Out of scope for this redeploy authorization:**

- Production deploy
- Pack26 UI hardening
- New write/action categories beyond existing Pack20 note endpoint on master
- Status / assign / confirm / cancel implementation
- Payments, booking, SOS, wallet, live AI changes

---

## 5. Explicit deployment boundary

| Rule | Required |
| --- | --- |
| Staging only | **YES** |
| No production | **YES** |
| No DB migration | **YES** |
| No Prisma schema change | **YES** |
| No seed / user creation | **YES** |
| No Pack26 | **YES** |
| No new write/action category | **YES** |
| No `.env*` mutation in repo | **YES** |
| No deployment config changes in this packet | **YES** |
| No secrets printed or logged | **YES** |
| No workaround via extra DB/Prisma/SQL commands | **YES** |

**Rationale:** Pack16/20 routes exist in application code on master; the blocker is **deployed image staleness**, not missing repo implementation. Redeploy should surface existing route mounts without schema or seed work.

---

## 6. Route health check plan (post future deploy)

Execute **after** deployment execution is separately authorized and completed. **No auth tokens or secret values recorded in evidence.**

### 6.1 Phase A — Route existence (unauthenticated)

| Step | Request | Pass criterion | Fail criterion |
| --- | --- | --- | --- |
| A1 | `GET /health` | HTTP **200** | Non-200 or unreachable |
| A2 | `GET /api/viona/requests` (no Authorization header) | HTTP **401** (auth middleware) | HTTP **404** with generic `Not found` fallback → **stop** — route still not mounted |

**Discriminant:** Generic **404** means `/api/viona` router not mounted (same failure mode as pre-redeploy audit). **401** confirms route table includes Pack16 mount.

### 6.2 Phase B — Authenticated list (pilot session)

| Step | Request | Pass criterion |
| --- | --- | --- |
| B1 | `GET /api/viona/requests?limit=50&skip=0` with pilot JWT from existing PIN login | HTTP **200** with scoped list JSON or **empty array** |
| B2 | Optional: `GET /api/viona/requests/:id` for one visible row | HTTP **200** with scoped detail |

**Gate:** Only after **B1 passes** should operator retry **Pack25 live QA** on `/viona-requests-live-inbox`.

### 6.3 Phase C — Note action route (existence only)

| Step | Request | Pass criterion | Live test |
| --- | --- | --- | --- |
| C1 | Unauthenticated `POST /api/viona/requests/:id/actions/note` | HTTP **401**, not generic **404** | **NO** body submission |
| C2 | Authenticated note POST | **Deferred** | **NO** until list route works **and** a scoped request row is confirmed |

**Do not live-test Pack24 note submit until Phase B confirms list/detail availability for the pilot user.

### 6.4 Pack25 live QA retry sequence (after health checks pass)

1. Expo from verified master-sync checkout; REST login via pilot PIN.
2. Open `/viona-requests-live-inbox` — list loads without 404.
3. Select a request — detail loads.
4. Exercise Pack24 note input UI — **only** `POST .../actions/note` (existing Pack20 scope).
5. Record live operator sign-off evidence — **pending** until session completes.

---

## 7. Rollback and stop conditions

| Condition | Action |
| --- | --- |
| Build or deploy command fails | **Stop** — do not retry blindly; record failure evidence |
| `GET /health` fails after deploy | **Stop** — consider rollback per Fly release history |
| Unauthenticated `GET /api/viona/requests` remains generic **404** after deploy | **Stop** — redeploy did not surface Pack16 mount; do **not** run DB/Prisma commands as workaround |
| Authenticated list returns **403/500** persistently | **Stop** — investigate without schema migration unless separately authorized |
| Unexpected production impact | **Stop** — confirm app name remains `viona-api-staging-eu` only |

**Rollback reference (execution pack only):** Prior Fly release / image per `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md` rollback section — not executed in this packet.

---

## 8. Operator authorization model

### 8.1 What this packet authorizes

| Item | Status |
| --- | --- |
| Document redeploy scope and health check plan | **YES** |
| Open PR for docs-only authorization packet | **YES** |
| Execute Fly deploy / restart | **NO** |

### 8.2 Required future execution authorization

Deployment execution requires a **separate explicit operator message** in addition to this merged packet. Example scope-lock phrase (template — not active until operator sends it):

> I, [Operator name], authorize **staging-only** deployment execution for Fly app `viona-api-staging-eu` from verified `origin/master` at [commit SHA]. Deploy application image only. Do not run DB migrations, Prisma schema changes, seed scripts, user creation, production deploy, Pack26 work, or new write/action endpoints. After deploy, run the Pack25 route health check plan (401 discriminant, then authenticated list). Do not print secrets.

**Until that execution authorization is received:** agents and operators must **not** run `fly deploy`, `fly apps restart`, or any Fly command that mutates staging state.

---

## 9. Status flags

| Flag | Value |
| --- | --- |
| `pack25StagingApiRedeployAuthorizationPacketPrepared` | `true` |
| `pack25StagingApiRedeployExecutionAuthorized` | `false` |
| `pack25StagingApiRedeployExecutionPerformed` | `false` |
| `pack25LiveQaStatus` | `blocked` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `pack25LiveOperatorAttestationPending` | `true` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 10. Explicit non-scope (this packet)

| Item | State |
| --- | --- |
| Code implemented | **NO** |
| Frontend modified | **NO** |
| Server/API modified | **NO** |
| Deployment configs modified | **NO** |
| Deployment performed | **NO** |
| Fly restart performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets inspected or printed | **NO** |
| `.env*` modified | **NO** |
| Pack26 opened | **NO** |

---

## 11. Recommendation

| Step | Action | Now |
| --- | --- | --- |
| 1 | Merge this docs-only authorization packet | PR review |
| 2 | Operator issues **separate execution authorization** | **Not yet** |
| 3 | Execute controlled staging redeploy | **Blocked** until step 2 |
| 4 | Run route health check plan §6 | **After** step 3 |
| 5 | Retry Pack25 live QA → Pack24 note submit | **After** step 4 |

---

**Evidence:** `docs/design/evidence/cursor-pack25-staging-api-redeploy-authorization-packet/README.md`
