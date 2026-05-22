# VIONA public staging HTTPS API — deployment plan

**Pack:** `VIONA.STAGING.PUBLIC_API_DEPLOY_PLAN.1`  
**Master / origin baseline:** `ea5e242` — kernel sync REST UI strict PASS @ `3cfea5e`  
**Date:** 2026-05-22  
**Type:** Planning / runbook only — **no deploy, no migrations, no env mutation in this pack**

## 1. Current proven baseline

| Item | Status |
|------|--------|
| **master / origin** | `ea5e242` (docs kernel sync); app auth bridge @ `f3fbc4a`; strict UI evidence @ `3cfea5e` |
| **Local no-charge staging / manual** | **PASS** — `docs/runbooks/VIONA_LOCAL_MANUAL_STAGING_EVIDENCE_2.md`, `VIONA_LOCAL_STAGING_PASS_HANDOFF.md` |
| **REST UI login strict proof** | **PASS** — `docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md` |
| **User A / User B REST UI login** | **PASS** (operator strict UI) |
| **Merchant M / N REST UI login** | **PASS** |
| **Merchant M inbox + confirm / decline UI** | **PASS** |
| **Merchant N ownership isolation** | **PASS** |
| **Logout / session clear** | **PASS** (UI) |
| **Forbidden commercial wording (Local UI)** | **PASS** (operator UI check) |
| **`EXPO_PUBLIC_DEV_REST_JWT` required** | **No** (strict UI proof) |

**Money law (unchanged):** Local `REQUEST_ONLY_NO_CHARGE`; `walletPhase` **NONE**; no payment captured; **Transaction delta 0**; **Wallet row delta 0**; no hold / debit / release / refund / settlement / payout / cash-out / escrow from Local lane.

**Does not certify:** production launch, commercial/payment readiness, full device matrix, merchant production onboarding, AI autonomous money/SOS actions.

---

## 2. Repo / server constraints (read-only)

| Constraint | Finding |
|------------|---------|
| **API runtime** | Long-lived **Node + Express** — `src/server.ts` → `createApp()` in `src/app.ts` |
| **Start command (today)** | `npm run api:dev` → `tsx src/server.ts` |
| **Default port** | `API_PORT` (default `8787`) |
| **Health** | `GET /health` → `200` JSON `{ success: true, data: { status: 'ok' } }` (no DB probe today) |
| **Auth** | `POST /api/auth/login` (phone + PIN); JWT via `Authorization: Bearer` |
| **Local routes** | `/api/local/*` (request-only / no-charge) |
| **CORS** | `API_CORS_ORIGINS` comma-list; if unset + `NODE_ENV=production` → **deny** cross-origin (`src/config/httpSecurity.ts`) |
| **Proxy** | `TRUST_PROXY_HOPS=1` recommended behind HTTPS reverse proxy (rate limit client IP) |
| **Socket.IO** | Signaling on **same HTTP server** as REST — needs persistent process (not pure serverless request/response) |
| **Staging DB** | Supabase PostgreSQL — project ref `euqbfanilcssjiwwtcby` (`viona-staging-eu`); prefer **EU / Frankfurt** pooler + direct URLs |
| **Vercel in repo** | `vercel.json` — **SPA static web only** (rewrites to `index.html`); **not** a fit for Express API |
| **Firebase Functions** | Separate `functions/` bundle — **out of scope** for this Express staging API cutover |

---

## 3. Deployment target options (comparison)

### A. Fly.io (`fra` or other EU region)

| | |
|--|--|
| **Pros** | EU regions (e.g. **Frankfurt `fra`**); HTTPS + TLS by default; secrets via `fly secrets`; persistent VM/container — **Socket.IO compatible**; simple rollback (previous release); scales to zero optional |
| **Cons** | Requires `fly.toml` + Dockerfile or buildpack discipline; ops learning curve if team new to Fly |
| **Secrets** | Platform secret store; never in git |
| **EU / staging DB** | **Good** — deploy app in `fra`, Supabase EU DB low latency |
| **Local-dev parity** | High — same `tsx`/Node process model |
| **CORS** | Set `API_CORS_ORIGINS` to Expo web + staging web origins |
| **Operational risk** | **Low–medium** — isolated staging app; no production DB if env points only to staging ref |
| **Verdict** | **Recommended candidate #1** |

