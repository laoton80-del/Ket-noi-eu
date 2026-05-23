# VIONA public staging HTTPS API — deployment evidence

**Pack:** `VIONA.STAGING.PUBLIC_API_DEPLOY.1` + follow-ups + `VIONA.STAGING.PUBLIC_API_DEPLOY.OPERATOR_PASS_SYNC.1`
**Master at operator PASS sync:** `714c410`
**Date:** 2026-05-20
**Plan:** `docs/runbooks/VIONA_PUBLIC_STAGING_API_DEPLOY_PLAN.md`

## Verdict

| Layer | Result |
|-------|--------|
| **Fly.io deploy (fra)** | **PASS** — app `viona-api-staging-eu`, region `fra` |
| **Deployment config in repo** | **READY** @ `714c410` |
| **Public HTTPS URL** | `https://viona-api-staging-eu.fly.dev` |
| **`GET /health` (HTTPS)** | **PASS** — HTTP 200 |
| **HTTPS smoke (full)** | **PASS** (operator attestation — see pass sync section) |
| **API smoke (local parity)** | **PASS** — `http://127.0.0.1:8787` |

**Does not certify:** production launch, commercial/payment readiness, public HTTPS device matrix, or SOS production reliability.

---

## Operator pass sync (`OPERATOR_PASS_SYNC.1`) — 2026-05-20

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
| Dev JWT required | **No** | **No** |

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

1. Point Expo at public API: `EXPO_PUBLIC_REST_API_BASE=https://viona-api-staging-eu.fly.dev`
2. Clear `EXPO_PUBLIC_DEV_REST_JWT`; `npx expo start -c`
3. Optional: REST UI strict proof on public HTTPS (device matrix still out of scope)
