# VIONA public staging HTTPS API — deployment evidence

**Pack:** `VIONA.STAGING.PUBLIC_API_DEPLOY.1` + `VIONA.STAGING.PUBLIC_API_DEPLOY.FOLLOWUP_HTTPS_SMOKE.1`
**Master before packs:** `8105c0e` → config `a904b64`
**Date:** 2026-05-22  
**Plan:** `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`

## Verdict

| Layer | Result |
|-------|--------|
| **Fly.io deploy (fra)** | **PASS** (operator) — app `viona-api-staging-eu` |
| **Deployment config in repo** | **READY** @ `0862e00`+ |
| **Public HTTPS URL** | `https://viona-api-staging-eu.fly.dev` |
| **`GET /health` (HTTPS)** | **PASS** — HTTP 200 |
| **HTTPS smoke (full)** | **BLOCKED** — all REST logins HTTP 500 (see debug pack below) |
| **API smoke (local parity)** | **PASS** — `http://127.0.0.1:8787` |

**Does not certify:** production launch, commercial/payment readiness, public HTTPS device matrix, or SOS production reliability.

---

## Follow-up pack (`FOLLOWUP_HTTPS_SMOKE.1`) — 2026-05-22

### Pre-checks (automation)

| Check | Result |
|-------|--------|
| `master` / `origin` | `a904b64` |
| `.env.local` tracked | No |
| Staging DB ref `euqbfanilcssjiwwtcby` in `DATABASE_URL`/`DIRECT_URL` | **PASS** (presence only) |
| `JWT_SECRET` / `VIONA_PILOT_PIN` present | **PASS** (length only; values not logged) |
| `flyctl auth whoami` | **FAIL** — `no access token available` |
| Fly config dir | `~/.fly/bin` exists; **no** `state.yml` (login not visible to agent shell) |

### Attempted steps

| Step | Result |
|------|--------|
| `node scripts/fly-staging-sync-secrets.mjs` | **FAIL** — same auth error (keys queued: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, CORS, etc.; values not printed) |
| `flyctl deploy --app viona-api-staging-eu` | **NOT RUN** (blocked by auth) |
| `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev` | **NOT RUN** |

### Docker build note (`API_DOCKER_NPM_CI_PEER_FIX.1`)

Fly `npm ci` in `Dockerfile.api` failed with **ERESOLVE** (`react-native-fast-image` peer `react ^17||^18` vs lockfile `react 19`). Fix @ master after `eca91bd`: `npm ci --legacy-peer-deps` in API image only (no `package.json` change). Redeploy with `flyctl deploy --app viona-api-staging-eu` then HTTPS smoke.

### Non-secret failure summary (auth blocker — prior automation run)

```
Error: no access token available. Please login with 'flyctl auth login'
```

**Note:** Operator may have logged in in a separate interactive terminal; Cursor agent subprocess does not inherit that session. Re-run deploy + smoke in the **same** shell where `flyctl auth whoami` succeeds, or set `FLY_API_TOKEN` for automation (never commit).

### Operator command block (run locally after `flyctl auth whoami` succeeds)

```powershell
cd c:\KNG\ket-noi-eu
node scripts/fly-staging-sync-secrets.mjs
flyctl deploy --app viona-api-staging-eu
node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev
```

Then in `.env.local` (not committed):

- `EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev`
- `EXPO_PUBLIC_DEV_REST_JWT` empty / removed
- `npx expo start -c`

Paste HTTPS smoke JSON into this doc and change verdict to **PASS** only when all rows pass.

---

## Login debug pack (`VIONA.STAGING.PUBLIC_API_SMOKE_LOGIN_DEBUG.1`) — 2026-05-20

Smoke script now logs per-persona stage detail (no PIN/JWT/secrets).

### HTTPS smoke (after deploy)

