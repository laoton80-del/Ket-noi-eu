# VIONA Request Engine — Pack26D Operator Approval / Human-in-the-loop Implementation

**Document type:** Staging-safe non-persistent contract/policy implementation evidence.
**Packet ID:** `CURSOR_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_IMPLEMENTATION_STAGING_SAFE`
**Baseline:** `origin/master @ 297f299` — `docs(pack26d): sync kernel handoff after operator approval authorization (#200)`.
**Operator phrase:** `APPROVE_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_IMPLEMENTATION_STAGING_SAFE` — **RECEIVED**

---

## 1. Authorization chain

| Milestone | Status |
| --- | --- |
| Pack25 chain | **CLOSED / GREEN** through PR #188 |
| Pack25 Option C hold | **PRESERVED** — row `ec9a8b69-8a60-45aa-99ba-fc805a101dcc` |
| Pack26A planning + kernel sync | **CLOSED / GREEN** through PR #189 / #190 |
| Pack26B chain | **CLOSED / GREEN** through PR #191–#194 |
| Pack26C chain | **CLOSED / GREEN** through PR #195–#198 |
| Pack26D authorization packet | **CLOSED / GREEN** — PR #199 @ `d2a0510` |
| Pack26D authorization Kernel/Handoff sync | **CLOSED / GREEN** — PR #200 @ `297f299` |
| Pack26D implementation | **AUTHORIZED** by operator phrase (this pack) |
| Pack27 / Pack28 | **NOT opened** |
| payment / SOS / wallet / live AI execution | **NOT opened** |

---

## 2. Implementation scope

| Component | Implemented |
| --- | --- |
| Approval requirement taxonomy types | **YES** — 10 categories |
| Human role taxonomy types | **YES** — 9 roles |
| Approval decision envelope types | **YES** |
| Gate outcome types | **YES** — 7 outcomes |
| Pure policy mapping helpers | **YES** |
| Pure decision builders | **YES** — 7 builders |
| Pure validators | **YES** — 4 validators |
| Pack26D consistency check script | **YES** |
| DB / schema / migration | **NO** |
| Approval DB writes | **NO** |
| Audit/timeline DB writes | **NO** |
| UI/backend route wiring | **NO** |
| Registry execution | **NO** |
| Execution enablement | **NO** |
| Pack25 behavior changes | **NO** |
| New transitions | **NO** |
| Deploy / live QA / status POST | **NO** |
| Staging/auth/data activity | **NO** |

### Allowed files

| Path |
| --- |
| `src/lib/viona/operatorApproval/vionaOperatorApprovalTypes.ts` |
| `src/lib/viona/operatorApproval/vionaOperatorApprovalPolicy.ts` |
| `src/lib/viona/operatorApproval/vionaOperatorApprovalBuilders.ts` |
| `src/lib/viona/operatorApproval/vionaOperatorApprovalValidators.ts` |
| `src/lib/viona/operatorApproval/index.ts` |
| `scripts/viona-pack26d-operator-approval-check.mjs` |
| `docs/product/VIONA_REQUEST_PACK26D_OPERATOR_APPROVAL_HUMAN_LOOP_IMPLEMENTATION.md` |
| `docs/design/evidence/cursor-pack26d-operator-approval-human-loop-implementation/README.md` |

---

## 3. Contract surfaces

### Approval requirement taxonomy

`none`, `operator_review_required`, `merchant_review_required`, `owner_confirmation_required`, `admin_review_required`, `safety_escalation_required`, `legal_review_required`, `payment_review_required`, `sos_manual_review_required`, `blocked_until_capability_enabled`.

Sensitive categories are **planning-only / non-executing**.

### Human roles

`request_owner`, `merchant_operator`, `viona_operator`, `admin`, `safety_reviewer`, `legal_reviewer`, `payment_reviewer`, `sos_reviewer`, `system_gate` — semantic only; no auth system implemented.

### Approval decision envelope

`approvalDecisionId`, `actionId`, `targetType`, `targetId`, `requestedByRole`, `requiredApprovalRole`, `approvalRequirement`, `decision`, `decisionReason`, `gateOutcome`, `readinessState`, `capabilityFlagsSnapshot`, `executionEnabledSnapshot` (always false), `uiAffordanceAllowedSnapshot` (always false), `humanReviewRequired`, `blockedReason`, `safetyLevel`, `redactionLevel`, `correlationId`, `idempotencyKey`, `createdAt`, `decidedAt`, `operatorMessage`, `userFacingMessage`.

### Gate outcomes

`allow_read_only`, `allow_preview_only`, `require_human_review`, `block_execution`, `block_ui_affordance`, `block_sensitive_lane`, `block_until_capability_enabled`.

### Action-to-approval mapping (9 Pack26B action IDs)

All policies: `executionAuthorized: false`, `uiAffordanceAuthorized: false`, `planningOnly: true`. Unknown action IDs return safe blocked policy.

---

## 4. Pure policy helpers

| Helper | Purpose |
| --- | --- |
| `getVionaApprovalPolicyForAction` | Lookup policy by action ID |
| `getVionaApprovalRequirementForAction` | Resolve default approval requirement |
| `evaluateVionaHumanLoopGate` | Pure gate evaluation — no execution |

---

## 5. Pure builders

| Builder | Purpose |
| --- | --- |
| `buildVionaApprovalDecision` | General decision envelope |
| `buildPendingVionaApprovalDecision` | Pending human review |
| `buildApprovedVionaApprovalDecision` | Approved — still non-executing |
| `buildRejectedVionaApprovalDecision` | Rejected |
| `buildBlockedVionaApprovalDecision` | Blocked |
| `buildNotRequiredVionaApprovalDecision` | Not required — still non-executing |
| `buildSupersededVionaApprovalDecision` | Superseded |

---

## 6. Pure validators

| Validator | Purpose |
| --- | --- |
| `validateVionaApprovalPolicy` | Policy invariants |
| `validateVionaApprovalDecision` | Decision envelope invariants |
| `validateVionaHumanLoopGateEvaluation` | Gate evaluation invariants |
| `assertVionaOperatorApprovalLayerSafe` | Layer-wide safety assert |

---

## 7. Preserved boundaries

| Boundary | Status |
| --- | --- |
| Pack26B registry | **Read-only / unwired / non-executing** — unchanged |
| Pack26C contract | **Pure / non-persistent / non-executing** — unchanged |
| Pack25 Option C | **HOLD** — no click/status POST on current visual-QA row |
| Pack27 / Pack28 | **NOT opened** |

---

## 8. Explicit non-authorization

This implementation does **NOT** authorize: DB writes; audit/timeline/approval DB writes; schema/migration changes; backend routes; write endpoints; UI wiring; registry execution; execution enablement; status POST changes; new transitions; assign/confirm/cancel execution; booking/payment/SOS/wallet/live AI execution; deploy; live QA; staging/auth/data mutation; Pack27/Pack28; production/full automation claims.

---

## 9. Check script

`node scripts/viona-pack26d-operator-approval-check.mjs` — verifies files, taxonomies, policy mapping, non-executing flags, forbidden runtime patterns, Pack26B/Pack26C checks, and contract smoke.
