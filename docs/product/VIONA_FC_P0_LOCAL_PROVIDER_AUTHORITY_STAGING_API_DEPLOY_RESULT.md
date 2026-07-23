# VIONA FC-P0 — Staging API Deploy Result (E3)

**Primary classification:** `READY_FOR_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY_RESULT_PR_REVIEW`

**Secondary decision (canonical packet §9):** `READY_FOR_CONTROLLED_PROVIDER_REGISTRATION`

**Secondary meaning:** E4 route/schema compatibility may be separately considered. **Does not authorize E4** or any provider registration.

**Authorization:** `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY`

**Mode:** Controlled staging-only API deployment / stop-on-error / one deploy attempt / docs-evidence PR

**Canonical master (deploy source):** `de59110a6c9a1bfef7fc0d7c68be24513ffe9781`

**Branch:** `docs/viona-fc-p0-local-provider-authority-staging-api-deploy-result`

```text
E3_STAGING_API_DEPLOY_EXECUTED
E3_EXACT_PRE_DEPLOY_ROLLBACK_RELEASE_CAPTURED
FLY_RELEASE_V29_ACTIVE
SOURCE_DEPLOYED_FROM_CLEAN_CANONICAL_MASTER
POST_DEPLOY_HEALTH_200
UNAUTH_LOCAL_ROUTES_MOUNTED_401
PACK_A1_STAGING_MIGRATION_APPLIED_AND_HISTORY_CLEAN
PACK_A1_STRUCTURE_APPLIED_WITH_ZERO_PROVIDER_AND_AUDIT_ROWS
READY_FOR_CONTROLLED_PROVIDER_REGISTRATION
E4_THROUGH_E10_NOT_AUTHORIZED
NO_DATABASE_RELEASE_HOOK
NO_MIGRATION_SEED_OR_BACKFILL
NO_SECRET_OR_CONFIG_MUTATION
NO_PROVIDER_BUSINESS_USER_MUTATION
NO_AUTHENTICATED_LIVE_QA
NO_CLIENT_DEPLOY
ROLLBACK_NOT_REQUIRED
REQUEST_ONLY_NO_CHARGE
PACK40S_NOT_AUTHORIZED
APPLE_EAS_PHASE_D2_DEFERRED
PHASE_C_CLOSED_GREEN
```

---

## 1. Purpose

Deploy the canonical master API containing reviewed Local create + Local provider-authority enforcement to Fly staging after E2 Pack A1 apply verification.

This does **not** authorize or execute E4–E10.

---

## 2. Authorization / baseline

| Field | Value |
|---|---|
| Phrase | `APPROVE_VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_API_DEPLOY` |
| Prior E2 classification | `VIONA_FC_P0_LOCAL_PROVIDER_AUTHORITY_STAGING_MIGRATION_APPLY_RESULT_VERIFIED_ON_MASTER_WITH_E3_READY_FOR_AUTHORIZATION_DECISION_BUT_UNAUTHORIZED` |
| Deploy source SHA | `de59110a6c9a1bfef7fc0d7c68be24513ffe9781` |
| Workspace | `C:\KNG\ket-noi-eu` / `master` clean / = `origin/master` at deploy |

---

## 3. Staging target / production exclusion

| Field | Value |
|---|---|
| Fly app | `viona-api-staging-eu` |
| Region | `fra` |
| Stage | `staging` (`VIONA_DEPLOYMENT_STAGE=staging`) |
| Supabase | `viona-staging-eu` / `euqbfanilcssjiwwtcby` |

Independent signals: exact Fly app flag on every command; Fly env stage=`staging`; known staging DB ref from E1/E2.

---

## 4. Database release-hook gate

| Check | Result |
|---|---|
| `fly.toml` `release_command` | **Absent** |
| Dockerfile.api | `npx prisma generate` at **build** only; CMD `npx tsx src/server.ts` |
| Startup migrate/seed/backfill | **None** |

---

## 5. Pre-deploy release / rollback capture

| Field | Value |
|---|---|
| Pre-deploy release | **v28** |
| Pre-deploy image | `deployment-01KXN3M9E6NWTFAE5YMW60T9FH` |
| Pre-deploy digest | `sha256:bec511b18b97d9f168dcbff9537f63c8354e4a9c875698062310491876c601d5` |
| Machines | one started / one stopped (fra); version 28 |
| Pre-deploy `/health` | **HTTP 200** `{"success":true,"data":{"status":"ok"}}` |
| Exact rollback target | **v28** / same image tag (release active immediately before E3) |

**Result:** `E3_EXACT_PRE_DEPLOY_ROLLBACK_RELEASE_CAPTURED`

---

## 6. E2 database recheck (pre-deploy)

