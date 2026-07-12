# Pack32 — Agentic Autonomous Dispatcher: Planning Packet Evidence

**Packet ID:** `CURSOR_PACK32_AUTONOMOUS_DISPATCHER_PLANNING_DOCS_ONLY`
**Operator phrase:** `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_PLANNING` — provided this session,
planning only.
**Source master:** `20c6db4` — PR #305 merged (VIG→VIO terminology correction + Pack31 escrow
implementation; operator confirmed the Pack31 migration was run successfully against the real
database).
**Branch:** `docs/pack32-autonomous-dispatcher-planning`

---

## 1. What this packet is

A docs-only design for VIONA's first agentic layer: an **Intent Router** (one LLM classification
call, reusing the existing `createRoutedChatCompletion()` path — no new SDK, no LangChain/
LlamaIndex) plus a small **Tool Registry** (starts with exactly one entry, the existing Pack30D-4
Twilio POC), routed into the existing, byte-for-byte-unmodified Pack31→Pack30D pipeline
(`previewVionaExecutionPlanRealProviderPocRoute()`). See
`docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md` for the full design.

---

## 2. Discovery this session (why the design reuses so much)

| Discovery | Implication for the design |
| --- | --- |
| `createRoutedChatCompletion()` (`AIRouterService.ts`) is a real, already-shipped, cost-tracked OpenAI call path | Pack32 needs **zero** new LLM SDK/dependency — one new `LlmRouterTaskType` value is the only schema-adjacent change, and it is optional (§5.2 of the plan notes it could instead reuse `ROUTING_INQUIRY`) |
| `previewVionaExecutionPlanRealProviderPocRoute()` already implements the exact plan→hold→execute→settle chain the operator asked for | Pack32's only new code is *before* that function: classify intent, look up the tool, call it — the pipeline itself needs **zero** changes |
| `buildVionaExecutionPlan()` already denies with `missing_operator_approval`/`missing_user_consent` when those booleans aren't `true` | The Human-in-the-Loop Consent Principle (Kernel §16 Level 3) is enforced **for free** by this pre-existing function — Pack32's design (§3.4 of the plan) makes explicit that the Dispatcher must never set those booleans itself, so this existing guarantee is never weakened |
| `VIONA_ACTION_REGISTRY` (Pack26B) exists but is UI-facing only, no parameter schema, no handler pointer | Designed the Tool Registry as a **narrow, LLM-facing companion** that references an existing `linkedActionId` for traceability, rather than a competing/duplicate registry |
| No `toolRegistry`/`intentRouter`/agent-framework code exists anywhere in the repo today | Confirmed Pack32 is genuinely new scope, not a rename/duplicate of something already built |

---

## 3. Design highlights

- **Intent Router** (§3.1/§3.2 of the plan): one structured-JSON LLM call, pure validation
  function, injectable `callLlm` dependency (so tests never call OpenAI).
- **Tool Registry** (§3.3): exact-match lookup only — no fuzzy matching, no "closest tool" fallback
  — this is the primary hallucination defense.
- **Human-in-the-Loop enforcement** (§3.4): the Dispatcher's own confidence/rationale are never
  treated as approval or consent; the existing `buildVionaExecutionPlan()` gate is untouched and
  still requires a human-supplied `true` for both flags.
- **Hallucination/error fallback table** (§5 of the plan): six distinct failure modes, each a hard
  stop with its own typed reason and audit row — never a best-effort guess.
- **Connection flow** (§4): Dispatcher Decision → Tool Registry lookup → **existing**
  `buildVionaExecutionPlan()` → **existing** Pack31 hold → **existing** Pack30D-4 `executeReal()` →
  **existing** Pack31 settle/refund. Every downstream step is reused unmodified.
- **File allowlist** (§5.1): 8 files for a future implementation increment, explicitly forbidding
  any new `package.json` dependency and any change to the existing Pack30D/31/26B files themselves.
- **Test plan** (§6): 15 cases, including 6 distinct mock-LLM-response hallucination/error
  scenarios and 3 full happy/refund/insufficient-funds end-to-end cases using fakes only.

---

## 4. Drift Report

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** |
| `prisma/schema.prisma` diff | **EMPTY** |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| Real or mocked-live LLM/provider network call | **NONE** |
| Secrets printed | **NONE** |
| Real execution / real money movement enabled | **NO** |
| Production authorized | **NO** |

---

## 5. Explicit NO / YES assertions

| Assertion | Value |
| --- | --- |
| Planning / design document written | **YES** |
| Existing Pack30D-4/Pack31/Pack26B infrastructure discovered and reused (not duplicated) | **YES** |
| Intent Router designed | **YES** |
| Tool Registry designed | **YES** |
| Hallucination/error fallback designed | **YES** |
| Human-in-the-Loop Consent Principle explicitly enforced by design | **YES** |
| New LangChain/LlamaIndex/agent-framework dependency proposed | **NO** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Prisma migration run | **NO** |
| Real LLM/Twilio/Stripe call made | **NO** |
| Production | **NO** |
| Phrase `APPROVE_PACK32_AUTONOMOUS_DISPATCHER_PLANNING` provided and recorded | **YES** |
| Phrase authorizes implementation directly | **NO — planning only** |

---

## 6. Recommended next step

1. Open a docs-only PR for this planning packet.
2. Merge and post-merge verify.
3. Docs-only Kernel/Handoff sync recording this packet.
4. A **separate** Pack32 implementation pack, with its own operator phrase, exact file allowlist
   (plan §5.1), and test plan (plan §6).

Real execution against live (billable) providers remains **BLOCKED**. Production remains **NOT
AUTHORIZED**.
