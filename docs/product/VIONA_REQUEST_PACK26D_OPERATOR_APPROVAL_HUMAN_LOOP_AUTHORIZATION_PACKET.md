# VIONA Request Engine — Pack26D Operator Approval / Human-in-the-loop Authorization Packet

**Document type:** Future implementation authorization packet (docs-only — no implementation, deploy, live QA, or data mutation in this pack).
**Packet ID:** `CURSOR_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_AUTHORIZATION_PACKET_DOCS_ONLY`
**Baseline:** `origin/master @ f690544` — `docs(pack26c): sync kernel handoff after audit timeline implementation (#198)`.
**Related:** `docs/product/VIONA_REQUEST_PACK26A_GLOBAL_ACTION_AUTOMATION_SPINE_READINESS_MATRIX.md`, `docs/product/VIONA_REQUEST_PACK26B_ACTION_REGISTRY_CAPABILITY_FLAGS_IMPLEMENTATION.md`, `docs/product/VIONA_REQUEST_PACK26C_UNIFIED_AUDIT_TIMELINE_CONTRACT_IMPLEMENTATION.md`, `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`, `docs/ai-context/VIONA_OPERATING_PROTOCOL.md`

---

## 1. Baseline

| Field | Value |
| --- | --- |
| Operating Protocol read | **YES** (required before any future execution) |
| Docs-only authorization packet | **YES** |
| Current verified master | **`f690544`** |
| Pack26D implementation opened | **NO** |
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
| Action Registry + capability flags | **CLOSED / GREEN** through PR #191–#194 |
| Registry state | **Read-only / unwired / non-executing** — all `executionEnabled === false`, all `uiAffordanceAllowed === false` |

### Pack26C closure chain

| Milestone | Status |
| --- | --- |
| Unified audit/timeline contract authorization | **CLOSED / GREEN** — PR #195 @ `79ad17a` |
| Authorization Kernel/Handoff sync | **CLOSED / GREEN** — PR #196 @ `67dad74` |
| Contract implementation | **CLOSED / GREEN** — PR #197 @ `de9e127` |
| Implementation Kernel/Handoff sync | **CLOSED / GREEN** — PR #198 @ `f690544` |
| Contract layer state | **Pure / non-persistent / non-executing** — no DB writes, no runtime wiring |

**This packet prepares authorization scope only.** It does **not** authorize implementation, code changes, deploy, live QA, status POST, data mutation, approval DB writes, audit/timeline persistence, or Pack27/Pack28 unless the operator issues **separate explicit authorization** with the required implementation phrase (§12).

---

## 2. Pack26D purpose

Pack26D defines the **future operator approval / human-in-the-loop layer** for VIONA action safety.

### Why approval is required

Before any future sensitive action execution lane opens, VIONA must define **who must review**, **what decision is required**, and **how blocked vs approved states are represented** — without implying live automation or bypassing safety gates.

Sensitive actions (assign, confirm, cancel, booking, payment, SOS, wallet, live AI) must not proceed without explicit human-in-loop policy — even when registry metadata and audit/timeline contracts exist.

### Position in the spine

```
Pack26A (spine planning)
    ↓
Pack26B (Action Registry — read-only metadata)
    ↓
Pack26C (Audit/Timeline contract — pure types/helpers)
    ↓
Pack26D (Operator approval / human-in-loop — THIS PACKET — planning only)
    ↓
future execution lanes (Pack27+ — NOT authorized here)
```

Pack26D sits **between** Pack26B registry metadata and Pack26C audit/timeline contracts on one side, and **future execution lanes** on the other. It defines **approval policy and decision envelopes** — not execution.

### What Pack26D does not do

| Rule | Requirement |
| --- | --- |
| Executes actions | **NO** |
| Enables UI affordances | **NO** |
| Writes to DB | **NO** |
| Wires registry or contract into runtime | **NO** |
| Replaces Pack26B or Pack26C | **NO** |

---

## 3. Scope

This authorization packet covers **planning only**:

