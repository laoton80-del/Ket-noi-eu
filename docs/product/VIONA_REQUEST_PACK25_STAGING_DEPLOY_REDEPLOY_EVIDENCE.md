# VIONA Request Engine — Pack25 Staging Deploy/Redeploy Execution Evidence

**Document type:** Controlled staging API deploy/redeploy execution evidence (docs-only — records prior authorized execution; no deploy in this pack).
**Packet ID:** `CURSOR_PACK25_STAGING_DEPLOY_REDEPLOY_EVIDENCE_DOCS_ONLY`
**Baseline:** `origin/master @ c8bdf87` — `docs(pack25): prepare staging deploy ui live qa authorization (#184)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_STAGING_DEPLOY_UI_LIVE_QA_POST_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_STAGING_REDEPLOY_EXECUTION_EVIDENCE.md`, `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`, `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_EVIDENCE.md`

---

## 1. Evidence summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Docs-only evidence pack | **YES** |
| Verified master | **`c8bdf87`** |
| Pack25 staging deploy UI live QA POST authorization packet (PR #184) | **GREEN** on master |
| Operator execution authorization present | **YES** — staging deploy/redeploy only; no live QA POST |
| Target app | **`viona-api-staging-eu`** |
| Deploy performed (prior authorized session) | **YES** |
| Deploy result | **SUCCESS** |
| New image | `deployment-01KWAZTCB1E78KZWXBEMSJBG1G` |
| UI live QA / Send to review click | **NO** |
| Authenticated status POST | **NO** |
| Staging data mutated | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Secrets/JWT/PIN/Auth headers/database URLs printed | **NO** |
| `.env*` changed | **NO** |
| Code changed in this pack | **NO** |
| Production deploy | **NO** |
| Pack26 opened | **NO** |

**This evidence pack records** a prior authorized staging deploy/redeploy session for Pack25 controlled status-action UI live QA preparation. It does **not** re-run deploy, Fly restart, live QA, authenticated status POST, or Send to review click.

---

## 2. Prior gate progression

| Prior gate | Status before redeploy |
| --- | --- |
| Pack25 controlled status-action UI implementation | **CLOSED / GREEN** — PR #180 |
| Pack25 visual confirmation + Kernel/Handoff sync | **CLOSED / GREEN** — PR #182, #183 |
| Pack25 staging deploy + UI live QA POST authorization packet | **GREEN** — PR #184 @ `c8bdf87` |
| Staging UI live action loop verified after deploy | **NO** — gap documented in authorization packet |
| Staging API image aligned with verified master | **UNKNOWN** until redeploy |
| UI live QA POST | **NOT AUTHORIZED** in deploy-only execution phrase |

---

## 3. Operator execution authorization (record only)

Execution was authorized by a **separate explicit operator message** in-session, scoped to:

| Constraint | Required |
| --- | --- |
| Staging-only deploy/redeploy | **YES** |
| Target app `viona-api-staging-eu` only | **YES** |
| Verified master `c8bdf87` | **YES** |
| Pack25 controlled status-action UI live QA preparation | **YES** (API route readiness only) |
| No UI live QA / Send to review click | **YES** |
| No status action route call (authenticated) | **YES** |
| No staging data mutation | **YES** |
| No production / DB migration / schema change | **YES** |
| No row create/seed/reset/rollback | **YES** |
| No `.env*` mutation | **YES** |
| No secrets printed/inspected | **YES** |
| Pack26 not opened | **YES** |

---

## 4. Controlled execution result (prior session — no secrets recorded)

### 4.1 Preflight

| Check | Result |
| --- | --- |
| `origin/master` aligned with `c8bdf87` | **YES** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |

### 4.2 Deploy

| Field | Value |
| --- | --- |
| Source commit | **`c8bdf87`** |
| Target app | **`viona-api-staging-eu`** |
| Scope | **Staging only** |
| Mechanism | `fly deploy --app viona-api-staging-eu --remote-only` |
| New image | `deployment-01KWAZTCB1E78KZWXBEMSJBG1G` |
| Rolling update | **2/2** machines updated |
| DNS verification | **PASS** |
| Outcome | **SUCCESS** |

**Note:** Pack25 controlled status-action UI is frontend code; live QA uses local Expo from verified master pointing at `https://viona-api-staging-eu.fly.dev`. This redeploy updated the **staging API** only.

### 4.3 Post-deploy route availability (non-mutating, unauthenticated)

No auth tokens, JWTs, PINs, Authorization headers, or secret values recorded.

| Step | Request | Pass criterion | Observed |
| --- | --- | --- | --- |
| A1 | `GET /health` | HTTP **200** | **200** |
| A2 | `GET /api/viona/requests` (no Authorization header) | HTTP **401** (not generic **404**) | **401** |
| A3 | `POST /api/viona/requests/<placeholder>/actions/status` (no Authorization header) | HTTP **401** (not generic **404**) | **401** |

**Route mount discriminant:** **PASS** — generic **404** would indicate status route not mounted; **401** confirms route table includes Pack16 list and Pack25 status action endpoints.

### 4.4 Explicitly not performed

| Action | Performed |
| --- | --- |
| UI live QA / Send to review click | **NO** |
| Authenticated owner `submitted` → `triage` transition | **NO** |
| Pilot login / authentication | **NO** |
| Idempotency replay test | **NO** |
| Status event / audit event verification (live) | **NO** |
| Request row create/seed/reset/rollback | **NO** |
| Production deploy | **NO** |
| Fly restart outside deploy | **NO** |
| Pack26 work | **NO** |

---

## 5. Scope compliance (prior session)

| Check | Result |
| --- | --- |
| Production deploy | **NO** |
| UI live QA / Send to review click | **NO** |
| Authenticated status POST | **NO** |
| Authentication / pilot login | **NO** |
| DB migrations / schema change | **NO** |
| Row create/seed/reset/rollback | **NO** |
| Staging data mutation | **NO** |
| `.env*` changed | **NO** |
| Secrets/JWT/PIN/Auth headers/database URLs printed | **NO** |
| Pack26 opened | **NO** |

---

## 6. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Deploy performed in this evidence pack | **NO** |
| Fly restart performed in this evidence pack | **NO** |
| Live QA run in this evidence pack | **NO** |
| Status POST called in this evidence pack | **NO** |
| Send to review clicked in this evidence pack | **NO** |
| Staging endpoint called in this evidence pack | **NO** |
| Staging data mutated in this evidence pack | **NO** |
| DB/Prisma/Supabase/SQL commands run in this evidence pack | **NO** |
| Secrets/JWT/PIN/Auth headers/database URLs printed | **NO** |
| `.env*` changed | **NO** |
| Server/API/UI code changed | **NO** |
| Prisma schema/migrations changed | **NO** |
| Production deploy | **NO** |
| Pack26 opened | **NO** |

---

## 7. Current status and next gate

| Field | Value |
| --- | --- |
| Staging API | **Redeployed** from verified master; **route-ready** |
| UI live QA POST | **NOT authorized** |
| Pack26 | **NOT opened** |

**Next gate:** Pre-live-QA row gate — confirm visual-QA row titled `Pack25 status action UI visual QA — submitted affordance check` is still **`submitted`**; if missing, **STOP / BLOCKED**. Then await **separate operator authorization** for owner-auth single Send to review click and live QA POST evidence.

---

**Evidence:** `docs/design/evidence/cursor-pack25-staging-deploy-redeploy-evidence/README.md`
