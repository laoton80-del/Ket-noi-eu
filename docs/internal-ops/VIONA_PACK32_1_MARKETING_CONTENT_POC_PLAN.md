# VIONA Internal Ops — Pack32.1: Marketing Content Generator Tool Expansion (Planning Packet)

**Document type:** Planning packet (docs-only — no implementation, no Prisma migration, no schema
change applied, no real money movement, no real provider call, no API calls, no deploy, no data
mutation, no `.ts`/`.tsx` file touched in this pack).
**Packet ID:** `CURSOR_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING_DOCS_ONLY`
**Operator phrase:** `APPROVE_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING` — provided this
session, unlocks **planning only**, not implementation.
**Source master:** `e39fd13` — PR #309 merged (Pack33 planning packet). Pack33
**implementation** (PR #310) is open, not yet merged, and is unaffected by this packet.
**Branch:** `docs/pack32-1-marketing-content-poc-planning`
**Status:** `pack32_1_marketing_content_generator_planning_only`
**Why `docs/internal-ops/` and not `docs/product/`:** this is an **internal operations tool**
(drafting marketing copy for the VIONA team to review), not a core-product/customer-facing feature
— placing it outside `docs/product/` keeps the core-product roadmap-freeze boundary visible in the
repo's own folder structure, per the operator's explicit framing of this as a **Tool Expansion**,
not a new product lane.
**Related:** `docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md` (PR #306, the Dispatcher this
packet extends), `docs/product/VIONA_REQUEST_PACK30D_REAL_EXECUTION_PLAN.md`,
`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md` §16 (Human-in-the-Loop Consent
Principle).

---

## 0. Why this packet now

The operator has approved integrating an existing internal marketing-automation POC into the
Pack32 Autonomous Dispatcher — **framed explicitly as a Tool Expansion of Pack32**, not a new
product feature, so it does not touch or reopen the core-product roadmap freeze. Pack32 shipped
with exactly one tool (`twilio_test_sms_poc`) and its own planning packet documented that "adding a
second tool is explicitly out of scope for the first implementation increment and requires its own,
separate planning packet" — this **is** that packet, for a second tool:
`marketing_content_generator`. This packet is **planning only**: it discovers and inventories the
*already-existing* marketing-content infrastructure this repo ships today, designs the new Tool
Registry entry and its (narrower, non-financial) dispatch path, and produces a file allowlist and
test plan for a future, separate implementation pack.

---

## 1. Header — authorization state (this packet)

| Field | Value |
| --- | --- |
| Pack32.1 planning authorized | **YES** — this packet |
| Phrase `APPROVE_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING` | **Required: YES \| Provided: YES (operator chat, this session) \| Recorded: YES — this document + evidence + Handoff** |
| Pack32.1 **implementation** authorized | **NO** — requires a **separate**, future implementation PR scoped to §6 below, with its own operator phrase |
| Prisma schema change / migration | **NO — none proposed at all** (unlike Pack32's own planning packet, this design needs **zero** schema change — see §2) |
| Any LLM API call, real or mocked-live | **NO** — this packet contains no code, and no test is run |
| Any social-media post (real or mocked) | **NO — and never proposed for the implementation pack either**, per boundary #3 below |
| `.ts`/`.tsx` file changes in this packet | **NO — zero, verified in §10 Drift Report** |

**This packet authorizes planning only.** It does not authorize implementation, any schema
migration, any LLM call, any tool execution, or any change to existing Pack32/marketing code.

---

## 2. Baseline — what already exists (this session's discovery)

This session's most important finding: **VIONA already ships a complete, working, human-approval
marketing-draft pipeline** — this packet's entire design is "wire the Pack32 Dispatcher onto the
front of it," not "build a marketing feature."

| Existing primitive | File | What it already does |
| --- | --- | --- |
| `MarketingPost` / `MarketingTranslation` models, `MarketingPostStatus` enum (`DRAFT`/`PUBLISHED`/`REJECTED`) | `prisma/schema.prisma` | **Already the exact "Execution Plan (Draft) awaiting Operator approval" data shape boundary #3 requires** — a post is always created `DRAFT` and only a separate, explicit admin action can ever move it to `PUBLISHED`. **Zero new columns or tables needed for this packet.** |
| `generateViGlobalFacebookPost()` / `createMarketingDraftFromOpenAI()` / `generateTranslations()` | `src/services/marketing/AIPostGenerator.ts` | Real, already-shipped calls to `createRoutedChatCompletion({ taskType: LlmRouterTaskType.COMPLEX_MARKETING, ... })` that generate copy and persist a `MarketingPost` row with `status: DRAFT` — **never calls Facebook**. `generateTranslations()` is an existing polyglot pack (multi-language) but is only invoked **after** an operator approves a post (see next row). |
| `LlmRouterTaskType.COMPLEX_MARKETING` | `prisma/schema.prisma` | Already exists — **reusing it needs no Prisma migration at all**, unlike Pack32's own planning packet, which proposed (and left optional) a brand new enum value for intent classification. |
| `getMarketingPosts` / `putMarketingPost` / `postMarketingApproveAndTranslate` / `postMarketingPostPublish` / `deleteMarketingDraft` | `src/controllers/AdminMarketingController.ts`, wired in `src/routes/adminRoutes.ts` | **The Human-in-the-Loop review UI already exists and is already wired end-to-end**: list drafts, edit a draft's text, approve + fan out translations, publish to the official Facebook Page (`publishToFacebookPage()`, the **one and only** function in this repo that ever calls a live social API), or delete/reject a draft. **This packet proposes zero changes to any of these five functions or their routes.** |
| `MarketingApprovalScreen.tsx` | `src/screens/admin/MarketingApprovalScreen.tsx` | The existing admin-facing screen that renders the above — **no new UI is proposed anywhere in this packet or its future implementation increment.** |
| `runMarketingDraftCronJob()` | `src/services/marketing/AutoPoster.ts` (called from `postTriggerAutoPost` and a scheduled worker) | An existing, unrelated trigger for the *daily-stats* draft flow — untouched by this packet; this packet's new tool is a distinct, on-demand, topic/tone/language-parameterized draft generator, not a replacement for the cron job. |
| Pack32 Tool Registry / Intent Router / exact-match lookup | `src/lib/viona/dispatcher/vionaToolRegistry.ts`, `vionaIntentRouter.ts` | The exact infrastructure boundary #2 requires reuse of — **both are reused verbatim**, see §3. |
| `dispatchVionaAutonomousRequest()` | `src/services/viona/vionaAutonomousDispatchService.ts` (Pack32) | The **existing** orchestrator, wired specifically to the `VionaRequest` → `buildVionaExecutionPlan()` → Pack31 escrow → Pack30D-4 `executeReal()` pipeline. **This packet does not propose modifying this function at all** — see §3.3 for why a *new*, sibling orchestrator is designed instead. |
| `VionaRequestAuditEvent` | `prisma/schema.prisma` | `requestId` is a **mandatory, non-nullable foreign key** to `VionaRequest`. A marketing-content draft has no `VionaRequest` counterpart, so this table is **structurally the wrong place** to log this tool's activity — see §5.4. |

### 2.1 Decision: no LangChain / LlamaIndex / heavy agent framework (unchanged from Pack32)

Exactly as Pack32's own planning packet concluded: `createRoutedChatCompletion()` already provides
everything an agent framework would otherwise provide. This packet adds no new LLM SDK and no new
`package.json` dependency of any kind.

### 2.2 Decision: this tool never touches money, so it never touches Pack31

Pack32's original tool (`twilio_test_sms_poc`) has a real per-call cost and therefore must flow
through the Pack31 Zero-Loss escrow gate before `executeReal()`. Generating marketing copy has
**no such cost model in this codebase today** — the existing `AIPostGenerator.ts` functions already
call `COMPLEX_MARKETING` directly, with no wallet/escrow involvement, and this packet does not
change that precedent. This is why `marketing_content_generator` needs a **new, second dispatch
category**, not a variant of the existing `viona_request_execution` category — see §3.3.

---

## 3. Architecture — Tool Registry expansion + a new, sibling dispatch category

### 3.1 Tool Registry entry (illustrative; NOT implemented by this packet)

```ts
// PROPOSED — illustrative only, NOT implemented by this packet.
export type VionaToolRegistryCategory = 'viona_request_execution' | 'content_generation_draft';

export type VionaToolRegistryEntry = Readonly<{
  name: string;
  description: string;
  // NEW, additive field — see §3.3 for why the dispatch path branches on this.
  category: VionaToolRegistryCategory;
  // Now OPTIONAL: only 'viona_request_execution' tools need a Pack26B traceability link;
  // 'content_generation_draft' tools have no VionaRequest counterpart to link to.
  linkedActionId?: string;
  inputSchema: Readonly<Record<string, 'string' | 'number' | 'boolean'>>;
  requiresOperatorApproval: true;
}>;

export const VIONA_TOOL_REGISTRY: readonly VionaToolRegistryEntry[] = [
  {
    name: 'twilio_test_sms_poc',
    description: 'Send a single SMS via Twilio Test Credentials (sandbox-only, never a real SMS).',
    category: 'viona_request_execution', // NEW field on the EXISTING entry — additive, no behavior change
    linkedActionId: 'request.assign',
    inputSchema: { fromNumber: 'string', toNumber: 'string', body: 'string' },
    requiresOperatorApproval: true,
  },
  {
    name: 'marketing_content_generator', // NEW
    description:
      'Draft a short multi-lingual marketing/social-copy text for a given topic and tone. NEVER posts anywhere — always persists a DRAFT MarketingPost row awaiting human review in the existing admin approval screen.',
    category: 'content_generation_draft',
    // No linkedActionId — this tool has no VionaRequest/execution-plan counterpart, see §2.2.
    inputSchema: { topic: 'string', tone: 'string', targetLanguageCode: 'string' },
    requiresOperatorApproval: true,
  },
] as const;
```

`category` is additive on the existing type/entry — `findVionaToolRegistryEntry()`'s exact-match
lookup and `validateVionaToolInputAgainstSchema()`'s schema check (§3 of the Pack32 plan) are
**reused completely unmodified**; only the *caller* (the new orchestrator, §3.3) branches on
`category` to decide which downstream pipeline to invoke.

**Single language per call, by design.** `inputSchema` only supports primitive field types
(`string`/`number`/`boolean`), matching the existing, deliberately-minimal Pack32 schema checker —
no array type is introduced. A multi-language campaign is either (a) the Dispatcher proposing the
tool once per target language, or (b) — more realistically — an operator using the **already
existing** `postMarketingApproveAndTranslate` polyglot pack (`generateTranslations()`) after
approving the single base-language draft this tool produces. Both paths are unchanged existing
behavior; this packet does not add a new multi-language input shape.

### 3.2 The LLM call for classification — reuses the existing Pack32 Intent Router verbatim

`routeVionaDispatchIntent()` (`vionaIntentRouter.ts`) is reused **completely unmodified** — same
prompt-building approach (serializing the Tool Registry's names/descriptions/schemas, including
the new `marketing_content_generator` entry, into the classification prompt), same
`ok:true|ok:false` decision shape, same injectable `callLlm` dependency for tests. No new
`LlmRouterTaskType` enum value is needed for classification (Pack32 already reuses `ROUTING_INQUIRY`
per its own implementation — unaffected by this packet).

### 3.3 A new, sibling orchestrator — `dispatchVionaMarketingContentRequest()`

The existing Pack32 orchestrator, `dispatchVionaAutonomousRequest()`
(`vionaAutonomousDispatchService.ts`), is wired specifically to
`buildVionaExecutionPlan() → holdVionaRequestExecutionCost() → executeVionaTwilioTestPocReal() →
settleVionaRequestExecutionHold()`. Branching that function's internals on `category` would mean
touching already-shipped, already-tested, safety-critical code for an unrelated, non-financial tool
class — an unnecessary regression risk. Instead, this packet proposes a **new, additive, sibling**
function in a **new** file:

```ts
// PROPOSED — illustrative only, NOT implemented by this packet.
export type VionaMarketingContentDispatchResult =
  | Readonly<{ ok: true; marketingPostId: string; content: string }>
  | Readonly<{
      ok: false;
      reason:
        | 'llm_call_failed'              // Intent Router's own LLM call failed
        | 'response_not_valid_json'      // Intent Router's own response wasn't valid JSON
        | 'unknown_tool'                 // hallucinated tool name
        | 'wrong_tool_category'          // matched a REAL 'viona_request_execution' tool via this entrypoint — hard stop, never silently reroute
        | 'tool_input_schema_invalid'    // missing/mistyped topic/tone/targetLanguageCode
        | 'low_confidence'               // Intent Router's own confidence gate
        | 'content_generation_failed';   // NEW — the content-generation LLM call itself failed/returned empty
    }>;

export declare function dispatchVionaMarketingContentRequest(
  input: Readonly<{ userMessage: string }>,
  deps: {
    callLlm: (prompt: string) => Promise<string>;
    generateDraft?: typeof generateVionaMarketingContentDraft; // injectable — see §6 item 2
  },
): Promise<VionaMarketingContentDispatchResult>;
```

Flow: **(1)** call the existing, unmodified `routeVionaDispatchIntent()` exactly as Pack32 already
does → **(2)** look up the returned `toolName` in the existing, unmodified
`VIONA_TOOL_REGISTRY`/`findVionaToolRegistryEntry()` → **(3)** if the matched entry's `category` is
`'viona_request_execution'` (i.e. this entrypoint was called for the *wrong* tool), hard-stop with
`wrong_tool_category` — **this entrypoint must never silently forward a real-execution tool call
anywhere**, it is not a generic router, it is scoped to content-generation tools only → **(4)**
validate `toolInput` against the matched entry's `inputSchema` using the existing, unmodified
`validateVionaToolInputAgainstSchema()` → **(5)** call a new function,
`generateVionaMarketingContentDraft()` (§3.4), which performs the actual `COMPLEX_MARKETING` LLM
call and persists the `MarketingPost` row → return its result.

**No hold, no escrow, no `executeReal()`, no settle/refund anywhere in this flow** — per §2.2, this
tool class has no cost model in this codebase, matching the precedent already set by
`AIPostGenerator.ts`'s existing, unescrowed `COMPLEX_MARKETING` calls.

### 3.4 `generateVionaMarketingContentDraft()` — a new, narrow, topic/tone-parameterized generator

```ts
// PROPOSED addition to the EXISTING src/services/marketing/AIPostGenerator.ts — illustrative
// only, NOT implemented by this packet.
export async function generateVionaMarketingContentDraft(input: Readonly<{
  topic: string;
  tone: string;
  targetLanguageCode: string;
}>): Promise<Readonly<{ marketingPostId: string; content: string }>> {
  // Reuses createRoutedChatCompletion({ taskType: LlmRouterTaskType.COMPLEX_MARKETING, ... })
  // exactly like generateViGlobalFacebookPost() already does — same task type, same cost tier,
  // same LlmApiUsageLog durability, just a different, caller-supplied prompt (topic/tone/language
  // instead of the hardcoded daily-stats prompt).
  // Persists via getPrisma().marketingPost.create({ data: { content, status: 'DRAFT' } }) —
  // the exact same call shape createMarketingDraftFromOpenAI() already uses today.
}
```

This is the **only** genuinely new LLM-calling code in the whole tool — and it reuses the existing
task type, the existing Prisma model, and the existing `DRAFT` status default. No new Prisma
migration is required anywhere in this design.

### 3.5 Human-in-the-Loop: the existing admin approval screen *is* the required gate

Boundary #3 requires the AI's output be returned as a Draft awaiting Operator approval, with **no**
automated posting. This is satisfied structurally, not by convention:

- `generateVionaMarketingContentDraft()` **only ever** calls `marketingPost.create({ data: {
  status: 'DRAFT' } })` — `MarketingPostStatus.DRAFT` is the type's own default, and this packet's
  design never sets any other status.
- The **only** function in this entire repository that calls a live social API is
  `publishToFacebookPage()`, invoked **only** from the existing `postMarketingPostPublish` admin
  controller action. Neither this packet nor its proposed future implementation touches that
  controller, that route, or `publishToFacebookPage()` in any way.
- The operator already has a working review UI (`MarketingApprovalScreen.tsx`) for exactly this
  `DRAFT` state — **no new UI is proposed**.
- `dispatchVionaMarketingContentRequest()` is not wired to any HTTP route in the first
  implementation increment (mirrors the existing Pack30D-4/Pack32 precedent of "service-layer only,
  new capability introduced with the smallest possible blast radius").

---

## 4. Connection flow

```text
 (0) User/system produces a natural-language content request
        │
        ▼
 ┌─────────────────────────┐  VionaDispatchDecision { ok: true, toolName, toolInput, confidence }
 │ (1) INTENT ROUTER        │──────────────────────────────────────────────────────────────┐
 │ routeVionaDispatchIntent │  ok:false (llm_call_failed / not_valid_json / unknown_tool /  │
 │ () — EXISTING, REUSED    │  low_confidence)                                              │
 └──────────────────────────┘──────────────────────┐                                        │
                                                     ▼                                        │
                                       ┌─────────────────────────┐                           │
                                       │ REJECTED — fail-closed,  │                           │
                                       │ zero downstream calls    │                           │
                                       └───────────────────────────┘                           ▼
                                                                          ┌──────────────────────────────────┐
                                                                          │ (2) TOOL REGISTRY LOOKUP           │
                                                                          │ findVionaToolRegistryEntry() —     │
                                                                          │ EXISTING, REUSED, exact-match only │
                                                                          └──────────┬──────────────────────────┘
                                                                                     │ found
                                                                                     ▼
                                                            ┌───────────────────────────────────────────┐
                                                            │ (3) category check (NEW branch point)       │
                                                            │ 'viona_request_execution'  -> wrong_tool_    │
                                                            │   category, hard stop (this entrypoint is   │
                                                            │   scoped to content tools only)             │
                                                            │ 'content_generation_draft' -> continue       │
                                                            └──────────────────────┬───────────────────────┘
                                                                                   ▼
                                                ┌────────────────────────────────────────────────────┐
                                                │ (4) validateVionaToolInputAgainstSchema() — EXISTING,│
                                                │ REUSED. Missing/mistyped field -> hard stop.         │
                                                └──────────────────────────┬────────────────────────────┘
                                                                           ▼
                                        ┌───────────────────────────────────────────────────────────┐
                                        │ (5) generateVionaMarketingContentDraft() — NEW              │
                                        │ Calls createRoutedChatCompletion(COMPLEX_MARKETING) —       │
                                        │ EXISTING task type, reused. Persists MarketingPost           │
                                        │ { status: DRAFT } — EXISTING model, reused.                  │
                                        └──────────────────────────┬─────────────────────────────────┘
                                                                    ▼
                                        ┌───────────────────────────────────────────────────────────┐
                                        │ (6) Operator reviews in MarketingApprovalScreen.tsx —        │
                                        │ EXISTING, UNCHANGED. Approve+translate / publish (Facebook)  │
                                        │ / edit / delete — all EXISTING admin controller actions,      │
                                        │ UNCHANGED by this packet.                                     │
                                        └───────────────────────────────────────────────────────────────┘
```

**Steps (1), (2), (4), and (6) are byte-for-byte existing, unmodified code.** The only genuinely new
runtime code is step (3)'s category branch and step (5)'s narrow generator function.

---

## 5. Error handling

| Failure mode | Detected at | Result |
| --- | --- | --- |
| LLM call itself fails/times out | Step (1), existing | `ok: false, reason: 'llm_call_failed'` — zero downstream calls |
| LLM response not valid JSON | Step (1), existing | `ok: false, reason: 'response_not_valid_json'` — zero downstream calls |
| LLM invents an unregistered `toolName` | Step (2), existing | `ok: false, reason: 'unknown_tool'` — exact-match lookup only, never fuzzy |
| LLM correctly selects the **existing real-execution** tool (`twilio_test_sms_poc`) via this content-only entrypoint | Step (3), NEW | `ok: false, reason: 'wrong_tool_category'` — hard stop; this entrypoint never forwards a real-execution tool call anywhere, and never calls `dispatchVionaAutonomousRequest()` on the caller's behalf either |
| `toolInput` missing `topic`/`tone`/`targetLanguageCode`, or wrong primitive type | Step (4), existing | `ok: false, reason: 'tool_input_schema_invalid'` — zero downstream calls |
| LLM's self-reported `confidence` below the existing threshold | Step (1), existing | `ok: false, reason: 'low_confidence'` |
| The content-generation LLM call itself fails, times out, or returns an empty message | Step (5), NEW | `ok: false, reason: 'content_generation_failed'` — **no `MarketingPost` row is persisted** for a failed/empty generation (never persist a broken draft) |

**No rejection ever falls through to "post anyway," "guess a tool," or "publish directly."** Every
rejection is a hard stop with a typed reason, mirroring the existing Pack32/Pack30D-4 discipline.

---

## 6. Exact file allowlist — Pack32.1 implementation (future increment only, **NOT built in this packet**)

**Label:** `FUTURE IMPLEMENTATION ONLY — NOT BUILT IN THIS PLANNING PACKET`
**Precondition:** This planning packet merged and post-merge verified; a **separate**, explicit
operator phrase for implementation (not yet requested or provided).

| # | Path | Change type | Purpose |
| --- | --- | --- | --- |
| 1 | `src/lib/viona/dispatcher/vionaToolRegistry.ts` | **MODIFY (additive)** | Add `category` field to `VionaToolRegistryEntry` (§3.1), make `linkedActionId` optional, tag the existing `twilio_test_sms_poc` entry `category: 'viona_request_execution'`, add the new `marketing_content_generator` entry `category: 'content_generation_draft'`. `findVionaToolRegistryEntry()`/`validateVionaToolInputAgainstSchema()` unchanged. |
| 2 | `src/services/marketing/AIPostGenerator.ts` | **MODIFY (additive)** | Add `generateVionaMarketingContentDraft()` (§3.4) — new exported function only; every existing exported function (`fetchMarketingDailyStats`, `generateViGlobalFacebookPost`, `createMarketingDraftFromOpenAI`, `generateTranslations`) untouched. |
| 3 | `src/services/viona/vionaMarketingContentDispatchService.ts` | **NEW** | `dispatchVionaMarketingContentRequest()` (§3.3) — the new, sibling orchestrator. **Not wired to any HTTP route** in the first increment, mirroring Pack30D-4/Pack32's own precedent. |
| 4 | `scripts/test-viona-pack32-1-marketing-content-generator.ts` | **NEW** | Test cases per §7 |
| 5 | `docs/design/evidence/cursor-pack32-1-marketing-content-poc-implementation/README.md` | **NEW** | Evidence doc for that future implementation PR |

**No other files may be touched.** In particular: **no changes** to
`vionaAutonomousDispatchService.ts` (the existing VionaRequest/Twilio dispatch path stays
byte-for-byte unchanged), `vionaIntentRouter.ts`, `buildVionaExecutionPlan()`,
`vionaRequestEscrowHoldService.ts`, `vionaTwilioTestRealProviderAdapter.ts`,
`AdminMarketingController.ts`, `adminRoutes.ts`, `FacebookGraphAPI.ts`, `AutoPoster.ts`,
`MarketingApprovalScreen.tsx` or any other frontend/UI file, any new HTTP route/controller,
`prisma/schema.prisma` (**no migration of any kind — see §2**), `package.json` / lockfile (**no new
dependency of any kind**), or any live LLM/Facebook/Twilio credential.

| Area | Allowed in the future Pack32.1 implementation pack |
| --- | --- |
| New LangChain/LlamaIndex/agent-framework dependency | **NO — FORBIDDEN** |
| New `package.json` dependency of any kind | **NO** |
| Prisma schema change / migration of any kind | **NO — none needed, see §2** |
| Modification of `dispatchVionaAutonomousRequest()` / the existing Twilio dispatch path | **NO** |
| Any code path that calls `publishToFacebookPage()` other than the existing, unmodified admin "publish" action | **NO — FORBIDDEN, structurally** |
| Any code path that sets `MarketingPostStatus` to anything other than `DRAFT` | **NO — FORBIDDEN** for this tool's own write path |
| New HTTP route exposing the new dispatcher | **NO — service-layer only**, matching Pack30D-4/Pack32 |
| Real LLM API call in the implementation's own test suite | **NO — injected fake `callLlm` + injectable `generateDraft` only** |
| Multi-language array input on the tool's `inputSchema` | **NO — single `targetLanguageCode` per call, per §3.1** |

---

## 7. Required test plan — future implementation pack (not run in this packet)

| # | Test case | Category | Expected outcome |
| --- | --- | --- | --- |
| 1 | Mock intent-classification response: valid `toolName: 'marketing_content_generator'`, valid `toolInput`, confidence above threshold; mock `generateDraft` returns generated text | Happy path | `dispatchVionaMarketingContentRequest()` returns `ok: true` with a `marketingPostId` and the generated `content` |
| 2 | Mock classification returns `toolName: 'send_real_stripe_charge'` (unregistered/hallucinated) | Hallucination | `ok: false, reason: 'unknown_tool'`; zero downstream calls |
| 3 | Mock classification correctly returns `toolName: 'twilio_test_sms_poc'` (a real, registered, but *wrong-category* tool for this entrypoint) | Category isolation (critical) | `ok: false, reason: 'wrong_tool_category'`; **verified by a spy that throws if `dispatchVionaAutonomousRequest()`/`executeVionaTwilioTestPocReal()`/any Pack31 function is ever invoked** — this entrypoint must never silently forward a real-execution tool call |
| 4 | Mock classification: valid tool, `toolInput` missing `topic` | Schema violation | `ok: false, reason: 'tool_input_schema_invalid'`; zero downstream calls |
| 5 | Mock classification: not valid JSON | Malformed response | `ok: false, reason: 'response_not_valid_json'` |
| 6 | Mock classification: valid shape, confidence below threshold | Low confidence | `ok: false, reason: 'low_confidence'` |
| 7 | Injected `callLlm` throws (simulated network/API error) at the classification step | Fail-closed | `ok: false, reason: 'llm_call_failed'`; never throws out of the function |
| 8 | Valid tool/input, but the injected `generateDraft` throws / returns an empty string | Generation failure (NEW) | `ok: false, reason: 'content_generation_failed'`; **verified that no `MarketingPost` row is created** for this case |
| 9 | Happy path (test 1), then assert against a fake Prisma client: exactly one `marketingPost.create()` call, with `data.status` either omitted or explicitly `'DRAFT'` — never `'PUBLISHED'`/`'REJECTED'` | Human-in-the-loop enforcement (critical) | Confirms §3.5 structurally, not just by convention |
| 10 | Source-scan: `vionaMarketingContentDispatchService.ts` and `AIPostGenerator.ts`'s new function never reference `publishToFacebookPage`, `FacebookGraphAPI`, or any HTTP client for a social platform | Separation of concerns (critical) | Confirms boundary #3 — no automated posting path exists in the new code at all |
| 11 | Existing Pack32 test suite (`scripts/test-viona-pack32-autonomous-dispatcher.ts`) — unmodified, re-run in full | Regression | **PASS unchanged** — the two-entry registry does not affect the existing `twilio_test_sms_poc` exact-match lookup or `dispatchVionaAutonomousRequest()` |
| 12 | Existing marketing test coverage (if any) / manual smoke of `AdminMarketingController` routes | Regression | **PASS unchanged** — no route/controller file is touched by this packet's implementation |
| 13 | Source-scan: no `langchain`/`llamaindex`/similar import; `package.json`/lockfile diff empty; `prisma/schema.prisma` diff empty | Dependency & schema isolation | Confirms §2 / §6 boundaries |
| 14 | `tsc --noEmit` / `npm run lint` | Quality gate | **PASS**, 0 errors |

---

## 8. Staged rollout ladder (Pack32.1)

| Step | Pack | Authorizes | Real execution / real posting |
| --- | --- | --- | --- |
| 1 | Pack32.1 planning (**THIS PACKET**) | Tool Registry expansion design, new sibling orchestrator design, category-isolation design, file allowlist, test plan | **NO — planning only** |
| 2 | Pack32.1 Kernel/Handoff sync | Docs-only record on master | NO |
| 3 | Pack32.1 implementation (future, separate PR, exact allowlist §6, own operator phrase) | New tool + new orchestrator + new generator function, all reusing existing infrastructure | **NO** — every test uses injected fakes; no real OpenAI call in the test suite |
| 4 | (Optional, future, separate, own phrase) Wire `dispatchVionaMarketingContentRequest()` to an actual internal-tool entrypoint (admin chat box / CLI script) | Lets a human operator actually trigger this by natural language instead of calling the service function directly in a test/script | Still **no** social posting — output is still always a `DRAFT` reviewed through the existing, unchanged admin screen |
| 5 | Any change to who/what can call `publishToFacebookPage()` | **Separate, future, explicitly-authorized packet only** — **not proposed, scheduled, or implied by this packet in any way** | Only if separately authorized |

---

## 9. Non-goals / forbidden scope

| Forbidden category | Status |
| --- | --- |
| Automated posting to any social platform from this new tool | **FORBIDDEN — always**, per operator boundary #3 |
| Prisma migration / schema change of any kind | **FORBIDDEN in this packet, and none is proposed for the future implementation either** — see §2 |
| Any real or mocked-live LLM API call | **FORBIDDEN in this packet** |
| New `package.json`/lockfile dependency | **FORBIDDEN — always** |
| Modification of `dispatchVionaAutonomousRequest()` / the existing Twilio dispatch path | **FORBIDDEN — always** |
| Modification of `AdminMarketingController.ts` / `adminRoutes.ts` / `FacebookGraphAPI.ts` / `MarketingApprovalScreen.tsx` | **FORBIDDEN — always** |
| New HTTP route | **FORBIDDEN in this packet, and none is proposed for the first implementation increment either** |
| Frontend/UI change | **FORBIDDEN — always**, the existing admin screen is reused as-is |
| Multi-language array input on the new tool | **FORBIDDEN — single `targetLanguageCode` per call only** |
| Production | **FORBIDDEN** |
| Secrets printed | **FORBIDDEN** |
| `.ts`/`.tsx` file change **in this packet** | **FORBIDDEN** — verified empty in §10 |

---

## 10. Drift Report (this packet)

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** (verified: `git diff --name-only` against `origin/master` for this branch contains only the files listed in §11) |
| `prisma/schema.prisma` diff | **EMPTY** — no schema change proposed at all, this packet or the future implementation |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| `AdminMarketingController.ts` / `adminRoutes.ts` / `FacebookGraphAPI.ts` diff | **EMPTY** |
| Real or mocked-live LLM / provider / social-platform network code | **NONE** |
| Secrets printed | **NONE** |
| Real execution / automated posting enabled | **NO** |
| Production authorized | **NO** |

---

## 11. Files changed (this packet)

| Action | Path |
| --- | --- |
| Created | `docs/internal-ops/VIONA_PACK32_1_MARKETING_CONTENT_POC_PLAN.md` (this document) |
| Created | `docs/design/evidence/cursor-pack32-1-marketing-content-poc-planning-packet/README.md` |

**No other file is touched by this packet.**

---

## 12. Explicit NO / YES assertions (this packet)

| Assertion | Value |
| --- | --- |
| Planning / design document written | **YES** |
| Existing `MarketingPost`/`AIPostGenerator.ts`/`AdminMarketingController.ts`/admin-UI infrastructure discovered and reused (not duplicated) | **YES — §2, §3.5** |
| Existing Pack32 Tool Registry + Intent Router reused, not rebuilt | **YES — §3.1, §3.2** |
| New tool never routes through Pack31 escrow / Pack30D `executeReal()` | **YES — §2.2, §3.3, by design** |
| Existing real-execution dispatch path (`dispatchVionaAutonomousRequest()`) modified | **NO — a new, sibling orchestrator is proposed instead, §3.3** |
| New Prisma migration proposed, this packet or future implementation | **NO — §2, §9** |
| Automated social-media posting designed or proposed in any form | **NO — explicitly forbidden, §3.5/§9** |
| Human-in-the-Loop enforced structurally (not just by convention) | **YES — §3.5, test case 9** |
| Exact file allowlist for future implementation | **YES — §6** |
| Test plan for future implementation | **YES — §7, 14 cases** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Real LLM/Facebook/Twilio call made | **NO** |
| Production | **NO** |
| Secrets printed | **NO** |
| Phrase `APPROVE_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING` provided and recorded | **YES** |
| Phrase authorizes implementation directly | **NO — planning only, per §1 and the ladder (§8)** |

---

## 13. Recommended next step

1. **Open PR** for this planning packet — docs-only; exactly the two files in §11.
2. **Merge and post-merge verify.**
3. **Docs-only Kernel/Handoff sync** — separate pack; record this planning packet on the canonical
   Kernel file (`docs/ai-context/VIONA_KERNEL_HANDOFF_FAST_SAFE_GLOBAL_MODE.md`).
4. Only then prepare a **separate Pack32.1 implementation pack** with exactly the file allowlist in
   §6, the test plan in §7, and its own, distinct operator phrase — implementing the Tool Registry
   `category` field, the new `marketing_content_generator` entry, the new sibling orchestrator, and
   the new generator function, using an **injected fake `callLlm`/`generateDraft`** in every test
   (never a real OpenAI call in the test suite), and reusing the existing admin approval screen and
   routes exactly as-is.
5. **Do not implement any part of §3/§6 from this packet.** Do not add any new `package.json`
   dependency. Do not touch `AdminMarketingController.ts`, `adminRoutes.ts`, or
   `FacebookGraphAPI.ts`.

Automated social-media posting from this new tool remains **FORBIDDEN in all future increments
described by this packet**. Real execution against live (billable) providers remains **BLOCKED**
(Pack30D-4's production hard-block, unchanged and unrelated to this packet). Production remains
**NOT AUTHORIZED**.

Evidence: `docs/design/evidence/cursor-pack32-1-marketing-content-poc-planning-packet/README.md`
