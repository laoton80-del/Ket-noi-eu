# VIONA Request Engine — Pack25 Staging API Deployment/Version Audit Evidence

**Document type:** Staging API deployment/version audit evidence (docs-only — no code changes).
**Audit ID:** `CURSOR_PACK25_STAGING_API_DEPLOYMENT_VERSION_AUDIT_READ_ONLY_NO_SECRET`
**Baseline:** `origin/master @ cb2ae4b` — `docs(pack25): record live QA staging API viona requests 404 evidence (#148)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_LIVE_QA_STAGING_API_VIONA_REQUESTS_404_EVIDENCE.md`, `docs/product/VIONA_REQUEST_PACK16_READ_ONLY_REQUEST_API_IMPLEMENTATION_RESULT.md`, `docs/product/VIONA_REQUEST_PACK20_FIRST_NARROW_NOTE_ACTION_IMPLEMENTATION_RESULT.md`, `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md`

---

## 1. Evidence summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only evidence | **YES** |
| Audit mode | **Read-only** — no deploy, no restart, no secrets, no DB, no code changes |
| Verified master checkout used | **YES** — `ket-noi-eu-master-sync @ cb2ae4b` |
| Deployment/restart performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets printed/inspected | **NO** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |
| Live operator sign-off | **Pending** |
| All non-note write/actions remain blocked | **YES** |

---

## 2. Audit scope and method

| Item | Value |
| --- | --- |
| Goal | Determine why public staging API returns **404** for `GET /api/viona/requests` |
| Inspection allowed | Route/controller/service files (read-only), server entrypoint, deployment config names, runbooks, Pack16/20/25 evidence, package script names |
| Inspection forbidden | `.env*` values, secrets, DB/Prisma commands, Fly deploy/restart, API mutation calls, code changes |
| Live probe | Public no-auth GET requests only — no tokens, no Authorization headers recorded |

---

## 3. Repo master route inventory (read-only)

| Question | Result |
| --- | --- |
| Current repo contains Pack16 list/detail routes | **YES** |
| Current repo contains Pack20 note action route | **YES** |
| Server route mount confirmed in repo | **YES** |

### 3.1 Route definitions — `src/routes/vionaRoutes.ts`

| Method | Path (under `/api/viona`) | Pack |
| --- | --- | --- |
| `GET` | `/requests` | Pack16 list |
| `GET` | `/requests/:id` | Pack16 detail |
| `POST` | `/requests/:id/actions/note` | Pack20 note action |

### 3.2 Mount — `src/app.ts`

| Mount | Router |
| --- | --- |
| `app.use('/api/viona', vionaRouter)` | Pack16/20 VIONA request routes |

### 3.3 Server entrypoint

| File | Role |
| --- | --- |
| `src/server.ts` | Starts HTTP server via `createApp()` from `src/app.ts` |
| Package scripts (names only) | `api:dev`, `api:start` → `tsx src/server.ts` |

---

## 4. Staging deployment identity and version inference

