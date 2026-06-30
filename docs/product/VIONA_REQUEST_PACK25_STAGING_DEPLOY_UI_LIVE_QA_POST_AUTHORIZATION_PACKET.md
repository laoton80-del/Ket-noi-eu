# VIONA Request Engine — Pack25 Staging Deploy + UI Live QA POST Authorization Packet

**Document type:** Staging deploy/redeploy and owner-auth UI live status-action POST authorization packet (docs-only — no deployment, no live QA, no status POST execution).
**Packet ID:** `CURSOR_PACK25_STAGING_DEPLOY_UI_LIVE_QA_POST_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 6fe6da9` — `docs(pack25): sync kernel handoff after status ui visual closure (#183)`.
**Related:** `docs/product/VIONA_REQUEST_PACK25_CONTROLLED_STATUS_ACTION_UI_IMPLEMENTATION_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_UI_FRESH_SUBMITTED_ROW_AUTHORIZATION_PACKET.md`, `docs/product/VIONA_REQUEST_PACK25_STATUS_ACTION_UI_VISUAL_CLOSURE_EVIDENCE.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `src/components/viona/requests/VionaRequestStatusActionWrite.tsx`, `src/services/vionaRequestApi.ts`

---

## 1. Packet summary

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only | **YES** |
| Authorization packet prepared | **YES** |
| Verified master | **`6fe6da9`** |
| Deploy execution performed | **NO** |
| Live QA execution performed | **NO** |
| Status POST executed | **NO** |
| Send to review clicked | **NO** |
| Row creation/seed/reset/rollback | **NO** |
| Pack26 opened | **NO** |

**This packet prepares scope only.** It does **not** authorize deployment execution, live QA execution, status POST/click, row creation, DB/data mutation, production deploy, or Pack26 unless the operator issues the **explicit operator phrase** in §10.

---

## 2. Existing green chain (on master)

| Gate | Status |
| --- | --- |
| Pack25 controlled status-action UI implementation | **CLOSED / GREEN** — PR #180 @ `736e260` |
| Pack25 fresh submitted row authorization packet | **CLOSED / GREEN** — PR #181 @ `b9c3015` |
| Fresh submitted row execution | **PASS** — staging; idempotent ensure; one suitable `submitted` visual-QA row |
| Owner-auth visual pass (positive + negative) | **PASS** — local GET-only; 390 / 768 / 1440px |
| Pack25 visual closure evidence | **CLOSED / GREEN** — PR #182 @ `f72e074` |
| Pack25 Kernel/Handoff sync after visual closure | **CLOSED / GREEN** — PR #183 @ `6fe6da9` |
| Pack25 controlled status-action UI visual confirmation | **CLOSED / GREEN** |

---

## 3. Current gap

| Field | Value |
| --- | --- |
| Staging UI live action loop verified after deploy/redeploy | **NO** |
| Local visual pass (GET-only) | **PASS** — affordance placement and negative `triage` hide |
| Live owner-auth click on **Send to review** | **NOT verified** |
| Live `submitted` → `triage` transition via existing route | **NOT verified** |
| Post-transition action hide on staging UI | **NOT verified** |
| Timeline / audit display after live status action | **NOT verified** |
| Duplicate events on refresh/reload after live POST | **NOT verified** |

**Gap statement:** Pack25 controlled status-action UI is implemented and visually confirmed locally (read-only). The **end-to-end staging UI action loop** — deploy/redeploy → owner-auth → single **Send to review** click → `submitted` → `triage` → action hides → timeline/audit safe display — has **not** been verified on staging after deploy.

---

## 4. Future target loop (execution scope — not performed in this packet)

```
owner sees submitted visual-QA request
  → clicks Send to review exactly once
  → existing route transitions submitted → triage
  → action hides after triage
  → timeline/audit reflect status action safely
