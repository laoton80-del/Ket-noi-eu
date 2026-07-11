# VIONA Request Engine — Pack30 Controlled Real-Execution Design Authorization Packet

**Document type:** Authorization / design packet (docs-only — no implementation, execution wiring, staging QA, API calls, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_AUTHORIZATION_PACKET_DOCS_ONLY`
**Packet name:** `VIONA_REQUEST_PACK30_CONTROLLED_REAL_EXECUTION`
**Source master:** `origin/master @ 193a687eede09f2e4751c448fc45c463356b05a8` (`193a687`)
**Branch:** `docs/pack30-controlled-real-execution-design-authorization-packet`
**Status:** `pack30_controlled_real_execution_design_planning_only`
**Result classification:** `PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_AUTHORIZATION_PACKET_PREPARED_ONLY`
**Related:** `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/product/VIONA_REQUEST_PACK29_EXECUTION_PREVIEW_GATE_CLOSURE_SUMMARY_PACKET.md`, `docs/product/VIONA_REQUEST_PACK29_REQUEST_ENGINE_EXECUTION_AUTHORIZATION_DESIGN_PACKET.md`, `docs/product/VIONA_REQUEST_PACK29_EXECUTION_PREVIEW_STAGING_QA_RESULT.md`

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack30 implementation authorized | **NO** |
| Pack30 real execution authorized | **NO** |
| Pack30 persistent audit write authorized | **NO** |
| Pack30 external side effects authorized | **NO** |
| Staging QA authorized (this pack) | **NO** |
| API calls authorized (this pack) | **NO** |
| Authenticated execution-preview authorized (this pack) | **NO** |
| Staging data mutation authorized | **NO** |
| DB write authorized | **NO** |
| Schema/migration authorized | **NO** |
| Deploy/restart authorized | **NO** |
| Production authorized | **NO** |
| Automation authorized | **NO** |

**This packet authorizes human review / design planning for a future controlled real-execution lane only.** It does **not** authorize implementation, real execution, persistent audit writes, external side effects, staging QA, status POST, row creation, DB writes, deploy/restart, or production behavior.

---

## 2. Baseline — current verified master and Pack29 closure

| Item | State |
| --- | --- |
| Current verified master | **`193a687eede09f2e4751c448fc45c463356b05a8`** (`193a687`) |
| Source PR | **PR #272 merged / verified PASS** |
| Pack29 final result (PR #272) | **`PACK29_KERNEL_HANDOFF_SYNC_AFTER_EXECUTION_PREVIEW_GATE_CLOSED_GREEN_NO_REAL_EXECUTION`** |
| Pack29 gate | **`CLOSED_GREEN`** |
| Pack29 scope closed | **execution-preview dry-run/no-op gate only** |
| Pack29 route | **`POST /api/viona/requests/:id/actions/execution-preview`** |
| Pack29 staging target | **`viona-api-staging-eu`** |
| Pack29 QA result (PR #269) | **`PASS_PACK29_EXECUTION_PREVIEW_STAGING_QA_DRY_RUN_NO_OP`** |
| Pack29 authorization/design PR #251 (preserved) | **MERGED / VERIFIED** |
| PR chain #251 → #272 | **PRESERVED** |
| Pack29 real execution | **BLOCKED** |
| Production | **NOT AUTHORIZED** |
| Persistent audit write | **NOT AUTHORIZED** |
| External side effects | **NOT AUTHORIZED** |
| Pack30+ scope before this packet | **NOT AUTHORIZED** |

### Pack29 safety flags confirmed (PR #269 — preserved)

| Flag | Observed |
| --- | --- |
| `operatorApprovalRequired` | **true** |
| `externalExecutionBlocked` | **true** |
| `persistentAuditWritten` | **false** |
| `stagingFirst` | **true** |
| `notProductionReady` | **true** |
| `dryRunNoOp` | **true** |
| `executionPreviewOnly` | **true** |

### Pack29 non-authorization boundary (preserved)

| Boundary | Status |
| --- | --- |
| No real execution | **CONFIRMED** |
| No persistent audit write | **CONFIRMED** |
| No external side effects | **CONFIRMED** |
| No production readiness | **CONFIRMED** |
| No Pack30+ scope (before this packet) | **CONFIRMED** |

---

## 3. Pack30 gate — still blocked until

Pack30 **implementation** remains **blocked** until **all** of the following are satisfied:

| Gate | Status |
| --- | --- |
| This authorization/design packet merged and post-merge verified | **PENDING** — this packet |
| Separate operator implementation approval phrase provided | **PENDING** — see §12 |
| Separate implementation pack prepared with explicit file allowlist | **PENDING** — not this packet |

**Rule:** Merging this packet records the **design boundary only**. It does **not** open Pack30 implementation, real execution, persistent audit writes, external side effects, or production behavior.

---

## 4. Pack30 purpose

Prepare **controlled real-execution design authorization only** — the next safe architecture lane after Pack29 execution-preview dry-run gate closed **GREEN**.

| Principle | Requirement |
| --- | --- |
| Design authorization only | Define **what may be planned** for a future controlled real-execution layer — not **how** it is built or executed |
| Gates before execution | Establish mandatory gates before any real execution can ever be implemented |
| Preserve Pack29 closure | Pack29 closed **execution-preview dry-run/no-op only** — real execution remains **BLOCKED** |
| No implementation | Do **not** implement execution, audit persistence, adapters, or policy engine runtime |
| No authorization of execution | Do **not** authorize real execution, production, or external side effects |
| Staging-first ladder | All future implementation must follow a staging-first verification ladder (§10) |

Pack30 is **design authorization only**. It defines the **architecture lane** for controlled real execution — not runtime behavior.

---

## 5. Position after Pack29

```
Pack29 (execution-preview dry-run/no-op gate) — CLOSED / GREEN
    ↓
Pack30 (controlled real-execution design — THIS PACKET — design only)
    ↓
future implementation pack (NOT authorized here)
    ↓
future staging QA pack (NOT authorized here)
    ↓
future production readiness packet (NOT authorized here)
```

**Rule:** Pack29 closure does **not** authorize real execution. This packet does **not** authorize real execution. Only a future implementation pack **after** operator phrase §12 may begin scoped implementation — and even then only mock-first, staging-first, no external side effects unless separately authorized.

---

## 6. Design topic 1 — Controlled real-execution state machine (proposed states only)

**Scope:** Design-only. **No runtime change.** **No migration in this packet.**

### Requirements

| Requirement | Rule |
| --- | --- |
| Preserve existing request statuses | All current `VionaRequest` lifecycle statuses remain unchanged; proposed execution states are **orthogonal overlays**, not replacements |
| No status regression by default | Real-execution state transitions must **not** move request lifecycle backward without separate authorization |
| Explicit terminal states | Every execution attempt must reach a defined terminal state: `completed_noop`, `completed_mock`, `blocked_policy`, `blocked_consent`, `blocked_operator`, `failed_bounded`, `rolled_back`, `killed` |
| Separation from fulfillment | Execution state **≠** proof of real-world fulfillment |

### Proposed execution overlay states (design only)

| State | Meaning |
| --- | --- |
| `execution_idle` | No active execution attempt; request eligible for preview only |
| `execution_previewed` | Dry-run preview completed (Pack29 path); no side effects |
| `execution_consent_pending` | User consent required and not yet recorded |
| `execution_operator_pending` | Operator approval required and not yet recorded |
| `execution_idempotency_reserved` | Idempotency key reserved; replay protection active |
| `execution_policy_evaluating` | Policy/eligibility engine evaluating (read-only in future impl) |
| `execution_mock_running` | Mock adapter executing — no external calls |
| `execution_blocked` | Policy, consent, operator, kill switch, or safety label blocked execution |
| `execution_failed_bounded` | Bounded failure — no uncontrolled retry |
| `execution_rolled_back` | Rollback metadata recorded; side effects reversed or marked void |
| `execution_killed` | Kill switch activated — execution halted |

**Rule:** These states are **proposed design labels only**. No schema, migration, or runtime wiring in this packet.

---

## 7. Design topic 2 — Consent and operator approval model

| Requirement | Rule |
| --- | --- |
| User consent required | End-user must provide **explicit, informed consent** before any non-preview execution path |
| Operator approval required | Operator approval gate (aligned with Pack26D semantics) must remain **mandatory** for sensitive execution families |
| Emergency/SOS excluded | SOS / Global Lifeline / emergency dispatch paths are **excluded** from Pack30 design scope unless a **future separate SOS packet** exists |
| Explicit approval | Approval must be **explicit** — no implicit consent from navigation or status alone |
| Auditable | Every consent and approval decision must be **recordable** in the future audit ledger (design only — no writes in this packet) |
| Revocable | Consent and operator approval must support **revocation** before execution begins; revocation after execution begins triggers kill/rollback design paths |

### Consent record design fields (future schema — not authorized here)

| Field | Purpose |
| --- | --- |
| `requestId` | Target request |
| `actorId` | User or operator who consented/approved |
| `actorRole` | `user` \| `operator` \| `system_readonly` |
| `actionFamily` | Bounded action family identifier |
| `consentVersion` | Policy version at time of consent |
| `timestamp` | ISO timestamp |
| `revokedAt` | Nullable — revocation timestamp |
| `evidenceRef` | Optional reference to UI/session evidence (no secrets) |

---

## 8. Design topic 3 — Persistent audit ledger design (design only)

**Scope:** Design only. **No audit writes in this packet.** Future schema/migration must be **separately authorized**.

### Audit record requirements

Every future real execution attempt must produce an append-only audit record containing at minimum:

| Field | Purpose |
| --- | --- |
| `requestId` | Target `VionaRequest` |
| `actor` | User, operator, or system actor identifier |
| `action` | Bounded action identifier |
| `policyDecision` | Allow / deny / defer with reason codes |
| `idempotencyKey` | Unique key for replay protection |
| `timestamp` | ISO timestamp |
| `result` | Terminal outcome |
| `rollbackMetadata` | Rollback plan reference, reversal status, incident link |

### Design principles

| Principle | Rule |
| --- | --- |
| Append-only | Audit ledger is **append-only** — no in-place mutation of historical records |
| Tamper-evident | Future implementation should support hash chaining or equivalent integrity design |
| No writes in Pack30 | This packet **does not** authorize DB writes, Prisma schema changes, or migrations |
| Separate authorization | Any audit persistence implementation requires a **separate pack** with explicit schema allowlist |

---

## 9. Design topic 4 — Idempotency and replay protection

| Requirement | Rule |
| --- | --- |
| Idempotency key mandatory | Every future real execution must require an **idempotency key** supplied by client or generated and bound to request+action |
| No duplicate side effects | Replay of the same idempotency key must **not** duplicate external side effects |
| Bounded retries | Retries must be **bounded**, **auditable**, and **policy-gated** |
| Stale key handling | Expired or reused keys must return a defined non-destructive response |
| Preview vs execute separation | Execution-preview (Pack29) idempotency semantics must remain **separate** from real-execution idempotency |

### Proposed idempotency lifecycle (design only)

```
key_received → key_validated → key_reserved → execution_attempted → key_finalized
                     ↓                                    ↓
              key_rejected (invalid/expired)      key_replay_safe (no duplicate effects)
```

---

## 10. Design topic 5 — Policy / eligibility engine expansion

Future controlled real execution must evaluate **all** of the following gates before any mock or real adapter invocation:

| Gate category | Check |
| --- | --- |
| Tenant/user permission | Actor has permission for action family within tenant scope |
| Request ownership | Actor owns or is authorized operator for the request |
| Status eligibility | Request is in an approved lifecycle state for the action family |
| Hold/safety label checks | Request is not on hold; safety labels permit action |
| Jurisdiction gates | Action permitted in request jurisdiction / market |
| Cost gates | Action within approved cost/rate limits |
| Provider availability gates | Target provider/adapter is available and not kill-switched |
| Risk category gates | Action risk category matches approved operator tier |

**Rule:** Policy engine expansion is **design only** in this packet. No runtime policy evaluation wiring, no DB reads beyond existing authorized paths, no new routes.

---

## 11. Design topic 6 — Execution adapter interface (adapter design only)

**Scope:** Adapter **design only**. **Mock-only first.** **External providers blocked by default.**

### Adapter interface design (proposed)

| Method | Purpose |
| --- | --- |
| `describe()` | Return adapter metadata, risk category, side-effect class |
| `validateIntent(intent)` | Pure validation — no side effects |
| `executeMock(intent, context)` | Mock execution — records intent, returns simulated result |
| `executeReal(intent, context)` | **BLOCKED by default** — requires separate authorization per adapter family |
| `rollback(metadata)` | Rollback hook — design only until separately authorized |

### Blocked adapter families (require separate packets)

| Adapter family | Status |
| --- | --- |
| Payment | **BLOCKED** |
| Booking confirmation | **BLOCKED** |
| SOS dispatch / call | **BLOCKED** |
| Live AI tool execution | **BLOCKED** |
| Email to real users | **BLOCKED** |
| SMS to real users | **BLOCKED** |
| Push to real users | **BLOCKED** |
| Merchant outbound commitment | **BLOCKED** |

**Rule:** No payment/booking/SOS/live AI/email/SMS/push adapter may be enabled without a **separate explicit authorization packet**.

---

## 12. Design topic 7 — Kill switch / rollback / incident response

| Control | Design requirement |
| --- | --- |
| Global kill switch | Single operator-controlled switch halts **all** real execution attempts platform-wide |
| Per-adapter kill switch | Each adapter family has independent kill switch |
| Per-user/request block | Individual user or request may be blocked from execution |
| Rollback plan | Every execution attempt must define rollback metadata before side effects |
| Stop-on-error plan | Bounded failure stops retry; no uncontrolled cascade |
| Incident evidence plan | Incidents must capture request id, actor, action, idempotency key, timestamp, adapter, policy decision, and rollback status |

**Rule:** Kill switch and rollback are **design only** in this packet. No runtime wiring, no ops tooling, no production controls.

---

## 13. Design topic 8 — Staging-first verification ladder

Future Pack30 implementation (not authorized here) must follow this ladder in order:

| Step | Requirement |
| --- | --- |
| 1. Docs-only design | Authorization/design packet merged (this packet or successor) |
| 2. Mock adapter implementation | Future pack — mock-only adapter, no external calls |
| 3. Staging QA with no external side effects | Future pack — bounded calls, no real provider invocation |
| 4. Audit simulation | Future pack — simulate audit records without persistent writes OR with separately authorized test schema |
| 5. Idempotency replay tests | Future pack — verify replay does not duplicate effects |
| 6. Negative tests | Future pack — policy deny, consent missing, operator missing, kill switch active |
| 7. Production readiness packet | **Separate packet required** — no production until explicitly authorized |

**Rule:** No production deployment, no real external side effects, and no persistent audit writes until each ladder step is separately authorized and verified.

---

## 14. Design topic 9 — Non-goals / forbidden scope

The following are **explicitly forbidden** in Pack30 design-to-implementation scope unless a **different pack** with separate authorization explicitly allows them:

| Forbidden category | Status |
| --- | --- |
| Production | **FORBIDDEN** |
| Real execution | **FORBIDDEN** |
| Persistent audit write | **FORBIDDEN** |
| External side effects | **FORBIDDEN** |
| Payment capture / refund | **FORBIDDEN** |
| Confirmed booking | **FORBIDDEN** |
| SOS dispatch / call | **FORBIDDEN** |
| Live AI calling / tool execution | **FORBIDDEN** |
| Merchant outbound commitment | **FORBIDDEN** |
| Email / SMS / push to real users | **FORBIDDEN** |
| DB / Prisma / Supabase / SQL | **FORBIDDEN** |
| Schema change / migration | **FORBIDDEN** |
| Runtime / source changes | **FORBIDDEN** |
| `.env*` changes | **FORBIDDEN** |
| Deploy / restart | **FORBIDDEN** |
| Secrets printed | **FORBIDDEN** |

---

## 15. Required future approval phrase

Any **Pack30 design-to-implementation** work requires verbatim operator phrase:

`APPROVE_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_TO_IMPLEMENTATION`

| Gate | Authorizes | Does NOT authorize |
| --- | --- | --- |
| Design-to-implementation phrase | A **separate** implementation pack with explicit file allowlist per §6–§13 design topics | Real execution against external providers; production; payment/booking/SOS; persistent audit writes; external side effects; DB migrations; deploy; secrets printing; unbounded automation |

### Phrase status

| Field | Value |
| --- | --- |
| Required | **YES** |
| Provided | **NO** |

**Rule:** Implementation is **blocked** until this phrase is separately recorded and verified. This phrase alone does **not** authorize staging QA, Kernel/Handoff sync, production deployment, persistent audit writes, or any external side effect.

---

## 16. Explicit NO assertions (this packet)

| Assertion | Value |
| --- | --- |
| Implementation | **NO** |
| Deploy/restart | **NO** |
| QA run | **NO** |
| Staging API calls | **NO** |
| Authenticated execution-preview | **NO** |
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
| `.env*` changes | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Payment / booking / SOS / live AI / merchant outbound / email / SMS / push | **NO** |

---

## 17. Recommended next step

After this packet merges and post-merge verification is **GREEN**:

1. **Open PR** — docs-only; exactly two allowed files.
2. **Merge and post-merge verify** — confirm result classification and phrase status on master.
3. **Docs-only Kernel/Handoff sync** — separate pack; record Pack30 authorization/design packet on master.
4. **Hold** — no Pack30 implementation until operator provides:
   `APPROVE_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_TO_IMPLEMENTATION`
5. Only then prepare a **separate Pack30 implementation pack** with explicit file allowlist and §6–§13 scope.
6. **Do not implement Pack30 from this packet alone.**

Pack29 execution-preview dry-run gate remains **CLOSED_GREEN**. Real execution remains **BLOCKED**. PR chain **#251 → #272** preserved.

Evidence: `docs/design/evidence/cursor-pack30-controlled-real-execution-design-authorization-packet/README.md`

---

## 18. Safety (this packet)

| Check | Result |
| --- | --- |
| Docs-only | **YES** |
| Result classification recorded | **YES** — `PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_AUTHORIZATION_PACKET_PREPARED_ONLY` |
| Required future phrase present | **YES** — `APPROVE_PACK30_CONTROLLED_REAL_EXECUTION_DESIGN_TO_IMPLEMENTATION` |
| Phrase required YES / provided NO | **YES** |
| Pack29 CLOSED_GREEN recorded | **YES** |
| Real execution remains blocked | **YES** |
| Kernel/Handoff modified | **NO** |
| Backend/runtime/UI code modified | **NO** |
| Prisma schema/migration modified | **NO** |
| DB/Prisma/Supabase/SQL commands run | **NO** |
| Staging auth / endpoint calls | **NO** |
| Staging data mutation | **NO** |
| Deploy/restart | **NO** |
| `.env*` modified | **NO** |
| Secrets printed | **NO** |
| Pack30 implementation | **NO** |
