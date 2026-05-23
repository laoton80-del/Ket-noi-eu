# VIONA public staging HTTPS API — deployment evidence

**Pack:** deploy follow-ups + `HTTPS_SMOKE_CONSISTENCY.1` + `PUBLIC_API_SMOKE_RATE_LIMIT_PACING.1` + `PUBLIC_API_SMOKE_RATE_LIMIT_PACING.PASS_SYNC.1`
**Master at repeatable HTTPS smoke PASS:** `1daf006` (pacing script) + PASS sync doc
**Date:** 2026-05-23
**Plan:** `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`

## Verdict

| Layer | Result |
|-------|--------|
| **Fly.io deploy (fra)** | **PASS** — app `viona-api-staging-eu`, region `fra` |
| **Deployment config in repo** | **READY** @ `1daf006` |
| **Public HTTPS URL** | `https://viona-api-staging-eu.fly.dev` |
| **`GET /health` (HTTPS)** | **PASS** — HTTP 200 |
| **HTTPS smoke (full)** | **PASS** — full HTTPS smoke repeat PASS after pacing/backoff (see rate-limit pacing section) |
| **API smoke (local parity)** | **PASS** — `http://127.0.0.1:8787` |
| **Device matrix / Expo public HTTPS** | **Unblocked for staging pilot** — point `EXPO_PUBLIC_REST_API_BASE` at public URL; not full matrix certification |

**Does not certify:** production launch, commercial/payment readiness, public HTTPS device matrix, or SOS production reliability.

---

## Rate-limit pacing (`PUBLIC_API_SMOKE_RATE_LIMIT_PACING.1`) — 2026-05-23

**Root cause (prior FAIL):** Staging API rate limit **5 req/s per IP**; smoke burst exceeded limit → HTTP **429** on `merchantM:inbox` / `merchantN:inbox` (and potentially other stages). Server limit **unchanged**.

**Script fix (`scripts/smoke-public-staging-api.mjs`):**

| Behavior | Value |
|----------|--------|
| Pace between requests (public HTTPS) | **500ms** (300ms local HTTP) |
| HTTP 429 retry | Up to **3** retries; waits **1000 / 2000 / 3000ms** |
| Mutation safety | Retry **only** on 429 (before acceptance); no blind duplicate on success |

**Full HTTPS smoke repeat PASS after pacing/backoff** — exit 0 @ `https://viona-api-staging-eu.fly.dev` (2026-05-23):

| Stage | Result |
|-------|--------|
| health | **PASS** |
| User A / B / Merchant M / N login | **PASS** |
| user lists + merchant inboxes | **PASS** (no 429 after pacing) |
| isolation user B / merchant N | **PASS** |
| local create (confirm + decline targets) | **PASS** |
| merchant confirm / decline | **PASS** |
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| `paymentCaptured` | `false` |

Prior blockers resolved on Fly: `DATABASE_URL` runtime + `JWT_SECRET` (ops). Rate limit addressed in smoke only.

---

## PASS sync (`PUBLIC_API_SMOKE_RATE_LIMIT_PACING.PASS_SYNC.1`) — 2026-05-23

**Command:** `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev`

**Pre-check:** `master` == `origin` == `1daf006` (`chore(staging): pace public HTTPS smoke under rate limit`).

**Repeat smoke (PASS sync run):** exit **0**; `pacingMs` **500**; all stages PASS (matches pacing pack criteria below).

