/**
 * Pack32 — Agentic Autonomous Dispatcher: Tool Registry (pure, no side effects).
 *
 * A small, fixed, LLM-facing companion to the existing, unmodified Pack26B UI action registry
 * (`vionaActionRegistry.ts`). That registry has no parameter schema and no handler pointer — it
 * documents *UI-facing* actions. This registry documents the narrower, distinct set of tools the
 * Viona Intent Router (`vionaIntentRouter.ts`) is allowed to propose calling, each one linked back
 * to an existing `actionId` for traceability, never a competing/duplicate action-ID system.
 *
 * Lookup is **exact-match only** — `findVionaToolRegistryEntry()` never does a fuzzy/"closest
 * name" match. This is the primary hallucination defense described in
 * docs/product/VIONA_PACK32_AUTONOMOUS_DISPATCHER_PLAN.md §3.3/§5: if the LLM's `toolName` is not
 * byte-for-byte one of the names below, the caller must treat it as `unknown_tool` and stop.
 *
 * Pack32.1 — Marketing Content Generator Tool Expansion (see
 * docs/internal-ops/VIONA_PACK32_1_MARKETING_CONTENT_POC_PLAN.md §3.1) adds the additive
 * `category` field below. `'viona_request_execution'` tools (the existing Twilio POC) flow through
 * `buildVionaExecutionPlan()` → Pack31 escrow → Pack30D-4 `executeReal()`, unchanged.
 * `'content_generation_draft'` tools (the new marketing generator) never touch that pipeline at
 * all — they are dispatched by a separate, sibling orchestrator
 * (`vionaMarketingContentDispatchService.ts`), never by `dispatchVionaAutonomousRequest()`.
 *
 * Implementation note / deliberate, documented deviation from the plan's illustrative code sketch:
 * the plan's §3.1 sketch showed `linkedActionId` becoming *optional* on the shared type. This
 * implementation keeps `linkedActionId: string` **required and unchanged** instead, specifically
 * so that `vionaAutonomousDispatchService.ts` (`dispatchVionaAutonomousRequest()`) — explicitly
 * forbidden from being modified by the plan's own file allowlist — never sees a type change to a
 * field it already reads as a plain, non-optional `string` (plan §6 allowlist table: "Modification
 * of `dispatchVionaAutonomousRequest()` / the existing Twilio dispatch path: NO"). The new
 * `content_generation_draft` entry instead uses an explicit, clearly-non-functional sentinel value
 * (`'n/a_content_generation_draft'`, never a real Pack26B action id) — see
 * `assertVionaToolRegistryLinkedActionIdsAreKnown()` below for the matching, additive integrity-check
 * change.
 *
 * No DB access, no network call, no LLM call — pure data + pure functions only.
 *
 * Pack34 — B2B Merchant Gateway (see docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §5)
 * adds one further, additive `category` value, `'merchant_read_only_query'`, plus an optional
 * `merchantScopedOnly` field, and 2 new, structurally read-only entries. Both new entries share
 * every existing safety property of this file (exact-match lookup, `requiresOperatorApproval:
 * true`) and are excluded from `assertVionaToolRegistryLinkedActionIdsAreKnown()`'s check for the
 * exact same reason the existing `'content_generation_draft'` entry already is (see that
 * function's own doc comment) — their `linkedActionId` is a traceability anchor only, not a
 * dispatch-time claim that this exact action id will be invoked. Neither new tool has an
 * `inputSchema` field or handler capable of any write side effect (no booking/order/stock
 * mutation) — see the plan §5.3 for why this increment is scoped to read-only tools only.
 */

import { isVionaActionKnown } from '../actions';

export type VionaToolRegistryInputFieldType = 'string' | 'number' | 'boolean';

/**
 * `'viona_request_execution'` — routes through the existing Pack31/Pack30D-4 real-provider
 * pipeline via `dispatchVionaAutonomousRequest()`. `'content_generation_draft'` — routes through
 * the separate, sibling `dispatchVionaMarketingContentRequest()` orchestrator (Pack32.1); never
 * touches Pack31 escrow or any real-provider `executeReal()` call, and always persists its output
 * as a `DRAFT`-status row awaiting human review, never auto-published anywhere.
 *
 * Pack34 — `'merchant_read_only_query'`: a merchant-scoped, structurally read-only tool (schedule
 * or inventory check). Never touches Pack31 escrow or any write path in this increment; a future,
 * separately-reviewed increment would be required before any *write*-capable merchant tool could
 * be added to this registry.
 */
export type VionaToolRegistryCategory =
  | 'viona_request_execution'
  | 'content_generation_draft'
  | 'merchant_read_only_query';

