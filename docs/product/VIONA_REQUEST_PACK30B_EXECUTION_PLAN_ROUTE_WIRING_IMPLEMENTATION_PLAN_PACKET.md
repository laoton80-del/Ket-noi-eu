# VIONA Request Engine — Pack30B Execution-Plan Route Wiring Implementation Plan Packet

**Document type:** Implementation plan packet (docs-only — no implementation, real execution, staging QA, API calls, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET_DOCS_ONLY`
**Packet name:** `VIONA_REQUEST_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN`
**Source master:** `origin/master @ 6848fd958692a36e1657b14230875ac934a727cd` (`6848fd9`)
**Branch:** `docs/pack30b-execution-plan-route-wiring-implementation-plan-packet`
**Status:** `pack30b_execution_plan_route_wiring_implementation_plan_prepared_only`
**Result classification:** `PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET_PREPARED_ONLY`
**Related:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/product/VIONA_REQUEST_PACK30_CONTROLLED_REAL_EXECUTION_IMPLEMENTATION_PLAN_PACKET.md`, `docs/design/evidence/cursor-pack30a-mock-only-execution-plan-implementation/README.md`, `docs/design/evidence/cursor-pack30a-kernel-handoff-sync-after-mock-only-implementation/README.md`

---

## 0. Why Pack30B (analysis) instead of "real execution" or "Pack31"

This section records the reasoning used to select the next lane, per the staging-first verification ladder in `VIONA_OPERATING_PROTOCOL.md`.

| Candidate next step | Verdict | Reason |
| --- | --- | --- |
| Jump directly to real provider execution | **REJECTED — too large a step** | No route exists yet to reach Pack30A's decision layer; no staging QA authorization packet/phrase exists for it (Pack29 required its own dedicated staging QA authorization + phrase before any authenticated call — PR #257/#259); operator phrase `APPROVE_..._DESIGN_TO_IMPLEMENTATION` covers design→implementation only, not real execution |
| Start an unrelated "Pack31" | **REJECTED — out of sequence** | Pack30's chain (`#273` → `#280`) is not yet closed; Pack30A code is merged but unreachable — closing that loop takes priority over opening a new numbered pack |
| **Pack30B — wire Pack30A into a mock-only, staging-first route** | **SELECTED** | Mirrors the exact Pack29 precedent: design → phrase → **staging-first execution gate implementation (still dry-run/mock, PR #255)** → Kernel/Handoff sync → **separate** staging QA authorization packet → QA phrase intake → actual staging QA call → gate closure. Pack30 has not yet had its "staging-first execution gate implementation" step — Pack30B fills exactly that slot, keeping real execution and production blocked. |

**Conclusion:** the next lane is **Pack30B — Execution-Plan Route Wiring (mock-only, staging-first gate)**. It does **not** unlock real execution. A **separate future pack** (working name **Pack30C**) would be required later for a staging QA authorization packet + phrase intake, and only after that could a **Pack30D** (or later) even consider real-provider wiring — each with its own explicit operator authorization, exactly like Pack29.

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack30B implementation executed (this pack) | **NO** |
| Route/controller code written (this pack) | **NO** |
| Pack30 real execution authorized | **NO** |
| Pack30 persistent audit write authorized | **NO** |
| Pack30 external side effects authorized | **NO** |
| Staging QA authorized (this pack) | **NO** |
| API calls authorized (this pack) | **NO** |
| Authenticated route calls authorized (this pack) | **NO** |
| Staging data mutation authorized | **NO** |
| DB write authorized | **NO** |
| Schema/migration authorized | **NO** |
| Deploy/restart authorized | **NO** |
| Production authorized | **NO** |
| Automation authorized | **NO** |

**This packet authorizes human review / implementation planning for a future bounded Pack30B mock-only route-wiring lane only.** It does **not** authorize implementation, real execution, persistent audit writes, external side effects, staging QA, status POST, row creation, DB writes, deploy/restart, or production behavior.

---

## 2. Baseline — current verified master and preserved chain

| Item | State |
| --- | --- |
| Current verified master | **`6848fd958692a36e1657b14230875ac934a727cd`** (`6848fd9`) |
| Pack30A Kernel/Handoff sync PR #280 | **MERGED / VERIFIED PASS** @ `6848fd9` |
| Pack30A Kernel/Handoff result (PR #280) | **`PACK30A_KERNEL_HANDOFF_SYNC_AFTER_MOCK_ONLY_EXECUTION_PLAN_IMPLEMENTATION_NO_REAL_EXECUTION`** |
| Pack30A mock-only implementation PR #279 | **MERGED / VERIFIED PASS** @ `854ef1a` |
| Pack30A implementation result (PR #279) | **`PACK30A_MOCK_ONLY_EXECUTION_PLAN_IMPLEMENTATION_SCAFFOLDING_ONLY_NO_REAL_EXECUTION`** |
| Pack30A route/controller wiring (at PR #279) | **NOT DONE — deliberately scaffolding only** |
| Pack30 implementation plan packet PR #277 | **MERGED / VERIFIED PASS** @ `9cc9b0c` |
| Pack30 phrase intake PR #275 | **MERGED / VERIFIED PASS** @ `bd661b5` |
| Pack30 design authorization PR #273 | **MERGED / VERIFIED PASS** @ `08bfce7` |
| Pack29 gate | **`CLOSED_GREEN`** |
| Pack29 route (precedent) | **`POST /api/viona/requests/:id/actions/execution-preview`** |
| PR chain #251 → #280 | **PRESERVED** |
| Pack30A code on master | **YES — pure functions in `src/lib/viona/executionPlan/*` and `src/lib/viona/mockAdapter/*`, unwired** |
| Real execution | **BLOCKED** |
| Persistent audit write | **BLOCKED** |
| External side effects | **BLOCKED** |
| Production | **NOT AUTHORIZED** |
| DB/schema/migration | **NOT AUTHORIZED** |

### Pack29 safety flags (preserved — must remain true in Pack30B)

| Flag | Required |
| --- | --- |
| `operatorApprovalRequired` | **true** |
| `externalExecutionBlocked` | **true** |
| `persistentAuditWritten` | **false** |
| `stagingFirst` | **true** |
| `notProductionReady` | **true** |
| `dryRunNoOp` | **true** |
| `executionPreviewOnly` | **true** (until a separately authorized pack removes this boundary) |
| `mockOnly` | **true** (Pack30A flag; must be surfaced in any Pack30B route response) |

---

## 3. Operator phrase gate (status for Pack30B)

```text
APPROVE_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_TO_IMPLEMENTATION
```

| Item | Value |
| --- | --- |
| Phrase required (original Pack30 design→implementation scope) | **YES** |
| Phrase provided | **YES** |
| Phrase recorded on master | **YES** — via PR #275 |
| Phrase already used to authorize Pack30A mock-only implementation | **YES** — via direct operator chat instruction, PR #279 |
| Phrase covers Pack30B route wiring | **PARTIAL** — covers "design → implementation" for the mock-only lane; does **not** cover real execution or production |
| New phrase strictly required for Pack30B (mock-only route wiring) | **NO** — Pack30B stays inside the already-authorized mock-only lane; explicit operator chat instruction to proceed with each implementation PR (as done for PR #279) remains the operating pattern used in this project |
| New phrase that WILL be required before any real-provider wiring | **YES (future)** — proposed name: `APPROVE_PACK30_REAL_PROVIDER_EXECUTION_STAGING_QA` (not requested, not recorded, not required by this packet) |

**Rule:** This packet does **not** request or record any new operator phrase. It documents, for traceability, that a future real-execution stage will need its own explicit phrase — exactly as Pack29's staging QA and redeploy stages each needed their own (`PR #259`, `PR #265`).

---

## 4. Implementation plan purpose

| Principle | Requirement |
| --- | --- |
| Prepare next pack safely | Define **Pack30B** — wire the existing Pack30A decision layer + mock adapter into one new HTTP route, mock-only |
| Bounded lane | Mock-only / no-external-side-effect route for **VionaRequest only** |
| No real providers | Do **not** execute real providers in Pack30B |
| No production claims | Do **not** create production readiness claims |
| Forbidden surfaces | Do **not** enable payment, booking, SOS dispatch/call, live AI tool execution, merchant outbound commitment, email, SMS, or push |
| Preserve Pack29 closure | Pack29 closed **execution-preview dry-run/no-op gate only** — real execution remains **BLOCKED** |
| No implementation in this pack | This document is planning only — **no runtime/source changes** |
| No staging calls in this pack | Staging QA of the new route is **explicitly deferred** to a separate future pack (working name Pack30C) |

---

## 5. Position in Request Engine chain

```
Pack29 (execution-preview dry-run/no-op gate) — CLOSED / GREEN
    ↓
Pack30 design authorization (PR #273) — ON MASTER
    ↓
Pack30 phrase intake (PR #275) — ON MASTER
    ↓
Pack30 implementation plan packet (PR #277) — ON MASTER (planning only)
    ↓
Pack30A mock-only implementation (PR #279) — ON MASTER (scaffolding, unwired)
    ↓
Pack30A Kernel/Handoff sync (PR #280) — ON MASTER
    ↓
Pack30B implementation plan (THIS PACKET — planning only)
    ↓
future Kernel/Handoff sync (NOT this packet)
    ↓
Pack30B implementation pack — route wiring, mock-only (NOT authorized here)
    ↓
future Pack30C — staging QA authorization packet + phrase intake (NOT authorized here)
    ↓
future staging QA of the mock-only route (NOT authorized here)
    ↓
future real-provider wiring pack — requires its own new phrase (NOT authorized here)
```

---

## 6. Planned implementation lane — Pack30B

**Lane label:** `Pack30B — execution-plan route wiring, mock-only, staging-first gate`

**Status in this packet:** **PLANNED ONLY — NOT IMPLEMENTED**

### 6.1 Pack30B proposed scope

| # | Scope item | Pack30B rule |
| --- | --- | --- |
| 1 | New route | `POST /api/viona/requests/:id/actions/execution-plan-preview` — registered in `src/routes/vionaRoutes.ts`, same auth guard pattern as the existing `execution-preview` route |
| 2 | New controller method | `postVionaRequestExecutionPlanPreviewAction` in `src/controllers/VionaRequestController.ts` — auth check, id/body validation, delegates to a new service, maps result to HTTP status, never mutates status |
| 3 | New orchestration service | `src/services/viona/vionaExecutionPlanRouteService.ts` — reads the request read-only via the existing `getVionaRequestById` helper, then calls the **existing, unmodified** Pack30A pure functions (`evaluateVionaExecutionPlanDecision` / `buildVionaExecutionPlan` from `src/lib/viona/executionPlan`) and, only if the plan is `allowed` **and** the caller explicitly requests a mock invocation, calls `invokeVionaMockExecutionAdapter` from `src/lib/viona/mockAdapter` |
| 4 | Pack30A core logic | **Unmodified** — Pack30B reuses PR #279's pure decision layer and mock adapter exactly as merged; no changes to `src/lib/viona/executionPlan/*` or `src/lib/viona/mockAdapter/*` logic itself (only a barrel/export touch-up if strictly required) |
| 5 | Real providers | **Blocked by default** — `externalExecutionBlocked` and `mockOnly` must remain **true** in every response |
| 6 | Request status | **Do not mutate** — route is read + mock-preview only, same boundary as Pack29's execution-preview |
| 7 | Persistent audit | **Do not create** — no DB writes beyond the existing read-only request lookup |
| 8 | DB/schema/migration | **Do not add** — reuse existing read-only lookup only |
| 9 | Idempotency store | **Process-local, in-memory only** (as already built in PR #279) — explicitly documented in the response as non-persistent; not a substitute for a future audit ledger |
| 10 | Auth | Reuse the existing auth-guard pattern (`readAuthUserId`) already used by `postVionaRequestExecutionPreviewAction` — unauthenticated calls rejected with `401` |
| 11 | Response shape | Must surface all Pack29/Pack30A safety flags verbatim (`operatorApprovalRequired`, `externalExecutionBlocked`, `persistentAuditWritten`, `stagingFirst`, `notProductionReady`, `dryRunNoOp`, `executionPreviewOnly`, `mockOnly`) |
| 12 | Unit/integration tests | Cover eligibility denial, hold/safety-label denial, missing operator-approval denial, missing user-consent denial, mock-only success path, no status mutation, no persistent audit write, no real provider call, safety-flag presence |
| 13 | Staging QA | **Explicitly out of scope for the implementation pack** — deferred to a separate future authorization packet + phrase (Pack30C), matching Pack29's `PR #257` → `PR #259` precedent |

### 6.2 Pack30 design topics mapped to Pack30B (planning only)

| # | Design topic (from PR #273) | Pack30B planning stance |
| --- | --- | --- |
| 1 | Controlled real-execution state machine | **Reused, unmodified** from Pack30A — Pack30B only adds a transport layer around it |
| 2 | Consent and operator approval model | **Enforced at route boundary** — missing consent/approval → safe `4xx` denial, same as the pure-function behavior |
| 3 | Persistent audit ledger design | **NOT in Pack30B** — still no persistent audit writes |
| 4 | Idempotency and replay protection | **Process-local placeholder, unchanged** — explicitly labeled non-persistent in the HTTP response |
| 5 | Policy / eligibility engine expansion | **No new policy** — Pack30B reuses Pack30A's policy exactly; no expansion |
| 6 | Execution adapter interface | **Mock adapter only, unchanged** |
| 7 | Kill switch / rollback / incident response | **Design hook only** — route can be disabled via existing route-registration removal; no runtime feature-flag infra added in this stage |
| 8 | Staging-first verification ladder | **Route built mock-only first; staging QA explicitly deferred to Pack30C** |
| 9 | Non-goals / forbidden scope | **Recorded and enforced** — see §7 below |

---

## 7. Required future implementation boundaries (Pack30B only)

| Boundary | Rule |
| --- | --- |
| Entity scope | **VionaRequest only** |
| LocalServiceRequest expansion | **NO** |
| Pack25 hold bypass | **NO** — hold row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` and hold/safety labels must block the plan exactly as Pack30A's policy already does |
| SOS emergency behavior | **NO** |
| Payment / booking / merchant / email / SMS / push / live AI | **NO** |
| Production | **NO** |
| Staging QA from implementation PR | **NO** — requires a separate Pack30C authorization packet + phrase |
| DB / schema / migration | **NO** — read-only reuse of existing lookup only |
| Secrets | **NO** |
| `.env` changes | **NO** |
| Provider credentials | **NO** |
| Persistent audit writes | **NO** |
| Modifying Pack30A's pure decision logic or mock adapter behavior | **NO** — Pack30B wires to it, does not change it |
| New operator phrase requested/recorded | **NO** — deferred to the future real-execution stage |

---

## 8. Proposed future runtime/source areas (implementation packet only — NOT this pack)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PLANNING PACK`

**Exact file allowlist for the future Pack30B implementation PR:**

| # | Path | Change type | Purpose |
| --- | --- | --- | --- |
| 1 | `src/routes/vionaRoutes.ts` | **MODIFY** | Register `POST /requests/:id/actions/execution-plan-preview` |
| 2 | `src/controllers/VionaRequestController.ts` | **MODIFY** | Add `postVionaRequestExecutionPlanPreviewAction` |
| 3 | `src/services/viona/vionaExecutionPlanRouteService.ts` | **NEW** | Orchestration: read-only request lookup + call Pack30A decision layer + optional mock adapter invocation |
| 4 | `src/services/viona/vionaExecutionPlanRouteDto.ts` | **NEW** (optional, if types warrant a dedicated DTO file) | Input/result types for the route service, mirroring `vionaRequestExecutionGateDto.ts` pattern |
| 5 | `scripts/test-viona-pack30b-execution-plan-route.ts` | **NEW** | `tsx`-based unit/integration tests for the new route/service, following the existing repo test-script convention |
| 6 | `docs/design/evidence/cursor-pack30b-execution-plan-route-wiring-implementation/README.md` | **NEW** | Evidence doc for that future implementation PR |

**No other files may be touched by the future Pack30B implementation PR.** In particular: **no changes** to `src/lib/viona/executionPlan/*`, `src/lib/viona/mockAdapter/*`, Prisma schema/migrations, package/lockfiles, or `.env*`.

| Area | Allowed in future Pack30B implementation pack |
| --- | --- |
| New HTTP route registration | **YES** — mock-only |
| New controller action | **YES** — read + mock-preview only, no status mutation |
| New orchestration service | **YES** — read-only DB lookup reuse + calls into existing pure Pack30A functions |
| Unit/integration tests | **YES** |
| Deploy scripts | **NO** |
| Infrastructure changes | **NO** |
| Package/lockfile changes | **NO** |
| Staging QA / authenticated calls | **NO** — separate Pack30C |

---

## 9. Safety requirements for the future Pack30B implementation

| Requirement | Rule |
| --- | --- |
| `externalExecutionBlocked` | Must remain **true** in every response |
| `mockOnly` | Must remain **true** in every response |
| `notProductionReady` | Must remain **true** |
| `stagingFirst` | Must remain **true** |
| Real provider execution | Must remain **false** / **blocked** — no network/fetch/axios/provider SDK calls anywhere in the new files |
| Response clarity | Every response must clearly indicate **mock-only / no-op** |
| Idempotency key handling | Must remain **process-local, non-persistent**, explicitly labeled as such in the response |
| Policy denial | Must be **safe by default** — deny when uncertain, reusing Pack30A's existing denial reasons verbatim |
| Hold/safety labels | Must **block** the plan |
| Operator approval | Must be **required** |
| User consent | Must be **required** or explicitly mocked as **absent/blocked** |
| Status mutation | **NO** |
| Request creation | **NO** |
| Persistent audit write | **NO** |
| External side effects | **NO** |
| Authenticated staging calls | **NO** — explicitly deferred to Pack30C |

---

## 10. Required test plan for the future Pack30B implementation

| # | Test case | Expected outcome |
| --- | --- | --- |
| 1 | Unauthenticated request | `401 Unauthorized`, no plan built |
| 2 | Missing/invalid request id | `400`, safe denial |
| 3 | Request not found | `404`, safe denial |
| 4 | Policy denies unsafe status | Plan `allowed: false`; safe denial response, no mock invocation |
| 5 | Policy denies hold/safety label | Plan blocked for hold/non-safe labels (Pack25 hold row excluded, unaffected) |
| 6 | Policy denies missing operator approval | Plan blocked |
| 7 | Policy denies missing user consent | Plan blocked |
| 8 | Eligible request, mock invocation requested | `200`, mock-only result returned, `providerCalled: false` |
| 9 | Eligible request, no mock invocation requested | `200`, plan returned in `mock_ready` state, adapter **not** invoked |
| 10 | Idempotency replay within same process | Same key → no duplicate mock work; response marks replay explicitly |
| 11 | Response safety-flag presence | All required Pack29/Pack30A safety flags present and correct on every response, including denials |
| 12 | No status mutation | Request status unchanged before/after every call in the test suite |
| 13 | No persistent audit write | No audit-table writes (repo has none yet; test asserts no new Prisma calls beyond the existing read-only lookup) |
| 14 | No request creation | No new request rows |
| 15 | No real provider call | Source-scan drift check: no `fetch`/`axios`/provider-SDK usage in the 3 new/modified files |
| 16 | `tsc --noEmit` | **PASS** across the whole repo after the change |

---

## 11. Pack30B gate — still blocked until

| Gate | Status |
| --- | --- |
| This implementation plan packet merged and post-merge verified | **PENDING** — this packet |
| Separate Kernel/Handoff sync after plan packet | **PENDING** |
| Separate Pack30B implementation pack with the exact file allowlist in §8 | **PENDING** |
| Separate Pack30C staging QA authorization packet + phrase intake | **PENDING** — required before any authenticated staging call to the new route |
| Separate real-provider wiring pack + new operator phrase | **PENDING** — not started, not named beyond the placeholder in §3 |

**Rule:** Merging this packet records the **implementation plan only**. It does **not** open Pack30B implementation, staging QA, real execution, persistent audit writes, external side effects, or production behavior.

---

## 12. Explicit NO assertions (this packet)

| Assertion | Value |
| --- | --- |
| Implementation | **NO** |
| Route/controller code written | **NO** |
| Deploy/restart | **NO** |
| QA run | **NO** |
| Staging API calls | **NO** |
| Authenticated route calls | **NO** |
| Staging mutation | **NO** |
| Request creation | **NO** |
| Request status mutation | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Persistent audit write | **NO** |
| DB / Prisma / Supabase / SQL | **NO** |
| Migration | **NO** |
| Schema change | **NO** |
| Runtime/source changes | **NO** |
| Package/lockfile changes | **NO** |
| `.env*` changes | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| New operator phrase requested/recorded | **NO** |
| Payment / booking / SOS / live AI / merchant outbound / email / SMS / push | **NO** |

---

## 13. Next recommended lane

1. **Open PR** for this implementation plan packet — merge and post-merge verify.
2. **Docs-only Kernel/Handoff sync** after plan packet merges — separate pack.
3. Only after that sync merges and verifies: prepare **separate Pack30B implementation pack** with exactly the file allowlist in §8 and the test plan in §10.
4. After Pack30B implementation merges and verifies: a **separate Pack30C staging QA authorization packet + phrase intake** is required before any authenticated staging call.
5. **Do not implement Pack30B from this plan packet.**

Pack29 execution-preview dry-run gate remains **CLOSED_GREEN**. Real execution remains **BLOCKED**. Production remains **NOT AUTHORIZED**. PR chain **#251 → #280** preserved.

---

## 14. Verification checklist (this packet)

| Check | Expected |
| --- | --- |
| Docs-only | **YES** |
| Result classification recorded | **YES** — `PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET_PREPARED_ONLY` |
| PR #280 result recorded | **YES** — `PACK30A_KERNEL_HANDOFF_SYNC_AFTER_MOCK_ONLY_EXECUTION_PLAN_IMPLEMENTATION_NO_REAL_EXECUTION` |
| PR #279 result recorded | **YES** — `PACK30A_MOCK_ONLY_EXECUTION_PLAN_IMPLEMENTATION_SCAFFOLDING_ONLY_NO_REAL_EXECUTION` |
| Operator phrase verbatim (existing) | **YES** — `APPROVE_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_TO_IMPLEMENTATION` |
| New operator phrase requested | **NO** |
| Exact file allowlist for future implementation | **YES** — §8 |
| Test plan for future implementation | **YES** — §10 |
| Pack30B implementation executed (this pack) | **NO** |
| Real execution blocked | **YES** |
| Production not authorized | **YES** |