| Check | Result |
|-------|--------|
| health | **PASS** |
| REST auth User A / B / Merchant M / N | **PASS** |
| Dev JWT required | **No** |
| Local no-charge (create, confirm, decline) | **PASS** |
| Merchant M inbox | **PASS** |
| Merchant confirm / decline | **PASS** |
| Merchant N isolation | **PASS** |
| User B isolation | **PASS** |
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` |
| Payment captured | **No** |
| Transaction delta | **0** (not queried; no-charge path) |
| Wallet row delta | **0** (not queried; no-charge path) |

**Full HTTPS smoke repeat PASS after `1daf006` pacing/backoff** — confirmed on this sync run (second repeatable PASS after pacing commit).

### Aborted R6 background task (not evidence)

| Field | Value |
|-------|--------|
| Task | “Create R6 staging request via API” (background shell) |
| Status | **ABORTED** (~24h; no completion) |
| Output | **None** captured |
| Exit code | **Unknown** |
| Used as evidence | **No** |
| Superseded by | Paced public HTTPS smoke + Local create/confirm/decline stages in `smoke-public-staging-api.mjs` |

Do **not** cite the R6 one-off script run for staging proof. Use paced smoke or a fresh explicit operator run if a dedicated R6 row is needed for UI.

---

## HTTPS smoke consistency (`HTTPS_SMOKE_CONSISTENCY.1`) — 2026-05-23 (historical FAIL)

**Goal:** Confirm full public HTTPS smoke is repeatably PASS after evidence commit `cadc93f`.

**Result:** **FAIL** at `0cf119f` (DATABASE_URL not set at runtime on Fly). **Superseded** by ops fix + pacing pack repeatable PASS above.

### Pre-checks

| Check | Result |
|-------|--------|
| `master` / `origin` | `cadc93f` |
| `.env.local` tracked | **No** (`.gitignore`) |
| Secrets printed | **No** |

### Fly (non-secret)

| Check | Result |
|-------|--------|
| `fly auth whoami` | **PASS** (identity only; not logged) |
| App | `viona-api-staging-eu`, region `fra` |
| Machines | **1 started**, **1 stopped** (as of check) |
| Secret keys (names only) | `API_CORS_ORIGINS`, `AWS_ACCESS_KEY_ID`, `AWS_REGION`, `AWS_SECRET_ACCESS_KEY`, `AWS_SES_SENDER_EMAIL`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `MARKETING_AUTO_POSTER_ENABLED`, `NODE_ENV`, `TRUST_PROXY_HOPS` |
| `JWT_SECRET` key | **Present** (deployed) |
| `DATABASE_URL` key | **Present** in secrets list (deployed name only; runtime see logs) |

### Health

`GET https://viona-api-staging-eu.fly.dev/health` → **200** `{"success":true,"data":{"status":"ok"}}`

### Repeat smoke (`node scripts/smoke-public-staging-api.mjs …`)

| Stage | Result |
|-------|--------|
| health | **PASS** — HTTP 200 |
| User A | **FAIL** — HTTP 500 — `Unexpected error` — `POST /api/auth/login` |
| User B | **FAIL** — HTTP 500 — same |
| Merchant M | **FAIL** — HTTP 500 — same |
| Merchant N | **FAIL** — HTTP 500 — same |
| Local / inbox / confirm / decline / isolation | **NOT REACHED** |

**Consistency blocker:** Operator attestation recorded @ `cadc93f`, but **repeat smoke still fails** for all four personas with identical HTTP 500.

### Fly log summary (non-secret, 2026-05-23)

On `POST /api/auth/login`, app logs `LỖI postLogin` with:

`DATABASE_URL is not set. Configure it before calling getPrisma() in a Node context.`

Stack: `createClient` → `getPrisma` → `loginWithPhoneAndPin` → `postLogin`.

**Interpretation:** `/health` does not use Prisma; login does. Secret name `DATABASE_URL` appears in `fly secrets list`, but the **running machine process does not have `DATABASE_URL` in env** (or value empty). Likely stale/partial secret rollout, manual `JWT_SECRET` set without re-importing DB URL, or traffic to an under-provisioned machine.

### Recommended next fix pack (ops)

1. `node scripts/fly-staging-sync-secrets.mjs` (staging ref guard; no value logs).
2. `fly machines list --app viona-api-staging-eu` — ensure **both** app machines **started** and same secret version.
3. `fly secrets list --app viona-api-staging-eu` — confirm `DATABASE_URL` / `DIRECT_URL` digests updated after import.
4. `fly deploy --app viona-api-staging-eu` or rolling restart all machines.
5. Re-run HTTPS smoke until exit 0; then update this doc with “Full HTTPS smoke repeat PASS after …”.

---

## Operator pass sync (`OPERATOR_PASS_SYNC.1`) — 2026-05-20 (superseded for repeatability)

**Status:** Historical attestation only — **not** current repeatable PASS (see consistency section above).

**Operator attestation:** Fly `JWT_SECRET` corrected and full public HTTPS smoke re-run **PASS** (exit 0).
**Prior blocker:** HTTP 500 `Authentication service unavailable` (`server_misconfigured` — missing/short `JWT_SECRET` on Fly).
**Resolution (no secret values logged):** `fly secrets` sync + machine restart/deploy; `JWT_SECRET` length ≥ 16 on app `viona-api-staging-eu`.