| Surface | In scope |
| --- | --- |
| Approval policy model | **YES** — definitions only |
| Approval requirement taxonomy | **YES** |
| Approval decision envelope | **YES** — contract planning |
| Human-in-loop roles | **YES** — semantic only |
| Gate evaluation semantics | **YES** — planning outcomes |
| Action-to-approval mapping plan | **YES** — matrix only |
| Future implementation boundaries | **YES** |
| Evidence requirements | **YES** |
| Safety / redaction requirements | **YES** |
| Explicit non-authorization | **YES** |

---

## 4. Relationship to Pack26B

Pack26B Action Registry remains **unchanged** by this packet:

| State | Value |
| --- | --- |
| Read-only | **YES** |
| Unwired | **YES** |
| Non-executing | **YES** |
| All `executionEnabled` | **false** |
| All `uiAffordanceAllowed` | **false** |

Pack26D may **reference** these Pack26B action IDs in documentation only:

| actionId | Notes |
| --- | --- |
| `request.status.submitted_to_triage` | Pack25 reference — existing proven behavior; docs only |
| `request.assign` | Future-blocked — planning only |
| `request.confirm` | Future-blocked — planning only |
| `request.cancel` | Future-blocked — planning only |
| `booking.request` | Future-blocked — planning only |
| `payment.intent` | Future-blocked — planning only |
| `sos.assist` | Future-blocked — highest gate — planning only |
| `wallet.adjustment` | Future-blocked — highest gate — planning only |
| `live_ai.action` | Future-blocked — highest gate — planning only |

Pack26D authorization does **NOT** add: new action IDs; new transitions; execution behavior; UI affordances; backend writes.

---

## 5. Relationship to Pack26C

Pack26C audit/timeline contract layer remains **unchanged** by this packet:

| State | Value |
| --- | --- |
| Pure TypeScript contract layer | **YES** |
| Non-persistent | **YES** |
| Non-executing | **YES** |
| DB writes | **NO** |
| Audit/timeline persistence | **NO** |
| Runtime wiring | **NO** |

Future Pack26D **implementation** may define approval decision contracts that can later be **represented** through Pack26C audit/timeline envelopes and snapshots — but this authorization packet does **not** wire, persist, or execute anything.

---

## 6. Approval requirement taxonomy

Planned approval requirement types (definitions only — **planning-only / non-executing**):

| Type | Code | Meaning |
| --- | --- | --- |
| None | `none` | No human approval required for visibility/read-only context |
| Operator review | `operator_review_required` | VIONA operator must review before progression |
| Merchant review | `merchant_review_required` | Merchant actor must review |
| Owner confirmation | `owner_confirmation_required` | Request owner must explicitly confirm |
| Admin review | `admin_review_required` | Platform admin review required |
| Safety escalation | `safety_escalation_required` | Trust & Safety / escalation path |
| Legal review | `legal_review_required` | Legal/compliance review required |
| Payment review | `payment_review_required` | Payment integrity review required |
| SOS manual review | `sos_manual_review_required` | Highest gate — manual SOS review; no fake emergency claims |
| Blocked until capability | `blocked_until_capability_enabled` | Action blocked until registry readiness permits |

**Rule:** All sensitive categories (`payment_review_required`, `sos_manual_review_required`, `legal_review_required`, etc.) are **planning-only / non-executing** until separately authorized implementation packs with evidence.

---

## 7. Human roles

Planned semantic roles (no auth system implemented in this packet):

| Role | Code | Purpose |
| --- | --- | --- |
| Request owner | `request_owner` | Owner of the target request/object |
| Merchant operator | `merchant_operator` | Merchant-side operator |
| VIONA operator | `viona_operator` | Internal VIONA ops/support |
| Admin | `admin` | Platform administrator |
| Safety reviewer | `safety_reviewer` | Trust & Safety escalation |
| Legal reviewer | `legal_reviewer` | Legal/compliance reviewer |
| Payment reviewer | `payment_reviewer` | Payment integrity reviewer |
| SOS reviewer | `sos_reviewer` | SOS / emergency lane reviewer |
| System gate | `system_gate` | Automated gate evaluation (read-only metadata; not execution) |

**Clarifications:**

- Roles are **semantic only** in this packet.
- No auth/permission system is implemented.
- No user accounts are modified.
- No role assignment is implemented.

---

## 8. Approval decision envelope