### B. Railway (EU West / Frankfurt-aligned project)

| | |
|--|--|
| **Pros** | Very low ops; env UI; HTTPS default; long-running **web service** fits Express + Socket.IO; fast rollback |
| **Cons** | Billing/idle behavior varies by plan; less explicit multi-region control than Fly |
| **Secrets** | Railway variables (encrypted at rest) |
| **EU / staging DB** | **Good** when service region set to EU |
| **Local-dev parity** | High |
| **CORS** | Same `API_CORS_ORIGINS` pattern |
| **Operational risk** | **Low** for staging-only service |
| **Verdict** | **Recommended candidate #2** (simplest team onboarding) |

### C. Render (Frankfurt `eu-central` web service)

| | |
|--|--|
| **Pros** | Managed HTTPS; Frankfurt region available; familiar “Web Service” model; env groups |
| **Cons** | Free tier cold starts hurt Socket.IO / signaling; need always-on plan for pilot |
| **Secrets** | Render env (sync / secret files) |
| **EU / staging DB** | **Good** in EU region |
| **Local-dev parity** | High |
| **CORS** | Same allowlist |
| **Operational risk** | **Low–medium** |
| **Verdict** | **Acceptable** if always-on instance guaranteed |

### D. Vercel (serverless / static)

| | |
|--|--|
| **Pros** | Already used for static web export (`build:web`) |
| **Cons** | **Not compatible** with long-lived Express + Socket.IO monolith without major rewrite; serverless timeouts |
| **Verdict** | **Reject** for API (web static only) |

### E. Supabase Edge Functions

| | |
|--|--|
| **Pros** | Same vendor as staging Postgres |
| **Cons** | **Not compatible** with existing Express app surface (`/api/local`, middleware stack, Socket.IO) without full re-platform |
| **Verdict** | **Reject** for this API cutover (DB stays Supabase; API host elsewhere) |

### F. AWS ECS / ALB / self-managed VM

| | |
|--|--|
| **Pros** | Maximum control; EU regions |
| **Cons** | Highest ops burden; slower staging iteration |
| **Verdict** | **Defer** until platform team needs enterprise hosting |

---

## 4. Recommended target (plan only — do not deploy yet)

**Primary recommendation: Fly.io app in region `fra` (Frankfurt).**

**Rationale:**

1. **EU latency** aligned with Supabase staging (`euqbfanilcssjiwwtcby`) in Central Europe.
2. **HTTPS by default** with minimal certificate ops.
3. **Long-running process** — matches `src/server.ts` + Socket.IO on one port.
4. **Secrets** via `fly secrets set` — no values in repo.
5. **Rollback** — `fly releases` / redeploy previous image.
6. **Staging isolation** — dedicated Fly app `viona-api-staging-eu` (name TBD) with env wired only to staging `DATABASE_URL` / `JWT_SECRET`.
7. **Low production DB risk** — operator checklist: confirm connection string contains staging ref `euqbfanilcssjiwwtcby` before first deploy.

**Alternate (if team prefers GUI-first hosting): Railway EU web service** — same env contract, same CORS rules, `TRUST_PROXY_HOPS=1`.

---

## 5. Required environment variables (names only)

### API server (staging host — platform secrets)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | **Yes** | Staging Supabase pooler URL (must identify staging ref) |
| `DIRECT_URL` | **Yes** (ops/migrate) | Direct Postgres for Prisma migrate status/deploy — **not** for routine API traffic |
| `JWT_SECRET` | **Yes** | Min 16 chars; staging-only value |
| `JWT_EXPIRES_IN` | Optional | Default `7d` in code |
| `NODE_ENV` | **Yes** | `production` on public host (enables strict CORS when list set) |
| `API_PORT` | Optional | Host may inject `PORT` — map to `API_PORT` in start script if platform uses `PORT` |
| `API_CORS_ORIGINS` | **Yes** (staging) | Comma-separated browser origins (see §6) |
| `TRUST_PROXY_HOPS` | **Yes** | `1` behind Fly/Railway/Render proxy |
| `MARKETING_AUTO_POSTER_ENABLED` | Recommended | `0` on staging API |
| `PRISMA_LOG_QUERIES` | Optional | `0` / unset on staging |