export type VionaToolRegistryEntry = Readonly<{
  /** Stable, exact-match key the LLM must reproduce verbatim. Never reused for a different tool. */
  name: string;
  /** Shown to the LLM verbatim in the classification prompt — must stay precise and narrow. */
  description: string;
  /** Additive, Pack32.1 — see module header. Determines which orchestrator may dispatch this tool. */
  category: VionaToolRegistryCategory;
  /**
   * Traceability link into the existing, unmodified Pack26B `VIONA_ACTION_REGISTRY`. Kept
   * required (unchanged type) for every entry — see module header for why. For
   * `'content_generation_draft'` entries this is a non-functional sentinel, never a real,
   * registered Pack26B action id, and never consumed by any eligibility/execution code.
   */
  linkedActionId: string;
  /** Minimal shape check only — deliberately not a full JSON-Schema library/dependency. */
  inputSchema: Readonly<Record<string, VionaToolRegistryInputFieldType>>;
  /**
   * Hard-coded `true` for every entry in Pack32 — see §3.4 of the plan. The Dispatcher itself
   * never grants operator approval or user consent; this field only documents that fact, it does
   * not (and structurally cannot) change the enforcement, which lives in the pre-existing,
   * unmodified `buildVionaExecutionPlan()` policy function.
   */
  requiresOperatorApproval: true;
  /**
   * Pack34, additive, optional. Omitted (`undefined`) preserves every existing entry's current
   * behavior exactly: visible to every dispatch call, regardless of merchant context. `true` =
   * a future dispatch call site must only consider this tool eligible when the resolved
   * `MerchantProfile.toolScope` (see `vionaMerchantProfileService.ts`) includes this entry's
   * `name` — enforced entirely by that future caller; this pure registry file never reaches into
   * a `MerchantProfile` itself.
   */
  merchantScopedOnly?: true;
}>;

/** Non-functional sentinel `linkedActionId` for `'content_generation_draft'` entries — see module header. */
export const VIONA_TOOL_REGISTRY_CONTENT_DRAFT_SENTINEL_ACTION_ID = 'n/a_content_generation_draft';

/**
 * Four entries: the existing Pack30D-4 Twilio Test-Credentials POC
 * (`category: 'viona_request_execution'`), the Pack32.1 marketing content generator
 * (`category: 'content_generation_draft'`), and 2 new Pack34 merchant-scoped, read-only query
 * tools (`category: 'merchant_read_only_query'`, `merchantScopedOnly: true`). Adding a
 * write-capable merchant tool, or any other new tool, is out of scope for this implementation
 * increment and requires its own, separate planning packet.
 */
export const VIONA_TOOL_REGISTRY: readonly VionaToolRegistryEntry[] = [
  {
    name: 'twilio_test_sms_poc',
    description:
      'Send exactly one SMS via Twilio Test Credentials (sandbox-only — never a real SMS, never a real handset, never a real cost). Use only when the user message clearly asks to send/test an SMS notification.',
    category: 'viona_request_execution',
    // Pack32.5 — Core System Integration Audit finding: this previously pointed at `live_ai.action`,
    // which is permanently hard-blocked at the Pack28 execution-integration-readiness layer
    // (`vionaExecutionIntegrationPolicy.ts`: `blocked_sensitive_integration`, "Live AI autonomy
    // blocked in Pack28") — meaning every real dispatch through this tool would have been denied
    // with `blocked_lane` at the very first plan-eligibility gate, regardless of feature flag,
    // operator approval, or user consent; `executeReal()` could never have been reached. No prior
    // Pack30D-4/Pack32 unit test caught this because each one faked away this exact layer (see
    // scripts/test-viona-pack32-5-core-integration-audit.ts, the first test to exercise the real,
    // unfaked `buildVionaExecutionPlan()` eligibility+readiness chain end-to-end). `request.assign`
    // is the same action id the original Pack32 planning packet (§4) used as its own worked
    // example, is Pack29-eligible, and is only `operator_review_planning_candidate` at the Pack28
    // layer (not blocked) — restoring the intended, already-designed data flow without loosening
    // any safety gate.
    linkedActionId: 'request.assign',
    inputSchema: { fromNumber: 'string', toNumber: 'string', body: 'string' },
    requiresOperatorApproval: true,
  },
  {
    name: 'marketing_content_generator',
    description:
      'Draft a short marketing/social-copy text for a given topic, tone, and target language. NEVER posts anywhere — always persists a DRAFT MarketingPost row awaiting human review in the existing admin approval screen. Use only when the user message clearly asks to draft/write marketing or social copy.',
    category: 'content_generation_draft',
    linkedActionId: VIONA_TOOL_REGISTRY_CONTENT_DRAFT_SENTINEL_ACTION_ID,
    inputSchema: { topic: 'string', tone: 'string', targetLanguageCode: 'string' },
    requiresOperatorApproval: true,
  },
  {
    name: 'merchant_schedule_availability_check',
    // Pack38 — B2B Intent Tuning: broadened (text-only, zero inputSchema change) to explicitly
    // cover "opening/business/operating hours" and "are you open [today/now]"-style phrasing —
    // the live-staging finding this pack fixes (docs/product/VIONA_PACK38_B2B_INTENT_TUNING_PLAN.md
    // §2) was a real customer message ("What are your opening hours today?") the model declined to
    // match because the description previously spoke ONLY of "open appointment slots in a date
    // range", never hours/open-status framing. Also adds an explicit, safe same-day fallback
    // instruction so the model never has to guess how to fill the still-unchanged
    // dateRangeStart/dateRangeEnd schema for a bare "today"/"now" question.
    description:
      "Read-only: check a merchant's own appointment/booking schedule for open slots in a given date range, OR answer a general opening/business/operating-hours question (e.g. \"what are your hours\", \"are you open today\", \"are you open now\"). Never creates, modifies, or cancels any booking. For a same-day/general-hours question with no explicit date range given, use today's date for both dateRangeStart and dateRangeEnd.",
    category: 'merchant_read_only_query',
    merchantScopedOnly: true,
    // Same traceability-anchor pattern as the existing entries above — no new Pack26B action id
    // is proposed by Pack34 (see docs/product/VIONA_PACK34_B2B_MERCHANT_GATEWAY_PLAN.md §5.2).
    linkedActionId: 'request.assign',
    inputSchema: { dateRangeStart: 'string', dateRangeEnd: 'string' },
    requiresOperatorApproval: true,
  },
  {
    name: 'merchant_inventory_stock_check',
    // Pack38 — B2B Intent Tuning: broadened (text-only, zero inputSchema change) with 2 additional
    // common real-world phrasings ("do you have X in stock", "is X available") alongside the
    // existing framing — same rationale as the sibling entry above.
    description:
      "Read-only: check a merchant's own inventory/stock count for a named item or SKU (e.g. \"do you have <item> in stock\", \"is <item> available\"). Never reserves, decrements, or modifies stock.",
    category: 'merchant_read_only_query',
    merchantScopedOnly: true,
    linkedActionId: 'request.assign',
    inputSchema: { itemName: 'string' },
    requiresOperatorApproval: true,
  },
] as const;