| Field | Value |
| --- | --- |
| Public staging app identity (name only) | **`viona-api-staging-eu`** |
| Source | `fly.toml`, `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md` |
| Deployed exact commit SHA | **UNKNOWN** — no public build-label endpoint; Fly release inspect not performed in this audit |
| Route-era inference | **Pre-Pack16 likely** |
| Last documented Fly deploy | **2026-05-23** @ repo commit **`1daf006`** |
| Pack16 merge commit | **`6ddbc59`** (2026-06-20, PR #135) |
| Pack20 merge commit | **`89fd14c`** (2026-06-21, PR #139) |
| `1daf006:src/app.ts` | Had `/api/wallet` mount; **no `/api/viona` mount** |
| Documented redeploy after Pack16/20 | **None found in repo runbooks** |

---

## 5. Live no-secret probe results

Probes performed against the public staging REST host documented in staging runbooks (host name not repeated here). No Authorization headers; no secret values recorded.

| Probe | HTTP status | Body / interpretation |
| --- | --- | --- |
| `GET /health` | **200** | Staging API process reachable |
| `GET /api/viona/requests` (unauthenticated) | **404** | Generic Express fallback `{"success":false,"error":"Not found"}` — route **not mounted** on deployed build |
| `GET /api/wallet/balance` (unauthenticated) | **401** | `Missing or invalid Authorization header` — wallet route **is mounted** |

**Discriminant:** If Pack16 routes were mounted, unauthenticated viona list would hit `authMiddleware` and return **401**, not generic **404**. Live probe confirms deployed route table lacks `/api/viona` mount consistent with pre-Pack16 image.

**Wallet note:** Operator live QA also observed authenticated `GET /api/wallet/balance` → **404**. Wallet route exists on staging (401 without auth). Authenticated 404 may be semantic **`Wallet not found`** for pilot user — weaker staleness signal than viona list 404.

---

## 6. Smoke script coverage gap

| Item | Finding |
| --- | --- |
| Script | `scripts/smoke-public-staging-api.mjs` (name/reference only) |
| Covers | Auth, local requests, merchant inbox, ops routes |
| Does **not** cover | `/api/viona/**` |
| Implication | May 2026 staging deploy PASS did not detect missing Pack16 routes |

---

## 7. Likely cause of `GET /api/viona/requests` → 404

| Hypothesis | Assessment |
| --- | --- |
| **H1 — Outdated staging deployment predates Pack16/20** | **Primary — supported** by deploy doc date, git ancestry, `1daf006:src/app.ts`, live 404 discriminant |
| **H2 — Wrong REST base / wrong backend** | **Unlikely — secondary**; REST login and `/health` 200 on intended staging host; wallet route mounted |
| **H3 — Route not mounted in repo master** | **Ruled out** — master has mount |
| **H4 — Unknown** | Retained only if redeploy fails to surface Pack16 routes |

**Verdict:** **Outdated staging deployment** on correct host `viona-api-staging-eu`.

---

## 8. Pack25 live QA gate status (unchanged by this audit)

| Gate | Status |
| --- | --- |
| Correct frontend checkout | **Resolved** |
| REST login | **Working** |
| Route `/viona-requests-live-inbox` | **Reached** |
| Staging API list route | **BLOCKED** — 404 on deployed build |
| Pack24 note submit live test | **Not reached** |
| Live operator sign-off | **Pending** |
| Pack24 failed | **NO** |
| Pack26 opened | **NO** |

---

## 9. Explicit non-scope (this evidence pack)

| Item | State |
| --- | --- |
| Code implemented | **NO** |
| Frontend modified | **NO** |
| Server/API modified | **NO** |
| Deployment performed | **NO** |
| Fly restart performed | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets inspected or printed | **NO** |
| `.env*` modified | **NO** |
| Deployment execution pack created | **NO** |
| Pack26 opened | **NO** |

---

## 10. Status flags

| Flag | Value |
| --- | --- |
| `pack25StagingApiDeploymentVersionAuditComplete` | `true` |
| `pack25StagingApiDeployedExactSha` | `unknown` |
| `pack25StagingApiRouteEraInference` | `pre_pack16_likely` |
| `pack25StagingApiVionaList404RootCause` | `outdated_staging_deployment` |
| `pack25LiveQaStatus` | `blocked` |
| `pack24Failed` | `false` |
| `pack26NoteWriteUiHardeningOpened` | `false` |
| `pack25LiveOperatorAttestationPending` | `true` |
| `allNonNoteWriteActionsBlocked` | `true` |

---

## 11. Recommended next lane (no execution in this pack)

| Step | Action | Execute now |
| --- | --- | --- |
| 1 | **Deployment authorization packet** (docs-only) — scope redeploy of `viona-api-staging-eu` from current master | **NO** — separate pack; not created in this evidence |
| 2 | **Route health check plan** — post-deploy: unauth viona → **401** (mounted); auth scoped list → **200**/empty; extend smoke with route-existence probes | Prep only |
| 3 | **No deploy/restart** until explicit operator authorization | **YES** — hard stop |
| 4 | After staging serves Pack16 routes, retry Pack25 live QA → Pack24 note submit → operator sign-off | Pending redeploy |

---

**Evidence:** `docs/design/evidence/cursor-pack25-staging-api-deployment-version-audit-evidence/README.md`