### Email / AI / payments (optional on staging Local pilot)

| Variable | Notes |
|----------|-------|
| `AWS_REGION` | If email OTP routes tested |
| `AWS_ACCESS_KEY_ID` | Server only |
| `AWS_SECRET_ACCESS_KEY` | Server only |
| `AWS_SES_SENDER_EMAIL` / `MAIL_FROM` / `SES_FROM_EMAIL` | If OTP/email tested |
| `OPENAI_API_KEY` | Only if AI routes enabled on staging |
| `STRIPE_SECRET_KEY` | **Do not enable live capture** on staging Local pilot |
| `STRIPE_PUBLISHABLE_KEY` | Client/build only if needed |
| `VIONA_AI_RECEPTIONIST_LEAD_RECIPIENT_EMAIL` | Optional pilot relay |

### Client / Expo (operator `.env.local` — not committed)

| Variable | Notes |
|----------|-------|
| `EXPO_PUBLIC_REST_API_BASE` | **Must** point to public staging HTTPS API after deploy |
| `EXPO_PUBLIC_DEV_REST_JWT` | **Empty** for strict REST UI proof |
| `EXPO_PUBLIC_LOCAL_STAGING_WALKTHROUGH_UNLOCK` | Optional `false` when REST login works |
| `VIONA_PILOT_PIN` | Operator machine only — never server env |
| `EXPO_PUBLIC_FIREBASE_*` | If Firebase client surfaces used in walkthrough |
| `EXPO_PUBLIC_SIGNALING_URL` | If voice/signaling tested (align with API host) |

### Explicitly not in server env for Local no-charge pilot

- `EXPO_PUBLIC_*` (client bundle only)
- `VIONA_PILOT_PIN` (never log or deploy to server)

---

## 6. CORS / security plan

### Allowed origins (staging)

Configure `API_CORS_ORIGINS` (no wildcards for production domains):

- `http://localhost:8081` — Expo default
- `http://localhost:8089` — Expo alternate port (observed in local dev)
- `http://127.0.0.1:8081` / `http://127.0.0.1:8089` — web dev
- `https://<staging-expo-web-host>` — if using tunneled or deployed web preview (TBD at deploy)
- Optional: LAN Expo web URL pattern documented at deploy time (host:port only, no secrets)

**Reject:** `*` in production policy; do not add production consumer domains until a separate production pack.

### Auth / headers

- REST: `Authorization: Bearer <JWT>` from `POST /api/auth/login` only.
- **No JWT/PIN in client env** for strict proof — AsyncStorage `ketnoieu.restApi.jwt.v1` after UI login.
- Stripe webhook route exists — **disable or use test keys only** on staging; Local pilot does not require live payment webhooks.

### Rate limit / abuse

- Existing `pathAwareApiRateLimiter` on `/api/*` (in-memory per instance).
- `/health` bypasses rate limit (see `RateLimitMiddleware`).
- Staging recommendation: keep limits; monitor 429s during pilot; Redis **not** required for single staging instance.

### TLS / secrets

- HTTPS terminated at platform edge.
- All secrets in host secret store; rotate staging `JWT_SECRET` only with coordinated client logout.

---

## 7. Health / smoke endpoint plan