const VIONA_TOOL_REGISTRY_BY_NAME: Readonly<Record<string, VionaToolRegistryEntry>> = Object.freeze(
  Object.fromEntries(VIONA_TOOL_REGISTRY.map((entry) => [entry.name, entry])),
);

/** Exact-match lookup only — returns `null` for anything not byte-for-byte registered. */
export function findVionaToolRegistryEntry(name: string): VionaToolRegistryEntry | null {
  return VIONA_TOOL_REGISTRY_BY_NAME[name] ?? null;
}

export type VionaToolInputSchemaValidation =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; reason: 'missing_field' | 'wrong_type'; field: string }>;

/**
 * Validates a raw, untyped `toolInput` object against a registry entry's minimal schema. Pure,
 * synchronous. Any missing field or primitive-type mismatch is a hard stop — never coerced,
 * never defaulted.
 */
export function validateVionaToolInputAgainstSchema(
  entry: VionaToolRegistryEntry,
  toolInput: Readonly<Record<string, unknown>>,
): VionaToolInputSchemaValidation {
  for (const [field, expectedType] of Object.entries(entry.inputSchema)) {
    if (!(field in toolInput)) {
      return { ok: false, reason: 'missing_field', field };
    }
    if (typeof toolInput[field] !== expectedType) {
      return { ok: false, reason: 'wrong_type', field };
    }
  }
  return { ok: true };
}

/**
 * Startup-time (not import-time) integrity check confirming every `'viona_request_execution'`
 * entry's `linkedActionId` still resolves against the existing, unmodified Pack26B action
 * registry. Intended for use by the test suite / a CI guard script — never called automatically
 * on module load, so a temporary mismatch can never crash a running process.
 *
 * Pack32.1 — `'content_generation_draft'` entries are deliberately **excluded** from this check:
 * their `linkedActionId` is a documented, non-functional sentinel (module header), never a real
 * Pack26B action, so `isVionaActionKnown()` would always (correctly) return `false` for it.
 *
 * Pack34 — `'merchant_read_only_query'` entries are also excluded (same `!== 'viona_request_execution'`
 * guard, no change needed): their `linkedActionId` is a traceability anchor only (module header),
 * never a claim that this action id is what actually dispatches.
 */
export function assertVionaToolRegistryLinkedActionIdsAreKnown(): void {
  for (const entry of VIONA_TOOL_REGISTRY) {
    if (entry.category !== 'viona_request_execution') continue;
    if (!isVionaActionKnown(entry.linkedActionId)) {
      throw new Error(
        `Pack32 tool registry integrity error: tool "${entry.name}" links to unknown actionId "${entry.linkedActionId}".`,
      );
    }
  }
}
