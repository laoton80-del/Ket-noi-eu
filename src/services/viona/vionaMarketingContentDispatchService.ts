/**
 * Pack32.1 — Marketing Content Generator Tool Expansion: orchestrator (see
 * docs/internal-ops/VIONA_PACK32_1_MARKETING_CONTENT_POC_PLAN.md §3.3, §4).
 *
 * A **new, sibling** orchestrator to the existing Pack32 `dispatchVionaAutonomousRequest()`
 * (`vionaAutonomousDispatchService.ts`) — that function is never modified or called by this file.
 * This orchestrator is scoped *only* to `'content_generation_draft'` tools (currently exactly one:
 * `marketing_content_generator`) and structurally cannot route into the Pack31 escrow / Pack30D-4
 * `executeReal()` pipeline: it never imports, references, or calls
 * `buildVionaExecutionPlan()`/`holdVionaRequestExecutionCost()`/`executeVionaTwilioTestPocReal()`/
 * `settleVionaRequestExecutionHold()`/`previewVionaExecutionPlanRealProviderPocRoute()`.
 *
 * Flow: (1) `routeVionaDispatchIntent()` — the existing, unmodified Pack32 Intent Router,
 * reused verbatim, including its own exact-match Tool Registry lookup + input-schema validation
 * — → (2) a defensive re-check that the matched entry's `category` is `'content_generation_draft'`
 * (never `'viona_request_execution'` — see `wrong_tool_category` below, the primary
 * category-isolation safety property of this file) → (3) `generateVionaMarketingContentDraft()`
 * (Pack32.1, `AIPostGenerator.ts`) — the one and only new LLM-calling / DB-writing code this
 * packet adds.
 *
 * There is no `VionaRequest` backing a marketing-content dispatch (a draft is not tied to any
 * request), so `routeVionaDispatchIntent()` — whose input type requires a `requestId`/
 * `requestStatus` purely for prompt-context text — is called with fixed, documented sentinel
 * values (`VIONA_MARKETING_DISPATCH_SENTINEL_REQUEST_ID`/`..._STATUS` below), never a real
 * `VionaRequest` row. Those values are never persisted anywhere by this file.
 *
 * No audit-ledger write here, unlike Pack32's own orchestrator: `VionaRequestAuditEvent.requestId`
 * is a mandatory, non-nullable foreign key to a real `VionaRequest` row, which a marketing draft
 * never has — forcing a write there would mean fabricating a fake FK target, which this file does
 * not do. The durable trail for this tool is the existing `LlmApiUsageLog` (already written by
 * `createRoutedChatCompletion()` for every `COMPLEX_MARKETING` call) plus the persisted
 * `MarketingPost` row itself.
 *
 * Human-in-the-Loop (Level 3, Kernel §16): the only side effect this file can ever cause is
 * creating one `MarketingPost` row with `status: DRAFT` (`MarketingPostStatus.DRAFT` is that
 * model's own default). This file never imports `publishToFacebookPage()` or
 * `FacebookGraphAPI.ts`, and never sets any `MarketingPostStatus` other than the implicit `DRAFT`
 * default — a real publish requires the existing, unmodified, human-operated
 * `postMarketingPostPublish` admin controller action.
 *
 * Not wired to any HTTP route/controller in this increment — service-layer only, mirroring
 * Pack30D-4/Pack32's own scope decision.
 */

import {
  generateVionaMarketingContentDraft,
  type GenerateVionaMarketingContentDraftInput,
} from '../marketing/AIPostGenerator';
import { findVionaToolRegistryEntry } from '../../lib/viona/dispatcher/vionaToolRegistry';
import {
  routeVionaDispatchIntent,
  defaultVionaDispatchCallLlm,
  type VionaDispatchRejectionReason,
  type VionaIntentRouterCallLlm,
} from '../../lib/viona/dispatcher/vionaIntentRouter';

/** Purely descriptive prompt-context text — never a real `VionaRequest`, never persisted. */
export const VIONA_MARKETING_DISPATCH_SENTINEL_REQUEST_ID = 'n/a-marketing-content-generator';
export const VIONA_MARKETING_DISPATCH_SENTINEL_REQUEST_STATUS = 'n/a';