| Check | Expected |
|-------|----------|
| `GET /health` | `200`, body `{ "success": true, "data": { "status": "ok" } }` |
| No secrets in response | Confirm JSON contains no DB URL, JWT, or keys |
| DB connectivity (optional next pack) | Add read-only `prisma.$queryRaw` ping behind feature flag — **not required for plan** |
| `POST /api/auth/login` | Pilot phone + PIN → `200` + envelope success (no token logged) |
| `GET /api/local/requests` | With Bearer → `200` for User A |
| `GET /api/local/merchant/requests` | With Merchant M Bearer → Business M scope |
| Local no-charge smoke | `npx tsx scripts/test-local-no-charge-e2e-qa.ts` against staging `DATABASE_URL` + public API base |
| REST UI smoke | Login → PIN in Expo web with `EXPO_PUBLIC_REST_API_BASE=https://<staging-api>` |

**Failure policy:** If health fails, do not point operators at public base; keep `http://127.0.0.1:8787` fallback.

---

## 8. Rollback plan

| Step | Action |
|------|--------|
| 1 | Revert operator `EXPO_PUBLIC_REST_API_BASE` to `http://127.0.0.1:8787` (local API) |
| 2 | Scale staging Fly/Railway app to zero or destroy preview deployment |
| 3 | Remove public DNS / TLS hostname from client builds |
| 4 | Confirm **no** `prisma migrate deploy` was run as part of API deploy pack |
| 5 | Re-run Local smoke on local-dev API if needed |

**Data safety:** Rolling back API host does **not** roll back DB data; Local requests created on staging DB remain.

---

## 9. Next deployment pack proposal

**Pack ID:** `VIONA.STAGING.PUBLIC_API_DEPLOY.1`

| Step | Action |
|------|--------|
| 1 | Create staging Fly app (`fra`) or approved alternate |
| 2 | Set platform secrets (names in §5 only) — verify staging DB ref in `DATABASE_URL` |
| 3 | Add production start script if needed (`api:start` → `tsx src/server.ts`) |
| 4 | Deploy HTTPS service; map `PORT` → `API_PORT` if required |
| 5 | Set `API_CORS_ORIGINS`, `TRUST_PROXY_HOPS=1`, `NODE_ENV=production`, `MARKETING_AUTO_POSTER_ENABLED=0` |
| 6 | `GET /health` smoke |
| 7 | REST login smoke (User A + Merchant M phones; PIN from operator secret store) |
| 8 | Local no-charge API smoke (no wallet mutations) |
| 9 | Update operator `EXPO_PUBLIC_REST_API_BASE` to HTTPS URL; `npx expo start -c` |
| 10 | Optional: repeat strict UI checklist on HTTPS (device matrix still out of scope) |

**Explicitly out of scope for deploy pack:** wallet/payment capture, migrations without operator sign-off, production domains, commercial launch.

---

## 10. Explicit non-goals

- Not production launch or global go-live
- Not payment, escrow, settlement, payout, or commercial readiness
- Not full EN/VI device matrix or native HTTPS app store sign-off
- Not merchant production onboarding or KYC production rails
- Not AI autonomous booking/payment/SOS dispatch
- Not SOS production reliability or emergency response claims

---

## 11. Money / SOS / AI safety preservation

| Law | Preservation |
|-----|----------------|
| Local lane | `REQUEST_ONLY_NO_CHARGE` only |
| `walletPhase` | **NONE** |
| Merchant confirm/decline | Status only — **not** payment capture |
| Wallet / Transaction | No staging deploy pack may mutate ledger for Local pilot |
| AI | No self-execute money, SOS, legal, or merchant actions |
| SOS | No rescue, dispatch, or emergency-response claims from UI copy |

---

## 12. Related evidence

- `docs/operating/VIONA_PROJECT_KERNEL.md` — next pack pointer @ `ea5e242`
- `docs/runbooks/VIONA_AUTH_REST_UI_LOGIN_BRIDGE_STAGING_RETEST.md`
- `docs/runbooks/VIONA_LOCAL_STAGING_PASS_HANDOFF.md`
- `docs/runbooks/VIONA_LOCAL_STAGING_DB_MIGRATION_VERIFICATION_1.md`
- `src/config/httpSecurity.ts` — CORS contract
- `src/app.ts` — `/health` + `/api/*` mounts
