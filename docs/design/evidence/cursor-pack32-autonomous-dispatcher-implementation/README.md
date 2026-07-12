# Pack32 — Agentic Autonomous Dispatcher: Implementation Evidence

**Operator phrase:** `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_IMPLEMENTATION` — provided this session.
**Source master:** `f93cdbe` — PR #306 merged (Pack32 planning packet).
**Branch:** `feat/pack32-autonomous-dispatcher-implementation`
**Plan:** `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md`

---

## 1. Scope delivered

| # | File | Type | Purpose |
| --- | --- | --- | --- |
| 1 | `src/lib/viona/dispatcher/vionaToolRegistry.ts` | NEW | `VIONA_TOOL_REGISTRY` (exactly 1 entry: `twilio_test_sms_poc`), `findVionaToolRegistryEntry()` (exact-match only), `validateVionaToolInputAgainstSchema()`, `assertVionaToolRegistryLinkedActionIdsAreKnown()` |
| 2 | `src/lib/viona/dispatcher/vionaIntentRouter.ts` | NEW | `routeVionaDispatchIntent()` (pure classification + validation), `buildVionaDispatchClassificationPrompt()`, `defaultVionaDispatchCallLlm()` (reuses `createRoutedChatCompletion()`) |
| 3 | `src/services/viona/vionaAutonomousDispatchService.ts` | NEW | `dispatchVionaAutonomousRequest()` — the orchestrator: Intent Router → Tool Registry lookup → existing `previewVionaExecutionPlanRealProviderPocRoute()` (Pack30D-4 + Pack31), unmodified |
| 4 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | MODIFY (additive) | +3 event types: `dispatcherIntentRejected`, `dispatcherToolSelected`, `dispatcherHallucinationBlocked` |
| 5 | `scripts/test-viona-pack32-autonomous-dispatcher.ts` | NEW | 13 runnable test cases (plan §6, cases 1–13) |
| 6 | `scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts` | MODIFY (regression fix) | Updated hardcoded event-type-count assertion for the +3 Pack32 additions (same pattern as the Pack31 fix) |
| 7 | `scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` | MODIFY (regression fix) | Updated hardcoded event-type-count assertion for the +3 Pack32 additions |
| 8 | `docs/design/evidence/cursor-pack32-autonomous-dispatcher-implementation/README.md` | NEW | This document |

**No other file is touched.** In particular: `buildVionaExecutionPlan()`, `vionaRequestEscrowHoldService.ts`, `vionaTwilioTestRealProviderAdapter.ts`, `previewVionaExecutionPlanRealProviderPocRoute()`, `VIONA_ACTION_REGISTRY` (Pack26B), `prisma/schema.prisma`, `.env*`, `package.json`/lockfile, any controller/route, and any frontend/UI file are all **untouched**.

---

## 2. Deviations from the plan's §5.1 file allowlist (both narrower than planned, documented in advance)

The plan's §5.1 allowlist listed 8 files, including two the plan itself flagged as optional:

1. **`prisma/schema.prisma` — not touched.** The plan (§5.2) explicitly noted the proposed
   `AGENTIC_DISPATCH_CLASSIFICATION` enum value "may be dropped in favor of reusing
   `ROUTING_INQUIRY` if the operator prefers zero schema change for Pack32." This implementation
   takes that documented option: `defaultVionaDispatchCallLlm()` calls `createRoutedChatCompletion({
   taskType: LlmRouterTaskType.ROUTING_INQUIRY, ... })` — the existing, unmodified enum value. Zero
   migration, zero schema diff (verified below).
2. **`src/services/ai/AIRouterService.ts` — not touched.** The plan's §5.1 item 5 ("wire the new
   task type into `resolveRoutedModel()`'s tier map") is moot once no new enum value is added —
   `ROUTING_INQUIRY` already resolves to `gpt-4o-mini` via the existing, unmodified switch.
3. The plan's §5.1 items 1–2 described a types-only file plus a router file; this implementation
   combines the Tool Registry's own tiny type definitions directly into
   `vionaToolRegistry.ts` rather than a third, separate types-only file — a narrower footprint with
   the same public surface, and `vionaIntentRouter.ts` imports its types from there.

Net effect: **6 files touched instead of 8**, and the two dropped files (`prisma/schema.prisma`,
`AIRouterService.ts`) are the two the plan itself called out as optional/schema-adjacent — this is
a subtractive deviation (less surface area, less risk), never an additive one.