export type DispatchVionaMarketingContentRequestInput = Readonly<{
  /** The natural-language request/intent text the Intent Router must classify. */
  userMessage: string;
}>;

export type VionaMarketingContentDispatchRejectionReason =
  | VionaDispatchRejectionReason
  /** Intent Router matched a real, registered tool — but it is NOT a content-generation tool.
   *  Hard stop: this entrypoint must never forward a real-execution tool call anywhere. */
  | 'wrong_tool_category'
  /** The content-generation LLM call itself failed, timed out, or returned an empty message. */
  | 'content_generation_failed';

export type DispatchVionaMarketingContentRequestResult =
  | Readonly<{ ok: true; toolName: string; marketingPostId: string; content: string; confidence: number }>
  | Readonly<{ ok: false; reason: VionaMarketingContentDispatchRejectionReason }>
  | Readonly<{ ok: false; reason: 'invalid_input' }>;

export type VionaMarketingContentDispatchServiceDeps = Readonly<{
  callLlm?: VionaIntentRouterCallLlm;
  generateDraft?: (input: GenerateVionaMarketingContentDraftInput) => Promise<{ marketingPostId: string; content: string }>;
}>;

function isPlainStringInputSchemaValue(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Classifies a natural-language intent via the existing, unmodified Pack32 Intent Router, then —
 * only for a decision that matches a `'content_generation_draft'` tool — generates and persists a
 * `DRAFT` marketing post. Never throws; every failure path (including the injected `callLlm` or
 * `generateDraft` throwing) is converted into a typed `ok: false` result.
 */
export async function dispatchVionaMarketingContentRequest(
  input: DispatchVionaMarketingContentRequestInput,
  deps: VionaMarketingContentDispatchServiceDeps = {},
): Promise<DispatchVionaMarketingContentRequestResult> {
  const userMessage = input.userMessage.trim();
  if (userMessage.length === 0) {
    return { ok: false, reason: 'invalid_input' };
  }

  const callLlm = deps.callLlm ?? defaultVionaDispatchCallLlm;
  const generateDraft = deps.generateDraft ?? generateVionaMarketingContentDraft;

  const decision = await routeVionaDispatchIntent(
    {
      requestId: VIONA_MARKETING_DISPATCH_SENTINEL_REQUEST_ID,
      requestStatus: VIONA_MARKETING_DISPATCH_SENTINEL_REQUEST_STATUS,
      userMessage,
    },
    { callLlm },
  );

  if (!decision.ok) {
    return { ok: false, reason: decision.reason };
  }

  // Defensive re-check, mirroring `dispatchVionaAutonomousRequest()`'s own discipline: never trust
  // a prior async result's referential integrity blindly.
  const entry = findVionaToolRegistryEntry(decision.toolName);
  if (!entry) {
    return { ok: false, reason: 'unknown_tool' };
  }

  // The primary category-isolation safety property of this file: a real-execution tool must never
  // be forwarded anywhere by this content-only entrypoint, not even to the existing Pack32
  // orchestrator on the caller's behalf.
  if (entry.category !== 'content_generation_draft') {
    return { ok: false, reason: 'wrong_tool_category' };
  }

  const toolInput = decision.toolInput;
  const topic = toolInput['topic'];
  const tone = toolInput['tone'];
  const targetLanguageCode = toolInput['targetLanguageCode'];
  if (
    !isPlainStringInputSchemaValue(topic) ||
    !isPlainStringInputSchemaValue(tone) ||
    !isPlainStringInputSchemaValue(targetLanguageCode)
  ) {
    // Already validated once inside `routeVionaDispatchIntent()` against this exact entry's
    // `inputSchema` — this is a defensive, never-expected-to-trigger re-check, not a new gate.
    return { ok: false, reason: 'tool_input_schema_invalid' };
  }

  try {
    const draft = await generateDraft({ topic, tone, targetLanguageCode });
    return {
      ok: true,
      toolName: entry.name,
      marketingPostId: draft.marketingPostId,
      content: draft.content,
      confidence: decision.confidence,
    };
  } catch {
    return { ok: false, reason: 'content_generation_failed' };
  }
}
