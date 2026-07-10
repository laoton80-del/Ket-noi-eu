# VIONA Request Engine — Pack29 Staging API Redeploy Execution Result

**Document type:** Execution-only staging API redeploy result (records a redeploy performed in this pack; docs-only commit; no runtime/source changes in repo).
**Packet ID:** `CURSOR_PACK29_STAGING_API_REDEPLOY_EXECUTION`
**Packet name:** `VIONA_REQUEST_PACK29_STAGING_API_REDEPLOY_EXECUTION_RESULT`
**Source master deployed:** `origin/master @ 20715792122da3307a98b87131bd92edd577558b` (`2071579`).
**Operator phrase (recorded on master):** `APPROVE_PACK29_STAGING_API_REDEPLOY_FOR_EXECUTION_PREVIEW_QA`
**Related:**
- `docs/product/VIONA_REQUEST_PACK29_STAGING_API_REDEPLOY_AUTHORIZATION_PACKET.md`
- `docs/product/VIONA_REQUEST_PACK29_STAGING_API_REDEPLOY_APPROVAL_PHRASE_INTAKE.md`
- `docs/design/evidence/cursor-pack29-kernel-handoff-sync-after-staging-api-redeploy-phrase-recorded/README.md`
- `docs/product/VIONA_REQUEST_PACK19_R1_STAGING_API_REDEPLOY_EXECUTION_RESULT.md`

---

## 1. Result classification

**`PASS_PACK29_STAGING_API_REDEPLOY_ROUTE_AVAILABLE_NO_QA`**

Staging API **`viona-api-staging-eu`** was redeployed from verified master **`2071579`**. Post-redeploy unauthenticated probes confirm **`POST /api/viona/requests/:id/actions/execution-preview`** returns an auth boundary response (**401**) rather than **404**. Dry-run QA was **not** executed in this pack.

---

## 2. Execution summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** |
| Current verified master | **`20715792122da3307a98b87131bd92edd577558b`** (`2071579`) |
| Staging target | **`viona-api-staging-eu`** (`viona-api-staging-eu.fly.dev`, region `fra`) |
| Deploy source attempted | **`2071579`** (verified master at execution time) |
| Operator phrase | `APPROVE_PACK29_STAGING_API_REDEPLOY_FOR_EXECUTION_PREVIEW_QA` |
| Phrase required | **YES** |
| Phrase provided | **YES** |
| Phrase recorded on master | **YES** — PR #265 phrase intake; PR #266 Kernel/Handoff sync |
| PR chain #251 → #266 | **PRESERVED** |
| Redeploy execution started | **YES** |
| Redeploy execution result | **SUCCESS** — rolling deploy completed; DNS verified |
| Deploy/release identifier | **`deployment-01KX6X86X13HVJXVVZ0D97YD4W`** (Fly image tag; no secrets) |
| Machine version (Fly) | **15** |
| Source confirmation | **CONFIRMED at deploy time** — local HEAD == `origin/master` == `2071579`; image built from that checkout via remote-only deploy |
| Route available after redeploy | **YES** — execution-preview **401** (not **404**) |
| Dry-run QA executed | **NO** |
| Authenticated execution-preview call | **NO** |
| Candidate request used | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Production touched | **NO** |

---

## 3. Preflight (read-only)

| Check | Result |
| --- | --- |
| Target app exactly `viona-api-staging-eu` | **YES** — `fly.toml` app name matches |
| `origin/master` == `2071579` | **YES** |
| Source >= verified master `2071579` | **YES** — no newer unverified master |
| Working tree clean before deploy | **YES** |
| Fly CLI available | **YES** |
| Fly auth present | **YES** (account authenticated; identity not reproduced here) |
| Production app selected | **NO** |
| Deploy command unambiguous | **YES** — `fly deploy --app viona-api-staging-eu --remote-only` |

---

## 4. Pre-deploy baseline (informational)

Unauthenticated probes before redeploy (harmless placeholder id for execution-preview):

| Probe | Result |
| --- | --- |
| `GET /health` | **200** |
| `GET /api/viona/requests` | **401** (not **404**) |
| `POST /api/viona/requests/00000000-0000-0000-0000-000000000000/actions/execution-preview` | **401** (not **404**) |

**Note:** Pre-deploy execution-preview already returned **401**, indicating route presence on prior staging build. Redeploy still executed from verified master **`2071579`** per authorization to refresh staging to current Pack29 source.

---

## 5. Deploy (this pack — no secrets recorded)

| Field | Value |
| --- | --- |
| Mechanism | `fly deploy --app viona-api-staging-eu --remote-only` |
| Source commit at deploy | **`20715792122da3307a98b87131bd92edd577558b`** (`2071579`) |
| Build | Remote (Depot) build of `Dockerfile.api` |
| Deployed image tag | **`deployment-01KX6X86X13HVJXVVZ0D97YD4W`** |
| Previous image (prior staging era) | **`deployment-01KWZE6B33B806T8Q0NQVBM401`** (`9deb6a5` era — historical) |
| Rolling strategy | 2/2 machines updated (region `fra`) |
| Fly health/smoke checks | **PASS** |
| DNS verification | **PASS** |
| Outcome | **SUCCESS** |
| DB migrate/status/apply | **NO** |
| Environment variable changes | **NO** |

---

## 6. Post-redeploy verification (non-mutating, unauthenticated)

No auth tokens, JWTs, PINs, Authorization headers, or secret values were sent or recorded.

| Step | Request | Pass criterion | Observed |
| --- | --- | --- | --- |
| V1 | Target app | Exactly **`viona-api-staging-eu`** | **PASS** |
| V2 | `GET /health` | HTTP **200** | **200** |
| V3 | `GET /api/viona/requests` (no Authorization) | HTTP **401** (not **404**) | **401** |
| V4 | `POST /api/viona/requests/00000000-0000-0000-0000-000000000000/actions/execution-preview` (no Authorization) | HTTP **401**/**403** (not **404**) | **401** |

**Discriminant:** **404** on V4 would indicate execution-preview route not mounted. Observed **401** confirms route table includes the execution-preview action path and the request was rejected at the auth boundary **before any mutation** — no dry-run QA, no candidate request, no row access.

---

## 7. Explicit NO assertions (this pack)

| Assertion | Value |
| --- | --- |
| Production | **NO** |
| DB / Prisma / Supabase / SQL | **NO** |
| Migration | **NO** |
| Schema change | **NO** |
| Seed/user creation | **NO** |
| `.env*` changes | **NO** |
| Secrets printed | **NO** |
| Runtime/source changes (repo) | **NO** |
| Package/lockfile changes | **NO** |
| Authenticated execution-preview QA | **NO** |
| Dry-run QA | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Persistent audit write | **NO** |
| Payment / booking / SOS / live AI / merchant outbound / email / SMS / push | **NO** |

---

## 8. Next gate

Prepare **separate bounded Pack29 execution-preview staging QA execution/result pack** — dry-run/no-op only, existing post-triage candidates only, no request creation. Pack29 **real execution remains blocked**.

If QA is authorized after this result merges and post-merge verifies, confirm staging still runs source **`2071579`**+ before bounded QA.

Evidence: `docs/design/evidence/cursor-pack29-staging-api-redeploy-execution-result/README.md`