### Public HTTPS smoke summary (operator-verified; secrets redacted)

```json
{
  "base": "https://viona-api-staging-eu.fly.dev",
  "https": true,
  "health": "PASS",
  "restAuth": "PASS",
  "userBIsolation": "PASS",
  "merchantNIsolation": "PASS",
  "merchantMInbox": "PASS",
  "confirm": "PASS",
  "decline": "PASS",
  "walletMode": "REQUEST_ONLY_NO_CHARGE",
  "walletPhase": "NONE",
  "paymentCaptured": false
}
```

| # | Check | Public HTTPS |
|---|--------|--------------|
| 1 | Deploy PASS | **PASS** |
| 2 | Health check | **PASS** |
| 3 | REST auth User A / B / Merchant M / N | **PASS** |
| 4 | Dev JWT not required | **PASS** |
| 5 | Local no-charge smoke | **PASS** |
| 6 | Merchant M inbox | **PASS** |
| 7 | Merchant confirm | **PASS** |
| 8 | Merchant decline | **PASS** |
| 9 | Merchant N isolation | **PASS** |
| 10 | `walletMode` | `REQUEST_ONLY_NO_CHARGE` |
| 11 | `walletPhase` | `NONE` |
| 12 | Payment captured | **No** |
| 13 | Transaction delta | **0** (not queried by public smoke; no charge path) |
| 14 | Wallet row delta | **0** (not queried by public smoke; no charge path) |

**Pilot accounts (labels only):** User A `+420910000001`, User B `+420910000002`, Merchant M `+420920000001`, Merchant N `+420920000002`, Business M `257f467a-8de2-41d0-b171-5ee499ba96d2`.

---

## Historical — automation / pre-fix runs

### Follow-up pack (`FOLLOWUP_HTTPS_SMOKE.1`) — 2026-05-22

| Check | Result |
|-------|--------|
| `flyctl auth whoami` (agent shell) | **FAIL** — no token in automation |
| HTTPS smoke (agent) | **NOT RUN** initially |

### Login debug pack (`PUBLIC_API_SMOKE_LOGIN_DEBUG.1`) — 2026-05-20

| Stage | Result (pre-fix) |
|-------|------------------|
| health | **PASS** |
| All REST logins | **FAIL** — HTTP 500 `Authentication service unavailable` |

Root cause: Fly `JWT_SECRET` misconfiguration. Fixed per operator pass sync above.

---

## Deployment target

| Field | Value |
|-------|--------|
| **Target** | Fly.io |
| **Region** | `fra` (Frankfurt) |
| **App name** | `viona-api-staging-eu` |
| **Public URL** | `https://viona-api-staging-eu.fly.dev` |

---

## Config files

| File | Purpose |
|------|---------|
| `fly.toml` | Fly app `viona-api-staging-eu`, `fra`, port `8080`, HTTPS forced |
| `Dockerfile.api` | Node 22 API image (`npm ci --legacy-peer-deps`) |
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
| User A / B | **PASS** | **PASS** |
| Merchant M / N | **PASS** | **PASS** |
| Dev JWT required | **No** (smoke uses PIN login) | **No** |

---

## Local no-charge smoke

| Check | Public HTTPS | Local parity |
|-------|--------------|--------------|
| Merchant M inbox | **PASS** | **PASS** |
| Merchant confirm | **PASS** | **PASS** |
| Merchant decline | **PASS** | **PASS** |
| Merchant N isolation | **PASS** | **PASS** |
| User B isolation | **PASS** | **PASS** |
| `walletMode` | `REQUEST_ONLY_NO_CHARGE` | `REQUEST_ONLY_NO_CHARGE` |
| `walletPhase` | `NONE` | `NONE` |
| Payment captured | **No** | **No** |
| Transaction / Wallet delta | **0** (not queried; no-charge path) | **0** |

---

## CORS (Fly)

Allowlist in `scripts/fly-staging-sync-secrets.mjs`: `localhost:8081`, `8089`, `127.0.0.1:8081`, `8089`. No wildcard production policy.

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

1. Set `EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev` in `.env.local` (not committed).
2. Clear `EXPO_PUBLIC_DEV_REST_JWT`; `npx expo start -c`.
3. Optional staging UI walkthrough on public HTTPS (not full device-matrix certification).
4. Re-run paced smoke after deploys: `node scripts/smoke-public-staging-api.mjs https://viona-api-staging-eu.fly.dev`.
