# VIONA Request Engine — Pack30C Staging QA Authorization Packet (Execution Plan Preview)

**Document type:** Human review / authorization packet (docs-only — no staging QA, no API calls, no row create/seed, no implementation, deploy, live QA, staging endpoint calls, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK30C_STAGING_QA_AUTHORIZATION_PACKET_EXECUTION_PLAN_PREVIEW_DOCS_ONLY`
**Packet name:** `VIONA_REQUEST_PACK30C_STAGING_QA_EXECUTION_PLAN_PREVIEW`
**Source master:** `origin/master @ 2e1350bcbb1f58281a3ceab9dca8c839542df4d9` (`2e1350b`)
**Status:** `pack30c_staging_qa_authorization_planning_only`
**Result classification:** `PACK30C_STAGING_QA_AUTHORIZATION_PACKET_PREPARED_ONLY`
**Related:** `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/product/VIONA_REQUEST_PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET.md`, `docs/design/evidence/cursor-pack30b-execution-plan-route-wiring-implementation/README.md`, `docs/product/VIONA_REQUEST_PACK29_STAGING_QA_AUTHORIZATION_PACKET_EXECUTION_PREVIEW.md` (precedent template)

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack30C staging QA authorized | **NO** |
| execution-plan-preview POST authorized (this pack) | **NO** |
| Row create/seed authorized | **NO** |
| Staging data mutation authorized | **NO** |
| Real execution authorized | **NO** |
| DB write authorized | **NO** |
| Deploy/restart authorized | **NO** |
| Production authorized | **NO** |
| Automation authorized | **NO** |
| New operator phrase requested (this pack) | **YES — see §8** |
| New operator phrase recorded (this pack) | **NO — request only, not yet provided** |

**This packet authorizes human review / planning for a future bounded Pack30C staging QA path only.** It does **not** authorize staging QA execution, API calls, row creation, DB writes, real execution, external side effects, live QA mutation, staging endpoint calls, deploy/restart, or production behavior.

---

## 2. Baseline — current verified master and Pack30 chain

| Item | State |
| --- | --- |
| Current verified master | **`2e1350bcbb1f58281a3ceab9dca8c839542df4d9`** (`2e1350b`) |
| Pack30 design authorization | **CLOSED / GREEN** — PR #273 — `PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_AUTHORIZATION_PACKET_PREPARED_ONLY` |
| Pack30 implementation approval phrase intake | **CLOSED / GREEN** — PR #275 — `PACK30_IMPLEMENTATION_APPROVAL_PHRASE_RECORDED_NO_IMPLEMENTATION` |
| Pack30 implementation plan packet | **CLOSED / GREEN** — PR #277 — `PACK30_CONTROLLED_REAL_EXECUTION_IMPLEMENTATION_PLAN_PACKET_PREPARED_ONLY` |
| Pack30A mock-only implementation | **CLOSED / GREEN** — PR #279 @ `854ef1a` — `PACK30A_MOCK_ONLY_EXECUTION_PLAN_IMPLEMENTATION_SCAFFOLDING_ONLY_NO_REAL_EXECUTION` |
| Pack30A Kernel/Handoff sync | **CLOSED / GREEN** — PR #280 @ `6848fd9` |
| Pack30B implementation plan packet | **CLOSED / GREEN** — PR #281 @ `c6984e9` — `PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_PLAN_PACKET_PREPARED_ONLY` |
| Pack30B mock-only route wiring implementation | **CLOSED / GREEN** — PR #282 @ `2e1350b` — `PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_SCAFFOLDING_ONLY_NO_REAL_EXECUTION` |
| Pack30B new route on master | **`POST /api/viona/requests/:id/actions/execution-plan-preview`** |
| Pack30B route mode | **mock-only** — wired only to the Pack30A mock adapter |
| Pack30B route deployed to staging | **UNKNOWN / NOT CONFIRMED** — this packet does not confirm deploy state |
| Pack30B route ever called (staging or production) | **NO** |
| Pack29 gate | **`CLOSED_GREEN`** |
| Pack29 route (precedent, already staging-QA'd) | **`POST /api/viona/requests/:id/actions/execution-preview`** |
| PR chain #251 → #282 | **PRESERVED** |
| Real execution | **BLOCKED** |
| Persistent audit write | **BLOCKED** |
| External side effects | **BLOCKED** |
| Production | **NOT AUTHORIZED** |
| Pack30C staging QA opened | **NO** |

---

## 3. Strategic intent

| Principle | Record |
| --- | --- |
| Pack30B on master | Mock-only execution-plan-preview route implemented and merged — source present, never deployed/called |
| Pack30B gap | Staging QA for execution-plan-preview **not executed** — this separate QA authorization pack is required first |
| Pack30C QA role | **Authorization/planning only** for a future **separately authorized** bounded staging QA that may exercise **`POST /api/viona/requests/:id/actions/execution-plan-preview`** only |
| Production claim | **NO** — long-term production readiness remains a target only; not implied-live automation |

This packet is **not** staging QA execution. It is **not** row creation. It is planning authorization for human review of a future scoped execution-plan-preview QA path — subject to redeploy confirmation, a **new** separate operator phrase, and a future QA result pack.

---

## 4. Staging QA target and redeploy gate

| Field | Value |
| --- | --- |
| Staging QA target | **`viona-api-staging-eu`** (same target as Pack29) |
| Minimum source on staging API | **`2e1350b`** or later verified master (must include PR #282) |
| Staging QA authorized | **Only after** staging API is confirmed to run source **`2e1350b`** or later verified master |

**Redeploy rule:** If staging route returns **404** (route missing), QA **must stop** and record **`BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED`**. Do **not** interpret 404 as auth failure.

**Auth boundary rule:** If auth is missing or invalid, expect **401 Unauthorized** — **not** 404. A 404 on the execution-plan-preview path after redeploy confirmation indicates route not deployed, not missing credentials.

---

## 5. Goal (future bounded staging QA — not authorized by this packet)

Future Pack30C staging QA, **subject to separate operator authorization** (§8) and redeploy gate (§4), may verify:

| Goal | Detail |
| --- | --- |
| Route under test | **`POST /api/viona/requests/:id/actions/execution-plan-preview`** |
| Mode | **mock-only** — no real execution, wired only to the Pack30A mock adapter |
| Precondition | Selected request **must already be** in **`triage`** or a later approved lifecycle state |
| Expected safety flags | `action.operatorApprovalRequired: true`; `action.externalExecutionBlocked: true`; `action.persistentAuditWritten: false`; `action.plan.safety.mockOnly: true`; `action.plan.safety.stagingFirst: true`; `action.plan.safety.notProductionReady: true`; if mock adapter invoked, `action.mockResult.safety.providerCalled: false` |
| Writes | **None** — read-only request fetch + in-memory plan/mock-result only |

**Rule:** This packet records the **goal** for future QA — it does **not** authorize executing that QA.

---

## 6. QA plan (future execution — not authorized by this packet)

### 6.1 Route availability check

| Step | Action | Expected outcome |
| --- | --- | --- |
| 1a | Unauthenticated probe of execution-plan-preview route (e.g. `POST` without auth) | **401 Unauthorized** or equivalent auth boundary — **not** 404 after redeploy |
| 1b | Confirm staging API source is **`2e1350b`** or later verified master | Source/version evidence recorded (non-secret) |
| 1c | If **404** on execution-plan-preview after redeploy confirmation | **STOP** — `BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED` |

**Rule:** Expected outcome after redeploy **must not** be 404. Auth missing/invalid **must** yield 401, not 404.

### 6.2 Authenticated safe candidate check

| Step | Action | Expected outcome |
| --- | --- | --- |
| 2a | Authenticate to staging using roster-approved credentials (not in this packet) | Auth succeeds — no secrets logged |
| 2b | `GET /api/viona/requests` — list visible requests | Safe candidate selection only |
| 2c | Select **one** existing request in **`triage`** or later approved state | Candidate confirmed via `GET /api/viona/requests/:id` |
| 2d | Exclude Pack25 Option C hold row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` | Hold row **not used** |
| 2e | If no safe triage-or-later candidate exists | **STOP** — `BLOCKED_NO_SAFE_POST_TRIAGE_REQUEST` |

**Rule:** **Do not create** new request rows in QA. Existing rows only.

### 6.3 Execution-plan-preview calls (denial-path first, then mock-only success path)

| Step | Action | Expected outcome |
| --- | --- | --- |
| 3a | `POST /api/viona/requests/:id/actions/execution-plan-preview` with **empty body** on safe candidate | HTTP **200**; `action.plan.allowed: false`; `action.denialReason: 'missing_operator_approval'` (deny-by-default — body flags omitted) |
| 3b | Repeat with body `{ operatorApprovalGranted: true, userConsentGranted: true }` | HTTP **200**; `action.plan.allowed: true`; `action.plan.state: 'mock_ready'`; `action.mockAdapterCalled: false` |
| 3c | Repeat with body `{ operatorApprovalGranted: true, userConsentGranted: true, invokeMockAdapter: true }` | HTTP **200**; `action.mockAdapterCalled: true`; `action.mockResult.invoked: true`; `action.mockResult.safety.providerCalled: false` |
| 3d | Verify `action.operatorApprovalRequired` | **`true`** |
| 3e | Verify `action.externalExecutionBlocked` | **`true`** |
| 3f | Verify `action.persistentAuditWritten` | **`false`** |
| 3g | Verify `action.plan.safety.mockOnly` | **`true`** |
| 3h | Verify `action.plan.safety.stagingFirst` and `notProductionReady` | both **`true`** |
| 3i | Verify no status change on subsequent `GET /api/viona/requests/:id` | Request status unchanged before/after all calls in 3a–3c |
| 3j | Verify no unauthorized side effects | No payment/booking/SOS/live AI/merchant outbound/email/SMS/push observed |

### 6.4 Idempotency replay check (mock-only, process-local)

| Step | Action | Expected outcome |
| --- | --- | --- |
| 4a | Repeat step 3c with the **same** `idempotencyKey` in the body | HTTP **200**; `action.mockResult.replay: true`; `action.mockResult.mockExecutionId` identical to the first call's |
| 4b | Note on durability | The idempotency store is **process-local and non-persistent** — a restart or a different server instance may not preserve replay state; QA must not assume durability across deploys |

### 6.5 Negative safety checks

| Check | Action | Expected / fallback |
| --- | --- | --- |
| 5a | Repeat step 3c with body `{ ..., requestSafetyLabels: ['hold'] }` | HTTP **200**; `action.plan.allowed: false`; `action.denialReason: 'blocked_safety_label'` |
| 5b | `submitted` / `draft` / `cancelled` / `failed` status blocked | If safely testable **without mutation** (existing row in blocked state visible to actor), expect `action.plan.allowed: false`, `action.denialReason: 'ineligible_status'` — **not** an allowed mock-ready response |
| 5c | If negative cases not safely testable without mutation | Record **`NOT_TESTED`** with reason — do **not** mutate rows to create negative cases |

### 6.6 Stop-on-error rules

QA **must stop immediately** on any of:

| Stop condition | Classification hint |
| --- | --- |
| Route **404** after redeploy gate | `BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED` |
| Unexpected **5xx** | `FAIL_UNEXPECTED_SERVER_ERROR` |
| Response suggests **real execution** | `FAIL_REAL_EXECUTION_SUGGESTED` |
| `action.persistentAuditWritten: true` | `FAIL_PERSISTENT_AUDIT_WRITE_OBSERVED` |
| `action.externalExecutionBlocked: false` | `FAIL_EXTERNAL_EXECUTION_NOT_BLOCKED` |
| `action.operatorApprovalRequired: false` | `FAIL_OPERATOR_APPROVAL_NOT_REQUIRED` |
| `action.plan.safety.mockOnly: false` or missing | `FAIL_MOCK_ONLY_FLAG_MISSING` |
| `action.mockResult.safety.providerCalled: true` | `FAIL_PROVIDER_CALLED_OBSERVED` — **critical, treat as real-execution leak** |
| Production target detected | `BLOCKED_PRODUCTION_TARGET` |
| Unsafe candidate detected (hold row, wrong tenant, ambiguous) | `BLOCKED_UNSAFE_CANDIDATE` |
| Required safety label missing in response | `FAIL_SAFETY_LABEL_MISSING` |
| Secrets exposure risk in evidence/logging | `BLOCKED_SECRET_EXPOSURE_RISK` |

---

## 7. Safe request selection rules (future QA)

| Rule | Requirement |
| --- | --- |
| Existing rows only | Use **only** existing visible staging request(s) — **no create/seed** |
| Required state | **`triage`** or later approved lifecycle state (`needsHumanConfirmation`, `sentToPartner`, `partnerResponded`, `completed`) |
| Pack25 hold exclusion | **Do not use** Pack25 Option C hold row: `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |
| Sensitive data | **Do not record** sensitive data in evidence |
| Auth tokens | **Do not print** auth tokens, Authorization headers, cookies, or PINs |
| Private payloads | **Do not record** full private response payloads |
| No safe row | If no safe post-triage row exists, QA **must stop** with **`BLOCKED_NO_SAFE_POST_TRIAGE_REQUEST`** |
| Row creation | **This authorization packet does not authorize creating a row** |
| Staging mutation | **No staging mutation** beyond safe read-only/mock-only request handling |
| `invokeMockAdapter` body flag | Only ever set to trigger the **mock** adapter — never interpreted as a request for a real provider call (no real provider exists to call) |

---

## 8. Required authorization gate (future pack)

### 8.1 Staging QA authorization phrase — NEW, requested by this packet

Any **authenticated Pack30C execution-plan-preview staging QA** requires a **new** verbatim operator phrase (this phrase does **not** yet exist and is **not** recorded by this packet):

```text
APPROVE_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA
```

| Gate | Authorizes | Does NOT authorize |
| --- | --- | --- |
| Staging QA phrase | Bounded authenticated execution-plan-preview POST QA per §6–§7 (mock-only) | Row create/seed; status POST; real execution; external side effects; persistent audit writes; assign/confirm/cancel; payment/booking/SOS/live AI; production; DB/schema changes; deploy in QA pack unless separately authorized; wiring a real provider into the mock adapter |

**Rule:** This phrase, once provided, authorizes **only** the QA in §6–§7. It does **not** authorize Kernel/Handoff sync, further implementation changes, redeploy, or real execution wiring. It is a **different, new** phrase from the existing `APPROVE_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_TO_IMPLEMENTATION` (which only ever covered design→implementation, not staging QA execution).

| Field | Value |
| --- | --- |
| Phrase required | **YES** — before any authenticated staging call to the Pack30B route |
| Phrase provided | **NO** — not yet requested from operator until this packet merges |
| Phrase recorded on master | **NO** |
| Distinct from prior Pack30 phrase | **YES** — intentionally, matching the Pack29 precedent (`APPROVE_PACK29_EXECUTION_PREVIEW_STAGING_QA` was also separate from Pack29's implementation-approval phrase) |

### 8.2 Redeploy prerequisite

Staging QA **must not proceed** until staging API source is confirmed **`2e1350b`** or later verified master. If route is 404, record redeploy required and stop.

---

## 9. Future result classifications

Future Pack30C staging QA result packs **must** use one of:

| Classification | Meaning |
| --- | --- |
| `PASS_EXECUTION_PLAN_PREVIEW_MOCK_ONLY` | Safe post-triage row selected; execution-plan-preview POST **200** for both denial and mock-only allowed paths; all safety flags verified; no unauthorized writes or side effects |
| `BLOCKED_STAGING_ROUTE_MISSING_REDEPLOY_REQUIRED` | Route 404 — staging API not running source with execution-plan-preview route |
| `BLOCKED_NO_SAFE_POST_TRIAGE_REQUEST` | No safe non-hold visible request in post-triage eligible state — QA stopped before POST |
| `BLOCKED_STAGING_TARGET_AMBIGUITY` | Staging target or environment ambiguous — QA stopped |
| `BLOCKED_AUTH_CREDENTIALS_MISSING` | Required roster/auth credentials unavailable — QA stopped |
| `BLOCKED_SECRET_EXPOSURE_RISK` | Evidence or logging would expose secrets — QA stopped |
| `BLOCKED_PRODUCTION_TARGET` | Production target detected — QA stopped |
| `BLOCKED_UNSAFE_CANDIDATE` | Unsafe or ambiguous candidate — QA stopped |
| `FAIL_EXECUTION_PLAN_PREVIEW_POST` | execution-plan-preview POST attempted on safe row but failed unexpectedly |
| `FAIL_REAL_EXECUTION_SUGGESTED` | Response suggests real execution enabled |
| `FAIL_PERSISTENT_AUDIT_WRITE_OBSERVED` | `persistentAuditWritten: true` observed |
| `FAIL_EXTERNAL_EXECUTION_NOT_BLOCKED` | `externalExecutionBlocked: false` observed |
| `FAIL_OPERATOR_APPROVAL_NOT_REQUIRED` | `operatorApprovalRequired: false` observed |
| `FAIL_MOCK_ONLY_FLAG_MISSING` | `plan.safety.mockOnly` false or missing |
| `FAIL_PROVIDER_CALLED_OBSERVED` | `mockResult.safety.providerCalled: true` observed — critical, treat as real-execution leak |
| `FAIL_SAFETY_LABEL_MISSING` | Required safety label missing |
| `FAIL_UNAUTHORIZED_WRITE_OR_EXECUTION_OBSERVED` | Write or execution surface observed outside allowlist |
| `TIMEOUT` | Bounded timeout exceeded — stop-on-error |
| `OTHER_STOP_ON_ERROR` | Any other stop condition per Operating Protocol |

---

## 10. Explicit NO assertions (this packet)

| Assertion | Value |
| --- | --- |
| Staging QA executed | **NO** |
| API calls | **NO** |
| Staging mutation | **NO** |
| Real execution | **NO** |
| External side effects | **NO** |
| Persistent audit write | **NO** |
| Deploy/restart | **NO** |
| DB/Prisma/Supabase/SQL | **NO** |
| Runtime/source changes | **NO** |
| `.env*` changes | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| New operator phrase recorded (only requested) | **NO** |
| Payment/booking/SOS/live AI/merchant outbound/email/SMS/push | **NO** |

---

## 11. Explicit non-authorization (this packet)

This packet does **NOT** authorize:

| Category | Status |
| --- | --- |
| Pack30C staging QA execution | **NO** |
| execution-plan-preview POST (this pack) | **NO** |
| Row create / seed / delete | **NO** |
| Staging data mutation | **NO** |
| Staging endpoint calls | **NO** |
| Real execution wiring | **NO** |
| External provider calls | **NO** |
| Persistent audit writes | **NO** |
| status POST / transitions | **NO** |
| assign / confirm / cancel | **NO** |
| payment / booking / SOS / live AI | **NO** |
| Deploy / restart | **NO** |
| DB / Prisma / Supabase / SQL | **NO** |
| Production | **NO** |
| Secrets / env printing | **NO** |

---

## 12. Recommended next step

After this packet merges and post-merge verification is **GREEN**:

1. **Docs-only Kernel/Handoff sync** (separate pack) — record Pack30C staging QA authorization on master.
2. **Confirm staging redeploy** — staging API must run source **`2e1350b`** or later before QA.
3. **Hold** — no Pack30C staging QA until operator provides:
   `APPROVE_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA`
4. Only then execute a **separate Pack30C staging QA result pack** (bounded; §6–§7; stop-on-error).
5. If QA returns `BLOCKED_NO_SAFE_POST_TRIAGE_REQUEST`, **do not** create/seed a row without **separate** authorization — remain blocked.

Pack30 **real execution remains blocked**. No external side effects without separate consent/audit gates.

---

## 13. Safety (this packet)

| Check | Result |
| --- | --- |
| Docs-only | **YES** |
| Kernel/Handoff modified | **NO** |
| Backend/runtime/UI code modified | **NO** |
| Prisma schema/migration modified | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Staging auth / endpoint calls | **NO** |
| Staging data mutation | **NO** |
| Row create/seed | **NO** |
| Deploy/restart | **NO** |
| Secrets printed | **NO** |
| Real execution | **NO** |

---

## 14. Verification checklist (this packet)

| Check | Expected |
| --- | --- |
| Docs-only | **YES** |
| Result classification recorded | **YES** — `PACK30C_STAGING_QA_AUTHORIZATION_PACKET_PREPARED_ONLY` |
| PR #282 result recorded | **YES** — `PACK30B_EXECUTION_PLAN_ROUTE_WIRING_IMPLEMENTATION_SCAFFOLDING_ONLY_NO_REAL_EXECUTION` |
| New operator phrase requested (not recorded) | **YES** — `APPROVE_PACK30C_EXECUTION_PLAN_PREVIEW_STAGING_QA` |
| QA scenarios defined for Pack30B route | **YES** — §6 |
| Pack30C staging QA executed (this pack) | **NO** |
| Real execution blocked | **YES** |
| Production not authorized | **YES** |