```

| Step | Expected behavior |
| --- | --- |
| 1 | Owner (pilot User A) opens live inbox/detail on staging-backed UI |
| 2 | Row titled `Pack25 status action UI visual QA — submitted affordance check` is visible with status **`submitted`** |
| 3 | **Send to review** (or equivalent Pack25 copy) is visible once |
| 4 | Operator clicks **exactly once** |
| 5 | `POST /api/viona/requests/:id/actions/status` with `targetStatus: 'triage'` succeeds |
| 6 | Row status becomes **`triage`**; action control **hides** |
| 7 | Timeline / status / audit display updates safely — no misleading production claims |
| 8 | Refresh/reload does **not** show duplicate transition events |

**Existing route (no new backend):** `POST /api/viona/requests/:id/actions/status` — owner-only `submitted` → `triage`.

---

## 5. Future deployment boundary (plan only — not executed)

| Rule | Required |
| --- | --- |
| Environment | **Staging only** |
| Target app (name only) | **`viona-api-staging-eu`** (API) + staging UI deploy path per existing runbooks |
| Source commit | **`origin/master @ 6fe6da9`** or **later verified master** at execution time |
| Deploy/redeploy from verified master only | **YES** |
| Production deploy | **NO** |
| DB migration | **NO** |
| Prisma schema change | **NO** |
| Seed / reset / rollback | **NO** |
| Fly restart without operator authorization | **NO** |
| `.env*` mutation in repo | **NO** |
| Secrets printed or logged | **NO** |
| Pack26 | **NO** |

**Rationale:** Surface Pack25 controlled status-action UI and existing status route on staging so owner-auth live QA POST can exercise the verified implementation without schema, seed, or production scope.

---

## 6. Future live QA POST boundary (plan only — not executed)

| Rule | Required |
| --- | --- |
| Auth persona | **Pilot User A (owner)** only |
| Phone label (public runbook) | `+420910000001` — PIN operator-provisioned; **not** printed in this packet |
| Target row | Use existing **`submitted`** visual-QA row if still available |
| Visual-QA row title | `Pack25 status action UI visual QA — submitted affordance check` |
| If no suitable `submitted` row exists | **STOP** — report **BLOCKED**; do **not** create/seed/reset rows in live QA execution unless separately authorized |
| Clicks on Send to review | **Exactly one** |
| Expected transition | **`submitted` → `triage`** only |
| Verify action hides after triage | **YES** |
| Verify timeline/status/audit display safely | **YES** |
| Verify no duplicate events on refresh/reload | **YES** |
| Unsupported statuses | **Do not test** |
| Additional transitions | **Do not create** |
| Assign / confirm / cancel | **NO** |
| Payment / booking / SOS / wallet / live AI | **NO** |
| Note submit during this QA | **Out of scope** unless separately authorized |
| Production claims in UI copy | **Forbidden** — honest pilot/staging labels only |

### 6.1 Pre-live-QA row gate

| Check | Pass | Fail |
| --- | --- | --- |
| Authenticated list includes visual-QA row | **YES** | **STOP — BLOCKED** |
| Row status is **`submitted`** | **YES** | **STOP — BLOCKED** (do not reset `triage` rows) |
| Row title matches visual-QA title | **YES** | **STOP — wrong row** |

---

## 7. Operator authorization model

### 7.1 What this packet authorizes

| Item | Status |
| --- | --- |
| Document staging deploy + UI live QA POST scope | **YES** |
| Open PR for docs-only authorization packet | **YES** |
| Execute Fly deploy / restart | **NO** |
| Execute live QA / status POST / click Send to review | **NO** |

### 7.2 Required operator phrase before execution

Deployment and live QA POST execution require the operator to provide the **explicit phrase below verbatim** (or equivalent scope-locked authorization recorded in evidence). **Until received:** agents and operators must **not** deploy, restart Fly, authenticate for live QA, click Send to review, or call status POST.

**Suggested operator phrase (template — not active until operator sends it):**

> I explicitly authorize Pack25 staging deploy and UI live QA POST from verified origin/master @ 6fe6da9. Scope is limited to staging-only deploy/redeploy of the verified master and one owner-auth pilot User A UI click on the submitted visual-QA row titled `Pack25 status action UI visual QA — submitted affordance check`, using the existing status action route to transition `submitted` to `triage`, then verifying the action hides and timeline/audit display safely. Do not deploy production, do not run DB migrations, do not change schema, do not create/seed/reset/rollback rows, do not add transitions, do not touch assign/confirm/cancel/payment/booking/SOS/wallet/live AI, do not print secrets/JWT/PIN/Auth headers/database URLs, do not change `.env*`, and do not open Pack26.

| Field | Value |
| --- | --- |
| Operator phrase required | **YES** |
| Operator phrase active in this packet | **NO** — preparation only |
| Operator phrase invented | **NO** |

---

## 8. Explicitly NOT authorized by this packet

| Item | State |
| --- | --- |
| Deploy execution | **NOT authorized** |
| Live QA execution | **NOT authorized** |
| Status POST execution | **NOT authorized** |
| Send to review click | **NOT authorized** |
| Row creation | **NOT authorized** |
| DB / data mutation | **NOT authorized** |
| Production deploy | **NOT authorized** |
| Pack26 | **NOT authorized** |
| Assign / confirm / cancel | **NOT authorized** |
| Payment / booking / SOS / wallet / live AI | **NOT authorized** |
| New transitions | **NOT authorized** |
| Code / UI / backend implementation | **NOT authorized** |
| Prisma schema / migrations | **NOT authorized** |
| `.env*` changes | **NOT authorized** |

---

## 9. Status flags

| Flag | Value |
| --- | --- |
| `pack25StagingDeployUiLiveQaPostAuthorizationPacketPrepared` | `true` |
| `pack25StagingDeployExecutionAuthorized` | `false` |
| `pack25StagingDeployExecutionPerformed` | `false` |
| `pack25UiLiveQaPostExecutionAuthorized` | `false` |
| `pack25UiLiveQaPostExecutionPerformed` | `false` |
| `pack25StagingUiLiveActionLoopVerified` | `false` |
| `pack25VisualConfirmationStatus` | `closed_green` |
| `pack26Opened` | `false` |

---

## 10. Recommendation

| Step | Action | Now |
| --- | --- | --- |
| 1 | Merge this docs-only authorization packet | PR review |
| 2 | Operator provides explicit phrase §7.2 | **Not yet** |
| 3 | Staging-only deploy/redeploy from verified master | **Blocked** until step 2 |
| 4 | Pre-live-QA row gate §6.1 | **After** step 3 |
| 5 | Owner-auth single Send to review click + verification | **After** step 4 |
| 6 | Record live QA POST execution evidence | **After** step 5 |

---

**Evidence:** `docs/design/evidence/cursor-pack25-staging-deploy-ui-live-qa-post-authorization-packet/README.md`
