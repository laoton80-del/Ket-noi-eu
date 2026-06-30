# VIONA Request Engine — Pack26C Unified Audit/Timeline Contract Authorization Packet

**Document type:** Future implementation authorization packet (docs-only — no implementation, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK26C_UNIFIED_AUDIT_TIMELINE_CONTRACT_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ 571d999` — `docs(pack26b): sync kernel handoff after registry implementation (#194)`.
**Related:** `docs/product/VIONA_REQUEST_PACK26A_GLOBAL_ACTION_AUTOMATION_SPINE_READINESS_MATRIX.md`, `docs/product/VIONA_REQUEST_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_IMPLEMENTATION.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only authorization packet | **YES** |
| Current verified master | **`571d999`** |
| Pack26C implementation opened | **NO** |
| Pack26 implementation opened | **NO** |
| Pack27 / Pack28 opened | **NO** |

### Pack25 closure chain

| Milestone | Status |
| --- | --- |
| Pack25 controlled status-action UI chain | **CLOSED / GREEN** through PR #188 @ `2f111d6` |
| Option A post-hoc triage UI evidence | **COMPLETE** |
| Option C current visual-QA row | **HOLD** — no further Send to review click or status POST on row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |

### Pack26A closure chain

| Milestone | Status |
| --- | --- |
| Global Action Automation Spine & Readiness Matrix | **CLOSED / GREEN** — PR #189 @ `56cc18c` |
| Kernel/Handoff sync | **CLOSED / GREEN** — PR #190 @ `9b6857d` |

### Pack26B closure chain

| Milestone | Status |
| --- | --- |
| Action Registry + capability flags authorization | **CLOSED / GREEN** — PR #191 @ `9f09089` |
| Authorization Kernel/Handoff sync | **CLOSED / GREEN** — PR #192 @ `82e2153` |
| Read-only Action Registry + capability flags implementation | **CLOSED / GREEN** — PR #193 @ `fefa664` |
| Implementation Kernel/Handoff sync | **CLOSED / GREEN** — PR #194 @ `571d999` |
| Registry state | **Read-only / unwired / non-executing** — all `executionEnabled === false`, all `uiAffordanceAllowed === false` |

**This packet prepares authorization scope only.** It does **not** authorize implementation, code changes, deploy, live QA, status POST, data mutation, audit DB writes, timeline DB writes, or Pack27/Pack28 unless the operator issues **separate explicit authorization** with the required implementation phrase (§13).

---

## 2. Pack26C objective

Define the **future unified contract** that VIONA actions can use consistently across universes, roles, markets, readiness states, and safety gates.

Pack26C planning must unify how future actions record and expose:

| Contract surface | Purpose |
| --- | --- |
| **Audit events** | Operator/admin/system evidence of what happened, who acted, which gates applied, and why |
| **Timeline events** | Owner/merchant/operator-facing history with safe labels and visibility rules |
| **Action result envelopes** | Standard shape for attempted actions — success, blocked, replay, failure |
| **Replay / idempotency evidence** | Proof that duplicate intent does not duplicate side effects or events |
| **Readiness gate evidence** | Snapshot of readiness state at attempt time |
| **Human approval evidence** | Snapshot of required approvals satisfied or missing |
| **Failure / blocked reason evidence** | Operator-readable, non-secret reasons for blocked or failed attempts |
| **Market / legal / payment / ops / SOS gate evidence** | Snapshot of which gates allowed or blocked the attempt |

Pack26C is the **cross-action audit/timeline contract layer** — not workflow expansion, not registry execution, not Pack27 assign/confirm/cancel, and not payment/SOS/wallet/live AI.

---

## 3. Unified audit event contract

Future Pack26C implementation must define audit events with the following fields (planning contract — not live schema):

| Field | Type / purpose |
| --- | --- |
| `auditEventId` | Unique stable identifier for the audit record |
| `actionId` | Registry key, e.g. `request.status.submitted_to_triage` |
| `actionFamily` | Grouping from Pack26B registry |
| `actionVersion` | Contract version for replay/compatibility |
| `universe` | Local, Travel, Academy, Business, Account, SOS, etc. |
| `targetType` | e.g. `viona_request`, `booking`, `payment_intent` |
| `targetId` | UUID or stable object identifier |
| `actorRole` | owner, operator, merchant, admin, system, etc. |
| `actorId` | Actor identifier or **redacted actor reference** when full ID must not be stored |
| `ownerUserId` | Owner identifier or **redacted owner reference** when applicable |
| `market` | ISO market / country code |
| `environment` | local, staging, production |
| `readinessState` | Readiness level at attempt time |
| `beforeState` | State before transition (when applicable) |
| `afterState` | State after transition (when applicable) |
| `requestedTransition` | Intended transition, e.g. `submitted → triage` |
| `approvedTransition` | Transition actually applied (may differ when blocked) |
| `idempotencyKey` | Client-supplied or server-derived replay key |
| `correlationId` | Cross-service trace identifier (non-secret) |
| `capabilityFlagsSnapshot` | Read-only snapshot of relevant capability flags at attempt time |
| `approvalSnapshot` | Human approval requirements and satisfied/missing approvals |
| `safetyGateSnapshot` | Which legal/payment/ops/SOS/market gates applied |
| `blockedReason` | When blocked — operator-readable, non-secret code + message |
| `failureReason` | When failed — operator-readable, non-secret code + message |
| `createdAt` | UTC, server-authoritative timestamp |
| `sourceSystem` | e.g. `viona-api`, `viona-ui`, `viona-worker` |
| `evidenceLevel` | demo / pilot / staging / production-safe label |
| `humanReadableSummary` | Internal operator summary — must not contain secrets |

### Audit invariants (planning)

1. Every mutating action attempt must be auditable — success, blocked, replay, or failure.
2. Audit records must never store secrets, JWTs, PINs, Authorization headers, database URLs, or full env values.
3. Replay must not create duplicate audit events for the same idempotency scope.
4. Blocked attempts may still produce audit evidence when policy requires operator visibility.

---

## 4. Unified timeline event contract

Future Pack26C implementation must define timeline events with the following fields (planning contract — not live schema):

| Field | Type / purpose |
| --- | --- |
| `timelineEventId` | Unique stable identifier for the timeline entry |
| `actionId` | Registry key driving the timeline label |
| `targetType` | Object type shown in timeline context |
| `targetId` | Object identifier (may be partially redacted in UI) |
| `universe` | Universe context for label/i18n |
| `market` | Market context for label/i18n |
| `actorDisplayRole` | Safe display role — e.g. "Owner", "Support team" |
| `label` | i18n-safe timeline label key |
| `summary` | Short user-facing summary — owner-safe, non-claiming |
| `statusBefore` | Visible status before event (when applicable) |
| `statusAfter` | Visible status after event (when applicable) |
| `userFacingState` | Safe coarse state for UI chips/badges |
| `safetyCopyLevel` | demo / pilot / staging / production-safe label |
| `occurredAt` | UTC timestamp for display ordering |
| `visibleToOwner` | Boolean visibility rule |
| `visibleToMerchant` | Boolean visibility rule |
| `visibleToOperator` | Boolean visibility rule |
| `visibleToAdmin` | Boolean visibility rule |
| `redactionLevel` | none / partial / operator-only-detail |
| `linkedAuditEventId` | Link to full audit record for operator drill-down |

### Timeline invariants (planning)

1. Timeline is the **safe public history layer**; audit is the **evidence layer**.
2. Owner timeline must use owner-safe labels — no unsafe personal data exposure.
3. Operator/admin views may show more detail but must still redact secrets and unsafe data.
4. Every timeline event that represents a real transition should link to an audit event when audit exists.

---

## 5. Action result envelope

Future Pack26C implementation must define a standard envelope for action attempts (planning shape — not live API DTO):

| Field | Type / purpose |
| --- | --- |
| `ok` | Boolean — attempt succeeded as requested |
| `actionId` | Registry key |
| `targetId` | Target object identifier |
| `requestedState` | Intended resulting state or outcome |
| `resultingState` | Actual resulting state or outcome |
| `readinessState` | Readiness at attempt time |
| `executionEnabled` | From registry/capability snapshot — must reflect non-executing defaults until separately authorized |
| `uiAffordanceAllowed` | From registry/capability snapshot — must reflect non-executing defaults until separately authorized |
| `idempotencyKey` | Key used for this attempt |
| `auditEventCreated` | Whether a new audit event was created |
| `timelineEventCreated` | Whether a new timeline event was created |
| `replayed` | Whether this response is an idempotent replay |
| `blocked` | Whether attempt was blocked by gates |
| `blockedReason` | Safe blocked reason when `blocked === true` |
| `failureReason` | Safe failure reason when `ok === false` and not merely blocked |
| `userMessage` | Owner-safe message for UI |
| `operatorMessage` | Operator-readable message — non-secret |
| `safeToRetry` | Whether client may retry without side-effect risk |

### Envelope invariants (planning)

1. Blocked and replayed outcomes must be explicit — no silent success.
2. Envelope must not imply live global automation when gates block execution.
3. `executionEnabled` and `uiAffordanceAllowed` in envelope must align with Pack26B registry truth until separately authorized.

---

## 6. Event taxonomy

Future audit/timeline categories (planning taxonomy — definitions only):

| Category | Scope | Status |
| --- | --- | --- |
| `status.transition` | Request/status state changes | **Pack25 reference** — `submitted → triage` proven; other transitions planning only |
| `assignment.requested` | Assign workflow | **Planning only / non-executing** — Pack27 |
| `assignment.completed` | Assign workflow | **Planning only / non-executing** — Pack27 |
| `confirmation.requested` | Confirm workflow | **Planning only / non-executing** — Pack27 |
| `confirmation.completed` | Confirm workflow | **Planning only / non-executing** — Pack27 |
| `cancellation.requested` | Cancel workflow | **Planning only / non-executing** — Pack27 |
| `cancellation.completed` | Cancel workflow | **Planning only / non-executing** — Pack27 |
| `booking.requested` | Booking intent | **Planning only / non-executing** |
| `payment.intent.created` | Payment intent | **Planning only / non-executing** |
| `sos.assist.requested` | SOS assist | **Planning only / non-executing** — highest gate |
| `wallet.adjustment.requested` | Wallet adjustment | **Planning only / non-executing** — highest gate |
| `live_ai.action.requested` | Live AI action | **Planning only / non-executing** — highest gate |
| `gate.blocked` | Gate blocked attempt | **Planning only** — evidence category |
| `gate.approved` | Gate approved attempt | **Planning only** — evidence category |
| `replay.detected` | Idempotent replay | **Pack25 reference pattern** — proven for status transition |
| `failure.recorded` | Failed attempt | **Planning only** — evidence category |

**Rule:** All categories except Pack25-proven `status.transition` / `replay.detected` reference patterns are **planning only / non-executing** until separately authorized packs open those lanes.

---

## 7. Pack25 reference mapping

Map the existing proven reference action to the unified contract (documentation only — **do not change Pack25 behavior**):

| Field | Pack25 reference value |
| --- | --- |
| `actionId` | `request.status.submitted_to_triage` |
| Transition | `submitted` → `triage` |
| Actor | **Owner-only** |
| Timeline/audit | **Safe** — 1 status event + 1 audit event; no duplicates on replay |
| Idempotency | **Proven** by Pack25 live QA evidence |
| Visual-QA row | `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` — now `triage` / IN REVIEW |
| Option C | **HOLD** — no further click/status POST on this row |
| Pack26B registry entry | **Non-executing and unwired** — reference metadata only |

Pack26C contract planning must treat Pack25 as the **reference implementation pattern** for idempotent status transition audit/timeline behavior. Pack26C must **not** alter Pack25 runtime, routes, UI wiring, or status POST behavior.

---

## 8. Registry relationship

Future Pack26C implementation may **read** Pack26B registry metadata for contract alignment:

| Registry field | Pack26C use |
| --- | --- |
| `actionId` | Audit/timeline/envelope correlation |
| `actionFamily` | Taxonomy grouping |
| `universe` | Universe context on events |
| `readinessState` / default readiness | Readiness snapshot defaults |
| `auditCategory` | Maps to §6 taxonomy |
| `timelineCategory` | Timeline label grouping |
| `idempotencyRequired` | Envelope and replay rules |
| Safety gates | legal / payment / ops / SOS / market gate snapshot inputs |

### Pack26C authorization boundaries (this packet)

| Rule | Requirement |
| --- | --- |
| Registry execution | **NO** — read metadata only in future implementation |
| UI affordance wiring | **NO** |
| Backend route wiring | **NO** |
| Action enablement | **NO** — registry remains non-executing until separately authorized |
| Pack25 behavior | **Unchanged** |

---

## 9. Readiness and gate evidence

Future Pack26C contract must define required evidence snapshots at attempt time:

| Gate / evidence type | Snapshot must capture |
| --- | --- |
| **Legal gate** | Allowed/blocked, reason code, market/legal scope reference |
| **Payment gate** | Allowed/blocked, reason code, no fake payment claims |
| **Ops gate** | Allowed/blocked, operator coverage reference |
| **SOS gate** | Allowed/blocked, highest-gate reason, no fake emergency claims |
| **Market gate** | Market code, eligibility, market-limited flags |
| **Human approval gate** | Required approvals, satisfied/missing, approver role (redacted IDs as needed) |
| **Readiness state** | Effective readiness level from Pack26A/Pack26B models |
| **Capability flag state** | Relevant `executionEnabled`, `uiAffordanceAllowed`, and readiness flags |

**Rule:** Snapshots are **evidence of gate evaluation** — not authorization to bypass gates or claim production readiness.

---

## 10. Redaction and safety rules

| Rule | Requirement |
| --- | --- |
| Secrets | **Never** store JWTs, PINs, Authorization headers, database URLs, or full env values in audit/timeline |
| Personal data | **No unsafe personal data exposure** in owner timeline |
| Owner timeline | Owner-safe labels and summaries only |
| Operator/admin evidence | May be more detailed but **still redacted** for secrets and unsafe data |
| Market/legal/SOS/payment info | Must be **safe and non-claiming** — no fake dispatch, payment captured, or emergency response claims |
| Forbidden claims | Must pass `viona-forbidden-claims-check.mjs --strict` in future implementation |
| Operating Protocol | Subordinate to no-fake production boundary |

---

## 11. Future implementation boundaries

Future Pack26C **implementation** may only be opened by **separate authorization** (§13) and may initially include:

| Surface | Allowed in future implementation pack |
| --- | --- |
| TypeScript types | Audit/timeline/envelope/snapshot types |
| Pure helper builders | Read-only builders for contract objects — no side effects |
| Validators / check scripts | Schema consistency, taxonomy completeness, redaction rules |
| Registry read integration | Read Pack26B metadata only — no execution |

Future Pack26C implementation must **NOT** initially include:

| Surface | Forbidden |
| --- | --- |
| DB writes | **NO** |
| Schema migrations | **NO** |
| Audit DB writes | **NO** |
| Timeline DB writes | **NO** |
| Backend route wiring | **NO** |
| UI wiring | **NO** |
| Execution | **NO** |
| Status POST changes | **NO** |
| New transitions | **NO** |
| Deploy / live QA | **NO** — unless separately authorized |

---

## 12. Explicit non-authorization

This authorization packet does **NOT** authorize:

| Category | Status |
| --- | --- |
| Pack26C implementation | **NO** |
| Code changes | **NO** |
| DB / schema / migration | **NO** |
| Audit DB writes | **NO** |
| Timeline DB writes | **NO** |
| New backend routes | **NO** |
| Write endpoints | **NO** |
| UI wiring | **NO** |
| Registry execution | **NO** |
| Execution enablement | **NO** |
| Status POST changes | **NO** |
| New transitions | **NO** |
| assign / confirm / cancel execution | **NO** |
| booking / payment / SOS / wallet / live AI execution | **NO** |
| deploy / live QA | **NO** |
| staging / auth / data mutation | **NO** |
| Pack27 / Pack28 | **NO** |
| Pack25 Option C violation | **NO** — no click/status POST on current row |
| Production or full automation claims | **NO** |

---

## 13. Required operator phrase for future implementation

Future Pack26C **implementation** requires a **separate** explicit operator phrase in a dedicated implementation pack prompt:

```txt
APPROVE_PACK26C_UNIFIED_AUDIT_TIMELINE_CONTRACT_IMPLEMENTATION_STAGING_SAFE
```

| Rule | Requirement |
| --- | --- |
| This packet alone | **Does NOT** authorize implementation |
| Phrase must appear verbatim | In the future implementation pack authorization |
| Without phrase | Cursor must **stop** and report — no code changes |
| With phrase | Still bound by §11 boundaries, §8 registry read-only rules, §10 redaction rules, and file allowlist in that pack |
| Deploy / live QA / DB writes / UI wiring | **Separate** authorization even if implementation phrase provided |

**Do not execute implementation unless that exact future phrase is provided in a separate step.**

---

## 14. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Code changed | **NO** |
| UI / backend / runtime changed | **NO** |
| Prisma schema / migrations changed | **NO** |
| `.env*` changed | **NO** |
| Deploy / live QA / status POST | **NO** |
| Staging / auth / data / DB activity | **NO** |
| Secrets printed | **NO** |
| Pack26C implementation opened | **NO** |
| Pack26B registry execution enabled | **NO** — remains read-only / unwired / non-executing |
| Pack26 implementation opened | **NO** |
| Pack27 / Pack28 opened | **NO** |

---

## 15. Recommendation

| Decision | Recommendation |
| --- | --- |
| Pack26C authorization packet | **APPROVE for merge** — docs-only; defines unified audit/timeline contract scope |
| Pack26C implementation | **NOT authorized** until operator provides §13 phrase in separate pack |
| Pack25 Option C | **HOLD** — unchanged |
| Pack26B registry | **Read-only / unwired / non-executing** — unchanged |
| Next step after merge | Operator may authorize `CURSOR_PACK26C_UNIFIED_AUDIT_TIMELINE_CONTRACT_IMPLEMENTATION_*` with exact phrase + allowlist |

**Operator action required for implementation:** separate pack with verbatim phrase `APPROVE_PACK26C_UNIFIED_AUDIT_TIMELINE_CONTRACT_IMPLEMENTATION_STAGING_SAFE`, explicit file allowlist, and future implementation test gates.
