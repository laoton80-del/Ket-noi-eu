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
 * No DB access, no network call, no LLM call — pure data + pure functions only.
 */

import { isVionaActionKnown } from '../actions';

export type VionaToolRegistryInputFieldType = 'string' | 'number' | 'boolean';

export type VionaToolRegistryEntry = Readonly<{
  /** Stable, exact-match key the LLM must reproduce verbatim. Never reused for a different tool. */
  name: string;
  /** Shown to the LLM verbatim in the classification prompt — must stay precise and narrow. */
  description: string;
  /** Traceability link into the existing, unmodified Pack26B `VIONA_ACTION_REGISTRY`. */
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

/**
 * Exactly one entry at launch — the existing Pack30D-4 Twilio Test-Credentials POC. Adding a
 * second tool is explicitly out of scope for this implementation increment (plan §9) and requires
 * its own, separate planning packet.
 */
export const VIONA_TOOL_REGISTRY: readonly VionaToolRegistryEntry[] = [
  {
    name: 'twilio_test_sms_poc',
    description:
      'Send exactly one SMS via Twilio Test Credentials (sandbox-only — never a real SMS, never a real handset, never a real cost). Use only when the user message clearly asks to send/test an SMS notification.',
    linkedActionId: 'live_ai.action',
    inputSchema: { fromNumber: 'string', toNumber: 'string', body: 'string' },
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
 * Startup-time (not import-time) integrity check confirming every `linkedActionId` in this
 * registry still resolves against the existing, unmodified Pack26B action registry. Intended for
 * use by the test suite / a CI guard script — never called automatically on module load, so a
 * temporary mismatch can never crash a running process.
 */
export function assertVionaToolRegistryLinkedActionIdsAreKnown(): void {
  for (const entry of VIONA_TOOL_REGISTRY) {
    if (!isVionaActionKnown(entry.linkedActionId)) {
      throw new Error(
        `Pack32 tool registry integrity error: tool "${entry.name}" links to unknown actionId "${entry.linkedActionId}".`,
      );
    }
  }
}
