# Evidence — FC-P0 E3 Staging API Deploy

## 1. Authorization

`APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY`

## 2. Canonical master (deploy source)

`de59110a6c9a1bfef7fc0d7c68be24513ffe9781`

## 3. Branch

`docs/viona-fc-p0-local-provider-authority-staging-api-deploy-result`

## 4. Changed paths (expected)

| Path | Purpose |
|---|---|
| `docs/product/VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY_RESULT.md` | Result packet |
| `docs/design/evidence/cursor-viona-fc-p0-local-provider-authority-staging-api-deploy/README.md` | This README |
| Planning packet E3 observed field | Mark E3 executed / E4 unauthorized |
| Kernel + Handoff | Sync |

## 5. Target (safe)

`viona-api-staging-eu` / `fra` / `staging` / `viona-staging-eu` / `euqbfanilcssjiwwtcby`

## 6–8. Pre-deploy

- Release **v28** / `deployment-01KXN3M9E6NWTFAE5YMW60T9FH` / digest `sha256:bec511b1…`
- Rollback target = exact v28
- `/health` 200
- Pack A1 applied; rows 0/0; no release_command / no migrate in Docker CMD

## 9. Deploy

| Field | Value |
|---|---|
| Command | `fly deploy --app viona-api-staging-eu --remote-only` |
| Start | `2026-07-23T10:45:07Z` |
| End | `2026-07-23T10:48:14Z` |
| Exit | `0` |
| Count | 1 |
| New release | **v29** |
| Image | `deployment-01KY798FWDYE8YM0ZD4QW98JP0` |
| Digest | `sha256:b4c42e5cac509aa351bcd040763c1737162b2b44622a150f5da1d3d172700c75` |

## 10–12. Post-deploy

Health 200; unauth Local routes 401 (not 404/5xx); migrate status up to date; eligibility/audit **0**; config stage unchanged; rollback **not** required.

## 13. Secondary

Canonical §9: `READY_FOR_CONTROLLED_PROVIDER_REGISTRATION` — **E4 not authorized**.

## 14–20. Boundaries

No secrets in docs; no migration/seed; no provider/Business/User mutation; no authenticated QA; no client deploy; `REQUEST_ONLY_NO_CHARGE`; Pack40S unauthorized; Apple/EAS/Phase D2 deferred.

## 21. Next action

Strict-review this docs-only PR. Do not authorize E4.

## Validation (docs PR)

| Command | Exit |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm run ci:expo-readiness` | **0** (PASS) |
| `npm run ci:release-discipline` | **0** |
