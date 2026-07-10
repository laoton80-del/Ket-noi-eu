# VIONA Request Engine — Pack29 Staging API Redeploy Authorization Packet

**Document type:** Human review / authorization packet (docs-only — no deploy/restart, no staging QA, no API calls, no row create/seed, no implementation, live QA, staging endpoint calls, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK29_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET_DOCS_ONLY`
**Packet name:** `VIONA_REQUEST_PACK29_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET`
**Source master:** `origin/master @ 58a0a7d4c42b43a767dc4bf962c2f12dae9bd410` (`58a0a7d`)
**Status:** `pack29_staging_api_redeploy_authorization_planning_only`
**Result classification:** `PACK29_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET_PREPARED_ONLY`
**Related:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/product/VIONA_REQUEST_PACK29_STAGING_QA_EXECUTION_PREVIEW_RESULT.md`, `docs/design/evidence/cursor-pack29-kernel-handoff-sync-after-staging-qa-blocked-redeploy-required/README.md`

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Staging API redeploy authorized | **NO** |
| Deploy/restart authorized | **NO** |
| Staging QA authorized | **NO** |
| execution-preview POST authorized (this pack) | **NO** |
| Row create/seed authorized | **NO** |
| Staging data mutation authorized | **NO** |
| Real execution authorized | **NO** |
| DB write authorized | **NO** |
| Production authorized | **NO** |
| Automation authorized | **NO** |

**This packet authorizes human review / planning for a future bounded Pack29 staging API redeploy path only.** It does **not** authorize deploy/restart, staging QA execution, API calls, row creation, DB writes, real execution, external side effects, live QA mutation, staging endpoint calls, or production behavior.

---

## 2. Baseline — current verified master and Pack29 chain

| Item | State |
| --- | --- |
| Current verified master | **`58a0a7d4c42b43a767dc4bf962c2f12dae9bd410`** (`58a0a7d`) |
| Pack29 Kernel/Handoff sync after blocked QA result PR #262 | **MERGED / VERIFIED PASS** @ `58a0a7d` |
| Pack29 Kernel/Handoff sync result | **`PACK29_KERNEL_HANDOFF_SYNC_AFTER_STAGING_QA_BLOCKED_REDEPLOY_REQUIRED`** |
| Pack29 staging QA blocked-safe result PR #261 | **MERGED / VERIFIED PASS** @ `f9a7afd` |
| Pack29 staging QA result | **`BLOCKED_STAGING_ROUTE_NOT_DEPLOYED_REDEPLOY_REQUIRED`** |
| Pack29 authorization/design PR #251 | **MERGED / VERIFIED** |
| Pack29 implementation approval phrase intake PR #253 | **MERGED / VERIFIED** |
| Pack29 Kernel/Handoff sync PR #254 | **MERGED / VERIFIED** @ `e1d83ea` |
| Pack29 staging-first execution gate PR #255 | **MERGED / VERIFIED PASS** @ `7864430` |
| Pack29 Kernel/Handoff sync PR #256 | **MERGED / VERIFIED PASS** @ `4065d83` |
| Pack29 staging QA authorization PR #257 | **MERGED / VERIFIED PASS** @ `444d5e4` |
| Pack29 Kernel/Handoff sync PR #258 | **MERGED / VERIFIED PASS** @ `ff0ba53` |
| Pack29 staging QA approval phrase intake PR #259 | **MERGED / VERIFIED PASS** @ `4695ae4` |
| Pack29 Kernel/Handoff sync after staging QA phrase PR #260 | **MERGED / VERIFIED PASS** @ `a52937e` |
| Pack29 execution-preview route on master | **`POST /api/viona/requests/:id/actions/execution-preview`** |
| Pack29 execution-preview mode | **dry-run / no-op only** |
| Pack29 real execution | **BLOCKED** |
| Pack29 persistent audit write | **NO** |
| Pack25 Option C hold | **PRESERVED** — row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |

---

## 3. Strategic intent

| Principle | Record |
| --- | --- |
| Pack29 on master | Staging-first execution gate implemented — dry-run execution-preview route present in source |
| Pack29 gap | Staging QA preflight **blocked** — authenticated execution-preview returned **404** on current staging build |
| Pack29 redeploy role | **Authorization/planning only** for a future **separately authorized** staging-only redeploy of **`viona-api-staging-eu`** |
| Production claim | **NO** — redeploy is staging-only; production remains forbidden |

This packet is **not** redeploy execution. It is **not** staging QA execution. It is planning authorization for human review of a future scoped staging API redeploy — subject to separate operator phrase, redeploy execution pack, and post-redeploy verification before any bounded execution-preview QA re-run.

---

## 4. Purpose

Authorize a **future staging-only redeploy** of **`viona-api-staging-eu`** so the Pack29 execution-preview route merged on master becomes available at runtime for bounded execution-preview staging QA.

| Field | Value |
| --- | --- |
| Staging target | **`viona-api-staging-eu`** |
| Public host (runbook) | **`viona-api-staging-eu.fly.dev`** |
| Redeploy target source | **`58a0a7d`** or later verified master at execution time |
| Route needed | **`POST /api/viona/requests/:id/actions/execution-preview`** |
| Redeploy scope | **Staging only** — no production |

---

## 5. Current blocker (from PR #261)

| Item | Value |
| --- | --- |
| Staging source **`a52937e`+ / `f9a7afd`+ / `58a0a7d`+** confirmed | **NO** |
| Active Fly release image (non-secret) | **`deployment-01KWZE6B33B806T8Q0NQVBM401`** |
| Documented deploy commit for that image | **`9deb6a523387cf5a34b298c8e619fe9c76889255`** (`9deb6a5`) — Pack19 R1 staging redeploy era |
| Blocker | Active staging deploy predates Pack29 execution gate (`7864430`) and current verified master (`58a0a7d`) |

### Observed staging behavior (PR #261 — preserved)

| Check | Result |
| --- | --- |
| `GET /health` | **200** — staging API reachable |
| Unauth `GET /api/viona/requests` | **401** (not **404**) — auth boundary **PASS** |
| Auth `POST .../execution-preview` | **404** — route **not mounted** on deployed build |
| Safe post-triage candidates (informational) | **3** non-hold **`triage`** rows visible — **NOT USED** |
| Execution-preview QA call count | **0** |
| Stop-on-error | **YES** — preflight stop before dry-run |

**Stop rule applied:** Route **404** after auth → **`BLOCKED_STAGING_ROUTE_NOT_DEPLOYED_REDEPLOY_REQUIRED`**.

---

## 6. Future redeploy operator phrase (required — NOT PROVIDED)

| Field | Value |
| --- | --- |
| Phrase required | **YES** |
| Phrase (verbatim) | `APPROVE_PACK29_STAGING_API_REDEPLOY_FOR_EXECUTION_PREVIEW_QA` |
| Phrase provided | **NO** |
| Redeploy execution blocked until | Operator phrase is **separately recorded and verified** in a future intake/execution pack |

**Recording note:** This packet prepares authorization boundaries only. Redeploy **must not** execute until the phrase above is provided and a **separate staging-only redeploy execution pack** is authorized.

---

## 7. Future redeploy execution boundaries (not authorized by this packet)

When a future redeploy execution pack is separately authorized, boundaries **must** include:

| Boundary | Rule |
| --- | --- |
| Deploy target | **`viona-api-staging-eu`** only |
| Deploy source | **`58a0a7d`** or later verified master |
| Production | **NO** |
| DB migration / apply | **NO** |
| Schema change | **NO** |
| Seed / user creation | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Pack30 or later scope | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Payment / booking / SOS / live AI / merchant outbound / email / SMS / push | **NO** |

---

## 8. Future post-redeploy verification plan (not executed by this packet)

After a future authorized redeploy completes, a **separate verification step** (redeploy result pack or QA preflight) **must** confirm:

| Step | Check | Expected |
| --- | --- | --- |
| 1 | Deploy target | Exactly **`viona-api-staging-eu`** |
| 2 | Deploy source | **`58a0a7d`** or later verified master |
| 3 | Health | `GET /health` → **200** |
| 4 | Unauth list guard | `GET /api/viona/requests` without auth → **401**, not **404** |
| 5 | Route existence | Unauth or auth boundary probe on `POST /api/viona/requests/:id/actions/execution-preview` proves route **exists** and is **not 404** |

**Rule:** Do **not** run bounded execution-preview dry-run QA from the redeploy packet unless **separately authorized** by a future staging QA execution/result pack.

---

## 9. Explicit non-authorizations (this packet)

This packet does **NOT**:

- deploy or restart anything;
- run staging QA;
- call staging APIs;
- create/seed any row;
- mutate request status;
- run DB/Prisma/Supabase/SQL;
- change schema;
- create users;
- modify `.env*`;
- touch production;
- wire real execution;
- authorize Pack30 or later scope;
- print secrets/tokens/PINs/DB URLs;
- create external side effects;
- write persistent audit records.

---

## 10. Result classification

**`PACK29_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET_PREPARED_ONLY`**

Assertions (this packet): authorization/planning only; **no deploy/restart executed**; **no staging QA run**; **no API calls**; **no staging mutation**; **no request creation**; **no request status mutation**; **no real execution**; **no external side effects**; **no persistent audit write**; **no DB/Prisma/Supabase/SQL**; **no runtime/source changes**; **no `.env*` changes**; **no production**; **no secrets printed**; future redeploy phrase required and **not provided**; Pack29 **real execution remains blocked**.

---

## 11. Recommended next step

1. Operator provides `APPROVE_PACK29_STAGING_API_REDEPLOY_FOR_EXECUTION_PREVIEW_QA` in a **separate phrase intake pack** (if required by process).
2. Prepare **separate staging-only redeploy execution pack** under the provided phrase.
3. After redeploy, run **post-redeploy verification** per §8.
4. Re-run **bounded Pack29 execution-preview staging QA** only under separate QA execution/result pack authorization.
5. Pack29 **real execution remains blocked** throughout.