One improvement over the plan's own illustrative example: the plan's §3.3 illustrative
`linkedActionId` was `request.assign`; the actual implementation links `twilio_test_sms_poc` to
`live_ai.action` instead — the existing Pack26B registry entry literally described as "Autonomous
live AI action" — a better semantic fit, discovered while reading the real registry file during
implementation (not a scope change; `live_ai.action` was already a registered, `executionEnabled:
false` Pack26B entry, referenced only for traceability, exactly as designed).

---

## 3. Human-in-the-Loop Consent Principle — enforced structurally, not just by convention

`dispatchVionaAutonomousRequest()` forwards `operatorApprovalGranted`/`userConsentGranted` to the
existing, unmodified `previewVionaExecutionPlanRealProviderPocRoute()` with exactly this code:

```ts
operatorApprovalGranted: input.operatorApprovalGranted === true,
userConsentGranted: input.userConsentGranted === true,
```

Both right-hand sides reference only the caller-supplied `input.*` fields — never the LLM's
`decision.confidence`, `decision.rationale`, or any other Intent-Router-derived value. Test case 2
(`testOrchestratorNeverOverridesHumanApprovalFlags`) verifies this via a spy on the injected
`routeExecutor`: when the caller passes `operatorApprovalGranted: false`, the spy observes
`false` reaching the existing pipeline, byte-for-byte. Test case 13
(`testDispatcherNeverHardcodesApprovalOrConsentTrue`) additionally source-scans
`vionaAutonomousDispatchService.ts` for the literal patterns `operatorApprovalGranted: true` /
`userConsentGranted: true` and asserts neither exists — the only way either flag can ever become
`true` is if the human caller supplied `true`.

---

## 4. Exact-match hallucination defense — verified

`findVionaToolRegistryEntry()` is an `Object.freeze`d `Record` lookup by exact string key — there
is no fuzzy-matching, Levenshtein-distance, or "closest tool" logic anywhere in this
implementation. Test case 3 verifies an invented tool name (`send_real_stripe_charge`) is rejected
as `unknown_tool` with **zero** downstream calls (a spy on `routeExecutor` records 0 invocations)
and exactly one `dispatcherHallucinationBlocked` audit row.

---

## 5. Test plan results (13/13 runnable cases, plan §6 cases 1–13)

| # | Test | Result |
| --- | --- | --- |
| 1 | Happy path: valid tool + valid input + confidence ≥ 0.6 | PASS |
| 2 | `operatorApprovalGranted:false` forwarded unmodified (HITL) | PASS |
| 3 | Hallucinated/unregistered tool → `unknown_tool`, 0 downstream calls | PASS |
| 4 | Missing required field → `tool_input_schema_invalid` | PASS |
| 5 | Malformed JSON response → `response_not_valid_json` | PASS |
| 6 | Confidence below threshold → `low_confidence` | PASS |
| 7 | Injected `callLlm` throws → `llm_call_failed`, never rethrown | PASS |
| 8 | Full happy path via fake `routeExecutor` — passthrough unchanged | PASS |
| 9 | Simulated insufficient-funds hold failure — passthrough unchanged | PASS |
| 10 | Simulated Twilio failure + refund — passthrough unchanged | PASS |
| 11 | Source-scan: no LangChain/LlamaIndex/agent-framework import | PASS |
| 12 | Source-scan: `package.json` has no new agent-framework dependency | PASS |
| 13 | Source-scan: no literal `operatorApprovalGranted:true`/`userConsentGranted:true` | PASS |

Plan cases 14–15 (regression suite, `tsc`/`lint`) run separately — see §6.

Command: `npx tsx scripts/test-viona-pack32-autonomous-dispatcher.ts` →
`PASS Pack32 agentic autonomous dispatcher tests (13/13 runnable test-plan cases + registry integrity check)`

---

## 6. Quality gates (all green)

