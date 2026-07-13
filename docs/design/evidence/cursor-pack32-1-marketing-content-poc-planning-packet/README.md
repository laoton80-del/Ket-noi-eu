# Pack32.1 — Marketing Content Generator Tool Expansion: Planning Packet Evidence

**Packet ID:** `CURSOR_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING_DOCS_ONLY`
**Operator phrase:** `APPROVE_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING` — provided this
session, planning only.
**Source master:** `e39fd13` — PR #309 merged (Pack33 planning packet). Pack33 implementation
(PR #310) is open, unmerged, and unaffected by this packet.
**Branch:** `docs/pack32-1-marketing-content-poc-planning`

---

## 1. What this packet is

A docs-only design for a **second** Pack32 Tool Registry entry, `marketing_content_generator`,
framed by the operator explicitly as a **Tool Expansion of the existing Pack32 Dispatcher** — not a
new core-product feature — so as not to reopen the core-product roadmap freeze. See
`docs/internal-ops/VIONA_PACK32_1_MARKETING_CONTENT_POC_PLAN.md` for the full design.

---

## 2. Discovery this session (why the design reuses so much)

| Discovery | Implication for the design |
| --- | --- |
| `MarketingPost`/`MarketingTranslation`/`MarketingPostStatus` (`DRAFT`/`PUBLISHED`/`REJECTED`) already exist in `prisma/schema.prisma` | The "Execution Plan (Draft) awaiting Operator approval" data shape the operator required is **already built** — this design needs **zero new Prisma migration**, unlike Pack32's own planning packet |
| `AIPostGenerator.ts` already calls `createRoutedChatCompletion({ taskType: COMPLEX_MARKETING })` and persists `DRAFT` rows, with **no** wallet/escrow involvement | Confirms this tool class has no cost-gating precedent in this codebase — designed a **new dispatch category** (`content_generation_draft`) that never touches Pack31 escrow, distinct from the existing `viona_request_execution` category |
| `AdminMarketingController.ts` + `adminRoutes.ts` + `MarketingApprovalScreen.tsx` already implement a full review/approve-and-translate/publish/delete admin workflow, with `publishToFacebookPage()` as the **only** function anywhere that calls a live social API | The Human-in-the-Loop gate this packet needs is **already built and already wired** — zero new admin UI, zero new routes, and the design explicitly forbids touching `publishToFacebookPage()`'s call site |
| The existing Pack32 Tool Registry/Intent Router (`vionaToolRegistry.ts`/`vionaIntentRouter.ts`) has no concept of "tool category" | Added an additive `category` field (`'viona_request_execution'` \| `'content_generation_draft'`) so the exact-match lookup/schema-validation logic stays reused verbatim while the *orchestrator* can branch safely |
| The existing Pack32 orchestrator (`dispatchVionaAutonomousRequest()`) is wired specifically to the Pack31/Pack30D-4 pipeline | Designed a **new, sibling** orchestrator (`dispatchVionaMarketingContentRequest()`) instead of branching the existing, safety-critical function — zero regression risk to the already-shipped Twilio dispatch path |
| `VionaRequestAuditEvent.requestId` is a mandatory, non-nullable FK to `VionaRequest` | A marketing draft has no `VionaRequest` counterpart — confirmed this tool's activity should **not** be logged into that ledger; the existing `MarketingPost` row + `LlmApiUsageLog` (already logs every `COMPLEX_MARKETING` call) is the correct, already-existing trail |

---

## 3. Design highlights

- **Tool Registry expansion** (§3.1 of the plan): additive `category` field, `linkedActionId` made
  optional, new `marketing_content_generator` entry — the existing entry and existing lookup/schema
  functions are unchanged.
- **Category isolation as the primary safety property** (§3.3, §5, test case 3): the new
  orchestrator hard-stops with `wrong_tool_category` if it is ever handed a real-execution tool —
  it structurally cannot forward a call into the Pack31/Pack30D-4 pipeline.
- **No cost model, so no escrow** (§2.2): explicit, documented reasoning for why this tool class
  skips Pack31 entirely, consistent with the existing, unescrowed `AIPostGenerator.ts` precedent.
- **Human-in-the-Loop enforced structurally** (§3.5, test case 9): the new generator function only
  ever persists `status: DRAFT`; the one live-posting function in the repo
  (`publishToFacebookPage()`) is never touched or called by any new code in this design.
- **Zero Prisma migration** (§2, §9): the entire design reuses existing tables/enums — a first for
  this Pack29→32 planning lineage, every prior pack proposed at least one additive schema change.
- **File allowlist** (§6): 5 files for a future implementation increment — smaller than Pack32's own
  8-file allowlist, reflecting how much existing infrastructure this design reuses.
- **Test plan** (§7): 14 cases, including a dedicated category-isolation regression (test 3) and a
  dedicated "never persists a broken draft" case (test 8).

---

## 4. Drift Report

| Check | Result |
| --- | --- |
| `.ts` / `.tsx` file created or modified | **NONE — 0 files** |
| `prisma/schema.prisma` diff | **EMPTY** — no schema change proposed at all |
| `.env*` diff | **EMPTY** |
| `package.json` / lockfile diff | **EMPTY** |
| New route / controller | **NONE** |
| `AdminMarketingController.ts` / `adminRoutes.ts` / `FacebookGraphAPI.ts` diff | **EMPTY** |
| Real or mocked-live LLM/provider/social-platform network call | **NONE** |
| Secrets printed | **NONE** |
| Automated posting enabled | **NO** |
| Production authorized | **NO** |

---

## 5. Explicit NO / YES assertions

| Assertion | Value |
| --- | --- |
| Planning / design document written | **YES** |
| Existing marketing-draft + admin-approval infrastructure discovered and reused (not duplicated) | **YES** |
| Existing Pack32 Tool Registry + Intent Router reused, not rebuilt | **YES** |
| New tool routed through Pack31 escrow / Pack30D `executeReal()` | **NO — by design, §2.2** |
| Existing real-execution dispatch path modified | **NO — new sibling orchestrator instead** |
| New Prisma migration proposed | **NO** |
| Automated social-media posting designed or proposed | **NO** |
| Any `.ts`/`.tsx` file touched | **NO** |
| Real LLM/Facebook/Twilio call made | **NO** |
| Production | **NO** |
| Phrase `APPROVE_PACK32_1_MARKETING_CONTENT_GENERATOR_PLANNING` provided and recorded | **YES** |
| Phrase authorizes implementation directly | **NO — planning only** |

---

## 6. Recommended next step

1. Open a docs-only PR for this planning packet.
2. Merge and post-merge verify.
3. Docs-only Kernel/Handoff sync recording this packet.
4. A **separate** Pack32.1 implementation pack, with its own operator phrase, exact file allowlist
   (plan §6), and test plan (plan §7).

Automated social-media posting from this new tool remains **FORBIDDEN in all future increments**.
Real execution against live (billable) providers remains **BLOCKED** (unrelated Pack30D-4
hard-block, unchanged). Production remains **NOT AUTHORIZED**.