Planned decision envelope fields (contract planning only — not live API/DTO):

| Field | Type / purpose |
| --- | --- |
| `approvalDecisionId` | Unique stable identifier for the decision record |
| `actionId` | Pack26B registry key |
| `targetType` | e.g. `viona_request` |
| `targetId` | Target object identifier |
| `requestedByRole` | Role that initiated the approval request |
| `requiredApprovalRole` | Role required to decide |
| `decision` | See decision values below |
| `decisionReason` | Operator-readable, non-secret reason |
| `readinessState` | Readiness at evaluation time |
| `capabilityFlagsSnapshot` | Read-only registry/capability snapshot |
| `executionEnabledSnapshot` | Must reflect **false** until separately authorized |
| `uiAffordanceAllowedSnapshot` | Must reflect **false** until separately authorized |
| `humanReviewRequired` | Boolean — whether human review is mandated |
| `blockedReason` | When blocked — safe operator-readable message |
| `safetyLevel` | demo / pilot / staging / production-safe label |
| `redactionLevel` | none / partial / operator_only_detail |
| `correlationId` | Cross-service trace (non-secret) |
| `idempotencyKey` | Replay scope key |
| `createdAt` | UTC timestamp — caller-supplied in future implementation |
| `decidedAt` | UTC timestamp when decision recorded — caller-supplied |
| `operatorMessage` | Operator-facing message — no secrets |
| `userFacingMessage` | Owner-safe message — minimal and non-claiming |

### Planned decision values

| Value | Meaning |
| --- | --- |
| `not_required` | Approval not required for this context |
| `pending_review` | Awaiting human review |
| `approved` | Human approved — does **not** imply execution enabled in Pack26D |
| `rejected` | Human rejected |
| `blocked` | Blocked by gate policy |
| `expired` | Approval window expired |
| `superseded` | Superseded by newer decision |

**Rule:** `approved` in the envelope is a **planning contract value only** — it does **not** authorize execution, UI affordances, or backend writes in Pack26D.

---

## 9. Gate semantics

Planned gate outcomes (evaluation semantics — **no gate is executed in this packet**):

| Outcome | Meaning |
| --- | --- |
| `allow_read_only` | Read-only visibility permitted |
| `allow_preview_only` | Preview/draft visibility only |
| `require_human_review` | Must obtain human approval before any future execution lane |
| `block_execution` | Execution blocked |
| `block_ui_affordance` | UI affordance blocked |
| `block_sensitive_lane` | Payment/SOS/wallet/live AI lane blocked |
| `block_until_capability_enabled` | Blocked until registry readiness permits |

**Clarifications:**

- No gate is executed in this packet.
- No UI affordance is enabled.
- No action execution is enabled.
- No backend write is added.

---

## 10. Initial action-to-approval mapping plan

Future planning matrix (docs-only — **no execution authorized**):

| Action family | actionId | Future approval default | Current Pack26D status |
| --- | --- | --- | --- |
| Request status submitted→triage | `request.status.submitted_to_triage` | `operator_review_required` before broader automation | docs-only |
| Request assign | `request.assign` | `operator_review_required` + `admin_review_required` | docs-only |
| Request confirm | `request.confirm` | `merchant_review_required` + `operator_review_required` | docs-only |
| Request cancel | `request.cancel` | `owner_confirmation_required` / `merchant_review_required` / `operator_review_required` (actor-dependent) | docs-only |
| Booking request | `booking.request` | `merchant_review_required` + `operator_review_required` | docs-only |
| Payment intent | `payment.intent` | `payment_review_required` | docs-only |
| SOS assist | `sos.assist` | `sos_manual_review_required` | docs-only |
| Wallet adjustment | `wallet.adjustment` | `admin_review_required` + `payment_review_required` | docs-only |
| Live AI action | `live_ai.action` | `safety_escalation_required` + `operator_review_required` | docs-only |

All entries are **planning-only**. No execution is authorized.

---

## 11. Redaction and safety

