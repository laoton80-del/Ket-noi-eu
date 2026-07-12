# VIONA Request Engine — Pack32: Agentic Autonomous Dispatcher (Planning Packet)

**Document type:** Planning packet (docs-only — no implementation, no Prisma migration, no schema
change applied, no real money movement, no real provider call, no API calls, no deploy, no data
mutation, no `.ts`/`.tsx` file touched in this pack).
**Packet ID:** `CURSOR_PACK32_AUTONOMOUS_DISPATCHER_PLANNING_DOCS_ONLY`
**Operator phrase:** `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_PLANNING` — provided this session, unlocks
**planning only**, not implementation.
**Source master:** `20c6db4` — PR #305 merged (VIG→VIO terminology correction + Pack31 escrow
implementation). Operator confirmed the merge **and** that the Pack31 migration was run
successfully against the database (real `VionaRequestEscrowHold` table now exists).
**Branch:** `docs/pack32-autonomous-dispatcher-planning`
**Status:** `pack32_autonomous_dispatcher_planning_only`
**Related:** `docs/product/VIONA_PACK31_FINANCIAL_ESCROW_PLAN.md`,
`docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md`,
`docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_DESIGN_PLAN_PACKET.md`,
`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` §16 (Visionary Roadmap — Level 3,
**Human-in-the-Loop Consent Principle**), §12 (Master Economy).

---

## 0. Why this packet now

Pack30D built the **hand** (a real-provider adapter, Twilio Test Credentials POC, flag-gated,
audit-bound). Pack31 built the **wallet** (a Zero-Loss escrow hold/settle/refund gate in front of
that hand). Both are triggered today only by a **human HTTP caller** passing explicit
`operatorApprovalGranted`/`userConsentGranted` booleans and structured parameters
(`fromNumber`/`toNumber`/`body`) directly in the request body — there is no "brain" deciding *which*
action to take or *how* to fill in its parameters from a natural-language request. The operator has
now ordered Pack32: design (not build) that brain — an **Agentic Autonomous Dispatcher** that reads
a request/intent, decides which registered tool applies, and routes the decision into the existing
Pack31→Pack30D pipeline unchanged. This packet is **planning only**: it designs the Intent Router,
the Tool Registry, the hallucination/error-fallback state machine, the exact connection points into
Pack30D/31, the file allowlist, and the test plan for a **future, separate** implementation pack —
following the same staged-rollout discipline as every Pack29/30/31 packet before it.

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack32 planning authorized | **YES** — this packet |
| Phrase `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_PLANNING` | **Required: YES \| Provided: YES (operator chat, this session) \| Recorded: YES — this document + evidence + Handoff** |
| Pack32 **implementation** authorized | **NO** — requires a **separate**, future implementation PR scoped to §8 below, with its own operator phrase |
| Prisma schema change / migration | **NO** — §5 is a description of a proposed future change only; `prisma/schema.prisma` is untouched by this packet |
| Any LLM API call, real or mocked-live | **NO** — this packet contains no code, and no test is run |
| `.ts`/`.tsx` file changes in this packet | **NO — zero, verified in §12 Drift Report** |

**This packet authorizes planning only.** It does not authorize implementation, any schema
migration, any LLM call, any tool execution, or any change to the existing Pack30D-4/Pack31 code.

---

## 2. Baseline — what already exists (this session's discovery)

