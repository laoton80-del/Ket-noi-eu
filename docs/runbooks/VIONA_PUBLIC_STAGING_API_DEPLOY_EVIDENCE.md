# VIONA public staging HTTPS API — deployment evidence

**Pack:** `VIONA.STAGING.PUBLIC_API_DEPLOY.1` + `VIONA.STAGING.PUBLIC_API_DEPLOY.FOLLOWUP_HTTPS_SMOKE.1`
**Master before packs:** `8105c0e` → config `a904b64`
**Date:** 2026-05-22  
**Plan:** `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`

## Verdict

| Layer | Result |
|-------|--------|
| **Fly.io deploy (fra)** | **BLOCKED** — no Fly access token in automation shell |
| **Deployment config in repo** | **READY** @ `a904b64` |
| **Public HTTPS URL** | **N/A** — deploy not executed |
| **HTTPS smoke** | **NOT RUN** |
| **API smoke (local parity)** | **PASS** @ `a904b64` — `http://127.0.0.1:8787` |

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

### Non-secret failure summary

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
| `GET /health` → `200` | **NOT RUN** | **PASS** |
| No secrets in body | **NOT RUN** | **PASS** |

---

## REST auth smoke

| Account | Public HTTPS | Local parity |
|---------|--------------|--------------|
| User A / B | **NOT RUN** | **PASS** |
| Merchant M / N | **NOT RUN** | **PASS** |
| Dev JWT required | — | **No** |

---

## Local no-charge smoke

| Check | Public HTTPS | Local parity |
|-------|--------------|--------------|
| Merchant M inbox | **NOT RUN** | **PASS** |
| Merchant confirm | **NOT RUN** | **PASS** |
| Merchant decline | **NOT RUN** | **PASS** |
| Merchant N isolation | **NOT RUN** | **PASS** |
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

1. In operator PowerShell: `flyctl auth whoami` must succeed.
2. Run operator command block above; capture smoke JSON.
3. Re-open `FOLLOWUP_HTTPS_SMOKE` or paste results to update this doc to **PASS**.