| Gate | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`, includes `prisma generate`) | **PASS**, 0 errors |
| `npm run lint` | **PASS**, 0 errors (180 pre-existing warnings, none in any Pack32 file) |
| `scripts/test-viona-pack32-autonomous-dispatcher.ts` | **PASS 13/13** |
| `scripts/test-viona-pack29-execution-gate.ts` (regression) | **PASS** |
| `scripts/test-viona-pack30a-execution-plan.ts` (regression) | **PASS 13/13** |
| `scripts/test-viona-pack30b-execution-plan-route.ts` (regression) | **PASS 17/17** |
| `scripts/test-viona-pack30d1-execution-audit-ledger-writer.ts` (regression, updated for +3 count) | **PASS 12/12** |
| `scripts/test-viona-pack30d2-state-machine-audit-hooks.ts` (regression, updated for +3 count) | **PASS 11/11** |
| `scripts/test-viona-pack30d2-real-provider-execution-poc.ts` (Pack30D-4, regression) | **PASS 13/13** |
| `scripts/test-viona-pack30d3-frontend-audit-trail-timeline.ts` (regression) | **PASS 11/11** |
| `scripts/test-viona-pack31-financial-escrow.ts` (regression) | **PASS 14/14** |

The two regression-script edits were required for the same reason the Pack31 implementation
required them: both scripts hardcode `vionaRequestAuditEventTypes.length` and needed their
expected-count assertion updated for Pack32's +3 additions — the fix pattern is copied verbatim
from the Pack31 precedent (`+3` documented constant, not an open-ended tolerance).

---

## 7. Drift Report

| Check | Result |
| --- | --- |
| `prisma/schema.prisma` diff vs `origin/master` | **EMPTY** |
| `.env*` diff vs `origin/master` | **EMPTY** |
| `package.json` / `package-lock.json` diff vs `origin/master` | **EMPTY** — no new dependency of any kind |
| New HTTP route / controller | **NONE** — `dispatchVionaAutonomousRequest`/`vionaAutonomousDispatchService` referenced only by its own new files + the plan doc, never by any controller/route file (verified via repo-wide grep) |
| `buildVionaExecutionPlan()` / Pack31 hold-settle-refund / Pack30D-4 `executeReal()` modified | **NO** — all three reused byte-for-byte unchanged |
| `Wallet` / `Transaction` / `VionaRequestEscrowHold` write in this pack's own code | **NONE new** — all writes still happen only inside the existing, unmodified Pack31 service, reached only through the existing, unmodified route function |
| Real or mocked-live LLM call made by any test in this pack | **NONE** — every test injects a fake `callLlm`; `defaultVionaDispatchCallLlm()` (the only path that would call OpenAI) is never invoked by any test |
| Real Twilio/Stripe call made by any test in this pack | **NONE** |
| Dispatcher self-granting `operatorApprovalGranted`/`userConsentGranted` | **NONE** — verified structurally (§3) and by source-scan (test 13) |
| Secrets printed | **NONE** |
| Production authorized | **NO** |

---

## 8. Explicit NO / YES assertions

| Assertion | Value |
| --- | --- |
| Intent Router implemented | **YES** |
| Tool Registry implemented (exact-match only) | **YES** |
| Hallucination/error fallback implemented (5 of 6 documented reasons; the 6th, `missing_operator_approval`, is the pre-existing, unmodified `buildVionaExecutionPlan()` behavior, reused as-is) | **YES** |
| Human-in-the-Loop Consent Principle enforced structurally | **YES** |
| Connection flow Dispatcher → Pack31 → Pack30D → Settle wired via the existing, unmodified route function | **YES** |
| New LangChain/LlamaIndex/agent-framework dependency added | **NO** |
| New `package.json`/lockfile dependency of any kind | **NO** |
| Prisma migration run / schema changed | **NO** |
| New HTTP route/controller added | **NO** |
| Frontend/UI changed | **NO** |
| `buildVionaExecutionPlan()`/Pack31/Pack30D-4 internals modified | **NO** |
| All 13 runnable test-plan cases pass | **YES** |
| `tsc --noEmit` / `npm run lint` pass with 0 errors | **YES** |
| All prior Pack25/29/30A/30B/30D-1..4/31 regression suites pass | **YES** |
| Real LLM/Twilio/Stripe call made anywhere in this session | **NO** |
| Production authorized | **NO** |
| Phrase `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_IMPLEMENTATION` provided and recorded | **YES** |

---

## 9. Recommended next step

1. Open a PR for this implementation branch — **do not merge** (operator review required).
2. After merge + post-merge verification: a **separate**, future pack could wire
   `dispatchVionaAutonomousRequest()` into an HTTP route/controller (still requiring its own
   operator phrase — nothing in this implementation authorizes that wiring), or extend the Tool
   Registry with a second tool (plan §9 non-goal, also its own future pack).

Real execution against live (billable) providers remains **BLOCKED** (Pack30D-4's production
hard-block, unchanged and untouched). Production remains **NOT AUTHORIZED**.