| Existing primitive | File | What it already does |
| --- | --- | --- |
| `buildVionaExecutionPlan()` | `src/lib/viona/executionPlan/` | Deny-by-default policy evaluator: `invalid_input` → `unsupported_action` → `ineligible_status` → `blocked_safety_label` → `blocked_lane` → `missing_operator_approval` → `missing_user_consent` → **allowed**. Both approval booleans are supplied by the **caller** today — nothing in this repo infers them. |
| `holdVionaRequestExecutionCost()` / `settleVionaRequestExecutionHold()` / `refundVionaRequestExecutionHold()` | `src/services/viona/vionaRequestEscrowHoldService.ts` (Pack31, **now migrated to the real DB per the operator's confirmation**) | Atomic, idempotent VIO Credits hold/settle/refund against the real `Wallet`/`Transaction`/`VionaRequestEscrowHold` tables. |
| `executeVionaTwilioTestPocReal()` | `src/lib/viona/realProviderAdapter/vionaTwilioTestRealProviderAdapter.ts` (Pack30D-4) | The one real-provider call in this repo — Twilio Test Credentials, magic-numbers-only, flag-gated, audit-bound. |
| `previewVionaExecutionPlanRealProviderPocRoute()` | `src/services/viona/vionaExecutionPlanRouteService.ts` (Pack30D-4 + Pack31) | **This is the exact pipeline Pack32 must route into, unchanged**: plan → hold → `executeReal()` → settle. Today its inputs (`fromNumber`/`toNumber`/`body`, approval flags) come directly from an HTTP caller. Not yet wired to any Express route (service-layer only, by design). |
| `VIONA_ACTION_REGISTRY` (Pack26B) | `src/lib/viona/actions/vionaActionRegistry.ts` | An existing **UI-facing** action registry (`request.assign`, `booking.request`, `payment.intent`, `sos.assist`, `wallet.adjustment`, `live_ai.action`, …) — every entry has `executionEnabled: false` today. Read-only selectors: `getAllVionaActionRegistryEntries()`, `isVionaActionKnown()`, `isVionaActionExecutableInPack26B()`. **Not** LLM-facing (no parameter JSON-schema, no handler pointer) — Pack32's Tool Registry (§4.2) is a distinct, narrower, LLM-facing companion to this, not a replacement. |
| `createRoutedChatCompletion()` / `LlmRouterTaskType` | `src/services/ai/AIRouterService.ts`, `prisma/schema.prisma` | **Real, already-shipped OpenAI call path** with cost-tier routing and a durable `LlmApiUsageLog` (`taskType`, `model`, token counts). This is the **one and only** LLM call primitive Pack32 needs to reuse — no new SDK, no new provider integration. |
| `vionaRequestAuditEventTypes` | `src/domain/requests/vionaRequestAuditEventTypes.ts` | Already includes `executionPlanBuilt`/`executionBlockedPolicy`/`executionBlockedOperator`/`escrowHoldPlaced`/`escrowSettled`/`escrowRefunded` — every step Pack32 routes through **already** writes a durable audit row; Pack32 only needs a handful of new *dispatcher-specific* types (§5.3). |
| VionaRequest status machine | `src/domain/requests/vionaRequestStatusMachine.ts`, `vionaRequestStatusActionService.ts` | Status writes today are **human-HTTP-only** (`changedByUserId: authUserId`, `actorRoleLabel: 'owner'`). `actorType: 'system'` / `'aiDraftOnly'` are defined in domain types but **never used** by any writer today. |
| **Human-in-the-Loop Consent Principle** | `docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` §16, Level 3 | Already-canonical governing doctrine: any feature that would move real data/money/contracts must produce a plan and require explicit human "Confirm/Consent" before real execution — the **one** pre-consented exception is SOS. **This principle directly constrains Pack32's design (§3.4) — it is not optional.** |

### 2.1 Decision: no LangChain / LlamaIndex / heavy agent framework

The operator's boundary #2 is treated as a hard design constraint, not a preference. `createRoutedChatCompletion()` already gives Pack32 everything an agent framework would otherwise provide (model routing, cost tracking) — the only genuinely new capability needed is **"parse one LLM JSON response into a typed, validated dispatch decision, then call one of a small, fixed list of registered functions."** That is ~150–250 lines of plain TypeScript (a router + a registry + a switch/lookup), not a framework. No new `package.json` dependency is proposed anywhere in this packet.

---

## 3. Architecture — the Viona Intent Router

### 3.1 Shape (types only; illustrative, not applied by this packet)

```ts
// PROPOSED — illustrative only, NOT implemented by this packet.
export type VionaDispatchIntentInput = Readonly<{
  requestId: string;
  requestStatus: string;
  actionId?: string;
  userMessage: string; // the natural-language request text the dispatcher must classify
  requestSafetyLabels?: readonly string[];
}>;

// The LLM is asked to return EXACTLY this shape (JSON mode / structured output) — nothing else.
export type VionaDispatchLlmResponseShape = Readonly<{
  toolName: string; // must match a VionaToolRegistry entry's `name`, or dispatch is rejected
  toolInputRaw: Readonly<Record<string, unknown>>;
  confidence: number; // 0..1, self-reported by the model — advisory only, never trusted alone
  rationale: string; // short, logged, never shown to the end user as "proof" of correctness
}>;

export type VionaDispatchDecision =
  | Readonly<{ ok: true; toolName: string; toolInput: Readonly<Record<string, unknown>>; confidence: number }>
  | Readonly<{
      ok: false;
      reason:
        | 'llm_call_failed'
        | 'response_not_valid_json'
        | 'unknown_tool'
        | 'tool_input_schema_invalid'
        | 'low_confidence';
    }>;

// Pure function — no network, no DB. Given an already-fetched LLM response string, validates and
// classifies it. `callLlm` is injected so unit tests never make a real OpenAI call.
export declare function routeVionaDispatchIntent(
  input: VionaDispatchIntentInput,
  deps: { callLlm: (prompt: string) => Promise<string> },
): Promise<VionaDispatchDecision>;
```

### 3.2 The LLM call itself — reuses `createRoutedChatCompletion()`, adds one new task type

```ts
// PROPOSED addition to the EXISTING enum — illustrative only, NOT applied by this packet.
enum LlmRouterTaskType {
  // ... all existing values unchanged (SIMPLE_TRANSLATION, ROUTING_INQUIRY, COMPLEX_MARKETING,
  //     DEEP_CONTEXT) ...
  AGENTIC_DISPATCH_CLASSIFICATION // NEW — used only by the Viona Intent Router
}
```

The router builds one prompt (system message: "you are a strict JSON classifier, you may ONLY
choose from this exact list of tool names: [...]; if none apply, or you are unsure, respond with
`toolName: null`" + the Tool Registry's names/descriptions/param schemas serialized into the
prompt), calls `createRoutedChatCompletion({ taskType: AGENTIC_DISPATCH_CLASSIFICATION, params: {
response_format: { type: 'json_object' }, ... } })` (OpenAI JSON mode — already supported by the
underlying `openai` SDK this repo already depends on, no new dependency), and parses the single
JSON response. **No multi-step "agent loop," no autonomous retries with a different prompt, no
tool-calling-that-calls-itself** — one classification call, one decision, done.

### 3.3 Tool Registry — the fixed, small list of callable functions

```ts
// PROPOSED — illustrative only, NOT implemented by this packet.
export type VionaToolRegistryEntry = Readonly<{
  name: string; // e.g. "twilio_test_sms_poc" — stable, never reused for a different tool
  description: string; // shown to the LLM verbatim, so it must be precise and narrow
  /// Traceability link to the existing, unmodified Pack26B UI action registry — NOT a new,
  /// parallel action-ID system.
  linkedActionId: string; // e.g. "request.assign" (must satisfy isVionaActionKnown())
  inputSchema: Readonly<Record<string, 'string' | 'number' | 'boolean'>>; // minimal, no JSON-Schema library
  requiresOperatorApproval: true; // hard-coded true for every entry in Pack32 — see §3.4
}>;

export const VIONA_TOOL_REGISTRY: readonly VionaToolRegistryEntry[] = [
  {
    name: 'twilio_test_sms_poc',
    description: 'Send a single SMS via Twilio Test Credentials (sandbox-only, never a real SMS).',
    linkedActionId: 'request.assign',
    inputSchema: { fromNumber: 'string', toNumber: 'string', body: 'string' },
    requiresOperatorApproval: true,
  },
] as const;
```

At launch, the registry has **exactly one entry**, wrapping the existing Pack30D-4 Twilio POC — the
same one tool `previewVionaExecutionPlanRealProviderPocRoute()` already calls today. Growing the
registry (adding a second real tool) is explicitly **out of scope** for the first Pack32
implementation increment (§9).

### 3.4 The non-negotiable rule: the Dispatcher proposes, it never consents

Per the Kernel's Human-in-the-Loop Consent Principle (§16 Level 3, already canonical): **the LLM's
own `confidence` score and `rationale` are never treated as `operatorApprovalGranted` or
`userConsentGranted`.** The Intent Router's output (`VionaDispatchDecision`) is a **proposal**
only. The orchestrator (§4) still requires the pre-existing, human-supplied approval/consent
booleans to be `true` **before** `buildVionaExecutionPlan()` is even called — exactly as today. If
Pack32 is ever used in a flow where no human has yet confirmed, `buildVionaExecutionPlan()` denies
with `missing_operator_approval`/`missing_user_consent` **exactly as it already does today, with
zero new code needed for that guarantee** — it is a property of the existing, unmodified policy
function, not something Pack32 has to re-implement or could accidentally weaken.

---

## 4. Connection flow — Dispatcher Decision → Pack31 → Pack30D → Settle

This is the exact chain the operator required (§ boundary 3), and it reuses every existing function
unmodified:

```text
 (0) User/system produces a natural-language request or intent
        │
        ▼
 ┌─────────────────────┐   VionaDispatchDecision { ok: true, toolName, toolInput, confidence }
 │ (1) INTENT ROUTER    │──────────────────────────────────────────────────────────────────────┐
 │ routeVionaDispatch   │   ok:false (unknown_tool / invalid JSON / low_confidence / LLM error) │
 │ Intent()  (NEW)      │──────────────────────────────────┐                                   │
 └──────────────────────┘                                  ▼                                   │
                                              ┌─────────────────────────┐                       │
                                              │ REJECTED — deny-by-      │                       │
                                              │ default, audit row       │                       │
                                              │ written, ZERO downstream │                       │
                                              │ calls (§5, error table)  │                       │
                                              └─────────────────────────┘                       │
                                                                                                  ▼
                                                                          ┌──────────────────────────────┐
                                                                          │ (2) TOOL REGISTRY LOOKUP      │
                                                                          │ toolName -> VionaToolRegistry │
                                                                          │ Entry (exact match required) │
                                                                          └──────────┬───────────────────┘
                                                                                     │ found
                                                                                     ▼
                                                            ┌───────────────────────────────────────┐
                                                            │ (3) buildVionaExecutionPlan()           │
                                                            │ EXISTING, UNMODIFIED. Still requires    │
                                                            │ human operatorApprovalGranted +         │
                                                            │ userConsentGranted (§3.4) — the         │
                                                            │ Dispatcher NEVER sets these itself.     │
                                                            └──────────────────┬──────────────────────┘
                                                                        allowed│
                                                                               ▼
                                                    ┌─────────────────────────────────────────────┐
                                                    │ (4) Pack31 — holdVionaRequestExecutionCost()  │
                                                    │ EXISTING, UNMODIFIED. Zero-Loss gate — a      │
                                                    │ failed hold means step (5) is NEVER reached.  │
                                                    └──────────────────────┬────────────────────────┘
                                                                    ok:true│
                                                                           ▼
                                            ┌───────────────────────────────────────────────────────┐
                                            │ (5) Pack30D — executeVionaTwilioTestPocReal()          │
                                            │ EXISTING, UNMODIFIED. The `toolInput` validated in      │
                                            │ step (2)/(3) becomes this function's `intent` param.    │
                                            └───────────────────────────────┬─────────────────────────┘
                                                                            ▼
                                                    ┌────────────────────────────────────────────┐
                                                    │ (6) Pack31 — settleVionaRequestExecutionHold() │
                                                    │ EXISTING, UNMODIFIED. Full charge on           │
                                                    │ succeeded, full refund otherwise.               │
                                                    └────────────────────────────────────────────────┘
```

**Steps (2)–(6) are byte-for-byte the existing `previewVionaExecutionPlanRealProviderPocRoute()`
function** (Pack30D-4 + Pack31). Pack32's only new code is step (1) (the Intent Router) plus a thin
new orchestrator (§5.1 item 4, `vionaAutonomousDispatchService.ts`) that: looks up the tool in the
registry (step 2), maps `toolInput` onto that existing function's existing input shape, and calls
it. **No existing function's signature, behavior, or safety property changes.**

---

## 5. Error handling — LLM hallucination / invalid-order fallback

The State Machine's rule is **deny-by-default, fail closed, one deterministic reason per
rejection** — mirroring `buildVionaExecutionPlan()`'s own existing discipline exactly:

| Failure mode | Detected at | Result |
| --- | --- | --- |
| LLM call itself fails/times out | Step (1) | `ok: false, reason: 'llm_call_failed'` — zero downstream calls |
| LLM response is not valid JSON, or missing a required field | Step (1) | `ok: false, reason: 'response_not_valid_json'` — zero downstream calls |
| LLM invents a `toolName` not in `VIONA_TOOL_REGISTRY` (the classic "hallucination") | Step (2) | `ok: false, reason: 'unknown_tool'` — **exact-match lookup only, never a fuzzy/"closest match" fallback** — zero downstream calls |
| LLM's `toolInput` is missing a key the matched tool's `inputSchema` requires, or has the wrong primitive type | Step (2) | `ok: false, reason: 'tool_input_schema_invalid'` — zero downstream calls |
| LLM's self-reported `confidence` is below a fixed threshold (proposed: `0.6`) | Step (1) | `ok: false, reason: 'low_confidence'` — treated as "ask a human to clarify," never as "guess anyway" |
| Tool matched, input valid, **but no human approval/consent yet** | Step (3), existing `buildVionaExecutionPlan()` | `denialReason: 'missing_operator_approval'` / `'missing_user_consent'` — **zero new code**, this is the pre-existing policy function's existing behavior |
| Tool matched, plan allowed, **insufficient VIO Credits** | Step (4), existing Pack31 hold | `reason: 'insufficient_funds'` — **zero new code**, pre-existing Pack31 behavior; step (5) never reached |
| Real provider call fails/times out | Step (5), existing Pack30D-4 | `outcome: 'failedBounded'` — **zero new code**; step (6) settles with a **full refund** (§4 of the escrow plan) |

**Every rejection at step (1)/(2) writes exactly one new, durable audit row** (§5.3) before
returning — the same "audit every exit path" discipline `executeVionaTwilioTestPocReal()` already
uses. **No rejection ever falls through to "try the closest tool anyway" or "assume a default
tool"** — an unmatched or invalid dispatch is always a hard stop, never a best-effort guess.

---

## 5.1 Exact file allowlist — Pack32 implementation (future increment only, **NOT built in this packet**)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PLANNING PACKET`
**Precondition:** This planning packet merged and post-merge verified; a **separate**, explicit
operator phrase for implementation (not yet requested or provided).

| # | Path | Change type | Purpose |
| --- | --- | --- | --- |
| 1 | `src/lib/viona/dispatcher/vionaToolRegistry.ts` | **NEW** | `VIONA_TOOL_REGISTRY` (§3.3) + `findVionaToolRegistryEntry()`, `validateVionaToolInputAgainstSchema()` — pure, no DB, no network |
| 2 | `src/lib/viona/dispatcher/vionaIntentRouter.ts` | **NEW** | `routeVionaDispatchIntent()` (§3.1/§3.2), prompt builder, response-JSON validator — the `callLlm` dependency is injected so unit tests never call OpenAI |
| 3 | `src/services/viona/vionaAutonomousDispatchService.ts` | **NEW** | Thin orchestrator: intent router → registry lookup → `buildVionaExecutionPlan()` → `holdVionaRequestExecutionCost()` → `executeVionaTwilioTestPocReal()` → `settleVionaRequestExecutionHold()`. **Not wired to any HTTP route** in the first increment (mirrors Pack30D-4's own choice, §9) |
| 4 | `src/domain/requests/vionaRequestAuditEventTypes.ts` | **MODIFY (additive)** | Add `dispatcherIntentRejected`/`dispatcherToolSelected`/`dispatcherHallucinationBlocked` per §5.3 |
| 5 | `src/services/ai/AIRouterService.ts` | **MODIFY (narrow, additive)** | Wire the new `AGENTIC_DISPATCH_CLASSIFICATION` task type into the existing `resolveRoutedModel()` tier map only — **no other line changed** |
| 6 | `prisma/schema.prisma` | **MIGRATE (additive)** | Add one `LlmRouterTaskType` enum value per §3.2 — may be dropped in favor of reusing `ROUTING_INQUIRY` if the operator prefers zero schema change for Pack32 |
| 7 | `scripts/test-viona-pack32-autonomous-dispatcher.ts` | **NEW** | Test cases per §6 |
| 8 | `docs/design/evidence/cursor-pack32-autonomous-dispatcher-implementation/README.md` | **NEW** | Evidence doc for that future implementation PR |

**No other files may be touched.** In particular: **no changes** to `buildVionaExecutionPlan()`,
`vionaRequestEscrowHoldService.ts`, `vionaTwilioTestRealProviderAdapter.ts`,
`previewVionaExecutionPlanRealProviderPocRoute()` (all reused exactly as-is), `VIONA_ACTION_REGISTRY`
(Pack26B, reused read-only), any frontend/UI file, any new HTTP route/controller, `package.json` /
lockfile (**no new dependency of any kind**), or any live LLM/Stripe/Twilio credential.

| Area | Allowed in the future Pack32 implementation pack |
| --- | --- |
| New LangChain/LlamaIndex/agent-framework dependency | **NO — FORBIDDEN**, per operator boundary #2 |
| New `package.json` dependency of any kind | **NO** |
| Modification of `buildVionaExecutionPlan()`'s decision order or any existing denial reason | **NO** |
| Modification of Pack31 hold/settle/refund atomicity or idempotency contract | **NO** |
| Modification of Pack30D-4's `executeReal()` flag/validation/retry/audit logic | **NO** |
| New HTTP route exposing the dispatcher | **NO — service-layer only**, matching Pack30D-4 |
| Real LLM API call in the implementation's own test suite | **NO — injected fake `callLlm` only, exactly like Pack30D-4's injected fake transport** |
| Dispatcher self-granting `operatorApprovalGranted`/`userConsentGranted` | **NO — FORBIDDEN, structurally impossible per §3.4** |

### 5.2 Schema — proposed change (description only; no migration run, no `prisma/schema.prisma` diff in this packet)

```prisma
// PROPOSED — illustrative only, NOT applied by this packet.
enum LlmRouterTaskType {
  SIMPLE_TRANSLATION
  ROUTING_INQUIRY
  COMPLEX_MARKETING
  DEEP_CONTEXT
  AGENTIC_DISPATCH_CLASSIFICATION // NEW — see §3.2
}
```

No new table, no new model. `LlmApiUsageLog` already durably logs every call by `taskType` — no
change needed there.

### 5.3 Audit event types — reuse `appendVionaExecutionAuditEvent`, propose 3 new `eventType` values

```ts
// PROPOSED additions to the EXISTING vionaRequestAuditEventTypes array
// (src/domain/requests/vionaRequestAuditEventTypes.ts) — illustrative only, NOT applied by this packet.
'dispatcherIntentRejected'  // any step (1)/(2) rejection from §5's table
'dispatcherToolSelected'    // step (2) succeeded — a specific tool was matched and validated
'dispatcherHallucinationBlocked' // the specific unknown_tool case, kept distinct from other
                                  // rejections for observability/alerting purposes
```

All other steps of the pipeline (plan denial, hold, settle, refund, real-provider outcomes) already
have their own event types (§2 table) — Pack32 adds **only** the three above.

---

## 6. Required test plan — future implementation pack (not run in this packet)

| # | Test case | Category | Expected outcome |
| --- | --- | --- | --- |
| 1 | Mock LLM response: valid `toolName`, valid `toolInput`, confidence ≥ 0.6 | Happy path | `routeVionaDispatchIntent()` returns `ok: true` with the exact tool/input |
| 2 | Mock LLM response: valid tool + input, approval **not yet** granted by a human | Human-in-the-loop | Full pipeline denies at the existing `buildVionaExecutionPlan()` step (`missing_operator_approval`); **zero calls into Pack31/Pack30D** |
| 3 | Mock LLM response: `toolName: "send_real_stripe_charge"` (unregistered/hallucinated) | Hallucination | `ok: false, reason: 'unknown_tool'`; `dispatcherHallucinationBlocked` audit row; zero downstream calls |
| 4 | Mock LLM response: valid `toolName`, `toolInput` missing `body` | Schema violation | `ok: false, reason: 'tool_input_schema_invalid'`; zero downstream calls |
| 5 | Mock LLM response: not valid JSON (e.g. the model added prose around the JSON) | Malformed response | `ok: false, reason: 'response_not_valid_json'`; zero downstream calls |
| 6 | Mock LLM response: valid shape, `confidence: 0.2` | Low confidence | `ok: false, reason: 'low_confidence'`; zero downstream calls |
| 7 | Injected `callLlm` throws (simulated network/API error) | Fail-closed | `ok: false, reason: 'llm_call_failed'`; never throws out of `routeVionaDispatchIntent()` |
| 8 | Full happy path: valid intent → approval granted → sufficient VIO Credits → Twilio magic-number success | End-to-end (fakes only) | Hold placed, `executeReal()` succeeds, settle charges the full estimate, `dispatcherToolSelected` + all pre-existing Pack30D/31 audit rows present |
| 9 | Full path: valid intent → approval granted → **insufficient** VIO Credits | Zero-Loss gate (regression) | Hold fails closed; `executeReal()` **never called** — verified by a spy that throws if invoked |
| 10 | Full path: valid intent → approval granted → sufficient funds → Twilio failure magic number | Refund path (regression) | `executeReal()` returns `failedBounded`; settle issues a **full refund** — verified against the existing Pack31 settle policy, unchanged |
| 11 | Source-scan: no `langchain`/`llamaindex`/`autogen`/similar import anywhere in the new dispatcher files | Dependency isolation | Confirms operator boundary #2 |
| 12 | Source-scan: `package.json`/lockfile diff empty | Dependency isolation | No new dependency added |
| 13 | Source-scan: no dispatcher file ever sets `operatorApprovalGranted: true` or `userConsentGranted: true` as a literal/computed-from-LLM-output value | Human-in-the-loop enforcement | Confirms §3.4 structurally |
| 14 | Existing Pack25/29/30A/30B/30D-1..4/31 regression scripts | Regression | **PASS** unchanged |
| 15 | `tsc --noEmit` / `npm run lint` | Quality gate | **PASS**, 0 errors |

---

## 7. Staged rollout ladder (Pack32, new — mirrors the Pack30D/31 discipline)

| Step | Pack | Authorizes | Real execution / money movement |
| --- | --- | --- | --- |
| 1 | Pack32 planning (**THIS PACKET**) | Intent Router design, Tool Registry design, error/hallucination fallback design, connection flow, file allowlist, test plan | **NO — planning only** |
| 2 | Pack32 Kernel/Handoff sync | Docs-only record on master | NO |
| 3 | Pack32 implementation (future, separate PR, exact allowlist in §5.1, own operator phrase) | Intent Router + Tool Registry + orchestrator code, wired to reuse Pack30D/31 exactly as-is | **NO** — every test uses an injected fake `callLlm` and the existing fake Twilio transport; no real OpenAI/Twilio call in the test suite |
| 4 | Pack32 staging QA (future, separate pack, own phrase) | Verify against a real (but still test-credentials-scoped) OpenAI call + Twilio Test Credentials on staging | Real OpenAI classification call (low-cost), still Twilio **Test Credentials only** |
| 5 | Production readiness review (separate legal/ops/finance review, per `VIONA_OPERATING_PROTOCOL.md` and Pack30D §10) | The only step that could ever authorize the Dispatcher to route toward a **live, billable** real-provider tool | Only after this step, if separately authorized — **not proposed or scheduled by this packet** |

---

## 8. Non-goals / forbidden scope (this packet)

| Forbidden category | Status |
| --- | --- |
| Prisma migration / schema change applied | **FORBIDDEN in this packet** — §5.2 is description only |
| Any real or mocked-live LLM API call | **FORBIDDEN** |
| Any real Twilio/Stripe/other real-provider call | **FORBIDDEN** — unchanged from Pack30D-4/31 |
| New `package.json`/lockfile dependency | **FORBIDDEN — always**, per operator boundary #2 |
| Dispatcher self-granting operator approval / user consent | **FORBIDDEN — always**, per §3.4 |
| `Wallet`/`Transaction`/`VionaRequestEscrowHold` write of any kind | **FORBIDDEN in this packet** |
| `VionaRequest.status` mutation | **FORBIDDEN** |
| New HTTP route | **FORBIDDEN in this packet** |
| Frontend/UI change | **FORBIDDEN in this packet** |
| Production | **FORBIDDEN** |
| Secrets printed | **FORBIDDEN** |
| `.ts`/`.tsx` file change **in this packet** | **FORBIDDEN** — verified empty in §12 |

---

## 9. Non-goals — also out of scope for the *first Pack32 implementation increment* (future)

To keep the first implementation increment as narrow as Pack30D-4's own first increment was:

- **Multi-tool registries / a second real tool.** The registry ships with exactly one entry
  (§3.3) — the existing Twilio POC. Adding a second tool (e.g. a future billable provider) is a
  separate, future pack with its own planning packet, exactly like Pack30D-2 preceded Pack30D-4.
- **Multi-turn conversation / clarification loops.** A `low_confidence` or `unknown_tool` result is
  a hard stop, not a "the AI asks a follow-up question" loop — that UX is a future pack, not Pack32.
- **Any HTTP route** exposing the dispatcher to a real client. Service-layer only, like Pack30D-4.
- **Any change to how `VionaRequest.status` transitions** — the dispatcher only *reaches* the
  existing execution-plan pipeline; it does not touch the separate Pack25 status state machine.

---

## 10. Drift Report (this packet)

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** (verified: `git diff --name-only` against `origin/master` for this branch contains only the files listed in §11) |
| `prisma/schema.prisma` diff | **EMPTY** — §5.2 is illustrative Prisma syntax inside a markdown code block, not an applied schema change |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| `Wallet` / `Transaction` / `VionaRequestEscrowHold` write | **NONE** |
| Real or mocked-live LLM / provider network code | **NONE** |
| Secrets printed | **NONE** |
| Real execution / real money movement enabled | **NO** |
| Production authorized | **NO** |

---

## 11. Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md` (this document) |
| Created | `docs/design/evidence/cursor-pack32-autonomous-dispatcher-planning-packet/README.md` |

**No other file is touched by this packet.**

---

## 12. Explicit NO / YES assertions (this packet)

| Assertion | Value |
| --- | --- |
| Planning / design document written | **YES** |
| Existing Pack30D-4/Pack31 pipeline discovered and reused (not duplicated) | **YES — §2, §4** |
| Viona Intent Router designed | **YES — §3.1, §3.2** |
| Tool Registry designed | **YES — §3.3** |
| Hallucination/error fallback state machine designed | **YES — §5** |
| Human-in-the-Loop Consent Principle explicitly enforced by design (not just by convention) | **YES — §3.4** |
| Exact connection flow Dispatcher → Pack31 → Pack30D → Settle specified | **YES — §4** |
| New LangChain/LlamaIndex/agent-framework dependency proposed | **NO — explicitly forbidden, §8** |
| Exact file allowlist for future implementation | **YES — §5.1** |
| Test plan for future implementation | **YES — §6, 15 cases** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Prisma migration run | **NO** |
| Real LLM/Twilio/Stripe call made | **NO** |
| `Wallet`/`Transaction`/`VionaRequestEscrowHold` row written | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Phrase `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_PLANNING` provided and recorded | **YES** |
| Phrase authorizes implementation directly | **NO — planning only, per §1 and this ladder (§7)** |

---

## 13. Recommended next step

1. **Open PR** for this planning packet — docs-only; exactly the two files in §11.
2. **Merge and post-merge verify.**
3. **Docs-only Kernel/Handoff sync** — separate pack; record this planning packet on the canonical
   Kernel file (`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`).
4. Only then prepare a **separate Pack32 implementation pack** with exactly the file allowlist in
   §5.1, the test plan in §6, and its own, distinct operator phrase — implementing the Intent
   Router, the Tool Registry, and the thin orchestrator, using an **injected fake `callLlm`** in
   every test (never a real OpenAI call in the test suite), routing into the existing, unmodified
   Pack30D-4/Pack31 pipeline.
5. **Do not implement any part of §3/§5.2/§5.1 from this packet.** Do not run any Prisma migration
   from this packet. Do not add any new `package.json` dependency.

Real execution against live (billable) providers remains **BLOCKED** (Pack30D-4's production
hard-block, unchanged). Production remains **NOT AUTHORIZED**. PR chain **#251 → #305** preserved.

Evidence: `docs/design/evidence/cursor-pack32-autonomous-dispatcher-planning-packet/README.md`