| Rule | Requirement |
| --- | --- |
| Secrets | **Never** store JWTs, PINs, Authorization headers, database URLs, or full env values |
| Personal sensitive content | **No** unsafe exposure in evidence or messages |
| User-facing messages | Safe, minimal, non-claiming — no fake production outcomes |
| Operator messages | Must not leak secrets or internal credentials |
| SOS / payment / legal | No fake dispatch, payment captured, or official certification claims |
| Forbidden claims | Future implementation must pass `viona-forbidden-claims-check.mjs --strict` |

---

## 12. Evidence requirements for future implementation

Future Pack26D **implementation** pack must prove:

| Gate | Requirement |
| --- | --- |
| No execution enabled | All snapshots and helpers keep execution disabled unless separately authorized |
| No UI/backend wiring | Unless separately authorized in that pack |
| No DB writes | Unless separately authorized |
| No new transitions | **YES** |
| Pack27 / Pack28 | **NOT opened** |
| `node scripts/viona-pack26b-action-registry-check.mjs` | **PASS** |
| `node scripts/viona-pack26c-audit-timeline-contract-check.mjs` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run smoke` | **PASS** |
| `node scripts/viona-forbidden-claims-check.mjs --strict` | **PASS** |
| Allowlist diff gate | Only Pack26D-authorized files changed |

---

## 13. Future implementation authorization phrase

Future Pack26D **implementation** requires a **separate** explicit operator phrase:

```txt
APPROVE_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_IMPLEMENTATION_STAGING_SAFE
```

| Rule | Requirement |
| --- | --- |
| This packet alone | **Does NOT** authorize implementation |
| Phrase must appear verbatim | In the future implementation pack authorization |
| Without phrase | Cursor must **stop** and report — no code changes |
| With phrase | Still bound by §12 boundaries and file allowlist in that pack |
| UI wiring / DB writes / execution | **Separate** authorization even if implementation phrase provided |

**Do not execute implementation unless that exact future phrase is provided in a separate step.**

---

## 14. Explicit non-authorization

This Pack26D authorization packet does **NOT** authorize:

| Category | Status |
| --- | --- |
| Implementation code | **NO** |
| UI wiring | **NO** |
| Backend route wiring | **NO** |
| Registry execution | **NO** |
| Execution enablement | **NO** |
| Audit/timeline DB writes | **NO** |
| Approval DB writes | **NO** |
| Schema / migration changes | **NO** |
| Supabase / Prisma / SQL activity | **NO** |
| Deploy / restart | **NO** |
| Live QA | **NO** |
| Status POST | **NO** |
| Send to review click | **NO** |
| Staging / auth / data mutation | **NO** |
| Pack27 | **NO** |
| Pack28 | **NO** |
| Payment execution | **NO** |
| SOS execution | **NO** |
| Wallet execution | **NO** |
| Live AI execution | **NO** |
| Booking execution | **NO** |
| assign / confirm / cancel execution | **NO** |
| Production / full automation claims | **NO** |
| Pack25 Option C violation | **NO** — no click/status POST on current visual-QA row |

---

## 15. Safety attestations (this docs pack)

| Check | Result |
| --- | --- |
| Code changed | **NO** |
| UI / backend / runtime changed | **NO** |
| Prisma schema / migrations changed | **NO** |
| `.env*` changed | **NO** |
| Deploy / live QA / status POST | **NO** |
| Staging / auth / data / DB activity | **NO** |
| Secrets printed | **NO** |
| Pack26D implementation opened | **NO** |
| Pack26B registry modified | **NO** |
| Pack26C contract modified | **NO** |
| Pack27 / Pack28 opened | **NO** |

---

## 16. Recommendation and next step

| Decision | Recommendation |
| --- | --- |
| Pack26D authorization packet | **APPROVE for merge** — docs-only; defines future human-in-loop scope |
| Pack26D implementation | **NOT authorized** until operator provides §13 phrase in separate pack |
| Pack25 Option C | **HOLD** — unchanged |
| Pack26B registry | **Read-only / unwired / non-executing** — unchanged |
| Pack26C contract | **Pure / non-persistent / non-executing** — unchanged |
| **Next step after merge** | **Pack26D authorization Kernel/Handoff sync** (docs-only) |

**Operator action required for implementation:** separate pack with verbatim phrase `APPROVE_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_IMPLEMENTATION_STAGING_SAFE`, explicit file allowlist, and §12 gates.