| Stage | Result |
|-------|--------|
| health | **PASS** — HTTP 200 |
| User A login | **FAIL** — HTTP 500 — `Authentication service unavailable` |
| User B login | **FAIL** — HTTP 500 — same |
| Merchant M login | **FAIL** — HTTP 500 — same |
| Merchant N login | **FAIL** — HTTP 500 — same |
| Local / inbox / confirm / decline | **NOT REACHED** |

### Likely root cause (ops, not app code change in this pack)

API maps HTTP 500 `Authentication service unavailable` to `server_misconfigured` when **`JWT_SECRET` is missing or &lt; 16 characters** on the Fly machine (`AuthService.loginWithPhoneAndPin`). All four personas fail identically → env/secret sync issue, not per-account PIN.

**Operator fix (no secrets logged):**

1. `fly secrets list --app viona-api-staging-eu` — confirm `JWT_SECRET` present.
2. Re-run `node scripts/fly-staging-sync-secrets.mjs` from repo with valid `.env.local` (staging ref + `JWT_SECRET` length ≥ 16).
3. `flyctl deploy --app viona-api-staging-eu` (or restart machines after secret import).
4. Re-run `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev`.

---

## Deployment target

| Field | Value |
|-------|--------|
| **Target** | Fly.io |
| **Region** | `fra` (Frankfurt) |
| **App name** | `viona-api-staging-eu` |
| **Expected public URL** | `https://viona-api-staging-eu.fly.dev` (after deploy) |

---

## Config files (@ `a904b64`)

| File | Purpose |
|------|---------|
| `fly.toml` | Fly app `viona-api-staging-eu`, `fra`, port `8080`, HTTPS forced |
| `Dockerfile.api` | Node 22 API image |
| `scripts/fly-staging-sync-secrets.mjs` | Staging secrets import (no value logs) |
| `scripts/smoke-public-staging-api.mjs` | Health + REST + Local no-charge smoke |

---

## Health check

| Check | Public HTTPS | Local parity (`127.0.0.1:8787`) |
|-------|----------------|----------------------------------|
| `GET /health` → `200` | **PASS** | **PASS** |
| No secrets in body | **PASS** | **PASS** |

---

## REST auth smoke

| Account | Public HTTPS | Local parity |
|---------|--------------|--------------|
| User A / B | **FAIL** (HTTP 500 misconfigured) | **PASS** |
| Merchant M / N | **FAIL** (HTTP 500 misconfigured) | **PASS** |
| Dev JWT required | — | **No** |

---

## Local no-charge smoke

| Check | Public HTTPS | Local parity |
|-------|--------------|--------------|
| Merchant M inbox | **NOT REACHED** | **PASS** |
| Merchant confirm | **NOT REACHED** | **PASS** |
| Merchant decline | **NOT REACHED** | **PASS** |
| Merchant N isolation | **NOT REACHED** | **PASS** |
| `walletMode` | — | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | — | `NONE` |
| Payment captured | — | **No** |
| Transaction / Wallet delta | — | **0** |

---

## CORS (planned on Fly)

Allowlist in `scripts/fly-staging-sync-secrets.mjs`: `localhost:8081`, `8089`, `127.0.0.1:8081`, `8089`. No wildcard production policy. Applied only after successful `fly secrets import`.

---

## Rollback

1. `EXPO_PUBLIC_REST_API_BASE` → `http://127.0.0.1:8787`
2. Scale down or destroy Fly app `viona-api-staging-eu`
3. No migrations in deploy packs

---

## Limitations (preserved)

- Not production / commercial / payment / escrow / payout / settlement
- Not full device matrix on public HTTPS
- Not merchant production onboarding
- Not AI autonomous money/SOS actions
- Not SOS dispatch or emergency-response claims
- Local **request-only / no-charge** only

---

## Next required action

1. Ensure Fly secret `JWT_SECRET` (≥ 16 chars) via `scripts/fly-staging-sync-secrets.mjs` + redeploy/restart.
2. Re-run HTTPS smoke; paste passing JSON here when all stages PASS.
3. Set `EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev`, clear dev JWT, `npx expo start -c`.
