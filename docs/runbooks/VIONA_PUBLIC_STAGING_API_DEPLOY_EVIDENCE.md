# VIONA public staging HTTPS API — deployment evidence

**Pack:** `VIONA.STAGING.PUBLIC_API_DEPLOY.1`  
**Master before pack:** `8105c0e`  
**Date:** 2026-05-22  
**Plan:** `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`

## Verdict

| Layer | Result |
|-------|--------|
| **Fly.io deploy (fra)** | **BLOCKED** — `flyctl` not authenticated in automation (`flyctl auth login` required) |
| **Deployment config in repo** | **READY** — `fly.toml`, `Dockerfile.api`, `.dockerignore`, helper scripts |
| **Public HTTPS URL** | **N/A** — no deploy executed |
| **API smoke (local parity)** | **PASS** — `http://127.0.0.1:8787` (same codebase + staging DB env) |

**Does not certify:** production launch, commercial/payment readiness, public HTTPS device matrix, or SOS production reliability.

---

## Deployment target

| Field | Value |
|-------|--------|
| **Target** | Fly.io |
| **Region** | `fra` (Frankfurt) |
| **App name** | `viona-api-staging-eu` |
| **Public HTTPS URL** | *Not deployed — set after `flyctl deploy`* |

---

## Config files added (safe to commit)

| File | Purpose |
|------|---------|
| `fly.toml` | Fly app `viona-api-staging-eu`, `fra`, HTTP on internal port `8080`, HTTPS forced |
| `Dockerfile.api` | Node 22 image: `npm ci`, `prisma generate`, `tsx src/server.ts` |
| `.dockerignore` | Exclude client/assets/docs from API image |
| `package.json` | `api:start` script |
| `src/server.ts` | Read `PORT` (Fly) then `API_PORT` then `8787` |
| `scripts/fly-staging-sync-secrets.mjs` | Import secrets from operator `.env.local` (no values logged) |
| `scripts/smoke-public-staging-api.mjs` | Health + REST + Local no-charge smoke |

---

## Operator deploy steps (when unblocked)

1. `flyctl auth login`
2. `flyctl apps create viona-api-staging-eu` (if not exists) or `flyctl launch --no-deploy` once
3. Confirm `DATABASE_URL` / `DIRECT_URL` contain staging ref `euqbfanilcssjiwwtcby` only
4. `node scripts/fly-staging-sync-secrets.mjs`
5. `flyctl deploy --app viona-api-staging-eu`
6. Note public URL: `https://viona-api-staging-eu.fly.dev` (or custom hostname)
7. `node scripts/smoke-public-staging-api.mjs https://<public-host>`
8. Operator `.env.local`: `EXPO_PUBLIC_REST_API_BASE=https://<public-host>` (no `EXPO_PUBLIC_DEV_REST_JWT`)
9. `npx expo start -c`

---

## Health check

| Check | Public HTTPS | Local parity (`127.0.0.1:8787`) |
|-------|----------------|----------------------------------|
| `GET /health` → `200` | **NOT RUN** | **PASS** |
| No secrets in body | **NOT RUN** | **PASS** (`success` + `status: ok` only) |

---

## REST auth smoke

| Account | Public HTTPS | Local parity |
|---------|--------------|--------------|
| User A | **NOT RUN** | **PASS** (`B2C`) |
| User B | **NOT RUN** | **PASS** |
| Merchant M | **NOT RUN** | **PASS** (`B2B_EU`) |
| Merchant N | **NOT RUN** | **PASS** |
| Dev JWT required | **No** (when using phone + PIN smoke) | **No** |

---

## Local no-charge smoke (local parity)

| Check | Result |
|-------|--------|
| User B isolation | **PASS** |
| Merchant M inbox | **PASS** |
| Merchant confirm | **PASS** |
| Merchant decline | **PASS** |
| Merchant N isolation | **PASS** |
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| Payment captured | **No** |
| Transaction / Wallet delta | **0** (staging lane; no ledger mutations from smoke) |

Command: `node scripts/smoke-public-staging-api.mjs http://127.0.0.1:8787`

---

## CORS (planned on Fly)

`API_CORS_ORIGINS` (non-secret allowlist in `scripts/fly-staging-sync-secrets.mjs`):

- `http://localhost:8081`
- `http://localhost:8089`
- `http://127.0.0.1:8081`
- `http://127.0.0.1:8089`

Plus staging web origin when known — add before device HTTPS walkthrough. **No wildcard production policy.**

Server: `TRUST_PROXY_HOPS=1`, `NODE_ENV=production`, `MARKETING_AUTO_POSTER_ENABLED=0`.

---

## Rollback

1. Point `EXPO_PUBLIC_REST_API_BASE` back to `http://127.0.0.1:8787`
2. `flyctl apps destroy viona-api-staging-eu` or scale to 0 (operator choice)
3. No migrations were run in this pack

---

## Blocker detail

```
flyctl auth whoami → no access token available. Please login with 'flyctl auth login'
```

Automation cannot complete HTTPS deploy without operator Fly credentials.

---

## Limitations (preserved)

- Not production / commercial / payment / escrow / payout / settlement
- Not full device matrix on public HTTPS
- Not merchant production onboarding
- Not AI autonomous money/SOS actions
- Not SOS dispatch or emergency-response claims
- Local remains **request-only / no-charge** only

---

## Next required action

1. Operator: `flyctl auth login` → deploy → re-run smoke with `https://` base URL.
2. Update this doc with public URL + HTTPS smoke **PASS** rows.
3. Optional follow-up pack: `VIONA.STAGING.PUBLIC_API_DEPLOY.FOLLOWUP.1` (evidence only after real deploy).
