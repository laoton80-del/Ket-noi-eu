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
 */

import { isVionaActionKnown } from '../actions';

export type VionaToolRegistryInputFieldType = 'string' | 'number' | 'boolean';

/**
 * `'viona_request_execution'` — routes through the existing Pack31/Pack30D-4 real-provider
 * pipeline via `dispatchVionaAutonomousRequest()`. `'content_generation_draft'` — routes through
 * the separate, sibling `dispatchVionaMarketingContentRequest()` orchestrator (Pack32.1); never
 * touches Pack31 escrow or any real-provider `executeReal()` call, and always persists its output
 * as a `DRAFT`-status row awaiting human review, never auto-published anywhere.
 */
export type VionaToolRegistryCategory = 'viona_request_execution' | 'content_generation_draft';

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
}>;

/** Non-functional sentinel `linkedActionId` for `'content_generation_draft'` entries — see module header. */
export const VIONA_TOOL_REGISTRY_CONTENT_DRAFT_SENTINEL_ACTION_ID = 'n/a_content_generation_draft';

/**
 * Two entries: the existing Pack30D-4 Twilio Test-Credentials POC
 * (`category: 'viona_request_execution'`), and the new Pack32.1 marketing content generator
 * (`category: 'content_generation_draft'`). Adding a third tool of either category is out of
 * scope for this implementation increment and requires its own, separate planning packet.
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