| Check | Result |
|---|---|
| `npx prisma migrate status` | schema **up to date**; exit 0 |
| Failed/partial | **0** |
| Eligibility rows | **0** |
| Audit rows | **0** |

---

## 7. Pre-deploy validation

| Command | Exit |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm run ci:expo-readiness` | **0** |
| `npm run ci:release-discipline` | **0** |

---

## 8. Deploy execution

| Field | Value |
|---|---|
| Sanitized command | `fly deploy --app viona-api-staging-eu --remote-only` |
| Source Git SHA | `de59110a6c9a1bfef7fc0d7c68be24513ffe9781` |
| Start UTC | `2026-07-23T10:45:07Z` |
| End UTC | `2026-07-23T10:48:14Z` |
| Exit | **0** |
| Attempts | **1** (no retry) |
| New image tag | `deployment-01KY798FWDYE8YM0ZD4QW98JP0` |
| New image digest | `sha256:b4c42e5cac509aa351bcd040763c1737162b2b44622a150f5da1d3d172700c75` |
| New release | **v29** (complete) |

Transient Fly smoke warning (listen-on-8080 before process bind) cleared; logs show API listening on port 8080; machines reached good state.

**Rollback:** not required (post-deploy health green).

---

## 9. Runtime source correlation

| Link | Evidence |
|---|---|
| Canonical Git SHA | clean `master` @ `de59110…` at deploy start |
| Build → image | remote-only deploy produced `deployment-01KY798FWDYE8YM0ZD4QW98JP0` / digest `b4c42e5c…` |
| Active Fly release | **v29** complete; machines on that image tag |
| Runtime health | `/health` 200 after activation |
| Image Labels | empty (no Git SHA label on artifact — same limitation as E1 v28) |

Defensible chain: clean canonical master → one staging remote-only deploy → new image/release v29 → healthy runtime. Source is **not** claimed from image labels alone.

---

## 10. Post-deploy health

| Check | Result |
|---|---|
| Fly release | v29 complete |
| Machines | version **29**; one started / one stopped (fra) |
| `/health` | **HTTP 200** |
| Crash loop | **None** observed |
| Schema-missing / migrate activity | **None** in bounded logs |
| API listen | log: listening on port 8080 |

---

## 11. Unauthenticated route-existence probes

Host: `https://viona-api-staging-eu.fly.dev` — no auth, no valid mutation payloads.

| Method | Path | Result |
|---|---|---|
| GET | `/health` | **200** |
| GET | `/api/local/providers` | **401** |
| POST | `/api/local/requests` | **401** |
| POST | `/api/local/ops/providers` | **401** |
| PATCH | `/api/local/ops/providers/:id` | **401** |
| POST | `…/activate` | **401** |
| POST | `…/suspend` | **401** (initial burst briefly **429** then recheck **401**) |
| POST | `…/retire` | **401** (initial burst briefly **429** then recheck **401**) |

No 404/5xx. No authenticated ops. No provider/request rows created by probes.

---

## 12. Post-deploy database safety

| Check | Result |
|---|---|
| `npx prisma migrate status` | schema **up to date**; exit 0 |
| Failed/partial | **0** |
| Eligibility rows | **0** |
| Audit rows | **0** |

---

## 13. Config / secret drift

| Item | Result |
|---|---|
| App name | unchanged `viona-api-staging-eu` |
| Region | unchanged `fra` |
| `VIONA_DEPLOYMENT_STAGE` | unchanged `staging` |
| Secrets mutated by E3 | **No** |
| DB binding mutated by E3 | **No** |

---

## 14. Commands not performed

Migrate deploy/resolve/db push; seed/backfill; secret/env mutation; scale; provider ops; Business/User mutation; authenticated live QA; Local create; client deploy; backup/restore; risk-acceptance grant; E4–E10.

---

## 15. Next-stage decision

Canonical planning packet §9 future green classification (verbatim):

`READY_FOR_CONTROLLED_PROVIDER_REGISTRATION`

**E4 authorized:** **No**  
E4 still requires separate operator authorization for route/schema compatibility work and does **not** authorize provider registration by itself.

Later unresolved (unchanged): E5 live ADMIN; E6 `BLOCKED_NO_SAFE_STAGING_BUSINESS_FIXTURE`; E8 staging client SHA unresolved; E7/E9/E10 unauthorized.

---

## 16. Governance

| Item | Status |
|---|---|
| `REQUEST_ONLY_NO_CHARGE` | Confirmed |
| Risk acceptance | NOT GRANTED / NOT INVOKED |
| Pack40S | NOT AUTHORIZED |
| Apple / EAS / Phase D2 | Deferred |
| Phase C | closed green |

---

## 17. Exactly one next operator action

**Strict-review this docs-only E3 result PR.**

Do **not** authorize E4 automatically.
